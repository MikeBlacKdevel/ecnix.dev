import React, { useState } from 'react';
import { useNavigate } from '@remix-run/react';
import Cookies from 'js-cookie';
import { toast } from 'react-toastify';
import { db, deleteById, getAll, setMessages } from '~/lib/persistence';
import { logStore } from '~/lib/stores/logs';
import { classNames } from '~/utils/classNames';
import type { Message } from 'ai';

// List of supported providers that can have API keys
const API_KEY_PROVIDERS = [
  'Anthropic',
  'OpenAI',
  'Google',
  'Groq',
  'HuggingFace',
  'OpenRouter',
  'Deepseek',
  'Mistral',
  'OpenAILike',
  'Together',
  'xAI',
  'Perplexity',
  'Cohere',
  'AzureOpenAI',
  'AmazonBedrock',
] as const;

interface ApiKeys {
  [key: string]: string;
}

export default function DataTab() {
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);

  const downloadAsJson = (data: any, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportAllChats = async () => {
    if (!db) {
      const error = new Error('La base de datos no está disponible');
      logStore.logError('Error al exportar los chats - DB no disponible', error);
      toast.error('La base de datos no está disponible');

      return;
    }

    try {
      const allChats = await getAll(db);
      const exportData = {
        chats: allChats,
        exportDate: new Date().toISOString(),
      };

      downloadAsJson(exportData, `all-chats-${new Date().toISOString()}.json`);
      logStore.logSystem('Los chats se exportaron correctamente', { count: allChats.length });
      toast.success('Los chats se exportaron correctamente');
    } catch (error) {
      logStore.logError('Error al exportar los chats', error);
      toast.error('Error al exportar los chats');
      console.error(error);
    }
  };

  const handleDeleteAllChats = async () => {
    const confirmDelete = window.confirm('¿Estás seguro de que deseas eliminar todos los chats? Esta acción no se puede deshacer.');

    if (!confirmDelete) {
      return;
    }

    if (!db) {
      const error = new Error('La base de datos no está disponible');
      logStore.logError('Error al exportar los chats - DB no disponible', error);
      toast.error('La base de datos no está disponible');

      return;
    }

    try {
      setIsDeleting(true);

      const allChats = await getAll(db);
      await Promise.all(allChats.map((chat) => deleteById(db!, chat.id)));
      logStore.logSystem('Todos los chats se eliminaron correctamente', { count: allChats.length });
      toast.success('Todos los chats se eliminaron correctamente');
      navigate('/', { replace: true });
    } catch (error) {
      logStore.logError('No se pudieron eliminar los chats', error);
      toast.error('No se pudieron eliminar los chats');
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportSettings = () => {
    const settings = {
      providers: Cookies.get('providers'),
      isDebugEnabled: Cookies.get('isDebugEnabled'),
      isEventLogsEnabled: Cookies.get('isEventLogsEnabled'),
      isLocalModelsEnabled: Cookies.get('isLocalModelsEnabled'),
      promptId: Cookies.get('promptId'),
      isLatestBranch: Cookies.get('isLatestBranch'),
      commitHash: Cookies.get('commitHash'),
      eventLogs: Cookies.get('eventLogs'),
      selectedModel: Cookies.get('selectedModel'),
      selectedProvider: Cookies.get('selectedProvider'),
      githubUsername: Cookies.get('githubUsername'),
      githubToken: Cookies.get('githubToken'),
      bolt_theme: localStorage.getItem('bolt_theme'),
    };

    downloadAsJson(settings, 'bolt-settings.json');
    toast.success('Configuración exportada correctamente');
  };

  const handleImportSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const settings = JSON.parse(e.target?.result as string);

        Object.entries(settings).forEach(([key, value]) => {
          if (key === 'bolt_theme') {
            if (value) {
              localStorage.setItem(key, value as string);
            }
          } else if (value) {
            Cookies.set(key, value as string);
          }
        });

        toast.success('La configuración se importó correctamente. Actualice la página para que los cambios surtan efecto.');
      } catch (error) {
        toast.error('No se pudo importar la configuración. Asegúrese de que el archivo sea un archivo JSON válido.');
        console.error('Error al importar la configuración:', error);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleExportApiKeyTemplate = () => {
    const template: ApiKeys = {};
    API_KEY_PROVIDERS.forEach((provider) => {
      template[`${provider}_API_KEY`] = '';
    });

    template.OPENAI_LIKE_API_BASE_URL = '';
    template.LMSTUDIO_API_BASE_URL = '';
    template.OLLAMA_API_BASE_URL = '';
    template.TOGETHER_API_BASE_URL = '';

    downloadAsJson(template, 'api-keys-template.json');
    toast.success('Plantilla de claves API exportada con éxito');
  };

  const handleImportApiKeys = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const apiKeys = JSON.parse(e.target?.result as string);
        let importedCount = 0;
        const consolidatedKeys: Record<string, string> = {};

        API_KEY_PROVIDERS.forEach((provider) => {
          const keyName = `${provider}_API_KEY`;

          if (apiKeys[keyName]) {
            consolidatedKeys[provider] = apiKeys[keyName];
            importedCount++;
          }
        });

        if (importedCount > 0) {
          // Store all API keys in a single cookie as JSON
          Cookies.set('apiKeys', JSON.stringify(consolidatedKeys));

          // Also set individual cookies for backward compatibility
          Object.entries(consolidatedKeys).forEach(([provider, key]) => {
            Cookies.set(`${provider}_API_KEY`, key);
          });

          toast.success(`Se importaron correctamente ${importedCount} claves API/URL. Actualizando la página para aplicar los cambios...`);

          // Reload the page after a short delay to allow the toast to be seen
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } else {
          toast.warn('No se encontraron claves API válidas en el archivo');
        }

        // Set base URLs if they exist
        ['OPENAI_LIKE_API_BASE_URL', 'LMSTUDIO_API_BASE_URL', 'OLLAMA_API_BASE_URL', 'TOGETHER_API_BASE_URL'].forEach(
          (baseUrl) => {
            if (apiKeys[baseUrl]) {
              Cookies.set(baseUrl, apiKeys[baseUrl]);
            }
          },
        );
      } catch (error) {
        toast.error('No se pudieron importar las claves API. Asegúrese de que el archivo sea un archivo JSON válido.');
        console.error('Error al importar claves API:', error);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const processChatData = (
    data: any,
  ): Array<{
    id: string;
    messages: Message[];
    description: string;
    urlId?: string;
  }> => {
    // Handle Bolt standard format (single chat)
    if (data.messages && Array.isArray(data.messages)) {
      const chatId = crypto.randomUUID();
      return [
        {
          id: chatId,
          messages: data.messages,
          description: data.description || 'Chat importado',
          urlId: chatId,
        },
      ];
    }

    // Handle Bolt export format (multiple chats)
    if (data.chats && Array.isArray(data.chats)) {
      return data.chats.map((chat: { id?: string; messages: Message[]; description?: string; urlId?: string }) => ({
        id: chat.id || crypto.randomUUID(),
        messages: chat.messages,
        description: chat.description || 'Chat importado',
        urlId: chat.urlId,
      }));
    }

    console.error('No se encontró ningún formato coincidente para:', data);
    throw new Error('Formato de chat no compatible');
  };

  const handleImportChats = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];

      if (!file || !db) {
        toast.error('Algo salió mal');
        return;
      }

      try {
        const content = await file.text();
        const data = JSON.parse(content);
        const chatsToImport = processChatData(data);

        for (const chat of chatsToImport) {
          await setMessages(db, chat.id, chat.messages, chat.urlId, chat.description);
        }

        logStore.logSystem('Chats importados exitosamente', { count: chatsToImport.length });
        toast.success(`Importado exitosamente ${chatsToImport.length} chat${chatsToImport.length > 1 ? 's' : ''}`);
        window.location.reload();
      } catch (error) {
        if (error instanceof Error) {
          logStore.logError('Error al importar chats:', error);
          toast.error('Error al importar chats: ' + error.message);
        } else {
          toast.error('Error al importar chats');
        }

        console.error(error);
      }
    };

    input.click();
  };

  return (
    <div className="p-4 bg-bolt-elements-bg-depth-2 border border-bolt-elements-borderColor rounded-lg mb-4">
      <div className="mb-6">
        <h3 className="text-lg font-medium text-bolt-elements-textPrimary mb-4">Gestión de datos</h3>
        <div className="space-y-8">
          <div className="flex flex-col gap-4">
            <div>
              <h4 className="text-bolt-elements-textPrimary mb-2">Historial de chat</h4>
              <p className="text-sm text-bolt-elements-textSecondary mb-4">Exporta o elimina todo tu historial de chat.</p>
              <div className="flex gap-4">
                <button
                  onClick={handleExportAllChats}
                  className="px-4 py-2 bg-bolt-elements-button-primary-background hover:bg-bolt-elements-button-primary-backgroundHover text-bolt-elements-textPrimary rounded-lg transition-colors"
                >
                  Exportar todos los chats
                </button>
                <button
                  onClick={handleImportChats}
                  className="px-4 py-2 bg-bolt-elements-button-primary-background hover:bg-bolt-elements-button-primary-backgroundHover text-bolt-elements-textPrimary rounded-lg transition-colors"
                >
                  Importar chats
                </button>
                <button
                  onClick={handleDeleteAllChats}
                  disabled={isDeleting}
                  className={classNames(
                    'px-4 py-2 bg-bolt-elements-button-danger-background hover:bg-bolt-elements-button-danger-backgroundHover text-bolt-elements-button-danger-text rounded-lg transition-colors',
                    isDeleting ? 'opacity-50 cursor-not-allowed' : '',
                  )}
                >
                  {isDeleting ? 'Borrando...' : 'Borrar todos los chats'}
                </button>
              </div>
            </div>

            <div>
              <h4 className="text-bolt-elements-textPrimary mb-2">Copia de seguridad de configuración</h4>
              <p className="text-sm text-bolt-elements-textSecondary mb-4">
              Exporte su configuración a un archivo JSON o importe la configuración desde un archivo previamente exportado.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={handleExportSettings}
                  className="px-4 py-2 bg-bolt-elements-button-primary-background hover:bg-bolt-elements-button-primary-backgroundHover text-bolt-elements-textPrimary rounded-lg transition-colors"
                >
                  Exportar configuraciones
                </button>
                <label className="px-4 py-2 bg-bolt-elements-button-primary-background hover:bg-bolt-elements-button-primary-backgroundHover text-bolt-elements-textPrimary rounded-lg transition-colors cursor-pointer">
                  Importar configuraciones
                  <input type="file" accept=".json" onChange={handleImportSettings} className="hidden" />
                </label>
              </div>
            </div>

            <div>
              <h4 className="text-bolt-elements-textPrimary mb-2">Gestión de claves API</h4>
              <p className="text-sm text-bolt-elements-textSecondary mb-4">
              Importe claves API desde un archivo JSON o descargue una plantilla para completar sus claves.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={handleExportApiKeyTemplate}
                  className="px-4 py-2 bg-bolt-elements-button-primary-background hover:bg-bolt-elements-button-primary-backgroundHover text-bolt-elements-textPrimary rounded-lg transition-colors"
                >
                  Descargar plantilla
                </button>
                <label className="px-4 py-2 bg-bolt-elements-button-primary-background hover:bg-bolt-elements-button-primary-backgroundHover text-bolt-elements-textPrimary rounded-lg transition-colors cursor-pointer">
                Importar claves API
                  <input type="file" accept=".json" onChange={handleImportApiKeys} className="hidden" />
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
