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
 * Numeric input with select-all-on-focus and empty-string support.
 *
 * Uses `type="text"` with `inputMode="decimal"` to avoid native number-input
 * quirks (spinner buttons, empty-string rejection). Manages a string internally
 * but exposes `number | undefined` to callers.
 *
 * @packageDocumentation
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';

// ============================================================================
// Constants
// ============================================================================

const NUMERIC_PATTERN: RegExp = /^-?\d*\.?\d*$/;

const DEFAULT_CLASS: string =
  'text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-choco-primary focus:border-choco-primary';

// ============================================================================
// Props
// ============================================================================

/**
 * Props for the {@link NumericInput} component.
 * @public
 */
export interface INumericInputProps {
  /** Current numeric value (`undefined` = empty field). */
  readonly value: number | undefined;
  /** Called with the parsed number on blur, or `undefined` if the field is empty. */
  readonly onChange: (value: number | undefined) => void;
  /** Accessible label (maps to `aria-label`). */
  readonly label?: string;
  /** Minimum allowed value (clamped on blur). */
  readonly min?: number;
  /** Maximum allowed value (clamped on blur). */
  readonly max?: number;
  /** Step for arrow-key increment/decrement. Defaults to 1. */
  readonly step?: number;
  /** Additional or replacement CSS classes. */
  readonly className?: string;
  /** Placeholder text shown when the field is empty. */
  readonly placeholder?: string;
  /** Auto-focus the input on mount. */
  readonly autoFocus?: boolean;
  /** Disabled state. */
  readonly disabled?: boolean;
}

// ============================================================================
// Helpers
// ============================================================================

function formatValue(value: number | undefined): string {
  return value !== undefined ? String(value) : '';
}

function clamp(value: number, min: number | undefined, max: number | undefined): number {
  let result = value;
  if (min !== undefined && result < min) {
    result = min;
  }
  if (max !== undefined && result > max) {
    result = max;
  }
  return result;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Numeric input that selects all on focus and allows empty values.
 *
 * Internally manages a string so the user can freely type, backspace to empty,
 * and replace the entire value. On blur, the string is parsed to a number
 * (clamped to min/max) and reported to the parent via `onChange`.
 *
 * @public
 */
export function NumericInput(props: INumericInputProps): React.ReactElement {
  const { value, onChange, label, min, max, step, className, placeholder, autoFocus, disabled } = props;

  const [displayValue, setDisplayValue] = useState(() => formatValue(value));
  const focusedRef = useRef(false);

  // Sync display when value prop changes externally (but not while focused)
  useEffect(() => {
    if (!focusedRef.current) {
      setDisplayValue(formatValue(value));
    }
  }, [value]);

  const handleFocus = useCallback((e: React.FocusEvent<HTMLInputElement>): void => {
    focusedRef.current = true;
    e.target.select();
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>): void => {
    const raw = e.target.value;
    if (raw === '' || NUMERIC_PATTERN.test(raw)) {
      setDisplayValue(raw);
    }
  }, []);

  const handleBlur = useCallback((): void => {
    focusedRef.current = false;
    const trimmed = displayValue.trim();
    if (trimmed === '' || trimmed === '-' || trimmed === '.') {
      setDisplayValue('');
      onChange(undefined);
      return;
    }
    const parsed = parseFloat(trimmed);
    if (isNaN(parsed)) {
      setDisplayValue('');
      onChange(undefined);
      return;
    }
    const clamped = clamp(parsed, min, max);
    setDisplayValue(String(clamped));
    onChange(clamped);
  }, [displayValue, onChange, min, max]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>): void => {
      if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') {
        return;
      }
      e.preventDefault();
      const effectiveStep = step ?? 1;
      const current = parseFloat(displayValue) || 0;
      const next = e.key === 'ArrowUp' ? current + effectiveStep : current - effectiveStep;
      const clamped = clamp(next, min, max);
      // Round to avoid floating-point drift
      const rounded = parseFloat(clamped.toFixed(10));
      setDisplayValue(String(rounded));
      onChange(rounded);
    },
    [displayValue, onChange, min, max, step]
  );

  return (
    <input
      type="text"
      inputMode="decimal"
      value={displayValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className={className ?? DEFAULT_CLASS}
      aria-label={label}
      placeholder={placeholder}
      autoFocus={autoFocus}
      disabled={disabled}
    />
  );
}
