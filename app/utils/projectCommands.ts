import type { Message } from 'ai';
import { generateId } from './fileUtils';

export interface ProjectCommands {
  type: string;
  setupCommand: string;
  followupMessage: string;
}

interface FileContent {
  content: string;
  path: string;
}

export async function detectProjectCommands(files: FileContent[]): Promise<ProjectCommands> {
  const hasFile = (name: string) => files.some((f) => f.path.endsWith(name));

  if (hasFile('package.json')) {
    const packageJsonFile = files.find((f) => f.path.endsWith('package.json'));

    if (!packageJsonFile) {
      return { type: '', setupCommand: '', followupMessage: '' };
    }

    try {
      const packageJson = JSON.parse(packageJsonFile.content);
      const scripts = packageJson?.scripts || {};

      // Check for preferred commands in priority order
      const preferredCommands = ['dev', 'start', 'preview'];
      const availableCommand = preferredCommands.find((cmd) => scripts[cmd]);

      if (availableCommand) {
        return {
          type: 'Node.js',
          setupCommand: `npm install && npm run ${availableCommand}`,
          followupMessage: `Se encontró el script "${availableCommand}" en package.json. Se está ejecutando "npm run ${availableCommand}" después de la instalación.`,
        };
      }

      return {
        type: 'Node.js',
        setupCommand: 'npm install',
        followupMessage:
          '¿Quieres que inspeccione package.json para determinar los scripts disponibles para ejecutar este proyecto?',
      };
    } catch (error) {
      console.error('Error al analizar package.json:', error);
      return { type: '', setupCommand: '', followupMessage: '' };
    }
  }

  if (hasFile('index.html')) {
    return {
      type: 'Static',
      setupCommand: 'npx --yes serve',
      followupMessage: '',
    };
  }

  return { type: '', setupCommand: '', followupMessage: '' };
}

export function createCommandsMessage(commands: ProjectCommands): Message | null {
  if (!commands.setupCommand) {
    return null;
  }

  return {
    role: 'assistant',
    content: `
<boltArtifact id="project-setup" title="Configuración del proyecto">
<boltAction type="shell">
${commands.setupCommand}
</boltAction>
</boltArtifact>${commands.followupMessage ? `\n\n${commands.followupMessage}` : ''}`,
    id: generateId(),
    createdAt: new Date(),
  };
}
