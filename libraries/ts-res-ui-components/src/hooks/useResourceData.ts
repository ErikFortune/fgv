import { useState, useCallback } from 'react';
import { Result, succeed, fail, mapResults } from '@fgv/ts-utils';
import { IResourceManagerState, IProcessedResources, IExtendedProcessedResources, JsonValue } from '../types';
import { Converters } from '@fgv/ts-json-base';
import { Config, Bundle, Runtime, Resources, Import, QualifierTypes, ResourceTypes } from '@fgv/ts-res';
import { FileTree } from '@fgv/ts-json-base';
import { processFileTree } from '../utils/tsResIntegration';
import { createResolverWithContext, resolveResourceDetailed } from '../utils/resolutionUtils';
import * as ObservabilityTools from '../utils/observability';

/**
 * Parameters for the useResourceData hook.
 * Allows customization of type factories for extended functionality.
 *
 * @public
 */
export interface IUseResourceDataParams {
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
  /** Optional observability context for logging */
  o11y?: ObservabilityTools.IObservabilityContext;
}

/**
 * Return type for the useResourceData hook.
 * Provides state and actions for managing ts-res data processing.
 *
 * @public
 */
export interface IUseResourceDataReturn {
  /** Current state of the resource management system */
  state: IResourceManagerState;
  /** Available actions for processing and managing resources */
  actions: {
    /** Process a FileTree into a resource system */
    processFileTree: (fileTree: FileTree.FileTree) => Promise<Result<void>>;
    /** Process a FileTree with an explicit configuration */
    processFileTreeWithConfig: (
      fileTree: FileTree.FileTree,
      config: Config.Model.ISystemConfiguration
    ) => Promise<Result<void>>;
    /** Process a pre-compiled bundle file */
    processBundleFile: (bundle: Bundle.IBundle) => Promise<void>;
    /** Clear any current error state */
    clearError: () => void;
    /** Reset the entire resource management state */
    reset: () => void;
    /** Resolve a specific resource with optional context */
    resolveResource: (resourceId: string, context?: Record<string, string>) => Result<JsonValue>;
    /** Apply a new configuration to the current system */
    applyConfiguration: (config: Config.Model.ISystemConfiguration) => void;
    /** Update the processed resources state directly */
    updateProcessedResources: (processedResources: IProcessedResources) => void;
  };
}

const initialState: IResourceManagerState = {
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
 * // Process a FileTree
 * await actions.processFileTree(fileTree);
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
export function useResourceData(params?: IUseResourceDataParams): IUseResourceDataReturn {
  const [state, setState] = useState<IResourceManagerState>(initialState);
  const o11y = params?.o11y ?? ObservabilityTools.DefaultObservabilityContext;

  const processFileTreeAction = useCallback(
    async (fileTree: FileTree.FileTree): Promise<Result<void>> => {
      setState((prev) => ({ ...prev, isProcessing: true, error: null }));

      try {
        return processFileTree({
          fileTree,
          systemConfig: state.activeConfiguration || undefined,
          qualifierTypeFactory: params?.qualifierTypeFactory,
          resourceTypeFactory: params?.resourceTypeFactory,
          o11y
        })
          .onSuccess((value) => {
            o11y.diag.info(
              `[useResourceData] FileTree processing succeeded, resources found: ${
                value.summary?.totalResources || 0
              }`
            );
            o11y.diag.info(
              `[useResourceData] Resource IDs: ${JSON.stringify(value.summary?.resourceIds || [])}`
            );

            setState((prev) => ({
              ...prev,
              isProcessing: false,
              processedResources: value,
              hasProcessedData: true,
              isLoadedFromBundle: false,
              bundleMetadata: null
            }));
            o11y.diag.info(
              `[useResourceData] State updated with ${value.summary?.totalResources || 0} resources`
            );
            return succeed(undefined);
          })
          .onFailure((errorMessage) => {
            o11y.diag.error(`[useResourceData] FileTree processing failed: ${errorMessage}`);
            o11y.user.error(`FileTree import failed: ${errorMessage}`);

            setState((prev) => ({
              ...prev,
              isProcessing: false,
              error: errorMessage
            }));
            return fail(errorMessage);
          });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        o11y.diag.error(`[useResourceData] Exception during FileTree processing: ${errorMessage}`);
        o11y.user.error(`FileTree import failed: ${errorMessage}`);

        setState((prev) => ({
          ...prev,
          isProcessing: false,
          error: errorMessage
        }));
        return fail(errorMessage);
      }
    },
    [state.activeConfiguration, params?.qualifierTypeFactory, params?.resourceTypeFactory, o11y]
  );

  const processFileTreeWithConfigAction = useCallback(
    async (fileTree: FileTree.FileTree, config: Config.Model.ISystemConfiguration): Promise<Result<void>> => {
      setState((prev) => ({ ...prev, isProcessing: true, error: null, activeConfiguration: config }));

      try {
        return processFileTree({
          fileTree,
          systemConfig: config,
          qualifierTypeFactory: params?.qualifierTypeFactory,
          resourceTypeFactory: params?.resourceTypeFactory,
          o11y
        })
          .onSuccess((value) => {
            setState((prev) => ({
              ...prev,
              isProcessing: false,
              processedResources: value,
              hasProcessedData: true,
              isLoadedFromBundle: false,
              bundleMetadata: null,
              activeConfiguration: config
            }));
            return succeed(undefined);
          })
          .onFailure((errorMessage) => {
            o11y.user.error(`FileTree import with config failed: ${errorMessage}`);
            setState((prev) => ({
              ...prev,
              isProcessing: false,
              error: errorMessage
            }));
            return fail(errorMessage);
          });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        o11y.user.error(`FileTree import with config failed: ${errorMessage}`);
        setState((prev) => ({
          ...prev,
          isProcessing: false,
          error: errorMessage
        }));
        return fail(errorMessage);
      }
    },
    [params?.qualifierTypeFactory, params?.resourceTypeFactory, o11y]
  );

  const processBundleFile = useCallback(
    async (bundle: Bundle.IBundle) => {
      o11y.diag.info('[Bundle Processing] Starting bundle processing...', bundle);
      setState((prev) => ({ ...prev, isProcessing: true, error: null }));

      try {
        o11y.diag.info('[Bundle Processing] Attempting to extract bundle components...');

        // Extract bundle components (configuration and compiled collection)
        const { systemConfiguration, compiledCollection, metadata } =
          Bundle.BundleUtils.extractBundleComponents(bundle).orThrow(
            (msg) => `Failed to extract bundle components: ${msg}`
          );

        o11y.diag.info('[Bundle Processing] Extracted components:', {
          hasSystemConfiguration: !!systemConfiguration,
          hasCompiledCollection: !!compiledCollection,
          hasMetadata: !!metadata,
          systemConfiguration: systemConfiguration
        });

        // Use BundleLoader to create a fully functional resource manager from the bundle
        o11y.diag.info('[Bundle Processing] Using BundleLoader to create resource manager from bundle');

        // The bundle's IResourceManager contains all the resources and candidates
        // We'll use it directly for both UI and resolution
        const bundleResourceManager = Bundle.BundleLoader.createManagerFromBundle({
          bundle: bundle,
          skipChecksumVerification: true // Skip for now since we're in a browser environment
        }).orThrow((msg) => `Failed to create resource manager from bundle: ${msg}`);

        // Debug: Check what resources are in the original bundle manager
        o11y.diag.info('[Bundle Processing] Original bundle manager resources:', {
          numResources: bundleResourceManager.numResources,
          numCandidates: bundleResourceManager.numCandidates,
          resourceIds: Array.from(bundleResourceManager.builtResources.keys())
        });

        // Convert the compiled collection to an editable ResourceManagerBuilder
        // using createFromCompiledResourceCollection for exact reconstruction
        const editableResourceManager = Resources.ResourceManagerBuilder.createFromCompiledResourceCollection(
          compiledCollection,
          systemConfiguration
        ).orThrow((msg) => `Failed to reconstruct builder from compiled collection: ${msg}`);

        o11y.diag.info('[Bundle Processing] Normalized builder resources:', {
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
        const allQualifierTypes = mapResults(
          Array.from(system.qualifierTypes.values()).map((qt) =>
            qt
              .getConfigurationJson()
              .onSuccess((jsonConfig) =>
                QualifierTypes.Config.Convert.anyQualifierTypeConfig.convert(jsonConfig)
              )
          )
        ).orThrow((msg) => `Failed to extract qualifier type configurations: ${msg}`);

        const systemQualifierTypes = allQualifierTypes.filter(
          QualifierTypes.Config.isSystemQualifierTypeConfig
        );

        const configForStorage: Config.Model.ISystemConfiguration = {
          name: 'Bundle Configuration',
          description: metadata?.description || 'Configuration extracted from bundle',
          qualifierTypes: systemQualifierTypes as QualifierTypes.Config.ISystemQualifierTypeConfig[],
          qualifiers: Array.from(system.qualifiers.values()).map((q) => {
            o11y.diag.info('[Bundle Processing] Extracting qualifier:', q);
            // Instantiated Qualifier objects have .type property which is a QualifierType object
            const typeName = q.type.name;
            if (!typeName) {
              o11y.diag.error('[Bundle Processing] Missing typeName for qualifier:', q);
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
            o11y.diag.info('[Bundle Processing] Extracting resource type:', rt);
            // ResourceTypes in bundles might not have a name property
            // Default to 'json' for JsonResourceType
            return {
              name: rt.key,
              typeName: rt.systemTypeName
            };
          })
        };

        o11y.diag.info('[Bundle Processing] Extracted configuration for UI:', configForStorage);

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

        o11y.diag.info(`Bundle loaded with ${resourceCount} resources (with candidates):`, resourceIds);

        // Create a resolver using the bundle's resource manager
        const resolver = Runtime.ResourceResolver.create({
          resourceManager: system.resourceManager,
          qualifierTypes: system.qualifierTypes,
          contextQualifierProvider: system.contextQualifierProvider
        }).orThrow((msg) => `Failed to create resolver: ${msg}`);

        // No longer create a separate CompiledResourceCollection manager
        // We'll derive the compiled collection from ResourceManagerBuilder when needed

        // Create the processed resources structure with bundle data
        const processedResources: IProcessedResources = {
          system: {
            qualifierTypes: system.qualifierTypes,
            qualifiers: system.qualifiers,
            resourceTypes: system.resourceTypes,
            resourceManager: system.resourceManager,
            importManager: system.importManager,
            contextQualifierProvider: system.contextQualifierProvider
          },
          compiledCollection,
          resolver,
          resourceCount,
          summary: {
            totalResources: resourceCount,
            resourceIds,
            errorCount: 0,
            warnings: [`Bundle loaded with ${resourceCount} resources from compiled collection`]
          }
        };

        o11y.diag.info('[Bundle Processing] Setting final state...', {
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

        o11y.diag.info('[Bundle Processing] Bundle processing completed successfully!');
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isProcessing: false,
          error: error instanceof Error ? error.message : String(error)
        }));
      }
    },
    [o11y]
  );

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  const resolveResource = useCallback(
    (resourceId: string, context?: Record<string, string>): Result<JsonValue> => {
      if (!state.processedResources?.system?.resourceManager) {
        return fail('No resources loaded');
      }

      try {
        // Use provided context or empty context
        const contextValues = context || {};

        return state.processedResources.system.resourceManager
          .getBuiltResource(resourceId)
          .onFailure(() => fail(`Resource not found: ${resourceId}`))
          .onSuccess(() =>
            createResolverWithContext(state.processedResources!, contextValues, {
              enableDebugLogging: false
            }).withErrorFormat((msg) => `Failed to create resolver: ${msg}`)
          )
          .onSuccess((resolver) =>
            resolveResourceDetailed(resolver, resourceId, state.processedResources!, {
              enableDebugLogging: false
            }).withErrorFormat((msg) => `Failed to resolve resource details: ${msg}`)
          )
          .onSuccess((resolutionResult) => {
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
              allCandidates: resolutionResult.allCandidates?.map((c) => c.json),
              candidateDetails: resolutionResult.candidateDetails?.map((cd) => ({
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

            // Convert to JsonValue using proper converter
            return Converters.jsonValue.convert(detailedJson);
          });
      } catch (error) {
        return fail(`Failed to resolve resource: ${error instanceof Error ? error.message : String(error)}`);
      }
    },
    [state.processedResources]
  );

  const applyConfiguration = useCallback((config: Config.Model.ISystemConfiguration) => {
    setState((prev) => ({ ...prev, activeConfiguration: config }));
  }, []);

  const updateProcessedResources = useCallback((processedResources: IProcessedResources) => {
    setState((prev) => {
      const incomingExtended = processedResources as IExtendedProcessedResources;
      const existingExtended = prev.processedResources;

      // Build the extended properties object, only including defined values
      const extendedProps: Partial<IExtendedProcessedResources> = {};

      // Handle activeConfiguration - prefer incoming, then existing, then leave undefined
      const activeConfig = incomingExtended.activeConfiguration ?? existingExtended?.activeConfiguration;
      if (activeConfig !== undefined) {
        extendedProps.activeConfiguration = activeConfig;
      }

      // Handle isLoadedFromBundle - prefer incoming, then existing, then leave undefined
      const isLoaded = incomingExtended.isLoadedFromBundle ?? existingExtended?.isLoadedFromBundle;
      if (isLoaded !== undefined) {
        extendedProps.isLoadedFromBundle = isLoaded;
      }

      // Handle bundleMetadata - prefer incoming, then existing, then leave undefined
      const bundleMeta = incomingExtended.bundleMetadata ?? existingExtended?.bundleMetadata;
      if (bundleMeta !== undefined) {
        extendedProps.bundleMetadata = bundleMeta;
      }

      return {
        ...prev,
        processedResources: {
          // Start with the new processedResources (core data)
          ...processedResources,
          // Then add any extended properties that have values
          ...extendedProps
        },
        hasProcessedData: true
      };
    });
  }, []);

  return {
    state,
    actions: {
      processFileTree: processFileTreeAction,
      processFileTreeWithConfig: processFileTreeWithConfigAction,
      processBundleFile,
      clearError,
      reset,
      resolveResource,
      applyConfiguration,
      updateProcessedResources
    }
  };
}
