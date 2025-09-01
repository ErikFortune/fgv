import React, { useState, useCallback, useEffect } from 'react';
import { XMarkIcon, InformationCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { QualifierTypes } from '@fgv/ts-res';
import { JsonObject } from '@fgv/ts-json-base';
import { Result } from '@fgv/ts-utils';

/**
 * Props for the GenericQualifierTypeEditForm component.
 * Used for editing custom qualifier types with JSON configuration.
 *
 * @public
 */
export interface GenericQualifierTypeEditFormProps {
  /** Existing qualifier type to edit (undefined for creating new type) */
  qualifierType?: QualifierTypes.Config.IAnyQualifierTypeConfig;
  /** Callback fired when qualifier type is saved */
  onSave: (qualifierType: QualifierTypes.Config.IAnyQualifierTypeConfig) => void;
  /** Callback fired when editing is cancelled */
  onCancel: () => void;
  /** Names of existing qualifier types to prevent duplicates */
  existingNames?: string[];
}

interface FormData {
  name: string;
  systemType: string;
  configuration: string; // JSON string
}

interface ValidationErrors {
  name?: string;
  systemType?: string;
  configuration?: string;
}

/**
 * Form component for editing custom qualifier types with JSON configuration.
 * Provides a generic editor for qualifier types that don't use the built-in system types.
 *
 * @public
 */
export const GenericQualifierTypeEditForm: React.FC<GenericQualifierTypeEditFormProps> = ({
  qualifierType,
  onSave,
  onCancel,
  existingNames = []
}) => {
  const [formData, setFormData] = useState<FormData>(() => {
    if (qualifierType) {
      return {
        name: qualifierType.name,
        systemType: qualifierType.systemType as string,
        configuration: JSON.stringify(qualifierType.configuration || {}, null, 2)
      };
    }
    return {
      name: '',
      systemType: '',
      configuration: JSON.stringify({}, null, 2)
    };
  });

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isJsonValid, setIsJsonValid] = useState(true);
  const [configValidation, setConfigValidation] = useState<Result<any> | null>(null);

  // Validate JSON configuration on every change
  useEffect(() => {
    try {
      const parsed = JSON.parse(formData.configuration);
      setIsJsonValid(true);

      // Attempt to validate the configuration structure if we have both name and systemType
      if (formData.name && formData.systemType) {
        try {
          const testConfig: QualifierTypes.Config.IAnyQualifierTypeConfig = {
            name: formData.name,
            systemType: formData.systemType,
            configuration: parsed as JsonObject
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

  const validateForm = useCallback((): boolean => {
    const newErrors: ValidationErrors = {};

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

  const handleSave = useCallback(() => {
    if (!validateForm()) {
      return;
    }

    try {
      const configuration = JSON.parse(formData.configuration) as JsonObject;
      const newQualifierType: QualifierTypes.Config.IAnyQualifierTypeConfig = {
        name: formData.name.trim(),
        systemType: formData.systemType.trim() as string,
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

  const handleInputChange = useCallback(
    (field: keyof FormData, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      // Clear error when user starts typing
      if (errors[field as keyof ValidationErrors]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    },
    [errors]
  );

  const formatJson = useCallback(() => {
    try {
      const parsed = JSON.parse(formData.configuration);
      const formatted = JSON.stringify(parsed, null, 2);
      setFormData((prev) => ({ ...prev, configuration: formatted }));
    } catch (error) {
      // If JSON is invalid, don't format
    }
  }, [formData.configuration]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {qualifierType ? 'Edit Custom Qualifier Type' : 'Add Custom Qualifier Type'}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Configure a custom qualifier type with JSON configuration
            </p>
          </div>
          <button
            onClick={onCancel}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-6">
          {/* Name Field */}
          <div>
            <label htmlFor="qualifierTypeName" className="block text-sm font-medium text-gray-700 mb-2">
              Name
            </label>
            <input
              id="qualifierTypeName"
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="Enter qualifier type name (e.g., 'custom-dimension')"
            />
            {errors.name && (
              <div className="mt-1 flex items-center text-sm text-red-600">
                <ExclamationTriangleIcon className="w-4 h-4 mr-1 flex-shrink-0" />
                {errors.name}
              </div>
            )}
          </div>

          {/* System Type Field */}
          <div>
            <label htmlFor="systemType" className="block text-sm font-medium text-gray-700 mb-2">
              System Type
            </label>
            <input
              id="systemType"
              type="text"
              value={formData.systemType}
              onChange={(e) => handleInputChange('systemType', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.systemType ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="Enter system type (e.g., 'custom', 'dimension')"
            />
            {errors.systemType && (
              <div className="mt-1 flex items-center text-sm text-red-600">
                <ExclamationTriangleIcon className="w-4 h-4 mr-1 flex-shrink-0" />
                {errors.systemType}
              </div>
            )}
          </div>

          {/* Configuration JSON Field */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="configuration" className="block text-sm font-medium text-gray-700">
                Configuration (JSON)
              </label>
              <button
                type="button"
                onClick={formatJson}
                disabled={!isJsonValid}
                className="text-xs text-blue-600 hover:text-blue-800 disabled:text-gray-400"
              >
                Format JSON
              </button>
            </div>
            <textarea
              id="configuration"
              rows={12}
              value={formData.configuration}
              onChange={(e) => handleInputChange('configuration', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm ${
                errors.configuration ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder='{"property": "value"}'
            />
            {errors.configuration && (
              <div className="mt-1 flex items-center text-sm text-red-600">
                <ExclamationTriangleIcon className="w-4 h-4 mr-1 flex-shrink-0" />
                {errors.configuration}
              </div>
            )}
            {isJsonValid && (
              <div className="mt-1 flex items-center text-sm text-green-600">
                <InformationCircleIcon className="w-4 h-4 mr-1 flex-shrink-0" />
                Valid JSON configuration
              </div>
            )}
          </div>

          {/* Help Text */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <InformationCircleIcon className="w-5 h-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-700">
                <p className="font-medium mb-1">Custom Qualifier Types</p>
                <p>
                  Custom qualifier types allow you to extend the system with your own validation logic. The
                  configuration object can contain any valid JSON and will be passed to your custom qualifier
                  type implementation.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!isJsonValid || Object.keys(errors).length > 0}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {qualifierType ? 'Update' : 'Create'} Qualifier Type
          </button>
        </div>
      </div>
    </div>
  );
};
