import { useState, useCallback } from 'react';
import { Result, succeed, fail, FileTree } from '@fgv/ts-utils';
import {
  ProcessedResources,
  processImportedDirectory,
  processImportedFiles,
  createSimpleContext
} from '../utils/tsResIntegration';
import { ImportedDirectory, ImportedFile } from '../utils/fileImport';
import { FileTreeConverter } from '../utils/fileTreeConverter';
import { Config } from '@fgv/ts-res';

export interface ResourceManagerState {
  isProcessing: boolean;
  processedResources: ProcessedResources | null;
  error: string | null;
  hasProcessedData: boolean;
  activeConfiguration: Config.Model.ISystemConfiguration | null;
}

export interface UseResourceManagerReturn {
  state: ResourceManagerState;
  actions: {
    processDirectory: (directory: ImportedDirectory) => Promise<void>;
    processFiles: (files: ImportedFile[]) => Promise<void>;
    processFileTree: (fileTree: FileTree.FileTree, rootPath?: string) => Promise<void>;
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
  activeConfiguration: null
};

export const useResourceManager = (): UseResourceManagerReturn => {
  const [state, setState] = useState<ResourceManagerState>(initialState);

  const processDirectory = useCallback(
    async (directory: ImportedDirectory) => {
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
              const result = processImportedDirectory(directory, state.activeConfiguration || undefined);
              console.log(
                '3. processImportedDirectory returned:',
                result.isSuccess() ? 'SUCCESS' : 'FAILURE'
              );

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
                console.error('4. Processing failed with error:', result.message);
                setState((prev) => ({
                  ...prev,
                  isProcessing: false,
                  error: result.message
                }));
                reject(new Error(result.message));
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
    },
    [state.activeConfiguration]
  );

  const processFiles = useCallback(
    async (files: ImportedFile[]) => {
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
              const result = processImportedFiles(files, state.activeConfiguration || undefined);
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
                console.error('4. Processing failed with error:', result.message);
                setState((prev) => ({
                  ...prev,
                  isProcessing: false,
                  error: result.message
                }));
                reject(new Error(result.message));
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
    },
    [state.activeConfiguration]
  );

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  const reset = useCallback(() => {
    console.log('Resetting resource manager state');
    setState(initialState);
  }, []);

  const resolveResource = useCallback(
    async (resourceId: string, context?: Record<string, string>): Promise<Result<any>> => {
      if (!state.processedResources?.resolver || !state.processedResources?.system) {
        return fail('No resolver available');
      }

      try {
        // First get the resource object from the resource manager
        const resourceResult = state.processedResources.system.resourceManager.getBuiltResource(resourceId);
        if (resourceResult.isFailure()) {
          return fail(`Resource not found: ${resourceId}`);
        }

        const resource = resourceResult.value;

        // If context is provided, we need to update the context provider
        // For now, we'll use the current resolver (this is a limitation)
        // TODO: Ideally we'd create a new resolver with the updated context
        if (context) {
          console.warn(
            `Context override not fully implemented for resolveResource. Using current resolver context.`
          );
        }

        // Use resolveComposedResourceValue to get the final composed JSON value
        return state.processedResources.resolver.resolveComposedResourceValue(resource);
      } catch (error) {
        return fail(`Failed to resolve resource: ${error instanceof Error ? error.message : String(error)}`);
      }
    },
    [state.processedResources]
  );

  const processFileTree = useCallback(
    async (
      fileTree: FileTree.FileTree,
      rootPath: string = '/',
      systemConfig?: Config.Model.ISystemConfiguration
    ) => {
      console.log('=== STARTING FILETREE PROCESSING ===');
      console.log('Root path:', rootPath);

      setState((prev) => ({ ...prev, isProcessing: true, error: null }));

      try {
        console.log('1. Converting FileTree to ImportedDirectory/Files...');

        const convertResult = FileTreeConverter.convertPath(fileTree, rootPath);
        if (convertResult.isFailure()) {
          setState((prev) => ({
            ...prev,
            isProcessing: false,
            error: `Failed to convert FileTree: ${convertResult.message}`
          }));
          return;
        }

        const converted = convertResult.value;
        console.log('2. FileTree converted successfully');

        // Process based on whether we got a directory or files
        if (Array.isArray(converted)) {
          // Got files
          console.log('3. Processing as files, count:', converted.length);

          // Use provided config or fall back to state config
          const configToUse = systemConfig || state.activeConfiguration || undefined;

          setState((prev) => ({ ...prev, isProcessing: true, error: null }));

          try {
            const result = processImportedFiles(converted, configToUse);
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
                error: result.message
              }));
            }
          } catch (error) {
            setState((prev) => ({
              ...prev,
              isProcessing: false,
              error: `Failed to process files: ${error instanceof Error ? error.message : String(error)}`
            }));
          }
        } else {
          // Got directory
          console.log('3. Processing as directory:', converted.name);

          // Use provided config or fall back to state config
          const configToUse = systemConfig || state.activeConfiguration || undefined;

          setState((prev) => ({ ...prev, isProcessing: true, error: null }));

          try {
            const result = processImportedDirectory(converted, configToUse);
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
                error: result.message
              }));
            }
          } catch (error) {
            setState((prev) => ({
              ...prev,
              isProcessing: false,
              error: `Failed to process directory: ${error instanceof Error ? error.message : String(error)}`
            }));
          }
        }

        console.log('4. processFileTree completed successfully');
      } catch (error) {
        console.error('=== FILETREE PROCESSING ERROR ===');
        console.error('Error:', error);
        setState((prev) => ({
          ...prev,
          isProcessing: false,
          error: `Unexpected error: ${error instanceof Error ? error.message : String(error)}`
        }));
      }
    },
    [state.activeConfiguration]
  );

  const applyConfiguration = useCallback((config: Config.Model.ISystemConfiguration) => {
    console.log('Applying configuration:', config.name || 'Unnamed configuration');
    setState((prev) => ({
      ...prev,
      activeConfiguration: config,
      // Clear processed resources when configuration changes
      processedResources: null,
      hasProcessedData: false,
      error: null
    }));
  }, []);

  const updateProcessedResources = useCallback((processedResources: ProcessedResources) => {
    console.log('Updating processed resources:', processedResources.summary.totalResources, 'resources');
    setState((prev) => ({
      ...prev,
      processedResources,
      hasProcessedData: true,
      error: null
    }));
  }, []);

  return {
    state,
    actions: {
      processDirectory,
      processFiles,
      processFileTree,
      clearError,
      reset,
      resolveResource,
      applyConfiguration,
      updateProcessedResources
    }
  };
};

export default useResourceManager;
