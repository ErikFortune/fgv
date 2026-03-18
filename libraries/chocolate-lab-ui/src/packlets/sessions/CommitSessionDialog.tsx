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
 * Commit session dialog — shows save analysis, allows recipe save option
 * selection, and confirms journal commit.
 * @packageDocumentation
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { UserLibrary } from '@fgv/ts-chocolate';

// ============================================================================
// Types
// ============================================================================

/**
 * Recipe save option selected during commit.
 * @public
 */
export type RecipeSaveOption = 'journal-only' | 'new-variation' | 'alternatives';

/**
 * Minimal interface for sessions that can be committed to the journal.
 * Both filling and confection editing sessions satisfy this contract.
 * @public
 */
export interface ICommittableSession {
  readonly sessionType: 'filling' | 'confection';
  analyzeSaveOptions(): UserLibrary.Session.ISaveAnalysis;
}

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
  readonly session: ICommittableSession;
  /** Called when the user confirms the commit with a save option */
  readonly onCommit: (saveOption: RecipeSaveOption) => Promise<void>;
  /** Called when the user cancels */
  readonly onCancel: () => void;
}

// ============================================================================
// Save Analysis Display
// ============================================================================

function SaveAnalysisSection({
  analysis,
  saveOption,
  onSaveOptionChange
}: {
  readonly analysis: UserLibrary.Session.ISaveAnalysis;
  readonly saveOption: RecipeSaveOption;
  readonly onSaveOptionChange: (option: RecipeSaveOption) => void;
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
        <h4 className="text-xs font-medium text-secondary uppercase tracking-wider mb-1.5">
          Changes detected
        </h4>
        {hasChanges ? (
          <ul className="text-sm text-secondary space-y-0.5">
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
          <p className="text-sm text-muted italic">No changes from original recipe</p>
        )}
      </div>

      {/* Save options — selectable when changes exist */}
      {hasChanges && (
        <div>
          <h4 className="text-xs font-medium text-secondary uppercase tracking-wider mb-1.5">
            Recipe save option
          </h4>
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-sm text-secondary cursor-pointer">
              <input
                type="radio"
                name="save-option"
                value="journal-only"
                checked={saveOption === 'journal-only'}
                onChange={(): void => onSaveOptionChange('journal-only')}
                className="text-brand-primary focus:ring-focus-ring"
              />
              Journal only (no recipe changes)
            </label>

            {analysis.canCreateVariation && (
              <label className="flex items-center gap-2 text-sm text-secondary cursor-pointer">
                <input
                  type="radio"
                  name="save-option"
                  value="new-variation"
                  checked={saveOption === 'new-variation'}
                  onChange={(): void => onSaveOptionChange('new-variation')}
                  className="text-brand-primary focus:ring-focus-ring"
                />
                Save as new variation
              </label>
            )}

            {analysis.canAddAlternatives && (
              <label className="flex items-center gap-2 text-sm text-secondary cursor-pointer">
                <input
                  type="radio"
                  name="save-option"
                  value="alternatives"
                  checked={saveOption === 'alternatives'}
                  onChange={(): void => onSaveOptionChange('alternatives')}
                  className="text-brand-primary focus:ring-focus-ring"
                />
                Add ingredients as alternatives
              </label>
            )}

            {analysis.mustCreateNew && (
              <p className="text-xs text-status-warning-strong ml-6">
                More extensive changes would require creating a new recipe (not yet supported from commit).
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Component
// ============================================================================

/**
 * Dialog for committing a filling session to the journal with optional recipe save.
 *
 * Shows the save analysis (what changed, what save options are available)
 * and lets the user choose whether to also save recipe changes.
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
  const [saveOption, setSaveOption] = useState<RecipeSaveOption>('journal-only');

  const analysis = useMemo(() => session.analyzeSaveOptions(), [session]);

  // Reset save option when dialog opens
  useEffect(() => {
    if (isOpen) {
      setSaveOption('journal-only');
    }
  }, [isOpen]);

  const handleCommit = useCallback(async (): Promise<void> => {
    setIsCommitting(true);
    try {
      await onCommit(saveOption);
    } finally {
      setIsCommitting(false);
    }
  }, [onCommit, saveOption]);

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

  const commitLabel =
    saveOption === 'journal-only'
      ? 'Commit to Journal'
      : saveOption === 'new-variation'
      ? 'Save Variation & Commit'
      : 'Add Alternatives & Commit';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-backdrop"
        onClick={isCommitting ? undefined : onCancel}
        role="presentation"
      />

      {/* Dialog */}
      <div
        className="relative bg-surface rounded-lg shadow-xl max-w-lg w-full mx-4"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="commit-dialog-title"
      >
        <div className="p-6">
          <h3 id="commit-dialog-title" className="text-base font-semibold text-primary leading-6">
            Commit {session.sessionType === 'confection' ? 'Confection' : 'Filling'} Session to Journal
          </h3>
          <p className="mt-2 text-sm text-secondary">
            This will create a journal entry with a full recipe snapshot and mark the session as committed.
          </p>

          <SaveAnalysisSection
            analysis={analysis}
            saveOption={saveOption}
            onSaveOptionChange={setSaveOption}
          />

          {/* Buttons */}
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={isCommitting}
              className="px-4 py-2 text-sm font-medium text-secondary bg-surface border border-border rounded-md hover:bg-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-border transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCommit}
              disabled={isCommitting}
              className="px-4 py-2 text-sm font-medium text-inverted bg-brand-primary rounded-md hover:bg-brand-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-focus-ring transition-colors disabled:opacity-50"
            >
              {isCommitting ? 'Committing...' : commitLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
