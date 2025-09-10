import React, { useState, useMemo, useCallback } from 'react';
import { FunnelIcon, ExclamationTriangleIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
// Resources import removed - unused
import { IFilterViewProps, IResolutionContextOptions } from '../../../types';
import { QualifierContextControl } from '../../common/QualifierContextControl';
import { ResourcePicker } from '../../pickers/ResourcePicker';
// Unused II interfaces import removed
import { SourceResourceDetail } from '../../common/SourceResourceDetail';
import { ResourcePickerOptionsControl } from '../../common/ResourcePickerOptionsControl';
import {
  IResourcePickerOptions,
  IResourceSelection,
  IResourceAnnotations
} from '../../pickers/ResourcePicker/types';
import { IFilteredResource } from '../../../types';
import { ResolutionContextOptionsControl } from '../../common/ResolutionContextOptionsControl';
import { useObservability } from '../../../contexts';

// IIFilteredResource interface removed - unused

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
export const FilterView: React.FC<IFilterViewProps> = ({
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
  const o11y = useObservability();

  // Local UI state
  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(null);

  // State for picker options control
  const [currentPickerOptions, setCurrentPickerOptions] = useState<IResourcePickerOptions>(
    (pickerOptions ?? {}) as IResourcePickerOptions
  );

  // State for context options control
  const [currentContextOptions, setCurrentContextOptions] = useState<IResolutionContextOptions>(
    contextOptions || {}
  );

  // Merge picker options with filter-specific defaults
  const effectivePickerOptions = useMemo(
    () => ({
      defaultView: 'list' as const,
      showViewToggle: true,
      enableSearch: true,
      searchPlaceholder: 'Search resources...',
      searchScope: 'all' as const,
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
  const availableQualifiers = useMemo(() => {
    if (resources?.compiledCollection.qualifiers) {
      return resources.compiledCollection.qualifiers.map((q) => q.name);
    }

    // Fallback to default qualifiers if no compiled collection
    return ['language', 'territory', 'currentTerritory', 'role', 'env'];
  }, [resources?.compiledCollection.qualifiers]);

  // Merge context options with current options from control
  const effectiveContextOptions = useMemo(
    () => ({
      ...contextOptions,
      ...currentContextOptions
    }),
    [contextOptions, currentContextOptions]
  );

  // Handle filter value changes using the shared component's callback pattern
  const handleQualifierChange = useCallback(
    (qualifierName: string, value: string | undefined) => {
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
  const hasAppliedFilterValues = useMemo(() => {
    if (!filterState.appliedValues) return false;
    return Object.values(filterState.appliedValues).some((value) => value !== undefined && value !== '');
  }, [filterState.appliedValues]);

  // Determine if filtering is active (enabled AND has applied values)
  const isFilteringActive = filterState.enabled && hasAppliedFilterValues;

  // Simplified filter summary
  const getFilterSummary = useCallback((values: Record<string, string | undefined>) => {
    const activeFilters = Object.entries(values)
      .filter(([, value]) => value !== undefined && value !== '')
      .map(([key, value]) => `${key}=${value}`);
    return activeFilters.length > 0 ? activeFilters.join(', ') : 'No filters';
  }, []);

  // Get resources to display (filtered or original) - now uses orchestrator's filterResult
  const displayResources = useMemo(() => {
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

    let resourceList: IFilteredResource[] = [];

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
  const resourceAnnotations = useMemo(() => {
    const annotations: IResourceAnnotations = {};

    displayResources.forEach((resource) => {
      if (isFilteringActive) {
        // Show filtering effects with candidate count changes
        const originalCount = resource.originalCandidateCount;
        const filteredCount = resource.filteredCandidateCount;

        // Determine badge color and text based on filtering result
        let badgeVariant: 'info' | 'warning' | 'error' = 'info';
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
  const visibleQualifiers = useMemo(() => {
    if (!effectiveContextOptions?.qualifierOptions) {
      return availableQualifiers;
    }

    return availableQualifiers.filter((qualifierName) => {
      const options = effectiveContextOptions.qualifierOptions![qualifierName];
      return options?.visible !== false;
    });
  }, [availableQualifiers, effectiveContextOptions?.qualifierOptions]);

  // Get effective filter values including host-managed values
  const effectiveFilterValues = useMemo(() => {
    const baseValues = filterState.values || {};
    const hostValues = effectiveContextOptions?.hostManagedValues || {};
    return { ...baseValues, ...hostValues };
  }, [filterState.values, effectiveContextOptions?.hostManagedValues]);

  // Handle resource selection with enhanced callback
  const handleResourceSelect = useCallback((selection: IResourceSelection) => {
    setSelectedResourceId(selection.resourceId);
  }, []);

  // Handle filter toggle
  const handleFilterToggle = useCallback(
    (enabled: boolean) => {
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
  const handleApplyFilter = useCallback(() => {
    filterActions.applyFilterValues();
    onMessage?.('info', 'Filter applied - processing resources...');
  }, [filterActions, onMessage]);

  // Handle reset filter values
  const handleResetFilter = useCallback(() => {
    filterActions.resetFilterValues();
    onMessage?.('info', 'Filter values reset');
  }, [filterActions, onMessage]);

  if (!resources) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="flex items-center space-x-3 mb-6">
          <FunnelIcon className="h-8 w-8 text-purple-600" />
          <h2 className="text-2xl font-bold text-gray-900">Filter Tool</h2>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <div className="max-w-2xl mx-auto">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">No Resources Loaded</h3>
            <p className="text-gray-600 mb-6">
              Import resources first to use the filter tool for context-based resource filtering.
            </p>
            <div className="bg-purple-50 rounded-lg p-4">
              <p className="text-sm text-purple-800">
                <strong>Filter Tool:</strong> Allows you to filter resources based on partial context
                matching, creating focused subsets for analysis and testing.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 ${className}`}>
      <div className="flex items-center space-x-3 mb-6">
        <FunnelIcon className="h-8 w-8 text-purple-600" />
        <h2 className="text-2xl font-bold text-gray-900">Filter Tool</h2>
      </div>

      {/* ResourcePicker Options Control */}
      <ResourcePickerOptionsControl
        options={currentPickerOptions}
        onOptionsChange={setCurrentPickerOptions}
        presentation={pickerOptionsPresentation}
        title="Filter Tool Picker Options"
        className="mb-6"
      />

      {/* FilterContext Options Control */}
      <ResolutionContextOptionsControl
        options={currentContextOptions}
        onOptionsChange={setCurrentContextOptions}
        availableQualifiers={availableQualifiers}
        presentation={pickerOptionsPresentation}
        title="Filter Context Options"
        className="mb-6"
      />

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {/* Filter Controls */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Filter Controls</h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filterState.enabled}
                    onChange={(e) => handleFilterToggle(e.target.checked)}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Enable Filtering</span>
                </label>
                <label
                  className="flex items-center"
                  title="Remove perfectly matching qualifier conditions from filtered resources to create cleaner bundles for comparison"
                >
                  <input
                    type="checkbox"
                    checked={filterState.reduceQualifiers}
                    onChange={(e) => filterActions.updateReduceQualifiers(e.target.checked)}
                    disabled={!filterState.enabled}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 disabled:text-gray-400"
                  />
                  <span
                    className={`ml-2 text-sm ${!filterState.enabled ? 'text-gray-400' : 'text-gray-700'}`}
                  >
                    Reduce Qualifiers
                  </span>
                </label>
                {isFilteringActive && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    Active{filterState.reduceQualifiers ? ' + Reducing' : ''}
                  </span>
                )}
                {filterState.hasPendingChanges && filterState.enabled && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                    Pending Changes
                  </span>
                )}
              </div>

              {filterState.enabled && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleResetFilter}
                    className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <XMarkIcon className="h-4 w-4 mr-1" />
                    Reset
                  </button>
                  <button
                    onClick={handleApplyFilter}
                    disabled={!filterState.hasPendingChanges}
                    className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                      filterState.hasPendingChanges
                        ? 'text-white bg-purple-600 hover:bg-purple-700'
                        : 'text-gray-400 bg-gray-300 cursor-not-allowed'
                    }`}
                  >
                    <CheckIcon className="h-4 w-4 mr-1" />
                    Apply
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Qualifier Selection Panel */}
        {effectiveContextOptions?.showContextControls !== false && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {effectiveContextOptions?.contextPanelTitle || 'Context Filters'}
            </h3>
            <div
              className={`bg-gray-50 rounded-lg p-4 ${effectiveContextOptions?.contextPanelClassName || ''}`}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {visibleQualifiers.map((qualifierName) => {
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
                    hostValue:
                      hostManagedValue !== undefined ? hostManagedValue : qualifierOptions?.hostValue,
                    // Apply filter-enabled state to editability
                    editable: filterState.enabled && qualifierOptions?.editable !== false
                  };

                  return (
                    <QualifierContextControl
                      key={qualifierName}
                      qualifierName={qualifierName}
                      value={filterState.values[qualifierName]}
                      onChange={handleQualifierChange}
                      disabled={!filterState.enabled}
                      placeholder={globalPlaceholder || `Filter by ${qualifierName}`}
                      resources={resources}
                      options={mergedOptions}
                    />
                  );
                })}
              </div>
              {filterState.enabled && effectiveContextOptions?.showCurrentContext !== false && (
                <div className="mt-3 text-sm text-gray-600">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p>
                        <strong>Pending:</strong> {getFilterSummary(effectiveFilterValues)}
                      </p>
                      {isFilteringActive && (
                        <p>
                          <strong>Applied:</strong> {getFilterSummary(filterState.appliedValues)}
                        </p>
                      )}
                    </div>
                  </div>
                  {filterResult && !filterResult.success && filterResult.error && (
                    <p className="text-red-600 text-xs mt-1">
                      <strong>Error:</strong> {filterResult.error}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Main Browser/Details Layout */}
        <div className="flex flex-col md:flex-row gap-6 h-[600px]">
          {/* Left side: Resource List */}
          <div className="md:w-1/2 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {isFilteringActive ? 'Filtered Resources' : 'All Resources'}
                </h3>
                {isFilteringActive && displayResources.some((r) => r.hasWarning) && (
                  <div className="flex items-center space-x-2 text-sm text-gray-500 mt-1">
                    <span className="text-amber-600 flex items-center">
                      <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                      {displayResources.filter((r) => r.hasWarning).length} warnings
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1">
              <ResourcePicker
                resources={
                  isFilteringActive && filterResult?.processedResources
                    ? filterResult.processedResources
                    : resources
                }
                selectedResourceId={selectedResourceId}
                onResourceSelect={handleResourceSelect}
                resourceAnnotations={resourceAnnotations}
                options={{
                  ...effectivePickerOptions,
                  searchPlaceholder: isFilteringActive
                    ? 'Search filtered resources...'
                    : effectivePickerOptions.searchPlaceholder,
                  emptyMessage: isFilteringActive
                    ? 'No resources match the filter criteria'
                    : effectivePickerOptions.emptyMessage
                }}
                onMessage={onMessage}
              />
            </div>
          </div>

          {/* Right side: Resource Details */}
          <div className="md:w-1/2 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Resource Details</h3>
            </div>

            <div className="flex-1 overflow-y-auto border border-gray-200 rounded-lg p-4 bg-gray-50">
              {!selectedResourceId ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <FunnelIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Select a resource to view details</p>
                    {isFilteringActive && (
                      <p className="text-sm text-gray-400 mt-2">
                        Showing resources that match your filter criteria
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <SourceResourceDetail
                  resourceId={selectedResourceId}
                  processedResources={
                    isFilteringActive && filterResult?.processedResources
                      ? filterResult.processedResources
                      : resources
                  }
                  originalProcessedResources={isFilteringActive ? resources : undefined}
                  filterContext={isFilteringActive ? filterState.appliedValues : undefined}
                  showComparison={isFilteringActive}
                  primaryLabel="Filtered"
                  secondaryLabel="Original"
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterView;
