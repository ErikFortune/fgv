'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.QualifierTypeEditForm = void 0;
var tslib_1 = require('tslib');
var react_1 = tslib_1.__importStar(require('react'));
var outline_1 = require('@heroicons/react/24/outline');
var QualifierTypeEditForm = function (_a) {
  var qualifierType = _a.qualifierType,
    onSave = _a.onSave,
    onCancel = _a.onCancel,
    _b = _a.existingNames,
    existingNames = _b === void 0 ? [] : _b;
  var _c = (0, react_1.useState)(function () {
      var _a, _b, _c;
      if (qualifierType) {
        var config = qualifierType.configuration || {};
        return {
          name: qualifierType.name,
          systemType: qualifierType.systemType,
          allowContextList:
            (_a = config === null || config === void 0 ? void 0 : config.allowContextList) !== null &&
            _a !== void 0
              ? _a
              : false,
          caseSensitive:
            (_b = config === null || config === void 0 ? void 0 : config.caseSensitive) !== null &&
            _b !== void 0
              ? _b
              : true,
          enumeratedValues: (config === null || config === void 0 ? void 0 : config.enumeratedValues) || [],
          acceptLowercase:
            (_c = config === null || config === void 0 ? void 0 : config.acceptLowercase) !== null &&
            _c !== void 0
              ? _c
              : false,
          allowedTerritories:
            (config === null || config === void 0 ? void 0 : config.allowedTerritories) || []
        };
      }
      return {
        name: '',
        systemType: 'literal',
        allowContextList: false,
        caseSensitive: true,
        enumeratedValues: [],
        acceptLowercase: false,
        allowedTerritories: []
      };
    }),
    formData = _c[0],
    setFormData = _c[1];
  var _d = (0, react_1.useState)({}),
    errors = _d[0],
    setErrors = _d[1];
  var _e = (0, react_1.useState)(formData.enumeratedValues.join(', ')),
    enumeratedValuesText = _e[0],
    setEnumeratedValuesText = _e[1];
  var _f = (0, react_1.useState)(formData.allowedTerritories.join(', ')),
    allowedTerritoriesText = _f[0],
    setAllowedTerritoriesText = _f[1];
  // Validation
  var validateForm = (0, react_1.useCallback)(
    function () {
      var newErrors = {};
      if (!formData.name.trim()) {
        newErrors.name = 'Name is required';
      } else if (
        existingNames.includes(formData.name) &&
        formData.name !== (qualifierType === null || qualifierType === void 0 ? void 0 : qualifierType.name)
      ) {
        newErrors.name = 'Name must be unique';
      }
      if (formData.systemType === 'literal' && formData.enumeratedValues.length === 0) {
        newErrors.enumeratedValues = 'Literal types should have enumerated values';
      }
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    },
    [
      formData,
      existingNames,
      qualifierType === null || qualifierType === void 0 ? void 0 : qualifierType.name
    ]
  );
  // Update enumerated values when text changes
  (0, react_1.useEffect)(
    function () {
      var values = enumeratedValuesText
        .split(',')
        .map(function (v) {
          return v.trim();
        })
        .filter(function (v) {
          return v.length > 0;
        });
      setFormData(function (prev) {
        return tslib_1.__assign(tslib_1.__assign({}, prev), { enumeratedValues: values });
      });
    },
    [enumeratedValuesText]
  );
  // Update allowed territories when text changes
  (0, react_1.useEffect)(
    function () {
      var territories = allowedTerritoriesText
        .split(',')
        .map(function (v) {
          return v.trim().toUpperCase();
        })
        .filter(function (v) {
          return v.length > 0;
        });
      setFormData(function (prev) {
        return tslib_1.__assign(tslib_1.__assign({}, prev), { allowedTerritories: territories });
      });
    },
    [allowedTerritoriesText]
  );
  var handleSave = (0, react_1.useCallback)(
    function () {
      if (!validateForm()) return;
      var configuration = {
        allowContextList: formData.allowContextList
      };
      switch (formData.systemType) {
        case 'literal':
          configuration = tslib_1.__assign(tslib_1.__assign({}, configuration), {
            caseSensitive: formData.caseSensitive,
            enumeratedValues: formData.enumeratedValues.length > 0 ? formData.enumeratedValues : undefined
          });
          break;
        case 'territory':
          configuration = tslib_1.__assign(tslib_1.__assign({}, configuration), {
            acceptLowercase: formData.acceptLowercase,
            allowedTerritories:
              formData.allowedTerritories.length > 0 ? formData.allowedTerritories : undefined
          });
          break;
        case 'language':
          // Language types only have allowContextList
          break;
      }
      var result = {
        name: formData.name,
        systemType: formData.systemType,
        configuration: Object.keys(configuration).length > 1 ? configuration : undefined
      };
      onSave(result);
    },
    [formData, validateForm, onSave]
  );
  var updateField = (0, react_1.useCallback)(
    function (field, value) {
      setFormData(function (prev) {
        var _a;
        return tslib_1.__assign(tslib_1.__assign({}, prev), ((_a = {}), (_a[field] = value), _a));
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
          qualifierType ? 'Edit Qualifier Type' : 'Add Qualifier Type'
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
              placeholder: 'Enter qualifier type name'
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
              'System Type *'
            ),
            react_1.default.createElement(
              'select',
              {
                value: formData.systemType,
                onChange: function (e) {
                  return updateField('systemType', e.target.value);
                },
                className:
                  'w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500'
              },
              react_1.default.createElement('option', { value: 'literal' }, 'Literal'),
              react_1.default.createElement('option', { value: 'language' }, 'Language'),
              react_1.default.createElement('option', { value: 'territory' }, 'Territory')
            )
          )
        ),
        react_1.default.createElement(
          'div',
          { className: 'flex items-center' },
          react_1.default.createElement('input', {
            type: 'checkbox',
            id: 'allowContextList',
            checked: formData.allowContextList,
            onChange: function (e) {
              return updateField('allowContextList', e.target.checked);
            },
            className: 'h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
          }),
          react_1.default.createElement(
            'label',
            { htmlFor: 'allowContextList', className: 'ml-2 text-sm text-gray-700' },
            'Allow Context List'
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
                  'absolute left-0 bottom-6 hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap'
              },
              'Allow multiple values separated by commas'
            )
          )
        ),
        formData.systemType === 'literal' &&
          react_1.default.createElement(
            'div',
            { className: 'space-y-4 p-4 bg-blue-50 rounded-lg' },
            react_1.default.createElement(
              'h4',
              { className: 'font-medium text-gray-900' },
              'Literal Type Configuration'
            ),
            react_1.default.createElement(
              'div',
              { className: 'flex items-center' },
              react_1.default.createElement('input', {
                type: 'checkbox',
                id: 'caseSensitive',
                checked: formData.caseSensitive,
                onChange: function (e) {
                  return updateField('caseSensitive', e.target.checked);
                },
                className: 'h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
              }),
              react_1.default.createElement(
                'label',
                { htmlFor: 'caseSensitive', className: 'ml-2 text-sm text-gray-700' },
                'Case Sensitive'
              )
            ),
            react_1.default.createElement(
              'div',
              null,
              react_1.default.createElement(
                'label',
                { className: 'block text-sm font-medium text-gray-700 mb-1' },
                'Enumerated Values'
              ),
              react_1.default.createElement('textarea', {
                value: enumeratedValuesText,
                onChange: function (e) {
                  return setEnumeratedValuesText(e.target.value);
                },
                className:
                  'w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 '.concat(
                    errors.enumeratedValues ? 'border-red-300' : 'border-gray-300'
                  ),
                rows: 3,
                placeholder: 'Enter values separated by commas (e.g., dev, test, prod)'
              }),
              errors.enumeratedValues &&
                react_1.default.createElement(
                  'p',
                  { className: 'mt-1 text-sm text-red-600' },
                  errors.enumeratedValues
                ),
              react_1.default.createElement(
                'p',
                { className: 'mt-1 text-xs text-gray-500' },
                'Separate multiple values with commas'
              )
            )
          ),
        formData.systemType === 'territory' &&
          react_1.default.createElement(
            'div',
            { className: 'space-y-4 p-4 bg-green-50 rounded-lg' },
            react_1.default.createElement(
              'h4',
              { className: 'font-medium text-gray-900' },
              'Territory Type Configuration'
            ),
            react_1.default.createElement(
              'div',
              { className: 'flex items-center' },
              react_1.default.createElement('input', {
                type: 'checkbox',
                id: 'acceptLowercase',
                checked: formData.acceptLowercase,
                onChange: function (e) {
                  return updateField('acceptLowercase', e.target.checked);
                },
                className: 'h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
              }),
              react_1.default.createElement(
                'label',
                { htmlFor: 'acceptLowercase', className: 'ml-2 text-sm text-gray-700' },
                'Accept Lowercase Territory Codes'
              )
            ),
            react_1.default.createElement(
              'div',
              null,
              react_1.default.createElement(
                'label',
                { className: 'block text-sm font-medium text-gray-700 mb-1' },
                'Allowed Territories'
              ),
              react_1.default.createElement('textarea', {
                value: allowedTerritoriesText,
                onChange: function (e) {
                  return setAllowedTerritoriesText(e.target.value);
                },
                className:
                  'w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500',
                rows: 3,
                placeholder: 'Enter territory codes separated by commas (e.g., US, CA, GB)'
              }),
              react_1.default.createElement(
                'p',
                { className: 'mt-1 text-xs text-gray-500' },
                'Separate multiple territory codes with commas. Will be automatically converted to uppercase.'
              )
            )
          ),
        formData.systemType === 'language' &&
          react_1.default.createElement(
            'div',
            { className: 'p-4 bg-yellow-50 rounded-lg' },
            react_1.default.createElement(
              'h4',
              { className: 'font-medium text-gray-900' },
              'Language Type Configuration'
            ),
            react_1.default.createElement(
              'p',
              { className: 'text-sm text-gray-600 mt-2' },
              'Language qualifier types use BCP47 language tags and only support the "Allow Context List" option above.'
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
          qualifierType ? 'Save Changes' : 'Add Qualifier Type'
        )
      )
    )
  );
};
exports.QualifierTypeEditForm = QualifierTypeEditForm;
//# sourceMappingURL=QualifierTypeEditForm.js.map
