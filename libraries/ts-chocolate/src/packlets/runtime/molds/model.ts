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

/* c8 ignore file - interface definitions only, no runtime code */

/**
 * Runtime mold model types
 * @packageDocumentation
 */

import { BaseMoldId, ICategorizedUrl, Measurement, MoldFormat, MoldId, SourceId } from '../../common';
import { ICavities, ICavityDimensions, IMold } from '../../entities';

// ============================================================================
// Runtime Mold Context
// ============================================================================

/**
 * Minimal context interface for RuntimeMold.
 * Currently empty but reserved for future navigation capabilities.
 * @internal
 */
export interface IMoldContext {
  // Reserved for future navigation (e.g., confections using this mold)
}

// ============================================================================
// Runtime Mold Interface
// ============================================================================

/**
 * A resolved runtime view of a mold with computed properties.
 *
 * This interface provides runtime-layer access to mold data with:
 * - Composite identity (`id`, `sourceId`) for cross-source references
 * - Computed properties (totalCapacity, displayName)
 * - Future navigation capabilities
 *
 * @public
 */
export interface IRuntimeMold {
  // ---- Composite Identity ----

  /**
   * The composite mold ID (e.g., "cw.cw-2227").
   * Combines source and base ID for unique identification across sources.
   */
  readonly id: MoldId;

  /**
   * The source ID part of the composite ID.
   */
  readonly sourceId: SourceId;

  /**
   * The base mold ID within the source.
   */
  readonly baseId: BaseMoldId;

  // ---- Core Properties ----

  /** Manufacturer of the mold */
  readonly manufacturer: string;

  /** Product number from the manufacturer */
  readonly productNumber: string;

  /** Human-readable description */
  readonly description?: string;

  /** Cavities definition (grid or count) */
  readonly cavities: ICavities;

  /** Number of cavities in the mold */
  readonly cavityCount: number;

  /** Weight capacity per cavity in grams */
  readonly cavityWeight?: Measurement;

  /** Physical dimensions of each cavity */
  readonly cavityDimensions?: ICavityDimensions;

  /** Mold format/series */
  readonly format: MoldFormat;

  /** Optional tags */
  readonly tags?: ReadonlyArray<string>;

  /** Optional related molds (cross-catalog via composite IDs) */
  readonly related?: ReadonlyArray<MoldId>;

  /** Optional notes */
  readonly notes?: string;

  /** Optional categorized URLs */
  readonly urls?: ReadonlyArray<ICategorizedUrl>;

  // ---- Computed Properties ----

  /**
   * Gets the total capacity of the mold (all cavities) in grams.
   * Returns undefined if cavityWeight is not defined.
   */
  readonly totalCapacity: Measurement | undefined;

  /**
   * Gets a display string for this mold (manufacturer + product number).
   * Example: "Chocolate World CW 2227"
   */
  readonly displayName: string;

  // ---- Raw Access ----

  /**
   * Gets the underlying raw mold data.
   */
  readonly raw: IMold;
}
