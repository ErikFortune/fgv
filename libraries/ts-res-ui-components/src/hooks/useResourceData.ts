import { useState, useCallback } from 'react';
import { Result, succeed, fail } from '@fgv/ts-utils';
import {
  ResourceManagerState,
  ProcessedResources,
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
import {
  processImportedFiles,
  processImportedDirectory,
  createSimpleContext,
  createTsResSystemFromConfig
} from '../utils/tsResIntegration';

export interface UseResourceDataReturn {
  state: ResourceManagerState;
  actions: {
    processDirectory: (directory: ImportedDirectory) => Promise<void>;
    processDirectoryWithConfig: (
      directory: ImportedDirectory,
      config: Config.Model.ISystemConfiguration
    ) => Promise<void>;
    processFiles: (files: ImportedFile[]) => Promise<void>;
    processBundleFile: (bundle: Bundle.IBundle) => Promise<void>;
    clearError: () => void;
    reset: () => void;
    resolveResource: (resourceId: string, context?: Record<string, string>) => Promise<Result<JsonValue>>;
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

  const processDirectoryWithConfig = useCallback(
    async (directory: ImportedDirectory, config: Config.Model.ISystemConfiguration) => {
      setState((prev) => ({ ...prev, isProcessing: true, error: null, activeConfiguration: config }));

      try {
        const result = processImportedDirectory(directory, config);

        if (result.isSuccess()) {
          setState((prev) => ({
            ...prev,
            isProcessing: false,
            processedResources: result.value,
            hasProcessedData: true,
            isLoadedFromBundle: false,
            bundleMetadata: null,
            activeConfiguration: config
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
    []
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

      // Extract configuration for UI display using the collector API
      // Note: The collectors contain instantiated objects, not raw config
      const configForStorage: Config.Model.ISystemConfiguration = {
        name: 'Bundle Configuration',
        description: metadata?.description || 'Configuration extracted from bundle',
        qualifierTypes: Array.from(system.qualifierTypes.values()).map((qt) => {
          console.log('[Bundle Processing] Extracting qualifier type:', qt);
          // Determine the system type based on the class name
          let systemType: 'literal' | 'language' | 'territory' = 'literal';
          if (qt.constructor?.name === 'LanguageQualifierType') {
            systemType = 'language';
          } else if (qt.constructor?.name === 'TerritoryQualifierType') {
            systemType = 'territory';
          } else if (qt.constructor?.name === 'LiteralQualifierType') {
            systemType = 'literal';
          }

          // Extract configuration properties based on type
          const configuration: Record<string, unknown> = {};

          // Common properties
          if (qt.allowContextList !== undefined) {
            configuration.allowContextList = qt.allowContextList;
          }

          // LiteralQualifierType specific
          if (systemType === 'literal') {
            const qtAny = qt as unknown as Record<string, unknown>;
            if (qtAny.caseSensitive !== undefined) {
              configuration.caseSensitive = qtAny.caseSensitive;
            }
            if (qtAny.enumeratedValues) {
              configuration.enumeratedValues = qtAny.enumeratedValues;
            }
            if (qtAny.hierarchy) {
              configuration.hierarchy = qtAny.hierarchy;
            }
          }

          // TerritoryQualifierType specific
          if (systemType === 'territory') {
            const qtAny = qt as unknown as Record<string, unknown>;
            if (qtAny.acceptLowercase !== undefined) {
              configuration.acceptLowercase = qtAny.acceptLowercase;
            }
            if (qtAny.allowedTerritories) {
              configuration.allowedTerritories = qtAny.allowedTerritories;
            }
          }

          return {
            name: qt.name,
            systemType: systemType,
            configuration: configuration
          };
        }),
        qualifiers: Array.from(system.qualifiers.values()).map((q) => {
          console.log('[Bundle Processing] Extracting qualifier:', q);
          // Instantiated Qualifier objects have .type property which is a QualifierType object
          const qAny = q as unknown as Record<string, unknown>;
          const typeName = (q.type as QualifierTypes.QualifierType)?.name || qAny.typeName;
          if (!typeName) {
            console.error('[Bundle Processing] Missing typeName for qualifier:', q);
          }
          return {
            name: q.name,
            typeName: (typeName || 'unknown') as string,
            token: q.token,
            defaultPriority: q.defaultPriority || 500,
            defaultValue: q.defaultValue,
            tokenIsOptional: q.tokenIsOptional || false
          } as Qualifiers.IQualifierDecl;
        }),
        resourceTypes: Array.from(system.resourceTypes.values()).map((rt, index: number) => {
          console.log('[Bundle Processing] Extracting resource type:', rt);
          // ResourceTypes in bundles might not have a name property
          // Default to 'json' for JsonResourceType
          const rtAny = rt as unknown as Record<string, unknown>;
          const typeName = rt.constructor?.name === 'JsonResourceType' ? 'json' : rtAny.typeName || 'json';
          return {
            name: (rtAny.name || `resourceType${index}`) as string, // Provide a default name if missing
            typeName: typeName as string
          } as ResourceTypes.Config.IResourceTypeConfig;
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
      processedResources,
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
