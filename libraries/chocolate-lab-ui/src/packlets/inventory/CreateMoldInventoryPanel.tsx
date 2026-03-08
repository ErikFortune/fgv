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

import React, { useCallback, useState } from 'react';

import { TypeaheadInput, type ITypeaheadSuggestion } from '@fgv/ts-app-shell';
import type { MoldId } from '@fgv/ts-chocolate';

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
  /** Called when the user confirms creation with a selected mold */
  readonly onConfirm: (moldId: MoldId, count: number, location?: string) => void;
  /** Called when typeahead blur cannot resolve to a single mold */
  readonly onUnresolvedMold: (text: string) => void;
  /** Called when the user cancels creation */
  readonly onCancel: () => void;
  /** Optional pre-selected mold ID (e.g. after creating a mold via on-blur cascade) */
  readonly initialMoldId?: MoldId;
  /** Optional pre-selected mold display name */
  readonly initialMoldName?: string;
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
  const { moldSuggestions, onConfirm, onUnresolvedMold, onCancel, initialMoldId, initialMoldName } = props;

  const [moldInput, setMoldInput] = useState(initialMoldName ?? '');
  const [selectedMoldId, setSelectedMoldId] = useState<MoldId | undefined>(initialMoldId);
  const [selectedMoldName, setSelectedMoldName] = useState<string | undefined>(initialMoldName);
  const [count, setCount] = useState(1);
  const [location, setLocation] = useState('');

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

  const handleConfirm = useCallback((): void => {
    if (!selectedMoldId) return;
    onConfirm(selectedMoldId, Math.max(1, count), location.trim() || undefined);
  }, [selectedMoldId, count, location, onConfirm]);

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
        <input
          type="number"
          min={1}
          value={count}
          onChange={(e): void => setCount(parseInt(e.target.value, 10) || 1)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-choco-primary focus:border-choco-primary"
        />
      </div>

      {/* Location */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Location (optional)</label>
        <input
          type="text"
          value={location}
          onChange={(e): void => setLocation(e.target.value)}
          placeholder="e.g. Workshop shelf 3"
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-choco-primary focus:border-choco-primary"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <button
          onClick={handleConfirm}
          disabled={!selectedMoldId}
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
