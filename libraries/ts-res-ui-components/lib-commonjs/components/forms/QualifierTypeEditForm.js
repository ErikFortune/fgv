'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.QualifierTypeEditForm = void 0;
const tslib_1 = require('tslib');
const react_1 = tslib_1.__importStar(require('react'));
const outline_1 = require('@heroicons/react/24/outline');
const HierarchyEditor_1 = require('./HierarchyEditor');
/**
 * Modal form component for creating and editing qualifier types in a ts-res system configuration.
 *
 * The QualifierTypeEditForm provides a comprehensive interface for defining qualifier types that
 * control the behavior and validation of qualifiers. It supports all three system types (language,
 * territory, literal) with type-specific configuration options, enumerated values, and hierarchical
 * relationships between values.
 *
 * @example
 * ```tsx
 * import { ConfigurationTools } from '@fgv/ts-res-ui-components';
 *
 * // Creating a new literal qualifier type with enumerated values
 * const [showForm, setShowForm] = useState(false);
 * const [qualifierTypes, setQualifierTypes] = useState([]);
 *
 * const handleSave = (qualifierType) => {
 *   setQualifierTypes(prev => [...prev, qualifierType]);
 *   setShowForm(false);
 * };
 *
 * {showForm && (
 *   <ConfigurationTools.QualifierTypeEditForm
 *     onSave={handleSave}
 *     onCancel={() => setShowForm(false)}
 *     existingNames={qualifierTypes.map(qt => qt.name)}
 *   />
 * )}
 * ```
 *
 * @example
 * ```tsx
 * // Editing a platform qualifier type with hierarchy
 * const platformType = {
 *   name: 'platform',
 *   systemType: 'literal',
 *   configuration: {
 *     allowContextList: true,
 *     caseSensitive: false,
 *     enumeratedValues: ['web', 'mobile', 'desktop', 'smart-tv'],
 *     hierarchy: {
 *       'smart-tv': 'web',  // smart-tv inherits from web
 *       'tablet': 'mobile'  // tablet inherits from mobile
 *     }
 *   }
 * };
 *
 * <ConfigurationTools.QualifierTypeEditForm
 *   qualifierType={platformType}
 *   onSave={updatePlatformType}
 *   onCancel={closeEditor}
 *   existingNames={otherTypeNames}
 * />
 * ```
 *
 * @example
 * ```tsx
 * // Territory qualifier type with restricted territories
 * const regionType = {
 *   name: 'region',
 *   systemType: 'territory',
 *   configuration: {
 *     allowContextList: false,
 *     acceptLowercase: true,
 *     allowedTerritories: ['US', 'CA', 'GB', 'AU'],
 *     hierarchy: {
 *       'US': 'AMERICAS',
 *       'CA': 'AMERICAS',
 *       'GB': 'EUROPE',
 *       'AU': 'APAC'
 *     }
 *   }
 * };
 *
 * <ConfigurationTools.QualifierTypeEditForm
 *   qualifierType={regionType}
 *   onSave={saveRegionType}
 *   onCancel={cancelEdit}
 * />
 * ```
 *
 * @example
 * ```tsx
 * // Simple language qualifier type
 * const languageType = {
 *   name: 'locale',
 *   systemType: 'language',
 *   configuration: {
 *     allowContextList: true // Allow multiple languages like 'en-US,en'
 *   }
 * };
 *
 * <ConfigurationTools.QualifierTypeEditForm
 *   qualifierType={languageType}
 *   onSave={handleLanguageTypeSave}
 *   onCancel={handleCancel}
 *   existingNames={existingTypeNames}
 * />
 * ```
 *
 * @public
 */
const QualifierTypeEditForm = ({ qualifierType, onSave, onCancel, existingNames = [] }) => {
  const [formData, setFormData] = (0, react_1.useState)(() => {
    if (qualifierType) {
      const config = qualifierType.configuration || {};
      // Ensure hierarchy is a plain object with string values
      let hierarchy = {};
      const rawHierarchy = config?.hierarchy;
      if (rawHierarchy && typeof rawHierarchy === 'object' && !Array.isArray(rawHierarchy)) {
        for (const [key, value] of Object.entries(rawHierarchy)) {
          if (typeof value === 'string') {
            hierarchy[key] = value;
          }
        }
      }
      return {
        name: qualifierType.name,
        systemType: qualifierType.systemType,
        allowContextList: config?.allowContextList ?? false,
        caseSensitive: config?.caseSensitive ?? true,
        enumeratedValues: config?.enumeratedValues || [],
        acceptLowercase: config?.acceptLowercase ?? false,
        allowedTerritories: config?.allowedTerritories || [],
        hierarchy: hierarchy
      };
    }
    return {
      name: '',
      systemType: 'literal',
      allowContextList: false,
      caseSensitive: true,
      enumeratedValues: [],
      acceptLowercase: false,
      allowedTerritories: [],
      hierarchy: {}
    };
  });
  const [errors, setErrors] = (0, react_1.useState)({});
  const [enumeratedValuesText, setEnumeratedValuesText] = (0, react_1.useState)(
    formData.enumeratedValues.join(', ')
  );
  const [allowedTerritoriesText, setAllowedTerritoriesText] = (0, react_1.useState)(
    formData.allowedTerritories.join(', ')
  );
  // Validation
  const validateForm = (0, react_1.useCallback)(() => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (existingNames.includes(formData.name) && formData.name !== qualifierType?.name) {
      newErrors.name = 'Name must be unique';
    }
    if (formData.systemType === 'literal' && formData.enumeratedValues.length === 0) {
      newErrors.enumeratedValues = 'Literal types should have enumerated values';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, existingNames, qualifierType?.name]);
  // Update enumerated values when text changes
  (0, react_1.useEffect)(() => {
    const values = enumeratedValuesText
      .split(',')
      .map((v) => v.trim())
      .filter((v) => v.length > 0);
    setFormData((prev) => ({ ...prev, enumeratedValues: values }));
  }, [enumeratedValuesText]);
  // Update allowed territories when text changes
  (0, react_1.useEffect)(() => {
    const territories = allowedTerritoriesText
      .split(',')
      .map((v) => v.trim().toUpperCase())
      .filter((v) => v.length > 0);
    setFormData((prev) => ({ ...prev, allowedTerritories: territories }));
  }, [allowedTerritoriesText]);
  const handleSave = (0, react_1.useCallback)(() => {
    if (!validateForm()) return;
    let configuration = {
      allowContextList: formData.allowContextList
    };
    switch (formData.systemType) {
      case 'literal':
        configuration = {
          ...configuration,
          caseSensitive: formData.caseSensitive,
          enumeratedValues: formData.enumeratedValues.length > 0 ? formData.enumeratedValues : undefined
        };
        // Add hierarchy if it has entries
        if (Object.keys(formData.hierarchy).length > 0) {
          configuration.hierarchy = formData.hierarchy;
        }
        break;
      case 'territory':
        configuration = {
          ...configuration,
          acceptLowercase: formData.acceptLowercase,
          allowedTerritories: formData.allowedTerritories.length > 0 ? formData.allowedTerritories : undefined
        };
        // Add hierarchy if it has entries
        if (Object.keys(formData.hierarchy).length > 0) {
          configuration.hierarchy = formData.hierarchy;
        }
        break;
      case 'language':
        // Language types only have allowContextList
        break;
    }
    const result = {
      name: formData.name,
      systemType: formData.systemType,
      configuration: Object.keys(configuration).length > 1 ? configuration : undefined
    };
    onSave(result);
  }, [formData, validateForm, onSave]);
  const updateField = (0, react_1.useCallback)(
    (field, value) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: '' }));
      }
    },
    [errors]
  );
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
        { className: 'p-6 space-y-6 overflow-y-auto flex-1 min-h-0' },
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
              onChange: (e) => updateField('name', e.target.value),
              className: `w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                errors.name ? 'border-red-300' : 'border-gray-300'
              }`,
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
                onChange: (e) => updateField('systemType', e.target.value),
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
            onChange: (e) => updateField('allowContextList', e.target.checked),
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
                onChange: (e) => updateField('caseSensitive', e.target.checked),
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
                onChange: (e) => setEnumeratedValuesText(e.target.value),
                className: `w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                  errors.enumeratedValues ? 'border-red-300' : 'border-gray-300'
                }`,
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
                onChange: (e) => updateField('acceptLowercase', e.target.checked),
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
                onChange: (e) => setAllowedTerritoriesText(e.target.value),
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
        (formData.systemType === 'literal' || formData.systemType === 'territory') &&
          react_1.default.createElement(
            'div',
            { className: 'space-y-4' },
            react_1.default.createElement(HierarchyEditor_1.HierarchyEditor, {
              hierarchy: formData.hierarchy,
              onChange: (hierarchy) => updateField('hierarchy', hierarchy),
              availableValues:
                formData.systemType === 'literal' ? formData.enumeratedValues : formData.allowedTerritories
            })
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
          qualifierType ? 'Save Changes' : 'Add Qualifier Type'
        )
      )
    )
  );
};
exports.QualifierTypeEditForm = QualifierTypeEditForm;
//# sourceMappingURL=QualifierTypeEditForm.js.map
