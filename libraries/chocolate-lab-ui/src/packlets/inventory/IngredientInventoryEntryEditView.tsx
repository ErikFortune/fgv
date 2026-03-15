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
 * Edit form for an ingredient inventory entry.
 * @packageDocumentation
 */

import React, { useCallback, useState } from 'react';

import { NumericInput, TypeaheadInput, type ITypeaheadSuggestion } from '@fgv/ts-app-shell';
import type {
  Entities,
  LocationId,
  Measurement,
  MeasurementUnit,
  Model as CommonModel,
  UserLibrary
} from '@fgv/ts-chocolate';

type IIngredientInventoryEntryEntity = Entities.Inventory.IIngredientInventoryEntryEntity;

import { NotesEditor } from '../editing';

// ============================================================================
// Constants
// ============================================================================

const ALL_MEASUREMENT_UNITS: ReadonlyArray<MeasurementUnit> = [
  'g',
  'mL',
  'tsp',
  'Tbsp',
  'pinch',
  'seeds',
  'pods'
];

function stepForUnit(unit: MeasurementUnit): number {
  switch (unit) {
    case 'tsp':
    case 'Tbsp':
      return 0.25;
    case 'pinch':
    case 'seeds':
    case 'pods':
      return 1;
    default:
      return 0.1;
  }
}

// ============================================================================
// Props
// ============================================================================

/**
 * Props for the IngredientInventoryEntryEditView component.
 * @public
 */
export interface IIngredientInventoryEntryEditViewProps {
  /** The materialized ingredient inventory entry being edited */
  readonly entry: UserLibrary.IIngredientInventoryEntry;
  /** All available locations as typeahead suggestions */
  readonly locationSuggestions: ReadonlyArray<ITypeaheadSuggestion<LocationId>>;
  /** Optional pre-selected location ID (e.g. after unresolved location create flow) */
  readonly initialLocationId?: LocationId;
  /** Optional pre-selected location display name */
  readonly initialLocationName?: string;
  /** Called with the updated entity when the user saves */
  readonly onSave: (entity: IIngredientInventoryEntryEntity) => void;
  /** Called when typeahead blur cannot resolve to a single location */
  readonly onUnresolvedLocation: (text: string) => void;
  /** Called when the user cancels editing */
  readonly onCancel: () => void;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Edit form for an ingredient inventory entry.
 *
 * Allows editing quantity, unit, location, and notes. The ingredient reference
 * is read-only (to change which ingredient, delete and re-create the entry).
 *
 * @public
 */
export function IngredientInventoryEntryEditView(
  props: IIngredientInventoryEntryEditViewProps
): React.ReactElement {
  const {
    entry,
    locationSuggestions,
    initialLocationId,
    initialLocationName,
    onSave,
    onUnresolvedLocation,
    onCancel
  } = props;
  const ingredient = entry.item;
  const entryLocationName = entry.location?.name;
  const entryLocationId = entry.location?.id;
  const effectiveLocationName = initialLocationName ?? entryLocationName;
  const effectiveLocationId = initialLocationId ?? entryLocationId;

  const [quantity, setQuantity] = useState<number | undefined>(entry.quantity);
  const [unit, setUnit] = useState<MeasurementUnit>(entry.entity.unit ?? 'g');
  const [unitExpanded, setUnitExpanded] = useState(false);
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
    if (quantity === undefined) return;
    const effectiveUnit = unit === 'g' ? undefined : unit;
    const entity: IIngredientInventoryEntryEntity = {
      inventoryType: 'ingredient',
      ingredientId: entry.entity.ingredientId,
      quantity: quantity as Measurement,
      ...(effectiveUnit ? { unit: effectiveUnit } : {}),
      ...(selectedLocationId ? { locationId: selectedLocationId } : {}),
      ...(notes && notes.length > 0 ? { notes } : {})
    };
    onSave(entity);
  }, [entry, quantity, unit, selectedLocationId, notes, onSave]);

  return (
    <div className="p-4 overflow-y-auto h-full">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">{ingredient.name}</h2>
        <p className="text-xs text-gray-400 font-mono mt-0.5">{entry.id}</p>
      </div>

      {/* Ingredient (read-only) */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Ingredient</label>
        <div className="px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-md text-gray-600">
          {ingredient.name}
          {ingredient.category && <span className="ml-2 text-xs text-gray-400">{ingredient.category}</span>}
        </div>
      </div>

      {/* Quantity + Unit */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
        <div className="flex items-center gap-2">
          <NumericInput
            value={quantity}
            onChange={setQuantity}
            min={0}
            step={stepForUnit(unit)}
            label={`Amount (${unit})`}
            className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-choco-primary focus:border-choco-primary"
          />
          <button
            type="button"
            onClick={(): void => setUnitExpanded(!unitExpanded)}
            className="text-xs text-gray-500 hover:text-choco-primary cursor-pointer px-1 select-none shrink-0"
            title="Click to show/hide unit selector"
          >
            {unit} {unitExpanded ? '\u25BE' : '\u25B8'}
          </button>
        </div>
        {unitExpanded && (
          <div className="flex items-center gap-2 mt-1.5 pl-1">
            <select
              className="text-xs bg-transparent border border-gray-200 rounded px-1 py-0.5 text-gray-600 cursor-pointer focus:outline-none focus:ring-1 focus:ring-choco-primary"
              value={unit}
              onChange={(e): void => setUnit(e.target.value as MeasurementUnit)}
            >
              {ALL_MEASUREMENT_UNITS.map((u: MeasurementUnit) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
        )}
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
