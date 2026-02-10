// Copyright (c) 2026 Erik Fortune
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

import { UserLibrary as UserLib } from '@fgv/ts-chocolate';

import { formatCategorizedNotes } from '../../shared';
import { IEntityAction, IRenderResult } from './rendererTypes';

/**
 * Renders a one-line summary for a mold inventory entry (for list display).
 */
export function renderMoldInventorySummary(entry: UserLib.IMoldInventoryEntry): string {
  const locationSuffix = entry.location ? ` @ ${entry.location}` : '';
  return `${entry.item.displayName} - qty: ${entry.quantity}${locationSuffix}`;
}

/**
 * Renders a one-line summary for an ingredient inventory entry (for list display).
 */
export function renderIngredientInventorySummary(entry: UserLib.IIngredientInventoryEntry): string {
  const unit = entry.entity.unit ?? 'g';
  const locationSuffix = entry.location ? ` @ ${entry.location}` : '';
  return `${entry.item.name} - ${entry.quantity}${unit}${locationSuffix}`;
}

/**
 * Renders a full detail view for a mold inventory entry.
 */
export function renderMoldInventoryDetail(entry: UserLib.IMoldInventoryEntry): IRenderResult {
  const lines: string[] = [];
  const actions: IEntityAction[] = [];

  lines.push(`Mold Inventory: ${entry.item.displayName}`);
  lines.push(`ID: ${entry.id}`);
  lines.push(`Mold: ${entry.item.displayName} (${entry.item.id})`);
  lines.push(`Quantity: ${entry.quantity}`);

  if (entry.location) {
    lines.push(`Location: ${entry.location}`);
  }

  const notesStr = formatCategorizedNotes(entry.notes);
  if (notesStr) {
    lines.push(`Notes: ${notesStr}`);
  }

  actions.push({
    label: `View mold: ${entry.item.displayName}`,
    key: `view-mold:${entry.item.id}`,
    description: `Navigate to mold ${entry.item.id}`
  });

  return { text: lines.join('\n'), actions };
}

/**
 * Renders a full detail view for an ingredient inventory entry.
 */
export function renderIngredientInventoryDetail(entry: UserLib.IIngredientInventoryEntry): IRenderResult {
  const lines: string[] = [];
  const actions: IEntityAction[] = [];
  const unit = entry.entity.unit ?? 'g';

  lines.push(`Ingredient Inventory: ${entry.item.name}`);
  lines.push(`ID: ${entry.id}`);
  lines.push(`Ingredient: ${entry.item.name} (${entry.item.id})`);
  lines.push(`Category: ${entry.item.category}`);
  lines.push(`Quantity: ${entry.quantity}${unit}`);

  if (entry.location) {
    lines.push(`Location: ${entry.location}`);
  }

  const notesStr = formatCategorizedNotes(entry.notes);
  if (notesStr) {
    lines.push(`Notes: ${notesStr}`);
  }

  actions.push({
    label: `View ingredient: ${entry.item.name}`,
    key: `view-ingredient:${entry.item.id}`,
    description: `Navigate to ingredient ${entry.item.id}`
  });

  return { text: lines.join('\n'), actions };
}
