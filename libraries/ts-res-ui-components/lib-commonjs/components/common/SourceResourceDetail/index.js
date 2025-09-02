'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.SourceResourceDetail = void 0;
const tslib_1 = require('tslib');
const react_1 = tslib_1.__importStar(require('react'));
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
 *       onMessage={(type, msg) => console.log(`${type}: ${msg}`)}
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
 *         onMessage={actions.addMessage}
 *         className="detail-content"
 *       />
 *     </div>
 *   );
 * }
 * ```
 *
 * @public
 */
const SourceResourceDetail = ({
  resourceId,
  processedResources,
  onMessage,
  className = '',
  title = 'Resource Details',
  originalProcessedResources,
  filterContext,
  showComparison = false,
  primaryLabel = 'Current',
  secondaryLabel = 'Original'
}) => {
  const [resourceDetail, setResourceDetail] = (0, react_1.useState)(null);
  const [originalResourceDetail, setOriginalResourceDetail] = (0, react_1.useState)(null);
  const [isLoading, setIsLoading] = (0, react_1.useState)(false);
  const [error, setError] = (0, react_1.useState)(null);
  const [showFilteredView, setShowFilteredView] = (0, react_1.useState)(true);
  (0, react_1.useEffect)(() => {
    const loadResourceDetail = () => {
      setIsLoading(true);
      setError(null);
      try {
        // Helper function to extract resource detail from processed resources
        const extractResourceDetail = (resources, isOriginal = false) => {
          const resourceManager = resources.system.resourceManager;
          const resourceResult = resourceManager.getBuiltResource(resourceId);
          if (!resourceResult.isSuccess()) {
            return null;
          }
          const resource = resourceResult.value;
          let candidateDetails = [];
          // Check if candidates have conditions property (ResourceManagerBuilder format)
          if (resource.candidates.length > 0 && 'conditions' in resource.candidates[0]) {
            // ResourceManagerBuilder format with full condition details
            candidateDetails = resource.candidates.map((candidate) => ({
              json: candidate.json,
              conditions:
                candidate.conditions?.conditions?.map((condition) => ({
                  qualifier: condition.qualifier.name,
                  operator: condition.operator,
                  value: condition.value,
                  priority: condition.priority,
                  scoreAsDefault: condition.scoreAsDefault
                })) || [],
              isPartial: candidate.isPartial,
              mergeMethod: candidate.mergeMethod
            }));
          } else {
            // IResourceManager format - extract conditions from compiled collection
            const compiledCollection = resources.compiledCollection;
            const compiledResource = compiledCollection?.resources?.find((r) => r.id === resourceId);
            candidateDetails = resource.candidates.map((candidate, index) => {
              // Try to get conditions from the compiled collection
              let conditions = [];
              if (compiledResource && compiledCollection) {
                const decision = compiledCollection.decisions?.[compiledResource.decision];
                if (decision?.conditionSets && index < decision.conditionSets.length) {
                  const conditionSetIndex = decision.conditionSets[index];
                  const conditionSet = compiledCollection.conditionSets?.[conditionSetIndex];
                  if (conditionSet?.conditions) {
                    conditions = conditionSet.conditions
                      .map((condIndex) => {
                        const condition = compiledCollection.conditions?.[condIndex];
                        const qualifier = compiledCollection.qualifiers?.[condition?.qualifierIndex];
                        return condition && qualifier
                          ? {
                              qualifier: qualifier.name,
                              operator: condition.operator || 'eq',
                              value: condition.value,
                              priority: condition.priority || qualifier.defaultPriority || 500,
                              scoreAsDefault: condition.scoreAsDefault
                            }
                          : null;
                      })
                      .filter(Boolean);
                  }
                }
              }
              return {
                json: candidate.json,
                conditions: conditions,
                isPartial: candidate.isPartial,
                mergeMethod: candidate.mergeMethod
              };
            });
          }
          return {
            id: resource.id,
            resourceType: resource.resourceType.key || resource.resourceType.name || 'unknown',
            candidateCount: resource.candidates.length,
            candidates: candidateDetails
          };
        };
        // Load current/filtered resource detail
        const currentDetail = extractResourceDetail(processedResources, false);
        if (currentDetail) {
          setResourceDetail(currentDetail);
        } else {
          setError(`Failed to load resource details for: ${resourceId}`);
          onMessage?.('error', `Failed to load resource details for: ${resourceId}`);
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
        onMessage?.('info', `Loaded details for resource: ${resourceId}`);
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
    loadResourceDetail();
  }, [resourceId, processedResources, originalProcessedResources, showComparison, onMessage]);
  if (isLoading) {
    return react_1.default.createElement(
      'div',
      { className: `flex flex-col h-full ${className}` },
      react_1.default.createElement('h3', { className: 'text-lg font-semibold text-gray-900 mb-4' }, title),
      react_1.default.createElement(
        'div',
        { className: 'flex-1 flex items-center justify-center border border-gray-200 rounded-lg bg-gray-50' },
        react_1.default.createElement(
          'div',
          { className: 'text-center' },
          react_1.default.createElement('div', {
            className:
              'animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4'
          }),
          react_1.default.createElement('p', { className: 'text-gray-500' }, 'Loading resource details...')
        )
      )
    );
  }
  if (error) {
    return react_1.default.createElement(
      'div',
      { className: `flex flex-col h-full ${className}` },
      react_1.default.createElement('h3', { className: 'text-lg font-semibold text-gray-900 mb-4' }, title),
      react_1.default.createElement(
        'div',
        { className: 'flex-1 border border-gray-200 rounded-lg p-4 bg-red-50' },
        react_1.default.createElement(
          'div',
          { className: 'text-center' },
          react_1.default.createElement(
            'p',
            { className: 'text-red-600 font-medium mb-2' },
            'Error Loading Resource'
          ),
          react_1.default.createElement('p', { className: 'text-red-500 text-sm' }, error)
        )
      )
    );
  }
  if (!resourceDetail) {
    return react_1.default.createElement(
      'div',
      { className: `flex flex-col h-full ${className}` },
      react_1.default.createElement('h3', { className: 'text-lg font-semibold text-gray-900 mb-4' }, title),
      react_1.default.createElement(
        'div',
        { className: 'flex-1 flex items-center justify-center border border-gray-200 rounded-lg bg-gray-50' },
        react_1.default.createElement('p', { className: 'text-gray-500' }, 'No resource details available')
      )
    );
  }
  // Determine which resource detail to show and comparison state
  const currentDetail =
    showComparison && !showFilteredView && originalResourceDetail ? originalResourceDetail : resourceDetail;
  const isShowingPrimary = !showComparison || showFilteredView;
  return react_1.default.createElement(
    'div',
    { className: `flex flex-col h-full ${className}` },
    react_1.default.createElement(
      'div',
      { className: 'flex items-center justify-between mb-4' },
      react_1.default.createElement('h3', { className: 'text-lg font-semibold text-gray-900' }, title),
      showComparison &&
        originalResourceDetail &&
        react_1.default.createElement(
          'div',
          { className: 'flex items-center space-x-2' },
          react_1.default.createElement('span', { className: 'text-xs text-gray-500' }, 'View:'),
          react_1.default.createElement(
            'button',
            {
              onClick: () => setShowFilteredView(false),
              className: `px-2 py-1 text-xs rounded ${
                !showFilteredView
                  ? 'bg-blue-100 text-blue-800 font-medium'
                  : 'text-gray-600 hover:bg-gray-100'
              }`
            },
            secondaryLabel,
            ' (',
            originalResourceDetail.candidateCount,
            ')'
          ),
          react_1.default.createElement(
            'button',
            {
              onClick: () => setShowFilteredView(true),
              className: `px-2 py-1 text-xs rounded ${
                showFilteredView
                  ? 'bg-purple-100 text-purple-800 font-medium'
                  : 'text-gray-600 hover:bg-gray-100'
              }`
            },
            primaryLabel,
            ' (',
            resourceDetail.candidateCount,
            ')'
          )
        )
    ),
    react_1.default.createElement(
      'div',
      { className: 'flex-1 overflow-y-auto border border-gray-200 rounded-lg p-4 bg-gray-50' },
      react_1.default.createElement(
        'div',
        { className: 'space-y-6' },
        react_1.default.createElement(
          'div',
          null,
          react_1.default.createElement(
            'h4',
            { className: 'font-medium text-gray-700 mb-3' },
            'Resource Overview'
          ),
          react_1.default.createElement(
            'div',
            { className: 'bg-white p-4 rounded-lg border space-y-3' },
            react_1.default.createElement(
              'div',
              null,
              react_1.default.createElement(
                'span',
                { className: 'text-sm font-medium text-gray-600' },
                'Fully Qualified ID:'
              ),
              react_1.default.createElement(
                'code',
                { className: 'text-sm bg-gray-100 px-2 py-1 rounded ml-2 break-all' },
                currentDetail.id
              )
            ),
            react_1.default.createElement(
              'div',
              null,
              react_1.default.createElement(
                'span',
                { className: 'text-sm font-medium text-gray-600' },
                'Resource Type:'
              ),
              react_1.default.createElement('span', { className: 'ml-2 text-sm' }, currentDetail.resourceType)
            ),
            react_1.default.createElement(
              'div',
              null,
              react_1.default.createElement(
                'span',
                { className: 'text-sm font-medium text-gray-600' },
                'Candidate Count:'
              ),
              react_1.default.createElement(
                'span',
                {
                  className: `ml-2 text-sm font-medium ${
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
                  }`
                },
                currentDetail.candidateCount,
                showComparison &&
                  originalResourceDetail &&
                  currentDetail.candidateCount !==
                    (isShowingPrimary
                      ? originalResourceDetail.candidateCount
                      : resourceDetail.candidateCount) &&
                  react_1.default.createElement(
                    'span',
                    { className: 'text-gray-400 ml-1' },
                    '(was',
                    ' ',
                    isShowingPrimary ? originalResourceDetail.candidateCount : resourceDetail.candidateCount,
                    ')'
                  )
              )
            ),
            showComparison &&
              filterContext &&
              react_1.default.createElement(
                'div',
                null,
                react_1.default.createElement(
                  'span',
                  { className: 'text-sm font-medium text-gray-600' },
                  'Filter Context:'
                ),
                react_1.default.createElement(
                  'span',
                  { className: 'ml-2 text-sm text-purple-700' },
                  Object.entries(filterContext)
                    .filter(([, value]) => value !== undefined && value !== '')
                    .map(([key, value]) => `${key}=${value}`)
                    .join(', ') || 'No filters'
                )
              )
          )
        ),
        react_1.default.createElement(
          'div',
          null,
          react_1.default.createElement(
            'h4',
            { className: 'font-medium text-gray-700 mb-3' },
            showComparison && !isShowingPrimary
              ? `${secondaryLabel} `
              : showComparison && isShowingPrimary
              ? `${primaryLabel} `
              : '',
            'Candidates (',
            currentDetail.candidates.length,
            ')'
          ),
          currentDetail.candidates.length > 0
            ? react_1.default.createElement(
                'div',
                { className: 'space-y-4' },
                currentDetail.candidates.map((candidate, index) =>
                  react_1.default.createElement(
                    'div',
                    { key: index, className: 'bg-white p-4 rounded-lg border' },
                    react_1.default.createElement(
                      'div',
                      { className: 'flex items-center justify-between mb-3' },
                      react_1.default.createElement(
                        'h5',
                        { className: 'font-medium text-gray-800' },
                        'Candidate ',
                        index + 1
                      ),
                      react_1.default.createElement(
                        'div',
                        { className: 'flex items-center space-x-2 text-xs' },
                        candidate.isPartial &&
                          react_1.default.createElement(
                            'span',
                            { className: 'bg-yellow-100 text-yellow-800 px-2 py-1 rounded' },
                            'Partial'
                          ),
                        react_1.default.createElement(
                          'span',
                          { className: 'bg-gray-100 text-gray-700 px-2 py-1 rounded' },
                          candidate.mergeMethod
                        )
                      )
                    ),
                    candidate.conditions.length > 0 &&
                      react_1.default.createElement(
                        'div',
                        { className: 'mb-3' },
                        react_1.default.createElement(
                          'h6',
                          { className: 'text-sm font-medium text-gray-600 mb-2' },
                          'Conditions:'
                        ),
                        react_1.default.createElement(
                          'div',
                          { className: 'space-y-1' },
                          candidate.conditions.map((condition, condIndex) =>
                            react_1.default.createElement(
                              'div',
                              {
                                key: condIndex,
                                className: 'flex items-center text-xs bg-blue-50 px-2 py-1 rounded'
                              },
                              react_1.default.createElement(
                                'span',
                                { className: 'font-medium text-blue-800' },
                                condition.qualifier
                              ),
                              react_1.default.createElement(
                                'span',
                                { className: 'mx-1 text-blue-600' },
                                condition.operator
                              ),
                              react_1.default.createElement(
                                'span',
                                { className: 'text-blue-700' },
                                condition.value
                              ),
                              react_1.default.createElement(
                                'div',
                                { className: 'ml-auto flex items-center space-x-2' },
                                react_1.default.createElement(
                                  'span',
                                  { className: 'text-blue-500' },
                                  'priority: ',
                                  condition.priority
                                ),
                                condition.scoreAsDefault !== undefined &&
                                  react_1.default.createElement(
                                    'span',
                                    { className: 'text-amber-600 font-medium' },
                                    'default: ',
                                    condition.scoreAsDefault
                                  )
                              )
                            )
                          )
                        )
                      ),
                    candidate.conditions.length === 0 &&
                      react_1.default.createElement(
                        'div',
                        { className: 'mb-3' },
                        react_1.default.createElement(
                          'span',
                          { className: 'text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded' },
                          'No conditions (default candidate)'
                        )
                      ),
                    react_1.default.createElement(
                      'div',
                      null,
                      react_1.default.createElement(
                        'h6',
                        { className: 'text-sm font-medium text-gray-600 mb-2' },
                        'Content:'
                      ),
                      react_1.default.createElement(
                        'pre',
                        { className: 'text-xs bg-gray-50 p-3 rounded border overflow-x-auto max-h-40' },
                        JSON.stringify(candidate.json, null, 2)
                      )
                    )
                  )
                )
              )
            : react_1.default.createElement(
                'div',
                { className: 'bg-red-50 border border-red-200 p-4 rounded-lg' },
                react_1.default.createElement(
                  'p',
                  { className: 'text-sm text-red-700 font-medium' },
                  'No candidates available'
                ),
                react_1.default.createElement(
                  'p',
                  { className: 'text-xs text-red-600 mt-1' },
                  showComparison
                    ? 'This resource has been completely filtered out. Consider adjusting your filter criteria.'
                    : 'This resource has no candidates defined.'
                )
              )
        )
      )
    )
  );
};
exports.SourceResourceDetail = SourceResourceDetail;
exports.default = exports.SourceResourceDetail;
//# sourceMappingURL=index.js.map
