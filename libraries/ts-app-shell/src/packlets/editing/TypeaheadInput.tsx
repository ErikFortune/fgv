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
 * TypeaheadInput — text input with custom autocomplete dropdown supporting
 * tiered suggestions and built-in blur resolution.
 * @packageDocumentation
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { type ITypeaheadSuggestion, useTypeaheadMatch } from './useTypeaheadMatch';

// ============================================================================
// Types
// ============================================================================

/**
 * Props for the TypeaheadInput component.
 * @public
 */
export interface ITypeaheadInputProps<TId extends string = string> {
  /** Current text value (controlled). */
  readonly value: string;
  /** Called on every keystroke. */
  readonly onChange: (value: string) => void;
  /** Full catalog of suggestions (lower priority). */
  readonly suggestions: ReadonlyArray<ITypeaheadSuggestion<TId>>;
  /** Optional priority suggestions shown first (e.g. recipe alternates). */
  readonly prioritySuggestions?: ReadonlyArray<ITypeaheadSuggestion<TId>>;
  /** Called when a suggestion is definitively selected (click, Enter, blur auto-resolve). */
  readonly onSelect: (suggestion: ITypeaheadSuggestion<TId>) => void;
  /** Called on blur/Enter/Tab when input cannot be resolved to a single suggestion. */
  readonly onUnresolved?: (text: string) => void;
  /** Placeholder text for the input. */
  readonly placeholder?: string;
  /** Additional CSS class for the input element. */
  readonly className?: string;
  /** If true, the input is disabled. */
  readonly disabled?: boolean;
  /** Maximum dropdown height in pixels. Default: 240. */
  readonly maxHeight?: number;
  /** If true, the input is focused on mount. */
  readonly autoFocus?: boolean;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Text input with a custom autocomplete dropdown supporting tiered suggestions.
 *
 * Priority suggestions (e.g. recipe alternates) appear first, visually separated
 * from the full catalog. On blur, applies resolution logic: exact match → auto-select,
 * single partial match → auto-select, else fires `onUnresolved`.
 *
 * @public
 */
export function TypeaheadInput<TId extends string = string>(
  props: ITypeaheadInputProps<TId>
): React.ReactElement {
  const {
    value,
    onChange,
    suggestions,
    prioritySuggestions,
    onSelect,
    onUnresolved,
    placeholder,
    className,
    disabled,
    maxHeight = 240,
    autoFocus
  } = props;

  const [isOpen, setIsOpen] = useState(false);
  const [focusIndex, setFocusIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const mouseDownOnDropdownRef = useRef(false);

  const matcher = useTypeaheadMatch(suggestions, prioritySuggestions);

  // ---- Filtered suggestions ----

  const filtered = useMemo(() => matcher.filterSuggestions(value), [matcher, value]);

  const flatItems = useMemo(
    () => [...filtered.priority, ...filtered.catalog],
    [filtered.priority, filtered.catalog]
  );

  const hasPriorityItems = filtered.priority.length > 0;
  const hasCatalogItems = filtered.catalog.length > 0;
  const hasItems = flatItems.length > 0;

  // Reset focus index when suggestions change
  useEffect(() => {
    setFocusIndex(-1);
  }, [value]);

  // Scroll focused item into view
  useEffect(() => {
    if (isOpen && focusIndex >= 0 && itemRefs.current[focusIndex]) {
      itemRefs.current[focusIndex]?.scrollIntoView({ block: 'nearest' });
    }
  }, [isOpen, focusIndex]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent): void => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return (): void => {
      document.removeEventListener('mousedown', handler);
    };
  }, [isOpen]);

  // ---- Selection ----

  const handleSelect = useCallback(
    (item: ITypeaheadSuggestion<TId>): void => {
      onSelect(item);
      setIsOpen(false);
      setFocusIndex(-1);
    },
    [onSelect]
  );

  const handleResolve = useCallback(
    (text: string): void => {
      const trimmed = text.trim();
      if (!trimmed) {
        setIsOpen(false);
        return;
      }
      const match = matcher.resolveOnBlur(trimmed);
      if (match) {
        handleSelect(match);
      } else if (onUnresolved) {
        onUnresolved(trimmed);
        setIsOpen(false);
      } else {
        setIsOpen(false);
      }
    },
    [matcher, handleSelect, onUnresolved]
  );

  // ---- Input handlers ----

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>): void => {
      onChange(e.target.value);
      if (!isOpen) {
        setIsOpen(true);
      }
    },
    [onChange, isOpen]
  );

  const handleFocus = useCallback((): void => {
    inputRef.current?.select();
    if (hasItems) {
      setIsOpen(true);
    }
  }, [hasItems]);

  const handleBlur = useCallback((): void => {
    // Guard: don't resolve if user is clicking an item in the dropdown
    if (mouseDownOnDropdownRef.current) {
      mouseDownOnDropdownRef.current = false;
      return;
    }
    handleResolve(value);
  }, [value, handleResolve]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent): void => {
      if (!isOpen) {
        if (e.key === 'ArrowDown' && hasItems) {
          e.preventDefault();
          setIsOpen(true);
          setFocusIndex(0);
        }
        return;
      }

      switch (e.key) {
        case 'Escape': {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(false);
          setFocusIndex(-1);
          break;
        }
        case 'ArrowDown': {
          e.preventDefault();
          setFocusIndex((prev) => (prev < flatItems.length - 1 ? prev + 1 : 0));
          break;
        }
        case 'ArrowUp': {
          e.preventDefault();
          setFocusIndex((prev) => (prev > 0 ? prev - 1 : flatItems.length - 1));
          break;
        }
        case 'Enter': {
          e.preventDefault();
          if (focusIndex >= 0 && focusIndex < flatItems.length) {
            handleSelect(flatItems[focusIndex]);
          } else {
            handleResolve(value);
          }
          break;
        }
        case 'Tab': {
          // Allow default tab behavior but resolve first
          handleResolve(value);
          break;
        }
        default:
          break;
      }
    },
    [isOpen, hasItems, flatItems, focusIndex, handleSelect, handleResolve, value]
  );

  // ---- Dropdown mouse guard ----

  const handleDropdownMouseDown = useCallback((): void => {
    mouseDownOnDropdownRef.current = true;
  }, []);

  // ---- Render ----

  const priorityEndIndex = filtered.priority.length;

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        autoFocus={autoFocus}
        className={
          className ??
          'w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-choco-primary focus:border-choco-primary'
        }
        role="combobox"
        aria-expanded={isOpen}
        aria-autocomplete="list"
        autoComplete="off"
      />

      {isOpen && hasItems && (
        <div
          ref={dropdownRef}
          className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden"
          style={{ maxHeight }}
          role="listbox"
          onMouseDown={handleDropdownMouseDown}
        >
          <div className="overflow-y-auto" style={{ maxHeight }}>
            {/* Priority items */}
            {hasPriorityItems &&
              filtered.priority.map((item, index) => {
                const isFocused = index === focusIndex;
                return (
                  <button
                    key={item.id}
                    ref={(el): void => {
                      itemRefs.current[index] = el;
                    }}
                    role="option"
                    aria-selected={isFocused}
                    onClick={(): void => handleSelect(item)}
                    className={`flex items-center w-full px-2.5 py-1.5 text-left text-sm transition-colors border-l-2 ${
                      isFocused
                        ? 'bg-gray-50 text-gray-800 border-choco-primary/50'
                        : 'text-gray-700 hover:bg-gray-50 border-choco-primary/20'
                    }`}
                  >
                    <span className="flex-1 min-w-0 truncate">{item.name}</span>
                  </button>
                );
              })}

            {/* Separator */}
            {hasPriorityItems && hasCatalogItems && <div className="border-t border-gray-200 my-0.5" />}

            {/* Catalog items */}
            {hasCatalogItems &&
              filtered.catalog.map((item, catalogIndex) => {
                const flatIndex = priorityEndIndex + catalogIndex;
                const isFocused = flatIndex === focusIndex;
                return (
                  <button
                    key={item.id}
                    ref={(el): void => {
                      itemRefs.current[flatIndex] = el;
                    }}
                    role="option"
                    aria-selected={isFocused}
                    onClick={(): void => handleSelect(item)}
                    className={`flex items-center w-full px-2.5 py-1.5 text-left text-sm transition-colors ${
                      isFocused ? 'bg-gray-50 text-gray-800' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="flex-1 min-w-0 truncate">{item.name}</span>
                  </button>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
