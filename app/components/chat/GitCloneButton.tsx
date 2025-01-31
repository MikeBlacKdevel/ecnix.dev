import ignore from 'ignore';
import { useGit } from '~/lib/hooks/useGit';
import type { Message } from 'ai';
import { detectProjectCommands, createCommandsMessage } from '~/utils/projectCommands';
import { generateId } from '~/utils/fileUtils';
import { useState } from 'react';
import { toast } from 'react-toastify';
import { LoadingOverlay } from '~/components/ui/LoadingOverlay';

// Patrones de archivos a ignorar
const IGNORE_PATTERNS = [
  'node_modules/**',
  '.git/**',
  '.github/**',
  '.vscode/**',
  '**/*.jpg',
  '**/*.jpeg',
  '**/*.png',
  'dist/**',
  'build/**',
  '.next/**',
  'coverage/**',
  '.cache/**',
  '.vscode/**',
  '.idea/**',
  '**/*.log',
  '**/.DS_Store',
  '**/npm-debug.log*',
  '**/yarn-debug.log*',
  '**/yarn-error.log*',
  '**/*lock.json',
  '**/*lock.yaml',
];

// Inicializamos el objeto 'ignore' con los patrones de archivos a ignorar
const ig = ignore().add(IGNORE_PATTERNS);

interface GitCloneButtonProps {
  className?: string;
  importChat?: (description: string, messages: Message[]) => Promise<void>;
}

export default function GitCloneButton({ importChat }: GitCloneButtonProps) {
  const { ready, gitClone } = useGit();
  const [loading, setLoading] = useState(false);

  const onClick = async (_e: any) => {
    if (!ready) {
      return;
    }

    // Pedimos la URL del repositorio al usuario
    const repoUrl = prompt('Ingresa la URL de Git');

    if (repoUrl) {
      setLoading(true);

      try {
        const { workdir, data } = await gitClone(repoUrl);

        if (importChat) {
          // Filtramos las rutas de archivos que no deben ser ignoradas
          const filePaths = Object.keys(data).filter((filePath) => !ig.ignores(filePath));
          console.log(filePaths);

          const textDecoder = new TextDecoder('utf-8');

          const fileContents = filePaths
            .map((filePath) => {
              const { data: content, encoding } = data[filePath];
              return {
                path: filePath,
                content:
                  encoding === 'utf8' ? content : content instanceof Uint8Array ? textDecoder.decode(content) : '',
              };
            })
            .filter((f) => f.content);

          const commands = await detectProjectCommands(fileContents);
          const commandsMessage = createCommandsMessage(commands);

          const filesMessage: Message = {
            role: 'assistant',
            content: `Clonando el repositorio ${repoUrl} en ${workdir}
<boltArtifact id="imported-files" title="Archivos clonados de Git" type="bundled">
${fileContents
  .map(
    (file) =>
      `<boltAction type="file" filePath="${file.path}">
${file.content}
</boltAction>`,
  )
  .join('\n')}
</boltArtifact>`,
            id: generateId(),
            createdAt: new Date(),
          };

          const messages = [filesMessage];

          if (commandsMessage) {
            messages.push(commandsMessage);
          }

          // Importamos el chat con la descripción y los mensajes generados
          await importChat(`Proyecto Git:${repoUrl.split('/').slice(-1)[0]}`, messages);
        }
      } catch (error) {
        console.error('Error durante la importación:', error);
        toast.error('Error al importar el repositorio');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <>
      <button
        onClick={onClick}
        title="Clonar Repositorio Git"
        className="px-4 py-2 rounded-lg border border-bolt-elements-borderColor bg-bolt-elements-prompt-background text-bolt-elements-textPrimary hover:bg-bolt-elements-background-depth-3 transition-all flex items-center gap-2"
      >
        <span className="i-ph:git-branch" />
        Clonar Repositorio Git
      </button>
      {loading && <LoadingOverlay message="Por favor espere mientras clonamos el repositorio..." />}
    </>
  );
}
