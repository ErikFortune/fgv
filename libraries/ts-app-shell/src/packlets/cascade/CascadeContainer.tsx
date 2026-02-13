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
 * Column cascade container — horizontal scroll of detail columns.
 * @packageDocumentation
 */

import React, { useEffect, useRef } from 'react';

// ============================================================================
// Cascade Column
// ============================================================================

/**
 * Describes a single column in the cascade.
 * @public
 */
export interface ICascadeColumn {
  /** Unique key for React reconciliation */
  readonly key: string;
  /** Breadcrumb label for this column */
  readonly label: string;
  /** Column content */
  readonly content: React.ReactNode;
}

// ============================================================================
// CascadeContainer Props
// ============================================================================

/**
 * Props for the CascadeContainer component.
 * @public
 */
export interface ICascadeContainerProps {
  /** Ordered columns (left-to-right) */
  readonly columns: ReadonlyArray<ICascadeColumn>;
  /** Callback to pop the cascade back to a specific depth (0 = clear all) */
  readonly onPopTo: (depth: number) => void;
  /** Minimum column width in CSS units (default: '400px') */
  readonly minColumnWidth?: string;
}

// ============================================================================
// CascadeContainer Component
// ============================================================================

/**
 * Horizontal scroll container for the column cascade.
 *
 * Renders a breadcrumb trail at the top and horizontally-scrollable
 * detail columns below. Auto-scrolls to the rightmost column when
 * a new column is pushed.
 *
 * @public
 */
export function CascadeContainer(props: ICascadeContainerProps): React.ReactElement | null {
  const { columns, onPopTo, minColumnWidth = '400px' } = props;
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to rightmost column when columns change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        left: scrollRef.current.scrollWidth,
        behavior: 'smooth'
      });
    }
  }, [columns.length]);

  if (columns.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Breadcrumb trail */}
      <div className="flex items-center gap-1 px-3 py-1.5 bg-gray-50 border-b border-gray-200 text-xs shrink-0 overflow-x-auto">
        <button
          onClick={(): void => onPopTo(0)}
          className="text-choco-accent hover:text-choco-primary hover:underline shrink-0"
        >
          List
        </button>
        {columns.map((col, idx) => (
          <React.Fragment key={col.key}>
            <span className="text-gray-400 shrink-0">/</span>
            {idx < columns.length - 1 ? (
              <button
                onClick={(): void => onPopTo(idx + 1)}
                className="text-choco-accent hover:text-choco-primary hover:underline truncate max-w-[200px] shrink-0"
              >
                {col.label}
              </button>
            ) : (
              <span className="text-gray-700 font-medium truncate max-w-[200px] shrink-0">{col.label}</span>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Columns */}
      <div ref={scrollRef} className="flex flex-1 overflow-x-auto overflow-y-hidden">
        {columns.map((col) => (
          <div
            key={col.key}
            className="flex flex-col shrink-0 border-r border-gray-200 overflow-y-auto"
            style={{ minWidth: minColumnWidth, width: minColumnWidth }}
          >
            {col.content}
          </div>
        ))}
      </div>
    </div>
  );
}
