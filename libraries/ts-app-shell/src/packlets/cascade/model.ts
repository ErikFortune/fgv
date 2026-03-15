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
 * Base cascade model types for column cascade navigation.
 *
 * These types are domain-agnostic — they define the structure and semantics
 * of cascade navigation without knowledge of specific entity types.
 * Domain-specific applications extend {@link ICascadeEntryBase} with their
 * own entity types and additional fields.
 *
 * @packageDocumentation
 */

// ============================================================================
// Cascade Column Modes
// ============================================================================

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

// ============================================================================
// Cascade Entry Base
// ============================================================================

/**
 * Sentinel value used as entityId when creating a new entity.
 * @public
 */
export const CASCADE_NEW_ENTITY_ID: '__new__' = '__new__';

/**
 * Base interface for a single entry in the column cascade stack.
 *
 * This interface contains only the fields needed by the generic cascade
 * operations ({@link useCascadeOps}, {@link useSquashAt}, {@link useCascadeDrillDown}).
 * Domain-specific applications should extend this interface with additional
 * fields (e.g., target weights, source references, session context).
 *
 * @public
 */
export interface ICascadeEntryBase {
  /** The type of entity displayed in this column (domain-specific string). */
  readonly entityType: string;
  /** The ID of the entity (qualified ID, e.g. 'collection.base-id'). */
  readonly entityId: string;
  /** Whether the column is in view, edit, create, or preview mode. */
  readonly mode: CascadeColumnMode;
  /** How this entry was opened. Determines save/cancel behavior. @see CascadeEntryOrigin */
  readonly origin?: CascadeEntryOrigin;
  /** Optional pre-resolved materialized entity. */
  readonly entity?: unknown;
  /** Whether this cascade entry has unsaved changes (set by the owning tab component). */
  readonly hasChanges?: boolean;
  /** Pre-fill name for entity creation (set when on-blur typeahead doesn't match). */
  readonly prefillName?: string;
}
