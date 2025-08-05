import React, { useState, useMemo, useCallback } from 'react';
import {
  MagnifyingGlassIcon,
  DocumentTextIcon,
  CubeIcon,
  CheckIcon,
  XMarkIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { ResolutionViewProps, CandidateInfo } from '../../../types';

export const ResolutionView: React.FC<ResolutionViewProps> = ({
  resources,
  filterState,
  filterResult,
  resolutionState,
  resolutionActions,
  availableQualifiers = [],
  onMessage,
  className = ''
}) => {
  // Use filtered resources when filtering is active and successful
  const isFilteringActive = filterState?.enabled && filterResult?.success === true;
  const activeProcessedResources = isFilteringActive ? filterResult?.processedResources : resources;

  // Available resources for selection
  const availableResources = useMemo(() => {
    if (!activeProcessedResources?.summary?.resourceIds) {
      return [];
    }
    return activeProcessedResources.summary.resourceIds.sort();
  }, [activeProcessedResources?.summary?.resourceIds]);

  // Get qualifier type information for form controls
  const qualifierTypeInfo = useMemo(() => {
    const info: Record<string, { hasEnumeratedValues: boolean; values?: string[] }> = {};

    // For the simplified version, we'll treat all qualifiers as text inputs
    // In a more advanced version, this would examine the system configuration
    availableQualifiers.forEach((qualifierName) => {
      info[qualifierName] = { hasEnumeratedValues: false };
    });

    return info;
  }, [availableQualifiers]);

  // Handle context value changes
  const handleContextChange = useCallback(
    (qualifierName: string, value: string | undefined) => {
      resolutionActions?.updateContextValue(qualifierName, value);
    },
    [resolutionActions]
  );

  // Handle resource selection
  const handleResourceSelect = useCallback(
    (resourceId: string) => {
      resolutionActions?.selectResource(resourceId);
    },
    [resolutionActions]
  );

  // Handle view mode change
  const handleViewModeChange = useCallback(
    (mode: 'composed' | 'best' | 'all' | 'raw') => {
      resolutionActions?.setViewMode(mode);
    },
    [resolutionActions]
  );

  if (!resources) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="flex items-center space-x-3 mb-6">
          <MagnifyingGlassIcon className="h-8 w-8 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Resolution Viewer</h2>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <div className="max-w-2xl mx-auto">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">No Resources Loaded</h3>
            <p className="text-gray-600 mb-6">
              Import resources first to test resource resolution with different contexts.
            </p>
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Resolution Viewer:</strong> Test how resources resolve with different qualifier
                contexts. Set context values and see which candidates match.
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
        <MagnifyingGlassIcon className="h-8 w-8 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-900">Resolution Viewer</h2>
        {isFilteringActive && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            Filtered
          </span>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {/* Context Configuration Panel */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Context Configuration</h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="mb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {availableQualifiers.map((qualifierName) => {
                  const typeInfo = qualifierTypeInfo[qualifierName];
                  const currentValue = resolutionState?.pendingContextValues[qualifierName];

                  return (
                    <div key={qualifierName} className="bg-white rounded border border-gray-200 p-2">
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-gray-700 min-w-0 flex-shrink-0">
                          {qualifierName}:
                        </label>
                        <div className="flex-1 flex items-center gap-1">
                          <input
                            type="text"
                            value={currentValue ?? ''}
                            onChange={(e) => handleContextChange(qualifierName, e.target.value || undefined)}
                            className="flex-1 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm min-w-0"
                            placeholder={
                              currentValue === undefined ? '(undefined)' : `Enter ${qualifierName} value`
                            }
                          />
                          {currentValue !== undefined && (
                            <button
                              type="button"
                              onClick={() => handleContextChange(qualifierName, undefined)}
                              className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                              title="Set to undefined"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Current:{' '}
                {Object.entries(resolutionState?.contextValues || {})
                  .map(([key, value]) => `${key}=${value === undefined ? '(undefined)' : value}`)
                  .join(', ')}
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={resolutionActions?.resetCache}
                  className="px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  title="Clear resolution cache"
                >
                  Clear Cache
                </button>
                <button
                  onClick={resolutionActions?.applyContext}
                  disabled={!resolutionState?.hasPendingChanges}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    resolutionState?.hasPendingChanges
                      ? 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {resolutionState?.hasPendingChanges
                    ? 'Apply Changes'
                    : resolutionState?.currentResolver
                    ? 'Context Applied'
                    : 'Apply Context'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Browser/Details Layout */}
        <div className="flex flex-col lg:flex-row gap-6 h-[600px]">
          {/* Left side: Resource Selection */}
          <div className="lg:w-1/2 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Resources</h3>
              <div className="text-sm text-gray-500">{availableResources.length} available</div>
            </div>

            <div className="flex-1 overflow-y-auto border border-gray-200 rounded-lg bg-gray-50">
              {availableResources.map((resourceId) => (
                <div
                  key={resourceId}
                  className={`flex items-center px-3 py-2 cursor-pointer hover:bg-gray-100 ${
                    resolutionState?.selectedResourceId === resourceId
                      ? 'bg-blue-50 border-r-2 border-blue-500'
                      : ''
                  }`}
                  onClick={() => handleResourceSelect(resourceId)}
                >
                  <DocumentTextIcon className="w-4 h-4 mr-2 text-green-500" />
                  <span
                    className={`text-sm ${
                      resolutionState?.selectedResourceId === resourceId
                        ? 'font-medium text-blue-900'
                        : 'text-gray-700'
                    }`}
                  >
                    {resourceId}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right side: Resolution Results */}
          <div className="lg:w-1/2 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Results</h3>
              {resolutionState?.selectedResourceId && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleViewModeChange('composed')}
                    className={`px-3 py-1 text-xs rounded ${
                      resolutionState?.viewMode === 'composed'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    Composed
                  </button>
                  <button
                    onClick={() => handleViewModeChange('best')}
                    className={`px-3 py-1 text-xs rounded ${
                      resolutionState?.viewMode === 'best'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    Best
                  </button>
                  <button
                    onClick={() => handleViewModeChange('all')}
                    className={`px-3 py-1 text-xs rounded ${
                      resolutionState?.viewMode === 'all'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => handleViewModeChange('raw')}
                    className={`px-3 py-1 text-xs rounded ${
                      resolutionState?.viewMode === 'raw'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    Raw
                  </button>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto border border-gray-200 rounded-lg p-4 bg-gray-50">
              {!resolutionState?.selectedResourceId ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <CubeIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Select a resource to view resolution results</p>
                  </div>
                </div>
              ) : !resolutionState?.currentResolver ? (
                <div className="text-center text-gray-500">
                  <p>Apply a context to resolve resources</p>
                </div>
              ) : !resolutionState?.resolutionResult ? (
                <div className="text-center text-gray-500">
                  <p>Resolving...</p>
                </div>
              ) : (
                <ResolutionResults
                  result={resolutionState.resolutionResult}
                  viewMode={resolutionState.viewMode}
                  contextValues={resolutionState.contextValues}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Resolution Results Component (simplified version)
interface ResolutionResultsProps {
  result: any;
  viewMode: 'composed' | 'best' | 'all' | 'raw';
  contextValues: Record<string, string | undefined>;
}

const ResolutionResults: React.FC<ResolutionResultsProps> = ({ result, viewMode, contextValues }) => {
  if (!result.success) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h4 className="font-medium text-red-800 mb-2">Resolution Failed</h4>
        <p className="text-sm text-red-600">{result.error}</p>
      </div>
    );
  }

  if (viewMode === 'raw') {
    return (
      <div className="space-y-4">
        <div>
          <h4 className="font-medium text-gray-800 mb-2">Raw Resolution Data</h4>
          <pre className="text-xs bg-white p-3 rounded border overflow-x-auto">
            {JSON.stringify(
              {
                context: contextValues,
                resource: result.resource
                  ? {
                      id: result.resource.id,
                      candidateCount: result.resource.candidates.length
                    }
                  : null,
                bestCandidate: result.bestCandidate?.json,
                allCandidates: result.allCandidates?.map((c: any) => c.json),
                composedValue: result.composedValue,
                error: result.error
              },
              null,
              2
            )}
          </pre>
        </div>
      </div>
    );
  }

  if (viewMode === 'composed') {
    return (
      <div className="space-y-4">
        {result.composedValue ? (
          <div className="bg-white p-3 rounded border">
            <h4 className="font-medium text-gray-800 mb-2">Composed Resource Value</h4>
            <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto">
              {JSON.stringify(result.composedValue, null, 2)}
            </pre>
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
            <p className="text-sm text-yellow-800">No composed value available for the current context.</p>
            {result.error && <p className="text-xs text-yellow-600 mt-1">{result.error}</p>}
          </div>
        )}

        {result.resource && (
          <div>
            <h4 className="font-medium text-gray-800 mb-2">Resource Info</h4>
            <div className="bg-white p-3 rounded border text-sm">
              <div>
                <strong>ID:</strong> {result.resource.id}
              </div>
              <div>
                <strong>Type:</strong> {result.resource.resourceType.key}
              </div>
              <div>
                <strong>Total Candidates:</strong> {result.resource.candidates.length}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (viewMode === 'best') {
    return (
      <div className="space-y-4">
        <div>
          <h4 className="font-medium text-gray-800 mb-2">Best Match</h4>
          {result.bestCandidate ? (
            <div className="bg-white p-3 rounded border border-green-200">
              <div className="text-sm font-medium text-gray-700 mb-2">
                Selected candidate for current context
              </div>
              <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                {JSON.stringify(result.bestCandidate.json, null, 2)}
              </pre>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
              <p className="text-sm text-yellow-800">No best candidate found for the current context.</p>
              {result.error && <p className="text-xs text-yellow-600 mt-1">{result.error}</p>}
            </div>
          )}
        </div>
      </div>
    );
  }

  // 'all' view mode
  const regularMatchingCandidates =
    result.candidateDetails?.filter((c: CandidateInfo) => c.matched && !c.isDefaultMatch) || [];
  const defaultMatchingCandidates =
    result.candidateDetails?.filter((c: CandidateInfo) => c.matched && c.isDefaultMatch) || [];
  const nonMatchingCandidates = result.candidateDetails?.filter((c: CandidateInfo) => !c.matched) || [];

  const getMatchTypeColor = (type: string) => {
    switch (type) {
      case 'match':
        return 'bg-green-100 text-green-800';
      case 'matchAsDefault':
        return 'bg-amber-100 text-amber-800';
      case 'noMatch':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getMatchTypeIcon = (type: string) => {
    switch (type) {
      case 'match':
        return '✓';
      case 'matchAsDefault':
        return '≈';
      case 'noMatch':
        return '✗';
      default:
        return '?';
    }
  };

  return (
    <div className="space-y-4">
      {/* Regular Matching Candidates */}
      {regularMatchingCandidates.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-800 mb-2">Regular Matches</h4>
          <div className="space-y-2">
            {regularMatchingCandidates.map((candidateInfo: CandidateInfo, index: number) => (
              <div
                key={`regular-${candidateInfo.candidateIndex}`}
                className="bg-white p-3 rounded border border-green-200"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                    <span>
                      Candidate {candidateInfo.candidateIndex + 1} {index === 0 ? '(Best Match)' : ''}
                    </span>
                    <span
                      className={`px-2 py-1 rounded text-xs ${getMatchTypeColor(candidateInfo.matchType)}`}
                    >
                      {getMatchTypeIcon(candidateInfo.matchType)} {candidateInfo.matchType}
                    </span>
                  </div>
                </div>
                <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                  {JSON.stringify(candidateInfo.candidate.json, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Default Matching Candidates */}
      {defaultMatchingCandidates.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-800 mb-2">Default Matches</h4>
          <div className="space-y-2">
            {defaultMatchingCandidates.map((candidateInfo: CandidateInfo) => (
              <div
                key={`default-${candidateInfo.candidateIndex}`}
                className="bg-white p-3 rounded border border-amber-200"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                    <span>Candidate {candidateInfo.candidateIndex + 1}</span>
                    <span
                      className={`px-2 py-1 rounded text-xs ${getMatchTypeColor(candidateInfo.matchType)}`}
                    >
                      {getMatchTypeIcon(candidateInfo.matchType)} {candidateInfo.matchType}
                    </span>
                  </div>
                </div>
                <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                  {JSON.stringify(candidateInfo.candidate.json, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Show message when no matches */}
      {regularMatchingCandidates.length === 0 && defaultMatchingCandidates.length === 0 && (
        <div>
          <h4 className="font-medium text-gray-800 mb-2">Matching Candidates</h4>
          <p className="text-sm text-gray-600">No candidates matched the current context.</p>
        </div>
      )}

      {/* Non-matching Candidates */}
      {nonMatchingCandidates.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-500 mb-2">Non-matching Candidates</h4>
          <div className="space-y-2">
            {nonMatchingCandidates.slice(0, 3).map((candidateInfo: CandidateInfo) => (
              <div
                key={`non-matching-${candidateInfo.candidateIndex}`}
                className="bg-gray-50 p-3 rounded border border-gray-200 opacity-75"
              >
                <div className="text-sm font-medium text-gray-500 mb-2">
                  Candidate {candidateInfo.candidateIndex + 1}
                </div>
                <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto text-gray-600">
                  {JSON.stringify(candidateInfo.candidate.json, null, 2)}
                </pre>
              </div>
            ))}
            {nonMatchingCandidates.length > 3 && (
              <div className="text-center text-sm text-gray-500">
                ... and {nonMatchingCandidates.length - 3} more non-matching candidates
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ResolutionView;
