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
 * Dialog for merging one collection into another.
 *
 * Lets the user pick a target collection, choose a conflict strategy,
 * and shows warnings about item conflicts and cross-entity references.
 *
 * @packageDocumentation
 */

import React, { useCallback, useMemo, useState } from 'react';
import { Modal } from '@fgv/ts-app-shell';
import type { Editing } from '@fgv/ts-chocolate';

// ============================================================================
// Types
// ============================================================================

/**
 * A mutable collection available as a merge target.
 * @public
 */
export interface IMergeTargetOption {
  /** Collection ID */
  readonly id: string;
  /** Display name (from metadata), or the ID if no name */
  readonly displayName: string;
  /** Number of items in this collection */
  readonly itemCount: number;
}

/**
 * Props for CollectionMergeDialog.
 * @public
 */
export interface ICollectionMergeDialogProps {
  /** Whether the dialog is open */
  readonly isOpen: boolean;
  /** The source collection being merged (will be deleted) */
  readonly sourceCollectionId: string;
  /** Number of items in the source collection */
  readonly sourceItemCount: number;
  /** Available target collections to merge into */
  readonly targetOptions: ReadonlyArray<IMergeTargetOption>;
  /** Number of cross-entity references to source collection items */
  readonly referenceCount: number;
  /**
   * Callback to get the number of conflicting item IDs for a given target.
   * Called when the user selects a target collection.
   */
  readonly getConflictCount: (targetCollectionId: string) => number;
  /** Called with merge parameters when the user confirms */
  readonly onConfirm: (targetCollectionId: string, strategy: Editing.MergeConflictStrategy) => void;
  /** Called when the user cancels */
  readonly onCancel: () => void;
}

// ============================================================================
// Component
// ============================================================================

const STRATEGY_LABELS: Record<Editing.MergeConflictStrategy, { label: string; description: string }> = {
  skip: {
    label: 'Skip duplicates',
    description: "Keep the target collection's version of conflicting items"
  },
  overwrite: {
    label: 'Overwrite',
    description: "Replace the target's version with the source's version"
  },
  rename: {
    label: 'Auto-rename',
    description: 'Import conflicting items with a "-merged" suffix'
  }
};

/**
 * Modal dialog for merging a collection into another.
 *
 * @public
 */
export function CollectionMergeDialog({
  isOpen,
  sourceCollectionId,
  sourceItemCount,
  targetOptions,
  referenceCount,
  getConflictCount,
  onConfirm,
  onCancel
}: ICollectionMergeDialogProps): React.ReactElement {
  const [targetId, setTargetId] = useState<string>(targetOptions[0]?.id ?? '');
  const [strategy, setStrategy] = useState<Editing.MergeConflictStrategy>('skip');

  const conflictCount = useMemo(
    () => (targetId ? getConflictCount(targetId) : 0),
    [targetId, getConflictCount]
  );

  const handleConfirm = useCallback((): void => {
    if (targetId) {
      onConfirm(targetId, strategy);
    }
  }, [targetId, strategy, onConfirm]);

  const hasTargets = targetOptions.length > 0;

  return (
    <Modal isOpen={isOpen} onClose={onCancel} title="Merge Collection">
      <div className="space-y-4">
        <p className="text-sm text-secondary">
          Merge all {sourceItemCount} item{sourceItemCount !== 1 ? 's' : ''} from{' '}
          <strong className="font-mono">{sourceCollectionId}</strong> into another collection. The source
          collection will be deleted after merging.
        </p>

        {/* Target collection picker */}
        {hasTargets ? (
          <div className="space-y-1.5">
            <label htmlFor="merge-target" className="text-xs font-medium text-secondary">
              Merge into
            </label>
            <select
              id="merge-target"
              value={targetId}
              onChange={(e): void => setTargetId(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-border rounded focus:outline-none focus:ring-1 focus:ring-focus-ring bg-surface"
            >
              {targetOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.displayName} ({opt.itemCount} item{opt.itemCount !== 1 ? 's' : ''})
                </option>
              ))}
            </select>
          </div>
        ) : (
          <p className="text-xs text-status-error-icon">
            No other mutable collections available as a merge target.
          </p>
        )}

        {/* Conflict strategy */}
        {conflictCount > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-status-warning-strong">
              {conflictCount} item ID{conflictCount !== 1 ? 's' : ''} conflict{conflictCount === 1 ? 's' : ''}{' '}
              with existing items in the target collection.
            </p>
            <div className="space-y-1">
              {(
                Object.entries(STRATEGY_LABELS) as Array<
                  [Editing.MergeConflictStrategy, { label: string; description: string }]
                >
              ).map(([key, { label, description }]) => (
                <label
                  key={key}
                  className="flex items-start gap-2 text-xs cursor-pointer px-2 py-1 rounded hover:bg-hover"
                >
                  <input
                    type="radio"
                    name="merge-strategy"
                    value={key}
                    checked={strategy === key}
                    onChange={(): void => setStrategy(key)}
                    className="mt-0.5"
                  />
                  <span>
                    <span className="font-medium">{label}</span>
                    <span className="text-muted"> — {description}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Reference warning */}
        {referenceCount > 0 && (
          <p className="text-xs text-status-warning-strong bg-status-warning-bg border border-status-warning-border rounded px-3 py-2">
            {referenceCount} cross-entity reference{referenceCount !== 1 ? 's' : ''} to items in the source
            collection will be updated to point to the target collection.
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
            disabled={!hasTargets || !targetId}
            className="px-4 py-1.5 text-sm font-medium text-inverted bg-brand-primary hover:bg-brand-primary/90 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Merge
          </button>
        </div>
      </div>
    </Modal>
  );
}
