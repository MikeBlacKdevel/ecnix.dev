// Importaciones necesarias
import { type ActionFunctionArgs } from '@remix-run/cloudflare';
import { createDataStream } from 'ai';
import { MAX_RESPONSE_SEGMENTS, MAX_TOKENS } from '~/lib/.server/llm/constants';
import { CONTINUE_PROMPT } from '~/lib/common/prompts/prompts';
import { streamText, type Messages, type StreamingOptions } from '~/lib/.server/llm/stream-text';
import SwitchableStream from '~/lib/.server/llm/switchable-stream';
import type { IProviderSetting } from '~/types/model';
import { createScopedLogger } from '~/utils/logger';

// Función principal que se ejecuta al llamar a la acción
export async function action(args: ActionFunctionArgs) {
  return chatAction(args);
}

// Inicializa un logger con un identificador específico
const logger = createScopedLogger('api.chat');

// Función para analizar y decodificar cookies desde el encabezado HTTP
function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {};

  // Divide las cookies y las recorre para parsearlas
  const items = cookieHeader.split(';').map((cookie) => cookie.trim());

  items.forEach((item) => {
    const [name, ...rest] = item.split('=');

    if (name && rest) {
      const decodedName = decodeURIComponent(name.trim());
      const decodedValue = decodeURIComponent(rest.join('=').trim());
      cookies[decodedName] = decodedValue;
    }
  });

  return cookies;
}

// Función principal que maneja la lógica del chat
async function chatAction({ context, request }: ActionFunctionArgs) {
  // Extrae los datos necesarios del cuerpo de la solicitud
  const { messages, files, promptId, contextOptimization } = await request.json<{
    messages: Messages;
    files: any;
    promptId?: string;
    contextOptimization: boolean;
  }>();

  const cookieHeader = request.headers.get('Cookie');
  const apiKeys = JSON.parse(parseCookies(cookieHeader || '').apiKeys || '{}');
  const providerSettings: Record<string, IProviderSetting> = JSON.parse(
    parseCookies(cookieHeader || '').providers || '{}',
  );

  // Inicializa un flujo de datos conmutables
  const stream = new SwitchableStream();

  // Contador para rastrear el uso acumulado de tokens
  const cumulativeUsage = {
    completionTokens: 0,
    promptTokens: 0,
    totalTokens: 0,
  };

  try {
    const options: StreamingOptions = {
      toolChoice: 'none',
      onFinish: async ({ text: content, finishReason, usage }) => {
        logger.debug('usage', JSON.stringify(usage));

        if (usage) {
          cumulativeUsage.completionTokens += usage.completionTokens || 0;
          cumulativeUsage.promptTokens += usage.promptTokens || 0;
          cumulativeUsage.totalTokens += usage.totalTokens || 0;
        }

        // Si se completa el mensaje sin alcanzar la longitud máxima, escribe la anotación de uso
        if (finishReason !== 'length') {
          const encoder = new TextEncoder();
          const usageStream = createDataStream({
            async execute(dataStream) {
              dataStream.writeMessageAnnotation({
                type: 'usage',
                value: {
                  completionTokens: cumulativeUsage.completionTokens,
                  promptTokens: cumulativeUsage.promptTokens,
                  totalTokens: cumulativeUsage.totalTokens,
                },
              });
            },
            onError: (error: any) => `Error personalizado: ${error.message}`,
          }).pipeThrough(
            new TransformStream({
              transform: (chunk, controller) => {
                const str = typeof chunk === 'string' ? chunk : JSON.stringify(chunk);
                controller.enqueue(encoder.encode(str));
              },
            }),
          );
          await stream.switchSource(usageStream);
          await new Promise((resolve) => setTimeout(resolve, 0));
          stream.close();

          return;
        }

        // Manejo de límites de tokens y segmentos
        if (stream.switches >= MAX_RESPONSE_SEGMENTS) {
          throw Error('No se puede continuar el mensaje: Se alcanzaron los segmentos máximos');
        }

        const switchesLeft = MAX_RESPONSE_SEGMENTS - stream.switches;

        logger.info(`Se alcanzó el límite máximo de tokens (${MAX_TOKENS}): Continuando mensaje (${switchesLeft} cambios restantes)`);

        messages.push({ role: 'assistant', content });
        messages.push({ role: 'user', content: CONTINUE_PROMPT });

        const result = await streamText({
          messages,
          env: context.cloudflare.env,
          options,
          apiKeys,
          files,
          providerSettings,
          promptId,
          contextOptimization,
        });

        stream.switchSource(result.toDataStream());

        return;
      },
    };

    // Procesa la entrada inicial del chat
    const result = await streamText({
      messages,
      env: context.cloudflare.env,
      options,
      apiKeys,
      files,
      providerSettings,
      promptId,
      contextOptimization,
    });

    // Conecta la fuente de datos procesada al flujo de salida
    stream.switchSource(result.toDataStream());

    // Devuelve una respuesta de flujo
    return new Response(stream.readable, {
      status: 200,
      headers: {
        contentType: 'text/event-stream',
        connection: 'keep-alive',
      },
    });
  } catch (error: any) {
    // Manejo de errores
    logger.error(error);

    if (error.message?.includes('API key')) {
      throw new Response('Clave API inválida o ausente', {
        status: 401,
        statusText: 'No autorizado',
      });
    }

    throw new Response(null, {
      status: 500,
      statusText: 'Error interno del servidor',
    });
  }
}
