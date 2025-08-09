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
  ChevronUpIcon,
  ListBulletIcon,
  FolderIcon
} from '@heroicons/react/24/outline';
import { FilterViewProps } from '../../../types';
import { Config } from '@fgv/ts-res';
import { QualifierContextControl } from '../../common/QualifierContextControl';
import { ResourceTreeView } from '../../common/ResourceTreeView';
import { ResourceListView } from '../../common/ResourceListView';

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
  const [viewMode, setViewMode] = useState<'tree' | 'list'>('list');

  // Available qualifiers from system configuration or compiled collection
  const availableQualifiers = useMemo(() => {
    if (resources?.compiledCollection.qualifiers) {
      return resources.compiledCollection.qualifiers.map((q) => q.name);
    }

    // Fallback to default qualifiers if no compiled collection
    return ['language', 'territory', 'currentTerritory', 'role', 'env'];
  }, [resources?.compiledCollection.qualifiers]);

  // Handle filter value changes using the shared component's callback pattern
  const handleQualifierChange = useCallback(
    (qualifierName: string, value: string | undefined) => {
      const newValues = { ...filterState.values, [qualifierName]: value };
      filterActions.updateFilterValues(newValues);
    },
    [filterState.values, filterActions]
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

  // Get filtered resource collection data (simplified)
  const getFilteredResourceCollectionData = useCallback(() => {
    if (!filterResult?.processedResources?.system.resourceManager) {
      return null;
    }

    const resourceManager = filterResult.processedResources.system.resourceManager;

    // Check if this is a ResourceManagerBuilder (has getResourceCollectionDecl method)
    if ('getResourceCollectionDecl' in resourceManager) {
      const collectionResult = (resourceManager as any).getResourceCollectionDecl();
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
                <QualifierContextControl
                  key={qualifierName}
                  qualifierName={qualifierName}
                  value={filterState.values[qualifierName]}
                  onChange={handleQualifierChange}
                  disabled={!filterState.enabled}
                  placeholder={`Filter by ${qualifierName}`}
                  resources={resources}
                />
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

        {/* Main Browser/Details Layout */}
        <div className="flex flex-col md:flex-row gap-6 h-[600px]">
          {/* Left side: Resource List */}
          <div className="md:w-1/2 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {isFilteringActive ? 'Filtered Resources' : 'All Resources'}
                </h3>
                <div className="flex items-center space-x-2 text-sm text-gray-500 mt-1">
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
              {/* View Mode Toggle */}
              <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={`flex items-center px-2 py-1 text-xs font-medium rounded ${
                    viewMode === 'list'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  title="List View"
                >
                  <ListBulletIcon className="h-4 w-4" />
                  <span className="ml-1">List</span>
                </button>
                <button
                  onClick={() => setViewMode('tree')}
                  className={`flex items-center px-2 py-1 text-xs font-medium rounded ${
                    viewMode === 'tree'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  title="Tree View"
                >
                  <FolderIcon className="h-4 w-4" />
                  <span className="ml-1">Tree</span>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto border border-gray-200 rounded-lg bg-gray-50">
              {viewMode === 'tree' && resources?.system.resourceManager ? (
                <ResourceTreeView
                  resources={resources.system.resourceManager}
                  selectedResourceId={selectedResourceId}
                  onResourceSelect={handleResourceSelect}
                  searchTerm=""
                  className=""
                />
              ) : (
                displayResources.map((resource) => (
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
                ))
              )}
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
                <FilteredResourceDetail
                  resourceId={selectedResourceId}
                  processedResources={resources}
                  filterResult={filterResult}
                  isFilteringActive={isFilteringActive}
                  filterContext={filterState.appliedValues}
                  onMessage={onMessage}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface FilteredResourceDetailProps {
  resourceId: string;
  processedResources: any;
  filterResult: any;
  isFilteringActive: boolean;
  filterContext: Record<string, string | undefined>;
  onMessage?: (type: 'info' | 'warning' | 'error' | 'success', message: string) => void;
}

const FilteredResourceDetail: React.FC<FilteredResourceDetailProps> = ({
  resourceId,
  processedResources,
  filterResult,
  isFilteringActive,
  filterContext,
  onMessage
}) => {
  const [resourceDetail, setResourceDetail] = useState<any>(null);
  const [filteredResourceDetail, setFilteredResourceDetail] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFilteredView, setShowFilteredView] = useState(true);

  React.useEffect(() => {
    const loadResourceDetails = () => {
      setIsLoading(true);
      setError(null);

      try {
        // Load original resource details
        const resourceManager = processedResources.system.resourceManager;
        const resourceResult = resourceManager.getBuiltResource(resourceId);

        if (resourceResult.isSuccess()) {
          const resource = resourceResult.value;
          const originalDetail = {
            id: resource.id,
            resourceType: resource.resourceType.key,
            candidateCount: resource.candidates.length,
            candidates: resource.candidates.map((candidate: any) => ({
              json: candidate.json,
              conditions: candidate.conditions.conditions.map((condition: any) => ({
                qualifier: condition.qualifier.name,
                operator: condition.operator,
                value: condition.value,
                priority: condition.priority,
                scoreAsDefault: condition.scoreAsDefault
              })),
              isPartial: candidate.isPartial,
              mergeMethod: candidate.mergeMethod
            }))
          };
          setResourceDetail(originalDetail);

          // Load filtered resource details if filtering is active
          if (isFilteringActive && filterResult?.processedResources) {
            const filteredResourceManager = filterResult.processedResources.system.resourceManager;
            const filteredResourceResult = filteredResourceManager.getBuiltResource(resourceId);

            if (filteredResourceResult.isSuccess()) {
              const filteredResource = filteredResourceResult.value;
              const filteredDetail = {
                id: filteredResource.id,
                resourceType: filteredResource.resourceType.key,
                candidateCount: filteredResource.candidates.length,
                candidates: filteredResource.candidates.map((candidate: any) => ({
                  json: candidate.json,
                  conditions: candidate.conditions.conditions.map((condition: any) => ({
                    qualifier: condition.qualifier.name,
                    operator: condition.operator,
                    value: condition.value,
                    priority: condition.priority,
                    scoreAsDefault: condition.scoreAsDefault
                  })),
                  isPartial: candidate.isPartial,
                  mergeMethod: candidate.mergeMethod
                }))
              };
              setFilteredResourceDetail(filteredDetail);
            }
          }

          onMessage?.('info', `Loaded details for resource: ${resourceId}`);
        } else {
          setError(`Failed to load resource details: ${resourceResult.message}`);
          onMessage?.('error', `Failed to load resource details: ${resourceResult.message}`);
        }
      } catch (err) {
        const errorMsg = `Error loading resource details: ${
          err instanceof Error ? err.message : String(err)
        }`;
        setError(errorMsg);
        onMessage?.('error', errorMsg);
      } finally {
        setIsLoading(false);
      }
    };

    loadResourceDetails();
  }, [resourceId, processedResources, filterResult, isFilteringActive, onMessage]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h4 className="font-medium text-gray-900 mb-2">Resource Details</h4>
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin h-6 w-6 border-2 border-purple-600 border-t-transparent rounded-full mx-auto mb-2"></div>
            <p className="text-sm text-gray-500">Loading resource details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-red-200 p-4">
        <h4 className="font-medium text-red-900 mb-2">Resource Details</h4>
        <div className="bg-red-50 p-3 rounded">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!resourceDetail) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h4 className="font-medium text-gray-900 mb-2">Resource Details</h4>
        <p className="text-sm text-gray-500">No resource details available</p>
      </div>
    );
  }

  const currentDetail = showFilteredView && filteredResourceDetail ? filteredResourceDetail : resourceDetail;
  const isShowingFiltered = showFilteredView && filteredResourceDetail;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-medium text-gray-900">Resource Details</h4>
        {isFilteringActive && filteredResourceDetail && (
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500">View:</span>
            <button
              onClick={() => setShowFilteredView(false)}
              className={`px-2 py-1 text-xs rounded ${
                !showFilteredView
                  ? 'bg-blue-100 text-blue-800 font-medium'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Original ({resourceDetail.candidateCount})
            </button>
            <button
              onClick={() => setShowFilteredView(true)}
              className={`px-2 py-1 text-xs rounded ${
                showFilteredView
                  ? 'bg-purple-100 text-purple-800 font-medium'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Filtered ({filteredResourceDetail.candidateCount})
            </button>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {/* Resource Overview */}
        <div>
          <div className="bg-gray-50 p-3 rounded border space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-600">Resource ID:</span>
              <code className="text-sm bg-white px-2 py-1 rounded border break-all">{currentDetail.id}</code>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-600">Type:</span>
              <span className="text-sm">{currentDetail.resourceType}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-600">Candidates:</span>
              <span
                className={`text-sm font-medium ${
                  isShowingFiltered && currentDetail.candidateCount === 0
                    ? 'text-red-600'
                    : isShowingFiltered && currentDetail.candidateCount < resourceDetail.candidateCount
                    ? 'text-amber-600'
                    : 'text-green-600'
                }`}
              >
                {currentDetail.candidateCount}
                {isShowingFiltered && currentDetail.candidateCount !== resourceDetail.candidateCount && (
                  <span className="text-gray-400 ml-1">(was {resourceDetail.candidateCount})</span>
                )}
              </span>
            </div>
            {isFilteringActive && (
              <div className="flex items-start space-x-2">
                <span className="text-sm font-medium text-gray-600">Filter:</span>
                <span className="text-sm text-purple-700">
                  {Object.entries(filterContext)
                    .filter(([, value]) => value !== undefined && value !== '')
                    .map(([key, value]) => `${key}=${value}`)
                    .join(', ') || 'No filters'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Candidates */}
        {currentDetail.candidates.length > 0 ? (
          <div>
            <h5 className="font-medium text-gray-700 mb-2">
              {isShowingFiltered ? 'Filtered ' : ''}Candidates ({currentDetail.candidates.length})
            </h5>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {currentDetail.candidates.map((candidate: any, index: number) => (
                <div key={index} className="bg-gray-50 p-3 rounded border">
                  <div className="flex items-center justify-between mb-2">
                    <h6 className="font-medium text-gray-800 text-sm">Candidate {index + 1}</h6>
                    <div className="flex items-center space-x-2 text-xs">
                      {candidate.isPartial && (
                        <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">Partial</span>
                      )}
                      <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded">
                        {candidate.mergeMethod}
                      </span>
                    </div>
                  </div>

                  {/* Conditions */}
                  {candidate.conditions.length > 0 ? (
                    <div className="mb-2">
                      <h6 className="text-xs font-medium text-gray-600 mb-1">Conditions:</h6>
                      <div className="space-y-1">
                        {candidate.conditions.map((condition: any, condIndex: number) => (
                          <div
                            key={condIndex}
                            className="flex items-center justify-between text-xs bg-blue-50 px-2 py-1 rounded"
                          >
                            <div className="flex items-center space-x-1">
                              <span className="font-medium text-blue-800">{condition.qualifier}</span>
                              <span className="text-blue-600">{condition.operator}</span>
                              <span className="text-blue-700">{condition.value}</span>
                            </div>
                            <div className="flex items-center space-x-2 text-xs">
                              <span className="text-blue-500">p:{condition.priority}</span>
                              {condition.scoreAsDefault !== undefined && (
                                <span className="text-amber-600 font-medium">
                                  d:{condition.scoreAsDefault}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="mb-2">
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                        No conditions (default)
                      </span>
                    </div>
                  )}

                  {/* JSON Content */}
                  <div>
                    <h6 className="text-xs font-medium text-gray-600 mb-1">Content:</h6>
                    <pre className="text-xs bg-white p-2 rounded border overflow-x-auto max-h-32 overflow-y-auto">
                      {JSON.stringify(candidate.json, null, 2)}
                    </pre>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-red-50 border border-red-200 p-3 rounded">
            <p className="text-sm text-red-700 font-medium">No candidates match the filter</p>
            <p className="text-xs text-red-600 mt-1">
              This resource has been completely filtered out. Consider adjusting your filter criteria.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FilterView;
