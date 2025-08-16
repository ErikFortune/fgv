import React, { useState } from 'react';
import {
  CheckIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

export interface ResolutionEditControlsProps {
  /** Number of unsaved edits */
  editCount: number;
  /** Whether edit application is currently in progress */
  isApplying: boolean;
  /** Whether any edits exist to operate on */
  hasEdits: boolean;
  /** Callback to apply all pending edits */
  onApplyEdits?: () => Promise<void>;
  /** Callback to discard all pending edits */
  onDiscardEdits?: () => void;
  /** Whether the controls should be disabled */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/** @public */
export const ResolutionEditControls: React.FC<ResolutionEditControlsProps> = ({
  editCount,
  isApplying,
  hasEdits,
  onApplyEdits,
  onDiscardEdits,
  disabled = false,
  className = ''
}) => {
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  const handleApplyEdits = async () => {
    if (onApplyEdits && !isApplying && hasEdits) {
      await onApplyEdits();
    }
  };

  const handleDiscardEdits = () => {
    if (onDiscardEdits && hasEdits && !isApplying) {
      onDiscardEdits();
      setShowDiscardConfirm(false);
    }
  };

  const handleDiscardClick = () => {
    if (hasEdits) {
      setShowDiscardConfirm(true);
    }
  };

  if (!hasEdits && !isApplying) {
    return (
      <div className={`bg-gray-50 rounded-lg border border-gray-200 p-4 ${className}`}>
        <div className="flex items-center justify-center text-gray-500">
          <DocumentTextIcon className="h-5 w-5 mr-2" />
          <span className="text-sm">No pending edits</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-semibold text-gray-900">Pending Edits</h3>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {editCount} edit{editCount !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {isApplying && (
            <div className="flex items-center text-blue-600">
              <ArrowPathIcon className="h-4 w-4 mr-1 animate-spin" />
              <span className="text-sm font-medium">Applying...</span>
            </div>
          )}
        </div>

        {/* Info text */}
        <p className="text-sm text-gray-600 mb-4">
          You have {editCount} unsaved edit{editCount !== 1 ? 's' : ''}.{' '}
          {editCount === 1 ? 'This edit' : 'These edits'} will be applied as new candidate
          {editCount !== 1 ? 's' : ''} with the current resolution context.
        </p>

        {/* Action buttons */}
        {!showDiscardConfirm ? (
          <div className="flex items-center space-x-3">
            <button
              onClick={handleApplyEdits}
              disabled={disabled || isApplying || !hasEdits}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isApplying ? (
                <>
                  <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                  Applying Edits...
                </>
              ) : (
                <>
                  <CheckIcon className="h-4 w-4 mr-2" />
                  Apply Edits
                </>
              )}
            </button>

            <button
              onClick={handleDiscardClick}
              disabled={disabled || isApplying || !hasEdits}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <XMarkIcon className="h-4 w-4 mr-2" />
              Discard Edits
            </button>
          </div>
        ) : (
          /* Discard confirmation */
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mt-0.5 mr-3" />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-yellow-800 mb-1">Confirm Discard</h4>
                <p className="text-sm text-yellow-700 mb-3">
                  Are you sure you want to discard {editCount} unsaved edit{editCount !== 1 ? 's' : ''}? This
                  action cannot be undone.
                </p>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleDiscardEdits}
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-red-600 border border-transparent rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    <XMarkIcon className="h-4 w-4 mr-1" />
                    Yes, Discard
                  </button>
                  <button
                    onClick={() => setShowDiscardConfirm(false)}
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Warning about system rebuild */}
      {hasEdits && !showDiscardConfirm && (
        <div className="border-t border-gray-200 px-4 py-3 bg-blue-50">
          <p className="text-xs text-blue-700">
            <strong>Note:</strong> Applying edits will rebuild the entire resource system with your changes.
            This may take a moment and will update all resolution results.
          </p>
        </div>
      )}
    </div>
  );
};
