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
 * Procedure model types and interfaces
 * @packageDocumentation
 */

import { BaseProcedureId, Celsius, Minutes } from '../common';
import { FillingCategory } from '../fillings';

/**
 * A single step in a procedure
 * @public
 */
export interface IProcedureStep {
  /**
   * Order number of this step (1-based)
   */
  readonly order: number;

  /**
   * Description of what to do in this step
   * (Will support templating in the future)
   */
  readonly description: string;

  /**
   * Time actively working on this step
   */
  readonly activeTime?: Minutes;

  /**
   * Passive waiting time (e.g., resting, cooling)
   */
  readonly waitTime?: Minutes;

  /**
   * Time to hold at a temperature
   */
  readonly holdTime?: Minutes;

  /**
   * Target temperature for this step
   */
  readonly temperature?: Celsius;

  /**
   * Optional notes for this step
   */
  readonly notes?: string;
}

/**
 * Represents a procedure for making chocolate confections
 * @public
 */
export interface IProcedure {
  /**
   * Base procedure identifier (unique within source)
   */
  readonly baseId: BaseProcedureId;

  /**
   * Human-readable name of the procedure
   */
  readonly name: string;

  /**
   * Optional description of the procedure
   */
  readonly description?: string;

  /**
   * Optional filling category this procedure applies to.
   * If set, procedure is category-specific; if not, it's general/reusable.
   */
  readonly category?: FillingCategory;

  /**
   * Steps of the procedure in order
   */
  readonly steps: ReadonlyArray<IProcedureStep>;

  /**
   * Optional tags for categorization and search
   */
  readonly tags?: ReadonlyArray<string>;

  /**
   * Optional notes about the procedure
   */
  readonly notes?: string;
}
