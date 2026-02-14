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
 * EntityRow — clickable text row with optional discrete swap-icon for alternates.
 *
 * Renders a uniform row regardless of whether alternates exist:
 * - Left slot: swap icon (when alternates exist) or empty spacer
 * - Name text: clickable for drill-down
 * - Optional right-side content (amount, sublabel, etc.)
 * - Drill-down chevron ›
 *
 * @packageDocumentation
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { ISelectableItem } from './PreferredSelector';

// ============================================================================
// EntityRow Types
// ============================================================================

/**
 * Props for the EntityRow component.
 * @public
 */
export interface IEntityRowProps<TId extends string = string> {
  /** All options (preferred + alternates). If length === 1, no swap icon is shown. */
  readonly items: ReadonlyArray<ISelectableItem<TId>>;
  /** ID of the preferred/default item (shows ★ marker) */
  readonly preferredId?: TId;
  /** Controlled selected ID (overrides internal state). Use with onSelect. */
  readonly selectedId?: TId;
  /** Callback when the displayed item changes via the swap picker */
  readonly onSelect?: (id: TId) => void;
  /** Callback when the row is clicked (drill-down navigation) */
  readonly onClick?: (id: TId) => void;
  /** Callback to compare items. When provided, popover shows compare buttons. */
  readonly onCompare?: (ids: ReadonlyArray<TId>) => void;
  /** Optional right-side content rendered before the › chevron */
  readonly rightContent?: React.ReactNode;
  /** Optional section label displayed above the row */
  readonly label?: string;
}

// ============================================================================
// EntityRow Component
// ============================================================================

/**
 * A clickable text row with an optional discrete swap-icon popover for
 * switching between alternates. Clicking the row itself always triggers
 * drill-down navigation. The swap icon opens a small picker to change
 * which alternate is displayed.
 *
 * @public
 */
export function EntityRow<TId extends string = string>(props: IEntityRowProps<TId>): React.ReactElement {
  const { items, preferredId, onClick, onSelect, onCompare, rightContent, label } = props;

  const hasAlternates = items.length > 1;
  const [internalId, setInternalId] = useState<TId>(preferredId ?? items[0]?.id ?? ('' as TId));
  const displayedId = props.selectedId ?? internalId;
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const pickerBtnRef = useRef<HTMLButtonElement>(null);

  const displayedItem = useMemo(
    () => items.find((i) => i.id === displayedId) ?? items[0],
    [items, displayedId]
  );
  const isPreferred = displayedId === preferredId;

  // Close picker on outside click
  useEffect(() => {
    if (!pickerOpen) {
      return;
    }
    const handleClickOutside = (e: MouseEvent): void => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(e.target as Node) &&
        pickerBtnRef.current &&
        !pickerBtnRef.current.contains(e.target as Node)
      ) {
        setPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return (): void => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [pickerOpen]);

  const handleRowClick = useCallback((): void => {
    if (onClick) {
      onClick(displayedId);
    }
  }, [onClick, displayedId]);

  const handleRowKeyDown = useCallback(
    (e: React.KeyboardEvent): void => {
      if (onClick && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        onClick(displayedId);
      }
    },
    [onClick, displayedId]
  );

  const handlePickerToggle = useCallback((e: React.MouseEvent): void => {
    e.stopPropagation();
    setPickerOpen((prev) => !prev);
  }, []);

  const handlePickItem = useCallback(
    (id: TId): void => {
      setInternalId(id);
      if (onSelect) {
        onSelect(id);
      }
      setPickerOpen(false);
    },
    [onSelect]
  );

  const handleCompareAll = useCallback((): void => {
    if (onCompare) {
      onCompare(items.map((i) => i.id));
    }
    setPickerOpen(false);
  }, [onCompare, items]);

  return (
    <div className="relative">
      {label && (
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{label}</div>
      )}
      <div
        className={`flex items-center gap-1.5 py-1.5 pl-0 pr-2 rounded-md ${
          onClick ? 'cursor-pointer hover:bg-gray-50 transition-colors' : ''
        }`}
        onClick={handleRowClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        onKeyDown={handleRowKeyDown}
      >
        {/* Fixed-width left slot for swap icon — keeps names aligned */}
        <span className="w-4 shrink-0 flex items-center justify-center">
          {hasAlternates ? (
            <button
              ref={pickerBtnRef}
              onClick={handlePickerToggle}
              className="text-gray-400 hover:text-choco-accent p-0 transition-colors"
              aria-label="Switch alternate"
              tabIndex={-1}
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                />
              </svg>
            </button>
          ) : null}
        </span>
        <span className="text-sm text-gray-800 flex-1 truncate">
          {displayedItem?.label ?? ''}
          {hasAlternates && isPreferred && <span className="ml-1 text-xs text-amber-500">★</span>}
          {displayedItem?.sublabel && (
            <span className="ml-1.5 text-xs text-gray-400">{displayedItem.sublabel}</span>
          )}
        </span>
        {rightContent}
        {onClick && <span className="text-gray-300 text-xs shrink-0">›</span>}
      </div>

      {/* Alternate picker popover */}
      {pickerOpen && (
        <div
          ref={pickerRef}
          className="absolute left-0 z-50 mt-0.5 min-w-[180px] max-h-[200px] bg-white border border-gray-200 rounded-lg shadow-lg flex flex-col overflow-hidden"
        >
          <div className="flex items-center justify-between px-2.5 py-1 border-b border-gray-100 shrink-0">
            <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">
              {onCompare ? 'Options' : 'Alternates'}
            </span>
            {onCompare && items.length >= 2 && (
              <button
                onClick={(e): void => {
                  e.stopPropagation();
                  handleCompareAll();
                }}
                className="text-[10px] text-choco-accent hover:text-choco-primary transition-colors font-medium"
              >
                Compare All
              </button>
            )}
          </div>
          <div className="overflow-y-auto flex-1">
            {items.map((item) => {
              const isCurrent = item.id === displayedId;
              const isPref = item.id === preferredId;
              return (
                <button
                  key={item.id}
                  onClick={(e): void => {
                    e.stopPropagation();
                    handlePickItem(item.id);
                  }}
                  className={`flex items-center gap-2 w-full px-2.5 py-1.5 text-left text-sm transition-colors ${
                    isCurrent
                      ? 'bg-choco-accent/10 text-choco-primary font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="w-3 shrink-0 text-center text-xs">
                    {isPref ? <span className="text-amber-500">★</span> : ''}
                  </span>
                  <span className="flex-1 min-w-0 truncate">
                    {item.label}
                    {item.sublabel && <span className="ml-1.5 text-xs text-gray-400">{item.sublabel}</span>}
                  </span>
                  {isCurrent && (
                    <svg
                      className="w-3.5 h-3.5 text-choco-accent shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
