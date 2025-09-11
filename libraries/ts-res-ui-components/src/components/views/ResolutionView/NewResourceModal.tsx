import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { ResourceTypes } from '@fgv/ts-res';

interface INewResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  resourceId: string;
  resourceType: string;
  availableResourceTypes: ResourceTypes.IResourceType[];
  isValid: boolean;
  defaultResourceType?: string;
  onUpdateResourceId: (id: string) => void;
  onSelectResourceType: (type: string) => void;
  onSave: () => void;
}

/**
 * Modal dialog for creating new resources with type selection and ID input.
 * Supports host-controlled resource types that hide the type selector.
 */
export const NewResourceModal: React.FC<INewResourceModalProps> = ({
  isOpen,
  onClose,
  resourceId,
  resourceType,
  availableResourceTypes,
  isValid,
  defaultResourceType,
  onUpdateResourceId,
  onSelectResourceType,
  onSave
}) => {
  const [localResourceId, setLocalResourceId] = useState(resourceId);

  useEffect(() => {
    setLocalResourceId(resourceId);
  }, [resourceId]);

  if (!isOpen) return null;

  const handleIdChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const newId = e.target.value;
    setLocalResourceId(newId);
    onUpdateResourceId(newId);
  };

  const handleSave = (): void => {
    if (isValid) {
      onSave();
      onClose();
    }
  };

  const showTypeSelector = !defaultResourceType;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        <div className="relative transform overflow-hidden rounded-lg bg-white shadow-xl transition-all sm:w-full sm:max-w-lg">
          <div className="bg-white px-6 pb-4 pt-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Create New Resource</h3>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-500 focus:outline-none">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Resource ID Input */}
              <div>
                <label htmlFor="resource-id" className="block text-sm font-medium text-gray-700 mb-1">
                  Resource ID <span className="text-red-500">*</span>
                </label>
                <input
                  id="resource-id"
                  type="text"
                  value={localResourceId}
                  onChange={handleIdChange}
                  placeholder="Enter unique resource ID"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                    isValid ? 'border-gray-300 focus:ring-blue-500' : 'border-red-300 focus:ring-red-500'
                  }`}
                />
                {!isValid && localResourceId && (
                  <p className="mt-1 text-sm text-red-600">Resource ID must be unique and non-empty</p>
                )}
              </div>

              {/* Resource Type Selector */}
              {showTypeSelector ? (
                <div>
                  <label htmlFor="resource-type" className="block text-sm font-medium text-gray-700 mb-1">
                    Resource Type
                  </label>
                  <select
                    id="resource-type"
                    value={resourceType}
                    onChange={(e) => onSelectResourceType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {availableResourceTypes.map((type) => (
                      <option key={type.key} value={type.key}>
                        {type.key}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Resource Type</label>
                  <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-700">
                    {defaultResourceType}
                    <span className="text-xs text-gray-500 ml-2">(Host-controlled)</span>
                  </div>
                </div>
              )}

              {/* Template Preview */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Template Preview</label>
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                  <pre className="text-xs text-gray-600 overflow-x-auto">
                    {JSON.stringify({ id: localResourceId, type: resourceType }, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 px-6 py-3 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!isValid}
              className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 ${
                isValid
                  ? 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              Add as Pending
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewResourceModal;
