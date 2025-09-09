import React, { useState, useCallback, useEffect } from 'react';
import { XMarkIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { QualifierTypes } from '@fgv/ts-res';
import { HierarchyEditor } from './HierarchyEditor';

/**
 * Props for the QualifierTypeEditForm component.
 *
 * @public
 */
export interface IQualifierTypeEditFormProps {
  /** Existing qualifier type to edit (undefined for creating new type) */
  qualifierType?: QualifierTypes.Config.ISystemQualifierTypeConfig;
  /** Callback fired when qualifier type is saved */
  onSave: (qualifierType: QualifierTypes.Config.ISystemQualifierTypeConfig) => void;
  /** Callback fired when editing is cancelled */
  onCancel: () => void;
  /** Names of existing qualifier types to prevent duplicates */
  existingNames?: string[];
}

interface IFormData {
  name: string;
  systemType: 'language' | 'territory' | 'literal';
  allowContextList: boolean;
  // Literal type specific
  caseSensitive: boolean;
  enumeratedValues: string[];
  // Territory type specific
  acceptLowercase: boolean;
  allowedTerritories: string[];
  // Hierarchy support (for literal and territory types)
  hierarchy: Record<string, string>;
}

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
export const QualifierTypeEditForm: React.FC<IQualifierTypeEditFormProps> = ({
  qualifierType,
  onSave,
  onCancel,
  existingNames = []
}) => {
  const [formData, setFormData] = useState<IFormData>(() => {
    if (qualifierType) {
      const config = qualifierType.configuration || {};
      // Ensure hierarchy is a plain object with string values
      const hierarchy: Record<string, string> = {};
      const rawHierarchy = (config as Record<string, unknown>)?.hierarchy;
      if (rawHierarchy && typeof rawHierarchy === 'object' && !Array.isArray(rawHierarchy)) {
        for (const [key, value] of Object.entries(rawHierarchy)) {
          if (typeof value === 'string') {
            hierarchy[key] = value;
          }
        }
      }

      return {
        name: qualifierType.name,
        systemType: qualifierType.systemType as 'language' | 'territory' | 'literal',
        allowContextList: ((config as Record<string, unknown>)?.allowContextList as boolean) ?? false,
        caseSensitive: ((config as Record<string, unknown>)?.caseSensitive as boolean) ?? true,
        enumeratedValues: ((config as Record<string, unknown>)?.enumeratedValues as string[]) || [],
        acceptLowercase: ((config as Record<string, unknown>)?.acceptLowercase as boolean) ?? false,
        allowedTerritories: ((config as Record<string, unknown>)?.allowedTerritories as string[]) || [],
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

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [enumeratedValuesText, setEnumeratedValuesText] = useState(formData.enumeratedValues.join(', '));
  const [allowedTerritoriesText, setAllowedTerritoriesText] = useState(
    formData.allowedTerritories.join(', ')
  );

  // Validation
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

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
  useEffect(() => {
    const values = enumeratedValuesText
      .split(',')
      .map((v) => v.trim())
      .filter((v) => v.length > 0);
    setFormData((prev) => ({ ...prev, enumeratedValues: values }));
  }, [enumeratedValuesText]);

  // Update allowed territories when text changes
  useEffect(() => {
    const territories = allowedTerritoriesText
      .split(',')
      .map((v) => v.trim().toUpperCase())
      .filter((v) => v.length > 0);
    setFormData((prev) => ({ ...prev, allowedTerritories: territories }));
  }, [allowedTerritoriesText]);

  const handleSave = useCallback(() => {
    if (!validateForm()) return;

    let configuration: Record<string, unknown> = {
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

    const result: QualifierTypes.Config.ISystemQualifierTypeConfig = {
      name: formData.name,
      systemType: formData.systemType,
      configuration: Object.keys(configuration).length > 1 ? configuration : undefined
    };

    onSave(result);
  }, [formData, validateForm, onSave]);

  const updateField = useCallback(
    (field: keyof IFormData, value: IFormData[keyof IFormData]) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: '' }));
      }
    },
    [errors]
  );

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full h-full max-h-[calc(100vh-2rem)] flex flex-col">
        {/* Fixed Header */}
        <div className="flex items-center justify-between p-6 border-b flex-shrink-0">
          <h3 className="text-lg font-medium text-gray-900">
            {qualifierType ? 'Edit Qualifier Type' : 'Add Qualifier Type'}
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
                placeholder="Enter qualifier type name"
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">System Type *</label>
              <select
                value={formData.systemType}
                onChange={(e) =>
                  updateField('systemType', e.target.value as 'language' | 'territory' | 'literal')
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="literal">Literal</option>
                <option value="language">Language</option>
                <option value="territory">Territory</option>
              </select>
            </div>
          </div>

          {/* Allow Context List */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="allowContextList"
              checked={formData.allowContextList}
              onChange={(e) => updateField('allowContextList', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="allowContextList" className="ml-2 text-sm text-gray-700">
              Allow Context List
            </label>
            <div className="ml-2 group relative">
              <InformationCircleIcon className="w-4 h-4 text-gray-400" />
              <div className="absolute left-0 bottom-6 hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                Allow multiple values separated by commas
              </div>
            </div>
          </div>

          {/* Literal Type Specific */}
          {formData.systemType === 'literal' && (
            <div className="space-y-4 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-gray-900">Literal Type Configuration</h4>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="caseSensitive"
                  checked={formData.caseSensitive}
                  onChange={(e) => updateField('caseSensitive', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="caseSensitive" className="ml-2 text-sm text-gray-700">
                  Case Sensitive
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Enumerated Values</label>
                <textarea
                  value={enumeratedValuesText}
                  onChange={(e) => setEnumeratedValuesText(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                    errors.enumeratedValues ? 'border-red-300' : 'border-gray-300'
                  }`}
                  rows={3}
                  placeholder="Enter values separated by commas (e.g., dev, test, prod)"
                />
                {errors.enumeratedValues && (
                  <p className="mt-1 text-sm text-red-600">{errors.enumeratedValues}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">Separate multiple values with commas</p>
              </div>
            </div>
          )}

          {/* Territory Type Specific */}
          {formData.systemType === 'territory' && (
            <div className="space-y-4 p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium text-gray-900">Territory Type Configuration</h4>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="acceptLowercase"
                  checked={formData.acceptLowercase}
                  onChange={(e) => updateField('acceptLowercase', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="acceptLowercase" className="ml-2 text-sm text-gray-700">
                  Accept Lowercase Territory Codes
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Allowed Territories</label>
                <textarea
                  value={allowedTerritoriesText}
                  onChange={(e) => setAllowedTerritoriesText(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  rows={3}
                  placeholder="Enter territory codes separated by commas (e.g., US, CA, GB)"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Separate multiple territory codes with commas. Will be automatically converted to uppercase.
                </p>
              </div>
            </div>
          )}

          {/* Hierarchy Editor for Literal and Territory Types */}
          {(formData.systemType === 'literal' || formData.systemType === 'territory') && (
            <div className="space-y-4">
              <HierarchyEditor
                hierarchy={formData.hierarchy}
                onChange={(hierarchy) => updateField('hierarchy', hierarchy)}
                availableValues={
                  formData.systemType === 'literal' ? formData.enumeratedValues : formData.allowedTerritories
                }
              />
            </div>
          )}

          {/* Language Type Specific */}
          {formData.systemType === 'language' && (
            <div className="p-4 bg-yellow-50 rounded-lg">
              <h4 className="font-medium text-gray-900">Language Type Configuration</h4>
              <p className="text-sm text-gray-600 mt-2">
                Language qualifier types use BCP47 language tags and only support the "Allow Context List"
                option above.
              </p>
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
            {qualifierType ? 'Save Changes' : 'Add Qualifier Type'}
          </button>
        </div>
      </div>
    </div>
  );
};
