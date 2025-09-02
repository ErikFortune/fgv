'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.ResourceTypeEditForm = void 0;
const tslib_1 = require('tslib');
const react_1 = tslib_1.__importStar(require('react'));
const outline_1 = require('@heroicons/react/24/outline');
const COMMON_TYPE_NAMES = [
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
/**
 * Modal form component for creating and editing resource types in a ts-res system configuration.
 *
 * The ResourceTypeEditForm provides an interface for defining resource types that categorize
 * resources and determine their data handling behavior. It supports both common predefined
 * types and custom types for specialized use cases, with automatic type suggestion based
 * on resource type names.
 *
 * @example
 * ```tsx
 * import { ConfigurationTools } from '@fgv/ts-res-ui-components';
 *
 * // Creating a new resource type with common type
 * const [showForm, setShowForm] = useState(false);
 * const [resourceTypes, setResourceTypes] = useState([]);
 *
 * const handleSave = (resourceType) => {
 *   setResourceTypes(prev => [...prev, resourceType]);
 *   setShowForm(false);
 * };
 *
 * {showForm && (
 *   <ConfigurationTools.ResourceTypeEditForm
 *     onSave={handleSave}
 *     onCancel={() => setShowForm(false)}
 *     existingNames={resourceTypes.map(rt => rt.name)}
 *   />
 * )}
 * ```
 *
 * @example
 * ```tsx
 * // Editing an existing resource type
 * const userSettingsType = {
 *   name: 'userSettings',
 *   typeName: 'object'  // Built-in object type for structured data
 * };
 *
 * <ConfigurationTools.ResourceTypeEditForm
 *   resourceType={userSettingsType}
 *   onSave={updateResourceType}
 *   onCancel={closeEditor}
 *   existingNames={otherTypeNames}
 * />
 * ```
 *
 * @example
 * ```tsx
 * // Creating resource types for different content categories
 * const contentTypes = [
 *   { name: 'errorMessages', typeName: 'string' },
 *   { name: 'uiLabels', typeName: 'localizedString' },
 *   { name: 'navigationMenus', typeName: 'object' },
 *   { name: 'permissionLists', typeName: 'array' },
 *   { name: 'appConfig', typeName: 'config' },
 *   { name: 'customValidator', typeName: 'customValidation' } // Custom type
 * ];
 *
 * const CreateResourceTypesForm = () => {
 *   const [currentType, setCurrentType] = useState(null);
 *
 *   return (
 *     <div>
 *       {currentType && (
 *         <ConfigurationTools.ResourceTypeEditForm
 *           resourceType={currentType}
 *           onSave={handleSaveType}
 *           onCancel={() => setCurrentType(null)}
 *           existingNames={existingNames}
 *         />
 *       )}
 *     </div>
 *   );
 * };
 * ```
 *
 * @example
 * ```tsx
 * // Custom resource type for specialized processing
 * const templateType = {
 *   name: 'emailTemplates',
 *   typeName: 'htmlTemplate'  // Custom type name for specialized handling
 * };
 *
 * <ConfigurationTools.ResourceTypeEditForm
 *   resourceType={templateType}
 *   onSave={(updatedType) => {
 *     // Handle custom type processing
 *     console.log('Custom type saved:', updatedType.typeName);
 *     saveToConfiguration(updatedType);
 *   }}
 *   onCancel={cancelEdit}
 * />
 * ```
 *
 * @public
 */
const ResourceTypeEditForm = ({ resourceType, onSave, onCancel, existingNames = [] }) => {
  const [formData, setFormData] = (0, react_1.useState)(() => {
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
  });
  const [errors, setErrors] = (0, react_1.useState)({});
  const [useCustomTypeName, setUseCustomTypeName] = (0, react_1.useState)(() => {
    if (resourceType) {
      return !COMMON_TYPE_NAMES.includes(resourceType.typeName);
    }
    return false;
  });
  // Validation
  const validateForm = (0, react_1.useCallback)(() => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (existingNames.includes(formData.name) && formData.name !== resourceType?.name) {
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
  }, [formData, existingNames, resourceType?.name]);
  const handleSave = (0, react_1.useCallback)(() => {
    if (!validateForm()) return;
    const result = {
      name: formData.name,
      typeName: formData.typeName
    };
    onSave(result);
  }, [formData, validateForm, onSave]);
  const updateField = (0, react_1.useCallback)(
    (field, value) => {
      setFormData((prev) => {
        const updated = { ...prev, [field]: value };
        // Auto-generate typeName from name for new resource types if using common types
        if (field === 'name' && !resourceType && !useCustomTypeName) {
          const cleanName = value.toLowerCase().replace(/[^a-zA-Z0-9]/g, '');
          const commonType = COMMON_TYPE_NAMES.find(
            (type) => cleanName.includes(type) || type.includes(cleanName)
          );
          if (commonType) {
            updated.typeName = commonType;
          } else {
            updated.typeName = cleanName || 'string';
          }
        }
        return updated;
      });
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: '' }));
      }
    },
    [errors, resourceType, useCustomTypeName]
  );
  const handleTypeNameModeChange = (0, react_1.useCallback)(
    (useCustom) => {
      setUseCustomTypeName(useCustom);
      if (!useCustom && !resourceType) {
        // Reset to a common type
        updateField('typeName', 'string');
      }
    },
    [resourceType, updateField]
  );
  const getTypeNameDescription = (typeName) => {
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
    { className: 'fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4' },
    react_1.default.createElement(
      'div',
      {
        className:
          'bg-white rounded-lg shadow-xl max-w-2xl w-full h-full max-h-[calc(100vh-2rem)] flex flex-col'
      },
      react_1.default.createElement(
        'div',
        { className: 'flex items-center justify-between p-6 border-b flex-shrink-0' },
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
        { className: 'p-6 space-y-6 overflow-y-auto flex-1 min-h-0' },
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
            onChange: (e) => updateField('name', e.target.value),
            className: `w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${
              errors.name ? 'border-red-300' : 'border-gray-300'
            }`,
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
                onChange: () => handleTypeNameModeChange(false),
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
                    onChange: (e) => updateField('typeName', e.target.value),
                    className: `w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                      errors.typeName ? 'border-red-300' : 'border-gray-300'
                    }`
                  },
                  COMMON_TYPE_NAMES.map((type) =>
                    react_1.default.createElement('option', { key: type, value: type }, type)
                  )
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
                onChange: () => handleTypeNameModeChange(true),
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
                  onChange: (e) => updateField('typeName', e.target.value),
                  className: `w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                    errors.typeName ? 'border-red-300' : 'border-gray-300'
                  }`,
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
        { className: 'flex justify-end space-x-3 px-6 py-4 border-t bg-gray-50 flex-shrink-0' },
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
