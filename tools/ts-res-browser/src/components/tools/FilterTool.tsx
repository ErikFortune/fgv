import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  FunnelIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { UseResourceManagerReturn } from '../../hooks/useResourceManager';
import { Message, FilterState } from '../../types/app';
import { DEFAULT_SYSTEM_CONFIGURATION } from '../../utils/tsResIntegration';
import {
  createFilteredResourceManager,
  createFilteredResourceManagerAlternative,
  analyzeFilteredResources,
  hasFilterValues,
  getFilterSummary,
  FilterResult,
  FilteredResource
} from '../../utils/filterResources';

interface FilterToolProps {
  onMessage?: (type: Message['type'], message: string) => void;
  resourceManager: UseResourceManagerReturn;
  filterState: FilterState;
  filterActions: {
    updateFilterEnabled: (enabled: boolean) => void;
    updateFilterValues: (values: Record<string, string>) => void;
    applyFilterValues: () => void;
    resetFilterValues: () => void;
  };
}

const FilterTool: React.FC<FilterToolProps> = ({
  onMessage,
  resourceManager,
  filterState,
  filterActions
}) => {
  const { state: resourceState } = resourceManager;

  // Local UI state
  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(null);
  const [filterResult, setFilterResult] = useState<FilterResult | null>(null);
  const [isFiltering, setIsFiltering] = useState(false);

  // Available qualifiers (same logic as ResolutionViewer)
  const availableQualifiers = useMemo(() => {
    if (resourceState.processedResources?.compiledCollection.qualifiers) {
      return resourceState.processedResources.compiledCollection.qualifiers.map((q) => q.name);
    }

    const config = resourceState.activeConfiguration || DEFAULT_SYSTEM_CONFIGURATION;
    return config.qualifiers.map((q) => q.name);
  }, [resourceState.processedResources?.compiledCollection.qualifiers, resourceState.activeConfiguration]);

  // Check if we have any applied filter values set
  const hasAppliedFilterValues = useMemo(() => {
    return hasFilterValues(filterState.appliedValues);
  }, [filterState.appliedValues]);

  // Determine if filtering is active (enabled AND has applied values)
  const isFilteringActive = filterState.enabled && hasAppliedFilterValues;

  // Apply filtering when applied filter values change
  useEffect(() => {
    if (!resourceState.processedResources || !isFilteringActive) {
      setFilterResult(null);
      return;
    }

    const applyFilter = async () => {
      setIsFiltering(true);

      try {
        // Create filtered resource manager using applied values
        let filteredResult = await createFilteredResourceManager(
          resourceState.processedResources!.system,
          filterState.appliedValues,
          { partialContextMatch: true, enableDebugLogging: false }
        );

        // If the primary method fails, try the alternative approach
        if (filteredResult.isFailure()) {
          onMessage?.(
            'warning',
            `Primary filtering failed, trying alternative approach: ${filteredResult.message}`
          );

          filteredResult = await createFilteredResourceManagerAlternative(
            resourceState.processedResources!.system,
            filterState.appliedValues,
            { partialContextMatch: true, enableDebugLogging: false }
          );

          if (filteredResult.isFailure()) {
            setFilterResult({
              success: false,
              filteredResources: [],
              error: `Both filtering approaches failed. Primary: ${filteredResult.message}`,
              warnings: []
            });
            onMessage?.('error', `Filtering failed: ${filteredResult.message}`);
            return;
          } else {
            onMessage?.('success', 'Alternative filtering approach succeeded');
          }
        }

        // Analyze filtered resources
        const originalResources = resourceState.processedResources!.summary.resourceIds || [];
        const analysis = analyzeFilteredResources(
          originalResources,
          filteredResult.value,
          resourceState.processedResources!
        );

        setFilterResult(analysis);

        if (analysis.warnings.length > 0) {
          onMessage?.('warning', `Filtering completed with ${analysis.warnings.length} warning(s)`);
        } else {
          onMessage?.('success', `Filtering completed: ${analysis.filteredResources.length} resources`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        setFilterResult({
          success: false,
          filteredResources: [],
          error: errorMessage,
          warnings: []
        });
        onMessage?.('error', `Filtering error: ${errorMessage}`);
      } finally {
        setIsFiltering(false);
      }
    };

    applyFilter();
  }, [filterState.appliedValues, isFilteringActive, resourceState.processedResources, onMessage]);

  // Get resources to display (filtered or original)
  const displayResources = useMemo(() => {
    if (!resourceState.processedResources) return [];

    if (isFilteringActive && filterResult?.success) {
      return filterResult.filteredResources;
    }

    // Return original resources
    const originalResources = resourceState.processedResources.summary.resourceIds || [];
    return originalResources.map((id) => {
      const resourceResult = resourceState.processedResources!.system.resourceManager.getBuiltResource(id);
      const candidateCount = resourceResult.isSuccess() ? resourceResult.value.candidates.length : 0;

      return {
        id,
        originalCandidateCount: candidateCount,
        filteredCandidateCount: candidateCount,
        hasWarning: false
      } as FilteredResource;
    });
  }, [resourceState.processedResources, isFilteringActive, filterResult]);

  // Handle filter value changes
  const handleFilterChange = useCallback(
    (qualifierName: string, value: string) => {
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

  if (!resourceState.processedResources) {
    return (
      <div className="p-6">
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

  const selectedResource =
    selectedResourceId && resourceState.processedResources
      ? (() => {
          const resourceResult =
            resourceState.processedResources.system.resourceManager.getBuiltResource(selectedResourceId);
          return resourceResult.isSuccess() ? resourceResult.value : null;
        })()
      : null;

  return (
    <div className="p-6">
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
                {isFilteringActive && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    Active
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
                    disabled={!filterState.hasPendingChanges || isFiltering}
                    className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                      filterState.hasPendingChanges && !isFiltering
                        ? 'text-white bg-purple-600 hover:bg-purple-700'
                        : 'text-gray-400 bg-gray-300 cursor-not-allowed'
                    }`}
                  >
                    {isFiltering ? (
                      <ArrowPathIcon className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <CheckIcon className="h-4 w-4 mr-1" />
                    )}
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
                    <input
                      type="text"
                      value={filterState.values[qualifierName] || ''}
                      onChange={(e) => handleFilterChange(qualifierName, e.target.value)}
                      disabled={!filterState.enabled}
                      className={`flex-1 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-transparent text-sm min-w-0 ${
                        !filterState.enabled ? 'bg-gray-100 text-gray-400' : ''
                      }`}
                      placeholder={filterState.enabled ? `Filter by ${qualifierName}` : 'Disabled'}
                    />
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
                  {isFiltering && (
                    <div className="flex items-center text-blue-600">
                      <ArrowPathIcon className="h-4 w-4 mr-1 animate-spin" />
                      <span className="text-xs">Filtering...</span>
                    </div>
                  )}
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
        <div className="flex flex-col lg:flex-row gap-6 h-[600px]">
          {/* Left side: Resource List */}
          <div className="lg:w-1/2 flex flex-col">
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

            <div className="flex-1 overflow-y-auto border border-gray-200 rounded-lg bg-gray-50">
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

          {/* Right side: Resource Details */}
          <div className="lg:w-1/2 flex flex-col">
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
              ) : selectedResource ? (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-800 mb-2">Resource Information</h4>
                    <div className="bg-white p-3 rounded border text-sm">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <strong>ID:</strong> {selectedResource.id}
                        </div>
                        <div>
                          <strong>Type:</strong> {selectedResource.resourceType.key}
                        </div>
                        <div>
                          <strong>Candidates:</strong> {selectedResource.candidates.length}
                        </div>
                        <div>
                          <strong>Decision:</strong> {selectedResource.decision.key}
                        </div>
                      </div>
                    </div>
                  </div>

                  {isFilteringActive && (
                    <div>
                      <h4 className="font-medium text-gray-800 mb-2">Filter Impact</h4>
                      <div className="bg-white p-3 rounded border text-sm">
                        <div className="space-y-1">
                          <div>Original candidates: {selectedResource.candidates.length}</div>
                          <div className="text-purple-600">
                            Filtered candidates:{' '}
                            {displayResources.find((r) => r.id === selectedResourceId)
                              ?.filteredCandidateCount || 0}
                          </div>
                          {displayResources.find((r) => r.id === selectedResourceId)?.hasWarning && (
                            <div className="text-amber-600 text-xs mt-2 flex items-center">
                              <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                              Warning: No candidates match the current filter criteria
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <h4 className="font-medium text-gray-800 mb-2">
                      Candidates ({selectedResource.candidates.length})
                    </h4>
                    <div className="bg-white rounded border max-h-64 overflow-y-auto">
                      {selectedResource.candidates.length > 0 ? (
                        <div className="space-y-4 p-4">
                          {selectedResource.candidates.map((candidate, index) => {
                            const isFiltered =
                              isFilteringActive &&
                              filterResult?.filteredResources.find((r) => r.id === selectedResourceId)
                                ?.filteredCandidateCount === 0;

                            return (
                              <div key={index} className={`${isFiltered ? 'opacity-50' : ''}`}>
                                <div className="bg-white p-4 rounded-lg border">
                                  <div className="flex items-center justify-between mb-3">
                                    <h5 className="font-medium text-gray-800">Candidate {index + 1}</h5>
                                    <div className="flex items-center space-x-2 text-xs">
                                      {candidate.isPartial && (
                                        <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                                          Partial
                                        </span>
                                      )}
                                      <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                        {candidate.mergeMethod}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Conditions */}
                                  {candidate.conditions &&
                                  candidate.conditions.conditions &&
                                  candidate.conditions.conditions.length > 0 ? (
                                    <div className="mb-3">
                                      <h6 className="text-sm font-medium text-gray-600 mb-2">Conditions:</h6>
                                      <div className="space-y-1">
                                        {candidate.conditions.conditions.map((condition, condIndex) => (
                                          <div
                                            key={condIndex}
                                            className="flex items-center text-xs bg-blue-50 px-2 py-1 rounded"
                                          >
                                            <span className="font-medium text-blue-800">
                                              {condition.qualifier.name}
                                            </span>
                                            <span className="mx-1 text-blue-600">{condition.operator}</span>
                                            <span className="text-blue-700">{condition.value}</span>
                                            <span className="ml-auto text-blue-500">
                                              priority: {condition.priority}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="mb-3">
                                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                        No conditions (default candidate)
                                      </span>
                                    </div>
                                  )}

                                  {/* JSON Content */}
                                  <div>
                                    <h6 className="text-sm font-medium text-gray-600 mb-2">Content:</h6>
                                    <pre className="text-xs bg-gray-50 p-3 rounded border overflow-x-auto max-h-40">
                                      {JSON.stringify(candidate.json, null, 2)}
                                    </pre>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="p-4 text-center text-gray-500 text-sm">No candidates available</div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-800 mb-2">Raw Resource Data</h4>
                    <pre className="text-xs bg-white p-3 rounded border overflow-x-auto max-h-32 overflow-y-auto">
                      {JSON.stringify(
                        {
                          id: selectedResource.id,
                          resourceType: selectedResource.resourceType.key,
                          decision: selectedResource.decision.key,
                          candidateCount: selectedResource.candidates.length
                        },
                        null,
                        2
                      )}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500">
                  <p>Failed to load resource details</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterTool;
