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
 * View settings for confection detail and preview panels.
 *
 * Captures ephemeral UI selections (alternate picks, scaling) that should
 * survive across detail → preview transitions. Lifted to the tab level
 * following the same pattern as the filling `targetYieldMap`.
 *
 * @packageDocumentation
 */

import type { DecorationId, IngredientId, MoldId, ProcedureId } from '@fgv/ts-chocolate';

/**
 * Per-entity view settings for confection detail and preview.
 *
 * All fields are optional — absence means "use the recipe's preferred/default".
 * @public
 */
export interface IConfectionViewSettings {
  /** Per-slot filling selection: slotId → optionId */
  readonly fillingSelections?: Readonly<Record<string, string>>;
  /** Shell chocolate selection (molded bonbon) */
  readonly shellChocolateId?: IngredientId;
  /** Enrobing chocolate selection (bar/rolled truffle) */
  readonly enrobingChocolateId?: IngredientId;
  /** Mold selection (molded bonbon) */
  readonly moldId?: MoldId;
  /** Coating selection (rolled truffle) */
  readonly coatingId?: IngredientId;
  /** Decoration selection */
  readonly decorationId?: DecorationId;
  /** Procedure selection */
  readonly procedureId?: ProcedureId;
  /** Target piece count for scaling (bar/rolled truffle) */
  readonly targetCount?: number;
  /** Target frame count for scaling (molded bonbon) */
  readonly targetFrames?: number;
  /** Buffer overfill percentage for molded bonbon scaling (default 10 = 10%) */
  readonly bufferPercentage?: number;
}
