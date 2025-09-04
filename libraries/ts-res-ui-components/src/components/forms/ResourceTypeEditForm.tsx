import React, { useState, useCallback } from 'react';
import { XMarkIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { ResourceTypes } from '@fgv/ts-res';

/**
 * Props for the ResourceTypeEditForm component.
 *
 * @public
 */
export interface ResourceTypeEditFormProps {
  /** Existing resource type to edit (undefined for creating new type) */
  resourceType?: ResourceTypes.Config.IResourceTypeConfig;
  /** Callback fired when resource type is saved */
  onSave: (resourceType: ResourceTypes.Config.IResourceTypeConfig) => void;
  /** Callback fired when editing is cancelled */
  onCancel: () => void;
  /** Names of existing resource types to prevent duplicates */
  existingNames?: string[];
}

interface FormData {
  name: string;
  typeName: string;
}

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
export const ResourceTypeEditForm: React.FC<ResourceTypeEditFormProps> = ({
  resourceType,
  onSave,
  onCancel,
  existingNames = []
}) => {
  const [formData, setFormData] = useState<FormData>(() => {
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

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [useCustomTypeName, setUseCustomTypeName] = useState(() => {
    if (resourceType) {
      return !COMMON_TYPE_NAMES.includes(resourceType.typeName);
    }
    return false;
  });

  // Validation
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

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

  const handleSave = useCallback(() => {
    if (!validateForm()) return;

    const result: ResourceTypes.Config.IResourceTypeConfig = {
      name: formData.name,
      typeName: formData.typeName
    };

    onSave(result);
  }, [formData, validateForm, onSave]);

  const updateField = useCallback(
    (field: keyof FormData, value: any) => {
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

  const handleTypeNameModeChange = useCallback(
    (useCustom: boolean) => {
      setUseCustomTypeName(useCustom);
      if (!useCustom && !resourceType) {
        // Reset to a common type
        updateField('typeName', 'string');
      }
    },
    [resourceType, updateField]
  );

  const getTypeNameDescription = (typeName: string): string => {
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

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full h-full max-h-[calc(100vh-2rem)] flex flex-col">
        {/* Fixed Header */}
        <div className="flex items-center justify-between p-6 border-b flex-shrink-0">
          <h3 className="text-lg font-medium text-gray-900">
            {resourceType ? 'Edit Resource Type' : 'Add Resource Type'}
          </h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 min-h-0">
          {/* Basic Properties */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => updateField('name', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                errors.name ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter resource type name (e.g., 'userSettings', 'errorMessages')"
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            <p className="mt-1 text-xs text-gray-500">
              A descriptive name for this type of resource. This will be used to categorize and identify
              resources.
            </p>
          </div>

          {/* Type Name Configuration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Type Name Configuration *</label>

            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  type="radio"
                  id="useCommonType"
                  name="typeNameMode"
                  checked={!useCustomTypeName}
                  onChange={() => handleTypeNameModeChange(false)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <label htmlFor="useCommonType" className="ml-2 text-sm text-gray-700">
                  Use common type name
                </label>
              </div>

              {!useCustomTypeName && (
                <div className="ml-6">
                  <select
                    value={formData.typeName}
                    onChange={(e) => updateField('typeName', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                      errors.typeName ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    {COMMON_TYPE_NAMES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-600">{getTypeNameDescription(formData.typeName)}</p>
                </div>
              )}

              <div className="flex items-center">
                <input
                  type="radio"
                  id="useCustomType"
                  name="typeNameMode"
                  checked={useCustomTypeName}
                  onChange={() => handleTypeNameModeChange(true)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <label htmlFor="useCustomType" className="ml-2 text-sm text-gray-700">
                  Define custom type name
                </label>
              </div>

              {useCustomTypeName && (
                <div className="ml-6">
                  <input
                    type="text"
                    value={formData.typeName}
                    onChange={(e) => updateField('typeName', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                      errors.typeName ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter custom type name"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Define a custom type name for specialized resource handling
                  </p>
                </div>
              )}
            </div>

            {errors.typeName && <p className="mt-1 text-sm text-red-600">{errors.typeName}</p>}
          </div>

          {/* Information Panel */}
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-start">
              <InformationCircleIcon className="w-5 h-5 text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <h4 className="font-medium mb-2">About Resource Types</h4>
                <div className="space-y-2">
                  <p>
                    Resource types define how resources are categorized and processed in your application.
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>
                      <strong>Name:</strong> A human-readable identifier for grouping resources
                    </li>
                    <li>
                      <strong>Type Name:</strong> Determines how the resource data is interpreted and
                      validated
                    </li>
                    <li>Common types (string, object, array) provide built-in processing</li>
                    <li>Custom types allow specialized handling for domain-specific data</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Preview</h4>
            <div className="text-sm text-gray-600">
              <p>
                <span className="font-medium">Resource Type:</span> {formData.name || '(name not set)'}
              </p>
              <p>
                <span className="font-medium">Type Name:</span> {formData.typeName}
              </p>
              <p>
                <span className="font-medium">Description:</span> {getTypeNameDescription(formData.typeName)}
              </p>
            </div>
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="flex justify-end space-x-3 px-6 py-4 border-t bg-gray-50 flex-shrink-0">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {resourceType ? 'Save Changes' : 'Add Resource Type'}
          </button>
        </div>
      </div>
    </div>
  );
};
