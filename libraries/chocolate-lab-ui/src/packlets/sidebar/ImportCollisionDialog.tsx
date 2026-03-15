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
 * Dialog shown when an imported collection ID collides with an existing one.
 * Offers Skip, Overwrite, or Rename options.
 *
 * @packageDocumentation
 */

import React, { useCallback, useState } from 'react';
import { Modal } from '@fgv/ts-app-shell';

// ============================================================================
// Types
// ============================================================================

/**
 * The user's chosen resolution for a collection ID collision.
 * @public
 */
export type ImportCollisionResolution = 'skip' | 'overwrite' | { rename: string };

/**
 * Props for ImportCollisionDialog.
 * @public
 */
export interface IImportCollisionDialogProps {
  /** Whether the dialog is open */
  readonly isOpen: boolean;
  /** The collection ID that collided */
  readonly collectionId: string;
  /** Number of items in the incoming collection */
  readonly itemCount: number;
  /** Called with the user's resolution choice */
  readonly onResolve: (resolution: ImportCollisionResolution) => void;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Modal dialog for resolving a collection ID collision during import.
 *
 * Offers three options:
 * - **Skip** — discard the incoming collection
 * - **Overwrite** — replace the existing collection with the incoming one
 * - **Rename** — import the incoming collection under a new ID
 *
 * @public
 */
export function ImportCollisionDialog({
  isOpen,
  collectionId,
  itemCount,
  onResolve
}: IImportCollisionDialogProps): React.ReactElement {
  const [newId, setNewId] = useState(() => `${collectionId}-imported`);
  const [tab, setTab] = useState<'skip' | 'overwrite' | 'rename'>('rename');

  const handleConfirm = useCallback((): void => {
    if (tab === 'skip') {
      onResolve('skip');
    } else if (tab === 'overwrite') {
      onResolve('overwrite');
    } else {
      const trimmed = newId.trim();
      if (trimmed) {
        onResolve({ rename: trimmed });
      }
    }
  }, [tab, newId, onResolve]);

  const handleSkip = useCallback((): void => onResolve('skip'), [onResolve]);

  const tabClass = (t: typeof tab): string =>
    `px-3 py-1.5 text-sm font-medium rounded transition-colors ${
      tab === t ? 'bg-choco-primary text-white' : 'text-gray-600 hover:text-choco-primary hover:bg-gray-100'
    }`;

  return (
    <Modal isOpen={isOpen} onClose={handleSkip} title="Collection ID Already Exists">
      <div className="space-y-4">
        <p className="text-sm text-gray-700">
          A collection named <strong>{collectionId}</strong> ({itemCount} item
          {itemCount !== 1 ? 's' : ''}) already exists. How would you like to handle the import?
        </p>

        {/* Option tabs */}
        <div className="flex gap-2">
          <button type="button" className={tabClass('rename')} onClick={(): void => setTab('rename')}>
            Rename
          </button>
          <button type="button" className={tabClass('overwrite')} onClick={(): void => setTab('overwrite')}>
            Overwrite
          </button>
          <button type="button" className={tabClass('skip')} onClick={(): void => setTab('skip')}>
            Skip
          </button>
        </div>

        {/* Option details */}
        {tab === 'rename' && (
          <div className="space-y-2">
            <p className="text-xs text-gray-500">Import the collection under a different ID.</p>
            <input
              type="text"
              value={newId}
              onChange={(e): void => setNewId(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-choco-primary"
              placeholder="New collection ID"
              autoFocus
            />
          </div>
        )}

        {tab === 'overwrite' && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
            The existing <strong>{collectionId}</strong> collection will be replaced with the imported data.
            This cannot be undone.
          </p>
        )}

        {tab === 'skip' && (
          <p className="text-xs text-gray-500">The incoming collection will be discarded.</p>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={handleSkip}
            className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={tab === 'rename' && !newId.trim()}
            className="px-4 py-1.5 text-sm font-medium text-white bg-choco-primary hover:bg-choco-primary/90 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {tab === 'skip' ? 'Skip' : tab === 'overwrite' ? 'Overwrite' : 'Import as Renamed'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
