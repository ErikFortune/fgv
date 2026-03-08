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
export type LibraryTab =
  | 'ingredients'
  | 'fillings'
  | 'confections'
  | 'decorations'
  | 'molds'
  | 'tasks'
  | 'procedures';

/**
 * The settings tab identifier. Mode-independent — valid in any mode.
 * @public
 */
export type SettingsTab = 'settings';

/**
 * Union of all tab identifiers.
 * @public
 */
export type AppTab = ProductionTab | LibraryTab | SettingsTab;

/**
 * Default tab for each mode.
 * @public
 */
export const DEFAULT_TABS: Record<AppMode, AppTab> = {
  production: 'sessions',
  library: 'confections'
} as const;

/**
 * All tabs for each mode, in display order.
 * @public
 */
export const MODE_TABS: Record<AppMode, ReadonlyArray<AppTab>> = {
  production: ['sessions', 'journal', 'ingredient-inventory', 'mold-inventory'],
  library: ['confections', 'fillings', 'ingredients', 'molds', 'decorations', 'procedures', 'tasks']
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
  decorations: 'Decorations',
  molds: 'Molds',
  tasks: 'Tasks',
  procedures: 'Procedures',
  settings: 'Settings'
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
  | 'decoration'
  | 'mold'
  | 'task'
  | 'procedure'
  | 'step-params'
  | 'session'
  | 'journal-entry';

/**
 * Mode for a cascade column (view-only, editing, or creating a new entity).
 * @public
 */
export type CascadeColumnMode = 'view' | 'edit' | 'create' | 'preview';

/**
 * Pre-fill data for session creation in the cascade.
 * Used when "Start Session" is invoked from a confection or filling detail view.
 * @public
 */
export interface ICreateSessionInfo {
  /** Pre-selected confection ID (composite, from confection detail "Start Session") */
  readonly confectionId?: string;
  /** Pre-selected filling ID (composite, from filling detail "Start Session") */
  readonly fillingId?: string;
  /** Pre-selected filling variation spec (e.g. '2026-01-15') */
  readonly variationSpec?: string;
  /** Pre-filled entity display name for the label field */
  readonly entityName?: string;
  /** Target frame count for scaling (molded bonbon, from browse panel) */
  readonly targetFrames?: number;
  /** Target piece count for scaling (bar/rolled truffle, from browse panel) */
  readonly targetCount?: number;
  /** Buffer percentage for overfill (from browse panel) */
  readonly bufferPercentage?: number;
}

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
  /** Optional target weight in grams (used when drilling into a filling from a scaled confection) */
  readonly targetWeight?: number;
  /** Source confection ID when drilling into a filling slot (for live weight recomputation) */
  readonly sourceConfectionId?: string;
  /** Source slot ID within the confection (for live weight recomputation) */
  readonly sourceSlotId?: string;
  /** Parent session ID when this entry represents an embedded filling session drill-down */
  readonly embeddedParentSessionId?: string;
  /** Slot ID for the embedded filling session drill-down */
  readonly embeddedSlotId?: string;
  /** Whether this cascade entry has unsaved changes (set by the owning tab component). */
  readonly hasChanges?: boolean;
  /** Pre-fill data for session creation (set when opening create-session from a recipe) */
  readonly createSessionInfo?: ICreateSessionInfo;
  /** Pre-fill name for entity creation (set when on-blur typeahead doesn't match) */
  readonly prefillName?: string;
}

// ============================================================================
// Collection Visibility
// ============================================================================

/**
 * Per-tab collection visibility state.
 * Maps collection IDs to their visibility (true = visible, false = hidden).
 * Collections not present in the map are visible by default.
 * @public
 */
export type ICollectionVisibility = Readonly<Record<string, boolean>>;

/**
 * Stable default collection visibility singleton.
 * @public
 */
export const DEFAULT_COLLECTION_VISIBILITY: ICollectionVisibility = {};

// ============================================================================
// Filter State
// ============================================================================

/**
 * Per-tab filter state.
 *
 * Stores the free-text search query and a map of named filter selections.
 * Each key in `selections` corresponds to a filter row (e.g., 'categories', 'tags')
 * and its value is the array of selected filter option values (as strings).
 *
 * @public
 */
export interface IFilterState {
  /** Free-text search query */
  readonly search: string;
  /** Named filter selections (key = filter name, value = selected option values) */
  readonly selections: Readonly<Record<string, ReadonlyArray<string>>>;
}

/**
 * Stable default filter state singleton.
 * Use this in selectors to avoid creating new objects on every call.
 * @public
 */
export const DEFAULT_FILTER_STATE: IFilterState = { search: '', selections: {} };

/**
 * Creates a default (empty) filter state.
 * @public
 */
export function createDefaultFilterState(): IFilterState {
  return { search: '', selections: {} };
}

/**
 * Returns the total number of active filter selections (excluding search).
 * @public
 */
export function countActiveSelections(state: IFilterState): number {
  return Object.values(state.selections).reduce((sum, arr) => sum + arr.length, 0);
}

/**
 * Returns true if any filters are active (search or selections).
 * @public
 */
export function hasActiveFilters(state: IFilterState): boolean {
  return state.search.length > 0 || countActiveSelections(state) > 0;
}
