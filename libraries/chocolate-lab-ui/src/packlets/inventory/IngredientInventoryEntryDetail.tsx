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
 * Read-only ingredient inventory entry detail view.
 * @packageDocumentation
 */

import React from 'react';

import type { IngredientId, UserLibrary } from '@fgv/ts-chocolate';
import { EntityDetailHeader, NotesSection } from '../common';

// ============================================================================
// Props
// ============================================================================

/**
 * Props for the IngredientInventoryEntryDetail component.
 * @public
 */
export interface IIngredientInventoryEntryDetailProps {
  /** The materialized ingredient inventory entry to display */
  readonly entry: UserLibrary.IIngredientInventoryEntry;
  /** Optional callback to switch to edit mode */
  readonly onEdit?: () => void;
  /** Optional callback to browse the referenced ingredient in cascade */
  readonly onBrowseIngredient?: (ingredientId: IngredientId) => void;
  /** Optional callback to close this panel */
  readonly onClose?: () => void;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Read-only detail view for an ingredient inventory entry.
 *
 * Displays:
 * - Header with ingredient name and category badge
 * - Clickable ingredient reference for cascade drill-down
 * - Quantity with unit, location
 * - Notes
 *
 * @public
 */
export function IngredientInventoryEntryDetail(
  props: IIngredientInventoryEntryDetailProps
): React.ReactElement {
  const { entry, onEdit, onClose, onBrowseIngredient } = props;
  const ingredient = entry.item;
  const locationName = entry.location?.name;
  const unit = entry.entity.unit ?? 'g';

  return (
    <div className="p-4 overflow-y-auto h-full">
      {/* Header */}
      <EntityDetailHeader
        title={ingredient.name}
        badge={
          ingredient.category
            ? { label: ingredient.category, colorClass: 'bg-choco-primary/10 text-choco-primary' }
            : undefined
        }
        subtitle={entry.id}
        onEdit={onEdit}
        onClose={onClose}
      />

      {/* Location (centered, title case) */}
      {locationName && <p className="text-sm text-gray-500 text-center py-2">{locationName}</p>}

      {/* Quantity + unit and ingredient name */}
      <div className="py-3 text-sm text-gray-700">
        <span className="font-medium">
          {entry.quantity} {unit}
        </span>{' '}
        {onBrowseIngredient ? (
          <button
            onClick={(): void => onBrowseIngredient(ingredient.id as IngredientId)}
            className="text-choco-primary hover:underline"
          >
            {ingredient.name}
          </button>
        ) : (
          <span>{ingredient.name}</span>
        )}
      </div>

      {/* Notes */}
      <NotesSection notes={entry.notes ?? []} />
    </div>
  );
}
