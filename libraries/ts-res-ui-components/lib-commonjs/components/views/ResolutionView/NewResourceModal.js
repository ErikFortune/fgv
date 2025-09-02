'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.NewResourceModal = void 0;
const tslib_1 = require('tslib');
const react_1 = tslib_1.__importStar(require('react'));
const outline_1 = require('@heroicons/react/24/outline');
/**
 * Modal dialog for creating new resources with type selection and ID input.
 * Supports host-controlled resource types that hide the type selector.
 */
const NewResourceModal = ({
  isOpen,
  onClose,
  resourceId,
  resourceType,
  availableResourceTypes,
  isValid,
  defaultResourceType,
  onUpdateResourceId,
  onSelectResourceType,
  onSave
}) => {
  const [localResourceId, setLocalResourceId] = (0, react_1.useState)(resourceId);
  (0, react_1.useEffect)(() => {
    setLocalResourceId(resourceId);
  }, [resourceId]);
  if (!isOpen) return null;
  const handleIdChange = (e) => {
    const newId = e.target.value;
    setLocalResourceId(newId);
    onUpdateResourceId(newId);
  };
  const handleSave = () => {
    if (isValid) {
      onSave();
      onClose();
    }
  };
  const showTypeSelector = !defaultResourceType;
  return react_1.default.createElement(
    'div',
    { className: 'fixed inset-0 z-50 overflow-y-auto' },
    react_1.default.createElement(
      'div',
      { className: 'flex min-h-screen items-center justify-center p-4' },
      react_1.default.createElement('div', {
        className: 'fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity',
        onClick: onClose
      }),
      react_1.default.createElement(
        'div',
        {
          className:
            'relative transform overflow-hidden rounded-lg bg-white shadow-xl transition-all sm:w-full sm:max-w-lg'
        },
        react_1.default.createElement(
          'div',
          { className: 'bg-white px-6 pb-4 pt-5' },
          react_1.default.createElement(
            'div',
            { className: 'flex items-center justify-between mb-4' },
            react_1.default.createElement(
              'h3',
              { className: 'text-lg font-semibold text-gray-900' },
              'Create New Resource'
            ),
            react_1.default.createElement(
              'button',
              { onClick: onClose, className: 'text-gray-400 hover:text-gray-500 focus:outline-none' },
              react_1.default.createElement(outline_1.XMarkIcon, { className: 'h-6 w-6' })
            )
          ),
          react_1.default.createElement(
            'div',
            { className: 'space-y-4' },
            react_1.default.createElement(
              'div',
              null,
              react_1.default.createElement(
                'label',
                { htmlFor: 'resource-id', className: 'block text-sm font-medium text-gray-700 mb-1' },
                'Resource ID ',
                react_1.default.createElement('span', { className: 'text-red-500' }, '*')
              ),
              react_1.default.createElement('input', {
                id: 'resource-id',
                type: 'text',
                value: localResourceId,
                onChange: handleIdChange,
                placeholder: 'Enter unique resource ID',
                className: `w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                  isValid ? 'border-gray-300 focus:ring-blue-500' : 'border-red-300 focus:ring-red-500'
                }`
              }),
              !isValid &&
                localResourceId &&
                react_1.default.createElement(
                  'p',
                  { className: 'mt-1 text-sm text-red-600' },
                  'Resource ID must be unique and non-empty'
                )
            ),
            showTypeSelector
              ? react_1.default.createElement(
                  'div',
                  null,
                  react_1.default.createElement(
                    'label',
                    { htmlFor: 'resource-type', className: 'block text-sm font-medium text-gray-700 mb-1' },
                    'Resource Type'
                  ),
                  react_1.default.createElement(
                    'select',
                    {
                      id: 'resource-type',
                      value: resourceType,
                      onChange: (e) => onSelectResourceType(e.target.value),
                      className:
                        'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                    },
                    availableResourceTypes.map((type) =>
                      react_1.default.createElement('option', { key: type.key, value: type.key }, type.key)
                    )
                  )
                )
              : react_1.default.createElement(
                  'div',
                  null,
                  react_1.default.createElement(
                    'label',
                    { className: 'block text-sm font-medium text-gray-700 mb-1' },
                    'Resource Type'
                  ),
                  react_1.default.createElement(
                    'div',
                    { className: 'px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-700' },
                    defaultResourceType,
                    react_1.default.createElement(
                      'span',
                      { className: 'text-xs text-gray-500 ml-2' },
                      '(Host-controlled)'
                    )
                  )
                ),
            react_1.default.createElement(
              'div',
              null,
              react_1.default.createElement(
                'label',
                { className: 'block text-sm font-medium text-gray-700 mb-1' },
                'Template Preview'
              ),
              react_1.default.createElement(
                'div',
                { className: 'p-3 bg-gray-50 border border-gray-200 rounded-md' },
                react_1.default.createElement(
                  'pre',
                  { className: 'text-xs text-gray-600 overflow-x-auto' },
                  JSON.stringify({ id: localResourceId, type: resourceType }, null, 2)
                )
              )
            )
          )
        ),
        react_1.default.createElement(
          'div',
          { className: 'bg-gray-50 px-6 py-3 flex justify-end space-x-3' },
          react_1.default.createElement(
            'button',
            {
              onClick: onClose,
              className:
                'px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500'
            },
            'Cancel'
          ),
          react_1.default.createElement(
            'button',
            {
              onClick: handleSave,
              disabled: !isValid,
              className: `px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 ${
                isValid
                  ? 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                  : 'bg-gray-400 cursor-not-allowed'
              }`
            },
            'Add as Pending'
          )
        )
      )
    )
  );
};
exports.NewResourceModal = NewResourceModal;
exports.default = exports.NewResourceModal;
//# sourceMappingURL=NewResourceModal.js.map
