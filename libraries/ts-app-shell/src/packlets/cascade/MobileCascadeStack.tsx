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
 * Mobile view-stack cascade — one full-screen column at a time with back navigation.
 * @packageDocumentation
 */

import React, { useCallback } from 'react';
import { type ICascadeContainerProps } from './CascadeContainer';

/**
 * Mobile replacement for {@link CascadeContainer}.
 *
 * Shows the rightmost (deepest) cascade column full-screen with a back button
 * that pops one level at a time. At the first column, back returns to the list
 * by calling `onPopTo(0)`.
 *
 * Accepts the same props as {@link CascadeContainer} so `CascadeContainer` can
 * delegate to it transparently on mobile.
 *
 * @public
 */
export function MobileCascadeStack(props: ICascadeContainerProps): React.ReactElement | null {
  const { columns, onPopTo, rootLabel = 'List' } = props;

  const handleBack = useCallback((): void => {
    if (columns.length > 1) {
      onPopTo(columns.length - 1);
    } else {
      onPopTo(0);
    }
  }, [columns.length, onPopTo]);

  if (columns.length === 0) {
    return null;
  }

  const currentColumn = columns[columns.length - 1];
  const backLabel = columns.length > 1 ? columns[columns.length - 2].label : rootLabel;

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Back navigation header */}
      <div className="flex items-center gap-2 px-3 py-2 bg-surface-alt border-b border-border shrink-0">
        <button
          onClick={handleBack}
          className="flex items-center gap-1 text-sm text-brand-accent hover:text-brand-primary"
          aria-label={`Back to ${backLabel}`}
        >
          <svg
            className="w-4 h-4 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          {backLabel}
        </button>
        {columns.length > 1 && (
          <span className="ml-auto text-xs text-muted truncate">{currentColumn.label}</span>
        )}
      </div>

      {/* Current column — full screen, scrollable */}
      <div className="flex flex-col flex-1 overflow-y-auto">{currentColumn.content}</div>
    </div>
  );
}
