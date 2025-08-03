import { useState, useCallback } from 'react';
import { Result, succeed, fail } from '@fgv/ts-utils';
import { Bundle, Config } from '@fgv/ts-res';
import { ImportedFile } from '../utils/fileImport';
import { ProcessedResources, createProcessedResourcesFromManager } from '../utils/tsResIntegration';

export interface BundleLoadResult {
  processedResources: ProcessedResources;
  systemConfiguration: Config.Model.ISystemConfiguration;
  bundleMetadata: Bundle.IBundleMetadata;
}

export interface BundleProcessorState {
  isProcessing: boolean;
  loadedBundle: BundleLoadResult | null;
  error: string | null;
  hasLoadedBundle: boolean;
}

export interface UseBundleProcessorReturn {
  state: BundleProcessorState;
  actions: {
    processBundleFile: (file: ImportedFile) => Promise<Result<BundleLoadResult>>;
    clearError: () => void;
    reset: () => void;
  };
}

const initialState: BundleProcessorState = {
  isProcessing: false,
  loadedBundle: null,
  error: null,
  hasLoadedBundle: false
};

export const useBundleProcessor = (): UseBundleProcessorReturn => {
  const [state, setState] = useState<BundleProcessorState>(initialState);

  const processBundleFile = useCallback(async (file: ImportedFile): Promise<Result<BundleLoadResult>> => {
    console.log('=== STARTING BUNDLE PROCESSING ===');
    console.log('File:', file.name, 'Is bundle:', file.isBundleFile);

    if (!file.isBundleFile) {
      return fail('File is not a bundle file');
    }

    setState((prev) => ({ ...prev, isProcessing: true, error: null }));

    try {
      // Extract bundle components using the ts-res utilities
      const bundleComponentsResult = Bundle.BundleUtils.parseBundleFromJson(file.content);
      if (bundleComponentsResult.isFailure()) {
        setState((prev) => ({
          ...prev,
          isProcessing: false,
          error: `Failed to parse bundle: ${bundleComponentsResult.message}`
        }));
        return fail(`Failed to parse bundle: ${bundleComponentsResult.message}`);
      }

      const bundleComponents = bundleComponentsResult.value;
      console.log('Bundle components extracted successfully');

      // Create a resource manager from the bundle
      const bundleLoaderResult = Bundle.BundleLoader.createManagerFromBundle({
        bundle: {
          metadata: bundleComponents.metadata,
          config: bundleComponents.systemConfiguration.getConfig().orThrow(),
          compiledCollection: bundleComponents.compiledCollection
        }
      });

      if (bundleLoaderResult.isFailure()) {
        setState((prev) => ({
          ...prev,
          isProcessing: false,
          error: `Failed to create resource manager from bundle: ${bundleLoaderResult.message}`
        }));
        return fail(`Failed to create resource manager from bundle: ${bundleLoaderResult.message}`);
      }

      const resourceManager = bundleLoaderResult.value;
      console.log('Resource manager created from bundle');

      // Create ProcessedResources from the loaded manager
      const processedResourcesResult = createProcessedResourcesFromManager(
        resourceManager,
        bundleComponents.systemConfiguration
      );

      if (processedResourcesResult.isFailure()) {
        setState((prev) => ({
          ...prev,
          isProcessing: false,
          error: `Failed to create processed resources: ${processedResourcesResult.message}`
        }));
        return fail(`Failed to create processed resources: ${processedResourcesResult.message}`);
      }

      const processedResources = processedResourcesResult.value;
      console.log('Processed resources created from bundle');

      const bundleLoadResult: BundleLoadResult = {
        processedResources,
        systemConfiguration: bundleComponents.systemConfiguration.getConfig().orThrow(),
        bundleMetadata: bundleComponents.metadata
      };

      setState((prev) => ({
        ...prev,
        isProcessing: false,
        loadedBundle: bundleLoadResult,
        hasLoadedBundle: true
      }));

      console.log('=== BUNDLE PROCESSING COMPLETED ===');
      return succeed(bundleLoadResult);
    } catch (error) {
      console.error('=== BUNDLE PROCESSING ERROR ===');
      console.error('Error:', error);
      const errorMessage = `Unexpected error processing bundle: ${
        error instanceof Error ? error.message : String(error)
      }`;
      setState((prev) => ({
        ...prev,
        isProcessing: false,
        error: errorMessage
      }));
      return fail(errorMessage);
    }
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  const reset = useCallback(() => {
    console.log('Resetting bundle processor state');
    setState(initialState);
  }, []);

  return {
    state,
    actions: {
      processBundleFile,
      clearError,
      reset
    }
  };
};

export default useBundleProcessor;
