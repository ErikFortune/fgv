'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.QualifierEditForm = void 0;
var tslib_1 = require('tslib');
var react_1 = tslib_1.__importStar(require('react'));
var outline_1 = require('@heroicons/react/24/outline');
var QualifierEditForm = function (_a) {
  var qualifier = _a.qualifier,
    qualifierTypes = _a.qualifierTypes,
    onSave = _a.onSave,
    onCancel = _a.onCancel,
    _b = _a.existingNames,
    existingNames = _b === void 0 ? [] : _b;
  var _c = (0, react_1.useState)(function () {
      var _a;
      if (qualifier) {
        return {
          name: qualifier.name,
          typeName: qualifier.typeName,
          defaultPriority: qualifier.defaultPriority,
          token: qualifier.token || '',
          tokenIsOptional: qualifier.tokenIsOptional || false,
          defaultValue: qualifier.defaultValue || ''
        };
      }
      return {
        name: '',
        typeName: ((_a = qualifierTypes[0]) === null || _a === void 0 ? void 0 : _a.name) || '',
        defaultPriority: 50,
        token: '',
        tokenIsOptional: false,
        defaultValue: ''
      };
    }),
    formData = _c[0],
    setFormData = _c[1];
  var _d = (0, react_1.useState)({}),
    errors = _d[0],
    setErrors = _d[1];
  // Get the selected qualifier type for context
  var selectedQualifierType = qualifierTypes.find(function (qt) {
    return qt.name === formData.typeName;
  });
  var allowsContextList =
    (selectedQualifierType === null || selectedQualifierType === void 0
      ? void 0
      : selectedQualifierType.configuration) && selectedQualifierType.configuration.allowContextList;
  // Validation
  var validateForm = (0, react_1.useCallback)(
    function () {
      var newErrors = {};
      if (!formData.name.trim()) {
        newErrors.name = 'Name is required';
      } else if (
        existingNames.includes(formData.name) &&
        formData.name !== (qualifier === null || qualifier === void 0 ? void 0 : qualifier.name)
      ) {
        newErrors.name = 'Name must be unique';
      }
      if (!formData.typeName) {
        newErrors.typeName = 'Qualifier type is required';
      }
      if (formData.defaultPriority < 0 || formData.defaultPriority > 1000) {
        newErrors.defaultPriority = 'Priority must be between 0 and 1000';
      }
      if (formData.token && !/^[a-zA-Z][a-zA-Z0-9_]*$/.test(formData.token)) {
        newErrors.token = 'Token must start with a letter and contain only letters, numbers, and underscores';
      }
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    },
    [formData, existingNames, qualifier === null || qualifier === void 0 ? void 0 : qualifier.name]
  );
  var handleSave = (0, react_1.useCallback)(
    function () {
      if (!validateForm()) return;
      var result = tslib_1.__assign(
        tslib_1.__assign(
          tslib_1.__assign(
            { name: formData.name, typeName: formData.typeName, defaultPriority: formData.defaultPriority },
            formData.token && { token: formData.token }
          ),
          formData.token && formData.tokenIsOptional && { tokenIsOptional: true }
        ),
        formData.defaultValue && { defaultValue: formData.defaultValue }
      );
      onSave(result);
    },
    [formData, validateForm, onSave]
  );
  var updateField = (0, react_1.useCallback)(
    function (field, value) {
      setFormData(function (prev) {
        var _a;
        var updated = tslib_1.__assign(tslib_1.__assign({}, prev), ((_a = {}), (_a[field] = value), _a));
        // Auto-generate token from name if no custom token is set
        if (field === 'name' && !prev.token) {
          updated.token = value.toLowerCase().replace(/[^a-zA-Z0-9]/g, '');
        }
        // Clear tokenIsOptional if token is cleared
        if (field === 'token' && !value) {
          updated.tokenIsOptional = false;
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
    [errors]
  );
  var getDefaultValuePlaceholder = function () {
    var _a;
    if (!selectedQualifierType) return 'Enter default value';
    switch (selectedQualifierType.systemType) {
      case 'language':
        return allowsContextList ? 'e.g., en-US or en-US,en' : 'e.g., en-US';
      case 'territory':
        return allowsContextList ? 'e.g., US or US,CA' : 'e.g., US';
      case 'literal':
        var enumValues =
          (_a = selectedQualifierType.configuration) === null || _a === void 0 ? void 0 : _a.enumeratedValues;
        if (enumValues && enumValues.length > 0) {
          return allowsContextList
            ? 'e.g., '.concat(enumValues[0], ' or ').concat(enumValues.slice(0, 2).join(','))
            : 'e.g., '.concat(enumValues[0]);
        }
        return allowsContextList ? 'e.g., value or value1,value2' : 'e.g., value';
      default:
        return 'Enter default value';
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
          qualifier ? 'Edit Qualifier' : 'Add Qualifier'
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
          { className: 'grid grid-cols-2 gap-4' },
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
              placeholder: 'Enter qualifier name'
            }),
            errors.name &&
              react_1.default.createElement('p', { className: 'mt-1 text-sm text-red-600' }, errors.name)
          ),
          react_1.default.createElement(
            'div',
            null,
            react_1.default.createElement(
              'label',
              { className: 'block text-sm font-medium text-gray-700 mb-1' },
              'Qualifier Type *'
            ),
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
              qualifierTypes.length === 0
                ? react_1.default.createElement('option', { value: '' }, 'No qualifier types available')
                : qualifierTypes.map(function (type) {
                    return react_1.default.createElement(
                      'option',
                      { key: type.name, value: type.name },
                      type.name,
                      ' (',
                      type.systemType,
                      ')'
                    );
                  })
            ),
            errors.typeName &&
              react_1.default.createElement('p', { className: 'mt-1 text-sm text-red-600' }, errors.typeName)
          )
        ),
        react_1.default.createElement(
          'div',
          { className: 'grid grid-cols-2 gap-4' },
          react_1.default.createElement(
            'div',
            null,
            react_1.default.createElement(
              'label',
              { className: 'block text-sm font-medium text-gray-700 mb-1' },
              'Default Priority *'
            ),
            react_1.default.createElement('input', {
              type: 'number',
              min: '0',
              max: '1000',
              value: formData.defaultPriority,
              onChange: function (e) {
                return updateField('defaultPriority', parseInt(e.target.value) || 0);
              },
              className:
                'w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 '.concat(
                  errors.defaultPriority ? 'border-red-300' : 'border-gray-300'
                ),
              placeholder: '50'
            }),
            errors.defaultPriority &&
              react_1.default.createElement(
                'p',
                { className: 'mt-1 text-sm text-red-600' },
                errors.defaultPriority
              ),
            react_1.default.createElement(
              'p',
              { className: 'mt-1 text-xs text-gray-500' },
              'Higher numbers have higher priority (0-1000)'
            )
          ),
          react_1.default.createElement(
            'div',
            null,
            react_1.default.createElement(
              'label',
              { className: 'block text-sm font-medium text-gray-700 mb-1' },
              'Token',
              react_1.default.createElement('span', { className: 'ml-1 text-gray-500' }, '(optional)')
            ),
            react_1.default.createElement('input', {
              type: 'text',
              value: formData.token,
              onChange: function (e) {
                return updateField('token', e.target.value);
              },
              className:
                'w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 '.concat(
                  errors.token ? 'border-red-300' : 'border-gray-300'
                ),
              placeholder: 'e.g., lang, locale'
            }),
            errors.token &&
              react_1.default.createElement('p', { className: 'mt-1 text-sm text-red-600' }, errors.token),
            react_1.default.createElement(
              'p',
              { className: 'mt-1 text-xs text-gray-500' },
              'Used to identify this qualifier in resource names'
            )
          )
        ),
        formData.token &&
          react_1.default.createElement(
            'div',
            { className: 'flex items-center' },
            react_1.default.createElement('input', {
              type: 'checkbox',
              id: 'tokenIsOptional',
              checked: formData.tokenIsOptional,
              onChange: function (e) {
                return updateField('tokenIsOptional', e.target.checked);
              },
              className: 'h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
            }),
            react_1.default.createElement(
              'label',
              { htmlFor: 'tokenIsOptional', className: 'ml-2 text-sm text-gray-700' },
              'Token is optional in resource names'
            ),
            react_1.default.createElement(
              'div',
              { className: 'ml-2 group relative' },
              react_1.default.createElement(outline_1.InformationCircleIcon, {
                className: 'w-4 h-4 text-gray-400'
              }),
              react_1.default.createElement(
                'div',
                {
                  className:
                    'absolute left-0 bottom-6 hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-10'
                },
                'Allow resources without this qualifier token'
              )
            )
          ),
        react_1.default.createElement(
          'div',
          null,
          react_1.default.createElement(
            'label',
            { className: 'block text-sm font-medium text-gray-700 mb-1' },
            'Default Value',
            react_1.default.createElement('span', { className: 'ml-1 text-gray-500' }, '(optional)')
          ),
          react_1.default.createElement('input', {
            type: 'text',
            value: formData.defaultValue,
            onChange: function (e) {
              return updateField('defaultValue', e.target.value);
            },
            className:
              'w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500',
            placeholder: getDefaultValuePlaceholder()
          }),
          react_1.default.createElement(
            'div',
            { className: 'mt-1 text-xs text-gray-500' },
            selectedQualifierType &&
              react_1.default.createElement(
                'div',
                null,
                react_1.default.createElement(
                  'p',
                  null,
                  'Qualifier type: ',
                  react_1.default.createElement(
                    'span',
                    { className: 'font-medium' },
                    selectedQualifierType.systemType
                  )
                ),
                allowsContextList &&
                  react_1.default.createElement(
                    'p',
                    { className: 'text-blue-600' },
                    'This qualifier type supports multiple values (comma-separated)'
                  )
              )
          )
        ),
        selectedQualifierType &&
          react_1.default.createElement(
            'div',
            { className: 'p-4 bg-gray-50 rounded-lg' },
            react_1.default.createElement(
              'h4',
              { className: 'font-medium text-gray-900 mb-2' },
              'Qualifier Type Information'
            ),
            react_1.default.createElement(
              'div',
              { className: 'text-sm text-gray-600 space-y-1' },
              react_1.default.createElement(
                'p',
                null,
                react_1.default.createElement('span', { className: 'font-medium' }, 'System Type:'),
                ' ',
                selectedQualifierType.systemType
              ),
              react_1.default.createElement(
                'p',
                null,
                react_1.default.createElement('span', { className: 'font-medium' }, 'Supports Context List:'),
                ' ',
                allowsContextList ? 'Yes' : 'No'
              ),
              selectedQualifierType.systemType === 'literal' &&
                selectedQualifierType.configuration &&
                react_1.default.createElement(
                  react_1.default.Fragment,
                  null,
                  selectedQualifierType.configuration.caseSensitive !== undefined &&
                    react_1.default.createElement(
                      'p',
                      null,
                      react_1.default.createElement('span', { className: 'font-medium' }, 'Case Sensitive:'),
                      ' ',
                      selectedQualifierType.configuration.caseSensitive ? 'Yes' : 'No'
                    ),
                  selectedQualifierType.configuration.enumeratedValues &&
                    react_1.default.createElement(
                      'p',
                      null,
                      react_1.default.createElement('span', { className: 'font-medium' }, 'Allowed Values:'),
                      ' ',
                      selectedQualifierType.configuration.enumeratedValues.join(', ')
                    )
                ),
              selectedQualifierType.systemType === 'territory' &&
                selectedQualifierType.configuration &&
                react_1.default.createElement(
                  react_1.default.Fragment,
                  null,
                  selectedQualifierType.configuration.acceptLowercase !== undefined &&
                    react_1.default.createElement(
                      'p',
                      null,
                      react_1.default.createElement(
                        'span',
                        { className: 'font-medium' },
                        'Accept Lowercase:'
                      ),
                      ' ',
                      selectedQualifierType.configuration.acceptLowercase ? 'Yes' : 'No'
                    ),
                  selectedQualifierType.configuration.allowedTerritories &&
                    react_1.default.createElement(
                      'p',
                      null,
                      react_1.default.createElement(
                        'span',
                        { className: 'font-medium' },
                        'Allowed Territories:'
                      ),
                      ' ',
                      selectedQualifierType.configuration.allowedTerritories.join(', ')
                    )
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
          qualifier ? 'Save Changes' : 'Add Qualifier'
        )
      )
    )
  );
};
exports.QualifierEditForm = QualifierEditForm;
//# sourceMappingURL=QualifierEditForm.js.map
