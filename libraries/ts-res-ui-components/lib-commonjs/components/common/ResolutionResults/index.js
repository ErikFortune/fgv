'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.ResolutionResults = void 0;
const tslib_1 = require('tslib');
const react_1 = tslib_1.__importStar(require('react'));
const EditableJsonView_1 = require('../../views/ResolutionView/EditableJsonView');
/**
 * A comprehensive component for displaying resource resolution results with multiple view modes.
 *
 * ResolutionResults provides a flexible interface for presenting resource resolution data
 * in various formats including composed values, best candidate selection, all candidates,
 * and raw resolution data. It supports interactive editing when provided with appropriate
 * actions and state, and can be customized with resource editor factories.
 *
 * @example
 * ```tsx
 * import { ResolutionResults } from '@fgv/ts-res-ui-components';
 *
 * function BasicResolutionDisplay() {
 *   const [viewMode, setViewMode] = useState<'composed' | 'best' | 'all' | 'raw'>('composed');
 *   const resolutionResult = { value: 'Hello World', candidates: [...] };
 *   const context = { language: 'en-US', platform: 'web' };
 *
 *   return (
 *     <div>
 *       <div className="view-controls">
 *         <button onClick={() => setViewMode('composed')}>Composed</button>
 *         <button onClick={() => setViewMode('best')}>Best</button>
 *         <button onClick={() => setViewMode('all')}>All</button>
 *         <button onClick={() => setViewMode('raw')}>Raw</button>
 *       </div>
 *       <ResolutionResults
 *         result={resolutionResult}
 *         viewMode={viewMode}
 *         contextValues={context}
 *         onMessage={(type, msg) => console.log(`${type}: ${msg}`)}
 *       />
 *     </div>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Using with resolution state and editing capabilities
 * import { ResolutionTools } from '@fgv/ts-res-ui-components';
 *
 * function InteractiveResolutionResults() {
 *   const { state: resolutionState, actions: resolutionActions } = ResolutionTools.useResolutionState();
 *
 *   const customEditorFactory = {
 *     createEditor: (resourceId: string, value: any) => ({
 *       success: true,
 *       editor: MyCustomEditor
 *     })
 *   };
 *
 *   return (
 *     <ResolutionResults
 *       result={resolutionState.currentResult}
 *       viewMode={resolutionState.viewMode}
 *       contextValues={resolutionState.context}
 *       resolutionActions={resolutionActions}
 *       resolutionState={resolutionState}
 *       resourceEditorFactory={customEditorFactory}
 *       onMessage={(type, message) => {
 *         resolutionActions.addMessage(type, message);
 *       }}
 *     />
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Advanced usage with orchestrator integration
 * import { ResourceTools } from '@fgv/ts-res-ui-components';
 *
 * function OrchestratorResolutionDisplay() {
 *   const { state, actions } = ResourceTools.useResourceData();
 *   const [selectedResourceId, setSelectedResourceId] = useState<string | null>(null);
 *
 *   const handleResourceResolve = async (resourceId: string) => {
 *     const result = await actions.resolveResource(resourceId, state.resolutionState.context);
 *     if (result.isSuccess()) {
 *       setSelectedResourceId(resourceId);
 *     }
 *   };
 *
 *   if (!selectedResourceId || !state.resolutionState.currentResult) {
 *     return <div>Select a resource to see resolution results</div>;
 *   }
 *
 *   return (
 *     <div className="resolution-display">
 *       <div className="resource-info">
 *         <h3>Resolution for: {selectedResourceId}</h3>
 *         <p>Context: {JSON.stringify(state.resolutionState.context)}</p>
 *       </div>
 *       <ResolutionResults
 *         result={state.resolutionState.currentResult}
 *         viewMode={state.resolutionState.viewMode}
 *         contextValues={state.resolutionState.context}
 *         resolutionActions={{
 *           ...state.resolutionState,
 *           setViewMode: actions.setResolutionViewMode,
 *           saveEdit: actions.saveResourceEdit
 *         }}
 *         resolutionState={state.resolutionState}
 *         onMessage={actions.addMessage}
 *       />
 *     </div>
 *   );
 * }
 * ```
 *
 * @public
 */
const ResolutionResults = ({
  result,
  viewMode,
  contextValues,
  resolutionActions,
  resolutionState,
  resourceEditorFactory,
  onMessage
}) => {
  // Use a ref to store messages and useCallback to send them
  const pendingMessagesRef = react_1.default.useRef([]);
  // Function to queue a message for later sending
  const queueMessage = react_1.default.useCallback((type, message) => {
    pendingMessagesRef.current.push({ type, message });
  }, []);
  // Function to flush queued messages
  const flushMessages = react_1.default.useCallback(() => {
    if (pendingMessagesRef.current.length > 0 && onMessage) {
      pendingMessagesRef.current.forEach(({ type, message }) => {
        onMessage(type, message);
      });
      pendingMessagesRef.current = [];
    }
  }, [onMessage]);
  // Flush messages after render is complete
  react_1.default.useEffect(() => {
    flushMessages();
  });
  // Helper function to create the appropriate resource editor
  const createResourceEditor = (0, react_1.useCallback)(
    (value, resourceId, isEdited, editedValue, onSave, onCancel, disabled, className) => {
      // Try to get resource type from the result
      const resourceType =
        result?.resource?.resourceType?.key || result?.resource?.resourceType?.name || 'unknown';
      // Try the factory first if provided
      if (resourceEditorFactory) {
        try {
          const factoryResult = resourceEditorFactory.createEditor(resourceId, resourceType, value);
          if (factoryResult.success) {
            const CustomEditor = factoryResult.editor;
            return react_1.default.createElement(CustomEditor, {
              value: value,
              resourceId: resourceId,
              isEdited: isEdited,
              editedValue: editedValue,
              onSave: onSave,
              onCancel: onCancel,
              disabled: disabled,
              className: className
            });
          } else {
            // Factory couldn't create editor, queue message and fall back to JSON editor
            if (factoryResult.message) {
              queueMessage('info', `Using default JSON editor: ${factoryResult.message}`);
            }
            // Continue to fallback JSON editor below
          }
        } catch (error) {
          // Factory threw an error, queue message and fall back to JSON editor
          queueMessage(
            'warning',
            `Resource editor factory failed: ${error instanceof Error ? error.message : String(error)}`
          );
          // Continue to fallback JSON editor below
        }
      }
      // Fall back to the default JSON editor
      return react_1.default.createElement(EditableJsonView_1.EditableJsonView, {
        value: value,
        resourceId: resourceId,
        isEdited: isEdited,
        editedValue: editedValue,
        onSave: onSave,
        onCancel: onCancel,
        disabled: disabled,
        className: className
      });
    },
    [resourceEditorFactory, result, queueMessage]
  );
  if (!result.success) {
    return react_1.default.createElement(
      'div',
      { className: 'bg-red-50 border border-red-200 rounded-lg p-4' },
      react_1.default.createElement(
        'h4',
        { className: 'font-medium text-red-800 mb-2' },
        'Resolution Failed'
      ),
      react_1.default.createElement('p', { className: 'text-sm text-red-600' }, result.error)
    );
  }
  if (viewMode === 'raw') {
    return react_1.default.createElement(
      'div',
      { className: 'space-y-4' },
      react_1.default.createElement(
        'div',
        null,
        react_1.default.createElement(
          'h4',
          { className: 'font-medium text-gray-800 mb-2' },
          'Raw Resolution Data'
        ),
        react_1.default.createElement(
          'pre',
          { className: 'text-xs bg-white p-3 rounded border overflow-x-auto' },
          JSON.stringify(
            {
              context: contextValues,
              resource: result.resource
                ? {
                    id: result.resource.id,
                    candidateCount: result.resource.candidates.length
                  }
                : null,
              bestCandidate: result.bestCandidate?.json,
              allCandidates: result.allCandidates?.map((c) => c.json),
              composedValue: result.composedValue,
              error: result.error
            },
            null,
            2
          )
        )
      )
    );
  }
  if (viewMode === 'composed') {
    return react_1.default.createElement(
      'div',
      { className: 'space-y-4' },
      result.composedValue
        ? createResourceEditor(
            result.composedValue,
            result.resourceId,
            resolutionActions?.hasEdit?.(result.resourceId) || false,
            resolutionActions?.getEditedValue?.(result.resourceId),
            resolutionActions?.saveEdit,
            () => {}, // Could add cancel functionality if needed
            resolutionState?.isApplyingEdits || false
          )
        : react_1.default.createElement(
            'div',
            { className: 'bg-yellow-50 border border-yellow-200 rounded p-3' },
            react_1.default.createElement(
              'p',
              { className: 'text-sm text-yellow-800' },
              'No composed value available for the current context.'
            ),
            result.error &&
              react_1.default.createElement('p', { className: 'text-xs text-yellow-600 mt-1' }, result.error)
          ),
      result.resource &&
        react_1.default.createElement(
          'div',
          null,
          react_1.default.createElement(
            'h4',
            { className: 'font-medium text-gray-800 mb-2' },
            'Resource Info'
          ),
          react_1.default.createElement(
            'div',
            { className: 'bg-white p-3 rounded border text-sm' },
            react_1.default.createElement(
              'div',
              null,
              react_1.default.createElement('strong', null, 'ID:'),
              ' ',
              result.resource.id
            ),
            react_1.default.createElement(
              'div',
              null,
              react_1.default.createElement('strong', null, 'Type:'),
              ' ',
              result.resource.resourceType.key
            ),
            react_1.default.createElement(
              'div',
              null,
              react_1.default.createElement('strong', null, 'Total Candidates:'),
              ' ',
              result.resource.candidates.length
            )
          )
        )
    );
  }
  if (viewMode === 'best') {
    return react_1.default.createElement(
      'div',
      { className: 'space-y-4' },
      react_1.default.createElement(
        'div',
        null,
        react_1.default.createElement('h4', { className: 'font-medium text-gray-800 mb-2' }, 'Best Match'),
        result.bestCandidate
          ? react_1.default.createElement(
              'div',
              { className: 'bg-white p-3 rounded border border-green-200' },
              react_1.default.createElement(
                'div',
                { className: 'text-sm font-medium text-gray-700 mb-2' },
                'Selected candidate for current context'
              ),
              react_1.default.createElement(
                'pre',
                { className: 'text-xs bg-gray-50 p-2 rounded overflow-x-auto' },
                JSON.stringify(result.bestCandidate.json, null, 2)
              )
            )
          : react_1.default.createElement(
              'div',
              { className: 'bg-yellow-50 border border-yellow-200 rounded p-3' },
              react_1.default.createElement(
                'p',
                { className: 'text-sm text-yellow-800' },
                'No best candidate found for the current context.'
              ),
              result.error &&
                react_1.default.createElement(
                  'p',
                  { className: 'text-xs text-yellow-600 mt-1' },
                  result.error
                )
            )
      )
    );
  }
  // 'all' view mode
  const regularMatchingCandidates =
    result.candidateDetails?.filter((c) => c.matched && !c.isDefaultMatch) || [];
  const defaultMatchingCandidates =
    result.candidateDetails?.filter((c) => c.matched && c.isDefaultMatch) || [];
  const nonMatchingCandidates = result.candidateDetails?.filter((c) => !c.matched) || [];
  const getMatchTypeColor = (type) => {
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
  const getMatchTypeIcon = (type) => {
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
  return react_1.default.createElement(
    'div',
    { className: 'space-y-4' },
    regularMatchingCandidates.length > 0 &&
      react_1.default.createElement(
        'div',
        null,
        react_1.default.createElement(
          'h4',
          { className: 'font-medium text-gray-800 mb-2' },
          'Regular Matches'
        ),
        react_1.default.createElement(
          'div',
          { className: 'space-y-2' },
          regularMatchingCandidates.map((candidateInfo, index) =>
            react_1.default.createElement(
              'div',
              {
                key: `regular-${candidateInfo.candidateIndex}`,
                className: 'bg-white p-3 rounded border border-green-200'
              },
              react_1.default.createElement(
                'div',
                { className: 'flex items-center justify-between mb-2' },
                react_1.default.createElement(
                  'div',
                  { className: 'text-sm font-medium text-gray-700 flex items-center space-x-2' },
                  react_1.default.createElement(
                    'span',
                    null,
                    'Candidate ',
                    candidateInfo.candidateIndex + 1,
                    ' ',
                    index === 0 ? '(Best Match)' : ''
                  ),
                  react_1.default.createElement(
                    'span',
                    { className: `px-2 py-1 rounded text-xs ${getMatchTypeColor(candidateInfo.matchType)}` },
                    getMatchTypeIcon(candidateInfo.matchType),
                    ' ',
                    candidateInfo.matchType
                  )
                )
              ),
              react_1.default.createElement(
                'pre',
                { className: 'text-xs bg-gray-50 p-2 rounded overflow-x-auto' },
                JSON.stringify(candidateInfo.candidate.json, null, 2)
              )
            )
          )
        )
      ),
    defaultMatchingCandidates.length > 0 &&
      react_1.default.createElement(
        'div',
        null,
        react_1.default.createElement(
          'h4',
          { className: 'font-medium text-gray-800 mb-2' },
          'Default Matches'
        ),
        react_1.default.createElement(
          'div',
          { className: 'space-y-2' },
          defaultMatchingCandidates.map((candidateInfo) =>
            react_1.default.createElement(
              'div',
              {
                key: `default-${candidateInfo.candidateIndex}`,
                className: 'bg-white p-3 rounded border border-amber-200'
              },
              react_1.default.createElement(
                'div',
                { className: 'flex items-center justify-between mb-2' },
                react_1.default.createElement(
                  'div',
                  { className: 'text-sm font-medium text-gray-700 flex items-center space-x-2' },
                  react_1.default.createElement('span', null, 'Candidate ', candidateInfo.candidateIndex + 1),
                  react_1.default.createElement(
                    'span',
                    { className: `px-2 py-1 rounded text-xs ${getMatchTypeColor(candidateInfo.matchType)}` },
                    getMatchTypeIcon(candidateInfo.matchType),
                    ' ',
                    candidateInfo.matchType
                  )
                )
              ),
              react_1.default.createElement(
                'pre',
                { className: 'text-xs bg-gray-50 p-2 rounded overflow-x-auto' },
                JSON.stringify(candidateInfo.candidate.json, null, 2)
              )
            )
          )
        )
      ),
    regularMatchingCandidates.length === 0 &&
      defaultMatchingCandidates.length === 0 &&
      react_1.default.createElement(
        'div',
        null,
        react_1.default.createElement(
          'h4',
          { className: 'font-medium text-gray-800 mb-2' },
          'Matching Candidates'
        ),
        react_1.default.createElement(
          'p',
          { className: 'text-sm text-gray-600' },
          'No candidates matched the current context.'
        )
      ),
    nonMatchingCandidates.length > 0 &&
      react_1.default.createElement(
        'div',
        null,
        react_1.default.createElement(
          'h4',
          { className: 'font-medium text-gray-500 mb-2' },
          'Non-matching Candidates'
        ),
        react_1.default.createElement(
          'div',
          { className: 'space-y-2' },
          nonMatchingCandidates
            .slice(0, 3)
            .map((candidateInfo) =>
              react_1.default.createElement(
                'div',
                {
                  key: `non-matching-${candidateInfo.candidateIndex}`,
                  className: 'bg-gray-50 p-3 rounded border border-gray-200 opacity-75'
                },
                react_1.default.createElement(
                  'div',
                  { className: 'text-sm font-medium text-gray-500 mb-2' },
                  'Candidate ',
                  candidateInfo.candidateIndex + 1
                ),
                react_1.default.createElement(
                  'pre',
                  { className: 'text-xs bg-gray-100 p-2 rounded overflow-x-auto text-gray-600' },
                  JSON.stringify(candidateInfo.candidate.json, null, 2)
                )
              )
            ),
          nonMatchingCandidates.length > 3 &&
            react_1.default.createElement(
              'div',
              { className: 'text-center text-sm text-gray-500' },
              '... and ',
              nonMatchingCandidates.length - 3,
              ' more non-matching candidates'
            )
        )
      )
  );
};
exports.ResolutionResults = ResolutionResults;
exports.default = exports.ResolutionResults;
//# sourceMappingURL=index.js.map
