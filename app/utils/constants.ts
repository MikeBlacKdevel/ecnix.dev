import type { IProviderSetting } from '~/types/model';

import { LLMManager } from '~/lib/modules/llm/manager';
import type { ModelInfo } from '~/lib/modules/llm/types';
import type { Template } from '~/types/template';

export const WORK_DIR_NAME = 'project';
export const WORK_DIR = `/home/${WORK_DIR_NAME}`;
export const MODIFICATIONS_TAG_NAME = 'bolt_file_modifications';
export const MODEL_REGEX = /^\[Model: (.*?)\]\n\n/;
export const PROVIDER_REGEX = /\[Provider: (.*?)\]\n\n/;
export const DEFAULT_MODEL = 'claude-3-5-sonnet-latest';
export const PROMPT_COOKIE_KEY = 'cachedPrompt';

const llmManager = LLMManager.getInstance(import.meta.env);

export const PROVIDER_LIST = llmManager.getAllProviders();
export const DEFAULT_PROVIDER = llmManager.getDefaultProvider();

let MODEL_LIST = llmManager.getModelList();

const providerBaseUrlEnvKeys: Record<string, { baseUrlKey?: string; apiTokenKey?: string }> = {};
PROVIDER_LIST.forEach((provider) => {
  providerBaseUrlEnvKeys[provider.name] = {
    baseUrlKey: provider.config.baseUrlKey,
    apiTokenKey: provider.config.apiTokenKey,
  };
});

// Export the getModelList function using the manager
export async function getModelList(options: {
  apiKeys?: Record<string, string>;
  providerSettings?: Record<string, IProviderSetting>;
  serverEnv?: Record<string, string>;
}) {
  return await llmManager.updateModelList(options);
}

async function initializeModelList(options: {
  env?: Record<string, string>;
  providerSettings?: Record<string, IProviderSetting>;
  apiKeys?: Record<string, string>;
}): Promise<ModelInfo[]> {
  const { providerSettings, apiKeys, env } = options;
  const list = await getModelList({
    apiKeys,
    providerSettings,
    serverEnv: env,
  });
  MODEL_LIST = list || MODEL_LIST;

  return list;
}

// initializeModelList({})
export { initializeModelList, providerBaseUrlEnvKeys, MODEL_LIST };

// starter Templates

export const STARTER_TEMPLATES: Template[] = [
  {
    name: 'ecnix-astro-basic',
    label: 'Astro Basic',
    description: 'Plantilla de inicio Astro liviana para crear sitios web estáticos rápidos',
    githubRepo: 'thecodacus/bolt-astro-basic-template',
    tags: ['astro', 'blog', 'performance'],
    icon: 'i-bolt:astro',
  },
  {
    name: 'ecnix-nextjs-shadcn',
    label: 'Next.js with shadcn/ui',
    description: 'Plantilla fullstack de inicio Next.js integrada con componentes shadcn/ui y sistema de estilo',
    githubRepo: 'thecodacus/bolt-nextjs-shadcn-template',
    tags: ['nextjs', 'react', 'typescript', 'shadcn', 'tailwind'],
    icon: 'i-bolt:nextjs',
  },
  {
    name: 'ecnix-qwik-ts',
    label: 'Qwik TypeScript',
    description: 'Inicio del framework Qwik con TypeScript para crear aplicaciones reanudables',
    githubRepo: 'thecodacus/bolt-qwik-ts-template',
    tags: ['qwik', 'typescript', 'performance', 'resumable'],
    icon: 'i-bolt:qwik',
  },
  {
    name: 'ecnix-remix-ts',
    label: 'Remix TypeScript',
    description: 'Remix framework starter con TypeScript para aplicaciones web full-stack',
    githubRepo: 'thecodacus/bolt-remix-ts-template',
    tags: ['remix', 'typescript', 'fullstack', 'react'],
    icon: 'i-bolt:remix',
  },
  {
    name: 'ecnix-slidev',
    label: 'Slidev Presentation',
    description: 'Plantilla de inicio Slidev para crear presentaciones fáciles de usar para desarrolladores usando Markdown',
    githubRepo: 'thecodacus/bolt-slidev-template',
    tags: ['slidev', 'presentation', 'markdown'],
    icon: 'i-bolt:slidev',
  },
  {
    name: 'ecnix-sveltekit',
    label: 'SvelteKit',
    description: 'Plantilla de inicio SvelteKit para crear aplicaciones web rápidas y eficientes',
    githubRepo: 'bolt-sveltekit-template',
    tags: ['svelte', 'sveltekit', 'typescript'],
    icon: 'i-bolt:svelte',
  },
  {
    name: 'vanilla-vite',
    label: 'Vanilla + Vite',
    description: 'Plantilla de inicio minimalista de Vite para proyectos de JavaScript estándar',
    githubRepo: 'thecodacus/vanilla-vite-template',
    tags: ['vite', 'vanilla-js', 'minimal'],
    icon: 'i-bolt:vite',
  },
  {
    name: 'ecnix-vite-react',
    label: 'React + Vite + typescript',
    description: 'Plantilla de inicio de React desarrollada con Vite para una experiencia de desarrollo rápida',
    githubRepo: 'thecodacus/bolt-vite-react-ts-template',
    tags: ['react', 'vite', 'frontend'],
    icon: 'i-bolt:react',
  },
  {
    name: 'ecnix-vite-ts',
    label: 'Vite + TypeScript',
    description: 'Plantilla de inicio de Vite con configuración TypeScript para desarrollo seguro de tipos',
    githubRepo: 'thecodacus/bolt-vite-ts-template',
    tags: ['vite', 'typescript', 'minimal'],
    icon: 'i-bolt:typescript',
  },
  {
    name: 'ecnix-vue',
    label: 'Vue.js',
    description: 'Plantilla de inicio Vue.js con herramientas modernas y mejores prácticas',
    githubRepo: 'thecodacus/bolt-vue-template',
    tags: ['vue', 'typescript', 'frontend'],
    icon: 'i-bolt:vue',
  },
  {
    name: 'ecnix-angular',
    label: 'Angular Starter',
    description: 'Una plantilla de inicio Angular moderna con compatibilidad con TypeScript y configuración de mejores prácticas',
    githubRepo: 'thecodacus/bolt-angular-template',
    tags: ['angular', 'typescript', 'frontend', 'spa'],
    icon: 'i-bolt:angular',
  },
];

