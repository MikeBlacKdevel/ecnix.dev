import type { Message } from 'ai';
import React, { Fragment } from 'react';
import { classNames } from '~/utils/classNames'; // Función para aplicar clases dinámicamente
import { AssistantMessage } from './AssistantMessage'; // Componente para los mensajes del asistente
import { UserMessage } from './UserMessage'; // Componente para los mensajes del usuario
import { useLocation } from '@remix-run/react'; // Hook para obtener la ubicación actual
import { db, chatId } from '~/lib/persistence/useChatHistory'; // Funciones para manejar la persistencia del chat
import { forkChat } from '~/lib/persistence/db'; // Función para crear una bifurcación del chat
import { toast } from 'react-toastify'; // Función para mostrar notificaciones
import WithTooltip from '~/components/ui/Tooltip'; // Componente para mostrar tooltips

interface MessagesProps {
  id?: string; // ID opcional para el contenedor
  className?: string; // Clases adicionales para el contenedor
  isStreaming?: boolean; // Si el chat está en modo streaming (tiempo real)
  messages?: Message[]; // Array de mensajes a mostrar
}

export const Messages = React.forwardRef<HTMLDivElement, MessagesProps>((props: MessagesProps, ref) => {
  const { id, isStreaming = false, messages = [] } = props; // Desestructuración de props
  const location = useLocation(); // Obtiene la ubicación actual

  // Función para "rebobinar" el chat a un mensaje específico
  const handleRewind = (messageId: string) => {
    const searchParams = new URLSearchParams(location.search);
    searchParams.set('rewindTo', messageId); // Establece el parámetro 'rewindTo'
    window.location.search = searchParams.toString(); // Actualiza la URL
  };

  // Función para bifurcar el chat a partir de un mensaje específico
  const handleFork = async (messageId: string) => {
    try {
      if (!db || !chatId.get()) {
        toast.error('La persistencia del chat no está disponible'); // Muestra un error si la persistencia del chat no está disponible
        return;
      }

      const urlId = await forkChat(db, chatId.get()!, messageId); // Crea la bifurcación
      window.location.href = `/chat/${urlId}`; // Redirige al nuevo chat bifurcado
    } catch (error) {
      toast.error('Error al bifurcar el chat: ' + (error as Error).message); // Muestra un error si la bifurcación falla
    }
  };

  return (
    <div id={id} ref={ref} className={props.className}>
      {messages.length > 0
        ? messages.map((message, index) => {
            const { role, content, id: messageId, annotations } = message;
            const isUserMessage = role === 'user';
            const isFirst = index === 0;
            const isLast = index === messages.length - 1;
            const isHidden = annotations?.includes('hidden');

            if (isHidden) {
              return <Fragment key={index} />;
            }

            return (
              <div
                key={index}
                className={classNames('flex gap-4 p-6 w-full rounded-[calc(0.75rem-1px)]', {
                  'bg-bolt-elements-messages-background': isUserMessage || !isStreaming || (isStreaming && !isLast),
                  'bg-gradient-to-b from-bolt-elements-messages-background from-30% to-transparent':
                    isStreaming && isLast,
                  'mt-4': !isFirst,
                })}
              >
                {isUserMessage && (
                  <div className="flex items-center justify-center w-[34px] h-[34px] overflow-hidden bg-white text-gray-600 rounded-full shrink-0 self-start">
                    <div className="i-ph:user-fill text-xl"></div>
                  </div>
                )}
                <div className="grid grid-col-1 w-full">
                  {isUserMessage ? (
                    <UserMessage content={content} />
                  ) : (
                    <AssistantMessage content={content} annotations={message.annotations} />
                  )}
                </div>
                {!isUserMessage && (
                  <div className="flex gap-2 flex-col lg:flex-row">
                    {messageId && (
                      <WithTooltip tooltip="Regresar a este mensaje">
                        <button
                          onClick={() => handleRewind(messageId)}
                          key="i-ph:arrow-u-up-left"
                          className={classNames(
                            'i-ph:arrow-u-up-left',
                            'text-xl text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary transition-colors',
                          )}
                        />
                      </WithTooltip>
                    )}

                    <WithTooltip tooltip="Bifurcación del chat a partir de este mensaje">
                      <button
                        onClick={() => handleFork(messageId)}
                        key="i-ph:git-fork"
                        className={classNames(
                          'i-ph:git-fork',
                          'text-xl text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary transition-colors',
                        )}
                      />
                    </WithTooltip>
                  </div>
                )}
              </div>
            );
          })
        : null}
      {isStreaming && (
        <div className="text-center w-full text-bolt-elements-textSecondary i-svg-spinners:3-dots-fade text-4xl mt-4"></div>
      )}
    </div>
  );
});
