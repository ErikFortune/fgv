import React, { useState, useEffect } from 'react';
import { IResourceDetailData, IProcessedResources } from '../../../types';
import { Conditions, ResourceJson, Resources } from '@fgv/ts-res';
import { useObservability } from '../../../contexts';

/**
 * Props for the SourceResourceDetail component.
 *
 * @public
 */
export interface ISourceResourceDetailProps {
  /** The resource ID to display details for */
  resourceId: string;
  /** Processed resources containing the resource data */
  processedResources: IProcessedResources;
  /** Optional CSS classes to apply to the container */
  className?: string;
  /** Optional title for the detail panel */
  title?: string;
  // Dual-resource comparison mode props
  /** Optional original resources for comparison mode */
  originalProcessedResources?: IProcessedResources;
  /** Optional filter context for comparison */
  filterContext?: Record<string, string | undefined>;
  /** Whether to show comparison view */
  showComparison?: boolean;
  // Configurable toggle labels
  /** Label for primary resource view (default: 'Current') */
  primaryLabel?: string;
  /** Label for secondary resource view (default: 'Original') */
  secondaryLabel?: string;
}

/**
 * A comprehensive component for displaying detailed information about a specific resource.
 *
 * SourceResourceDetail provides an in-depth view of a resource's properties, candidates,
 * conditions, and metadata. It supports both single resource display and comparison mode
 * for viewing differences between filtered and original resources. The component automatically
 * extracts and presents resource information in a structured, readable format.
 *
 * @example
 * ```tsx
 * import { SourceResourceDetail } from '@fgv/ts-res-ui-components';
 *
 * function ResourceInspector() {
 *   const [selectedResourceId, setSelectedResourceId] = useState<string>('user.welcome');
 *   const processedResources = useProcessedResources();
 *
 *   return (
 *     <SourceResourceDetail
 *       resourceId={selectedResourceId}
 *       processedResources={processedResources}
 *       title="Resource Inspector"
 *       className="border rounded-lg p-4"
 *     />
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Using comparison mode to show filtered vs original resources
 * import { SourceResourceDetail, FilterTools } from '@fgv/ts-res-ui-components';
 *
 * function FilteredResourceComparison() {
 *   const { state: filterState } = FilterTools.useFilterState();
 *   const originalResources = useOriginalResources();
 *   const filteredResources = filterState.filteredResources;
 *   const [selectedId, setSelectedId] = useState<string | null>(null);
 *
 *   if (!selectedId) {
 *     return <div>Select a resource to compare</div>;
 *   }
 *
 *   return (
 *     <SourceResourceDetail
 *       resourceId={selectedId}
 *       processedResources={filteredResources}
 *       originalProcessedResources={originalResources}
 *       filterContext={filterState.appliedValues}
 *       showComparison={true}
 *       primaryLabel="Filtered"
 *       secondaryLabel="Original"
 *       title="Resource Comparison"
 *       className="comparison-panel"
 *     />
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Integration with orchestrator for comprehensive resource details
 * import { SourceResourceDetail, ResourceTools } from '@fgv/ts-res-ui-components';
 *
 * function OrchestratorResourceDetail() {
 *   const { state, actions } = ResourceTools.useResourceData();
 *
 *   if (!state.selectedResourceId || !state.resources) {
 *     return <div className="p-4 text-gray-500">No resource selected</div>;
 *   }
 *
 *   return (
 *     <div className="resource-detail-container">
 *       <div className="detail-header">
 *         <h2>Resource: {state.selectedResourceId}</h2>
 *         <button onClick={() => actions.selectResource(null)}>Clear</button>
 *       </div>
 *       <SourceResourceDetail
 *         resourceId={state.selectedResourceId}
 *         processedResources={state.resources}
 *         originalProcessedResources={state.filterResult ? state.resources : undefined}
 *         filterContext={state.filterState.appliedValues}
 *         showComparison={!!state.filterResult}
 *         title="Resource Details"
 *         className="detail-content"
 *       />
 *     </div>
 *   );
 * }
 * ```
 *
 * @public
 */
export const SourceResourceDetail: React.FC<ISourceResourceDetailProps> = ({
  resourceId,
  processedResources,
  className = '',
  title = 'Resource Details',
  originalProcessedResources,
  filterContext,
  showComparison = false,
  primaryLabel = 'Current',
  secondaryLabel = 'Original'
}) => {
  const o11y = useObservability();
  const [resourceDetail, setResourceDetail] = useState<IResourceDetailData | null>(null);
  const [originalResourceDetail, setOriginalResourceDetail] = useState<IResourceDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFilteredView, setShowFilteredView] = useState(true);

  useEffect(() => {
    const loadResourceDetail = (): void => {
      setIsLoading(true);
      setError(null);

      try {
        // Helper function to extract resource detail from processed resources
        const extractResourceDetail = (
          resources: IProcessedResources,
          isOriginal = false
        ): IResourceDetailData | null => {
          const resourceManager = resources.system.resourceManager;
          const resourceResult = resourceManager.getBuiltResource(resourceId);

          if (!resourceResult.isSuccess()) {
            return null;
          }

          const resource = resourceResult.value;
          let candidateDetails: ResourceJson.Normalized.IChildResourceCandidateDecl[] = [];

          // Check if candidates have conditions property (ResourceManagerBuilder format)
          if (resource.candidates.length > 0 && 'conditions' in resource.candidates[0]) {
            // ResourceManagerBuilder format with full condition details
            candidateDetails = resource.candidates.map((candidate: Resources.ResourceCandidate) => ({
              json: candidate.json,
              conditions:
                candidate.conditions?.conditions?.map(
                  (condition: Conditions.Condition): ResourceJson.Json.ILooseConditionDecl => ({
                    qualifierName: condition.qualifier.name,
                    operator: condition.operator,
                    value: condition.value,
                    priority: condition.priority,
                    scoreAsDefault: condition.scoreAsDefault
                  })
                ) || [],
              isPartial: candidate.isPartial,
              mergeMethod: candidate.mergeMethod
            }));
          } else {
            // IResourceManager format - extract conditions from compiled collection
            const compiledCollection = resources.compiledCollection;
            const compiledResource = compiledCollection?.resources?.find(
              (r: ResourceJson.Compiled.ICompiledResource) => r.id === resourceId
            );

            candidateDetails = resource.candidates.map(
              (candidate: Resources.ResourceCandidate, index: number) => {
                // Try to get conditions from the compiled collection
                let conditions: ResourceJson.Json.ILooseConditionDecl[] = [];

                if (compiledResource && compiledCollection) {
                  const decision = compiledCollection.decisions?.[compiledResource.decision];
                  if (decision?.conditionSets && index < decision.conditionSets.length) {
                    const conditionSetIndex = decision.conditionSets[index];
                    const conditionSet = compiledCollection.conditionSets?.[conditionSetIndex];

                    if (conditionSet?.conditions) {
                      conditions = conditionSet.conditions
                        .map((condIndex: number): ResourceJson.Json.ILooseConditionDecl | null => {
                          const condition = compiledCollection.conditions?.[condIndex];
                          const qualifier = compiledCollection.qualifiers?.[condition?.qualifierIndex];
                          return condition && qualifier
                            ? {
                                qualifierName: qualifier.name,
                                operator: condition.operator,
                                value: condition.value,
                                priority: condition.priority || qualifier.defaultPriority || 500,
                                scoreAsDefault: condition.scoreAsDefault
                              }
                            : null;
                        })
                        .filter((c): c is ResourceJson.Json.ILooseConditionDecl => c !== null);
                    }
                  }
                }

                return {
                  json: candidate.json,
                  conditions: conditions,
                  isPartial: candidate.isPartial,
                  mergeMethod: candidate.mergeMethod
                };
              }
            );
          }

          return {
            id: resource.id,
            resourceType: resource.resourceType.key || 'unknown',
            candidateCount: resource.candidates.length,
            candidates: candidateDetails
          };
        };

        // Load current/filtered resource detail
        const currentDetail = extractResourceDetail(processedResources, false);
        if (currentDetail) {
          setResourceDetail(currentDetail);
        } else {
          const errorMessage = `${resourceId}: Failed to load resource details`;
          setError(errorMessage);
          o11y.user.error(errorMessage);
          return;
        }

        // Load original resource detail if in comparison mode
        if (showComparison && originalProcessedResources) {
          const originalDetail = extractResourceDetail(originalProcessedResources, true);
          if (originalDetail) {
            setOriginalResourceDetail(originalDetail);
          }
        } else {
          setOriginalResourceDetail(null);
        }

        o11y.user.info(`${resourceId}: Resource details loaded successfully`);
      } catch (err) {
        const errorMsg = `${resourceId}: Error loading resource details - ${
          err instanceof Error ? err.message : String(err)
        }`;
        setError(errorMsg);
        o11y.user.error(errorMsg);
      } finally {
        setIsLoading(false);
      }
    };

    loadResourceDetail();
  }, [resourceId, processedResources, originalProcessedResources, showComparison, o11y]);

  if (isLoading) {
    return (
      <div className={`flex flex-col h-full ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="flex-1 flex items-center justify-center border border-gray-200 rounded-lg bg-gray-50">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-500">Loading resource details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex flex-col h-full ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="flex-1 border border-gray-200 rounded-lg p-4 bg-red-50">
          <div className="text-center">
            <p className="text-red-600 font-medium mb-2">Error Loading Resource</p>
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!resourceDetail) {
    return (
      <div className={`flex flex-col h-full ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="flex-1 flex items-center justify-center border border-gray-200 rounded-lg bg-gray-50">
          <p className="text-gray-500">No resource details available</p>
        </div>
      </div>
    );
  }

  // Determine which resource detail to show and comparison state
  const currentDetail =
    showComparison && !showFilteredView && originalResourceDetail ? originalResourceDetail : resourceDetail;
  const isShowingPrimary = !showComparison || showFilteredView;

  return (
    <div className={`flex flex-col h-full ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {showComparison && originalResourceDetail && (
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
              {secondaryLabel} ({originalResourceDetail.candidateCount})
            </button>
            <button
              onClick={() => setShowFilteredView(true)}
              className={`px-2 py-1 text-xs rounded ${
                showFilteredView
                  ? 'bg-purple-100 text-purple-800 font-medium'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {primaryLabel} ({resourceDetail.candidateCount})
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto border border-gray-200 rounded-lg p-4 bg-gray-50">
        <div className="space-y-6">
          {/* Resource Overview */}
          <div>
            <h4 className="font-medium text-gray-700 mb-3">Resource Overview</h4>
            <div className="bg-white p-4 rounded-lg border space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-600">Fully Qualified ID:</span>
                <code className="text-sm bg-gray-100 px-2 py-1 rounded ml-2 break-all">
                  {currentDetail.id}
                </code>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Resource Type:</span>
                <span className="ml-2 text-sm">{currentDetail.resourceType}</span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Candidate Count:</span>
                <span
                  className={`ml-2 text-sm font-medium ${
                    showComparison && originalResourceDetail
                      ? currentDetail.candidateCount === 0
                        ? 'text-red-600'
                        : currentDetail.candidateCount <
                          (isShowingPrimary
                            ? originalResourceDetail.candidateCount
                            : resourceDetail.candidateCount)
                        ? 'text-amber-600'
                        : 'text-green-600'
                      : 'text-blue-600'
                  }`}
                >
                  {currentDetail.candidateCount}
                  {showComparison &&
                    originalResourceDetail &&
                    currentDetail.candidateCount !==
                      (isShowingPrimary
                        ? originalResourceDetail.candidateCount
                        : resourceDetail.candidateCount) && (
                      <span className="text-gray-400 ml-1">
                        (was{' '}
                        {isShowingPrimary
                          ? originalResourceDetail.candidateCount
                          : resourceDetail.candidateCount}
                        )
                      </span>
                    )}
                </span>
              </div>
              {showComparison && filterContext && (
                <div>
                  <span className="text-sm font-medium text-gray-600">Filter Context:</span>
                  <span className="ml-2 text-sm text-purple-700">
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
          <div>
            <h4 className="font-medium text-gray-700 mb-3">
              {showComparison && !isShowingPrimary
                ? `${secondaryLabel} `
                : showComparison && isShowingPrimary
                ? `${primaryLabel} `
                : ''}
              Candidates ({currentDetail.candidates.length})
            </h4>
            {currentDetail.candidates.length > 0 ? (
              <div className="space-y-4">
                {currentDetail.candidates.map((candidate, index) => (
                  <div key={index} className="bg-white p-4 rounded-lg border">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-medium text-gray-800">Candidate {index + 1}</h5>
                      <div className="flex items-center space-x-2 text-xs">
                        {candidate.isPartial && (
                          <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Partial</span>
                        )}
                        <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded">
                          {candidate.mergeMethod}
                        </span>
                      </div>
                    </div>

                    {/* Conditions */}
                    {(candidate.conditions?.length ?? 0) > 0 && (
                      <div className="mb-3">
                        <h6 className="text-sm font-medium text-gray-600 mb-2">Conditions:</h6>
                        <div className="space-y-1">
                          {candidate.conditions?.map((condition, condIndex) => (
                            <div
                              key={condIndex}
                              className="flex items-center text-xs bg-blue-50 px-2 py-1 rounded"
                            >
                              <span className="font-medium text-blue-800">{condition.qualifierName}</span>
                              <span className="mx-1 text-blue-600">{condition.operator}</span>
                              <span className="text-blue-700">{condition.value}</span>
                              <div className="ml-auto flex items-center space-x-2">
                                <span className="text-blue-500">priority: {condition.priority}</span>
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
                    )}

                    {(candidate.conditions?.length ?? 0) === 0 && (
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
                ))}
              </div>
            ) : (
              <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                <p className="text-sm text-red-700 font-medium">No candidates available</p>
                <p className="text-xs text-red-600 mt-1">
                  {showComparison
                    ? 'This resource has been completely filtered out. Consider adjusting your filter criteria.'
                    : 'This resource has no candidates defined.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SourceResourceDetail;
