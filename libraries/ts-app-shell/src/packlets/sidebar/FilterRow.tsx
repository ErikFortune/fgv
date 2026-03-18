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

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

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

/** Minimum number of options before showing the search-within-filter input */
const SEARCH_THRESHOLD: number = 8;

/**
 * A compact filter row with a right-side flyout overlay for selecting filter values.
 *
 * Collapsed: shows the label, status summary text, and a `\u203A` chevron.
 * Expanded: a flyout panel slides out to the right of the sidebar, overlaying the main pane.
 *
 * @public
 */
export function FilterRow<TValue>(props: IFilterRowProps<TValue>): React.ReactElement {
  const { label, options, selected, onSelectionChange, multiple = true, isEqual = defaultIsEqual } = props;

  const [open, setOpen] = useState(false);
  const [flyoutSearch, setFlyoutSearch] = useState('');
  const rowRef = useRef<HTMLDivElement>(null);
  const flyoutRef = useRef<HTMLDivElement>(null);

  // Close flyout on outside click (check both row and flyout)
  useEffect(() => {
    if (!open) {
      return undefined;
    }
    const handleClick = (e: MouseEvent): void => {
      const target = e.target as Node;
      if (
        rowRef.current &&
        !rowRef.current.contains(target) &&
        flyoutRef.current &&
        !flyoutRef.current.contains(target)
      ) {
        setOpen(false);
        setFlyoutSearch('');
      }
    };
    document.addEventListener('mousedown', handleClick);
    return (): void => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // Close flyout on Escape
  useEffect(() => {
    if (!open) {
      return undefined;
    }
    const handleKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        setOpen(false);
        setFlyoutSearch('');
      }
    };
    document.addEventListener('keydown', handleKey);
    return (): void => document.removeEventListener('keydown', handleKey);
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

  // Status summary text for the collapsed row
  const statusText = useMemo((): string => {
    if (activeCount === 0) {
      return 'All';
    }
    if (activeCount === 1) {
      // Show the label of the single selected option
      const sel = selected[0];
      const match = options.find((o) => isEqual(o.value, sel));
      return match ? match.label : '1 selected';
    }
    return `${activeCount} selected`;
  }, [activeCount, selected, options, isEqual]);

  // Filter options by flyout search
  const filteredOptions = useMemo(() => {
    const q = flyoutSearch.trim().toLowerCase();
    if (q.length === 0) {
      return options;
    }
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, flyoutSearch]);

  // Compute flyout position: anchored to the right edge of the sidebar row, aligned vertically
  const [flyoutStyle, setFlyoutStyle] = useState<React.CSSProperties>({});
  useEffect(() => {
    if (!open || !rowRef.current) {
      return;
    }
    const rect = rowRef.current.getBoundingClientRect();
    // Find the sidebar container (the <aside> ancestor)
    let sidebar: HTMLElement | null = rowRef.current;
    while (sidebar && sidebar.tagName !== 'ASIDE') {
      sidebar = sidebar.parentElement;
    }
    const rightEdge = sidebar ? sidebar.getBoundingClientRect().right : rect.right;

    // Flyout appears at the right edge of the sidebar, vertically aligned with the row
    const maxHeight = Math.min(400, window.innerHeight - rect.top - 8);
    setFlyoutStyle({
      position: 'fixed',
      top: rect.top,
      left: rightEdge,
      width: 280,
      maxHeight,
      zIndex: 50
    });
  }, [open]);

  const handleToggle = useCallback((): void => {
    setOpen((prev) => {
      if (prev) {
        setFlyoutSearch('');
      }
      return !prev;
    });
  }, []);

  return (
    <div ref={rowRef}>
      {/* Collapsed row */}
      <button
        onClick={handleToggle}
        className={`flex items-center justify-between w-full px-3 py-1.5 text-sm hover:bg-hover transition-colors ${
          activeCount > 0 ? 'text-brand-primary font-medium' : 'text-secondary'
        }`}
      >
        <span className="truncate">{label}</span>
        <span className="flex items-center gap-1.5 shrink-0 ml-2">
          {activeCount > 0 && (
            <span
              onClick={clearSelection}
              className="text-muted hover:text-secondary cursor-pointer text-xs"
              role="button"
              aria-label={`Clear ${label} filter`}
            >
              {'\u00D7'}
            </span>
          )}
          <span className={`text-xs ${activeCount > 0 ? 'text-brand-accent' : 'text-muted'}`}>
            {statusText}
          </span>
          <span className="text-muted text-xs">{'\u203A'}</span>
        </span>
      </button>

      {/* Right-side flyout overlay */}
      {open && (
        <div
          ref={flyoutRef}
          className="bg-surface border border-border rounded-r-lg shadow-xl overflow-hidden flex flex-col"
          style={flyoutStyle}
        >
          {/* Flyout header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-border-subtle bg-surface-alt">
            <span className="text-xs font-medium text-secondary">{label}</span>
            {activeCount > 0 && (
              <button
                onClick={(): void => onSelectionChange([])}
                className="text-xs text-brand-accent hover:text-brand-primary"
              >
                Clear
              </button>
            )}
          </div>

          {/* Search within filter (for long lists) */}
          {options.length >= SEARCH_THRESHOLD && (
            <div className="px-3 py-1.5 border-b border-border-subtle">
              <input
                type="text"
                value={flyoutSearch}
                onChange={(e): void => setFlyoutSearch(e.target.value)}
                placeholder={`Search ${label.toLowerCase()}...`}
                className="w-full px-2 py-1 text-xs border border-border rounded bg-surface text-primary focus:outline-none focus:border-focus-ring"
                autoFocus
              />
            </div>
          )}

          {/* Options list */}
          <div className="flex-1 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-xs text-muted">
                {options.length === 0 ? 'No options available' : 'No matches'}
              </div>
            ) : (
              filteredOptions.map((option, idx) => {
                const checked = isSelected(option.value);
                return (
                  <button
                    key={idx}
                    onClick={(): void => toggleValue(option.value)}
                    className={`flex items-center gap-2 w-full px-3 py-1.5 text-sm text-left hover:bg-hover transition-colors ${
                      checked ? 'text-brand-primary font-medium' : 'text-secondary'
                    }`}
                  >
                    <span
                      className={`inline-flex items-center justify-center w-4 h-4 border rounded ${
                        multiple ? 'rounded' : 'rounded-full'
                      } ${checked ? 'bg-brand-accent border-brand-accent text-white' : 'border-border'}`}
                    >
                      {checked && <span className="text-[10px]">{'\u2713'}</span>}
                    </span>
                    <span className="flex-1 truncate">{option.label}</span>
                    {option.count !== undefined && <span className="text-xs text-muted">{option.count}</span>}
                  </button>
                );
              })
            )}
          </div>
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
