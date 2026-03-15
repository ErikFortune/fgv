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
 * Create panel for adding a new ingredient inventory entry.
 *
 * Uses TypeaheadInput for ingredient selection with on-blur resolution:
 * - Single match → auto-selects the ingredient
 * - Zero/multiple matches → fires onUnresolvedIngredient for cascade ingredient creation
 *
 * @packageDocumentation
 */

import React, { useCallback, useEffect, useState } from 'react';

import { NumericInput, TypeaheadInput, type ITypeaheadSuggestion } from '@fgv/ts-app-shell';
import type { IngredientId, LocationId, Measurement, MeasurementUnit } from '@fgv/ts-chocolate';

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
 * Props for the CreateIngredientInventoryPanel component.
 * @public
 */
export interface ICreateIngredientInventoryPanelProps {
  /** All available ingredients as typeahead suggestions */
  readonly ingredientSuggestions: ReadonlyArray<ITypeaheadSuggestion<IngredientId>>;
  /** All available locations as typeahead suggestions */
  readonly locationSuggestions: ReadonlyArray<ITypeaheadSuggestion<LocationId>>;
  /** Called when the user confirms creation with a selected ingredient */
  readonly onConfirm: (
    ingredientId: IngredientId,
    quantity: Measurement,
    unit?: MeasurementUnit,
    locationId?: LocationId
  ) => void;
  /** Called when typeahead blur cannot resolve to a single ingredient */
  readonly onUnresolvedIngredient: (text: string) => void;
  /** Called when typeahead blur cannot resolve to a single location */
  readonly onUnresolvedLocation: (
    text: string,
    currentSelection: { ingredientId?: IngredientId; ingredientName?: string }
  ) => void;
  /** Called when the user cancels creation */
  readonly onCancel: () => void;
  /** Optional pre-selected ingredient ID (e.g. after creating an ingredient via on-blur cascade) */
  readonly initialIngredientId?: IngredientId;
  /** Optional pre-selected ingredient display name */
  readonly initialIngredientName?: string;
  /** Optional pre-selected location ID */
  readonly initialLocationId?: LocationId;
  /** Optional pre-selected location display name */
  readonly initialLocationName?: string;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Panel for creating a new ingredient inventory entry.
 *
 * Flow:
 * 1. User types an ingredient name in the TypeaheadInput
 * 2. On blur: single match auto-selects; unresolved fires cascade
 * 3. Once ingredient selected: user sets quantity, unit, and optional location
 * 4. Confirm creates the inventory entry
 *
 * @public
 */
export function CreateIngredientInventoryPanel(
  props: ICreateIngredientInventoryPanelProps
): React.ReactElement {
  const {
    ingredientSuggestions,
    locationSuggestions,
    onConfirm,
    onUnresolvedIngredient,
    onUnresolvedLocation,
    onCancel,
    initialIngredientId,
    initialIngredientName,
    initialLocationId,
    initialLocationName
  } = props;

  const [ingredientInput, setIngredientInput] = useState(initialIngredientName ?? '');
  const [selectedIngredientId, setSelectedIngredientId] = useState<IngredientId | undefined>(
    initialIngredientId
  );
  const [selectedIngredientName, setSelectedIngredientName] = useState<string | undefined>(
    initialIngredientName
  );
  const [quantity, setQuantity] = useState<number | undefined>(0);
  const [unit, setUnit] = useState<MeasurementUnit>('g');
  const [unitExpanded, setUnitExpanded] = useState(false);
  const [locationInput, setLocationInput] = useState(initialLocationName ?? '');
  const [selectedLocationId, setSelectedLocationId] = useState<LocationId | undefined>(initialLocationId);
  const [selectedLocationName, setSelectedLocationName] = useState<string | undefined>(initialLocationName);

  useEffect(() => {
    if (initialIngredientId !== undefined) {
      setSelectedIngredientId(initialIngredientId);
    }
    if (initialIngredientName !== undefined) {
      setSelectedIngredientName(initialIngredientName);
      setIngredientInput(initialIngredientName);
    }
  }, [initialIngredientId, initialIngredientName]);

  useEffect(() => {
    if (initialLocationId !== undefined) {
      setSelectedLocationId(initialLocationId);
    }
    if (initialLocationName !== undefined) {
      setSelectedLocationName(initialLocationName);
      setLocationInput(initialLocationName);
    }
  }, [initialLocationId, initialLocationName]);

  const handleIngredientSelect = useCallback((suggestion: ITypeaheadSuggestion<IngredientId>): void => {
    setSelectedIngredientId(suggestion.id);
    setSelectedIngredientName(suggestion.name);
    setIngredientInput(suggestion.name);
  }, []);

  const handleIngredientUnresolved = useCallback(
    (text: string): void => {
      onUnresolvedIngredient(text);
    },
    [onUnresolvedIngredient]
  );

  const handleLocationSelect = useCallback((suggestion: ITypeaheadSuggestion<LocationId>): void => {
    setSelectedLocationId(suggestion.id);
    setSelectedLocationName(suggestion.name);
    setLocationInput(suggestion.name);
  }, []);

  const handleLocationUnresolved = useCallback(
    (text: string): void => {
      onUnresolvedLocation(text, {
        ingredientId: selectedIngredientId,
        ingredientName: selectedIngredientName
      });
    },
    [onUnresolvedLocation, selectedIngredientId, selectedIngredientName]
  );

  const handleConfirm = useCallback((): void => {
    if (!selectedIngredientId || quantity === undefined) return;
    const effectiveUnit = unit === 'g' ? undefined : unit;
    onConfirm(selectedIngredientId, quantity as Measurement, effectiveUnit, selectedLocationId);
  }, [selectedIngredientId, quantity, unit, selectedLocationId, onConfirm]);

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">New Ingredient Inventory Entry</h2>

      {/* Ingredient Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Ingredient</label>
        <TypeaheadInput<IngredientId>
          value={ingredientInput}
          onChange={(value): void => {
            setIngredientInput(value);
            if (selectedIngredientName && value !== selectedIngredientName) {
              setSelectedIngredientId(undefined);
              setSelectedIngredientName(undefined);
            }
          }}
          suggestions={ingredientSuggestions}
          onSelect={handleIngredientSelect}
          onUnresolved={handleIngredientUnresolved}
          placeholder="Type an ingredient name..."
          autoFocus
        />
        {selectedIngredientId && (
          <p className="text-xs text-green-600 mt-1">
            Selected: {selectedIngredientName}
            <span className="ml-1 text-gray-400 font-mono">{selectedIngredientId}</span>
          </p>
        )}
      </div>

      {/* Quantity + Unit */}
      <div>
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
          disabled={!selectedIngredientId || quantity === undefined}
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
