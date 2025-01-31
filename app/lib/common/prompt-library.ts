import { getSystemPrompt } from './prompts/prompts';
import optimized from './prompts/optimized';

export interface PromptOptions {
  cwd: string;
  allowedHtmlElements: string[];
  modificationTagName: string;
}

export class PromptLibrary {
  static library: Record<
    string,
    {
      label: string;
      description: string;
      get: (options: PromptOptions) => string;
    }
  > = {
    default: {
      label: 'Mensaje predeterminado',
      description: 'Este es el mensaje predeterminado del sistema probado en batalla.',
      get: (options) => getSystemPrompt(options.cwd),
    },
    optimized: {
      label: 'Aviso optimizado (experimental)',
      description: 'Una versión experimental del mensaje para un uso menor del token',
      get: (options) => optimized(options),
    },
  };
  static getList() {
    return Object.entries(this.library).map(([key, value]) => {
      const { label, description } = value;
      return {
        id: key,
        label,
        description,
      };
    });
  }
  static getPropmtFromLibrary(promptId: string, options: PromptOptions) {
    const prompt = this.library[promptId];

    if (!prompt) {
      throw 'Mensaje ahora encontrado';
    }

    return this.library[promptId]?.get(options);
  }
}
