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
 * Mold class - pure data layer representation
 * @packageDocumentation
 */

import { Result, Success } from '@fgv/ts-utils';

import { BaseMoldId, Measurement, MoldFormat } from '../common';
import { ICavityDimensions, IMold } from './model';

// ============================================================================
// Mold Class
// ============================================================================

/**
 * Mold class - pure data representation of a mold.
 * @public
 */
export class Mold implements IMold {
  public readonly baseId: BaseMoldId;
  public readonly manufacturer: string;
  public readonly productNumber: string;
  public readonly description?: string;
  public readonly cavityCount: number;
  public readonly cavityWeight?: Measurement;
  public readonly cavityDimensions?: ICavityDimensions;
  public readonly format: MoldFormat;
  public readonly tags?: ReadonlyArray<string>;
  public readonly notes?: string;

  private constructor(data: IMold) {
    this.baseId = data.baseId;
    this.manufacturer = data.manufacturer;
    this.productNumber = data.productNumber;
    this.description = data.description;
    this.cavityCount = data.cavityCount;
    this.cavityWeight = data.cavityWeight;
    this.cavityDimensions = data.cavityDimensions;
    this.format = data.format;
    this.tags = data.tags;
    this.notes = data.notes;
  }

  /**
   * Creates a Mold instance from mold data
   * @param data - Mold data
   * @returns Success with Mold instance
   */
  public static create(data: IMold): Result<Mold> {
    return Success.with(new Mold(data));
  }
}
