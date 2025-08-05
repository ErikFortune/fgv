import { useState, useCallback } from 'react';
import { Result, succeed, fail } from '@fgv/ts-utils';
import { ResourceManagerState, ProcessedResources, ImportedDirectory, ImportedFile } from '../types';
import { Config, Bundle, Runtime } from '@fgv/ts-res';
import {
  processImportedFiles,
  processImportedDirectory,
  createSimpleContext
} from '../utils/tsResIntegration';

export interface UseResourceDataReturn {
  state: ResourceManagerState;
  actions: {
    processDirectory: (directory: ImportedDirectory) => Promise<void>;
    processFiles: (files: ImportedFile[]) => Promise<void>;
    processBundleFile: (bundle: Bundle.IBundle) => Promise<void>;
    clearError: () => void;
    reset: () => void;
    resolveResource: (resourceId: string, context?: Record<string, string>) => Promise<Result<any>>;
    applyConfiguration: (config: Config.Model.ISystemConfiguration) => void;
    updateProcessedResources: (processedResources: ProcessedResources) => void;
  };
}

const initialState: ResourceManagerState = {
  isProcessing: false,
  processedResources: null,
  error: null,
  hasProcessedData: false,
  activeConfiguration: null,
  isLoadedFromBundle: false,
  bundleMetadata: null
};

export function useResourceData(): UseResourceDataReturn {
  const [state, setState] = useState<ResourceManagerState>(initialState);

  const processDirectory = useCallback(
    async (directory: ImportedDirectory) => {
      setState((prev) => ({ ...prev, isProcessing: true, error: null }));

      try {
        const result = processImportedDirectory(directory, state.activeConfiguration || undefined);

        if (result.isSuccess()) {
          setState((prev) => ({
            ...prev,
            isProcessing: false,
            processedResources: result.value,
            hasProcessedData: true,
            isLoadedFromBundle: false,
            bundleMetadata: null
          }));
        } else {
          throw new Error(result.message);
        }
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isProcessing: false,
          error: error instanceof Error ? error.message : String(error)
        }));
      }
    },
    [state.activeConfiguration]
  );

  const processFiles = useCallback(
    async (files: ImportedFile[]) => {
      setState((prev) => ({ ...prev, isProcessing: true, error: null }));

      try {
        const result = processImportedFiles(files, state.activeConfiguration || undefined);

        if (result.isSuccess()) {
          setState((prev) => ({
            ...prev,
            isProcessing: false,
            processedResources: result.value,
            hasProcessedData: true,
            isLoadedFromBundle: false,
            bundleMetadata: null
          }));
        } else {
          throw new Error(result.message);
        }
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isProcessing: false,
          error: error instanceof Error ? error.message : String(error)
        }));
      }
    },
    [state.activeConfiguration]
  );

  const processBundleFile = useCallback(async (bundle: Bundle.IBundle) => {
    setState((prev) => ({ ...prev, isProcessing: true, error: null }));

    try {
      // For now, bundle processing is simplified - this would need actual bundle loading implementation
      // The working ts-res-browser has more complex bundle loading logic that we'd need to replicate
      throw new Error('Bundle processing not yet implemented in component library');
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isProcessing: false,
        error: error instanceof Error ? error.message : String(error)
      }));
    }
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  const resolveResource = useCallback(
    async (resourceId: string, context?: Record<string, string>): Promise<Result<any>> => {
      if (!state.processedResources?.system?.resourceManager) {
        return fail('No resources loaded');
      }

      try {
        // Get the resource from the resource manager
        const resourceResult = state.processedResources.system.resourceManager.getBuiltResource(resourceId);
        if (resourceResult.isFailure()) {
          return fail(`Resource not found: ${resourceId}`);
        }

        // For now, return the resource object itself
        // Full resolution with context would require more complex logic
        return succeed(resourceResult.value);
      } catch (error) {
        return fail(`Failed to resolve resource: ${error instanceof Error ? error.message : String(error)}`);
      }
    },
    [state.processedResources]
  );

  const applyConfiguration = useCallback((config: Config.Model.ISystemConfiguration) => {
    setState((prev) => ({ ...prev, activeConfiguration: config }));
  }, []);

  const updateProcessedResources = useCallback((processedResources: ProcessedResources) => {
    setState((prev) => ({
      ...prev,
      processedResources,
      hasProcessedData: true
    }));
  }, []);

  return {
    state,
    actions: {
      processDirectory,
      processFiles,
      processBundleFile,
      clearError,
      reset,
      resolveResource,
      applyConfiguration,
      updateProcessedResources
    }
  };
}
