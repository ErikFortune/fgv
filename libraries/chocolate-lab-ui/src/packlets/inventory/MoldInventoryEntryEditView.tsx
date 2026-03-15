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

import { TypeaheadInput, type ITypeaheadSuggestion } from '@fgv/ts-app-shell';
import type { Entities, LocationId, Model as CommonModel, UserLibrary } from '@fgv/ts-chocolate';

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
  /** All available locations as typeahead suggestions */
  readonly locationSuggestions: ReadonlyArray<ITypeaheadSuggestion<LocationId>>;
  /** Optional pre-selected location ID (e.g. after unresolved location create flow) */
  readonly initialLocationId?: LocationId;
  /** Optional pre-selected location display name */
  readonly initialLocationName?: string;
  /** Called with the updated entity when the user saves */
  readonly onSave: (entity: IMoldInventoryEntryEntity) => void;
  /** Called when typeahead blur cannot resolve to a single location */
  readonly onUnresolvedLocation: (text: string) => void;
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
  const {
    entry,
    locationSuggestions,
    initialLocationId,
    initialLocationName,
    onSave,
    onUnresolvedLocation,
    onCancel
  } = props;
  const mold = entry.item;
  const entryLocationName = entry.location?.name;
  const entryLocationId = entry.location?.id;
  const effectiveLocationName = initialLocationName ?? entryLocationName;
  const effectiveLocationId = initialLocationId ?? entryLocationId;

  const [countInput, setCountInput] = useState<string>(String(entry.quantity));
  const [locationInput, setLocationInput] = useState(effectiveLocationName ?? '');
  const [selectedLocationId, setSelectedLocationId] = useState<LocationId | undefined>(effectiveLocationId);
  const [selectedLocationName, setSelectedLocationName] = useState<string | undefined>(effectiveLocationName);
  const [notes, setNotes] = useState<ReadonlyArray<CommonModel.ICategorizedNote> | undefined>(entry.notes);

  const handleLocationSelect = useCallback((suggestion: ITypeaheadSuggestion<LocationId>): void => {
    setSelectedLocationId(suggestion.id);
    setSelectedLocationName(suggestion.name);
    setLocationInput(suggestion.name);
  }, []);

  const handleLocationUnresolved = useCallback(
    (text: string): void => {
      onUnresolvedLocation(text);
    },
    [onUnresolvedLocation]
  );

  const handleSave = useCallback((): void => {
    const parsedCount = Number.parseInt(countInput.trim(), 10);
    const entity: IMoldInventoryEntryEntity = {
      inventoryType: 'mold',
      moldId: entry.entity.moldId,
      count: Number.isFinite(parsedCount) ? Math.max(0, parsedCount) : 0,
      ...(selectedLocationId ? { locationId: selectedLocationId } : {}),
      ...(notes && notes.length > 0 ? { notes } : {})
    };
    onSave(entity);
  }, [entry, countInput, selectedLocationId, notes, onSave]);

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
          type="text"
          inputMode="numeric"
          value={countInput}
          onChange={(e): void => setCountInput(e.target.value.replace(/[^0-9]/g, ''))}
          onFocus={(e): void => e.target.select()}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-choco-primary focus:border-choco-primary"
        />
      </div>

      {/* Location */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
        <TypeaheadInput<LocationId>
          value={locationInput}
          onChange={(value): void => {
            setLocationInput(value);
            if (selectedLocationName && value !== selectedLocationName) {
              setSelectedLocationId(undefined);
              setSelectedLocationName(undefined);
            }
          }}
          suggestions={locationSuggestions}
          onSelect={handleLocationSelect}
          onUnresolved={handleLocationUnresolved}
          placeholder="Type a location name..."
        />
        {selectedLocationId && (
          <p className="text-xs text-green-600 mt-1">
            Selected: {selectedLocationName}
            <span className="ml-1 text-gray-400 font-mono">{selectedLocationId}</span>
          </p>
        )}
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
