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
 * Generic edit field helper components for entity editors.
 *
 * Provides reusable form field primitives: text inputs, number inputs,
 * select dropdowns, tag editors, checkboxes, and layout wrappers.
 * These components are domain-agnostic and can be used by any entity editor.
 *
 * @packageDocumentation
 */

import React from 'react';

// ============================================================================
// Layout Helpers
// ============================================================================

/**
 * Props for the EditField component.
 * @public
 */
export interface IEditFieldProps {
  /** Label text displayed to the left of the field */
  readonly label: string;
  /** The input control(s) to render */
  readonly children: React.ReactNode;
}

/**
 * Horizontal label + field layout for a single edit field.
 * @public
 */
export function EditField({ label, children }: IEditFieldProps): React.ReactElement {
  return (
    <div className="flex items-baseline gap-2 py-1">
      <label className="text-xs text-gray-500 w-32 shrink-0">{label}</label>
      <div className="flex-1">{children}</div>
    </div>
  );
}

/**
 * Props for the EditSection component.
 * @public
 */
export interface IEditSectionProps {
  /** Section heading text */
  readonly title: string;
  /** Section content (typically EditField components) */
  readonly children: React.ReactNode;
}

/**
 * Titled section wrapper for grouping related edit fields.
 * @public
 */
export function EditSection({ title, children }: IEditSectionProps): React.ReactElement {
  return (
    <div className="mb-4">
      <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">{title}</h4>
      {children}
    </div>
  );
}

// ============================================================================
// Text Inputs
// ============================================================================

/**
 * Props for the TextInput component.
 * @public
 */
export interface ITextInputProps {
  /** Current value */
  readonly value: string;
  /** Called when value changes */
  readonly onChange: (value: string) => void;
  /** Placeholder text */
  readonly placeholder?: string;
}

/**
 * Single-line text input for required string fields.
 * @public
 */
export function TextInput({ value, onChange, placeholder }: ITextInputProps): React.ReactElement {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-choco-primary focus:border-choco-primary"
    />
  );
}

/**
 * Props for the OptionalTextInput component.
 * @public
 */
export interface IOptionalTextInputProps {
  /** Current value (undefined means empty) */
  readonly value: string | undefined;
  /** Called when value changes (empty string → undefined) */
  readonly onChange: (value: string | undefined) => void;
  /** Placeholder text */
  readonly placeholder?: string;
}

/**
 * Single-line text input for optional string fields.
 * Empty input produces `undefined`.
 * @public
 */
export function OptionalTextInput({
  value,
  onChange,
  placeholder
}: IOptionalTextInputProps): React.ReactElement {
  return (
    <input
      type="text"
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value || undefined)}
      placeholder={placeholder}
      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-choco-primary focus:border-choco-primary"
    />
  );
}

/**
 * Props for the TextAreaInput component.
 * @public
 */
export interface ITextAreaInputProps {
  /** Current value (undefined means empty) */
  readonly value: string | undefined;
  /** Called when value changes (empty string → undefined) */
  readonly onChange: (value: string | undefined) => void;
  /** Placeholder text */
  readonly placeholder?: string;
}

/**
 * Multi-line text input for optional string fields.
 * Empty input produces `undefined`.
 * @public
 */
export function TextAreaInput({ value, onChange, placeholder }: ITextAreaInputProps): React.ReactElement {
  return (
    <textarea
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value || undefined)}
      placeholder={placeholder}
      rows={3}
      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-choco-primary focus:border-choco-primary resize-y"
    />
  );
}

// ============================================================================
// Number Input
// ============================================================================

/**
 * Props for the NumberInput component.
 * @public
 */
export interface INumberInputProps {
  /** Current value (undefined means empty) */
  readonly value: number | undefined;
  /** Called when value changes (empty input → undefined) */
  readonly onChange: (value: number | undefined) => void;
  /** Accessible label for the input */
  readonly label: string;
  /** Minimum allowed value */
  readonly min?: number;
  /** Maximum allowed value */
  readonly max?: number;
  /** Step increment */
  readonly step?: number;
}

/**
 * Numeric input for optional number fields.
 * Empty input produces `undefined`.
 * @public
 */
export function NumberInput({
  value,
  onChange,
  label,
  min,
  max,
  step
}: INumberInputProps): React.ReactElement {
  return (
    <input
      type="number"
      value={value ?? ''}
      onChange={(e) => {
        const raw = e.target.value;
        if (!raw.trim()) {
          onChange(undefined);
        } else {
          const num = parseFloat(raw);
          if (!isNaN(num)) {
            onChange(num);
          }
        }
      }}
      min={min}
      max={max}
      step={step ?? 0.1}
      className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-choco-primary focus:border-choco-primary text-right"
      aria-label={label}
    />
  );
}

// ============================================================================
// Select Input
// ============================================================================

/**
 * Props for the SelectInput component.
 * @public
 */
export interface ISelectInputProps<T extends string> {
  /** Currently selected value */
  readonly value: T;
  /** Available options */
  readonly options: ReadonlyArray<T>;
  /** Called when selection changes */
  readonly onChange: (value: T) => void;
}

/**
 * Dropdown select for enumerated string values.
 * @public
 */
export function SelectInput<T extends string>({
  value,
  options,
  onChange
}: ISelectInputProps<T>): React.ReactElement {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-choco-primary focus:border-choco-primary"
    >
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  );
}

// ============================================================================
// Tags Input
// ============================================================================

/**
 * Props for the TagsInput component.
 * @public
 */
export interface ITagsInputProps {
  /** Current tags (undefined means no tags) */
  readonly value: ReadonlyArray<string> | undefined;
  /** Called when tags change (empty → undefined) */
  readonly onChange: (value: ReadonlyArray<string> | undefined) => void;
  /** Placeholder text */
  readonly placeholder?: string;
}

/**
 * Comma-separated tag editor for string arrays.
 * Empty input produces `undefined`.
 * @public
 */
export function TagsInput({ value, onChange, placeholder }: ITagsInputProps): React.ReactElement {
  const text = value?.join(', ') ?? '';
  return (
    <input
      type="text"
      value={text}
      onChange={(e) => {
        const raw = e.target.value;
        if (!raw.trim()) {
          onChange(undefined);
        } else {
          onChange(
            raw
              .split(',')
              .map((s) => s.trim())
              .filter((s) => s.length > 0)
          );
        }
      }}
      placeholder={placeholder ?? 'comma-separated values'}
      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-choco-primary focus:border-choco-primary"
    />
  );
}

// ============================================================================
// Checkbox Input
// ============================================================================

/**
 * Props for the CheckboxInput component.
 * @public
 */
export interface ICheckboxInputProps {
  /** Current value (undefined treated as false) */
  readonly value: boolean | undefined;
  /** Called when value changes (false → undefined) */
  readonly onChange: (value: boolean | undefined) => void;
  /** Label text displayed next to the checkbox */
  readonly label: string;
}

/**
 * Checkbox input for optional boolean fields.
 * Unchecked produces `undefined`.
 * @public
 */
export function CheckboxInput({ value, onChange, label }: ICheckboxInputProps): React.ReactElement {
  return (
    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
      <input
        type="checkbox"
        checked={value ?? false}
        onChange={(e) => onChange(e.target.checked || undefined)}
        className="rounded border-gray-300 text-choco-primary focus:ring-choco-primary"
      />
      {label}
    </label>
  );
}
