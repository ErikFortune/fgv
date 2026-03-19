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
 * Dialog for renaming a collection to a new ID.
 *
 * Shows the current collection ID, a text input for the new ID, and
 * a warning about cross-entity references that will be updated.
 *
 * @packageDocumentation
 */

import React, { useCallback, useMemo, useState } from 'react';
import { Modal } from '@fgv/ts-app-shell';

// ============================================================================
// Types
// ============================================================================

/**
 * Props for CollectionRenameDialog.
 * @public
 */
export interface ICollectionRenameDialogProps {
  /** Whether the dialog is open */
  readonly isOpen: boolean;
  /** The current collection ID being renamed */
  readonly collectionId: string;
  /** Number of cross-entity references that will be updated */
  readonly referenceCount: number;
  /** Collection IDs that already exist (used for validation) */
  readonly existingIds: ReadonlyArray<string>;
  /** Called with the new collection ID when the user confirms */
  readonly onConfirm: (newCollectionId: string) => void;
  /** Called when the user cancels */
  readonly onCancel: () => void;
}

// ============================================================================
// Validation
// ============================================================================

const COLLECTION_ID_PATTERN: RegExp = /^[a-z0-9][a-z0-9_-]*$/;

function validateCollectionId(
  newId: string,
  currentId: string,
  existingIds: ReadonlyArray<string>
): string | undefined {
  const trimmed = newId.trim();
  if (trimmed === '') {
    return 'Collection ID cannot be empty';
  }
  if (trimmed === currentId) {
    return 'New ID must be different from the current ID';
  }
  if (!COLLECTION_ID_PATTERN.test(trimmed)) {
    return 'ID must be lowercase letters, numbers, hyphens, and underscores (must start with letter or number)';
  }
  if (existingIds.includes(trimmed)) {
    return `Collection "${trimmed}" already exists`;
  }
  return undefined;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Modal dialog for renaming a collection.
 *
 * Validates the new ID and warns about references that will be updated.
 *
 * @public
 */
export function CollectionRenameDialog({
  isOpen,
  collectionId,
  referenceCount,
  existingIds,
  onConfirm,
  onCancel
}: ICollectionRenameDialogProps): React.ReactElement {
  const [newId, setNewId] = useState(collectionId);

  const validationError = useMemo(
    () => validateCollectionId(newId, collectionId, existingIds),
    [newId, collectionId, existingIds]
  );

  const handleConfirm = useCallback((): void => {
    const trimmed = newId.trim();
    if (trimmed && !validationError) {
      onConfirm(trimmed);
    }
  }, [newId, validationError, onConfirm]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent): void => {
      if (e.key === 'Enter' && !validationError) {
        handleConfirm();
      }
    },
    [handleConfirm, validationError]
  );

  return (
    <Modal isOpen={isOpen} onClose={onCancel} title="Rename Collection">
      <div className="space-y-4">
        <p className="text-sm text-secondary">
          Rename collection <strong className="font-mono">{collectionId}</strong> to a new ID.
        </p>

        {/* New ID input */}
        <div className="space-y-1.5">
          <label htmlFor="rename-collection-id" className="text-xs font-medium text-secondary">
            New collection ID
          </label>
          <input
            id="rename-collection-id"
            type="text"
            value={newId}
            onChange={(e): void => setNewId(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full px-3 py-1.5 text-sm font-mono border border-border rounded focus:outline-none focus:ring-1 focus:ring-focus-ring"
            placeholder="new-collection-id"
            autoFocus
          />
          {validationError && <p className="text-xs text-status-error-icon">{validationError}</p>}
        </div>

        {/* Reference warning */}
        {referenceCount > 0 && (
          <p className="text-xs text-status-warning-strong bg-status-warning-bg border border-status-warning-border rounded px-3 py-2">
            {referenceCount} cross-entity reference{referenceCount !== 1 ? 's' : ''} to items in this
            collection will be updated automatically.
          </p>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 text-sm text-secondary hover:text-primary hover:bg-hover rounded transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!!validationError}
            className="px-4 py-1.5 text-sm font-medium text-inverted bg-brand-primary hover:bg-brand-primary/90 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Rename
          </button>
        </div>
      </div>
    </Modal>
  );
}
