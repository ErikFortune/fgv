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
 * Edit form for a mold inventory entry.
 * @packageDocumentation
 */

import React, { useCallback, useState } from 'react';

import type { Entities, Model as CommonModel, UserLibrary } from '@fgv/ts-chocolate';

type IMoldInventoryEntryEntity = Entities.Inventory.IMoldInventoryEntryEntity;

import { NotesEditor } from '../editing';

// ============================================================================
// Props
// ============================================================================

/**
 * Props for the MoldInventoryEntryEditView component.
 * @public
 */
export interface IMoldInventoryEntryEditViewProps {
  /** The materialized mold inventory entry being edited */
  readonly entry: UserLibrary.IMoldInventoryEntry;
  /** Called with the updated entity when the user saves */
  readonly onSave: (entity: IMoldInventoryEntryEntity) => void;
  /** Called when the user cancels editing */
  readonly onCancel: () => void;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Edit form for a mold inventory entry.
 *
 * Allows editing count, location, and notes. The mold reference is read-only
 * (to change which mold, delete and re-create the entry).
 *
 * @public
 */
export function MoldInventoryEntryEditView(props: IMoldInventoryEntryEditViewProps): React.ReactElement {
  const { entry, onSave, onCancel } = props;
  const mold = entry.item;

  const [count, setCount] = useState(entry.quantity);
  const [location, setLocation] = useState(entry.location ?? '');
  const [notes, setNotes] = useState<ReadonlyArray<CommonModel.ICategorizedNote> | undefined>(entry.notes);

  const handleSave = useCallback((): void => {
    const entity: IMoldInventoryEntryEntity = {
      inventoryType: 'mold',
      moldId: entry.entity.moldId,
      count: Math.max(0, count),
      ...(location.trim() ? { location: location.trim() } : {}),
      ...(notes && notes.length > 0 ? { notes } : {})
    };
    onSave(entity);
  }, [entry, count, location, notes, onSave]);

  return (
    <div className="p-4 overflow-y-auto h-full">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">{mold.displayName}</h2>
        <p className="text-xs text-gray-400 font-mono mt-0.5">{entry.id}</p>
      </div>

      {/* Mold (read-only) */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Mold</label>
        <div className="px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-md text-gray-600">
          {mold.displayName}
          <span className="ml-2 text-xs text-gray-400">{mold.format}</span>
        </div>
      </div>

      {/* Count */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Count</label>
        <input
          type="number"
          min={0}
          value={count}
          onChange={(e): void => setCount(parseInt(e.target.value, 10) || 0)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-choco-primary focus:border-choco-primary"
        />
      </div>

      {/* Location */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
        <input
          type="text"
          value={location}
          onChange={(e): void => setLocation(e.target.value)}
          placeholder="e.g. Workshop shelf 3"
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-choco-primary focus:border-choco-primary"
        />
      </div>

      {/* Notes */}
      <NotesEditor value={notes} onChange={setNotes} />

      {/* Actions */}
      <div className="flex gap-2 mt-6 pt-4 border-t border-gray-200">
        <button
          onClick={handleSave}
          className="px-4 py-2 text-sm font-medium text-white bg-choco-primary hover:bg-choco-primary/90 rounded transition-colors"
        >
          Save
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
