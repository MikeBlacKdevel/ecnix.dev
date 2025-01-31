// Importaciones necesarias
import { type ActionFunctionArgs } from '@remix-run/cloudflare';
import { streamText } from '~/lib/.server/llm/stream-text';
import { stripIndents } from '~/utils/stripIndent';
import type { IProviderSetting, ProviderInfo } from '~/types/model';

// Función principal que se ejecuta al llamar a la acción
export async function action(args: ActionFunctionArgs) {
  return enhancerAction(args);
}

// Función para analizar y decodificar cookies desde el encabezado HTTP
function parseCookies(cookieHeader: string) {
  const cookies: any = {};

  // Divide la cadena de cookies por punto y coma y espacios
  const items = cookieHeader.split(';').map((cookie) => cookie.trim());

  items.forEach((item) => {
    const [name, ...rest] = item.split('=');

    if (name && rest) {
      // Decodifica el nombre y el valor; une las partes del valor en caso de que contenga '='
      const decodedName = decodeURIComponent(name.trim());
      const decodedValue = decodeURIComponent(rest.join('=').trim());
      cookies[decodedName] = decodedValue;
    }
  });

  return cookies;
}

// Función principal que maneja la lógica del realce de mensajes
async function enhancerAction({ context, request }: ActionFunctionArgs) {
  // Extrae los datos necesarios del cuerpo de la solicitud
  const { message, model, provider } = await request.json<{
    message: string;
    model: string;
    provider: ProviderInfo;
    apiKeys?: Record<string, string>;
  }>();

  const { name: providerName } = provider;

  // Valida los campos 'model' y 'provider'
  if (!model || typeof model !== 'string') {
    throw new Response('Modelo inválido o ausente', {
      status: 400,
      statusText: 'Solicitud incorrecta',
    });
  }

  if (!providerName || typeof providerName !== 'string') {
    throw new Response('Proveedor inválido o ausente', {
      status: 400,
      statusText: 'Solicitud incorrecta',
    });
  }

  const cookieHeader = request.headers.get('Cookie');

  // Analiza el valor de las cookies (devuelve un objeto o null si no existen cookies)
  const apiKeys = JSON.parse(parseCookies(cookieHeader || '').apiKeys || '{}');
  const providerSettings: Record<string, IProviderSetting> = JSON.parse(
    parseCookies(cookieHeader || '').providers || '{}',
  );

  try {
    const result = await streamText({
      messages: [
        {
          role: 'user',
          content:
            `[Modelo: ${model}]\n\n[Proveedor: ${providerName}]\n\n` +
            stripIndents`
            Eres un ingeniero de prompts profesional especializado en diseñar instrucciones precisas y efectivas.
            Tu tarea es mejorar los prompts haciéndolos más específicos, claros y accionables.

            Quiero que mejores el prompt del usuario contenido entre las etiquetas \`<original_prompt>\`.

            Para prompts válidos:
            - Haz que las instrucciones sean explícitas y claras
            - Agrega contexto y restricciones relevantes
            - Elimina información redundante
            - Conserva la intención principal
            - Asegúrate de que el prompt sea autónomo
            - Usa un lenguaje profesional

            Para prompts inválidos o poco claros:
            - Proporciona orientación clara y profesional
            - Sé conciso y accionable
            - Mantén un tono constructivo y útil
            - Enfócate en lo que el usuario debe proporcionar
            - Usa una plantilla estándar para mantener consistencia

            IMPORTANTE: Tu respuesta debe contener SOLO el texto del prompt mejorado.
            No incluyas explicaciones, metadatos o etiquetas de envoltura.

            <original_prompt>
              ${message}
            </original_prompt>
          `,
        },
      ],
      env: context.cloudflare.env,
      apiKeys,
      providerSettings,
    });

    return new Response(result.textStream, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });
  } catch (error: unknown) {
    console.log(error);

    if (error instanceof Error && error.message?.includes('clave API')) {
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
