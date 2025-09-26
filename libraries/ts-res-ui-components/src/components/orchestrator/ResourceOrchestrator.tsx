import React, { ReactNode, useCallback, useMemo, useState } from 'react';
import { ObservabilityProvider, useObservability } from '../../contexts';
import { Config, Bundle, QualifierTypes, ResourceTypes } from '@fgv/ts-res';
import { FileTree } from '@fgv/ts-json-base';
import {
  IOrchestratorState,
  IOrchestratorActions,
  IProcessedResources,
  IFilterState,
  IFilterResult,
  IResourceEditorFactory
} from '../../types';
import * as ObservabilityTools from '../../utils/observability';
import { useResourceData } from '../../hooks/useResourceData';
import { useFilterState } from '../../hooks/useFilterState';
import { useViewState } from '../../hooks/useViewState';
import { useResolutionState } from '../../hooks/useResolutionState';
import { createFilteredResourceManagerSimple, analyzeFilteredResources } from '../../utils/filterResources';
import * as DownloadUtils from '../../utils/downloadHelper';

/**
 * Props for the ResourceOrchestrator component.
 * Provides render props pattern for resource management UI.
 *
 * @public
 */
export interface IResourceOrchestratorProps {
  /** Render function that receives orchestrator state and actions */
  children: (orchestrator: { state: IOrchestratorState; actions: IOrchestratorActions }) => ReactNode;
  /** Optional initial configuration to apply on mount */
  initialConfiguration?: Config.Model.ISystemConfiguration;
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
  /**
   * Optional factory for creating type-specific resource editors.
   * When provided, ResolutionView will use custom editors for supported resource types
   * instead of the default JSON editor.
   */
  resourceEditorFactory?: IResourceEditorFactory;
  /** Callback fired when orchestrator state changes */
  onStateChange?: (state: Partial<IOrchestratorState>) => void;
  /** Optional observability context for logging and user feedback */
  observabilityContext?: ObservabilityTools.IObservabilityContext;
}

/**
 * Internal orchestrator component that has access to observability context via hook.
 */
const ResourceOrchestratorInternal: React.FC<
  Omit<IResourceOrchestratorProps, 'observabilityContext'> & {
    viewState: ReturnType<typeof useViewState>;
  }
> = ({
  children,
  initialConfiguration,
  qualifierTypeFactory,
  resourceTypeFactory,
  resourceEditorFactory,
  onStateChange,
  viewState
}) => {
  // Get observability context from provider
  const o11y = useObservability();

  // Core hooks
  const resourceData = useResourceData({
    qualifierTypeFactory,
    resourceTypeFactory,
    o11y
  });
  const filterState = useFilterState();
  // Use the ViewState passed down from ResourceOrchestrator instead of creating a new one
  // System update handler for resolution editing
  const handleSystemUpdate = useCallback(
    (updatedResources: IProcessedResources) => {
      resourceData.actions.updateProcessedResources(updatedResources);
      o11y.user.success('Resource system updated with edits');
    },
    [resourceData.actions, o11y.user]
  );

  // Local state for filter results
  const [filterResult, setFilterResult] = useState<IFilterResult | null>(null);

  // Use filtered resources for resolution when filtering is active and successful
  const resolutionProcessedResources = useMemo(() => {
    const isFilteringActive = filterState.state.enabled && filterResult?.success === true;
    return isFilteringActive
      ? filterResult?.processedResources ?? null
      : resourceData.state.processedResources;
  }, [filterState.state.enabled, filterResult, resourceData.state.processedResources]);

  const resolutionData = useResolutionState(resolutionProcessedResources, handleSystemUpdate);

  // Track if filtering is in progress to prevent concurrent operations
  const isFilteringInProgress = React.useRef(false);

  // Initialize with configuration if provided
  React.useEffect(() => {
    if (initialConfiguration && !resourceData.state.activeConfiguration) {
      resourceData.actions.applyConfiguration(initialConfiguration);
    }
  }, [initialConfiguration, resourceData.state.activeConfiguration, resourceData.actions]);

  // Notify parent of state changes
  React.useEffect(() => {
    if (onStateChange) {
      onStateChange({
        resources: resourceData.state.processedResources,
        configuration: resourceData.state.activeConfiguration,
        filterState: filterState.state,
        filterResult,
        selectedResourceId: viewState.selectedResourceId,
        isProcessing: resourceData.state.isProcessing,
        error: resourceData.state.error,
        messages: viewState.messages
      });
    }
  }, [
    resourceData.state,
    filterState.state,
    filterResult,
    viewState.selectedResourceId,
    viewState.messages,
    onStateChange
  ]);

  // Internal filtering logic (used by both manual and automatic application)
  const performFiltering = useCallback(
    async (filterValues: Record<string, string | undefined>): Promise<IFilterResult | null> => {
      // Prevent concurrent filtering operations
      if (isFilteringInProgress.current) {
        o11y.diag.info('Filtering already in progress, skipping...');
        return null;
      }

      if (!resourceData.state.processedResources || !filterState.state.enabled) {
        setFilterResult(null);
        return null;
      }

      // Check if we have any filter values to work with
      const hasFilterValues = Object.values(filterValues).some(
        (value) => value !== undefined && value !== ''
      );
      if (!hasFilterValues) {
        setFilterResult(null);
        return null;
      }

      isFilteringInProgress.current = true;

      try {
        const { system } = resourceData.state.processedResources;

        o11y.user.info('Starting filtering process...');
        o11y.diag.info('Filtering with values:', filterValues);
        o11y.diag.info('Filter state:', filterState.state);

        // Try the simplified filtering approach using provided values
        const filteredResult = await createFilteredResourceManagerSimple(system, filterValues, {
          partialContextMatch: true,
          enableDebugLogging: false, // Disable debug logging to reduce console output
          reduceQualifiers: filterState.state.reduceQualifiers
        });

        if (filteredResult.isFailure()) {
          const result: IFilterResult = {
            success: false,
            error: `Filtering failed: ${filteredResult.message}`,
            filteredResources: [],
            warnings: []
          };
          setFilterResult(result);
          o11y.user.error(`Filtering failed: ${filteredResult.message}`);
          return result;
        }

        // Analyze filtered resources compared to original
        const originalResources = resourceData.state.processedResources.summary.resourceIds || [];
        o11y.diag.info('Original resources count:', originalResources.length);

        const analysis = analyzeFilteredResources(
          originalResources,
          filteredResult.value,
          resourceData.state.processedResources
        );

        o11y.diag.info('Analysis result:', {
          success: analysis.success,
          filteredResourcesCount: analysis.filteredResources.length,
          warningsCount: analysis.warnings.length,
          hasProcessedResources: !!analysis.processedResources
        });

        o11y.diag.info(
          'Filtered resources breakdown:',
          analysis.filteredResources.map((r) => ({
            id: r.id,
            originalCandidates: r.originalCandidateCount,
            filteredCandidates: r.filteredCandidateCount,
            reduction: r.originalCandidateCount - r.filteredCandidateCount,
            hasWarning: r.hasWarning
          }))
        );

        const result: IFilterResult = {
          success: true,
          processedResources: analysis.processedResources,
          filteredResources: analysis.filteredResources,
          warnings: analysis.warnings
        };

        o11y.diag.info('Setting filter result:', result);
        setFilterResult(result);

        if (analysis.warnings.length > 0) {
          o11y.user.warn(`Filtering completed with ${analysis.warnings.length} warning(s)`);
        } else {
          o11y.user.success(`Filtering completed: ${analysis.filteredResources.length} resources`);
        }

        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const result: IFilterResult = {
          success: false,
          error: errorMessage,
          filteredResources: [],
          warnings: []
        };
        setFilterResult(result);
        o11y.user.error(`Filtering error: ${errorMessage}`);
        return result;
      } finally {
        // eslint-disable-next-line require-atomic-updates -- intentionally reset filtering flag regardless of concurrent operations
        isFilteringInProgress.current = false;
      }
    },
    [resourceData.state.processedResources, filterState.state, o11y.user]
  );

  // Manual apply filter action (for the Apply button)
  const applyFilter = useCallback(async (): Promise<IFilterResult | null> => {
    // Capture the current values before applying them
    const currentValues = { ...filterState.state.values };

    // First apply the pending values to make them the applied values
    filterState.actions.applyFilterValues();

    // Then perform filtering with the captured values
    const result = await performFiltering(currentValues);

    return result;
  }, [performFiltering, filterState.actions]);

  // Reset filter action
  const resetFilter = useCallback(() => {
    setFilterResult(null);
    filterState.actions.resetFilterValues();
    o11y.user.info('Filter reset');
  }, [filterState.actions, o11y.user]);

  // Combined state
  const state: IOrchestratorState = useMemo(
    () => ({
      resources: resourceData.state.processedResources,
      configuration: resourceData.state.activeConfiguration,
      filterState: filterState.state,
      filterResult,
      resolutionState: resolutionData.state,
      selectedResourceId: viewState.selectedResourceId,
      isProcessing: resourceData.state.isProcessing,
      error: resourceData.state.error,
      messages: viewState.messages,
      resourceEditorFactory
    }),
    [
      resourceData.state,
      filterState.state,
      filterResult,
      resolutionData.state,
      viewState.selectedResourceId,
      viewState.messages,
      resourceEditorFactory
    ]
  );

  // Combined actions
  const actions: IOrchestratorActions = useMemo(
    () => ({
      // Resource management
      importFileTree: async (fileTree: FileTree.FileTree) => {
        o11y.user.info('Importing FileTree...');
        const result = await resourceData.actions.processFileTree(fileTree);
        if (result.isSuccess()) {
          o11y.user.success('FileTree imported successfully');
        } else {
          o11y.user.error(result.message);
        }
      },
      importFileTreeWithConfig: async (
        fileTree: FileTree.FileTree,
        config: Config.Model.ISystemConfiguration
      ) => {
        o11y.user.info('Importing FileTree with configuration...');
        await resourceData.actions.processFileTreeWithConfig(fileTree, config);
        if (!resourceData.state.error) {
          o11y.user.success('FileTree imported successfully');
        } else {
          o11y.user.error(resourceData.state.error);
        }
      },
      importBundle: async (bundle: Bundle.IBundle) => {
        o11y.user.info('Importing bundle...');
        await resourceData.actions.processBundleFile(bundle);
        if (!resourceData.state.error) {
          o11y.user.success('Bundle imported successfully');
        }
      },
      clearResources: () => {
        resourceData.actions.reset();
        setFilterResult(null);
        o11y.user.info('Resources cleared');
      },

      // Configuration management
      updateConfiguration: (config: Config.Model.ISystemConfiguration) => {
        resourceData.actions.applyConfiguration(config);
        o11y.user.info('Configuration updated');
      },
      applyConfiguration: (config: Config.Model.ISystemConfiguration) => {
        resourceData.actions.applyConfiguration(config);
        o11y.user.success('Configuration applied');
      },

      // Filter management
      updateFilterState: (updates: Partial<IFilterState>) => {
        if (updates.enabled !== undefined) {
          filterState.actions.updateFilterEnabled(updates.enabled);
        }
        if (updates.values !== undefined) {
          filterState.actions.updateFilterValues(updates.values);
        }
        if (updates.reduceQualifiers !== undefined) {
          filterState.actions.updateReduceQualifiers(updates.reduceQualifiers);
        }
      },
      applyFilter,
      resetFilter,

      // Resolution management
      updateResolutionContext: resolutionData.actions.updateContextValue,
      applyResolutionContext: resolutionData.actions.applyContext,
      selectResourceForResolution: resolutionData.actions.selectResource,
      setResolutionViewMode: resolutionData.actions.setViewMode,
      resetResolutionCache: resolutionData.actions.resetCache,

      // Resolution editing actions
      saveResourceEdit: resolutionData.actions.saveEdit,
      getEditedValue: resolutionData.actions.getEditedValue,
      hasResourceEdit: resolutionData.actions.hasEdit,
      clearResourceEdits: resolutionData.actions.clearEdits,
      // Edits applied through unified applyPendingResources
      discardResourceEdits: resolutionData.actions.discardEdits,

      // Resource creation actions (enhanced with atomic API)
      createPendingResource: resolutionData.actions.createPendingResource,
      startNewResource: resolutionData.actions.startNewResource,
      updateNewResourceId: resolutionData.actions.updateNewResourceId,
      selectResourceType: resolutionData.actions.selectResourceType,
      updateNewResourceJson: resolutionData.actions.updateNewResourceJson,
      saveNewResourceAsPending: resolutionData.actions.saveNewResourceAsPending,
      cancelNewResource: resolutionData.actions.cancelNewResource,
      removePendingResource: resolutionData.actions.removePendingResource,
      markResourceForDeletion: resolutionData.actions.markResourceForDeletion,
      applyPendingResources: resolutionData.actions.applyPendingResources,
      discardPendingResources: resolutionData.actions.discardPendingResources,

      // Combined apply/discard removed; use applyPendingResources/discard* directly

      // Export functionality
      exportBundle: () => {
        const resources = resourceData.state.processedResources;
        if (!resources || !resources.activeConfiguration) {
          o11y.user.error('Export bundle failed: No resource manager or configuration available');
          return;
        }

        // Use proper Result chaining with side effects
        const result = Config.SystemConfiguration.create(resources.activeConfiguration)
          .onSuccess((systemConfig) =>
            Bundle.BundleBuilder.create(resources.system.resourceManager, systemConfig)
          )
          .onSuccess((bundle) => DownloadUtils.downloadBundle(bundle, resources.resourceCount));

        // Handle final result with side effects
        if (result.isSuccess()) {
          o11y.user.success('Bundle exported successfully');
        } else {
          o11y.user.error(`Export bundle failed: ${result.message}`);
        }
      },

      exportSource: () => {
        const resources = resourceData.state.processedResources;
        if (!resources) {
          o11y.user.error('Export source failed: No processed resources available');
          return;
        }

        // Use proper Result chaining with side effects
        const result = DownloadUtils.downloadSourceResources(resources, resources.resourceCount);

        // Handle result with side effects
        if (result.isSuccess()) {
          o11y.user.success('Source resources exported successfully');
        } else {
          o11y.user.error(`Export source failed: ${result.message}`);
        }
      },

      exportCompiled: () => {
        const resources = resourceData.state.processedResources;
        if (!resources || !resources.compiledCollection) {
          o11y.user.error('Export compiled failed: No compiled resources available');
          return;
        }

        // Use proper Result chaining with side effects
        const result = DownloadUtils.downloadCompiledResources(
          resources.compiledCollection,
          resources.resourceCount
        );

        // Handle result with side effects
        if (result.isSuccess()) {
          o11y.user.success('Compiled resources exported successfully');
        } else {
          o11y.user.error(`Export compiled failed: ${result.message}`);
        }
      },

      // UI state management
      selectResource: viewState.selectResource,
      addMessage: viewState.addMessage,
      clearMessages: viewState.clearMessages,

      // Observability context
      o11y,

      // Resource resolution
      resolveResource: resourceData.actions.resolveResource
    }),
    [
      resourceData.actions,
      filterState.actions,
      resolutionData.actions,
      viewState,
      applyFilter,
      resetFilter,
      o11y
    ]
  );

  return <>{children({ state, actions })}</>;
};

/**
 * Main orchestrator component for ts-res resource management UI.
 *
 * This component provides a centralized state management and action coordination
 * for all ts-res UI functionality. It uses the render props pattern to provide
 * state and actions to child components.
 *
 * Features:
 * - Resource processing (files, directories, bundles)
 * - Filtering and context management
 * - Resource resolution testing
 * - Configuration management
 * - View state coordination
 *
 * @param props - ResourceOrchestrator configuration
 * @returns JSX element using render props pattern
 *
 * @example
 * ```typescript
 * <ResourceOrchestrator>
 *   {({ state, actions }) => (
 *     <div>
 *       <ImportView
 *         onImport={actions.importDirectory}
 *         onBundleImport={actions.importBundle}
 *       />
 *       {state.processedResources && (
 *         <SourceView
 *           resources={state.processedResources}
 *           onExport={actions.exportData}
 *         />
 *       )}
 *     </div>
 *   )}
 * </ResourceOrchestrator>
 * ```
 *
 * @public
 */
export const ResourceOrchestrator: React.FC<IResourceOrchestratorProps> = ({
  observabilityContext,
  ...props
}) => {
  // Create viewState hook to get addMessage function for observability integration
  const viewState = useViewState();

  // Create observability context that connects user messages to viewState
  // If a custom context is provided, use it; otherwise create one connected to viewState
  const effectiveObservabilityContext = React.useMemo(() => {
    if (observabilityContext) {
      return observabilityContext;
    }
    return ObservabilityTools.createViewStateObservabilityContext(viewState.addMessage);
  }, [observabilityContext, viewState.addMessage]);

  return (
    <ObservabilityProvider observabilityContext={effectiveObservabilityContext}>
      <ResourceOrchestratorInternal {...props} viewState={viewState} />
    </ObservabilityProvider>
  );
};

export default ResourceOrchestrator;
