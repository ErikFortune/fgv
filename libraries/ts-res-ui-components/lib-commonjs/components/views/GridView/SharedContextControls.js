'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.SharedContextControls = void 0;
const tslib_1 = require('tslib');
const react_1 = tslib_1.__importStar(require('react'));
const QualifierContextControl_1 = require('../../common/QualifierContextControl');
/**
 * SharedContextControls component for managing resolution context across multiple grids.
 *
 * Provides a unified context management interface that is shared across all grid instances
 * in a MultiGridView. Changes to context values are immediately reflected in all grids,
 * enabling consistent administrative workflows.
 *
 * @example
 * ```tsx
 * <SharedContextControls
 *   availableQualifiers={['language', 'territory', 'platform']}
 *   resolutionState={sharedResolutionState}
 *   resolutionActions={sharedResolutionActions}
 *   contextOptions={{
 *     qualifierOptions: {
 *       language: { editable: true },
 *       platform: { editable: false, hostValue: 'web' }
 *     },
 *     hostManagedValues: { environment: 'production' }
 *   }}
 *   resources={processedResources}
 * />
 * ```
 * @public
 */
const SharedContextControls = ({
  availableQualifiers,
  resolutionState,
  resolutionActions,
  contextOptions,
  resources,
  className = ''
}) => {
  // Handle context value changes
  const handleQualifierChange = (0, react_1.useCallback)(
    (qualifierName, value) => {
      // Don't update context if this qualifier is host-managed
      const qualifierOptions = contextOptions?.qualifierOptions?.[qualifierName];
      const isHostManaged = qualifierOptions?.hostValue !== undefined;
      if (!isHostManaged) {
        resolutionActions?.updateContextValue(qualifierName, value);
      }
    },
    [resolutionActions, contextOptions?.qualifierOptions]
  );
  // Determine which qualifiers to show
  const visibleQualifiers = (0, react_1.useMemo)(() => {
    if (!contextOptions?.qualifierOptions) {
      return availableQualifiers;
    }
    return availableQualifiers.filter((qualifierName) => {
      const options = contextOptions.qualifierOptions[qualifierName];
      return options?.visible !== false;
    });
  }, [availableQualifiers, contextOptions?.qualifierOptions]);
  // Get effective context values
  const effectiveContextValues = (0, react_1.useMemo)(() => {
    return resolutionState?.contextValues || {};
  }, [resolutionState?.contextValues]);
  // Don't render if context controls are disabled
  if (contextOptions?.showContextControls === false) {
    return null;
  }
  return react_1.default.createElement(
    'div',
    { className: `bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}` },
    react_1.default.createElement(
      'h3',
      { className: 'text-lg font-semibold text-gray-900 mb-4' },
      contextOptions?.contextPanelTitle || 'Shared Context Configuration'
    ),
    react_1.default.createElement(
      'div',
      { className: `bg-gray-50 rounded-lg p-4 ${contextOptions?.contextPanelClassName || ''}` },
      react_1.default.createElement(
        'div',
        { className: 'mb-4' },
        react_1.default.createElement(
          'div',
          { className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3' },
          visibleQualifiers.map((qualifierName) => {
            const qualifierOptions = contextOptions?.qualifierOptions?.[qualifierName];
            const hostManagedValue = contextOptions?.hostManagedValues?.[qualifierName];
            const globalPlaceholder =
              typeof contextOptions?.globalPlaceholder === 'function'
                ? contextOptions.globalPlaceholder(qualifierName)
                : contextOptions?.globalPlaceholder;
            // Merge host-managed values with qualifier options
            const mergedOptions = {
              ...qualifierOptions,
              hostValue: hostManagedValue !== undefined ? hostManagedValue : qualifierOptions?.hostValue
            };
            return react_1.default.createElement(QualifierContextControl_1.QualifierContextControl, {
              key: qualifierName,
              qualifierName: qualifierName,
              value: resolutionState?.pendingContextValues[qualifierName],
              onChange: handleQualifierChange,
              placeholder: globalPlaceholder || `Enter ${qualifierName} value`,
              resources: resources,
              options: mergedOptions
            });
          })
        )
      ),
      contextOptions?.showCurrentContext !== false &&
        react_1.default.createElement(
          'div',
          { className: 'flex items-center justify-between' },
          react_1.default.createElement(
            'div',
            { className: 'text-sm text-gray-600' },
            react_1.default.createElement('strong', null, 'Current Context:'),
            ' ',
            Object.entries(effectiveContextValues).length > 0
              ? Object.entries(effectiveContextValues)
                  .map(([key, value]) => `${key}=${value === undefined ? '(undefined)' : value}`)
                  .join(', ')
              : react_1.default.createElement('span', { className: 'italic' }, 'No context values set')
          ),
          contextOptions?.showContextActions !== false &&
            react_1.default.createElement(
              'div',
              { className: 'flex items-center space-x-2' },
              react_1.default.createElement(
                'button',
                {
                  onClick: resolutionActions?.resetCache,
                  className:
                    'px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500',
                  title: 'Clear resolution cache for all grids'
                },
                'Clear Cache'
              ),
              react_1.default.createElement(
                'button',
                {
                  onClick: () => resolutionActions?.applyContext(),
                  disabled: !resolutionState?.hasPendingChanges,
                  className: `px-4 py-2 rounded-md text-sm font-medium ${
                    resolutionState?.hasPendingChanges
                      ? 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`,
                  title: 'Apply context changes to all grids'
                },
                resolutionState?.hasPendingChanges
                  ? 'Apply Context to All Grids'
                  : resolutionState?.currentResolver
                  ? 'Context Applied'
                  : 'Apply Context'
              )
            )
        ),
      resolutionState?.hasPendingChanges &&
        react_1.default.createElement(
          'div',
          { className: 'mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md' },
          react_1.default.createElement(
            'div',
            { className: 'text-sm text-blue-800' },
            react_1.default.createElement('strong', null, 'Pending Context Changes:'),
            ' Changes will be applied to all visible grids simultaneously. This ensures consistent data across all administrative views.'
          )
        )
    )
  );
};
exports.SharedContextControls = SharedContextControls;
exports.default = exports.SharedContextControls;
//# sourceMappingURL=SharedContextControls.js.map
