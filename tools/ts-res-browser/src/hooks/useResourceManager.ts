import { useState, useCallback } from 'react';
import { Result, succeed, fail } from '@fgv/ts-utils';
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
    console.log('=== STARTING DIRECTORY PROCESSING ===');
    console.log('Directory:', directory.name, 'Files:', directory.files?.length || 0);

    setState((prev) => ({ ...prev, isProcessing: true, error: null }));

    try {
      console.log('1. About to call processImportedDirectory...');

      // Use setTimeout to make this async and allow UI updates
      await new Promise<void>((resolve, reject) => {
        setTimeout(() => {
          try {
            console.log('2. Inside setTimeout, calling processImportedDirectory...');
            const result = processImportedDirectory(directory);
            console.log('3. processImportedDirectory returned:', result.isSuccess() ? 'SUCCESS' : 'FAILURE');

            if (result.isSuccess()) {
              console.log('4. Processing succeeded, setting state...');
              console.log('   Resource count:', result.value.summary.resourceIds.length);
              console.log('   Resource IDs:', result.value.summary.resourceIds);

              setState((prev) => ({
                ...prev,
                isProcessing: false,
                processedResources: result.value,
                hasProcessedData: true
              }));
              console.log('5. State updated successfully');
              resolve();
            } else {
              console.error('4. Processing failed with error:', result.error);
              setState((prev) => ({
                ...prev,
                isProcessing: false,
                error: result.error
              }));
              reject(new Error(result.error));
            }
          } catch (innerError) {
            console.error('4. Exception in setTimeout:', innerError);
            setState((prev) => ({
              ...prev,
              isProcessing: false,
              error: `Processing exception: ${
                innerError instanceof Error ? innerError.message : String(innerError)
              }`
            }));
            reject(innerError);
          }
        }, 100); // Small delay to allow UI update
      });

      console.log('6. processDirectory completed successfully');
    } catch (error) {
      console.error('=== DIRECTORY PROCESSING ERROR ===');
      console.error('Error:', error);
      setState((prev) => ({
        ...prev,
        isProcessing: false,
        error: `Unexpected error: ${error instanceof Error ? error.message : String(error)}`
      }));
    }
  }, []);

  const processFiles = useCallback(async (files: ImportedFile[]) => {
    console.log('=== STARTING FILES PROCESSING ===');
    console.log('Files count:', files.length);
    console.log(
      'Files:',
      files.map((f) => f.name)
    );

    setState((prev) => ({ ...prev, isProcessing: true, error: null }));

    try {
      console.log('1. About to call processImportedFiles...');

      // Use setTimeout to make this async and allow UI updates
      await new Promise<void>((resolve, reject) => {
        setTimeout(() => {
          try {
            console.log('2. Inside setTimeout, calling processImportedFiles...');
            const result = processImportedFiles(files);
            console.log('3. processImportedFiles returned:', result.isSuccess() ? 'SUCCESS' : 'FAILURE');

            if (result.isSuccess()) {
              console.log('4. Processing succeeded, setting state...');
              console.log('   Resource count:', result.value.summary.resourceIds.length);
              console.log('   Resource IDs:', result.value.summary.resourceIds);

              setState((prev) => ({
                ...prev,
                isProcessing: false,
                processedResources: result.value,
                hasProcessedData: true
              }));
              console.log('5. State updated successfully');
              resolve();
            } else {
              console.error('4. Processing failed with error:', result.error);
              setState((prev) => ({
                ...prev,
                isProcessing: false,
                error: result.error
              }));
              reject(new Error(result.error));
            }
          } catch (innerError) {
            console.error('4. Exception in setTimeout:', innerError);
            setState((prev) => ({
              ...prev,
              isProcessing: false,
              error: `Processing exception: ${
                innerError instanceof Error ? innerError.message : String(innerError)
              }`
            }));
            reject(innerError);
          }
        }, 100); // Small delay to allow UI update
      });

      console.log('6. processFiles completed successfully');
    } catch (error) {
      console.error('=== FILES PROCESSING ERROR ===');
      console.error('Error:', error);
      setState((prev) => ({
        ...prev,
        isProcessing: false,
        error: `Unexpected error: ${error instanceof Error ? error.message : String(error)}`
      }));
    }
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  const reset = useCallback(() => {
    console.log('Resetting resource manager state');
    setState(initialState);
  }, []);

  const resolveResource = useCallback(
    async (resourceId: string, context?: Record<string, string>): Promise<Result<any>> => {
      if (!state.processedResources?.resolver) {
        return fail('No resolver available');
      }

      try {
        const contextProvider = context
          ? createSimpleContext(context, state.processedResources.system)
          : null;

        if (contextProvider?.isFailure()) {
          return fail(`Failed to create context: ${contextProvider.error}`);
        }

        const resolveContext = contextProvider?.value || undefined;
        return await state.processedResources.resolver.resolve(resourceId, resolveContext);
      } catch (error) {
        return fail(`Failed to resolve resource: ${error instanceof Error ? error.message : String(error)}`);
      }
    },
    [state.processedResources]
  );

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
