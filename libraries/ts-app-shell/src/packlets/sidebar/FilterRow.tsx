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

import React, { useCallback, useEffect, useRef, useState } from 'react';

// ============================================================================
// Filter Option
// ============================================================================

/**
 * A single selectable filter option.
 * Generic over the value type so apps can use string IDs, enums, etc.
 * @public
 */
export interface IFilterOption<TValue> {
  /** Unique value for this option */
  readonly value: TValue;
  /** Display label */
  readonly label: string;
  /** Optional count badge */
  readonly count?: number;
}

// ============================================================================
// FilterRow Props
// ============================================================================

/**
 * Props for the FilterRow component.
 * @public
 */
export interface IFilterRowProps<TValue> {
  /** Filter label (e.g., 'Categories', 'Tags') */
  readonly label: string;
  /** Available options */
  readonly options: ReadonlyArray<IFilterOption<TValue>>;
  /** Currently selected values */
  readonly selected: ReadonlyArray<TValue>;
  /** Callback when selection changes */
  readonly onSelectionChange: (selected: ReadonlyArray<TValue>) => void;
  /** Whether multiple selections are allowed (default: true) */
  readonly multiple?: boolean;
  /** Custom equality check for values (default: ===) */
  readonly isEqual?: (a: TValue, b: TValue) => boolean;
}

// ============================================================================
// FilterRow Component
// ============================================================================

/**
 * A compact filter row with a flyout panel for selecting filter values.
 *
 * Collapsed: shows the label, active count badge, and clear button.
 * Expanded: shows a flyout overlay with checkboxes/radio buttons for each option.
 *
 * @public
 */
export function FilterRow<TValue>(props: IFilterRowProps<TValue>): React.ReactElement {
  const { label, options, selected, onSelectionChange, multiple = true, isEqual = defaultIsEqual } = props;

  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close flyout on outside click
  useEffect(() => {
    if (!open) {
      return undefined;
    }
    const handleClick = (e: MouseEvent): void => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return (): void => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const isSelected = useCallback(
    (value: TValue): boolean => selected.some((s) => isEqual(s, value)),
    [selected, isEqual]
  );

  const toggleValue = useCallback(
    (value: TValue): void => {
      if (multiple) {
        if (isSelected(value)) {
          onSelectionChange(selected.filter((s) => !isEqual(s, value)));
        } else {
          onSelectionChange([...selected, value]);
        }
      } else {
        // Single-select: toggle off if already selected, otherwise select
        if (isSelected(value)) {
          onSelectionChange([]);
        } else {
          onSelectionChange([value]);
        }
      }
    },
    [multiple, selected, onSelectionChange, isSelected, isEqual]
  );

  const clearSelection = useCallback(
    (e: React.MouseEvent): void => {
      e.stopPropagation();
      onSelectionChange([]);
    },
    [onSelectionChange]
  );

  const activeCount = selected.length;

  return (
    <div ref={containerRef} className="relative">
      {/* Collapsed row */}
      <button
        onClick={(): void => setOpen(!open)}
        className={`flex items-center justify-between w-full px-3 py-1.5 text-sm hover:bg-gray-50 transition-colors ${
          activeCount > 0 ? 'text-choco-primary font-medium' : 'text-gray-600'
        }`}
      >
        <span className="flex items-center gap-2">
          <span>{label}</span>
          {activeCount > 0 && (
            <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-xs font-medium rounded-full bg-choco-accent text-white">
              {activeCount}
            </span>
          )}
        </span>
        <span className="flex items-center gap-1">
          {activeCount > 0 && (
            <span
              onClick={clearSelection}
              className="text-gray-400 hover:text-gray-600 cursor-pointer"
              role="button"
              aria-label={`Clear ${label} filter`}
            >
              &times;
            </span>
          )}
          <span className="text-gray-400 text-xs">{open ? '\u25B4' : '\u25BE'}</span>
        </span>
      </button>

      {/* Flyout panel */}
      {open && (
        <div className="absolute left-0 right-0 z-40 mt-0.5 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {options.length === 0 ? (
            <div className="px-3 py-2 text-xs text-gray-400">No options available</div>
          ) : (
            options.map((option, idx) => {
              const checked = isSelected(option.value);
              return (
                <button
                  key={idx}
                  onClick={(): void => toggleValue(option.value)}
                  className={`flex items-center gap-2 w-full px-3 py-1.5 text-sm text-left hover:bg-gray-50 transition-colors ${
                    checked ? 'text-choco-primary font-medium' : 'text-gray-700'
                  }`}
                >
                  <span
                    className={`inline-flex items-center justify-center w-4 h-4 border rounded ${
                      multiple ? 'rounded' : 'rounded-full'
                    } ${checked ? 'bg-choco-accent border-choco-accent text-white' : 'border-gray-300'}`}
                  >
                    {checked && <span className="text-[10px]">{'\u2713'}</span>}
                  </span>
                  <span className="flex-1 truncate">{option.label}</span>
                  {option.count !== undefined && (
                    <span className="text-xs text-gray-400">{option.count}</span>
                  )}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Helpers
// ============================================================================

function defaultIsEqual<TValue>(a: TValue, b: TValue): boolean {
  return a === b;
}
