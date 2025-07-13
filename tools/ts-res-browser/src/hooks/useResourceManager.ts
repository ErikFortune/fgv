import { useState, useCallback } from 'react';
import { Result } from '@fgv/ts-utils';
import {
  ProcessedResources,
  TsResSystem,
  createTsResSystem,
  processImportedDirectory,
  processImportedFiles,
  createSimpleContext
} from '../utils/tsResIntegration';
import { ImportedDirectory, ImportedFile } from '../utils/fileImport';

export interface ResourceManagerState {
  isProcessing: boolean;
  processedResources: ProcessedResources | null;
  error: string | null;
  hasProcessedData: boolean;
}

export interface UseResourceManagerReturn {
  state: ResourceManagerState;
  actions: {
    processDirectory: (directory: ImportedDirectory) => Promise<void>;
    processFiles: (files: ImportedFile[]) => Promise<void>;
    clearError: () => void;
    reset: () => void;
    resolveResource: (resourceId: string, context?: Record<string, string>) => Promise<Result<any>>;
  };
}

const initialState: ResourceManagerState = {
  isProcessing: false,
  processedResources: null,
  error: null,
  hasProcessedData: false
};

export const useResourceManager = (): UseResourceManagerReturn => {
  const [state, setState] = useState<ResourceManagerState>(initialState);

  const processDirectory = useCallback(async (directory: ImportedDirectory) => {
    setState((prev) => ({ ...prev, isProcessing: true, error: null }));

    try {
      const result = processImportedDirectory(directory);

      if (result.isSuccess()) {
        setState((prev) => ({
          ...prev,
          isProcessing: false,
          processedResources: result.value,
          hasProcessedData: true
        }));
      } else {
        setState((prev) => ({
          ...prev,
          isProcessing: false,
          error: result.error
        }));
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isProcessing: false,
        error: `Unexpected error: ${error instanceof Error ? error.message : String(error)}`
      }));
    }
  }, []);

  const processFiles = useCallback(async (files: ImportedFile[]) => {
    setState((prev) => ({ ...prev, isProcessing: true, error: null }));

    try {
      const result = processImportedFiles(files);

      if (result.isSuccess()) {
        setState((prev) => ({
          ...prev,
          isProcessing: false,
          processedResources: result.value,
          hasProcessedData: true
        }));
      } else {
        setState((prev) => ({
          ...prev,
          isProcessing: false,
          error: result.error
        }));
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isProcessing: false,
        error: `Unexpected error: ${error instanceof Error ? error.message : String(error)}`
      }));
    }
  }, []);

  const resolveResource = useCallback(
    async (resourceId: string, context: Record<string, string> = {}): Promise<Result<any>> => {
      if (!state.processedResources) {
        return Result.fail('No processed resources available');
      }

      try {
        // Create context provider if context values are provided
        if (Object.keys(context).length > 0) {
          const contextResult = createSimpleContext(context, state.processedResources.system);
          if (contextResult.isFailure()) {
            return Result.fail(`Failed to create context: ${contextResult.error}`);
          }

          // Resolve resource with context
          return state.processedResources.resolver.resolve(resourceId as any, contextResult.value);
        } else {
          // Resolve resource without context (uses default/fallback)
          return state.processedResources.resolver.resolve(resourceId as any);
        }
      } catch (error) {
        return Result.fail(
          `Failed to resolve resource: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    },
    [state.processedResources]
  );

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
      processDirectory,
      processFiles,
      clearError,
      reset,
      resolveResource
    }
  };
};

export default useResourceManager;
