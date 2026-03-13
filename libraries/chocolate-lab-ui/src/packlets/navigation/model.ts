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

import type {
  ConfectionId,
  DecorationId,
  Entities,
  FillingId,
  IngredientId,
  JournalId,
  LibraryRuntime,
  LocationId,
  MoldId,
  ProcedureId,
  SessionId,
  TaskId,
  UserLibrary
} from '@fgv/ts-chocolate';

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
export type ProductionTab = 'sessions' | 'journal' | 'ingredient-inventory' | 'mold-inventory' | 'locations';

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
  production: ['sessions', 'journal', 'ingredient-inventory', 'mold-inventory', 'locations'],
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
  locations: 'Locations',
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
  | 'journal-entry'
  | 'mold-inventory-entry'
  | 'location';

/**
 * Mode for a cascade column (view-only, editing, or creating a new entity).
 * @public
 */
export type CascadeColumnMode = 'view' | 'edit' | 'create' | 'preview';

/**
 * How a cascade entry was opened — determines save/cancel behavior.
 *
 * - `'primary'` — selected from the entity list. Save/cancel transitions to view mode in-place.
 * - `'nested'` — reached via drill-down, typeahead-create, or sub-entity editing. Save/cancel pops (removes entry).
 *
 * Entries without an explicit origin are treated as `'primary'` for backwards compatibility.
 * @public
 */
export type CascadeEntryOrigin = 'primary' | 'nested';

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
  /** Optional pre-resolved materialized entity. Typed variants narrow this to specific entity types. */
  readonly entity?: unknown;
  /** How this entry was opened. Determines save/cancel behavior. @see CascadeEntryOrigin */
  readonly origin?: CascadeEntryOrigin;
}

// ============================================================================
// Typed Cascade Entry Variants
// ============================================================================

/**
 * Sentinel value used as entityId when creating a new entity.
 * @public
 */
export const CASCADE_NEW_ENTITY_ID: '__new__' = '__new__';

/**
 * Cascade entry for an ingredient.
 * Narrows {@link ICascadeEntry} with typed `entityId` and optional materialized `entity`.
 * @public
 */
export interface IIngredientCascadeEntry extends ICascadeEntry {
  readonly entityType: 'ingredient';
  readonly entityId: IngredientId | typeof CASCADE_NEW_ENTITY_ID;
  readonly entity?: LibraryRuntime.AnyIngredient;
}

/**
 * Cascade entry for a filling recipe.
 * Narrows {@link ICascadeEntry} with typed `entityId` and optional materialized `entity`.
 * @public
 */
export interface IFillingCascadeEntry extends ICascadeEntry {
  readonly entityType: 'filling';
  readonly entityId: FillingId | typeof CASCADE_NEW_ENTITY_ID;
  readonly entity?: LibraryRuntime.FillingRecipe;
}

/**
 * Cascade entry for a confection recipe.
 * Narrows {@link ICascadeEntry} with typed `entityId` and optional materialized `entity`.
 * @public
 */
export interface IConfectionCascadeEntry extends ICascadeEntry {
  readonly entityType: 'confection';
  readonly entityId: ConfectionId | typeof CASCADE_NEW_ENTITY_ID;
  readonly entity?: LibraryRuntime.IConfectionBase;
}

/**
 * Cascade entry for a mold.
 * Narrows {@link ICascadeEntry} with typed `entityId` and optional materialized `entity`.
 * @public
 */
export interface IMoldCascadeEntry extends ICascadeEntry {
  readonly entityType: 'mold';
  readonly entityId: MoldId | typeof CASCADE_NEW_ENTITY_ID;
  readonly entity?: LibraryRuntime.IMold;
}

/**
 * Cascade entry for a decoration.
 * Narrows {@link ICascadeEntry} with typed `entityId` and optional materialized `entity`.
 * @public
 */
export interface IDecorationCascadeEntry extends ICascadeEntry {
  readonly entityType: 'decoration';
  readonly entityId: DecorationId | typeof CASCADE_NEW_ENTITY_ID;
  readonly entity?: LibraryRuntime.IDecoration;
}

/**
 * Cascade entry for a procedure.
 * Narrows {@link ICascadeEntry} with typed `entityId` and optional materialized `entity`.
 * @public
 */
export interface IProcedureCascadeEntry extends ICascadeEntry {
  readonly entityType: 'procedure';
  readonly entityId: ProcedureId | typeof CASCADE_NEW_ENTITY_ID;
  readonly entity?: LibraryRuntime.IProcedure;
}

/**
 * Cascade entry for a task (view-only).
 * Narrows {@link ICascadeEntry} with typed `entityId` and optional materialized `entity`.
 * @public
 */
export interface ITaskCascadeEntry extends ICascadeEntry {
  readonly entityType: 'task';
  readonly entityId: TaskId;
  readonly entity?: LibraryRuntime.ITask;
}

/**
 * Cascade entry for a session.
 * Narrows {@link ICascadeEntry} with typed `entityId` and optional materialized `entity`.
 * @public
 */
export interface ISessionCascadeEntry extends ICascadeEntry {
  readonly entityType: 'session';
  readonly entityId: SessionId | typeof CASCADE_NEW_ENTITY_ID;
  readonly entity?: UserLibrary.AnyMaterializedSession;
}

/**
 * Cascade entry for a journal entry (view-only).
 * Narrows {@link ICascadeEntry} with typed `entityId` and optional materialized `entity`.
 * @public
 */
export interface IJournalEntryCascadeEntry extends ICascadeEntry {
  readonly entityType: 'journal-entry';
  readonly entityId: JournalId;
  readonly entity?: UserLibrary.AnyJournalEntry;
}

/**
 * Cascade entry for a mold inventory entry (view-only).
 * Narrows {@link ICascadeEntry} with typed `entityId` and optional materialized `entity`.
 * @public
 */
export interface IMoldInventoryEntryCascadeEntry extends ICascadeEntry {
  readonly entityType: 'mold-inventory-entry';
  readonly entityId: Entities.Inventory.MoldInventoryEntryId;
  readonly entity?: UserLibrary.IMoldInventoryEntry;
}

/**
 * Cascade entry for a location (view-only).
 * Narrows {@link ICascadeEntry} with typed `entityId` and optional materialized `entity`.
 * @public
 */
export interface ILocationCascadeEntry extends ICascadeEntry {
  readonly entityType: 'location';
  readonly entityId: LocationId;
  readonly entity?: UserLibrary.ILocation;
}

/**
 * Cascade entry for step parameters (session-driven, no entity).
 * Narrows {@link ICascadeEntry} with `entityType` set to `'step-params'`.
 * @public
 */
export interface IStepParamsCascadeEntry extends ICascadeEntry {
  readonly entityType: 'step-params';
}

/**
 * Discriminated union of all typed cascade entry variants.
 * Uses `entityType` as the discriminator.
 * @public
 */
export type AnyCascadeEntry =
  | IIngredientCascadeEntry
  | IFillingCascadeEntry
  | IConfectionCascadeEntry
  | IMoldCascadeEntry
  | IDecorationCascadeEntry
  | IProcedureCascadeEntry
  | ITaskCascadeEntry
  | ISessionCascadeEntry
  | IJournalEntryCascadeEntry
  | IMoldInventoryEntryCascadeEntry
  | ILocationCascadeEntry
  | IStepParamsCascadeEntry;

// ============================================================================
// Cascade Entry Type Guards
// ============================================================================

/** @public */
export function isIngredientCascadeEntry(entry: ICascadeEntry): entry is IIngredientCascadeEntry {
  return entry.entityType === 'ingredient';
}

/** @public */
export function isFillingCascadeEntry(entry: ICascadeEntry): entry is IFillingCascadeEntry {
  return entry.entityType === 'filling';
}

/** @public */
export function isConfectionCascadeEntry(entry: ICascadeEntry): entry is IConfectionCascadeEntry {
  return entry.entityType === 'confection';
}

/** @public */
export function isMoldCascadeEntry(entry: ICascadeEntry): entry is IMoldCascadeEntry {
  return entry.entityType === 'mold';
}

/** @public */
export function isDecorationCascadeEntry(entry: ICascadeEntry): entry is IDecorationCascadeEntry {
  return entry.entityType === 'decoration';
}

/** @public */
export function isProcedureCascadeEntry(entry: ICascadeEntry): entry is IProcedureCascadeEntry {
  return entry.entityType === 'procedure';
}

/** @public */
export function isTaskCascadeEntry(entry: ICascadeEntry): entry is ITaskCascadeEntry {
  return entry.entityType === 'task';
}

/** @public */
export function isSessionCascadeEntry(entry: ICascadeEntry): entry is ISessionCascadeEntry {
  return entry.entityType === 'session';
}

/** @public */
export function isJournalEntryCascadeEntry(entry: ICascadeEntry): entry is IJournalEntryCascadeEntry {
  return entry.entityType === 'journal-entry';
}

/** @public */
export function isMoldInventoryEntryCascadeEntry(
  entry: ICascadeEntry
): entry is IMoldInventoryEntryCascadeEntry {
  return entry.entityType === 'mold-inventory-entry';
}

/** @public */
export function isLocationCascadeEntry(entry: ICascadeEntry): entry is ILocationCascadeEntry {
  return entry.entityType === 'location';
}

/** @public */
export function isStepParamsCascadeEntry(entry: ICascadeEntry): entry is IStepParamsCascadeEntry {
  return entry.entityType === 'step-params';
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
