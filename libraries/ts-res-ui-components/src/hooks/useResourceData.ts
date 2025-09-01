import { useState, useCallback } from 'react';
import { Result, succeed, fail } from '@fgv/ts-utils';
import {
  ResourceManagerState,
  ProcessedResources,
  ExtendedProcessedResources,
  ImportedDirectory,
  ImportedFile,
  JsonValue
} from '../types';
import {
  Config,
  Bundle,
  Runtime,
  Resources,
  Import,
  QualifierTypes,
  Qualifiers,
  ResourceTypes
} from '@fgv/ts-res';
import { processImportedFiles, processImportedDirectory } from '../utils/tsResIntegration';

/**
 * Parameters for the useResourceData hook.
 * Allows customization of type factories for extended functionality.
 *
 * @public
 */
export interface UseResourceDataParams {
  /** Optional qualifier type factory for creating custom qualifier types */
  qualifierTypeFactory?: Config.IConfigInitFactory<
    QualifierTypes.Config.IAnyQualifierTypeConfig,
    QualifierTypes.QualifierType
  >;
  /** Optional resource type factory for creating custom resource types */
  resourceTypeFactory?: Config.IConfigInitFactory<
    ResourceTypes.Config.IResourceTypeConfig,
    ResourceTypes.ResourceType
  >;
}

/**
 * Return type for the useResourceData hook.
 * Provides state and actions for managing ts-res data processing.
 *
 * @public
 */
export interface UseResourceDataReturn {
  /** Current state of the resource management system */
  state: ResourceManagerState;
  /** Available actions for processing and managing resources */
  actions: {
    /** Process an imported directory structure into a resource system */
    processDirectory: (directory: ImportedDirectory) => Promise<void>;
    /** Process a directory with an explicit configuration */
    processDirectoryWithConfig: (
      directory: ImportedDirectory,
      config: Config.Model.ISystemConfiguration
    ) => Promise<void>;
    /** Process an array of imported files into a resource system */
    processFiles: (files: ImportedFile[]) => Promise<void>;
    /** Process a pre-compiled bundle file */
    processBundleFile: (bundle: Bundle.IBundle) => Promise<void>;
    /** Clear any current error state */
    clearError: () => void;
    /** Reset the entire resource management state */
    reset: () => void;
    /** Resolve a specific resource with optional context */
    resolveResource: (resourceId: string, context?: Record<string, string>) => Promise<Result<JsonValue>>;
    /** Apply a new configuration to the current system */
    applyConfiguration: (config: Config.Model.ISystemConfiguration) => void;
    /** Update the processed resources state directly */
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

/**
 * React hook for managing ts-res resource data processing and state.
 *
 * Provides comprehensive functionality for:
 * - Importing and processing resource files and directories
 * - Loading and processing pre-compiled bundles
 * - Resource resolution with context
 * - Configuration management
 * - Error handling and state management
 *
 * @returns Object containing current state and available actions
 *
 * @example
 * ```typescript
 * const { state, actions } = useResourceData();
 *
 * // Process imported files
 * await actions.processFiles(importedFiles);
 *
 * // Resolve a resource with context
 * const result = await actions.resolveResource('my.resource', {
 *   language: 'en-US',
 *   environment: 'production'
 * });
 *
 * // Check processing state
 * if (state.isProcessing) {
 *   // Show loading UI
 * } else if (state.error) {
 *   // Show error message
 * } else if (state.processedResources) {
 *   // Use processed resources
 * }
 * ```
 *
 * @public
 */
export function useResourceData(params?: UseResourceDataParams): UseResourceDataReturn {
  const [state, setState] = useState<ResourceManagerState>(initialState);

  const processDirectory = useCallback(
    async (directory: ImportedDirectory) => {
      setState((prev) => ({ ...prev, isProcessing: true, error: null }));

      try {
        const result = processImportedDirectory(
          directory,
          state.activeConfiguration || undefined,
          params?.qualifierTypeFactory,
          params?.resourceTypeFactory
        );

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
    [state.activeConfiguration, params?.qualifierTypeFactory, params?.resourceTypeFactory]
  );

  const processDirectoryWithConfig = useCallback(
    async (directory: ImportedDirectory, config: Config.Model.ISystemConfiguration) => {
      setState((prev) => ({ ...prev, isProcessing: true, error: null, activeConfiguration: config }));

      try {
        const processedResources = processImportedDirectory(
          directory,
          config,
          params?.qualifierTypeFactory,
          params?.resourceTypeFactory
        ).orThrow();

        setState((prev) => ({
          ...prev,
          isProcessing: false,
          processedResources,
          hasProcessedData: true,
          isLoadedFromBundle: false,
          bundleMetadata: null,
          activeConfiguration: config
        }));
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isProcessing: false,
          error: error instanceof Error ? error.message : String(error)
        }));
      }
    },
    [params?.qualifierTypeFactory, params?.resourceTypeFactory]
  );

  const processFiles = useCallback(
    async (files: ImportedFile[]) => {
      setState((prev) => ({ ...prev, isProcessing: true, error: null }));

      try {
        const processedResources = processImportedFiles(
          files,
          state.activeConfiguration || undefined,
          params?.qualifierTypeFactory,
          params?.resourceTypeFactory
        ).orThrow();

        setState((prev) => ({
          ...prev,
          isProcessing: false,
          processedResources,
          hasProcessedData: true,
          isLoadedFromBundle: false,
          bundleMetadata: null
        }));
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isProcessing: false,
          error: error instanceof Error ? error.message : String(error)
        }));
      }
    },
    [state.activeConfiguration, params?.qualifierTypeFactory, params?.resourceTypeFactory]
  );

  const processBundleFile = useCallback(async (bundle: Bundle.IBundle) => {
    console.log('[Bundle Processing] Starting bundle processing...', bundle);
    setState((prev) => ({ ...prev, isProcessing: true, error: null }));

    try {
      console.log('[Bundle Processing] Attempting to extract bundle components...');

      // Extract bundle components (configuration and compiled collection)
      const componentsResult = Bundle.BundleUtils.extractBundleComponents(bundle);
      console.log(
        '[Bundle Processing] Component extraction result:',
        componentsResult.isSuccess() ? 'SUCCESS' : `FAILED: ${componentsResult.message}`
      );

      if (componentsResult.isFailure()) {
        throw new Error(`Failed to extract bundle components: ${componentsResult.message}`);
      }

      const { systemConfiguration, compiledCollection, metadata } = componentsResult.value;
      console.log('[Bundle Processing] Extracted components:', {
        hasSystemConfiguration: !!systemConfiguration,
        hasCompiledCollection: !!compiledCollection,
        hasMetadata: !!metadata,
        systemConfiguration: systemConfiguration
      });

      // Use BundleLoader to create a fully functional resource manager from the bundle
      console.log('[Bundle Processing] Using BundleLoader to create resource manager from bundle');

      const bundleManagerResult = Bundle.BundleLoader.createManagerFromBundle({
        bundle: bundle,
        skipChecksumVerification: true // Skip for now since we're in a browser environment
      });

      if (bundleManagerResult.isFailure()) {
        throw new Error(`Failed to create resource manager from bundle: ${bundleManagerResult.message}`);
      }

      // The bundle's IResourceManager contains all the resources and candidates
      // We'll use it directly for both UI and resolution
      const bundleResourceManager = bundleManagerResult.value;

      // Debug: Check what resources are in the original bundle manager
      console.log('[Bundle Processing] Original bundle manager resources:', {
        numResources: bundleResourceManager.numResources,
        numCandidates: bundleResourceManager.numCandidates,
        resourceIds: Array.from(bundleResourceManager.builtResources.keys())
      });

      // Convert the compiled collection to an editable ResourceManagerBuilder
      // using createFromCompiledResourceCollection for exact reconstruction
      const reconstructedBuilderResult =
        Resources.ResourceManagerBuilder.createFromCompiledResourceCollection(
          compiledCollection,
          systemConfiguration
        );
      if (reconstructedBuilderResult.isFailure()) {
        throw new Error(
          `Failed to reconstruct builder from compiled collection: ${reconstructedBuilderResult.message}`
        );
      }

      const editableResourceManager = reconstructedBuilderResult.value;
      console.log('[Bundle Processing] Normalized builder resources:', {
        numResources: editableResourceManager.resources.size,
        numCandidates: Array.from(editableResourceManager.getAllCandidates()).length,
        resourceIds: Array.from(editableResourceManager.resources.keys())
      });

      // Create the system using the normalized, editable resource manager
      const system = {
        qualifierTypes: systemConfiguration.qualifierTypes,
        qualifiers: systemConfiguration.qualifiers,
        resourceTypes: systemConfiguration.resourceTypes,
        resourceManager: editableResourceManager, // Now editable ResourceManagerBuilder
        importManager: Import.ImportManager.create({
          resources: Resources.ResourceManagerBuilder.create({
            qualifiers: systemConfiguration.qualifiers,
            resourceTypes: systemConfiguration.resourceTypes
          }).orThrow()
        }).orThrow(),
        contextQualifierProvider: Runtime.Context.ValidatingSimpleContextQualifierProvider.create({
          qualifiers: systemConfiguration.qualifiers
        }).orThrow()
      };

      // Extract configuration for UI display using the new getConfigurationJson method
      const qualifierTypesResult = Array.from(system.qualifierTypes.values()).map((qt) =>
        qt
          .getConfigurationJson()
          .onSuccess((jsonConfig) => QualifierTypes.Config.Convert.anyQualifierTypeConfig.convert(jsonConfig))
      );

      // Check if any qualifier type extraction failed
      const failedQualifierTypes = qualifierTypesResult.filter((result) => result.isFailure());
      if (failedQualifierTypes.length > 0) {
        throw new Error(
          `Failed to extract qualifier type configurations: ${failedQualifierTypes
            .map((r) => r.message)
            .join(', ')}`
        );
      }

      // Filter to only system qualifier types for UI compatibility
      const allQualifierTypes = qualifierTypesResult
        .map((result) => result.value)
        .filter((config): config is QualifierTypes.Config.IAnyQualifierTypeConfig => config !== undefined);
      const systemQualifierTypes = allQualifierTypes.filter(
        QualifierTypes.Config.isSystemQualifierTypeConfig
      );

      const configForStorage: Config.Model.ISystemConfiguration = {
        name: 'Bundle Configuration',
        description: metadata?.description || 'Configuration extracted from bundle',
        qualifierTypes: systemQualifierTypes as QualifierTypes.Config.ISystemQualifierTypeConfig[],
        qualifiers: Array.from(system.qualifiers.values()).map((q) => {
          console.log('[Bundle Processing] Extracting qualifier:', q);
          // Instantiated Qualifier objects have .type property which is a QualifierType object
          const typeName = q.type.name;
          if (!typeName) {
            console.error('[Bundle Processing] Missing typeName for qualifier:', q);
          }
          return {
            name: q.name,
            typeName,
            token: q.token,
            defaultPriority: q.defaultPriority,
            tokenIsOptional: q.tokenIsOptional,
            ...(q.defaultValue !== undefined ? { defaultValue: q.defaultValue } : {})
          };
        }),
        resourceTypes: Array.from(system.resourceTypes.values()).map((rt, index: number) => {
          console.log('[Bundle Processing] Extracting resource type:', rt);
          // ResourceTypes in bundles might not have a name property
          // Default to 'json' for JsonResourceType
          const typeName = rt.systemTypeName;
          return {
            name: rt.key,
            typeName: rt.systemTypeName
          };
        })
      };

      console.log('[Bundle Processing] Extracted configuration for UI:', configForStorage);

      // Extract resource IDs from the loaded resource manager
      const resourceIds: string[] = [];
      let resourceCount = 0;

      // The resource manager is now fully loaded with all bundle resources
      // Extract resource IDs from the compiled collection for tracking
      if (compiledCollection.resources) {
        for (const resource of compiledCollection.resources) {
          const resourceId = resource.id || `resource-${resourceCount}`;
          resourceIds.push(resourceId);
          resourceCount++;
        }
      }

      console.log(`Bundle loaded with ${resourceCount} resources (with candidates):`, resourceIds);

      // Create a resolver using the bundle's resource manager
      const resolverResult = Runtime.ResourceResolver.create({
        resourceManager: system.resourceManager,
        qualifierTypes: system.qualifierTypes,
        contextQualifierProvider: system.contextQualifierProvider
      });

      if (resolverResult.isFailure()) {
        throw new Error(`Failed to create resolver: ${resolverResult.message}`);
      }

      // No longer create a separate CompiledResourceCollection manager
      // We'll derive the compiled collection from ResourceManagerBuilder when needed

      // Create the processed resources structure with bundle data
      const processedResources: ProcessedResources = {
        system: {
          qualifierTypes: system.qualifierTypes,
          qualifiers: system.qualifiers,
          resourceTypes: system.resourceTypes,
          resourceManager: system.resourceManager,
          importManager: system.importManager,
          contextQualifierProvider: system.contextQualifierProvider
        },
        compiledCollection,
        resolver: resolverResult.value,
        resourceCount,
        summary: {
          totalResources: resourceCount,
          resourceIds,
          errorCount: 0,
          warnings: [`Bundle loaded with ${resourceCount} resources from compiled collection`]
        }
      };

      console.log('[Bundle Processing] Setting final state...', {
        resourceCount,
        resourceIds,
        configForStorage,
        hasProcessedResources: !!processedResources
      });

      setState((prev) => ({
        ...prev,
        isProcessing: false,
        processedResources,
        hasProcessedData: true,
        error: null,
        activeConfiguration: configForStorage,
        isLoadedFromBundle: true,
        bundleMetadata: metadata
      }));

      console.log('[Bundle Processing] Bundle processing completed successfully!');
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
    async (resourceId: string, context?: Record<string, string>): Promise<Result<JsonValue>> => {
      if (!state.processedResources?.system?.resourceManager) {
        return fail('No resources loaded');
      }

      try {
        // Get the resource from the resource manager
        const resourceResult = state.processedResources.system.resourceManager.getBuiltResource(resourceId);
        if (resourceResult.isFailure()) {
          return fail(`Resource not found: ${resourceId}`);
        }

        // Get the resource and convert to JSON
        const resource = resourceResult.value;

        // Import resolution utilities for detailed resolution
        const { createResolverWithContext, resolveResourceDetailed } = await import(
          '../utils/resolutionUtils'
        );

        // Use provided context or empty context
        const contextValues = context || {};

        // Create resolver with context
        const resolverResult = createResolverWithContext(state.processedResources, contextValues, {
          enableDebugLogging: false
        });

        if (resolverResult.isFailure()) {
          return fail(`Failed to create resolver: ${resolverResult.message}`);
        }

        // Resolve resource with detailed information
        const detailedResult = resolveResourceDetailed(
          resolverResult.value,
          resourceId,
          state.processedResources,
          { enableDebugLogging: false }
        );

        if (detailedResult.isFailure()) {
          return fail(`Failed to resolve resource details: ${detailedResult.message}`);
        }

        const resolutionResult = detailedResult.value;

        // Return the detailed resolution result as JsonValue
        const detailedJson = {
          success: resolutionResult.success,
          resourceId: resolutionResult.resourceId,
          resource: resolutionResult.resource
            ? {
                id: resolutionResult.resource.id,
                resourceType: resolutionResult.resource.resourceType?.key || 'unknown',
                candidateCount: resolutionResult.resource.candidates.length
              }
            : null,
          bestCandidate: resolutionResult.bestCandidate?.json,
          allCandidates: resolutionResult.allCandidates?.map((c: any) => c.json),
          candidateDetails: resolutionResult.candidateDetails?.map((cd: any) => ({
            candidateIndex: cd.candidateIndex,
            matched: cd.matched,
            matchType: cd.matchType,
            isDefaultMatch: cd.isDefaultMatch,
            conditionEvaluations: cd.conditionEvaluations,
            candidateJson: cd.candidate?.json
          })),
          composedValue: resolutionResult.composedValue,
          error: resolutionResult.error
        };

        return succeed(detailedJson as unknown as JsonValue);
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
      processedResources: {
        // Preserve activeConfiguration and bundle metadata from existing state as defaults
        ...(prev.processedResources?.activeConfiguration && {
          activeConfiguration: prev.processedResources.activeConfiguration
        }),
        ...(prev.processedResources?.isLoadedFromBundle !== undefined && {
          isLoadedFromBundle: prev.processedResources.isLoadedFromBundle
        }),
        ...(prev.processedResources?.bundleMetadata && {
          bundleMetadata: prev.processedResources.bundleMetadata
        }),
        // Then spread the new processedResources, which can override the defaults above
        ...processedResources
      },
      hasProcessedData: true
    }));
  }, []);

  return {
    state,
    actions: {
      processDirectory,
      processDirectoryWithConfig,
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
