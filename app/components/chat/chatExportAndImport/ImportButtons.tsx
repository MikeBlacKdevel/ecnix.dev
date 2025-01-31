import type { Message } from 'ai';
import { toast } from 'react-toastify';
import { ImportFolderButton } from '~/components/chat/ImportFolderButton';

type ChatData = {
  messages?: Message[]; // Formato estándar de Bolt
  description?: string; // Descripción opcional
};

export function ImportButtons(importChat: ((description: string, messages: Message[]) => Promise<void>) | undefined) {
  return (
    <div className="flex flex-col items-center justify-center w-auto">
      <input
        type="file"
        id="chat-import"
        className="hidden"
        accept=".json"
        onChange={async (e) => {
          const file = e.target.files?.[0];

          if (file && importChat) {
            try {
              const reader = new FileReader();

              reader.onload = async (e) => {
                try {
                  const content = e.target?.result as string;
                  const data = JSON.parse(content) as ChatData;

                  // Formato estándar
                  if (Array.isArray(data.messages)) {
                    await importChat(data.description || 'Chat importado', data.messages);
                    toast.success('Chat importado con éxito');

                    return;
                  }

                  toast.error('Formato de archivo de chat no válido');
                } catch (error: unknown) {
                  if (error instanceof Error) {
                    toast.error('Error al analizar el archivo de chat: ' + error.message);
                  } else {
                    toast.error('Error al analizar el archivo de chat');
                  }
                }
              };
              reader.onerror = () => toast.error('Error al leer el archivo de chat');
              reader.readAsText(file);
            } catch (error) {
              toast.error(error instanceof Error ? error.message : 'Error al importar el chat');
            }
            e.target.value = ''; // Restablecer la entrada del archivo
          } else {
            toast.error('Algo salió mal');
          }
        }}
      />
      <div className="flex flex-col items-center gap-4 max-w-2xl text-center">
        <div className="flex gap-2">
          <button
            onClick={() => {
              const input = document.getElementById('chat-import');
              input?.click();
            }}
            className="px-4 py-2 rounded-lg border border-bolt-elements-borderColor bg-bolt-elements-prompt-background text-bolt-elements-textPrimary hover:bg-bolt-elements-background-depth-3 transition-all flex items-center gap-2"
          >
            <div className="i-ph:upload-simple" />
            Importar Chat
          </button>
          <ImportFolderButton
            importChat={importChat}
            className="px-4 py-2 rounded-lg border border-bolt-elements-borderColor bg-bolt-elements-prompt-background text-bolt-elements-textPrimary hover:bg-bolt-elements-background-depth-3 transition-all flex items-center gap-2"
          />
        </div>
      </div>
    </div>
  );
}
