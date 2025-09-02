'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.FilterView = void 0;
const tslib_1 = require('tslib');
const react_1 = tslib_1.__importStar(require('react'));
const outline_1 = require('@heroicons/react/24/outline');
const QualifierContextControl_1 = require('../../common/QualifierContextControl');
const ResourcePicker_1 = require('../../pickers/ResourcePicker');
const SourceResourceDetail_1 = require('../../common/SourceResourceDetail');
const ResourcePickerOptionsControl_1 = require('../../common/ResourcePickerOptionsControl');
const ResolutionContextOptionsControl_1 = require('../../common/ResolutionContextOptionsControl');
const contexts_1 = require('../../../contexts');
/**
 * FilterView component for context-based resource filtering and analysis.
 *
 * Provides a comprehensive interface for filtering resources based on qualifier values,
 * displaying filtered results with candidate count comparisons, and exporting filtered
 * resource collections. Supports partial context matching and qualifier reduction.
 *
 * **Key Features:**
 * - **Context-based filtering**: Filter resources using qualifier values (language, territory, etc.)
 * - **Candidate analysis**: Compare original vs filtered candidate counts for each resource
 * - **Visual indicators**: Highlight resources with reduced candidates or warnings
 * - **Export functionality**: Export filtered resource collections as JSON
 * - **Dual resource comparison**: View original and filtered resource details side-by-side
 * - **Qualifier reduction**: Option to remove perfectly matching qualifiers from results
 *
 * @example
 * ```tsx
 * import { FilterView } from '@fgv/ts-res-ui-components';
 *
 * function MyFilterTool() {
 *   const [filterState, setFilterState] = useState({
 *     enabled: false,
 *     values: {},
 *     appliedValues: {},
 *     hasPendingChanges: false,
 *     reduceQualifiers: false
 *   });
 *
 *   return (
 *     <FilterView
 *       resources={processedResources}
 *       filterState={filterState}
 *       filterActions={{
 *         updateFilterEnabled: (enabled) => setFilterState(prev => ({...prev, enabled})),
 *         updateFilterValues: (values) => setFilterState(prev => ({...prev, values})),
 *         applyFilterValues: () => setFilterState(prev => ({...prev, appliedValues: prev.values})),
 *         resetFilterValues: () => setFilterState(prev => ({...prev, values: {}})),
 *         updateReduceQualifiers: (reduce) => setFilterState(prev => ({...prev, reduceQualifiers: reduce}))
 *       }}
 *       onFilterResult={(result) => console.log('Filter result:', result)}
 *       onMessage={(type, message) => console.log(`${type}: ${message}`)}
 *     />
 *   );
 * }
 * ```
 *
 * @public
 */
const FilterView = ({
  resources,
  filterState,
  filterActions,
  filterResult,
  onFilterResult,
  onMessage,
  pickerOptions,
  pickerOptionsPresentation = 'hidden',
  contextOptions,
  className = ''
}) => {
  // Get observability context
  const o11y = (0, contexts_1.useObservability)();
  // Local UI state
  const [selectedResourceId, setSelectedResourceId] = (0, react_1.useState)(null);
  const [showFilteredJsonView, setShowFilteredJsonView] = (0, react_1.useState)(false);
  // State for picker options control
  const [currentPickerOptions, setCurrentPickerOptions] = (0, react_1.useState)(pickerOptions || {});
  // State for context options control
  const [currentContextOptions, setCurrentContextOptions] = (0, react_1.useState)(contextOptions || {});
  // Merge picker options with filter-specific defaults
  const effectivePickerOptions = (0, react_1.useMemo)(
    () => ({
      defaultView: 'list',
      showViewToggle: true,
      enableSearch: true,
      searchPlaceholder: 'Search resources...',
      searchScope: 'all',
      height: '520px',
      emptyMessage: 'No resources available',
      // Override with user-provided options
      ...pickerOptions,
      // Override with current picker options from control
      ...currentPickerOptions
    }),
    [pickerOptions, currentPickerOptions]
  );
  // Available qualifiers from system configuration or compiled collection
  const availableQualifiers = (0, react_1.useMemo)(() => {
    if (resources?.compiledCollection.qualifiers) {
      return resources.compiledCollection.qualifiers.map((q) => q.name);
    }
    // Fallback to default qualifiers if no compiled collection
    return ['language', 'territory', 'currentTerritory', 'role', 'env'];
  }, [resources?.compiledCollection.qualifiers]);
  // Merge context options with current options from control
  const effectiveContextOptions = (0, react_1.useMemo)(
    () => ({
      ...contextOptions,
      ...currentContextOptions
    }),
    [contextOptions, currentContextOptions]
  );
  // Handle filter value changes using the shared component's callback pattern
  const handleQualifierChange = (0, react_1.useCallback)(
    (qualifierName, value) => {
      // Don't update filter values if this qualifier is host-managed
      const qualifierOptions = effectiveContextOptions?.qualifierOptions?.[qualifierName];
      const isHostManaged = qualifierOptions?.hostValue !== undefined;
      if (!isHostManaged) {
        const newValues = { ...filterState.values, [qualifierName]: value };
        filterActions.updateFilterValues(newValues);
      }
    },
    [filterState.values, filterActions, effectiveContextOptions?.qualifierOptions]
  );
  // Check if we have any applied filter values set
  const hasAppliedFilterValues = (0, react_1.useMemo)(() => {
    if (!filterState.appliedValues) return false;
    return Object.values(filterState.appliedValues).some((value) => value !== undefined && value !== '');
  }, [filterState.appliedValues]);
  // Determine if filtering is active (enabled AND has applied values)
  const isFilteringActive = filterState.enabled && hasAppliedFilterValues;
  // Simplified filter summary
  const getFilterSummary = (0, react_1.useCallback)((values) => {
    const activeFilters = Object.entries(values)
      .filter(([, value]) => value !== undefined && value !== '')
      .map(([key, value]) => `${key}=${value}`);
    return activeFilters.length > 0 ? activeFilters.join(', ') : 'No filters';
  }, []);
  // Get filtered resource collection data (simplified)
  const getFilteredResourceCollectionData = (0, react_1.useCallback)(() => {
    if (!filterResult?.processedResources?.system.resourceManager) {
      return null;
    }
    const resourceManager = filterResult.processedResources.system.resourceManager;
    // Check if this is a ResourceManagerBuilder (has getResourceCollectionDecl method)
    if ('getResourceCollectionDecl' in resourceManager) {
      const collectionResult = resourceManager.getResourceCollectionDecl();
      if (collectionResult.isSuccess()) {
        return {
          ...collectionResult.value,
          metadata: {
            exportedAt: new Date().toISOString(),
            totalResources: filterResult.processedResources.resourceCount,
            type: 'ts-res-filtered-resource-collection',
            filterContext: filterState.appliedValues,
            reduceQualifiers: filterState.reduceQualifiers
          }
        };
      } else {
        onMessage?.('error', `Failed to get filtered resource collection: ${collectionResult.message}`);
        return null;
      }
    } else if (filterResult.processedResources.compiledCollection) {
      // For IResourceManager from bundles, use the compiled collection directly
      return {
        resources: filterResult.processedResources.compiledCollection.resources || [],
        metadata: {
          exportedAt: new Date().toISOString(),
          totalResources: filterResult.processedResources.resourceCount,
          type: 'ts-res-filtered-resource-collection',
          filterContext: filterState.appliedValues,
          reduceQualifiers: filterState.reduceQualifiers
        }
      };
    } else {
      onMessage?.('error', 'Filtered resource collection data not available');
      return null;
    }
  }, [filterResult, onMessage, filterState.appliedValues, filterState.reduceQualifiers]);
  // Export filtered resource collection data
  const handleExportFilteredData = (0, react_1.useCallback)(() => {
    try {
      const collectionData = getFilteredResourceCollectionData();
      if (!collectionData) {
        onMessage?.('error', 'No filtered collection data available to export');
        return;
      }
      const filterSummary = getFilterSummary(filterState.appliedValues);
      // Use onExport callback instead of direct file download for flexibility
      // onExport?.(collectionData, 'json');
      onMessage?.('success', 'Filtered resource collection exported successfully');
    } catch (error) {
      onMessage?.(
        'error',
        `Failed to export filtered resource collection: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }, [getFilteredResourceCollectionData, onMessage, filterState.appliedValues, getFilterSummary]);
  // Get resources to display (filtered or original) - now uses orchestrator's filterResult
  const displayResources = (0, react_1.useMemo)(() => {
    o11y.diag.info('FilterView displayResources calculation:', {
      hasResources: !!resources,
      isFilteringActive,
      filterResultExists: !!filterResult,
      filterResultSuccess: filterResult?.success,
      filterResultCount: filterResult?.filteredResources?.length,
      appliedValues: filterState.appliedValues,
      hasAppliedFilterValues
    });
    if (!resources) return [];
    let resourceList = [];
    if (isFilteringActive && filterResult?.success && filterResult.filteredResources) {
      o11y.diag.info('Using filtered resources:', filterResult.filteredResources.length);
      o11y.diag.info(
        'Filtered resource details:',
        filterResult.filteredResources.map((r) => ({
          id: r.id,
          original: r.originalCandidateCount,
          filtered: r.filteredCandidateCount,
          hasWarning: r.hasWarning
        }))
      );
      resourceList = filterResult.filteredResources;
    } else {
      // Return original resources
      o11y.diag.info('Using original resources');
      const originalResources = resources.summary.resourceIds || [];
      resourceList = originalResources.map((id) => {
        const resourceResult = resources.system.resourceManager.getBuiltResource(id);
        const candidateCount = resourceResult.isSuccess() ? resourceResult.value.candidates.length : 0;
        return {
          id,
          originalCandidateCount: candidateCount,
          filteredCandidateCount: candidateCount,
          hasWarning: false
        };
      });
    }
    // Sort resources alphabetically by id
    return resourceList.sort((a, b) => a.id.localeCompare(b.id));
  }, [resources, isFilteringActive, filterResult]);
  // Create resource annotations for filtering information
  const resourceAnnotations = (0, react_1.useMemo)(() => {
    const annotations = {};
    displayResources.forEach((resource) => {
      if (isFilteringActive) {
        // Show filtering effects with candidate count changes
        const originalCount = resource.originalCandidateCount;
        const filteredCount = resource.filteredCandidateCount;
        // Determine badge color and text based on filtering result
        let badgeVariant = 'info';
        let badgeText = `${originalCount} → ${filteredCount}`;
        if (filteredCount === 0) {
          badgeVariant = 'error';
          badgeText = `${originalCount} → 0`;
        } else if (filteredCount < originalCount) {
          badgeVariant = 'warning';
        }
        annotations[resource.id] = {
          badge: {
            text: badgeText,
            variant: badgeVariant
          }
        };
        // Add warning indicator for resources with issues
        if (resource.hasWarning) {
          annotations[resource.id].indicator = {
            type: 'icon',
            value: '⚠️',
            tooltip: 'No matching candidates after filtering'
          };
        }
      } else {
        // Show candidate count only for non-filtered view
        const count = resource.originalCandidateCount;
        annotations[resource.id] = {
          suffix: `${count} candidate${count !== 1 ? 's' : ''}`
        };
      }
    });
    return annotations;
  }, [displayResources, isFilteringActive]);
  // Determine which qualifiers to show and their options
  const visibleQualifiers = (0, react_1.useMemo)(() => {
    if (!effectiveContextOptions?.qualifierOptions) {
      return availableQualifiers;
    }
    return availableQualifiers.filter((qualifierName) => {
      const options = effectiveContextOptions.qualifierOptions[qualifierName];
      return options?.visible !== false;
    });
  }, [availableQualifiers, effectiveContextOptions?.qualifierOptions]);
  // Get effective filter values including host-managed values
  const effectiveFilterValues = (0, react_1.useMemo)(() => {
    const baseValues = filterState.values || {};
    const hostValues = effectiveContextOptions?.hostManagedValues || {};
    return { ...baseValues, ...hostValues };
  }, [filterState.values, effectiveContextOptions?.hostManagedValues]);
  // Handle filter value changes
  const handleFilterChange = (0, react_1.useCallback)(
    (qualifierName, value) => {
      const newValues = { ...filterState.values, [qualifierName]: value };
      filterActions.updateFilterValues(newValues);
    },
    [filterState.values, filterActions]
  );
  // Handle resource selection with enhanced callback
  const handleResourceSelect = (0, react_1.useCallback)((selection) => {
    setSelectedResourceId(selection.resourceId);
  }, []);
  // Handle filter toggle
  const handleFilterToggle = (0, react_1.useCallback)(
    (enabled) => {
      filterActions.updateFilterEnabled(enabled);
      if (!enabled) {
        onMessage?.('info', 'Filtering disabled - showing all resources');
      } else {
        onMessage?.('info', 'Filtering enabled - set qualifier values and click Apply to filter resources');
      }
    },
    [filterActions, onMessage]
  );
  // Handle apply filter values
  const handleApplyFilter = (0, react_1.useCallback)(() => {
    filterActions.applyFilterValues();
    onMessage?.('info', 'Filter applied - processing resources...');
  }, [filterActions, onMessage]);
  // Handle reset filter values
  const handleResetFilter = (0, react_1.useCallback)(() => {
    filterActions.resetFilterValues();
    onMessage?.('info', 'Filter values reset');
  }, [filterActions, onMessage]);
  if (!resources) {
    return react_1.default.createElement(
      'div',
      { className: `p-6 ${className}` },
      react_1.default.createElement(
        'div',
        { className: 'flex items-center space-x-3 mb-6' },
        react_1.default.createElement(outline_1.FunnelIcon, { className: 'h-8 w-8 text-purple-600' }),
        react_1.default.createElement('h2', { className: 'text-2xl font-bold text-gray-900' }, 'Filter Tool')
      ),
      react_1.default.createElement(
        'div',
        { className: 'bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center' },
        react_1.default.createElement(
          'div',
          { className: 'max-w-2xl mx-auto' },
          react_1.default.createElement(
            'h3',
            { className: 'text-xl font-semibold text-gray-900 mb-4' },
            'No Resources Loaded'
          ),
          react_1.default.createElement(
            'p',
            { className: 'text-gray-600 mb-6' },
            'Import resources first to use the filter tool for context-based resource filtering.'
          ),
          react_1.default.createElement(
            'div',
            { className: 'bg-purple-50 rounded-lg p-4' },
            react_1.default.createElement(
              'p',
              { className: 'text-sm text-purple-800' },
              react_1.default.createElement('strong', null, 'Filter Tool:'),
              ' Allows you to filter resources based on partial context matching, creating focused subsets for analysis and testing.'
            )
          )
        )
      )
    );
  }
  return react_1.default.createElement(
    'div',
    { className: `p-6 ${className}` },
    react_1.default.createElement(
      'div',
      { className: 'flex items-center space-x-3 mb-6' },
      react_1.default.createElement(outline_1.FunnelIcon, { className: 'h-8 w-8 text-purple-600' }),
      react_1.default.createElement('h2', { className: 'text-2xl font-bold text-gray-900' }, 'Filter Tool')
    ),
    react_1.default.createElement(ResourcePickerOptionsControl_1.ResourcePickerOptionsControl, {
      options: currentPickerOptions,
      onOptionsChange: setCurrentPickerOptions,
      presentation: pickerOptionsPresentation,
      title: 'Filter Tool Picker Options',
      className: 'mb-6'
    }),
    react_1.default.createElement(ResolutionContextOptionsControl_1.ResolutionContextOptionsControl, {
      options: currentContextOptions,
      onOptionsChange: setCurrentContextOptions,
      availableQualifiers: availableQualifiers,
      presentation: pickerOptionsPresentation,
      title: 'Filter Context Options',
      className: 'mb-6'
    }),
    react_1.default.createElement(
      'div',
      { className: 'bg-white rounded-lg shadow-sm border border-gray-200 p-6' },
      react_1.default.createElement(
        'div',
        { className: 'mb-6' },
        react_1.default.createElement(
          'div',
          { className: 'flex items-center justify-between mb-4' },
          react_1.default.createElement(
            'h3',
            { className: 'text-lg font-semibold text-gray-900' },
            'Filter Controls'
          ),
          react_1.default.createElement(
            'div',
            { className: 'flex items-center justify-between' },
            react_1.default.createElement(
              'div',
              { className: 'flex items-center space-x-4' },
              react_1.default.createElement(
                'label',
                { className: 'flex items-center' },
                react_1.default.createElement('input', {
                  type: 'checkbox',
                  checked: filterState.enabled,
                  onChange: (e) => handleFilterToggle(e.target.checked),
                  className: 'rounded border-gray-300 text-purple-600 focus:ring-purple-500'
                }),
                react_1.default.createElement(
                  'span',
                  { className: 'ml-2 text-sm text-gray-700' },
                  'Enable Filtering'
                )
              ),
              react_1.default.createElement(
                'label',
                {
                  className: 'flex items-center',
                  title:
                    'Remove perfectly matching qualifier conditions from filtered resources to create cleaner bundles for comparison'
                },
                react_1.default.createElement('input', {
                  type: 'checkbox',
                  checked: filterState.reduceQualifiers,
                  onChange: (e) => filterActions.updateReduceQualifiers(e.target.checked),
                  disabled: !filterState.enabled,
                  className:
                    'rounded border-gray-300 text-purple-600 focus:ring-purple-500 disabled:text-gray-400'
                }),
                react_1.default.createElement(
                  'span',
                  { className: `ml-2 text-sm ${!filterState.enabled ? 'text-gray-400' : 'text-gray-700'}` },
                  'Reduce Qualifiers'
                )
              ),
              isFilteringActive &&
                react_1.default.createElement(
                  'span',
                  {
                    className:
                      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800'
                  },
                  'Active',
                  filterState.reduceQualifiers ? ' + Reducing' : ''
                ),
              filterState.hasPendingChanges &&
                filterState.enabled &&
                react_1.default.createElement(
                  'span',
                  {
                    className:
                      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800'
                  },
                  'Pending Changes'
                )
            ),
            filterState.enabled &&
              react_1.default.createElement(
                'div',
                { className: 'flex items-center space-x-2' },
                react_1.default.createElement(
                  'button',
                  {
                    onClick: handleResetFilter,
                    className:
                      'inline-flex items-center px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500'
                  },
                  react_1.default.createElement(outline_1.XMarkIcon, { className: 'h-4 w-4 mr-1' }),
                  'Reset'
                ),
                react_1.default.createElement(
                  'button',
                  {
                    onClick: handleApplyFilter,
                    disabled: !filterState.hasPendingChanges,
                    className: `inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                      filterState.hasPendingChanges
                        ? 'text-white bg-purple-600 hover:bg-purple-700'
                        : 'text-gray-400 bg-gray-300 cursor-not-allowed'
                    }`
                  },
                  react_1.default.createElement(outline_1.CheckIcon, { className: 'h-4 w-4 mr-1' }),
                  'Apply'
                )
              )
          )
        )
      ),
      effectiveContextOptions?.showContextControls !== false &&
        react_1.default.createElement(
          'div',
          { className: 'mb-6' },
          react_1.default.createElement(
            'h3',
            { className: 'text-lg font-semibold text-gray-900 mb-4' },
            effectiveContextOptions?.contextPanelTitle || 'Context Filters'
          ),
          react_1.default.createElement(
            'div',
            {
              className: `bg-gray-50 rounded-lg p-4 ${effectiveContextOptions?.contextPanelClassName || ''}`
            },
            react_1.default.createElement(
              'div',
              { className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3' },
              visibleQualifiers.map((qualifierName) => {
                const qualifierOptions = effectiveContextOptions?.qualifierOptions?.[qualifierName];
                const hostManagedValue = effectiveContextOptions?.hostManagedValues?.[qualifierName];
                const globalPlaceholder =
                  typeof effectiveContextOptions?.globalPlaceholder === 'function'
                    ? effectiveContextOptions.globalPlaceholder(qualifierName)
                    : effectiveContextOptions?.globalPlaceholder;
                // Merge host-managed values with qualifier options
                const mergedOptions = {
                  ...qualifierOptions,
                  // Host-managed values override qualifier-specific host values
                  hostValue: hostManagedValue !== undefined ? hostManagedValue : qualifierOptions?.hostValue,
                  // Apply filter-enabled state to editability
                  editable: filterState.enabled && qualifierOptions?.editable !== false
                };
                return react_1.default.createElement(QualifierContextControl_1.QualifierContextControl, {
                  key: qualifierName,
                  qualifierName: qualifierName,
                  value: filterState.values[qualifierName],
                  onChange: handleQualifierChange,
                  disabled: !filterState.enabled,
                  placeholder: globalPlaceholder || `Filter by ${qualifierName}`,
                  resources: resources,
                  options: mergedOptions
                });
              })
            ),
            filterState.enabled &&
              effectiveContextOptions?.showCurrentContext !== false &&
              react_1.default.createElement(
                'div',
                { className: 'mt-3 text-sm text-gray-600' },
                react_1.default.createElement(
                  'div',
                  { className: 'flex items-center justify-between' },
                  react_1.default.createElement(
                    'div',
                    { className: 'space-y-1' },
                    react_1.default.createElement(
                      'p',
                      null,
                      react_1.default.createElement('strong', null, 'Pending:'),
                      ' ',
                      getFilterSummary(effectiveFilterValues)
                    ),
                    isFilteringActive &&
                      react_1.default.createElement(
                        'p',
                        null,
                        react_1.default.createElement('strong', null, 'Applied:'),
                        ' ',
                        getFilterSummary(filterState.appliedValues)
                      )
                  )
                ),
                filterResult &&
                  !filterResult.success &&
                  filterResult.error &&
                  react_1.default.createElement(
                    'p',
                    { className: 'text-red-600 text-xs mt-1' },
                    react_1.default.createElement('strong', null, 'Error:'),
                    ' ',
                    filterResult.error
                  )
              )
          )
        ),
      react_1.default.createElement(
        'div',
        { className: 'flex flex-col md:flex-row gap-6 h-[600px]' },
        react_1.default.createElement(
          'div',
          { className: 'md:w-1/2 flex flex-col' },
          react_1.default.createElement(
            'div',
            { className: 'flex items-center justify-between mb-4' },
            react_1.default.createElement(
              'div',
              null,
              react_1.default.createElement(
                'h3',
                { className: 'text-lg font-semibold text-gray-900' },
                isFilteringActive ? 'Filtered Resources' : 'All Resources'
              ),
              isFilteringActive &&
                displayResources.some((r) => r.hasWarning) &&
                react_1.default.createElement(
                  'div',
                  { className: 'flex items-center space-x-2 text-sm text-gray-500 mt-1' },
                  react_1.default.createElement(
                    'span',
                    { className: 'text-amber-600 flex items-center' },
                    react_1.default.createElement(outline_1.ExclamationTriangleIcon, {
                      className: 'h-4 w-4 mr-1'
                    }),
                    displayResources.filter((r) => r.hasWarning).length,
                    ' warnings'
                  )
                )
            )
          ),
          react_1.default.createElement(
            'div',
            { className: 'flex-1' },
            react_1.default.createElement(ResourcePicker_1.ResourcePicker, {
              resources:
                isFilteringActive && filterResult?.processedResources
                  ? filterResult.processedResources
                  : resources,
              selectedResourceId: selectedResourceId,
              onResourceSelect: handleResourceSelect,
              resourceAnnotations: resourceAnnotations,
              options: {
                ...effectivePickerOptions,
                searchPlaceholder: isFilteringActive
                  ? 'Search filtered resources...'
                  : effectivePickerOptions.searchPlaceholder,
                emptyMessage: isFilteringActive
                  ? 'No resources match the filter criteria'
                  : effectivePickerOptions.emptyMessage
              },
              onMessage: onMessage
            })
          )
        ),
        react_1.default.createElement(
          'div',
          { className: 'md:w-1/2 flex flex-col' },
          react_1.default.createElement(
            'div',
            { className: 'flex items-center justify-between mb-4' },
            react_1.default.createElement(
              'h3',
              { className: 'text-lg font-semibold text-gray-900' },
              'Resource Details'
            )
          ),
          react_1.default.createElement(
            'div',
            { className: 'flex-1 overflow-y-auto border border-gray-200 rounded-lg p-4 bg-gray-50' },
            !selectedResourceId
              ? react_1.default.createElement(
                  'div',
                  { className: 'flex items-center justify-center h-full' },
                  react_1.default.createElement(
                    'div',
                    { className: 'text-center' },
                    react_1.default.createElement(outline_1.FunnelIcon, {
                      className: 'h-12 w-12 text-gray-400 mx-auto mb-4'
                    }),
                    react_1.default.createElement(
                      'p',
                      { className: 'text-gray-500' },
                      'Select a resource to view details'
                    ),
                    isFilteringActive &&
                      react_1.default.createElement(
                        'p',
                        { className: 'text-sm text-gray-400 mt-2' },
                        'Showing resources that match your filter criteria'
                      )
                  )
                )
              : react_1.default.createElement(SourceResourceDetail_1.SourceResourceDetail, {
                  resourceId: selectedResourceId,
                  processedResources:
                    isFilteringActive && filterResult?.processedResources
                      ? filterResult.processedResources
                      : resources,
                  originalProcessedResources: isFilteringActive ? resources : undefined,
                  filterContext: isFilteringActive ? filterState.appliedValues : undefined,
                  showComparison: isFilteringActive,
                  primaryLabel: 'Filtered',
                  secondaryLabel: 'Original',
                  onMessage: onMessage
                })
          )
        )
      )
    )
  );
};
exports.FilterView = FilterView;
exports.default = exports.FilterView;
//# sourceMappingURL=index.js.map
