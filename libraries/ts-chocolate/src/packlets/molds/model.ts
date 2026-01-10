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
 * Mold model types and interfaces
 * @packageDocumentation
 */

import { BaseMoldId, ICategorizedUrl, Measurement, Millimeters, MoldFormat } from '../common';

/**
 * Dimensions of a mold cavity in millimeters
 * @public
 */
export interface ICavityDimensions {
  /**
   * Width of the cavity in millimeters
   */
  readonly width: Millimeters;

  /**
   * Length of the cavity in millimeters
   */
  readonly length: Millimeters;

  /**
   * Depth of the cavity in millimeters
   */
  readonly depth: Millimeters;
}

/**
 * Represents a chocolate mold
 * @public
 */
export interface IMold {
  /**
   * Base mold identifier (unique within source)
   */
  readonly baseId: BaseMoldId;

  /**
   * Manufacturer of the mold
   */
  readonly manufacturer: string;

  /**
   * Product number from the manufacturer
   */
  readonly productNumber: string;

  /**
   * Human-readable description of the mold shape
   */
  readonly description?: string;

  /**
   * Number of cavities in the mold
   */
  readonly cavityCount: number;

  /**
   * Weight capacity per cavity in grams
   */
  readonly cavityWeight?: Measurement;

  /**
   * Physical dimensions of each cavity
   */
  readonly cavityDimensions?: ICavityDimensions;

  /**
   * Mold format/series (determines frame dimensions)
   */
  readonly format: MoldFormat;

  /**
   * Optional tags for categorization and search
   */
  readonly tags?: ReadonlyArray<string>;

  /**
   * Optional notes about the mold
   */
  readonly notes?: string;

  /**
   * Optional categorized URLs for external resources (manufacturer page, purchase link, etc.)
   */
  readonly urls?: ReadonlyArray<ICategorizedUrl>;
}
