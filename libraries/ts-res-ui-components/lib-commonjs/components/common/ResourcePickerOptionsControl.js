'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.ResourcePickerOptionsControl = void 0;
const tslib_1 = require('tslib');
const react_1 = tslib_1.__importStar(require('react'));
const outline_1 = require('@heroicons/react/24/outline');
/**
 * Reusable control for configuring ResourcePicker options.
 *
 * Provides a clean interface for adjusting picker behavior including:
 * - View mode selection (list/tree)
 * - Search and view toggle settings
 * - Branch isolation configuration
 * - Quick path selection buttons
 *
 * Can be rendered in multiple presentation modes:
 * - 'hidden': Not displayed (default for production)
 * - 'inline': Always expanded with full controls visible
 * - 'collapsible': Expandable/collapsible section
 * - 'popover': Small dropdown overlay
 * - 'popup': Full modal dialog
 *
 * @public
 */
const ResourcePickerOptionsControl = ({
  options,
  onOptionsChange,
  presentation = 'hidden',
  className = '',
  quickBranchPaths = ['strings', 'app', 'images', 'app.ui'],
  showAdvanced = true,
  title = 'Picker Options'
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
  const handleQuickPathSelect = (0, react_1.useCallback)(
    (path) => {
      handleOptionChange('rootPath', path);
    },
    [handleOptionChange]
  );
  const clearRootPath = (0, react_1.useCallback)(() => {
    handleOptionChange('rootPath', undefined);
    handleOptionChange('hideRootNode', false);
  }, [handleOptionChange]);
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
          'View Settings'
        ),
        react_1.default.createElement(
          'div',
          { className: 'grid grid-cols-1 sm:grid-cols-2 gap-3' },
          react_1.default.createElement(
            'div',
            null,
            react_1.default.createElement(
              'label',
              { className: 'block text-xs font-medium text-gray-600 mb-1' },
              'Default View'
            ),
            react_1.default.createElement(
              'select',
              {
                value: options.defaultView || 'list',
                onChange: (e) => handleOptionChange('defaultView', e.target.value),
                className:
                  'w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500'
              },
              react_1.default.createElement('option', { value: 'list' }, 'List'),
              react_1.default.createElement('option', { value: 'tree' }, 'Tree')
            )
          ),
          react_1.default.createElement(
            'div',
            null,
            react_1.default.createElement(
              'label',
              { className: 'block text-xs font-medium text-gray-600 mb-1' },
              'Search Scope'
            ),
            react_1.default.createElement(
              'select',
              {
                value: options.searchScope || 'all',
                onChange: (e) => handleOptionChange('searchScope', e.target.value),
                className:
                  'w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500',
                disabled: !options.enableSearch
              },
              react_1.default.createElement('option', { value: 'all' }, 'All Resources'),
              react_1.default.createElement('option', { value: 'current-branch' }, 'Current Branch')
            )
          )
        ),
        react_1.default.createElement(
          'div',
          { className: 'space-y-2' },
          react_1.default.createElement(
            'label',
            { className: 'flex items-center text-xs' },
            react_1.default.createElement('input', {
              type: 'checkbox',
              checked: options.enableSearch ?? true,
              onChange: (e) => handleOptionChange('enableSearch', e.target.checked),
              className: 'mr-2 rounded'
            }),
            'Enable Search'
          ),
          react_1.default.createElement(
            'label',
            { className: 'flex items-center text-xs' },
            react_1.default.createElement('input', {
              type: 'checkbox',
              checked: options.showViewToggle ?? true,
              onChange: (e) => handleOptionChange('showViewToggle', e.target.checked),
              className: 'mr-2 rounded'
            }),
            'Show View Toggle'
          )
        ),
        options.enableSearch &&
          react_1.default.createElement(
            'div',
            null,
            react_1.default.createElement(
              'label',
              { className: 'block text-xs font-medium text-gray-600 mb-1' },
              'Search Placeholder'
            ),
            react_1.default.createElement('input', {
              type: 'text',
              value: options.searchPlaceholder || '',
              onChange: (e) => handleOptionChange('searchPlaceholder', e.target.value || undefined),
              placeholder: 'Search resources...',
              className:
                'w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500'
            })
          )
      ),
      showAdvanced &&
        react_1.default.createElement(
          'div',
          { className: 'space-y-3 pt-3 border-t border-gray-200' },
          react_1.default.createElement(
            'h4',
            { className: 'text-sm font-medium text-gray-700' },
            'Branch Isolation'
          ),
          react_1.default.createElement(
            'div',
            null,
            react_1.default.createElement(
              'label',
              { className: 'block text-xs font-medium text-gray-600 mb-1' },
              'Root Path'
            ),
            react_1.default.createElement('input', {
              type: 'text',
              value: options.rootPath || '',
              onChange: (e) => handleOptionChange('rootPath', e.target.value || undefined),
              placeholder: 'e.g., strings or app.ui',
              className:
                'w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500'
            }),
            react_1.default.createElement(
              'p',
              { className: 'text-xs text-gray-500 mt-1' },
              'Show only resources under this path'
            )
          ),
          react_1.default.createElement(
            'div',
            null,
            react_1.default.createElement(
              'label',
              { className: 'flex items-center text-xs' },
              react_1.default.createElement('input', {
                type: 'checkbox',
                checked: options.hideRootNode ?? false,
                onChange: (e) => handleOptionChange('hideRootNode', e.target.checked),
                className: 'mr-2 rounded',
                disabled: !options.rootPath
              }),
              'Hide Root Node'
            ),
            react_1.default.createElement(
              'p',
              { className: 'text-xs text-gray-500 mt-1 ml-5' },
              'Show only children of root path (requires Root Path)'
            )
          ),
          react_1.default.createElement(
            'div',
            null,
            react_1.default.createElement(
              'label',
              { className: 'block text-xs font-medium text-gray-600 mb-2' },
              'Quick Paths'
            ),
            react_1.default.createElement(
              'div',
              { className: 'flex flex-wrap gap-1' },
              quickBranchPaths.map((path) =>
                react_1.default.createElement(
                  'button',
                  {
                    key: path,
                    onClick: () => handleQuickPathSelect(path),
                    className: `px-2 py-1 text-xs rounded border ${
                      options.rootPath === path
                        ? 'bg-blue-100 border-blue-300 text-blue-700'
                        : 'bg-gray-50 border-gray-300 text-gray-600 hover:bg-gray-100'
                    }`
                  },
                  path
                )
              ),
              react_1.default.createElement(
                'button',
                {
                  onClick: clearRootPath,
                  className: `px-2 py-1 text-xs rounded border ${
                    !options.rootPath
                      ? 'bg-blue-100 border-blue-300 text-blue-700'
                      : 'bg-gray-50 border-gray-300 text-gray-600 hover:bg-gray-100'
                  }`
                },
                'Clear'
              )
            )
          )
        ),
      react_1.default.createElement(
        'div',
        { className: 'space-y-3 pt-3 border-t border-gray-200' },
        react_1.default.createElement('h4', { className: 'text-sm font-medium text-gray-700' }, 'Display'),
        react_1.default.createElement(
          'div',
          null,
          react_1.default.createElement(
            'label',
            { className: 'block text-xs font-medium text-gray-600 mb-1' },
            'Empty Message'
          ),
          react_1.default.createElement('input', {
            type: 'text',
            value: options.emptyMessage || '',
            onChange: (e) => handleOptionChange('emptyMessage', e.target.value || undefined),
            placeholder: 'No resources available',
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
            'Height'
          ),
          react_1.default.createElement('input', {
            type: 'text',
            value: options.height || '',
            onChange: (e) => handleOptionChange('height', e.target.value || undefined),
            placeholder: '600px',
            className:
              'w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500'
          }),
          react_1.default.createElement(
            'p',
            { className: 'text-xs text-gray-500 mt-1' },
            'CSS height value (px, rem, %, etc.)'
          )
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
                'absolute top-full left-0 mt-1 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-20 p-4'
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
                  'bg-white border border-gray-200 rounded-lg shadow-xl max-w-md w-full max-h-96 overflow-y-auto'
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
exports.ResourcePickerOptionsControl = ResourcePickerOptionsControl;
exports.default = exports.ResourcePickerOptionsControl;
//# sourceMappingURL=ResourcePickerOptionsControl.js.map
