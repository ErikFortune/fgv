'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.ResourceTypeEditForm = void 0;
var tslib_1 = require('tslib');
var react_1 = tslib_1.__importStar(require('react'));
var outline_1 = require('@heroicons/react/24/outline');
var COMMON_TYPE_NAMES = [
  'string',
  'object',
  'array',
  'number',
  'boolean',
  'localizedString',
  'config',
  'settings',
  'permissions',
  'template',
  'content',
  'metadata'
];
var ResourceTypeEditForm = function (_a) {
  var resourceType = _a.resourceType,
    onSave = _a.onSave,
    onCancel = _a.onCancel,
    _b = _a.existingNames,
    existingNames = _b === void 0 ? [] : _b;
  var _c = (0, react_1.useState)(function () {
      if (resourceType) {
        return {
          name: resourceType.name,
          typeName: resourceType.typeName
        };
      }
      return {
        name: '',
        typeName: 'string'
      };
    }),
    formData = _c[0],
    setFormData = _c[1];
  var _d = (0, react_1.useState)({}),
    errors = _d[0],
    setErrors = _d[1];
  var _e = (0, react_1.useState)(function () {
      if (resourceType) {
        return !COMMON_TYPE_NAMES.includes(resourceType.typeName);
      }
      return false;
    }),
    useCustomTypeName = _e[0],
    setUseCustomTypeName = _e[1];
  // Validation
  var validateForm = (0, react_1.useCallback)(
    function () {
      var newErrors = {};
      if (!formData.name.trim()) {
        newErrors.name = 'Name is required';
      } else if (
        existingNames.includes(formData.name) &&
        formData.name !== (resourceType === null || resourceType === void 0 ? void 0 : resourceType.name)
      ) {
        newErrors.name = 'Name must be unique';
      } else if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(formData.name)) {
        newErrors.name = 'Name must start with a letter and contain only letters, numbers, and underscores';
      }
      if (!formData.typeName.trim()) {
        newErrors.typeName = 'Type name is required';
      } else if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(formData.typeName)) {
        newErrors.typeName =
          'Type name must start with a letter and contain only letters, numbers, and underscores';
      }
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    },
    [formData, existingNames, resourceType === null || resourceType === void 0 ? void 0 : resourceType.name]
  );
  var handleSave = (0, react_1.useCallback)(
    function () {
      if (!validateForm()) return;
      var result = {
        name: formData.name,
        typeName: formData.typeName
      };
      onSave(result);
    },
    [formData, validateForm, onSave]
  );
  var updateField = (0, react_1.useCallback)(
    function (field, value) {
      setFormData(function (prev) {
        var _a;
        var updated = tslib_1.__assign(tslib_1.__assign({}, prev), ((_a = {}), (_a[field] = value), _a));
        // Auto-generate typeName from name for new resource types if using common types
        if (field === 'name' && !resourceType && !useCustomTypeName) {
          var cleanName_1 = value.toLowerCase().replace(/[^a-zA-Z0-9]/g, '');
          var commonType = COMMON_TYPE_NAMES.find(function (type) {
            return cleanName_1.includes(type) || type.includes(cleanName_1);
          });
          if (commonType) {
            updated.typeName = commonType;
          } else {
            updated.typeName = cleanName_1 || 'string';
          }
        }
        return updated;
      });
      if (errors[field]) {
        setErrors(function (prev) {
          var _a;
          return tslib_1.__assign(tslib_1.__assign({}, prev), ((_a = {}), (_a[field] = ''), _a));
        });
      }
    },
    [errors, resourceType, useCustomTypeName]
  );
  var handleTypeNameModeChange = (0, react_1.useCallback)(
    function (useCustom) {
      setUseCustomTypeName(useCustom);
      if (!useCustom && !resourceType) {
        // Reset to a common type
        updateField('typeName', 'string');
      }
    },
    [resourceType, updateField]
  );
  var getTypeNameDescription = function (typeName) {
    switch (typeName) {
      case 'string':
        return 'Simple text content (default)';
      case 'object':
        return 'Complex structured data (JSON objects)';
      case 'array':
        return 'List of values or objects';
      case 'number':
        return 'Numeric values';
      case 'boolean':
        return 'True/false values';
      case 'localizedString':
        return 'Text content with localization support';
      case 'config':
        return 'Configuration settings and parameters';
      case 'settings':
        return 'User or application settings';
      case 'permissions':
        return 'Access control and permission data';
      case 'template':
        return 'Template content for rendering';
      case 'content':
        return 'Rich content (HTML, Markdown, etc.)';
      case 'metadata':
        return 'Descriptive information about resources';
      default:
        return 'Custom resource type';
    }
  };
  return react_1.default.createElement(
    'div',
    { className: 'fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50' },
    react_1.default.createElement(
      'div',
      { className: 'bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto' },
      react_1.default.createElement(
        'div',
        { className: 'flex items-center justify-between p-6 border-b' },
        react_1.default.createElement(
          'h3',
          { className: 'text-lg font-medium text-gray-900' },
          resourceType ? 'Edit Resource Type' : 'Add Resource Type'
        ),
        react_1.default.createElement(
          'button',
          { onClick: onCancel, className: 'text-gray-400 hover:text-gray-600' },
          react_1.default.createElement(outline_1.XMarkIcon, { className: 'w-6 h-6' })
        )
      ),
      react_1.default.createElement(
        'div',
        { className: 'p-6 space-y-6' },
        react_1.default.createElement(
          'div',
          null,
          react_1.default.createElement(
            'label',
            { className: 'block text-sm font-medium text-gray-700 mb-1' },
            'Name *'
          ),
          react_1.default.createElement('input', {
            type: 'text',
            value: formData.name,
            onChange: function (e) {
              return updateField('name', e.target.value);
            },
            className:
              'w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 '.concat(
                errors.name ? 'border-red-300' : 'border-gray-300'
              ),
            placeholder: "Enter resource type name (e.g., 'userSettings', 'errorMessages')"
          }),
          errors.name &&
            react_1.default.createElement('p', { className: 'mt-1 text-sm text-red-600' }, errors.name),
          react_1.default.createElement(
            'p',
            { className: 'mt-1 text-xs text-gray-500' },
            'A descriptive name for this type of resource. This will be used to categorize and identify resources.'
          )
        ),
        react_1.default.createElement(
          'div',
          null,
          react_1.default.createElement(
            'label',
            { className: 'block text-sm font-medium text-gray-700 mb-3' },
            'Type Name Configuration *'
          ),
          react_1.default.createElement(
            'div',
            { className: 'space-y-3' },
            react_1.default.createElement(
              'div',
              { className: 'flex items-center' },
              react_1.default.createElement('input', {
                type: 'radio',
                id: 'useCommonType',
                name: 'typeNameMode',
                checked: !useCustomTypeName,
                onChange: function () {
                  return handleTypeNameModeChange(false);
                },
                className: 'h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300'
              }),
              react_1.default.createElement(
                'label',
                { htmlFor: 'useCommonType', className: 'ml-2 text-sm text-gray-700' },
                'Use common type name'
              )
            ),
            !useCustomTypeName &&
              react_1.default.createElement(
                'div',
                { className: 'ml-6' },
                react_1.default.createElement(
                  'select',
                  {
                    value: formData.typeName,
                    onChange: function (e) {
                      return updateField('typeName', e.target.value);
                    },
                    className:
                      'w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 '.concat(
                        errors.typeName ? 'border-red-300' : 'border-gray-300'
                      )
                  },
                  COMMON_TYPE_NAMES.map(function (type) {
                    return react_1.default.createElement('option', { key: type, value: type }, type);
                  })
                ),
                react_1.default.createElement(
                  'p',
                  { className: 'mt-1 text-xs text-gray-600' },
                  getTypeNameDescription(formData.typeName)
                )
              ),
            react_1.default.createElement(
              'div',
              { className: 'flex items-center' },
              react_1.default.createElement('input', {
                type: 'radio',
                id: 'useCustomType',
                name: 'typeNameMode',
                checked: useCustomTypeName,
                onChange: function () {
                  return handleTypeNameModeChange(true);
                },
                className: 'h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300'
              }),
              react_1.default.createElement(
                'label',
                { htmlFor: 'useCustomType', className: 'ml-2 text-sm text-gray-700' },
                'Define custom type name'
              )
            ),
            useCustomTypeName &&
              react_1.default.createElement(
                'div',
                { className: 'ml-6' },
                react_1.default.createElement('input', {
                  type: 'text',
                  value: formData.typeName,
                  onChange: function (e) {
                    return updateField('typeName', e.target.value);
                  },
                  className:
                    'w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 '.concat(
                      errors.typeName ? 'border-red-300' : 'border-gray-300'
                    ),
                  placeholder: 'Enter custom type name'
                }),
                react_1.default.createElement(
                  'p',
                  { className: 'mt-1 text-xs text-gray-500' },
                  'Define a custom type name for specialized resource handling'
                )
              )
          ),
          errors.typeName &&
            react_1.default.createElement('p', { className: 'mt-1 text-sm text-red-600' }, errors.typeName)
        ),
        react_1.default.createElement(
          'div',
          { className: 'p-4 bg-blue-50 rounded-lg' },
          react_1.default.createElement(
            'div',
            { className: 'flex items-start' },
            react_1.default.createElement(outline_1.InformationCircleIcon, {
              className: 'w-5 h-5 text-blue-400 mt-0.5 mr-3 flex-shrink-0'
            }),
            react_1.default.createElement(
              'div',
              { className: 'text-sm text-blue-800' },
              react_1.default.createElement('h4', { className: 'font-medium mb-2' }, 'About Resource Types'),
              react_1.default.createElement(
                'div',
                { className: 'space-y-2' },
                react_1.default.createElement(
                  'p',
                  null,
                  'Resource types define how resources are categorized and processed in your application.'
                ),
                react_1.default.createElement(
                  'ul',
                  { className: 'list-disc list-inside space-y-1 ml-2' },
                  react_1.default.createElement(
                    'li',
                    null,
                    react_1.default.createElement('strong', null, 'Name:'),
                    ' A human-readable identifier for grouping resources'
                  ),
                  react_1.default.createElement(
                    'li',
                    null,
                    react_1.default.createElement('strong', null, 'Type Name:'),
                    ' Determines how the resource data is interpreted and validated'
                  ),
                  react_1.default.createElement(
                    'li',
                    null,
                    'Common types (string, object, array) provide built-in processing'
                  ),
                  react_1.default.createElement(
                    'li',
                    null,
                    'Custom types allow specialized handling for domain-specific data'
                  )
                )
              )
            )
          )
        ),
        react_1.default.createElement(
          'div',
          { className: 'p-4 bg-gray-50 rounded-lg' },
          react_1.default.createElement('h4', { className: 'font-medium text-gray-900 mb-2' }, 'Preview'),
          react_1.default.createElement(
            'div',
            { className: 'text-sm text-gray-600' },
            react_1.default.createElement(
              'p',
              null,
              react_1.default.createElement('span', { className: 'font-medium' }, 'Resource Type:'),
              ' ',
              formData.name || '(name not set)'
            ),
            react_1.default.createElement(
              'p',
              null,
              react_1.default.createElement('span', { className: 'font-medium' }, 'Type Name:'),
              ' ',
              formData.typeName
            ),
            react_1.default.createElement(
              'p',
              null,
              react_1.default.createElement('span', { className: 'font-medium' }, 'Description:'),
              ' ',
              getTypeNameDescription(formData.typeName)
            )
          )
        )
      ),
      react_1.default.createElement(
        'div',
        { className: 'flex justify-end space-x-3 px-6 py-4 border-t bg-gray-50' },
        react_1.default.createElement(
          'button',
          {
            onClick: onCancel,
            className:
              'px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
          },
          'Cancel'
        ),
        react_1.default.createElement(
          'button',
          {
            onClick: handleSave,
            className:
              'px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
          },
          resourceType ? 'Save Changes' : 'Add Resource Type'
        )
      )
    )
  );
};
exports.ResourceTypeEditForm = ResourceTypeEditForm;
//# sourceMappingURL=ResourceTypeEditForm.js.map
