import React, { useState } from 'react';
import type { Message } from 'ai';
import { toast } from 'react-toastify';
import { MAX_FILES, isBinaryFile, shouldIncludeFile } from '~/utils/fileUtils';
import { createChatFromFolder } from '~/utils/folderImport';
import { logStore } from '~/lib/stores/logs'; // Asumiendo que logStore se importa desde aquí

interface ImportFolderButtonProps {
  className?: string;
  importChat?: (description: string, messages: Message[]) => Promise<void>;
}

export const ImportFolderButton: React.FC<ImportFolderButtonProps> = ({ className, importChat }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const allFiles = Array.from(e.target.files || []);

    const filteredFiles = allFiles.filter((file) => {
      const path = file.webkitRelativePath.split('/').slice(1).join('/');
      const include = shouldIncludeFile(path);

      return include;
    });

    if (filteredFiles.length === 0) {
      const error = new Error('No se encontraron archivos válidos');
      logStore.logError('Error en la importación de archivos: no hay archivos válidos', error, { folderName: 'Carpeta desconocida' });
      toast.error('No se encontraron archivos en la carpeta seleccionada');

      return;
    }

    if (filteredFiles.length > MAX_FILES) {
      const error = new Error(`Demasiados archivos: ${filteredFiles.length}`);
      logStore.logError('Error en la importación de archivos: demasiados archivos', error, {
        fileCount: filteredFiles.length,
        maxFiles: MAX_FILES,
      });
      toast.error(
        `Esta carpeta contiene ${filteredFiles.length.toLocaleString()} archivos. Este producto aún no está optimizado para proyectos muy grandes. Seleccione una carpeta con menos de ${MAX_FILES.toLocaleString()} archivos.`,
      );

      return;
    }

    const folderName = filteredFiles[0]?.webkitRelativePath.split('/')[0] || 'Carpeta desconocida';
    setIsLoading(true);

    const loadingToast = toast.loading(`Importando ${folderName}...`);

    try {
      const fileChecks = await Promise.all(
        filteredFiles.map(async (file) => ({
          file,
          isBinary: await isBinaryFile(file),
        })),
      );

      const textFiles = fileChecks.filter((f) => !f.isBinary).map((f) => f.file);
      const binaryFilePaths = fileChecks
        .filter((f) => f.isBinary)
        .map((f) => f.file.webkitRelativePath.split('/').slice(1).join('/'));

      if (textFiles.length === 0) {
        const error = new Error('No se encontraron archivos de texto');
        logStore.logError('Error en la importación de archivos: no hay archivos de texto', error, { folderName });
        toast.error('No se encontraron archivos de texto en la carpeta seleccionada');

        return;
      }

      if (binaryFilePaths.length > 0) {
        logStore.logWarning(`Omitir archivos binarios durante la importación`, {
          folderName,
          binaryCount: binaryFilePaths.length,
        });
        toast.info(`Saltando ${binaryFilePaths.length} archivos binarios`);
      }

      const messages = await createChatFromFolder(textFiles, binaryFilePaths, folderName);

      if (importChat) {
        await importChat(folderName, [...messages]);
      }

      logStore.logSystem('Carpeta importada exitosamente', {
        folderName,
        textFileCount: textFiles.length,
        binaryFileCount: binaryFilePaths.length,
      });
      toast.success('Folder imported successfully');
    } catch (error) {
      logStore.logError('Error al importar la carpeta', error, { folderName });
      console.error('Error al importar la carpeta:', error);
      toast.error('Error al importar la carpeta');
    } finally {
      setIsLoading(false);
      toast.dismiss(loadingToast);
      e.target.value = ''; // Reset file input
    }
  };

  return (
    <>
      <input
        type="file"
        id="importación de carpeta"
        className="hidden"
        webkitdirectory=""
        directory=""
        onChange={handleFileChange}
        {...({} as any)}
      />
      <button
        onClick={() => {
          const input = document.getElementById('importación de carpeta');
          input?.click();
        }}
        className={className}
        disabled={isLoading}
      >
        <div className="i-ph:upload-simple" />
        {isLoading ? 'Importando...' : 'Importar carpeta'}
      </button>
    </>
  );
};
