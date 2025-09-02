'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.UnifiedChangeControls = void 0;
const tslib_1 = require('tslib');
const react_1 = tslib_1.__importStar(require('react'));
const outline_1 = require('@heroicons/react/24/outline');
/**
 * Unified change controls for ResolutionView.
 *
 * @example
 * ```tsx
 * <UnifiedChangeControls
 *   editCount={state.editedResources.size}
 *   addCount={state.pendingResources.size}
 *   deleteCount={state.pendingResourceDeletions.size}
 *   isApplying={state.isApplyingEdits}
 *   disabled={!state.currentResolver}
 *   onApplyAll={actions.applyPendingResources}
 *   onDiscardAll={() => {
 *     actions.discardEdits();
 *     actions.discardPendingResources();
 *   }}
 * />
 * ```
 *
 * @public
 */
const UnifiedChangeControls = ({
  editCount,
  addCount,
  deleteCount,
  isApplying = false,
  disabled = false,
  className = '',
  onApplyAll,
  onDiscardAll
}) => {
  const totalChanges = editCount + addCount + deleteCount;
  const hasChanges = totalChanges > 0;
  const [confirmDiscard, setConfirmDiscard] = (0, react_1.useState)(false);
  if (!hasChanges && !isApplying) {
    return null;
  }
  return react_1.default.createElement(
    'div',
    { className: `bg-white rounded-lg border border-gray-200 shadow-sm ${className}` },
    react_1.default.createElement(
      'div',
      { className: 'p-4' },
      react_1.default.createElement(
        'div',
        { className: 'flex items-center justify-between mb-3' },
        react_1.default.createElement(
          'div',
          { className: 'flex items-center space-x-2' },
          react_1.default.createElement(
            'h3',
            { className: 'text-lg font-semibold text-gray-900' },
            'Pending Changes'
          ),
          editCount > 0 &&
            react_1.default.createElement(
              'span',
              {
                className:
                  'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800'
              },
              editCount,
              ' edit',
              editCount !== 1 ? 's' : ''
            ),
          addCount > 0 &&
            react_1.default.createElement(
              'span',
              {
                className:
                  'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800'
              },
              addCount,
              ' addition',
              addCount !== 1 ? 's' : ''
            ),
          deleteCount > 0 &&
            react_1.default.createElement(
              'span',
              {
                className:
                  'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800'
              },
              deleteCount,
              ' deletion',
              deleteCount !== 1 ? 's' : ''
            )
        ),
        isApplying &&
          react_1.default.createElement(
            'div',
            { className: 'flex items-center text-blue-600' },
            react_1.default.createElement(outline_1.ArrowPathIcon, {
              className: 'h-4 w-4 mr-1 animate-spin'
            }),
            react_1.default.createElement('span', { className: 'text-sm font-medium' }, 'Applying...')
          )
      ),
      !confirmDiscard
        ? react_1.default.createElement(
            'div',
            { className: 'flex items-center space-x-2' },
            react_1.default.createElement(
              'button',
              {
                onClick: () => onApplyAll(),
                disabled: disabled || isApplying || !hasChanges,
                className:
                  'inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed',
                title: 'Apply all pending changes'
              },
              isApplying
                ? react_1.default.createElement(
                    react_1.default.Fragment,
                    null,
                    react_1.default.createElement(outline_1.ArrowPathIcon, {
                      className: 'h-4 w-4 mr-2 animate-spin'
                    }),
                    'Applying...'
                  )
                : react_1.default.createElement(
                    react_1.default.Fragment,
                    null,
                    react_1.default.createElement(outline_1.CheckIcon, { className: 'h-4 w-4 mr-2' }),
                    'Apply Changes'
                  )
            ),
            react_1.default.createElement(
              'button',
              {
                onClick: () => setConfirmDiscard(true),
                disabled: disabled || isApplying || !hasChanges,
                className:
                  'inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed',
                title: 'Discard all pending changes'
              },
              react_1.default.createElement(outline_1.XMarkIcon, { className: 'h-4 w-4 mr-2' }),
              'Discard Changes'
            )
          )
        : react_1.default.createElement(
            'div',
            { className: 'bg-yellow-50 border border-yellow-200 rounded-lg p-3' },
            react_1.default.createElement(
              'div',
              { className: 'text-sm text-yellow-800 mb-2' },
              'Discard all pending changes? This cannot be undone.'
            ),
            react_1.default.createElement(
              'div',
              { className: 'flex items-center space-x-2' },
              react_1.default.createElement(
                'button',
                {
                  onClick: () => {
                    onDiscardAll();
                    setConfirmDiscard(false);
                  },
                  className:
                    'inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-red-600 border border-transparent rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500'
                },
                react_1.default.createElement(outline_1.XMarkIcon, { className: 'h-4 w-4 mr-1' }),
                ' Yes, Discard'
              ),
              react_1.default.createElement(
                'button',
                {
                  onClick: () => setConfirmDiscard(false),
                  className:
                    'inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                },
                'Cancel'
              )
            )
          )
    )
  );
};
exports.UnifiedChangeControls = UnifiedChangeControls;
exports.default = exports.UnifiedChangeControls;
//# sourceMappingURL=UnifiedChangeControls.js.map
