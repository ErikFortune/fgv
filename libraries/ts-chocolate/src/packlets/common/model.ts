// Copyright (c) 2024 Erik Fortune
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

/**
 * Branded types and enumerations for the chocolate library
 * @packageDocumentation
 */

import { SlotId, NoteCategory, UrlCategory, MeasurementUnit } from './ids';

import * as Enums from './enums';
export { Enums };

/**
 * Option wrapper for measurement units (for use with IOptionsWithPreferred).
 * Wraps a MeasurementUnit to satisfy IHasId requirement.
 * @public
 */
export interface IMeasurementUnitOption {
  /** The measurement unit */
  readonly id: MeasurementUnit;
}

// ============================================================================
// Notes
// ============================================================================

/**
 * A categorized note associated with an entity.
 * @public
 */
export interface ICategorizedNote {
  /** Category of the note (e.g., 'general', 'tasting', 'production') */
  readonly category: NoteCategory;
  /** The note string */
  readonly note: string;
}

// ============================================================================
// URLs
// ============================================================================

/**
 * A categorized URL for linking to external resources.
 * Used on ingredients, recipes, molds, and confections.
 * @public
 */
export interface ICategorizedUrl {
  /** Category of the URL (e.g., 'manufacturer', 'product-page', 'video') */
  readonly category: UrlCategory;
  /** The URL string */
  readonly url: string;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Separator character used in composite IDs
 * @public
 */
export const ID_SEPARATOR: string = '.';

/**
 * Pattern for valid base IDs (no dots allowed)
 * @public
 */
export const BASE_ID_PATTERN: RegExp = /^[a-zA-Z0-9_-]+$/;

/**
 * Pattern for valid composite IDs (exactly one dot)
 * @public
 */
export const COMPOSITE_ID_PATTERN: RegExp = /^[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+$/;

/**
 * Pattern for valid filling variation specs
 * Format: YYYY-MM-DD-NN with optional label (lowercase alphanumeric with dashes)
 * @public
 */
export const FILLING_RECIPE_VARIATION_SPEC_PATTERN: RegExp = /^\d{4}-\d{2}-\d{2}-\d{2}(-[a-z0-9-]+)?$/;

/**
 * Separator character used in filling variation IDs (between FillingId and FillingVariationSpec)
 * @public
 */
export const VARIATION_ID_SEPARATOR: string = '@';

/**
 * Pattern for valid filling variation IDs
 * Format: fillingId\@variationSpec where fillingId is collectionId.baseFillingId
 * @public
 */
export const FILLING_RECIPE_VARIATION_ID_PATTERN: RegExp =
  /^[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+@\d{4}-\d{2}-\d{2}-\d{2}(-[a-z0-9-]+)?$/;

/**
 * Pattern for valid session specs
 * Format: YYYY-MM-DD-HHMMSS-[0-9a-f]\{8\}
 * Example: "2026-01-15-143025-a1b2c3d4"
 * @public
 */
export const SESSION_SPEC_PATTERN: RegExp = /^\d{4}-\d{2}-\d{2}-\d{6}-[0-9a-f]{8}$/;

/**
 * Pattern for valid base session IDs (within a collection)
 * Format: YYYY-MM-DD-HHMMSS-[0-9a-f]\{8\}
 * Example: "2026-01-15-143025-a1b2c3d4"
 * @public
 */
export const BASE_SESSION_ID_PATTERN: RegExp = /^\d{4}-\d{2}-\d{2}-\d{6}-[0-9a-f]{8}$/;

/**
 * Pattern for valid composite session IDs
 * Format: collectionId.baseSessionId
 * Example: "user-sessions.2026-01-15-143025-a1b2c3d4"
 * @public
 */
export const SESSION_ID_PATTERN: RegExp = /^[a-zA-Z0-9_-]+\.\d{4}-\d{2}-\d{2}-\d{6}-[0-9a-f]{8}$/;

/**
 * Pattern for valid journal base IDs (within a collection)
 * Format: YYYY-MM-DD-HHMMSS-[0-9a-f]\{8\}
 * Example: "2026-01-15-143025-a1b2c3d4"
 * @public
 */
export const BASE_JOURNAL_ID_PATTERN: RegExp = /^\d{4}-\d{2}-\d{2}-\d{6}-[0-9a-f]{8}$/;

/**
 * Pattern for valid composite journal IDs
 * Format: collectionId.baseJournalId
 * Example: "user-journals.2026-01-15-143025-a1b2c3d4"
 * @public
 */
export const JOURNAL_ID_PATTERN: RegExp = /^[a-zA-Z0-9_-]+\.\d{4}-\d{2}-\d{2}-\d{6}-[0-9a-f]{8}$/;

/**
 * Pattern for valid confection variation specs
 * Format: YYYY-MM-DD-NN with optional label (lowercase alphanumeric with dashes)
 * Same pattern as recipe variation specs
 * @public
 */
export const CONFECTION_RECIPE_VARIATION_SPEC_PATTERN: RegExp = /^\d{4}-\d{2}-\d{2}-\d{2}(-[a-z0-9-]+)?$/;

/**
 * Pattern for valid confection variation IDs
 * Format: confectionId\@variationSpec where confectionId is collectionId.baseConfectionId
 * @public
 */
export const CONFECTION_RECIPE_VARIATION_ID_PATTERN: RegExp =
  /^[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+@\d{4}-\d{2}-\d{2}-\d{2}(-[a-z0-9-]+)?$/;

// ============================================================================
// Options with Preferred Interfaces
// ============================================================================

/**
 * Base interface that option types must extend for use with IOptionsWithPreferred.
 * Enables generic helpers that work with any option type.
 * @typeParam TId - The type of the identifier
 * @public
 */
export interface IHasId<TId extends string> {
  readonly id: TId;
}

/**
 * Collection of options (objects with IDs) with a preferred selection.
 * Use when options are objects containing IDs plus additional metadata.
 *
 * @typeParam TOption - The option object type (must have an `id` property)
 * @typeParam TId - The ID type for the preferred selection
 * @public
 */
export interface IOptionsWithPreferred<TOption extends IHasId<TId>, TId extends string> {
  /** Available options */
  readonly options: ReadonlyArray<TOption>;
  /** ID of the preferred/recommended option */
  readonly preferredId?: TId;
}

/**
 * Collection of simple IDs with a preferred selection.
 * Use when options are just IDs without additional metadata.
 *
 * @typeParam TId - The ID type
 * @public
 */
export interface IIdsWithPreferred<TId extends string> {
  /** Optional slot identifier */
  readonly slotId?: SlotId;
  /** Available option IDs */
  readonly ids: ReadonlyArray<TId>;
  /** The preferred/recommended ID */
  readonly preferredId?: TId;
}

/**
 * Generic reference type with an ID and optional categorized notes.
 * Use as base for mold refs, procedure refs, etc.
 * Satisfies IHasId for use with IOptionsWithPreferred.
 *
 * @typeParam TId - The ID type
 * @public
 */
export interface IRefWithNotes<TId extends string> extends IHasId<TId> {
  /** The referenced entity's ID */
  readonly id: TId;
  /** Optional categorized notes specific to this reference */
  readonly notes?: ReadonlyArray<ICategorizedNote>;
}
