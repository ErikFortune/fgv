import React, { useState, useMemo, useCallback, useEffect } from 'react';
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
import { UseResourceManagerReturn } from '../../hooks/useResourceManager';
import { Message, FilterState } from '../../types/app';
import { NoMatch, Config } from '@fgv/ts-res';
import { DEFAULT_SYSTEM_CONFIGURATION } from '../../utils/tsResIntegration';
import {
  createFilteredResourceManager,
  createFilteredResourceManagerAlternative,
  createFilteredResourceManagerSimple,
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
    updateReduceQualifiers: (reduceQualifiers: boolean) => void;
  };
  onFilterResult?: (result: FilterResult | null) => void;
}

const FilterTool: React.FC<FilterToolProps> = ({
  onMessage,
  resourceManager,
  filterState,
  filterActions,
  onFilterResult
}) => {
  const { state: resourceState } = resourceManager;

  // Local UI state
  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(null);
  const [filterResult, setFilterResult] = useState<FilterResult | null>(null);
  const [isFiltering, setIsFiltering] = useState(false);
  const [showFilteredJsonView, setShowFilteredJsonView] = useState(false);

  // Available qualifiers (same logic as ResolutionViewer)
  const availableQualifiers = useMemo(() => {
    if (resourceState.processedResources?.compiledCollection.qualifiers) {
      return resourceState.processedResources.compiledCollection.qualifiers.map((q) => q.name);
    }

    const config = resourceState.activeConfiguration || DEFAULT_SYSTEM_CONFIGURATION;
    return config.qualifiers.map((q) => q.name);
  }, [resourceState.processedResources?.compiledCollection.qualifiers, resourceState.activeConfiguration]);

  // Get qualifier type information for dropdown decisions
  const qualifierTypeInfo = useMemo(() => {
    const info: Record<
      string,
      {
        type: Config.Model.ISystemConfiguration['qualifierTypes'][0];
        enumeratedValues?: string[];
        allowedTerritories?: string[];
      }
    > = {};

    // Get the active configuration to access qualifier types
    const config = resourceState.activeConfiguration || DEFAULT_SYSTEM_CONFIGURATION;

    // Create a map of qualifier name to qualifier type for quick lookup
    const qualifierTypeMap: Record<string, Config.Model.ISystemConfiguration['qualifierTypes'][0]> = {};

    // First, create a mapping of qualifiers to their types
    config.qualifiers.forEach((qualifier) => {
      const qualifierType = config.qualifierTypes.find((qt) => qt.name === qualifier.typeName);
      if (qualifierType) {
        qualifierTypeMap[qualifier.name] = qualifierType;
      }
    });

    // Build info for each qualifier
    availableQualifiers.forEach((qualifierName) => {
      const qualifierType = qualifierTypeMap[qualifierName];
      if (qualifierType) {
        info[qualifierName] = { type: qualifierType };

        // Extract enumerated values for literal types
        if (
          qualifierType.systemType === 'literal' &&
          qualifierType.configuration &&
          typeof qualifierType.configuration === 'object' &&
          'enumeratedValues' in qualifierType.configuration &&
          Array.isArray(qualifierType.configuration.enumeratedValues)
        ) {
          info[qualifierName].enumeratedValues = qualifierType.configuration.enumeratedValues;
        }

        // Extract allowed territories for territory types
        if (
          qualifierType.systemType === 'territory' &&
          qualifierType.configuration &&
          typeof qualifierType.configuration === 'object' &&
          'allowedTerritories' in qualifierType.configuration &&
          Array.isArray(qualifierType.configuration.allowedTerritories)
        ) {
          info[qualifierName].allowedTerritories = qualifierType.configuration.allowedTerritories;
        }
      }
    });

    return info;
  }, [availableQualifiers, resourceState.activeConfiguration]);

  // Check if we have any applied filter values set
  const hasAppliedFilterValues = useMemo(() => {
    return hasFilterValues(filterState.appliedValues);
  }, [filterState.appliedValues]);

  // Determine if filtering is active (enabled AND has applied values)
  const isFilteringActive = filterState.enabled && hasAppliedFilterValues;

  // Get filtered resource collection data
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
  }, [filterResult, onMessage, filterState.appliedValues]);

  // Export filtered resource collection data
  const handleExportFilteredData = useCallback(() => {
    try {
      const collectionData = getFilteredResourceCollectionData();
      if (!collectionData) {
        onMessage?.('error', 'No filtered collection data available to export');
        return;
      }

      const filterSummary = getFilterSummary(filterState.appliedValues);
      const sourceJson = JSON.stringify(collectionData, null, 2);
      const blob = new Blob([sourceJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `filtered-resource-collection-${filterSummary.replace(/[^a-z0-9]/gi, '-')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      onMessage?.('success', 'Filtered resource collection exported successfully');
    } catch (error) {
      onMessage?.(
        'error',
        `Failed to export filtered resource collection: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }, [getFilteredResourceCollectionData, onMessage, filterState.appliedValues]);

  // Apply filtering when applied filter values change
  useEffect(() => {
    if (!resourceState.processedResources || !isFilteringActive) {
      setFilterResult(null);
      onFilterResult?.(null);
      return;
    }

    const applyFilter = async () => {
      setIsFiltering(true);

      try {
        // Try the new simple filtering approach first
        let filteredResult = await createFilteredResourceManagerSimple(
          resourceState.processedResources!.system,
          filterState.appliedValues,
          {
            partialContextMatch: true,
            enableDebugLogging: false,
            reduceQualifiers: filterState.reduceQualifiers
          }
        );

        if (filteredResult.isFailure()) {
          onMessage?.(
            'warning',
            `Simple filtering failed, trying legacy approach: ${filteredResult.message}`
          );

          // Fall back to the original complex implementation
          filteredResult = await createFilteredResourceManager(
            resourceState.processedResources!.system,
            filterState.appliedValues,
            {
              partialContextMatch: true,
              enableDebugLogging: false,
              reduceQualifiers: filterState.reduceQualifiers
            }
          );

          if (filteredResult.isFailure()) {
            onMessage?.(
              'warning',
              `Legacy filtering failed, trying alternative approach: ${filteredResult.message}`
            );

            // Last resort: try the alternative approach
            filteredResult = await createFilteredResourceManagerAlternative(
              resourceState.processedResources!.system,
              filterState.appliedValues,
              {
                partialContextMatch: true,
                enableDebugLogging: false,
                reduceQualifiers: filterState.reduceQualifiers
              }
            );

            if (filteredResult.isFailure()) {
              setFilterResult({
                success: false,
                filteredResources: [],
                error: `All filtering approaches failed. Simple: ${filteredResult.message}`,
                warnings: []
              });
              onMessage?.('error', `Filtering failed: ${filteredResult.message}`);
              return;
            } else {
              onMessage?.('success', 'Alternative filtering approach succeeded');
            }
          } else {
            onMessage?.('success', 'Legacy filtering approach succeeded');
          }
        } else {
          onMessage?.('success', 'Simple filtering approach succeeded');
        }

        // Analyze filtered resources
        const originalResources = resourceState.processedResources!.summary.resourceIds || [];
        const analysis = analyzeFilteredResources(
          originalResources,
          filteredResult.value,
          resourceState.processedResources!
        );

        setFilterResult(analysis);
        onFilterResult?.(analysis);

        if (analysis.warnings.length > 0) {
          onMessage?.('warning', `Filtering completed with ${analysis.warnings.length} warning(s)`);
        } else {
          onMessage?.('success', `Filtering completed: ${analysis.filteredResources.length} resources`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorResult = {
          success: false,
          filteredResources: [],
          error: errorMessage,
          warnings: []
        };
        setFilterResult(errorResult);
        onFilterResult?.(errorResult);
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

    let resources: FilteredResource[] = [];

    if (isFilteringActive && filterResult?.success) {
      resources = filterResult.filteredResources;
    } else {
      // Return original resources
      const originalResources = resourceState.processedResources.summary.resourceIds || [];
      resources = originalResources.map((id) => {
        const resourceResult = resourceState.processedResources!.system.resourceManager.getBuiltResource(id);
        const candidateCount = resourceResult.isSuccess() ? resourceResult.value.candidates.length : 0;

        return {
          id,
          originalCandidateCount: candidateCount,
          filteredCandidateCount: candidateCount,
          hasWarning: false
        } as FilteredResource;
      });
    }

    // Sort resources alphabetically by id
    return resources.sort((a, b) => a.id.localeCompare(b.id));
  }, [resourceState.processedResources, isFilteringActive, filterResult]);

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

  // Get both original and filtered resources for the selected resource
  const selectedResourceData = useMemo(() => {
    if (!selectedResourceId || !resourceState.processedResources) {
      return null;
    }

    const originalResourceResult =
      resourceState.processedResources.system.resourceManager.getBuiltResource(selectedResourceId);
    const originalResource = originalResourceResult.isSuccess() ? originalResourceResult.value : null;

    let filteredResource = null;
    if (isFilteringActive && filterResult?.processedResources) {
      const filteredResourceResult =
        filterResult.processedResources.system.resourceManager.getBuiltResource(selectedResourceId);
      filteredResource = filteredResourceResult.isSuccess() ? filteredResourceResult.value : null;
    }

    return {
      original: originalResource,
      filtered: filteredResource
    };
  }, [selectedResourceId, resourceState.processedResources, filterResult, isFilteringActive]);

  // Categorize candidates when filtering is active
  const categorizedCandidates = useMemo(() => {
    if (!selectedResourceData?.original || !isFilteringActive) {
      return { matching: [], filteredOut: [] };
    }

    const originalCandidates = selectedResourceData.original.candidates;
    const filteredCandidates = selectedResourceData.filtered?.candidates || [];

    // Create a lookup for filtered candidates by comparing JSON content and conditions
    const filteredCandidatesSet = new Set(
      filteredCandidates.map((candidate) =>
        JSON.stringify({
          json: candidate.json,
          conditions:
            candidate.conditions?.conditions?.map((c) => ({
              qualifier: c.qualifier.name,
              operator: c.operator,
              value: c.value
            })) || []
        })
      )
    );

    const matching = [];
    const filteredOut = [];

    for (const candidate of originalCandidates) {
      const candidateKey = JSON.stringify({
        json: candidate.json,
        conditions:
          candidate.conditions?.conditions?.map((c) => ({
            qualifier: c.qualifier.name,
            operator: c.operator,
            value: c.value
          })) || []
      });

      if (filteredCandidatesSet.has(candidateKey)) {
        matching.push(candidate);
      } else {
        filteredOut.push(candidate);
      }
    }

    return { matching, filteredOut };
  }, [selectedResourceData, isFilteringActive]);

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
              {availableQualifiers.map((qualifierName) => {
                const typeInfo = qualifierTypeInfo[qualifierName];
                const hasConstrainedValues =
                  (typeInfo?.enumeratedValues && typeInfo.enumeratedValues.length > 0) ||
                  (typeInfo?.allowedTerritories && typeInfo.allowedTerritories.length > 0);

                const constrainedValues = typeInfo?.enumeratedValues || typeInfo?.allowedTerritories || [];

                return (
                  <div key={qualifierName} className="bg-white rounded border border-gray-200 p-2">
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium text-gray-700 min-w-0 flex-shrink-0">
                        {qualifierName}:
                      </label>
                      {hasConstrainedValues ? (
                        <select
                          value={filterState.values[qualifierName] ?? ''}
                          onChange={(e) =>
                            handleFilterChange(
                              qualifierName,
                              e.target.value === '__undefined__' ? undefined : e.target.value
                            )
                          }
                          disabled={!filterState.enabled}
                          className={`flex-1 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-transparent text-sm min-w-0 ${
                            !filterState.enabled ? 'bg-gray-100 text-gray-400' : 'bg-white'
                          }`}
                        >
                          <option value="">
                            {filterState.enabled ? `All ${qualifierName} values` : 'Disabled'}
                          </option>
                          {constrainedValues.map((value) => (
                            <option key={value} value={value}>
                              {value}
                            </option>
                          ))}
                          <option value="__undefined__" className="text-gray-500 italic">
                            undefined
                          </option>
                        </select>
                      ) : (
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
                      )}
                    </div>
                  </div>
                );
              })}
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

        {/* Filtered Resource Collection JSON View */}
        {isFilteringActive && filterResult?.success && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <button
                onClick={() => setShowFilteredJsonView(!showFilteredJsonView)}
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                <CodeBracketIcon className="h-4 w-4 mr-2" />
                {showFilteredJsonView ? 'Hide' : 'Show'} Filtered JSON Resource Collection
                {showFilteredJsonView ? (
                  <ChevronUpIcon className="h-4 w-4 ml-2" />
                ) : (
                  <ChevronDownIcon className="h-4 w-4 ml-2" />
                )}
              </button>

              <button
                onClick={handleExportFilteredData}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                <DocumentArrowDownIcon className="h-4 w-4 mr-1" />
                Export Filtered JSON
              </button>
            </div>

            {/* JSON View */}
            {showFilteredJsonView && (
              <div className="mt-4">
                <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-900">
                      Filtered Resource Collection ({getFilterSummary(filterState.appliedValues)})
                    </h3>
                    <button
                      onClick={handleExportFilteredData}
                      className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                    >
                      <DocumentArrowDownIcon className="h-3 w-3 mr-1" />
                      Export
                    </button>
                  </div>
                  <pre className="text-xs text-gray-800 bg-white p-3 rounded border overflow-x-auto max-h-64 overflow-y-auto">
                    {JSON.stringify(getFilteredResourceCollectionData(), null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Main Browser/Details Layout */}
        <div className="flex flex-col md:flex-row gap-6 h-[600px]">
          {/* Left side: Resource List */}
          <div className="md:w-1/2 flex flex-col">
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
              ) : selectedResourceData?.original ? (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-800 mb-2">Resource Information</h4>
                    <div className="bg-white p-3 rounded border text-sm">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <strong>ID:</strong> {selectedResourceData.original.id}
                        </div>
                        <div>
                          <strong>Type:</strong> {selectedResourceData.original.resourceType.key}
                        </div>
                        <div>
                          <strong>Candidates:</strong> {selectedResourceData.original.candidates.length}
                        </div>
                        <div>
                          <strong>Decision:</strong> {selectedResourceData.original.decision.key}
                        </div>
                      </div>
                    </div>
                  </div>

                  {isFilteringActive && (
                    <div>
                      <h4 className="font-medium text-gray-800 mb-2">Filter Impact</h4>
                      <div className="bg-white p-3 rounded border text-sm">
                        <div className="space-y-1">
                          <div>Original candidates: {selectedResourceData.original.candidates.length}</div>
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
                      Candidates ({selectedResourceData.original.candidates.length})
                    </h4>
                    <div className="bg-white rounded border max-h-64 overflow-y-auto">
                      {selectedResourceData.original.candidates.length > 0 ? (
                        <div className="space-y-4 p-4">
                          {/* Show matching candidates first when filtering is active */}
                          {isFilteringActive && categorizedCandidates.matching.length > 0 && (
                            <div className="space-y-4">
                              <div className="border-b border-green-200 pb-2">
                                <h5 className="text-sm font-semibold text-green-700 flex items-center">
                                  <CheckIcon className="h-4 w-4 mr-1" />
                                  Matching Candidates ({categorizedCandidates.matching.length})
                                </h5>
                              </div>
                              {categorizedCandidates.matching.map((candidate, index) => (
                                <div key={`matching-${index}`} className="border-l-4 border-green-500 pl-4">
                                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                    <div className="flex items-center justify-between mb-3">
                                      <h6 className="font-medium text-gray-800">
                                        Matching Candidate {index + 1}
                                      </h6>
                                      <div className="flex items-center space-x-2 text-xs">
                                        {candidate.isPartial && (
                                          <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                                            Partial
                                          </span>
                                        )}
                                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded">
                                          {candidate.mergeMethod}
                                        </span>
                                      </div>
                                    </div>

                                    {/* Conditions */}
                                    {candidate.conditions &&
                                    candidate.conditions.conditions &&
                                    candidate.conditions.conditions.length > 0 ? (
                                      <div className="mb-3">
                                        <h6 className="text-sm font-medium text-gray-600 mb-2">
                                          Conditions:
                                        </h6>
                                        <div className="space-y-1">
                                          {candidate.conditions.conditions.map((condition, condIndex) => (
                                            <div
                                              key={condIndex}
                                              className="flex items-center text-xs bg-green-100 px-2 py-1 rounded"
                                            >
                                              <span className="font-medium text-green-800">
                                                {condition.qualifier.name}
                                              </span>
                                              <span className="mx-1 text-green-600">
                                                {condition.operator}
                                              </span>
                                              <span className="text-green-700">{condition.value}</span>
                                              <div className="ml-auto flex items-center space-x-2">
                                                <span className="text-green-500">
                                                  priority: {condition.priority}
                                                </span>
                                                {condition.scoreAsDefault !== undefined && (
                                                  <span className="text-amber-600 font-medium">
                                                    default: {condition.scoreAsDefault}
                                                  </span>
                                                )}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="mb-3">
                                        <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                                          No conditions (default candidate)
                                        </span>
                                      </div>
                                    )}

                                    {/* JSON Content */}
                                    <div>
                                      <h6 className="text-sm font-medium text-gray-600 mb-2">Content:</h6>
                                      <pre className="text-xs bg-white p-3 rounded border overflow-x-auto max-h-40">
                                        {JSON.stringify(candidate.json, null, 2)}
                                      </pre>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Show filtered out candidates when filtering is active */}
                          {isFilteringActive && categorizedCandidates.filteredOut.length > 0 && (
                            <div className="space-y-4">
                              <div className="border-b border-gray-300 pb-2">
                                <h5 className="text-sm font-semibold text-gray-600 flex items-center">
                                  <XMarkIcon className="h-4 w-4 mr-1" />
                                  Filtered Out Candidates ({categorizedCandidates.filteredOut.length})
                                </h5>
                              </div>
                              {categorizedCandidates.filteredOut.map((candidate, index) => (
                                <div
                                  key={`filtered-${index}`}
                                  className="border-l-4 border-gray-400 pl-4 opacity-60"
                                >
                                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-300">
                                    <div className="flex items-center justify-between mb-3">
                                      <h6 className="font-medium text-gray-600">
                                        Filtered Out Candidate {index + 1}
                                      </h6>
                                      <div className="flex items-center space-x-2 text-xs">
                                        {candidate.isPartial && (
                                          <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                                            Partial
                                          </span>
                                        )}
                                        <span className="bg-gray-200 text-gray-600 px-2 py-1 rounded">
                                          {candidate.mergeMethod}
                                        </span>
                                      </div>
                                    </div>

                                    {/* Conditions */}
                                    {candidate.conditions &&
                                    candidate.conditions.conditions &&
                                    candidate.conditions.conditions.length > 0 ? (
                                      <div className="mb-3">
                                        <h6 className="text-sm font-medium text-gray-500 mb-2">
                                          Conditions:
                                        </h6>
                                        <div className="space-y-1">
                                          {candidate.conditions.conditions.map((condition, condIndex) => (
                                            <div
                                              key={condIndex}
                                              className="flex items-center text-xs bg-gray-200 px-2 py-1 rounded"
                                            >
                                              <span className="font-medium text-gray-700">
                                                {condition.qualifier.name}
                                              </span>
                                              <span className="mx-1 text-gray-500">{condition.operator}</span>
                                              <span className="text-gray-600">{condition.value}</span>
                                              <div className="ml-auto flex items-center space-x-2">
                                                <span className="text-gray-400">
                                                  priority: {condition.priority}
                                                </span>
                                                {condition.scoreAsDefault !== undefined && (
                                                  <span className="text-amber-500 font-medium">
                                                    default: {condition.scoreAsDefault}
                                                  </span>
                                                )}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="mb-3">
                                        <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                                          No conditions (default candidate)
                                        </span>
                                      </div>
                                    )}

                                    {/* JSON Content */}
                                    <div>
                                      <h6 className="text-sm font-medium text-gray-500 mb-2">Content:</h6>
                                      <pre className="text-xs bg-gray-100 p-3 rounded border overflow-x-auto max-h-40">
                                        {JSON.stringify(candidate.json, null, 2)}
                                      </pre>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Show all candidates when filtering is not active */}
                          {!isFilteringActive &&
                            selectedResourceData.original.candidates.map((candidate, index) => (
                              <div key={index}>
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
                                            <div className="ml-auto flex items-center space-x-2">
                                              <span className="text-blue-500">
                                                priority: {condition.priority}
                                              </span>
                                              {condition.scoreAsDefault !== undefined && (
                                                <span className="text-amber-600 font-medium">
                                                  default: {condition.scoreAsDefault}
                                                </span>
                                              )}
                                            </div>
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
                            ))}
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
                          id: selectedResourceData.original.id,
                          resourceType: selectedResourceData.original.resourceType.key,
                          decision: selectedResourceData.original.decision.key,
                          candidateCount: selectedResourceData.original.candidates.length
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
