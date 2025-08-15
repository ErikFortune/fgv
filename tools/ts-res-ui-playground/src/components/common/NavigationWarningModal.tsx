import React from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface NavigationWarningModalProps {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  onSave?: () => void;
  hasUnsavedChanges: boolean;
}

const NavigationWarningModal: React.FC<NavigationWarningModalProps> = ({
  isOpen,
  onCancel,
  onConfirm,
  onSave,
  hasUnsavedChanges
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        <div className="flex items-center space-x-3 mb-4">
          <ExclamationTriangleIcon className="h-6 w-6 text-amber-500" />
          <h3 className="text-lg font-medium text-gray-900">Unsaved Changes</h3>
        </div>

        <p className="text-sm text-gray-600 mb-6">
          You have unsaved configuration changes. What would you like to do?
        </p>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Discard Changes
          </button>

          {onSave && (
            <button
              onClick={onSave}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Save & Continue
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default NavigationWarningModal;
