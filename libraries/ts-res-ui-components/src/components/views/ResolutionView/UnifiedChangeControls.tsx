import React, { useState } from 'react';
import { CheckIcon, XMarkIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

/**
 * Unified control bar that summarizes all pending changes (edits, additions, deletions)
 * and provides a single Apply/Discard action.
 *
 * Renders chips for the counts of pending edits, additions, and deletions. The Apply button
 * should commit all pending changes atomically (via a system rebuild), and Discard clears all
 * pending change buffers. This replaces older separate controls for edits and resource creation.
 *
 * @public
 */
interface IUnifiedChangeControlsProps {
  /** Number of pending edits to existing resources */
  editCount: number;
  /** Number of pending new resources to be added */
  addCount: number;
  /** Number of resources marked for deletion */
  deleteCount: number;
  /** Whether an apply operation is in progress (shows spinner and disables buttons) */
  isApplying?: boolean;
  /** Disable all actions (e.g., when no resolver/context is active) */
  disabled?: boolean;
  /** Optional CSS class names to attach to the container */
  className?: string;
  /** Apply all pending changes in one step (typically triggers rebuild) */
  onApplyAll: () => Promise<void> | void;
  /** Discard all pending changes (edits, additions, deletions) */
  onDiscardAll: () => void;
}

/**
 * Unified change controls for ResolutionView.
 *
 * @example
 * ```tsx
 * <UnifiedChangeControls
 *   editCount={state.editedResources.size}
 *   addCount={state.pendingResources.size}
 *   deleteCount={state.pendingResourceDeletions.size}
 *   isApplying={state.isApplyingEdits}
 *   disabled={!state.currentResolver}
 *   onApplyAll={actions.applyPendingResources}
 *   onDiscardAll={() => {
 *     actions.discardEdits();
 *     actions.discardPendingResources();
 *   }}
 * />
 * ```
 *
 * @public
 */
export const UnifiedChangeControls: React.FC<IUnifiedChangeControlsProps> = ({
  editCount,
  addCount,
  deleteCount,
  isApplying = false,
  disabled = false,
  className = '',
  onApplyAll,
  onDiscardAll
}) => {
  const totalChanges = editCount + addCount + deleteCount;
  const hasChanges = totalChanges > 0;
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  if (!hasChanges && !isApplying) {
    return null;
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-semibold text-gray-900">Pending Changes</h3>
            {editCount > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                {editCount} edit{editCount !== 1 ? 's' : ''}
              </span>
            )}
            {addCount > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                {addCount} addition{addCount !== 1 ? 's' : ''}
              </span>
            )}
            {deleteCount > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                {deleteCount} deletion{deleteCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {isApplying && (
            <div className="flex items-center text-blue-600">
              <ArrowPathIcon className="h-4 w-4 mr-1 animate-spin" />
              <span className="text-sm font-medium">Applying...</span>
            </div>
          )}
        </div>

        {!confirmDiscard ? (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onApplyAll()}
              disabled={disabled || isApplying || !hasChanges}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Apply all pending changes"
            >
              {isApplying ? (
                <>
                  <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                  Applying...
                </>
              ) : (
                <>
                  <CheckIcon className="h-4 w-4 mr-2" />
                  Apply Changes
                </>
              )}
            </button>

            <button
              onClick={() => setConfirmDiscard(true)}
              disabled={disabled || isApplying || !hasChanges}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Discard all pending changes"
            >
              <XMarkIcon className="h-4 w-4 mr-2" />
              Discard Changes
            </button>
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="text-sm text-yellow-800 mb-2">
              Discard all pending changes? This cannot be undone.
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  onDiscardAll();
                  setConfirmDiscard(false);
                }}
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-red-600 border border-transparent rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <XMarkIcon className="h-4 w-4 mr-1" /> Yes, Discard
              </button>
              <button
                onClick={() => setConfirmDiscard(false)}
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UnifiedChangeControls;
