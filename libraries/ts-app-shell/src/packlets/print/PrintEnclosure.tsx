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
 * Print enclosure component rendered inside the popup window.
 * @packageDocumentation
 */

import React, { useCallback } from 'react';
import { PrinterIcon, XMarkIcon } from '@heroicons/react/24/outline';

/**
 * Props for {@link PrintEnclosure}.
 * @public
 */
export interface IPrintEnclosureProps {
  /** Title displayed in the toolbar. */
  readonly title: string;
  /** Optional extra controls rendered in the toolbar (e.g. toggles). */
  readonly toolbarExtras?: React.ReactNode;
  /** Reference to the popup window (used for print and close actions). */
  readonly popupWindow: Window;
  /** Content to display and print. */
  readonly children: React.ReactNode;
}

/**
 * A container component rendered inside a popup window that provides a
 * toolbar with Print and Close buttons and renders children as the
 * printable content.
 *
 * @remarks
 * The toolbar is hidden when printing via CSS (`print-toolbar` class).
 * Children are rendered at full width with no scroll constraints so
 * multi-page content flows naturally to the printer.
 *
 * @public
 */
export function PrintEnclosure({
  title,
  toolbarExtras,
  popupWindow,
  children
}: IPrintEnclosureProps): React.JSX.Element {
  const handlePrint = useCallback((): void => {
    popupWindow.print();
  }, [popupWindow]);

  const handleClose = useCallback((): void => {
    popupWindow.close();
  }, [popupWindow]);

  return (
    <div>
      {/* Toolbar - hidden when printing */}
      <div className="print-toolbar sticky top-0 z-10 flex items-center justify-between gap-4 bg-white border-b border-gray-200 px-6 py-3 mb-6 shadow-sm">
        <h1 className="text-lg font-semibold text-gray-900 truncate">{title}</h1>
        <div className="flex items-center gap-3 shrink-0">
          {toolbarExtras}
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-choco-primary hover:bg-choco-primary/90 rounded-md transition-colors"
          >
            <PrinterIcon className="w-4 h-4" />
            Print
          </button>
          <button
            type="button"
            onClick={handleClose}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            <XMarkIcon className="w-4 h-4" />
            Close
          </button>
        </div>
      </div>

      {/* Printable content */}
      <div className="max-w-4xl mx-auto px-6">{children}</div>
    </div>
  );
}
