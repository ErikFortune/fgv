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

/**
 * RuntimeMold - resolved mold view with computed properties
 * @packageDocumentation
 */

import { Result, Success } from '@fgv/ts-utils';

import {
  BaseMoldId,
  ICategorizedUrl,
  ID_SEPARATOR,
  Measurement,
  MoldFormat,
  MoldId,
  SourceId
} from '../../common';
import { ICavities, ICavityDimensions, IMold } from '../../entities';
import { IMoldContext, IRuntimeMold } from './model';

// ============================================================================
// RuntimeMold Class
// ============================================================================

/**
 * A resolved view of a mold with computed properties.
 *
 * RuntimeMold wraps a data-layer Mold and provides:
 * - Composite identity (MoldId) for cross-source references
 * - Computed properties (totalCapacity, displayName)
 * - Future navigation capabilities
 *
 * @public
 */
export class RuntimeMold implements IRuntimeMold {
  private readonly _context: IMoldContext;
  private readonly _id: MoldId;
  private readonly _mold: IMold;
  private readonly _sourceId: SourceId;

  private constructor(context: IMoldContext, id: MoldId, mold: IMold) {
    this._context = context;
    this._id = id;
    this._mold = mold;

    // Parse the composite ID
    const parts = (id as string).split(ID_SEPARATOR);
    this._sourceId = parts[0] as SourceId;
  }

  /**
   * Factory method for creating a RuntimeMold.
   * @param context - The runtime context (reserved for future use)
   * @param id - The composite mold ID
   * @param mold - The mold data
   * @returns Success with RuntimeMold
   */
  public static create(context: IMoldContext, id: MoldId, mold: IMold): Result<RuntimeMold> {
    return Success.with(new RuntimeMold(context, id, mold));
  }

  // ============================================================================
  // Identity
  // ============================================================================

  /**
   * The composite mold ID (e.g., "cw.cw-2227")
   */
  public get id(): MoldId {
    return this._id;
  }

  /**
   * The source ID part of the composite ID
   */
  public get sourceId(): SourceId {
    return this._sourceId;
  }

  /**
   * The base mold ID within the source
   */
  public get baseId(): BaseMoldId {
    return this._mold.baseId;
  }

  // ============================================================================
  // Core Properties (passthrough to underlying Mold)
  // ============================================================================

  /**
   * Manufacturer of the mold
   */
  public get manufacturer(): string {
    return this._mold.manufacturer;
  }

  /**
   * Product number from the manufacturer
   */
  public get productNumber(): string {
    return this._mold.productNumber;
  }

  /**
   * Human-readable description
   */
  public get description(): string | undefined {
    return this._mold.description;
  }

  /**
   * Cavities definition (grid or count)
   */
  public get cavities(): ICavities {
    return this._mold.cavities;
  }

  /**
   * Number of cavities in the mold
   */
  public get cavityCount(): number {
    if (this._mold.cavities.kind === 'grid') {
      return this._mold.cavities.columns * this._mold.cavities.rows;
    }
    return this._mold.cavities.count;
  }

  /**
   * Weight capacity per cavity in grams
   */
  public get cavityWeight(): Measurement | undefined {
    return this._mold.cavities.info?.weight;
  }

  /**
   * Physical dimensions of each cavity
   */
  public get cavityDimensions(): ICavityDimensions | undefined {
    return this._mold.cavities.info?.dimensions;
  }

  /**
   * Mold format/series
   */
  public get format(): MoldFormat {
    return this._mold.format;
  }

  /**
   * Optional tags
   */
  public get tags(): ReadonlyArray<string> | undefined {
    return this._mold.tags;
  }

  public get related(): ReadonlyArray<MoldId> | undefined {
    return this._mold.related;
  }

  /**
   * Optional notes
   */
  public get notes(): string | undefined {
    return this._mold.notes;
  }

  /**
   * Optional categorized URLs
   */
  /* c8 ignore next 3 - simple getter, tested via Mold class */
  public get urls(): ReadonlyArray<ICategorizedUrl> | undefined {
    return this.raw.urls;
  }

  // ============================================================================
  // Computed Properties
  // ============================================================================

  /**
   * Gets the total capacity of the mold (all cavities) in grams.
   * Returns undefined if cavityWeight is not defined.
   */
  public get totalCapacity(): Measurement | undefined {
    const weight = this._mold.cavities.info?.weight;
    if (weight === undefined) {
      return undefined;
    }
    return (weight * this.cavityCount) as Measurement;
  }

  /**
   * Gets a display string for this mold.
   * Example: "Hex Swirl (Chocolate World CW-2227)"
   * Falls back to manufacturer + product number if no description.
   */
  public get displayName(): string {
    const manufacturerModel = `${this._mold.manufacturer} ${this._mold.productNumber}`;
    if (this._mold.description) {
      return `${this._mold.description} (${manufacturerModel})`;
    }
    return manufacturerModel;
  }

  // ============================================================================
  // Raw Access
  // ============================================================================

  /**
   * Gets the underlying raw mold data
   */
  public get raw(): IMold {
    return this._mold;
  }

  // ============================================================================
  // Context Access (for future use)
  // ============================================================================

  /**
   * Gets the mold context.
   * @internal
   */
  /* c8 ignore next 3 - protected internal accessor for subclass use */
  protected get context(): IMoldContext {
    return this._context;
  }
}
