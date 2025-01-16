import React from 'react';
import { Switch } from '~/components/ui/Switch';
import { PromptLibrary } from '~/lib/common/prompt-library';
import { useSettings } from '~/lib/hooks/useSettings';

export default function FeaturesTab() {
  const {
    debug,
    enableDebugMode,
    isLocalModel,
    enableLocalModels,
    enableEventLogs,
    isLatestBranch,
    enableLatestBranch,
    promptId,
    setPromptId,
    autoSelectTemplate,
    setAutoSelectTemplate,
    enableContextOptimization,
    contextOptimizationEnabled,
  } = useSettings();

  const handleToggle = (enabled: boolean) => {
    enableDebugMode(enabled);
    enableEventLogs(enabled);
  };

  return (
    <div className="p-4 bg-bolt-elements-bg-depth-2 border border-bolt-elements-borderColor rounded-lg mb-4">
      <div className="mb-6">
        <h3 className="text-lg font-medium text-bolt-elements-textPrimary mb-4">Características opcionales</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-bolt-elements-textPrimary">Funciones de depuración</span>
            <Switch className="ml-auto" checked={debug} onCheckedChange={handleToggle} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-bolt-elements-textPrimary">Usar sucursal principal</span>
              <p className="text-xs text-bolt-elements-textTertiary">
              Buscar actualizaciones en la rama principal en lugar de la estable
              </p>
            </div>
            <Switch className="ml-auto" checked={isLatestBranch} onCheckedChange={enableLatestBranch} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-bolt-elements-textPrimary">Plantilla de código de selección automática</span>
              <p className="text-xs text-bolt-elements-textTertiary">
              Deje que Bolt seleccione la mejor plantilla de inicio para su proyecto.
              </p>
            </div>
            <Switch className="ml-auto" checked={autoSelectTemplate} onCheckedChange={setAutoSelectTemplate} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-bolt-elements-textPrimary">Deje que ecnix seleccione la mejor plantilla de inicio para su proyecto.</span>
              <p className="text-sm text-bolt-elements-textSecondary">
              Redacta el contenido del archivo desde el chat y coloca el contenido del archivo más reciente en el indicador del sistema.
              </p>
            </div>
            <Switch
              className="ml-auto"
              checked={contextOptimizationEnabled}
              onCheckedChange={enableContextOptimization}
            />
          </div>
        </div>
      </div>

      <div className="mb-6 border-t border-bolt-elements-borderColor pt-4">
        <h3 className="text-lg font-medium text-bolt-elements-textPrimary mb-4">Funciones experimentales</h3>
        <p className="text-sm text-bolt-elements-textSecondary mb-10">
        Descargo de responsabilidad: Las funciones experimentales pueden ser inestables y están sujetas a cambios.
        </p>
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <span className="text-bolt-elements-textPrimary">Proveedores experimentales</span>
            <Switch className="ml-auto" checked={isLocalModel} onCheckedChange={enableLocalModels} />
          </div>
          <p className="text-xs text-bolt-elements-textTertiary mb-4">
          Habilite proveedores experimentales como Ollama, LMStudio y OpenAILike.       </p>
        </div>
        <div className="flex items-start justify-between pt-4 mb-2 gap-2">
          <div className="flex-1 max-w-[200px]">
            <span className="text-bolt-elements-textPrimary">Biblioteca de mensajes</span>
            <p className="text-xs text-bolt-elements-textTertiary mb-4">
            Seleccione un mensaje de la biblioteca para usarlo como mensaje del sistema.
            </p>
          </div>
          <select
            value={promptId}
            onChange={(e) => setPromptId(e.target.value)}
            className="flex-1 p-2 ml-auto rounded-lg border border-bolt-elements-borderColor bg-bolt-elements-prompt-background text-bolt-elements-textPrimary focus:outline-none focus:ring-2 focus:ring-bolt-elements-focus transition-all text-sm min-w-[100px]"
          >
            {PromptLibrary.getList().map((x) => (
              <option key={x.id} value={x.id}>
                {x.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
