import React, { useState, useCallback, useMemo } from 'react';
import { PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { ResourceEditorProps } from '@fgv/ts-res-ui-components';

interface MarketInfo {
  marketName: string;
  availablePaymentMethods: string[];
  supportedLanguages: string[];
  regulatoryCompliance: string;
  marketingBudget: string;
  customerSupportHours: string;
  selectedBy: string;
}

export const MarketInfoEditor: React.FC<ResourceEditorProps> = ({
  value,
  resourceId,
  isEdited = false,
  editedValue,
  onSave,
  onCancel,
  disabled = false,
  className = ''
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<MarketInfo | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // The display value is either the edited value or the original value
  const displayValue = useMemo(() => {
    if (isEdited && editedValue !== undefined) {
      return editedValue;
    }
    return value;
  }, [value, editedValue, isEdited]);

  // Validate that the value is a proper MarketInfo object
  const isValidMarketInfo = useCallback((data: any): data is MarketInfo => {
    return (
      data &&
      typeof data === 'object' &&
      typeof data.marketName === 'string' &&
      Array.isArray(data.availablePaymentMethods) &&
      Array.isArray(data.supportedLanguages) &&
      typeof data.regulatoryCompliance === 'string' &&
      typeof data.marketingBudget === 'string' &&
      typeof data.customerSupportHours === 'string' &&
      typeof data.selectedBy === 'string'
    );
  }, []);

  // Handle starting an edit
  const handleStartEdit = useCallback(() => {
    if (disabled || !isValidMarketInfo(displayValue)) return;
    setFormData({ ...displayValue });
    setIsEditing(true);
    setValidationErrors([]);
  }, [disabled, displayValue, isValidMarketInfo]);

  // Handle canceling an edit
  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
    setFormData(null);
    setValidationErrors([]);
    onCancel?.(resourceId);
  }, [onCancel, resourceId]);

  // Validate form data
  const validateFormData = useCallback((data: MarketInfo): string[] => {
    const errors: string[] = [];

    if (!data.marketName.trim()) {
      errors.push('Market name is required');
    }

    if (data.availablePaymentMethods.length === 0) {
      errors.push('At least one payment method is required');
    }

    if (data.supportedLanguages.length === 0) {
      errors.push('At least one supported language is required');
    }

    if (!data.regulatoryCompliance.trim()) {
      errors.push('Regulatory compliance is required');
    }

    if (!data.marketingBudget.trim()) {
      errors.push('Marketing budget is required');
    }

    if (!data.customerSupportHours.trim()) {
      errors.push('Customer support hours is required');
    }

    return errors;
  }, []);

  // Handle saving an edit
  const handleSaveEdit = useCallback(() => {
    if (!formData) return;

    const errors = validateFormData(formData);
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors([]);
    setIsEditing(false);
    onSave?.(resourceId, formData, displayValue);
    setFormData(null);
  }, [formData, validateFormData, onSave, resourceId, displayValue]);

  // Handle form field changes
  const handleFieldChange = useCallback(
    (field: keyof MarketInfo, value: string | string[]) => {
      if (!formData) return;
      setFormData({ ...formData, [field]: value });
    },
    [formData]
  );

  // Handle array field changes (for payment methods and languages)
  const handleArrayFieldChange = useCallback(
    (field: 'availablePaymentMethods' | 'supportedLanguages', value: string) => {
      if (!formData) return;
      const currentArray = formData[field];
      const newArray = value
        .split(',')
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
      setFormData({ ...formData, [field]: newArray });
    },
    [formData]
  );

  if (!isValidMarketInfo(displayValue)) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <h4 className="font-medium text-red-800 mb-2">Invalid Market Info Data</h4>
        <p className="text-sm text-red-600">
          This resource does not contain valid market information data. Expected structure with marketName,
          availablePaymentMethods, supportedLanguages, regulatoryCompliance, marketingBudget,
          customerSupportHours, and selectedBy fields.
        </p>
        <details className="mt-2">
          <summary className="text-xs text-red-500 cursor-pointer">Raw Data</summary>
          <pre className="text-xs text-red-600 mt-1 bg-red-100 p-2 rounded overflow-x-auto">
            {JSON.stringify(displayValue, null, 2)}
          </pre>
        </details>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-medium text-gray-900">
          Market Information Editor
          {isEdited && <span className="ml-2 text-xs text-orange-600 font-normal">(Modified)</span>}
        </h4>

        {!isEditing ? (
          <button
            onClick={handleStartEdit}
            disabled={disabled}
            className={`inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              disabled
                ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                : 'text-blue-700 bg-blue-100 hover:bg-blue-200'
            }`}
          >
            <PencilIcon className="h-4 w-4 mr-1" />
            Edit
          </button>
        ) : (
          <div className="flex space-x-2">
            <button
              onClick={handleCancelEdit}
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              <XMarkIcon className="h-4 w-4 mr-1" />
              Cancel
            </button>
            <button
              onClick={handleSaveEdit}
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <CheckIcon className="h-4 w-4 mr-1" />
              Save
            </button>
          </div>
        )}
      </div>

      {validationErrors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <h5 className="font-medium text-red-800 mb-2">Validation Errors:</h5>
          <ul className="text-sm text-red-600 list-disc list-inside">
            {validationErrors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {isEditing && formData ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Market Name</label>
            <input
              type="text"
              value={formData.marketName}
              onChange={(e) => handleFieldChange('marketName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 🌍 GLOBAL (DEFAULT)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Available Payment Methods</label>
            <input
              type="text"
              value={formData.availablePaymentMethods.join(', ')}
              onChange={(e) => handleArrayFieldChange('availablePaymentMethods', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 💳 credit-card, 💳 debit-card, 🏦 ach"
            />
            <p className="text-xs text-gray-500 mt-1">Separate multiple methods with commas</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Supported Languages</label>
            <input
              type="text"
              value={formData.supportedLanguages.join(', ')}
              onChange={(e) => handleArrayFieldChange('supportedLanguages', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 🇺🇸 en, 🇪🇸 es, 🇫🇷 fr"
            />
            <p className="text-xs text-gray-500 mt-1">Separate multiple languages with commas</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Regulatory Compliance</label>
            <input
              type="text"
              value={formData.regulatoryCompliance}
              onChange={(e) => handleFieldChange('regulatoryCompliance', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 📋 EU GDPR compliance"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Marketing Budget</label>
            <input
              type="text"
              value={formData.marketingBudget}
              onChange={(e) => handleFieldChange('marketingBudget', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 💰 European regional"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Customer Support Hours</label>
            <input
              type="text"
              value={formData.customerSupportHours}
              onChange={(e) => handleFieldChange('customerSupportHours', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 🕐 EU business hours"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Selected By</label>
            <input
              type="text"
              value={formData.selectedBy}
              onChange={(e) => handleFieldChange('selectedBy', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., MARKET: Europe selected"
            />
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-sm font-medium text-gray-600">Market Name:</span>
              <p className="text-sm mt-1">{displayValue.marketName}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">Regulatory Compliance:</span>
              <p className="text-sm mt-1">{displayValue.regulatoryCompliance}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">Marketing Budget:</span>
              <p className="text-sm mt-1">{displayValue.marketingBudget}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">Support Hours:</span>
              <p className="text-sm mt-1">{displayValue.customerSupportHours}</p>
            </div>
          </div>

          <div>
            <span className="text-sm font-medium text-gray-600">Payment Methods:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {displayValue.availablePaymentMethods.map((method, index) => (
                <span
                  key={index}
                  className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                >
                  {method}
                </span>
              ))}
            </div>
          </div>

          <div>
            <span className="text-sm font-medium text-gray-600">Supported Languages:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {displayValue.supportedLanguages.map((language, index) => (
                <span
                  key={index}
                  className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded"
                >
                  {language}
                </span>
              ))}
            </div>
          </div>

          <div>
            <span className="text-sm font-medium text-gray-600">Selected By:</span>
            <p className="text-sm mt-1 italic text-gray-500">{displayValue.selectedBy}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketInfoEditor;
