'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.ResolutionContextOptionsControl = void 0;
const tslib_1 = require('tslib');
const react_1 = tslib_1.__importStar(require('react'));
const outline_1 = require('@heroicons/react/24/outline');
/**
 * Reusable control for configuring ResolutionView context options.
 *
 * Provides a clean interface for adjusting context behavior including:
 * - Visibility of context controls, current context display, and action buttons
 * - Per-qualifier options (visibility, editability, host values)
 * - Global defaults and appearance customization
 *
 * Can be rendered in multiple presentation modes:
 * - 'hidden': Not displayed (default for production)
 * - 'inline': Always expanded with full controls visible
 * - 'collapsible': Expandable/collapsible section
 * - 'popover': Small dropdown overlay
 * - 'popup': Full modal dialog
 *
 * @example
 * ```tsx
 * import { ResolutionContextOptionsControl } from '@fgv/ts-res-ui-components';
 *
 * function ContextConfiguration() {
 *   const [contextOptions, setContextOptions] = useState<ResolutionContextOptions>({});
 *
 *   return (
 *     <ResolutionContextOptionsControl
 *       options={contextOptions}
 *       onOptionsChange={setContextOptions}
 *       availableQualifiers={['language', 'platform', 'env']}
 *       presentation="collapsible"
 *       title="Context Configuration"
 *     />
 *   );
 * }
 * ```
 *
 * @public
 */
const ResolutionContextOptionsControl = ({
  options,
  onOptionsChange,
  availableQualifiers = [],
  presentation = 'hidden',
  className = '',
  title = 'Context Options',
  allowResourceCreation,
  onAllowResourceCreationChange,
  showPendingResourcesInList,
  onShowPendingResourcesInListChange
}) => {
  // Early return for hidden presentation
  if (presentation === 'hidden') {
    return null;
  }
  const [isExpanded, setIsExpanded] = (0, react_1.useState)(presentation === 'inline');
  const [showPopover, setShowPopover] = (0, react_1.useState)(false);
  const handleOptionChange = (0, react_1.useCallback)(
    (key, value) => {
      onOptionsChange({
        ...options,
        [key]: value
      });
    },
    [options, onOptionsChange]
  );
  const handleQualifierOptionChange = (0, react_1.useCallback)(
    (qualifierName, optionKey, value) => {
      const currentQualifierOptions = options.qualifierOptions || {};
      const currentOptions = currentQualifierOptions[qualifierName] || {};
      const updatedQualifierOptions = {
        ...currentQualifierOptions,
        [qualifierName]: {
          ...currentOptions,
          [optionKey]: value
        }
      };
      handleOptionChange('qualifierOptions', updatedQualifierOptions);
    },
    [options.qualifierOptions, handleOptionChange]
  );
  const handleHostManagedValueChange = (0, react_1.useCallback)(
    (qualifierName, value) => {
      const currentHostValues = options.hostManagedValues || {};
      const updatedHostValues = {
        ...currentHostValues,
        [qualifierName]: value || undefined
      };
      // Remove undefined values to keep object clean
      if (value === undefined || value === '') {
        delete updatedHostValues[qualifierName];
      }
      handleOptionChange('hostManagedValues', updatedHostValues);
    },
    [options.hostManagedValues, handleOptionChange]
  );
  const renderControls = () =>
    react_1.default.createElement(
      'div',
      { className: 'space-y-4' },
      react_1.default.createElement(
        'div',
        { className: 'space-y-3' },
        react_1.default.createElement(
          'h4',
          { className: 'text-sm font-medium text-gray-700' },
          'Context Panel Visibility'
        ),
        react_1.default.createElement(
          'div',
          { className: 'space-y-2' },
          react_1.default.createElement(
            'label',
            { className: 'flex items-center text-xs' },
            react_1.default.createElement('input', {
              type: 'checkbox',
              checked: options.showContextControls !== false,
              onChange: (e) => handleOptionChange('showContextControls', e.target.checked),
              className: 'mr-2 rounded'
            }),
            'Show Context Controls'
          ),
          react_1.default.createElement(
            'label',
            { className: 'flex items-center text-xs' },
            react_1.default.createElement('input', {
              type: 'checkbox',
              checked: options.showCurrentContext !== false,
              onChange: (e) => handleOptionChange('showCurrentContext', e.target.checked),
              className: 'mr-2 rounded'
            }),
            'Show Current Context Display'
          ),
          react_1.default.createElement(
            'label',
            { className: 'flex items-center text-xs' },
            react_1.default.createElement('input', {
              type: 'checkbox',
              checked: options.showContextActions !== false,
              onChange: (e) => handleOptionChange('showContextActions', e.target.checked),
              className: 'mr-2 rounded'
            }),
            'Show Context Action Buttons'
          )
        )
      ),
      react_1.default.createElement(
        'div',
        { className: 'space-y-3 pt-3 border-t border-gray-200' },
        react_1.default.createElement(
          'h4',
          { className: 'text-sm font-medium text-gray-700' },
          'Global Defaults'
        ),
        react_1.default.createElement(
          'div',
          { className: 'grid grid-cols-1 sm:grid-cols-2 gap-3' },
          react_1.default.createElement(
            'label',
            { className: 'flex items-center text-xs' },
            react_1.default.createElement('input', {
              type: 'checkbox',
              checked: options.defaultQualifierVisible !== false,
              onChange: (e) => handleOptionChange('defaultQualifierVisible', e.target.checked),
              className: 'mr-2 rounded'
            }),
            'Qualifiers Visible by Default'
          ),
          react_1.default.createElement(
            'label',
            { className: 'flex items-center text-xs' },
            react_1.default.createElement('input', {
              type: 'checkbox',
              checked: options.defaultQualifierEditable !== false,
              onChange: (e) => handleOptionChange('defaultQualifierEditable', e.target.checked),
              className: 'mr-2 rounded'
            }),
            'Qualifiers Editable by Default'
          )
        ),
        react_1.default.createElement(
          'div',
          null,
          react_1.default.createElement(
            'label',
            { className: 'block text-xs font-medium text-gray-600 mb-1' },
            'Panel Title'
          ),
          react_1.default.createElement('input', {
            type: 'text',
            value: options.contextPanelTitle || '',
            onChange: (e) => handleOptionChange('contextPanelTitle', e.target.value || undefined),
            placeholder: 'Context Configuration',
            className:
              'w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500'
          })
        ),
        react_1.default.createElement(
          'div',
          null,
          react_1.default.createElement(
            'label',
            { className: 'block text-xs font-medium text-gray-600 mb-1' },
            'Global Placeholder'
          ),
          react_1.default.createElement('input', {
            type: 'text',
            value: typeof options.globalPlaceholder === 'string' ? options.globalPlaceholder : '',
            onChange: (e) => handleOptionChange('globalPlaceholder', e.target.value || undefined),
            placeholder: 'Enter {qualifierName} value',
            className:
              'w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500'
          }),
          react_1.default.createElement(
            'p',
            { className: 'text-xs text-gray-500 mt-1' },
            'Use ',
            '{qualifierName}',
            ' for dynamic qualifier names'
          )
        )
      ),
      (allowResourceCreation !== undefined || showPendingResourcesInList !== undefined) &&
        react_1.default.createElement(
          'div',
          { className: 'space-y-3 pt-3 border-t border-gray-200' },
          react_1.default.createElement(
            'h4',
            { className: 'text-sm font-medium text-gray-700' },
            'Editing & Creation'
          ),
          allowResourceCreation !== undefined &&
            react_1.default.createElement(
              'label',
              { className: 'flex items-center text-xs' },
              react_1.default.createElement('input', {
                type: 'checkbox',
                checked: !!allowResourceCreation,
                onChange: (e) => onAllowResourceCreationChange?.(e.target.checked),
                className: 'mr-2 rounded'
              }),
              'Allow Resource Creation'
            ),
          showPendingResourcesInList !== undefined &&
            react_1.default.createElement(
              'label',
              { className: 'flex items-center text-xs' },
              react_1.default.createElement('input', {
                type: 'checkbox',
                checked: !!showPendingResourcesInList,
                onChange: (e) => onShowPendingResourcesInListChange?.(e.target.checked),
                className: 'mr-2 rounded'
              }),
              'Show Pending Resources In List'
            )
        ),
      availableQualifiers.length > 0 &&
        react_1.default.createElement(
          'div',
          { className: 'space-y-3 pt-3 border-t border-gray-200' },
          react_1.default.createElement(
            'h4',
            { className: 'text-sm font-medium text-gray-700' },
            'Per-Qualifier Settings'
          ),
          react_1.default.createElement(
            'div',
            { className: 'space-y-3' },
            availableQualifiers.map((qualifierName) => {
              const qualifierOptions = options.qualifierOptions?.[qualifierName] || {};
              const hostValue = options.hostManagedValues?.[qualifierName];
              return react_1.default.createElement(
                'div',
                { key: qualifierName, className: 'border border-gray-200 rounded p-3' },
                react_1.default.createElement(
                  'h5',
                  { className: 'text-xs font-medium text-gray-800 mb-2' },
                  qualifierName
                ),
                react_1.default.createElement(
                  'div',
                  { className: 'grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2' },
                  react_1.default.createElement(
                    'label',
                    { className: 'flex items-center text-xs' },
                    react_1.default.createElement('input', {
                      type: 'checkbox',
                      checked: qualifierOptions.visible !== false,
                      onChange: (e) =>
                        handleQualifierOptionChange(qualifierName, 'visible', e.target.checked),
                      className: 'mr-2 rounded'
                    }),
                    'Visible'
                  ),
                  react_1.default.createElement(
                    'label',
                    { className: 'flex items-center text-xs' },
                    react_1.default.createElement('input', {
                      type: 'checkbox',
                      checked: qualifierOptions.editable !== false,
                      onChange: (e) =>
                        handleQualifierOptionChange(qualifierName, 'editable', e.target.checked),
                      className: 'mr-2 rounded'
                    }),
                    'Editable'
                  )
                ),
                react_1.default.createElement(
                  'div',
                  { className: 'space-y-2' },
                  react_1.default.createElement(
                    'div',
                    null,
                    react_1.default.createElement(
                      'label',
                      { className: 'block text-xs font-medium text-gray-600 mb-1' },
                      'Custom Placeholder'
                    ),
                    react_1.default.createElement('input', {
                      type: 'text',
                      value: qualifierOptions.placeholder || '',
                      onChange: (e) =>
                        handleQualifierOptionChange(
                          qualifierName,
                          'placeholder',
                          e.target.value || undefined
                        ),
                      placeholder: `Enter ${qualifierName} value`,
                      className:
                        'w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500'
                    })
                  ),
                  react_1.default.createElement(
                    'div',
                    null,
                    react_1.default.createElement(
                      'label',
                      { className: 'block text-xs font-medium text-gray-600 mb-1' },
                      'Host-Managed Value'
                    ),
                    react_1.default.createElement('input', {
                      type: 'text',
                      value: hostValue || '',
                      onChange: (e) => handleHostManagedValueChange(qualifierName, e.target.value),
                      placeholder: 'Leave empty for user control',
                      className:
                        'w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500'
                    }),
                    react_1.default.createElement(
                      'p',
                      { className: 'text-xs text-gray-500 mt-1' },
                      'When set, overrides user input and makes field readonly'
                    )
                  ),
                  react_1.default.createElement(
                    'label',
                    { className: 'flex items-center text-xs' },
                    react_1.default.createElement('input', {
                      type: 'checkbox',
                      checked: qualifierOptions.showHostValue !== false,
                      onChange: (e) =>
                        handleQualifierOptionChange(qualifierName, 'showHostValue', e.target.checked),
                      className: 'mr-2 rounded'
                    }),
                    'Show Host-Managed Indicator'
                  )
                )
              );
            })
          )
        )
    );
  if (presentation === 'popover') {
    return react_1.default.createElement(
      'div',
      { className: `relative ${className}` },
      react_1.default.createElement(
        'button',
        {
          onClick: () => setShowPopover(!showPopover),
          className:
            'flex items-center px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500'
        },
        react_1.default.createElement(outline_1.CogIcon, { className: 'w-3 h-3 mr-1' }),
        title,
        react_1.default.createElement(outline_1.ChevronDownIcon, { className: 'w-3 h-3 ml-1' })
      ),
      showPopover &&
        react_1.default.createElement(
          react_1.default.Fragment,
          null,
          react_1.default.createElement('div', {
            className: 'fixed inset-0 z-10',
            onClick: () => setShowPopover(false)
          }),
          react_1.default.createElement(
            'div',
            {
              className:
                'absolute top-full left-0 mt-1 w-96 bg-white border border-gray-200 rounded-lg shadow-lg z-20 p-4 max-h-96 overflow-y-auto'
            },
            react_1.default.createElement(
              'div',
              { className: 'flex items-center justify-between mb-3' },
              react_1.default.createElement('h3', { className: 'text-sm font-medium text-gray-900' }, title),
              react_1.default.createElement(
                'button',
                { onClick: () => setShowPopover(false), className: 'p-1 text-gray-400 hover:text-gray-600' },
                react_1.default.createElement(outline_1.XMarkIcon, { className: 'w-4 h-4' })
              )
            ),
            renderControls()
          )
        )
    );
  }
  if (presentation === 'collapsible') {
    return react_1.default.createElement(
      'div',
      { className: `border border-gray-200 rounded-lg ${className}` },
      react_1.default.createElement(
        'button',
        {
          onClick: () => setIsExpanded(!isExpanded),
          className:
            'w-full flex items-center justify-between px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-t-lg'
        },
        react_1.default.createElement(
          'span',
          { className: 'flex items-center' },
          react_1.default.createElement(outline_1.CogIcon, { className: 'w-4 h-4 mr-2' }),
          title
        ),
        isExpanded
          ? react_1.default.createElement(outline_1.ChevronUpIcon, { className: 'w-4 h-4' })
          : react_1.default.createElement(outline_1.ChevronDownIcon, { className: 'w-4 h-4' })
      ),
      isExpanded &&
        react_1.default.createElement('div', { className: 'p-4 border-t border-gray-200' }, renderControls())
    );
  }
  if (presentation === 'popup') {
    return react_1.default.createElement(
      'div',
      { className: `relative ${className}` },
      react_1.default.createElement(
        'button',
        {
          onClick: () => setShowPopover(!showPopover),
          className:
            'flex items-center px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500'
        },
        react_1.default.createElement(outline_1.CogIcon, { className: 'w-3 h-3 mr-1' }),
        title,
        react_1.default.createElement(outline_1.ChevronDownIcon, { className: 'w-3 h-3 ml-1' })
      ),
      showPopover &&
        react_1.default.createElement(
          react_1.default.Fragment,
          null,
          react_1.default.createElement('div', {
            className: 'fixed inset-0 z-40',
            onClick: () => setShowPopover(false)
          }),
          react_1.default.createElement(
            'div',
            { className: 'fixed inset-0 z-50 flex items-center justify-center p-4' },
            react_1.default.createElement(
              'div',
              {
                className:
                  'bg-white border border-gray-200 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto'
              },
              react_1.default.createElement(
                'div',
                { className: 'flex items-center justify-between p-4 border-b border-gray-200' },
                react_1.default.createElement(
                  'h3',
                  { className: 'text-lg font-medium text-gray-900' },
                  title
                ),
                react_1.default.createElement(
                  'button',
                  {
                    onClick: () => setShowPopover(false),
                    className: 'p-1 text-gray-400 hover:text-gray-600'
                  },
                  react_1.default.createElement(outline_1.XMarkIcon, { className: 'w-5 h-5' })
                )
              ),
              react_1.default.createElement('div', { className: 'p-4' }, renderControls())
            )
          )
        )
    );
  }
  // presentation === 'inline'
  return react_1.default.createElement(
    'div',
    { className: `border border-gray-200 rounded-lg p-4 ${className}` },
    react_1.default.createElement(
      'h3',
      { className: 'text-sm font-medium text-gray-900 mb-3 flex items-center' },
      react_1.default.createElement(outline_1.CogIcon, { className: 'w-4 h-4 mr-2' }),
      title
    ),
    renderControls()
  );
};
exports.ResolutionContextOptionsControl = ResolutionContextOptionsControl;
exports.default = exports.ResolutionContextOptionsControl;
//# sourceMappingURL=ResolutionContextOptionsControl.js.map
