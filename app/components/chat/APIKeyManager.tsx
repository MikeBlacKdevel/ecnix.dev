import React, { useState, useEffect, useCallback } from 'react';
import { IconButton } from '~/components/ui/IconButton';
import type { ProviderInfo } from '~/types/model';
import Cookies from 'js-cookie';
import { providerBaseUrlEnvKeys } from '~/utils/constants';

interface APIKeyManagerProps {
  provider: ProviderInfo;
  apiKey: string;
  setApiKey: (key: string) => void;
  getApiKeyLink?: string;
  labelForGetApiKey?: string;
}

// Caché que almacena si la clave API del proveedor está configurada a través de una variable de entorno
const providerEnvKeyStatusCache: Record<string, boolean> = {};

const apiKeyMemoizeCache: { [k: string]: Record<string, string> } = {};

export function getApiKeysFromCookies() {
  const storedApiKeys = Cookies.get('apiKeys');
  let parsedKeys: Record<string, string> = {};

  if (storedApiKeys) {
    parsedKeys = apiKeyMemoizeCache[storedApiKeys];

    if (!parsedKeys) {
      parsedKeys = apiKeyMemoizeCache[storedApiKeys] = JSON.parse(storedApiKeys);
    }
  }

  return parsedKeys;
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export const APIKeyManager: React.FC<APIKeyManagerProps> = ({ provider, apiKey, setApiKey }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempKey, setTempKey] = useState(apiKey);
  const [isEnvKeySet, setIsEnvKeySet] = useState(false);

  // Restablece los estados y carga la clave guardada cuando cambia el proveedor
  useEffect(() => {
    // Cargar la clave API guardada desde las cookies para este proveedor
    const savedKeys = getApiKeysFromCookies();
    const savedKey = savedKeys[provider.name] || '';

    setTempKey(savedKey);
    setApiKey(savedKey);
    setIsEditing(false);
  }, [provider.name]);

  const checkEnvApiKey = useCallback(async () => {
    // Primero verifica la caché
    if (providerEnvKeyStatusCache[provider.name] !== undefined) {
      setIsEnvKeySet(providerEnvKeyStatusCache[provider.name]);
      return;
    }

    try {
      const response = await fetch(`/api/check-env-key?provider=${encodeURIComponent(provider.name)}`);
      const data = await response.json();
      const isSet = (data as { isSet: boolean }).isSet;

      // Cachea el resultado
      providerEnvKeyStatusCache[provider.name] = isSet;
      setIsEnvKeySet(isSet);
    } catch (error) {
      console.error('Error al verificar la clave API de entorno:', error);
      setIsEnvKeySet(false);
    }
  }, [provider.name]);

  useEffect(() => {
    checkEnvApiKey();
  }, [checkEnvApiKey]);

  const handleSave = () => {
    // Guardar en el estado del componente padre
    setApiKey(tempKey);

    // Guardar en las cookies
    const currentKeys = getApiKeysFromCookies();
    const newKeys = { ...currentKeys, [provider.name]: tempKey };
    Cookies.set('apiKeys', JSON.stringify(newKeys));

    setIsEditing(false);
  };

  return (
    <div className="flex items-center justify-between py-3 px-1">
      <div className="flex items-center gap-2 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-bolt-elements-textSecondary">{provider?.name} Clave API:</span>
          {!isEditing && (
            <div className="flex items-center gap-2">
              {isEnvKeySet ? (
                <>
                  <div className="i-ph:check-circle-fill text-green-500 w-4 h-4" />
                  <span className="text-xs text-green-500">
                  Establecer vía {providerBaseUrlEnvKeys[provider.name].apiTokenKey} Variable de entorno
                  </span>
                </>
              ) : apiKey ? (
                <>
                  <div className="i-ph:check-circle-fill text-green-500 w-4 h-4" />
                  <span className="text-xs text-green-500">Establecer vía UI</span>
                </>
              ) : (
                <>
                  <div className="i-ph:x-circle-fill text-red-500 w-4 h-4" />
                  <span className="text-xs text-red-500">No configurado (configúrelo mediante la interfaz de usuario o ENV_VAR)</span>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {isEditing && !isEnvKeySet ? (
          <div className="flex items-center gap-2">
            <input
              type="password"
              value={tempKey}
              placeholder="Ingrese la clave API"
              onChange={(e) => setTempKey(e.target.value)}
              className="w-[300px] px-3 py-1.5 text-sm rounded border border-bolt-elements-borderColor 
                        bg-bolt-elements-prompt-background text-bolt-elements-textPrimary 
                        focus:outline-none focus:ring-2 focus:ring-bolt-elements-focus"
            />
            <IconButton
              onClick={handleSave}
              title="Guardar clave API"
              className="bg-green-500/10 hover:bg-green-500/20 text-green-500"
            >
              <div className="i-ph:check w-4 h-4" />
            </IconButton>
            <IconButton
              onClick={() => setIsEditing(false)}
              title="Cancelar"
              className="bg-red-500/10 hover:bg-red-500/20 text-red-500"
            >
              <div className="i-ph:x w-4 h-4" />
            </IconButton>
          </div>
        ) : (
          <>
            {!isEnvKeySet && (
              <IconButton
                onClick={() => setIsEditing(true)}
                title="Editar clave API"
                className="bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-500"
              >
                <div className="i-ph:pencil-simple w-4 h-4" />
              </IconButton>
            )}
            {provider?.getApiKeyLink && !isEnvKeySet && (
              <IconButton
                onClick={() => window.open(provider?.getApiKeyLink)}
                title="Obtener clave API"
                className="bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-500 flex items-center gap-2"
              >
                <span className="text-xs whitespace-nowrap">{provider?.labelForGetApiKey || 'Obtener clave API'}</span>
                <div className={`${provider?.icon || 'i-ph:key'} w-4 h-4`} />
              </IconButton>
            )}
          </>
        )}
      </div>
    </div>
  );
};
