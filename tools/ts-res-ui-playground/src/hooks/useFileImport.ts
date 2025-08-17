import { useState, useCallback } from 'react';
import { Result } from '@fgv/ts-utils';
import { ImportedDirectory, ImportedFile } from '../utils/fileImport';

export interface FileImportState {
  isLoading: boolean;
  importedDirectory: ImportedDirectory | null;
  importedFiles: ImportedFile[];
  error: string | null;
  hasImportedData: boolean;
}

export interface UseFileImportReturn {
  state: FileImportState;
  actions: {
    handleDirectoryImport: (directory: ImportedDirectory) => void;
    handleFilesImport: (files: ImportedFile[]) => void;
    handleError: (error: string) => void;
    clearError: () => void;
    reset: () => void;
  };
}

const initialState: FileImportState = {
  isLoading: false,
  importedDirectory: null,
  importedFiles: [],
  error: null,
  hasImportedData: false
};

export const useFileImport = (): UseFileImportReturn => {
  const [state, setState] = useState<FileImportState>(initialState);

  const handleDirectoryImport = useCallback((directory: ImportedDirectory) => {
    setState((prev) => ({
      ...prev,
      importedDirectory: directory,
      importedFiles: [], // Clear individual files when directory is imported
      error: null,
      hasImportedData: true
    }));
  }, []);

  const handleFilesImport = useCallback((files: ImportedFile[]) => {
    setState((prev) => ({
      ...prev,
      importedFiles: files,
      importedDirectory: null, // Clear directory when individual files are imported
      error: null,
      hasImportedData: true
    }));
  }, []);

  const handleError = useCallback((error: string) => {
    setState((prev) => ({
      ...prev,
      error,
      isLoading: false
    }));
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({
      ...prev,
      error: null
    }));
  }, []);

  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  return {
    state,
    actions: {
      handleDirectoryImport,
      handleFilesImport,
      handleError,
      clearError,
      reset
    }
  };
};

export default useFileImport;
