import React, { useState, useCallback } from 'react';
import { XMarkIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { Qualifiers, QualifierTypes } from '@fgv/ts-res';
import { Converters } from '@fgv/ts-utils';

export interface QualifierEditFormProps {
  qualifier?: Qualifiers.IQualifierDecl;
  qualifierTypes: QualifierTypes.Config.ISystemQualifierTypeConfig[];
  onSave: (qualifier: Qualifiers.IQualifierDecl) => void;
  onCancel: () => void;
  existingNames?: string[];
}

interface FormData {
  name: string;
  typeName: string;
  defaultPriority: number;
  token: string;
  tokenIsOptional: boolean;
  defaultValue: string;
}

/** @public */
export const QualifierEditForm: React.FC<QualifierEditFormProps> = ({
  qualifier,
  qualifierTypes,
  onSave,
  onCancel,
  existingNames = []
}) => {
  const [formData, setFormData] = useState<FormData>(() => {
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
      typeName: qualifierTypes[0]?.name || '',
      defaultPriority: 50,
      token: '',
      tokenIsOptional: false,
      defaultValue: ''
    };
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Get the selected qualifier type for context
  const selectedQualifierType = qualifierTypes.find((qt) => qt.name === formData.typeName);

  // Type-safe extraction of allowContextList property
  const allowsContextList = (() => {
    if (!selectedQualifierType?.configuration) return false;
    const result = Converters.boolean.convert(
      (selectedQualifierType.configuration as Record<string, unknown>).allowContextList
    );
    return result.isSuccess() ? result.value : false;
  })();

  // Validation
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (existingNames.includes(formData.name) && formData.name !== qualifier?.name) {
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
  }, [formData, existingNames, qualifier?.name]);

  const handleSave = useCallback(() => {
    if (!validateForm()) return;

    const result: Qualifiers.IQualifierDecl = {
      name: formData.name,
      typeName: formData.typeName,
      defaultPriority: formData.defaultPriority,
      ...(formData.token && { token: formData.token }),
      ...(formData.token && formData.tokenIsOptional && { tokenIsOptional: true }),
      ...(formData.defaultValue && { defaultValue: formData.defaultValue })
    };

    onSave(result);
  }, [formData, validateForm, onSave]);

  const updateField = useCallback(
    (field: keyof FormData, value: FormData[keyof FormData]) => {
      setFormData((prev) => {
        const updated = { ...prev, [field]: value };

        // Auto-generate token from name if no custom token is set
        if (field === 'name' && !prev.token) {
          updated.token = String(value)
            .toLowerCase()
            .replace(/[^a-zA-Z0-9]/g, '');
        }

        // Clear tokenIsOptional if token is cleared
        if (field === 'token' && !value) {
          updated.tokenIsOptional = false;
        }

        return updated;
      });

      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: '' }));
      }
    },
    [errors]
  );

  const getDefaultValuePlaceholder = (): string => {
    if (!selectedQualifierType) return 'Enter default value';

    switch (selectedQualifierType.systemType) {
      case 'language':
        return allowsContextList ? 'e.g., en-US or en-US,en' : 'e.g., en-US';
      case 'territory':
        return allowsContextList ? 'e.g., US or US,CA' : 'e.g., US';
      case 'literal':
        // Type-safe extraction of enumeratedValues
        const enumValues = (() => {
          if (!selectedQualifierType.configuration) return undefined;
          const result = Converters.arrayOf(Converters.string).convert(
            (selectedQualifierType.configuration as Record<string, unknown>).enumeratedValues
          );
          return result.isSuccess() ? result.value : undefined;
        })();
        if (enumValues && enumValues.length > 0) {
          return allowsContextList
            ? `e.g., ${enumValues[0]} or ${enumValues.slice(0, 2).join(',')}`
            : `e.g., ${enumValues[0]}`;
        }
        return allowsContextList ? 'e.g., value or value1,value2' : 'e.g., value';
      default:
        return 'Enter default value';
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full h-full max-h-[calc(100vh-2rem)] flex flex-col">
        {/* Fixed Header */}
        <div className="flex items-center justify-between p-6 border-b flex-shrink-0">
          <h3 className="text-lg font-medium text-gray-900">
            {qualifier ? 'Edit Qualifier' : 'Add Qualifier'}
          </h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 min-h-0">
          {/* Basic Properties */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter qualifier name"
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Qualifier Type *</label>
              <select
                value={formData.typeName}
                onChange={(e) => updateField('typeName', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                  errors.typeName ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                {qualifierTypes.length === 0 ? (
                  <option value="">No qualifier types available</option>
                ) : (
                  qualifierTypes.map((type) => (
                    <option key={type.name} value={type.name}>
                      {type.name} ({type.systemType})
                    </option>
                  ))
                )}
              </select>
              {errors.typeName && <p className="mt-1 text-sm text-red-600">{errors.typeName}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Default Priority *</label>
              <input
                type="number"
                min="0"
                max="1000"
                value={formData.defaultPriority}
                onChange={(e) => updateField('defaultPriority', parseInt(e.target.value) || 0)}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                  errors.defaultPriority ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="50"
              />
              {errors.defaultPriority && (
                <p className="mt-1 text-sm text-red-600">{errors.defaultPriority}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">Higher numbers have higher priority (0-1000)</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Token
                <span className="ml-1 text-gray-500">(optional)</span>
              </label>
              <input
                type="text"
                value={formData.token}
                onChange={(e) => updateField('token', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                  errors.token ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="e.g., lang, locale"
              />
              {errors.token && <p className="mt-1 text-sm text-red-600">{errors.token}</p>}
              <p className="mt-1 text-xs text-gray-500">Used to identify this qualifier in resource names</p>
            </div>
          </div>

          {/* Token Options */}
          {formData.token && (
            <div className="flex items-center">
              <input
                type="checkbox"
                id="tokenIsOptional"
                checked={formData.tokenIsOptional}
                onChange={(e) => updateField('tokenIsOptional', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="tokenIsOptional" className="ml-2 text-sm text-gray-700">
                Token is optional in resource names
              </label>
              <div className="ml-2 group relative">
                <InformationCircleIcon className="w-4 h-4 text-gray-400" />
                <div className="absolute left-0 bottom-6 hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-10">
                  Allow resources without this qualifier token
                </div>
              </div>
            </div>
          )}

          {/* Default Value */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Default Value
              <span className="ml-1 text-gray-500">(optional)</span>
            </label>
            <input
              type="text"
              value={formData.defaultValue}
              onChange={(e) => updateField('defaultValue', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder={getDefaultValuePlaceholder()}
            />
            <div className="mt-1 text-xs text-gray-500">
              {selectedQualifierType && (
                <div>
                  <p>
                    Qualifier type: <span className="font-medium">{selectedQualifierType.systemType}</span>
                  </p>
                  {allowsContextList && (
                    <p className="text-blue-600">
                      This qualifier type supports multiple values (comma-separated)
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Qualifier Type Information */}
          {selectedQualifierType && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Qualifier Type Information</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p>
                  <span className="font-medium">System Type:</span> {selectedQualifierType.systemType}
                </p>
                <p>
                  <span className="font-medium">Supports Context List:</span>{' '}
                  {allowsContextList ? 'Yes' : 'No'}
                </p>
                {selectedQualifierType.systemType === 'literal' && selectedQualifierType.configuration && (
                  <React.Fragment>
                    {(selectedQualifierType.configuration as Record<string, unknown>).caseSensitive !==
                      undefined && (
                      <p>
                        <span className="font-medium">Case Sensitive:</span>{' '}
                        {((selectedQualifierType.configuration as Record<string, unknown>)
                          .caseSensitive as boolean)
                          ? 'Yes'
                          : 'No'}
                      </p>
                    )}
                    {((selectedQualifierType.configuration as Record<string, unknown>).enumeratedValues as
                      | string[]
                      | undefined) && (
                      <p>
                        <span className="font-medium">Allowed Values:</span>{' '}
                        {(
                          (selectedQualifierType.configuration as Record<string, unknown>)
                            .enumeratedValues as string[]
                        ).join(', ')}
                      </p>
                    )}
                  </React.Fragment>
                )}
                {selectedQualifierType.systemType === 'territory' && selectedQualifierType.configuration && (
                  <React.Fragment>
                    {(selectedQualifierType.configuration as Record<string, unknown>).acceptLowercase !==
                      undefined && (
                      <p>
                        <span className="font-medium">Accept Lowercase:</span>{' '}
                        {((selectedQualifierType.configuration as Record<string, unknown>)
                          .acceptLowercase as boolean)
                          ? 'Yes'
                          : 'No'}
                      </p>
                    )}
                    {((selectedQualifierType.configuration as Record<string, unknown>).allowedTerritories as
                      | string[]
                      | undefined) && (
                      <p>
                        <span className="font-medium">Allowed Territories:</span>{' '}
                        {(
                          (selectedQualifierType.configuration as Record<string, unknown>)
                            .allowedTerritories as string[]
                        ).join(', ')}
                      </p>
                    )}
                  </React.Fragment>
                )}
              </div>
            </div>
          )}
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
            {qualifier ? 'Save Changes' : 'Add Qualifier'}
          </button>
        </div>
      </div>
    </div>
  );
};
