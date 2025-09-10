import React, { useState, useCallback, useEffect } from 'react';
import { XMarkIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import {
  MaxConditionPriority,
  MinConditionPriority,
  Qualifiers,
  QualifierTypes,
  Validate
} from '@fgv/ts-res';
import { Converters } from '@fgv/ts-utils';
import { useObservability } from '../../contexts';

/**
 * Props for the QualifierEditForm component.
 *
 * @public
 */
export interface IQualifierEditFormProps {
  /** Existing qualifier to edit (undefined for creating new qualifier) */
  qualifier?: Qualifiers.IQualifierDecl;
  /** Available qualifier types for selection */
  qualifierTypes: QualifierTypes.Config.IAnyQualifierTypeConfig[];
  /** Callback fired when qualifier is saved */
  onSave: (qualifier: Qualifiers.IQualifierDecl) => void;
  /** Callback fired when editing is cancelled */
  onCancel: () => void;
  /** Names of existing qualifiers to prevent duplicates */
  existingNames?: string[];
}

interface IFormData {
  name: string;
  typeName: string;
  defaultPriority: number | '';
  token: string;
  tokenIsOptional: boolean;
  defaultValue: string;
}

/**
 * Modal form component for creating and editing qualifiers in a ts-res system configuration.
 *
 * The QualifierEditForm provides a comprehensive interface for defining qualifiers that control
 * resource resolution behavior. It includes validation, type-specific configuration options,
 * and automatic token generation for streamlined qualifier creation.
 *
 * @example
 * ```tsx
 * import { ConfigurationTools } from '@fgv/ts-res-ui-components';
 *
 * // Creating a new language qualifier
 * const qualifierTypes = [
 *   { name: 'language', systemType: 'language' },
 *   { name: 'region', systemType: 'territory' }
 * ];
 *
 * const [showForm, setShowForm] = useState(false);
 * const [qualifiers, setQualifiers] = useState([]);
 *
 * const handleSave = (qualifier) => {
 *   setQualifiers(prev => [...prev, qualifier]);
 *   setShowForm(false);
 * };
 *
 * {showForm && (
 *   <ConfigurationTools.QualifierEditForm
 *     qualifierTypes={qualifierTypes}
 *     onSave={handleSave}
 *     onCancel={() => setShowForm(false)}
 *     existingNames={qualifiers.map(q => q.name)}
 *   />
 * )}
 * ```
 *
 * @example
 * ```tsx
 * // Editing an existing qualifier with validation
 * const existingQualifier = {
 *   name: 'language',
 *   typeName: 'language',
 *   defaultPriority: 100,
 *   token: 'lang',
 *   tokenIsOptional: false,
 *   defaultValue: 'en-US'
 * };
 *
 * <ConfigurationTools.QualifierEditForm
 *   qualifier={existingQualifier}
 *   qualifierTypes={availableTypes}
 *   onSave={updateQualifier}
 *   onCancel={closeEditor}
 *   existingNames={otherQualifierNames}
 * />
 * ```
 *
 * @example
 * ```tsx
 * // Advanced qualifier configuration with enum values
 * const platformType = {
 *   name: 'platform',
 *   systemType: 'literal',
 *   configuration: {
 *     caseSensitive: false,
 *     enumeratedValues: ['web', 'mobile', 'desktop'],
 *     allowContextList: true
 *   }
 * };
 *
 * const platformQualifier = {
 *   name: 'platform',
 *   typeName: 'platform',
 *   defaultPriority: 80,
 *   token: 'plat',
 *   defaultValue: 'web,mobile' // Multiple values supported
 * };
 *
 * <ConfigurationTools.QualifierEditForm
 *   qualifier={platformQualifier}
 *   qualifierTypes={[platformType]}
 *   onSave={handlePlatformSave}
 *   onCancel={cancelEdit}
 * />
 * ```
 *
 * @public
 */
export const QualifierEditForm: React.FC<IQualifierEditFormProps> = ({
  qualifier,
  qualifierTypes,
  onSave,
  onCancel,
  existingNames = []
}) => {
  const o11y = useObservability();
  const [formData, setFormData] = useState<IFormData>(() => {
    if (qualifier) {
      return {
        name: qualifier.name,
        typeName: qualifier.typeName,
        defaultPriority: qualifier.defaultPriority,
        token: qualifier.token ?? '',
        tokenIsOptional: qualifier.tokenIsOptional ?? false,
        defaultValue: qualifier.defaultValue ?? ''
      };
    }
    return {
      name: '',
      typeName: qualifierTypes[0]?.name ?? '',
      defaultPriority: 50,
      token: '',
      tokenIsOptional: false,
      defaultValue: ''
    };
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isFormValid, setIsFormValid] = useState<boolean>(false);

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
    } else if (!Validate.isValidQualifierName(formData.name)) {
      newErrors.name = `${formData.name}: Invalid qualifier name`;
    }

    if (!formData.typeName) {
      newErrors.typeName = 'Qualifier type is required';
    }

    const priority = formData.defaultPriority === '' ? 0 : formData.defaultPriority;
    if (priority < MinConditionPriority || priority > MaxConditionPriority) {
      newErrors.defaultPriority = `${priority}: Priority must be between ${MinConditionPriority} and ${MaxConditionPriority}`;
    }

    if (formData.token && !Validate.isValidQualifierName(formData.token)) {
      newErrors.token = `${formData.token}: invalid qualifier token`;
    }

    setErrors(newErrors);

    const hasErrors = Object.keys(newErrors).length > 0;
    const isValid = !hasErrors;

    setIsFormValid(isValid);

    if (hasErrors) {
      const qualifierName = formData.name.trim() ?? 'unknown-qualifier';
      const errorList = Object.entries(newErrors)
        .map(([field, error]) => `${field}: ${error}`)
        .join(', ');
      o11y.diag.info(`${qualifierName}: Qualifier validation failed - ${errorList}`);
    }

    return isValid;
  }, [formData, existingNames, qualifier?.name, o11y]);

  const handleSave = useCallback(() => {
    const qualifierName = formData.name.trim() ?? 'unknown-qualifier';

    if (!validateForm()) {
      o11y.user.warn(`${qualifierName}: Cannot save - validation errors present`);
      return;
    }

    const result: Qualifiers.IQualifierDecl = {
      name: formData.name,
      typeName: formData.typeName,
      defaultPriority: formData.defaultPriority === '' ? 0 : formData.defaultPriority,
      ...(formData.token && { token: formData.token }),
      ...(formData.token && formData.tokenIsOptional && { tokenIsOptional: true }),
      ...(formData.defaultValue && { defaultValue: formData.defaultValue })
    };

    o11y.diag.info(`${qualifierName}: Saving qualifier - ${JSON.stringify(result)}`);
    onSave(result);
    o11y.user.success(`${qualifierName}: Qualifier ${qualifier ? 'updated' : 'created'} successfully`);
  }, [formData, validateForm, onSave, qualifier, o11y]);

  const updateField = useCallback(
    (field: keyof IFormData, value: IFormData[keyof IFormData]) => {
      setFormData((prev) => {
        const updated = { ...prev, [field]: value };

        // Auto-generate token from name if no custom token is set
        if (field === 'name' && !prev.token) {
          const generatedToken = String(value)
            .toLowerCase()
            .replace(/[^a-zA-Z0-9]/g, '');
          updated.token = generatedToken;

          if (generatedToken) {
            o11y.user.info(`${String(value)}: Token auto-generated as '${generatedToken}'`);
          }
        }

        // Clear tokenIsOptional if token is cleared
        if (field === 'token' && !value) {
          updated.tokenIsOptional = false;
          o11y.diag.info(
            `${prev.name ?? 'unknown-qualifier'}: Token cleared, tokenIsOptional reset to false`
          );
        }

        return updated;
      });

      // Log type selection changes
      if (field === 'typeName' && value !== formData.typeName) {
        const qualifierName = formData.name.trim() ?? 'unknown-qualifier';
        const newType = qualifierTypes.find((qt) => qt.name === value);
        if (newType) {
          o11y.user.info(`${qualifierName}: Qualifier type changed to '${value}' (${newType.systemType})`);

          // Log type capabilities
          const allowsContextList = (() => {
            if (!newType.configuration) return false;
            const result = Converters.boolean.convert(
              (newType.configuration as Record<string, unknown>).allowContextList
            );
            return result.isSuccess() ? result.value : false;
          })();

          if (allowsContextList) {
            o11y.diag.info(`${qualifierName}: New type '${value}' supports context lists`);
          }
        }
      }

      if (errors[field]) {
        setErrors((prev) => {
          const updated = { ...prev };
          delete updated[field];
          return updated;
        });
      }
    },
    [errors, formData.name, formData.typeName, qualifierTypes, o11y]
  );

  // Trigger validation when form data changes
  useEffect(() => {
    validateForm();
  }, [formData, validateForm]); // Run whenever formData changes

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
                onChange={(e) => {
                  const value = e.target.value;
                  // Allow empty string for better UX when clearing field
                  if (value === '') {
                    updateField('defaultPriority', '');
                  } else {
                    const parsed = parseInt(value, 10);
                    if (!isNaN(parsed)) {
                      updateField('defaultPriority', parsed);
                    }
                  }
                }}
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
            disabled={!isFormValid}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {qualifier ? 'Save Changes' : 'Add Qualifier'}
          </button>
        </div>
      </div>
    </div>
  );
};
