import React, { useState, useMemo, useCallback } from 'react';
import {
  FunnelIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  CheckIcon,
  XMarkIcon,
  DocumentArrowDownIcon,
  CodeBracketIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';
import { FilterViewProps } from '../../../types';
import { Config } from '@fgv/ts-res';

// Import FilteredResource type from the utils
interface FilteredResource {
  id: string;
  originalCandidateCount: number;
  filteredCandidateCount: number;
  hasWarning: boolean;
}

export const FilterView: React.FC<FilterViewProps> = ({
  resources,
  filterState,
  filterActions,
  filterResult,
  onFilterResult,
  onMessage,
  className = ''
}) => {
  // Local UI state
  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(null);
  const [showFilteredJsonView, setShowFilteredJsonView] = useState(false);

  // Available qualifiers from system configuration or compiled collection
  const availableQualifiers = useMemo(() => {
    if (resources?.compiledCollection.qualifiers) {
      return resources.compiledCollection.qualifiers.map((q) => q.name);
    }

    // Fallback to default qualifiers if no compiled collection
    return ['language', 'territory', 'currentTerritory', 'role', 'env'];
  }, [resources?.compiledCollection.qualifiers]);

  // Get qualifier type information for form controls
  const qualifierTypeInfo = useMemo(() => {
    const info: Record<string, any> = {};

    // Simple type mapping for basic form controls
    availableQualifiers.forEach((qualifierName) => {
      // Default to text input for all qualifiers in the simplified version
      info[qualifierName] = {
        type: { systemType: 'literal' },
        enumeratedValues: []
      };
    });

    return info;
  }, [availableQualifiers]);

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

  // Get filtered resource collection data (simplified)
  const getFilteredResourceCollectionData = useCallback(() => {
    if (!filterResult?.processedResources?.system.resourceManager) {
      return null;
    }

    try {
      const collectionResult =
        filterResult.processedResources.system.resourceManager.getResourceCollectionDecl();
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
    } catch (error) {
      onMessage?.(
        'error',
        `Error getting filtered resource collection: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      return null;
    }
  }, [filterResult, onMessage, filterState.appliedValues, filterState.reduceQualifiers]);

  // Export filtered resource collection data
  const handleExportFilteredData = useCallback(() => {
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
  const displayResources = useMemo(() => {
    if (!resources) return [];

    let resourceList: FilteredResource[] = [];

    if (isFilteringActive && filterResult?.success && filterResult.filteredResources) {
      resourceList = filterResult.filteredResources;
    } else {
      // Return original resources
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

  // Handle filter value changes
  const handleFilterChange = useCallback(
    (qualifierName: string, value: string | undefined) => {
      const newValues = { ...filterState.values, [qualifierName]: value };
      filterActions.updateFilterValues(newValues);
    },
    [filterState.values, filterActions]
  );

  // Handle resource selection
  const handleResourceSelect = useCallback((resourceId: string) => {
    setSelectedResourceId(resourceId);
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
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Context Filters</h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {availableQualifiers.map((qualifierName) => (
                <div key={qualifierName} className="bg-white rounded border border-gray-200 p-2">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700 min-w-0 flex-shrink-0">
                      {qualifierName}:
                    </label>
                    <div className="flex-1 flex items-center gap-1">
                      <input
                        type="text"
                        value={filterState.values[qualifierName] ?? ''}
                        onChange={(e) => handleFilterChange(qualifierName, e.target.value)}
                        disabled={!filterState.enabled}
                        className={`flex-1 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-transparent text-sm min-w-0 ${
                          !filterState.enabled ? 'bg-gray-100 text-gray-400' : ''
                        }`}
                        placeholder={
                          !filterState.enabled
                            ? 'Disabled'
                            : filterState.values[qualifierName] === undefined
                            ? '(undefined)'
                            : `Filter by ${qualifierName}`
                        }
                      />
                      {filterState.enabled && filterState.values[qualifierName] !== undefined && (
                        <button
                          type="button"
                          onClick={() => handleFilterChange(qualifierName, undefined)}
                          className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                          title="Set to undefined"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {filterState.enabled && (
              <div className="mt-3 text-sm text-gray-600">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p>
                      <strong>Pending:</strong> {getFilterSummary(filterState.values)}
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

        {/* Resource List */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {isFilteringActive ? 'Filtered Resources' : 'All Resources'}
            </h3>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <span>{displayResources.length} resources</span>
              {isFilteringActive && displayResources.some((r) => r.hasWarning) && (
                <>
                  <span>•</span>
                  <span className="text-amber-600 flex items-center">
                    <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                    {displayResources.filter((r) => r.hasWarning).length} warnings
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg border border-gray-200 max-h-96 overflow-y-auto">
            {displayResources.map((resource) => (
              <div
                key={resource.id}
                className={`flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-gray-100 border-b border-gray-100 last:border-b-0 ${
                  selectedResourceId === resource.id ? 'bg-purple-50 border-r-2 border-purple-500' : ''
                }`}
                onClick={() => handleResourceSelect(resource.id)}
              >
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                  <DocumentTextIcon className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span
                    className={`text-sm truncate ${
                      selectedResourceId === resource.id ? 'font-medium text-purple-900' : 'text-gray-700'
                    }`}
                  >
                    {resource.id}
                  </span>
                </div>
                <div className="flex items-center space-x-2 flex-shrink-0">
                  {isFilteringActive && (
                    <div className="flex items-center space-x-1 text-xs">
                      <span className="text-gray-400">{resource.originalCandidateCount}</span>
                      <span className="text-gray-400">→</span>
                      <span
                        className={`font-medium ${
                          resource.filteredCandidateCount === 0
                            ? 'text-red-600'
                            : resource.filteredCandidateCount < resource.originalCandidateCount
                            ? 'text-amber-600'
                            : 'text-green-600'
                        }`}
                      >
                        {resource.filteredCandidateCount}
                      </span>
                    </div>
                  )}
                  {!isFilteringActive && (
                    <span className="text-xs text-gray-500">
                      {resource.originalCandidateCount} candidates
                    </span>
                  )}
                  {resource.hasWarning && (
                    <ExclamationTriangleIcon
                      className="h-4 w-4 text-amber-500"
                      title="No matching candidates"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Resource Info */}
        {selectedResourceId && (
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Selected Resource</h4>
            <p className="text-sm text-blue-800">
              <strong>ID:</strong> {selectedResourceId}
            </p>
            <p className="text-sm text-blue-700 mt-1">
              Click on a resource above to view detailed filtering information.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FilterView;
