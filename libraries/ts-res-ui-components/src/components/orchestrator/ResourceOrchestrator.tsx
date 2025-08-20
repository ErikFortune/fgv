import React, { ReactNode, useCallback, useMemo, useState } from 'react';
import { Config, Bundle, QualifierTypes, ResourceTypes } from '@fgv/ts-res';
import {
  OrchestratorState,
  OrchestratorActions,
  ImportedDirectory,
  ImportedFile,
  ProcessedResources,
  FilterState,
  FilterResult
} from '../../types';
import { useResourceData } from '../../hooks/useResourceData';
import { useFilterState } from '../../hooks/useFilterState';
import { useViewState } from '../../hooks/useViewState';
import { useResolutionState } from '../../hooks/useResolutionState';
import { createFilteredResourceManagerSimple, analyzeFilteredResources } from '../../utils/filterResources';
import { Runtime } from '@fgv/ts-res';

/**
 * Props for the ResourceOrchestrator component.
 * Provides render props pattern for resource management UI.
 *
 * @public
 */
export interface ResourceOrchestratorProps {
  /** Render function that receives orchestrator state and actions */
  children: (orchestrator: { state: OrchestratorState; actions: OrchestratorActions }) => ReactNode;
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
  /** Callback fired when orchestrator state changes */
  onStateChange?: (state: Partial<OrchestratorState>) => void;
}

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
export const ResourceOrchestrator: React.FC<ResourceOrchestratorProps> = ({
  children,
  initialConfiguration,
  qualifierTypeFactory,
  resourceTypeFactory,
  onStateChange
}) => {
  // Core hooks
  const resourceData = useResourceData({
    qualifierTypeFactory,
    resourceTypeFactory
  });
  const filterState = useFilterState();
  const viewState = useViewState();
  // System update handler for resolution editing
  const handleSystemUpdate = useCallback(
    (updatedResources: ProcessedResources) => {
      resourceData.actions.updateProcessedResources(updatedResources);
      viewState.addMessage('success', 'Resource system updated with edits');
    },
    [resourceData.actions, viewState]
  );

  const resolutionData = useResolutionState(
    resourceData.state.processedResources,
    viewState.addMessage,
    handleSystemUpdate
  );

  // Local state for filter results
  const [filterResult, setFilterResult] = useState<FilterResult | null>(null);

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
    async (filterValues: Record<string, string | undefined>): Promise<FilterResult | null> => {
      // Prevent concurrent filtering operations
      if (isFilteringInProgress.current) {
        console.log('Filtering already in progress, skipping...');
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

        viewState.addMessage('info', 'Starting filtering process...');
        console.log('Filtering with values:', filterValues);
        console.log('Filter state:', filterState.state);

        // Try the simplified filtering approach using provided values
        let filteredResult = await createFilteredResourceManagerSimple(system, filterValues, {
          partialContextMatch: true,
          enableDebugLogging: true, // Enable debug logging to see what's happening
          reduceQualifiers: filterState.state.reduceQualifiers
        });

        if (filteredResult.isFailure()) {
          const result: FilterResult = {
            success: false,
            error: `Filtering failed: ${filteredResult.message}`,
            filteredResources: [],
            warnings: []
          };
          setFilterResult(result);
          viewState.addMessage('error', `Filtering failed: ${filteredResult.message}`);
          return result;
        }

        // Analyze filtered resources compared to original
        const originalResources = resourceData.state.processedResources.summary.resourceIds || [];
        console.log('Original resources count:', originalResources.length);

        const analysis = analyzeFilteredResources(
          originalResources,
          filteredResult.value,
          resourceData.state.processedResources
        );

        console.log('Analysis result:', {
          success: analysis.success,
          filteredResourcesCount: analysis.filteredResources.length,
          warningsCount: analysis.warnings.length,
          hasProcessedResources: !!analysis.processedResources
        });

        console.log(
          'Filtered resources breakdown:',
          analysis.filteredResources.map((r) => ({
            id: r.id,
            originalCandidates: r.originalCandidateCount,
            filteredCandidates: r.filteredCandidateCount,
            reduction: r.originalCandidateCount - r.filteredCandidateCount,
            hasWarning: r.hasWarning
          }))
        );

        const result: FilterResult = {
          success: true,
          processedResources: analysis.processedResources,
          filteredResources: analysis.filteredResources,
          warnings: analysis.warnings
        };

        console.log('Setting filter result:', result);
        setFilterResult(result);

        if (analysis.warnings.length > 0) {
          viewState.addMessage('warning', `Filtering completed with ${analysis.warnings.length} warning(s)`);
        } else {
          viewState.addMessage(
            'success',
            `Filtering completed: ${analysis.filteredResources.length} resources`
          );
        }

        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const result: FilterResult = {
          success: false,
          error: errorMessage,
          filteredResources: [],
          warnings: []
        };
        setFilterResult(result);
        viewState.addMessage('error', `Filtering error: ${errorMessage}`);
        return result;
      } finally {
        isFilteringInProgress.current = false;
      }
    },
    [resourceData.state.processedResources, filterState.state, viewState]
  );

  // Manual apply filter action (for the Apply button)
  const applyFilter = useCallback(async (): Promise<FilterResult | null> => {
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
    viewState.addMessage('info', 'Filter reset');
  }, [filterState.actions, viewState]);

  // Automatically apply filter when applied filter values change
  // TEMPORARILY DISABLED to fix responsiveness issue
  // React.useEffect(() => {
  //   if (!resourceData.state.processedResources || !filterState.state.enabled) {
  //     setFilterResult(null);
  //     return;
  //   }

  //   const hasAppliedFilterValues = hasFilterValues(filterState.state.appliedValues);
  //   if (!hasAppliedFilterValues) {
  //     setFilterResult(null);
  //     return;
  //   }

  //   // Apply filter automatically when appliedValues change using the applied values
  //   performFiltering(filterState.state.appliedValues);
  // }, [
  //   filterState.state.appliedValues,
  //   filterState.state.enabled,
  //   resourceData.state.processedResources,
  //   performFiltering
  // ]);

  // Combined state
  const state: OrchestratorState = useMemo(
    () => ({
      resources: resourceData.state.processedResources,
      configuration: resourceData.state.activeConfiguration,
      filterState: filterState.state,
      filterResult,
      resolutionState: resolutionData.state,
      selectedResourceId: viewState.selectedResourceId,
      isProcessing: resourceData.state.isProcessing,
      error: resourceData.state.error,
      messages: viewState.messages
    }),
    [
      resourceData.state,
      filterState.state,
      filterResult,
      resolutionData.state,
      viewState.selectedResourceId,
      viewState.messages
    ]
  );

  // Combined actions
  const actions: OrchestratorActions = useMemo(
    () => ({
      // Resource management
      importDirectory: async (directory: ImportedDirectory) => {
        viewState.addMessage('info', 'Importing directory...');
        await resourceData.actions.processDirectory(directory);
        if (!resourceData.state.error) {
          viewState.addMessage('success', 'Directory imported successfully');
        } else {
          viewState.addMessage('error', resourceData.state.error);
        }
      },
      importDirectoryWithConfig: async (
        directory: ImportedDirectory,
        config: Config.Model.ISystemConfiguration
      ) => {
        viewState.addMessage('info', 'Importing directory with configuration...');
        await resourceData.actions.processDirectoryWithConfig(directory, config);
        if (!resourceData.state.error) {
          viewState.addMessage('success', 'Directory imported successfully');
        } else {
          viewState.addMessage('error', resourceData.state.error);
        }
      },
      importFiles: async (files: ImportedFile[]) => {
        viewState.addMessage('info', 'Importing files...');
        await resourceData.actions.processFiles(files);
        if (!resourceData.state.error) {
          viewState.addMessage('success', 'Files imported successfully');
        }
      },
      importBundle: async (bundle: Bundle.IBundle) => {
        viewState.addMessage('info', 'Importing bundle...');
        await resourceData.actions.processBundleFile(bundle);
        if (!resourceData.state.error) {
          viewState.addMessage('success', 'Bundle imported successfully');
        }
      },
      clearResources: () => {
        resourceData.actions.reset();
        setFilterResult(null);
        viewState.addMessage('info', 'Resources cleared');
      },

      // Configuration management
      updateConfiguration: (config: Config.Model.ISystemConfiguration) => {
        resourceData.actions.applyConfiguration(config);
        viewState.addMessage('info', 'Configuration updated');
      },
      applyConfiguration: (config: Config.Model.ISystemConfiguration) => {
        resourceData.actions.applyConfiguration(config);
        viewState.addMessage('success', 'Configuration applied');
      },

      // Filter management
      updateFilterState: (updates: Partial<FilterState>) => {
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
      applyResourceEdits: resolutionData.actions.applyEdits,
      discardResourceEdits: resolutionData.actions.discardEdits,

      // Resource creation actions
      startNewResource: resolutionData.actions.startNewResource,
      updateNewResourceId: resolutionData.actions.updateNewResourceId,
      selectResourceType: resolutionData.actions.selectResourceType,
      saveNewResourceAsPending: resolutionData.actions.saveNewResourceAsPending,
      cancelNewResource: resolutionData.actions.cancelNewResource,
      removePendingResource: resolutionData.actions.removePendingResource,
      markResourceForDeletion: resolutionData.actions.markResourceForDeletion,
      applyPendingResources: resolutionData.actions.applyPendingResources,
      discardPendingResources: resolutionData.actions.discardPendingResources,

      // Combined apply/discard removed; use applyPendingResources/discard* directly

      // UI state management
      selectResource: viewState.selectResource,
      addMessage: viewState.addMessage,
      clearMessages: viewState.clearMessages,

      // Resource resolution
      resolveResource: resourceData.actions.resolveResource
    }),
    [resourceData.actions, filterState.actions, resolutionData.actions, viewState, applyFilter, resetFilter]
  );

  return <>{children({ state, actions })}</>;
};

export default ResourceOrchestrator;
