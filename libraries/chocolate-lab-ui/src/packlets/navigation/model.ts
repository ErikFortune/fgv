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
 * Navigation model types for Chocolate Lab.
 * @packageDocumentation
 */

// ============================================================================
// Modes
// ============================================================================

/**
 * Top-level application modes.
 * @public
 */
export type AppMode = 'production' | 'library';

// ============================================================================
// Tabs
// ============================================================================

/**
 * Tabs available in Production mode.
 * @public
 */
export type ProductionTab = 'sessions' | 'journal' | 'ingredient-inventory' | 'mold-inventory';

/**
 * Tabs available in Library mode.
 * @public
 */
export type LibraryTab = 'ingredients' | 'fillings' | 'confections' | 'molds' | 'tasks' | 'procedures';

/**
 * Union of all tab identifiers.
 * @public
 */
export type AppTab = ProductionTab | LibraryTab;

/**
 * Default tab for each mode.
 * @public
 */
export const DEFAULT_TABS: Record<AppMode, AppTab> = {
  production: 'sessions',
  library: 'ingredients'
} as const;

/**
 * All tabs for each mode, in display order.
 * @public
 */
export const MODE_TABS: Record<AppMode, ReadonlyArray<AppTab>> = {
  production: ['sessions', 'journal', 'ingredient-inventory', 'mold-inventory'],
  library: ['ingredients', 'fillings', 'confections', 'molds', 'tasks', 'procedures']
} as const;

/**
 * Human-readable labels for tabs.
 * @public
 */
export const TAB_LABELS: Record<AppTab, string> = {
  sessions: 'Sessions',
  journal: 'Journal',
  'ingredient-inventory': 'Ingredient Inventory',
  'mold-inventory': 'Mold Inventory',
  ingredients: 'Ingredients',
  fillings: 'Fillings',
  confections: 'Confections',
  molds: 'Molds',
  tasks: 'Tasks',
  procedures: 'Procedures'
} as const;

/**
 * Human-readable labels for modes.
 * @public
 */
export const MODE_LABELS: Record<AppMode, string> = {
  production: 'Production',
  library: 'Library'
} as const;

// ============================================================================
// Cascade Stack
// ============================================================================

/**
 * Entity types that can appear in the column cascade.
 * @public
 */
export type CascadeEntityType =
  | 'ingredient'
  | 'filling'
  | 'confection'
  | 'mold'
  | 'task'
  | 'procedure'
  | 'session'
  | 'journal-entry';

/**
 * Mode for a cascade column (view-only or editing).
 * @public
 */
export type CascadeColumnMode = 'view' | 'edit';

/**
 * A single entry in the column cascade stack.
 * @public
 */
export interface ICascadeEntry {
  /** The type of entity displayed in this column */
  readonly entityType: CascadeEntityType;
  /** The ID of the entity (qualified ID, e.g. 'collection.base-id') */
  readonly entityId: string;
  /** Whether the column is in view or edit mode */
  readonly mode: CascadeColumnMode;
}

// ============================================================================
// Filter State
// ============================================================================

/**
 * Per-tab filter state. Extensible — specific filter shapes
 * will be defined per entity type in Phase 2.
 * @public
 */
export interface IFilterState {
  /** Free-text search query */
  readonly search: string;
}

/**
 * Creates a default (empty) filter state.
 * @public
 */
export function createDefaultFilterState(): IFilterState {
  return { search: '' };
}
