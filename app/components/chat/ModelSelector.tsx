import type { ProviderInfo } from '~/types/model';
import { useEffect } from 'react';
import type { ModelInfo } from '~/lib/modules/llm/types';

interface ModelSelectorProps {
  model?: string;
  setModel?: (model: string) => void;
  provider?: ProviderInfo;
  setProvider?: (provider: ProviderInfo) => void;
  modelList: ModelInfo[];
  providerList: ProviderInfo[];
  apiKeys: Record<string, string>;
  modelLoading?: string;
}

export const ModelSelector = ({
  model,
  setModel,
  provider,
  setProvider,
  modelList,
  providerList,
  modelLoading,
}: ModelSelectorProps) => {
  // Cargar proveedores habilitados desde las cookies

  // Actualizar proveedores habilitados cuando las cookies cambian
  useEffect(() => {
    // Si el proveedor actual está deshabilitado, cambiar al primer proveedor habilitado
    if (providerList.length == 0) {
      return;
    }

    if (provider && !providerList.map((p) => p.name).includes(provider.name)) {
      const firstEnabledProvider = providerList[0];
      setProvider?.(firstEnabledProvider);

      // También actualizar el modelo al primero disponible para el nuevo proveedor
      const firstModel = modelList.find((m) => m.provider === firstEnabledProvider.name);

      if (firstModel) {
        setModel?.(firstModel.name);
      }
    }
  }, [providerList, provider, setProvider, modelList, setModel]);

  if (providerList.length === 0) {
    return (
      <div className="mb-2 p-4 rounded-lg border border-bolt-elements-borderColor bg-bolt-elements-prompt-background text-bolt-elements-textPrimary">
        <p className="text-center">
        Actualmente no hay ningún proveedor habilitado. Habilite al menos un proveedor en la configuración para comenzar a usar el
        chat.
        </p>
      </div>
    );
  }

  return (
    <div className="mb-2 flex gap-2 flex-col sm:flex-row">
      <select
        value={provider?.name ?? ''}
        onChange={(e) => {
          const newProvider = providerList.find((p: ProviderInfo) => p.name === e.target.value);

          if (newProvider && setProvider) {
            setProvider(newProvider);
          }

          const firstModel = [...modelList].find((m) => m.provider === e.target.value);

          if (firstModel && setModel) {
            setModel(firstModel.name);
          }
        }}
        className="flex-1 p-2 rounded-lg border border-bolt-elements-borderColor bg-bolt-elements-prompt-background text-bolt-elements-textPrimary focus:outline-none focus:ring-2 focus:ring-bolt-elements-focus transition-all"
      >
        {providerList.map((provider: ProviderInfo) => (
          <option key={provider.name} value={provider.name}>
            {provider.name}
          </option>
        ))}
      </select>
      <select
        key={provider?.name}
        value={model}
        onChange={(e) => setModel?.(e.target.value)}
        className="flex-1 p-2 rounded-lg border border-bolt-elements-borderColor bg-bolt-elements-prompt-background text-bolt-elements-textPrimary focus:outline-none focus:ring-2 focus:ring-bolt-elements-focus transition-all lg:max-w-[70%]"
        disabled={modelLoading === 'Todo' || modelLoading === provider?.name}
      >
        {modelLoading == 'Todo' || modelLoading == provider?.name ? (
          <option key={0} value="">
            Cargado...
          </option>
        ) : (
          [...modelList]
            .filter((e) => e.provider == provider?.name && e.name)
            .map((modelOption, index) => (
              <option key={index} value={modelOption.name}>
                {modelOption.label}
              </option>
            ))
        )}
      </select>
    </div>
  );
};
