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
 * Create panel for adding a new mold inventory entry.
 *
 * Uses TypeaheadInput for mold selection with on-blur resolution:
 * - Single match → auto-selects the mold
 * - Zero/multiple matches → fires onUnresolvedMold for cascade mold creation
 *
 * @packageDocumentation
 */

import React, { useCallback, useEffect, useState } from 'react';

import { NumericInput, TypeaheadInput, type ITypeaheadSuggestion } from '@fgv/ts-app-shell';
import type { LocationId, MoldId } from '@fgv/ts-chocolate';

// ============================================================================
// Props
// ============================================================================

/**
 * Props for the CreateMoldInventoryPanel component.
 * @public
 */
export interface ICreateMoldInventoryPanelProps {
  /** All available molds as typeahead suggestions */
  readonly moldSuggestions: ReadonlyArray<ITypeaheadSuggestion<MoldId>>;
  /** All available locations as typeahead suggestions */
  readonly locationSuggestions: ReadonlyArray<ITypeaheadSuggestion<LocationId>>;
  /** Called when the user confirms creation with a selected mold */
  readonly onConfirm: (moldId: MoldId, count: number, locationId?: LocationId) => void;
  /** Called when typeahead blur cannot resolve to a single mold */
  readonly onUnresolvedMold: (text: string) => void;
  /** Called when typeahead blur cannot resolve to a single location */
  readonly onUnresolvedLocation: (
    text: string,
    currentSelection: { moldId?: MoldId; moldName?: string }
  ) => void;
  /** Called when the user cancels creation */
  readonly onCancel: () => void;
  /** Optional pre-selected mold ID (e.g. after creating a mold via on-blur cascade) */
  readonly initialMoldId?: MoldId;
  /** Optional pre-selected mold display name */
  readonly initialMoldName?: string;
  /** Optional pre-selected location ID */
  readonly initialLocationId?: LocationId;
  /** Optional pre-selected location display name */
  readonly initialLocationName?: string;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Panel for creating a new mold inventory entry.
 *
 * Flow:
 * 1. User types a mold name in the TypeaheadInput
 * 2. On blur: single match auto-selects; unresolved fires cascade
 * 3. Once mold selected: user sets count (default 1) and optional location
 * 4. Confirm creates the inventory entry
 *
 * @public
 */
export function CreateMoldInventoryPanel(props: ICreateMoldInventoryPanelProps): React.ReactElement {
  const {
    moldSuggestions,
    locationSuggestions,
    onConfirm,
    onUnresolvedMold,
    onUnresolvedLocation,
    onCancel,
    initialMoldId,
    initialMoldName,
    initialLocationId,
    initialLocationName
  } = props;

  const [moldInput, setMoldInput] = useState(initialMoldName ?? '');
  const [selectedMoldId, setSelectedMoldId] = useState<MoldId | undefined>(initialMoldId);
  const [selectedMoldName, setSelectedMoldName] = useState<string | undefined>(initialMoldName);
  const [count, setCount] = useState<number | undefined>(1);
  const [locationInput, setLocationInput] = useState(initialLocationName ?? '');
  const [selectedLocationId, setSelectedLocationId] = useState<LocationId | undefined>(initialLocationId);
  const [selectedLocationName, setSelectedLocationName] = useState<string | undefined>(initialLocationName);

  useEffect(() => {
    if (initialMoldId !== undefined) {
      setSelectedMoldId(initialMoldId);
    }
    if (initialMoldName !== undefined) {
      setSelectedMoldName(initialMoldName);
      setMoldInput(initialMoldName);
    }
  }, [initialMoldId, initialMoldName]);

  useEffect(() => {
    if (initialLocationId !== undefined) {
      setSelectedLocationId(initialLocationId);
    }
    if (initialLocationName !== undefined) {
      setSelectedLocationName(initialLocationName);
      setLocationInput(initialLocationName);
    }
  }, [initialLocationId, initialLocationName]);

  const handleMoldSelect = useCallback((suggestion: ITypeaheadSuggestion<MoldId>): void => {
    setSelectedMoldId(suggestion.id);
    setSelectedMoldName(suggestion.name);
    setMoldInput(suggestion.name);
  }, []);

  const handleMoldUnresolved = useCallback(
    (text: string): void => {
      onUnresolvedMold(text);
    },
    [onUnresolvedMold]
  );

  const handleLocationSelect = useCallback((suggestion: ITypeaheadSuggestion<LocationId>): void => {
    setSelectedLocationId(suggestion.id);
    setSelectedLocationName(suggestion.name);
    setLocationInput(suggestion.name);
  }, []);

  const handleLocationUnresolved = useCallback(
    (text: string): void => {
      onUnresolvedLocation(text, {
        moldId: selectedMoldId,
        moldName: selectedMoldName
      });
    },
    [onUnresolvedLocation, selectedMoldId, selectedMoldName]
  );

  const handleConfirm = useCallback((): void => {
    if (!selectedMoldId || count === undefined) return;
    onConfirm(selectedMoldId, Math.max(1, count), selectedLocationId);
  }, [selectedMoldId, count, selectedLocationId, onConfirm]);

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">New Mold Inventory Entry</h2>

      {/* Mold Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Mold</label>
        <TypeaheadInput<MoldId>
          value={moldInput}
          onChange={(value): void => {
            setMoldInput(value);
            // Clear selection if user edits the text
            if (selectedMoldName && value !== selectedMoldName) {
              setSelectedMoldId(undefined);
              setSelectedMoldName(undefined);
            }
          }}
          suggestions={moldSuggestions}
          onSelect={handleMoldSelect}
          onUnresolved={handleMoldUnresolved}
          placeholder="Type a mold name..."
          autoFocus
        />
        {selectedMoldId && (
          <p className="text-xs text-green-600 mt-1">
            Selected: {selectedMoldName}
            <span className="ml-1 text-gray-400 font-mono">{selectedMoldId}</span>
          </p>
        )}
      </div>

      {/* Count */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Count</label>
        <NumericInput
          value={count}
          onChange={setCount}
          min={1}
          step={1}
          label="Count"
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-choco-primary focus:border-choco-primary"
        />
      </div>

      {/* Location */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Location (optional)</label>
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

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <button
          onClick={handleConfirm}
          disabled={!selectedMoldId || count === undefined}
          className="px-4 py-2 text-sm font-medium text-white bg-choco-primary hover:bg-choco-primary/90 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Add to Inventory
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
