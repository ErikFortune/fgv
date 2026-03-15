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
 * Location model types and interfaces
 * @packageDocumentation
 */

import { BaseLocationId, Model as CommonModel } from '../../common';

/**
 * Represents a production location (e.g., storage area, workspace, shelf).
 * @public
 */
export interface ILocationEntity {
  /**
   * Base location identifier (unique within source)
   */
  readonly baseId: BaseLocationId;

  /**
   * Human-readable name for the location
   */
  readonly name: string;

  /**
   * Optional longer description of the location
   */
  readonly description?: string;

  /**
   * Optional categorized notes about the location
   */
  readonly notes?: ReadonlyArray<CommonModel.ICategorizedNote>;

  /**
   * Optional categorized URLs for external resources
   */
  readonly urls?: ReadonlyArray<CommonModel.ICategorizedUrl>;
}

// ============================================================================
// Factory
// ============================================================================

/**
 * Create a blank location entity with sensible defaults.
 * @param baseId - Base identifier for the location
 * @param name - Human-readable name for the location
 * @returns A minimal valid location entity
 * @public
 */
export function createBlankLocationEntity(baseId: BaseLocationId, name: string): ILocationEntity {
  return {
    baseId,
    name
  };
}
