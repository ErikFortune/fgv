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
 * Shared ingredient amount formatting helpers for filling and confection detail/preview panels.
 *
 * These helpers use `LR.Internal.scaleAmount` for display-friendly formatting and handle
 * modifiers (toTaste, spoonLevel). Centralised here to avoid duplication across
 * `FillingDetail`, `FillingPreviewPanel`, and `ConfectionPreviewPanel`.
 *
 * @packageDocumentation
 */

import type { Entities, Measurement, MeasurementUnit } from '@fgv/ts-chocolate';
import { LibraryRuntime as LR } from '@fgv/ts-chocolate';

/**
 * Formats a raw ingredient amount with its unit, applying display rounding via
 * `LR.Internal.scaleAmount`. Appends modifier suffixes (to taste, spoon level).
 * @public
 */
export function formatIngredientAmount(
  amount: number,
  unit?: MeasurementUnit,
  modifiers?: Entities.Fillings.IIngredientModifiers
): string {
  const u = unit ?? 'g';
  const result = LR.Internal.scaleAmount(amount as Measurement, u, 1.0);
  const base = result.isSuccess() ? result.value.displayValue : `${amount}${u}`;
  if (modifiers?.toTaste) return `${base}, to taste`;
  if (modifiers?.spoonLevel) return `${base} (${modifiers.spoonLevel})`;
  return base;
}

/**
 * Formats a scaled ingredient amount. When `scaleFactor` is undefined, falls back
 * to `formatIngredientAmount`. Appends modifier suffixes.
 * @public
 */
export function formatScaledIngredientAmount(
  amount: number,
  unit?: MeasurementUnit,
  scaleFactor?: number,
  modifiers?: Entities.Fillings.IIngredientModifiers
): string {
  if (scaleFactor === undefined) return formatIngredientAmount(amount, unit, modifiers);
  const u = unit ?? 'g';
  const result = LR.Internal.scaleAmount(amount as Measurement, u, scaleFactor);
  const base = result.isSuccess()
    ? result.value.displayValue
    : formatIngredientAmount(amount * scaleFactor, u);
  if (modifiers?.toTaste) return `${base}, to taste`;
  if (modifiers?.spoonLevel) return `${base} (${modifiers.spoonLevel})`;
  return base;
}
