import type { IProviderSetting } from '~/types/model';
import { BaseProvider } from './base-provider';
import type { ModelInfo, ProviderInfo } from './types';
import * as providers from './registry';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('LLMManager');

export class LLMManager {
  private static _instance: LLMManager;
  private _providers: Map<string, BaseProvider> = new Map();
  private _modelList: ModelInfo[] = [];
  private readonly _env: any = {};

  // Constructor privado para evitar la creación de instancias fuera de la clase
  private constructor(_env: Record<string, string>) {
    this._registerProvidersFromDirectory();
    this._env = _env;
  }

  // Método estático para obtener la instancia única de LLMManager
  static getInstance(env: Record<string, string> = {}): LLMManager {
    if (!LLMManager._instance) {
      LLMManager._instance = new LLMManager(env);
    }

    return LLMManager._instance;
  }

  // Getter para acceder al entorno
  get env() {
    return this._env;
  }

  // Registra los proveedores desde un directorio
  private async _registerProvidersFromDirectory() {
    try {
      /*
       * Importación dinámica de todos los archivos del directorio de proveedores
       * const providerModules = import.meta.glob('./providers/*.ts', { eager: true });
       */

      // Busca las clases exportadas que extienden de BaseProvider
      for (const exportedItem of Object.values(providers)) {
        if (typeof exportedItem === 'function' && exportedItem.prototype instanceof BaseProvider) {
          const provider = new exportedItem();

          try {
            this.registerProvider(provider);
          } catch (error: any) {
            logger.warn('No se pudo registrar el proveedor: ', provider.name, 'error:', error.message);
          }
        }
      }
    } catch (error) {
      logger.error('Error al registrar los proveedores:', error);
    }
  }

  // Registra un proveedor en el sistema
  registerProvider(provider: BaseProvider) {
    if (this._providers.has(provider.name)) {
      logger.warn(`El proveedor ${provider.name} ya está registrado. Se omite.`);
      return;
    }

    logger.info('Registrando proveedor: ', provider.name);
    this._providers.set(provider.name, provider);
    this._modelList = [...this._modelList, ...provider.staticModels];
  }

  // Obtiene un proveedor por su nombre
  getProvider(name: string): BaseProvider | undefined {
    return this._providers.get(name);
  }

  // Obtiene todos los proveedores registrados
  getAllProviders(): BaseProvider[] {
    return Array.from(this._providers.values());
  }

  // Obtiene la lista de modelos
  getModelList(): ModelInfo[] {
    return this._modelList;
  }

  // Actualiza la lista de modelos
  async updateModelList(options: {
    apiKeys?: Record<string, string>;
    providerSettings?: Record<string, IProviderSetting>;
    serverEnv?: Record<string, string>;
  }): Promise<ModelInfo[]> {
    const { apiKeys, providerSettings, serverEnv } = options;

    let enabledProviders = Array.from(this._providers.values()).map((p) => p.name);

    if (providerSettings) {
      enabledProviders = enabledProviders.filter((p) => providerSettings[p].enabled);
    }

    // Obtiene los modelos dinámicos de todos los proveedores que los soportan
    const dynamicModels = await Promise.all(
      Array.from(this._providers.values())
        .filter((provider) => enabledProviders.includes(provider.name))
        .filter(
          (provider): provider is BaseProvider & Required<Pick<ProviderInfo, 'getDynamicModels'>> =>
            !!provider.getDynamicModels,
        )
        .map(async (provider) => {
          const cachedModels = provider.getModelsFromCache(options);

          if (cachedModels) {
            return cachedModels;
          }

          const dynamicModels = await provider
            .getDynamicModels(apiKeys, providerSettings?.[provider.name], serverEnv)
            .then((models) => {
              logger.info(`Guardando en caché ${models.length} modelos dinámicos para ${provider.name}`);
              provider.storeDynamicModels(options, models);

              return models;
            })
            .catch((err) => {
              logger.error(`Error al obtener modelos dinámicos de ${provider.name} :`, err);
              return [];
            });

          return dynamicModels;
        }),
    );

    // Combina los modelos estáticos y dinámicos
    const modelList = [
      ...dynamicModels.flat(),
      ...Array.from(this._providers.values()).flatMap((p) => p.staticModels || []),
    ];
    this._modelList = modelList;

    return modelList;
  }

  // Obtiene la lista de modelos estáticos
  getStaticModelList() {
    return [...this._providers.values()].flatMap((p) => p.staticModels || []);
  }

  // Obtiene los modelos de un proveedor específico
  async getModelListFromProvider(
    providerArg: BaseProvider,
    options: {
      apiKeys?: Record<string, string>;
      providerSettings?: Record<string, IProviderSetting>;
      serverEnv?: Record<string, string>;
    },
  ): Promise<ModelInfo[]> {
    const provider = this._providers.get(providerArg.name);

    if (!provider) {
      throw new Error(`Proveedor ${providerArg.name} no encontrado`);
    }

    const staticModels = provider.staticModels || [];

    if (!provider.getDynamicModels) {
      return staticModels;
    }

    const { apiKeys, providerSettings, serverEnv } = options;

    const cachedModels = provider.getModelsFromCache({
      apiKeys,
      providerSettings,
      serverEnv,
    });

    if (cachedModels) {
      logger.info(`Encontrados ${cachedModels.length} modelos en caché para ${provider.name}`);
      return [...cachedModels, ...staticModels];
    }

    logger.info(`Obteniendo modelos dinámicos para ${provider.name}`);

    const dynamicModels = await provider
      .getDynamicModels?.(apiKeys, providerSettings?.[provider.name], serverEnv)
      .then((models) => {
        logger.info(`Se obtuvieron ${models.length} modelos dinámicos para ${provider.name}`);
        provider.storeDynamicModels(options, models);

        return models;
      })
      .catch((err) => {
        logger.error(`Error al obtener modelos dinámicos de ${provider.name} :`, err);
        return [];
      });

    return [...dynamicModels, ...staticModels];
  }

  // Obtiene la lista de modelos estáticos de un proveedor específico
  getStaticModelListFromProvider(providerArg: BaseProvider) {
    const provider = this._providers.get(providerArg.name);

    if (!provider) {
      throw new Error(`Proveedor ${providerArg.name} no encontrado`);
    }

    return [...(provider.staticModels || [])];
  }

  // Obtiene el proveedor por defecto
  getDefaultProvider(): BaseProvider {
    const firstProvider = this._providers.values().next().value;

    if (!firstProvider) {
      throw new Error('No hay proveedores registrados');
    }

    return firstProvider;
  }
}
