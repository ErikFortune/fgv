import React from 'react';
import { ExclamationTriangleIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface PendingResourceControlsProps {
  pendingAddCount: number;
  pendingDeleteCount: number;
  onApply: () => void;
  onDiscard: () => void;
  disabled?: boolean;
  className?: string;
}

/**
 * Control panel for managing pending resource additions and deletions.
 * Shows counts of pending changes and provides apply/discard actions.
 */
export const PendingResourceControls: React.FC<PendingResourceControlsProps> = ({
  pendingAddCount,
  pendingDeleteCount,
  onApply,
  onDiscard,
  disabled = false,
  className = ''
}) => {
  const totalChanges = pendingAddCount + pendingDeleteCount;
  const hasChanges = totalChanges > 0;

  if (!hasChanges) return null;

  return (
    <div className={`bg-yellow-50 border border-yellow-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />
          <div className="text-sm text-yellow-800">
            <span className="font-semibold">Pending Resource Changes:</span>
            {pendingAddCount > 0 && (
              <span className="ml-2">
                {pendingAddCount} addition{pendingAddCount !== 1 ? 's' : ''}
              </span>
            )}
            {pendingAddCount > 0 && pendingDeleteCount > 0 && <span className="ml-1">•</span>}
            {pendingDeleteCount > 0 && (
              <span className="ml-2">
                {pendingDeleteCount} deletion{pendingDeleteCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onDiscard}
            disabled={disabled}
            className={`flex items-center space-x-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              disabled
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-yellow-500'
            }`}
            title="Discard all pending resource changes"
          >
            <XMarkIcon className="h-4 w-4" />
            <span>Discard</span>
          </button>
          <button
            onClick={onApply}
            disabled={disabled}
            className={`flex items-center space-x-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              disabled
                ? 'bg-gray-400 text-white cursor-not-allowed'
                : 'bg-yellow-600 text-white hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500'
            }`}
            title="Apply all pending resource changes"
          >
            <CheckIcon className="h-4 w-4" />
            <span>Apply Resources</span>
          </button>
        </div>
      </div>

      {/* Optional: Show list of pending changes */}
      {false && ( // Set to true to show detailed list
        <div className="mt-3 pt-3 border-t border-yellow-200">
          <div className="text-xs text-yellow-700">
            {/* TODO: Show list of pending additions and deletions */}
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingResourceControls;
