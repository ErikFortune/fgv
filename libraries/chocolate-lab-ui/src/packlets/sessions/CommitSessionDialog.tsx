/*
 * Copyright (c) 2026 Erik Fortune
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/**
 * Commit session dialog — shows save analysis and confirms journal commit.
 * @packageDocumentation
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { UserLibrary } from '@fgv/ts-chocolate';

// ============================================================================
// Props
// ============================================================================

/**
 * Props for the CommitSessionDialog component.
 * @public
 */
export interface ICommitSessionDialogProps {
  /** Whether the dialog is open */
  readonly isOpen: boolean;
  /** The editing session to commit */
  readonly session: UserLibrary.Session.EditingSession;
  /** Called when the user confirms the commit */
  readonly onCommit: () => Promise<void>;
  /** Called when the user cancels */
  readonly onCancel: () => void;
}

// ============================================================================
// Save Analysis Display
// ============================================================================

function SaveAnalysisSection({
  analysis
}: {
  readonly analysis: UserLibrary.Session.ISaveAnalysis;
}): React.ReactElement {
  const { changes } = analysis;

  const hasChanges =
    changes.ingredientsAdded ||
    changes.ingredientsRemoved ||
    changes.ingredientsChanged ||
    changes.procedureChanged ||
    changes.weightChanged ||
    changes.notesChanged;

  return (
    <div className="mt-4 space-y-3">
      {/* Change summary */}
      <div>
        <h4 className="text-xs font-medium text-gray-700 uppercase tracking-wider mb-1.5">
          Changes detected
        </h4>
        {hasChanges ? (
          <ul className="text-sm text-gray-600 space-y-0.5">
            {changes.ingredientsAdded && <li className="flex items-center gap-1.5">+ Ingredients added</li>}
            {changes.ingredientsRemoved && (
              <li className="flex items-center gap-1.5">- Ingredients removed</li>
            )}
            {changes.ingredientsChanged && (
              <li className="flex items-center gap-1.5">~ Ingredients modified</li>
            )}
            {changes.procedureChanged && <li className="flex items-center gap-1.5">~ Procedure changed</li>}
            {changes.weightChanged && <li className="flex items-center gap-1.5">~ Base weight changed</li>}
            {changes.notesChanged && <li className="flex items-center gap-1.5">~ Notes changed</li>}
          </ul>
        ) : (
          <p className="text-sm text-gray-500 italic">No changes from original recipe</p>
        )}
      </div>

      {/* Save options analysis (informational only) */}
      {hasChanges && (
        <div>
          <h4 className="text-xs font-medium text-gray-700 uppercase tracking-wider mb-1.5">
            Save options (informational)
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {analysis.canCreateVariation && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                Could save as new variation
              </span>
            )}
            {analysis.canAddAlternatives && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                Could add as alternatives
              </span>
            )}
            {analysis.mustCreateNew && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                Would require new recipe
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-gray-400">
            Recipe save is not yet implemented. Only the journal entry will be created.
          </p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Component
// ============================================================================

/**
 * Dialog for committing a filling session to the journal.
 *
 * Shows the save analysis (what changed, what save options would be available)
 * and a "Commit to Journal" button. Currently journal-only — recipe save
 * options are shown as informational badges.
 *
 * @public
 */
export function CommitSessionDialog({
  isOpen,
  session,
  onCommit,
  onCancel
}: ICommitSessionDialogProps): React.ReactElement | null {
  const [isCommitting, setIsCommitting] = useState(false);

  const analysis = useMemo(() => session.analyzeSaveOptions(), [session]);

  const handleCommit = useCallback(async (): Promise<void> => {
    setIsCommitting(true);
    try {
      await onCommit();
    } finally {
      setIsCommitting(false);
    }
  }, [onCommit]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent): void => {
      if (e.key === 'Escape' && !isCommitting) {
        onCancel();
      }
    },
    [onCancel, isCommitting]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return (): void => document.removeEventListener('keydown', handleKeyDown);
    }
    return undefined;
  }, [isOpen, handleKeyDown]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={isCommitting ? undefined : onCancel}
        role="presentation"
      />

      {/* Dialog */}
      <div
        className="relative bg-white rounded-lg shadow-xl max-w-lg w-full mx-4"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="commit-dialog-title"
      >
        <div className="p-6">
          <h3 id="commit-dialog-title" className="text-base font-semibold text-gray-900 leading-6">
            Commit Session to Journal
          </h3>
          <p className="mt-2 text-sm text-gray-600">
            This will create a journal entry with a full recipe snapshot and mark the session as committed.
          </p>

          <SaveAnalysisSection analysis={analysis} />

          {/* Buttons */}
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={isCommitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCommit}
              disabled={isCommitting}
              className="px-4 py-2 text-sm font-medium text-white bg-choco-primary rounded-md hover:bg-choco-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-choco-primary transition-colors disabled:opacity-50"
            >
              {isCommitting ? 'Committing...' : 'Commit to Journal'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
