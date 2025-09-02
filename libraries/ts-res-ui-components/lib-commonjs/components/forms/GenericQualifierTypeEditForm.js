'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.GenericQualifierTypeEditForm = void 0;
const tslib_1 = require('tslib');
const react_1 = tslib_1.__importStar(require('react'));
const outline_1 = require('@heroicons/react/24/outline');
/**
 * Form component for editing custom qualifier types with JSON configuration.
 * Provides a generic editor for qualifier types that don't use the built-in system types.
 *
 * @public
 */
const GenericQualifierTypeEditForm = ({ qualifierType, onSave, onCancel, existingNames = [] }) => {
  const [formData, setFormData] = (0, react_1.useState)(() => {
    if (qualifierType) {
      return {
        name: qualifierType.name,
        systemType: qualifierType.systemType,
        configuration: JSON.stringify(qualifierType.configuration || {}, null, 2)
      };
    }
    return {
      name: '',
      systemType: '',
      configuration: JSON.stringify({}, null, 2)
    };
  });
  const [errors, setErrors] = (0, react_1.useState)({});
  const [isJsonValid, setIsJsonValid] = (0, react_1.useState)(true);
  const [configValidation, setConfigValidation] = (0, react_1.useState)(null);
  // Validate JSON configuration on every change
  (0, react_1.useEffect)(() => {
    try {
      const parsed = JSON.parse(formData.configuration);
      setIsJsonValid(true);
      // Attempt to validate the configuration structure if we have both name and systemType
      if (formData.name && formData.systemType) {
        try {
          const testConfig = {
            name: formData.name,
            systemType: formData.systemType,
            configuration: parsed
          };
          // For now, we'll just check basic structure
          // In the future, this could call validateConfigurationJson if we had a qualifier type instance
          setConfigValidation(null); // Could be enhanced with actual validation
          setErrors((prev) => ({ ...prev, configuration: undefined }));
        } catch (validationError) {
          setConfigValidation(null); // Could store validation result
          setErrors((prev) => ({ ...prev, configuration: undefined }));
        }
      } else {
        setConfigValidation(null);
        setErrors((prev) => ({ ...prev, configuration: undefined }));
      }
    } catch (error) {
      setIsJsonValid(false);
      setConfigValidation(null);
      setErrors((prev) => ({
        ...prev,
        configuration: error instanceof Error ? `JSON Error: ${error.message}` : 'Invalid JSON'
      }));
    }
  }, [formData.configuration, formData.name, formData.systemType]);
  const validateForm = (0, react_1.useCallback)(() => {
    const newErrors = {};
    // Validate name
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (
      existingNames.includes(formData.name.trim()) &&
      (!qualifierType || qualifierType.name !== formData.name.trim())
    ) {
      newErrors.name = 'Name already exists';
    }
    // Validate system type
    if (!formData.systemType.trim()) {
      newErrors.systemType = 'System type is required';
    }
    // Validate JSON
    if (!isJsonValid) {
      newErrors.configuration = 'Valid JSON is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, qualifierType, existingNames, isJsonValid]);
  const handleSave = (0, react_1.useCallback)(() => {
    if (!validateForm()) {
      return;
    }
    try {
      const configuration = JSON.parse(formData.configuration);
      const newQualifierType = {
        name: formData.name.trim(),
        systemType: formData.systemType.trim(),
        configuration
      };
      onSave(newQualifierType);
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        configuration: 'Failed to parse JSON configuration'
      }));
    }
  }, [formData, validateForm, onSave]);
  const handleInputChange = (0, react_1.useCallback)(
    (field, value) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      // Clear error when user starts typing
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    },
    [errors]
  );
  const formatJson = (0, react_1.useCallback)(() => {
    try {
      const parsed = JSON.parse(formData.configuration);
      const formatted = JSON.stringify(parsed, null, 2);
      setFormData((prev) => ({ ...prev, configuration: formatted }));
    } catch (error) {
      // If JSON is invalid, don't format
    }
  }, [formData.configuration]);
  return react_1.default.createElement(
    'div',
    { className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50' },
    react_1.default.createElement(
      'div',
      { className: 'bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto' },
      react_1.default.createElement(
        'div',
        { className: 'flex items-center justify-between p-6 border-b border-gray-200' },
        react_1.default.createElement(
          'div',
          null,
          react_1.default.createElement(
            'h3',
            { className: 'text-lg font-semibold text-gray-900' },
            qualifierType ? 'Edit Custom Qualifier Type' : 'Add Custom Qualifier Type'
          ),
          react_1.default.createElement(
            'p',
            { className: 'text-sm text-gray-600 mt-1' },
            'Configure a custom qualifier type with JSON configuration'
          )
        ),
        react_1.default.createElement(
          'button',
          {
            onClick: onCancel,
            className: 'p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100'
          },
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
            { htmlFor: 'qualifierTypeName', className: 'block text-sm font-medium text-gray-700 mb-2' },
            'Name'
          ),
          react_1.default.createElement('input', {
            id: 'qualifierTypeName',
            type: 'text',
            value: formData.name,
            onChange: (e) => handleInputChange('name', e.target.value),
            className: `w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`,
            placeholder: "Enter qualifier type name (e.g., 'custom-dimension')"
          }),
          errors.name &&
            react_1.default.createElement(
              'div',
              { className: 'mt-1 flex items-center text-sm text-red-600' },
              react_1.default.createElement(outline_1.ExclamationTriangleIcon, {
                className: 'w-4 h-4 mr-1 flex-shrink-0'
              }),
              errors.name
            )
        ),
        react_1.default.createElement(
          'div',
          null,
          react_1.default.createElement(
            'label',
            { htmlFor: 'systemType', className: 'block text-sm font-medium text-gray-700 mb-2' },
            'System Type'
          ),
          react_1.default.createElement('input', {
            id: 'systemType',
            type: 'text',
            value: formData.systemType,
            onChange: (e) => handleInputChange('systemType', e.target.value),
            className: `w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.systemType ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`,
            placeholder: "Enter system type (e.g., 'custom', 'dimension')"
          }),
          errors.systemType &&
            react_1.default.createElement(
              'div',
              { className: 'mt-1 flex items-center text-sm text-red-600' },
              react_1.default.createElement(outline_1.ExclamationTriangleIcon, {
                className: 'w-4 h-4 mr-1 flex-shrink-0'
              }),
              errors.systemType
            )
        ),
        react_1.default.createElement(
          'div',
          null,
          react_1.default.createElement(
            'div',
            { className: 'flex items-center justify-between mb-2' },
            react_1.default.createElement(
              'label',
              { htmlFor: 'configuration', className: 'block text-sm font-medium text-gray-700' },
              'Configuration (JSON)'
            ),
            react_1.default.createElement(
              'button',
              {
                type: 'button',
                onClick: formatJson,
                disabled: !isJsonValid,
                className: 'text-xs text-blue-600 hover:text-blue-800 disabled:text-gray-400'
              },
              'Format JSON'
            )
          ),
          react_1.default.createElement('textarea', {
            id: 'configuration',
            rows: 12,
            value: formData.configuration,
            onChange: (e) => handleInputChange('configuration', e.target.value),
            className: `w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm ${
              errors.configuration ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`,
            placeholder: '{"property": "value"}'
          }),
          errors.configuration &&
            react_1.default.createElement(
              'div',
              { className: 'mt-1 flex items-center text-sm text-red-600' },
              react_1.default.createElement(outline_1.ExclamationTriangleIcon, {
                className: 'w-4 h-4 mr-1 flex-shrink-0'
              }),
              errors.configuration
            ),
          isJsonValid &&
            react_1.default.createElement(
              'div',
              { className: 'mt-1 flex items-center text-sm text-green-600' },
              react_1.default.createElement(outline_1.InformationCircleIcon, {
                className: 'w-4 h-4 mr-1 flex-shrink-0'
              }),
              'Valid JSON configuration'
            )
        ),
        react_1.default.createElement(
          'div',
          { className: 'bg-blue-50 border border-blue-200 rounded-lg p-4' },
          react_1.default.createElement(
            'div',
            { className: 'flex items-start' },
            react_1.default.createElement(outline_1.InformationCircleIcon, {
              className: 'w-5 h-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0'
            }),
            react_1.default.createElement(
              'div',
              { className: 'text-sm text-blue-700' },
              react_1.default.createElement('p', { className: 'font-medium mb-1' }, 'Custom Qualifier Types'),
              react_1.default.createElement(
                'p',
                null,
                'Custom qualifier types allow you to extend the system with your own validation logic. The configuration object can contain any valid JSON and will be passed to your custom qualifier type implementation.'
              )
            )
          )
        )
      ),
      react_1.default.createElement(
        'div',
        { className: 'flex items-center justify-end gap-3 p-6 border-t border-gray-200' },
        react_1.default.createElement(
          'button',
          {
            onClick: onCancel,
            className:
              'px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
          },
          'Cancel'
        ),
        react_1.default.createElement(
          'button',
          {
            onClick: handleSave,
            disabled: !isJsonValid || Object.keys(errors).length > 0,
            className:
              'px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'
          },
          qualifierType ? 'Update' : 'Create',
          ' Qualifier Type'
        )
      )
    )
  );
};
exports.GenericQualifierTypeEditForm = GenericQualifierTypeEditForm;
//# sourceMappingURL=GenericQualifierTypeEditForm.js.map
