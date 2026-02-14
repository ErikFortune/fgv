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
 * ComparisonView — side-by-side read-only comparison of 2–4 entities.
 * @packageDocumentation
 */

import React from 'react';

// ============================================================================
// ComparisonView Props
// ============================================================================

/**
 * A single column in the comparison view.
 * @public
 */
export interface IComparisonColumn {
  /** Unique key for React reconciliation */
  readonly key: string;
  /** Column header label */
  readonly label: string;
  /** Column content (typically a detail component) */
  readonly content: React.ReactNode;
}

/**
 * Props for the ComparisonView component.
 * @public
 */
export interface IComparisonViewProps {
  /** Columns to compare (2–4) */
  readonly columns: ReadonlyArray<IComparisonColumn>;
}

// ============================================================================
// ComparisonView Component
// ============================================================================

/**
 * Side-by-side comparison view for entities.
 *
 * Renders 2–4 entity detail views in equal-width columns with
 * synchronized scrolling (future) and column headers.
 *
 * @public
 */
export function ComparisonView(props: IComparisonViewProps): React.ReactElement {
  const { columns } = props;

  if (columns.length < 2) {
    return (
      <div className="flex flex-1 items-center justify-center text-gray-400 text-sm">
        Select at least 2 items to compare.
      </div>
    );
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      {columns.map((col) => (
        <div
          key={col.key}
          className="flex flex-col flex-1 min-w-0 border-r border-gray-200 last:border-r-0 overflow-hidden"
        >
          {/* Column header */}
          <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-200 shrink-0">
            <span className="text-xs font-medium text-gray-700 truncate block">{col.label}</span>
          </div>
          {/* Column content */}
          <div className="flex-1 overflow-y-auto">{col.content}</div>
        </div>
      ))}
    </div>
  );
}
