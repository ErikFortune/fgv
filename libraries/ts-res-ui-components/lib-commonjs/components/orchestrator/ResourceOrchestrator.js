'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.ResourceOrchestrator = void 0;
const tslib_1 = require('tslib');
const react_1 = tslib_1.__importStar(require('react'));
const contexts_1 = require('../../contexts');
const ts_res_1 = require('@fgv/ts-res');
const ObservabilityTools = tslib_1.__importStar(require('../../utils/observability'));
const useResourceData_1 = require('../../hooks/useResourceData');
const useFilterState_1 = require('../../hooks/useFilterState');
const useViewState_1 = require('../../hooks/useViewState');
const useResolutionState_1 = require('../../hooks/useResolutionState');
const filterResources_1 = require('../../utils/filterResources');
const downloadHelper_1 = require('../../utils/downloadHelper');
/**
 * Internal orchestrator component that has access to observability context via hook.
 */
const ResourceOrchestratorInternal = ({
  children,
  initialConfiguration,
  qualifierTypeFactory,
  resourceTypeFactory,
  onStateChange
}) => {
  // Get observability context from provider
  const o11y = (0, contexts_1.useObservability)();
  // Core hooks
  const resourceData = (0, useResourceData_1.useResourceData)({
    qualifierTypeFactory,
    resourceTypeFactory,
    o11y
  });
  const filterState = (0, useFilterState_1.useFilterState)();
  const viewState = (0, useViewState_1.useViewState)();
  // System update handler for resolution editing
  const handleSystemUpdate = (0, react_1.useCallback)(
    (updatedResources) => {
      resourceData.actions.updateProcessedResources(updatedResources);
      viewState.addMessage('success', 'Resource system updated with edits');
    },
    [resourceData.actions, viewState]
  );
  const resolutionData = (0, useResolutionState_1.useResolutionState)(
    resourceData.state.processedResources,
    viewState.addMessage,
    handleSystemUpdate
  );
  // Local state for filter results
  const [filterResult, setFilterResult] = (0, react_1.useState)(null);
  // Track if filtering is in progress to prevent concurrent operations
  const isFilteringInProgress = react_1.default.useRef(false);
  // Initialize with configuration if provided
  react_1.default.useEffect(() => {
    if (initialConfiguration && !resourceData.state.activeConfiguration) {
      resourceData.actions.applyConfiguration(initialConfiguration);
    }
  }, [initialConfiguration, resourceData.state.activeConfiguration, resourceData.actions]);
  // Notify parent of state changes
  react_1.default.useEffect(() => {
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
  const performFiltering = (0, react_1.useCallback)(
    async (filterValues) => {
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
        viewState.addMessage('info', 'Starting filtering process...');
        o11y.diag.info('Filtering with values:', filterValues);
        o11y.diag.info('Filter state:', filterState.state);
        // Try the simplified filtering approach using provided values
        let filteredResult = await (0, filterResources_1.createFilteredResourceManagerSimple)(
          system,
          filterValues,
          {
            partialContextMatch: true,
            enableDebugLogging: false, // Disable debug logging to reduce console output
            reduceQualifiers: filterState.state.reduceQualifiers
          }
        );
        if (filteredResult.isFailure()) {
          const result = {
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
        o11y.diag.info('Original resources count:', originalResources.length);
        const analysis = (0, filterResources_1.analyzeFilteredResources)(
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
        const result = {
          success: true,
          processedResources: analysis.processedResources,
          filteredResources: analysis.filteredResources,
          warnings: analysis.warnings
        };
        o11y.diag.info('Setting filter result:', result);
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
        const result = {
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
  const applyFilter = (0, react_1.useCallback)(async () => {
    // Capture the current values before applying them
    const currentValues = { ...filterState.state.values };
    // First apply the pending values to make them the applied values
    filterState.actions.applyFilterValues();
    // Then perform filtering with the captured values
    const result = await performFiltering(currentValues);
    return result;
  }, [performFiltering, filterState.actions]);
  // Reset filter action
  const resetFilter = (0, react_1.useCallback)(() => {
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
  const state = (0, react_1.useMemo)(
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
  const actions = (0, react_1.useMemo)(
    () => ({
      // Resource management
      importDirectory: async (directory) => {
        viewState.addMessage('info', 'Importing directory...');
        const result = await resourceData.actions.processDirectory(directory);
        if (result.isSuccess()) {
          viewState.addMessage('success', 'Directory imported successfully');
        } else {
          viewState.addMessage('error', result.message);
        }
      },
      importDirectoryWithConfig: async (directory, config) => {
        viewState.addMessage('info', 'Importing directory with configuration...');
        await resourceData.actions.processDirectoryWithConfig(directory, config);
        if (!resourceData.state.error) {
          viewState.addMessage('success', 'Directory imported successfully');
        } else {
          viewState.addMessage('error', resourceData.state.error);
        }
      },
      importFiles: async (files) => {
        viewState.addMessage('info', 'Importing files...');
        await resourceData.actions.processFiles(files);
        if (!resourceData.state.error) {
          viewState.addMessage('success', 'Files imported successfully');
        }
      },
      importBundle: async (bundle) => {
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
      updateConfiguration: (config) => {
        resourceData.actions.applyConfiguration(config);
        viewState.addMessage('info', 'Configuration updated');
      },
      applyConfiguration: (config) => {
        resourceData.actions.applyConfiguration(config);
        viewState.addMessage('success', 'Configuration applied');
      },
      // Filter management
      updateFilterState: (updates) => {
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
          viewState.addMessage(
            'error',
            'Export bundle failed: No resource manager or configuration available'
          );
          return;
        }
        // Use proper Result chaining with side effects
        const result = ts_res_1.Config.SystemConfiguration.create(resources.activeConfiguration)
          .onSuccess((systemConfig) =>
            ts_res_1.Bundle.BundleBuilder.create(resources.system.resourceManager, systemConfig)
          )
          .onSuccess((bundle) =>
            downloadHelper_1.DownloadUtils.downloadBundle(bundle, resources.resourceCount)
          );
        // Handle final result with side effects
        if (result.isSuccess()) {
          viewState.addMessage('success', 'Bundle exported successfully');
        } else {
          viewState.addMessage('error', `Export bundle failed: ${result.message}`);
        }
      },
      exportSource: () => {
        const resources = resourceData.state.processedResources;
        if (!resources) {
          viewState.addMessage('error', 'Export source failed: No processed resources available');
          return;
        }
        // Use proper Result chaining with side effects
        const result = downloadHelper_1.DownloadUtils.downloadSourceResources(
          resources,
          resources.resourceCount
        );
        // Handle result with side effects
        if (result.isSuccess()) {
          viewState.addMessage('success', 'Source resources exported successfully');
        } else {
          viewState.addMessage('error', `Export source failed: ${result.message}`);
        }
      },
      exportCompiled: () => {
        const resources = resourceData.state.processedResources;
        if (!resources || !resources.compiledCollection) {
          viewState.addMessage('error', 'Export compiled failed: No compiled resources available');
          return;
        }
        // Use proper Result chaining with side effects
        const result = downloadHelper_1.DownloadUtils.downloadCompiledResources(
          resources.compiledCollection,
          resources.resourceCount
        );
        // Handle result with side effects
        if (result.isSuccess()) {
          viewState.addMessage('success', 'Compiled resources exported successfully');
        } else {
          viewState.addMessage('error', `Export compiled failed: ${result.message}`);
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
    [resourceData.actions, filterState.actions, resolutionData.actions, viewState, applyFilter, resetFilter]
  );
  return react_1.default.createElement(react_1.default.Fragment, null, children({ state, actions }));
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
const ResourceOrchestrator = ({
  observabilityContext = ObservabilityTools.DefaultObservabilityContext,
  ...props
}) =>
  react_1.default.createElement(
    contexts_1.ObservabilityProvider,
    { observabilityContext: observabilityContext },
    react_1.default.createElement(ResourceOrchestratorInternal, { ...props })
  );
exports.ResourceOrchestrator = ResourceOrchestrator;
exports.default = exports.ResourceOrchestrator;
//# sourceMappingURL=ResourceOrchestrator.js.map
