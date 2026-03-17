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
 * Opens a popup window for print-optimized content rendering.
 * @packageDocumentation
 */

import React from 'react';
import { createRoot } from 'react-dom/client';

import { PrintEnclosure } from './PrintEnclosure';

/**
 * Options for {@link openPrintWindow}.
 * @public
 */
export interface IPrintWindowOptions {
  /** Title for the popup window. */
  readonly title: string;
  /** Width of the popup window in pixels (default 900). */
  readonly width?: number;
  /** Height of the popup window in pixels (default 700). */
  readonly height?: number;
  /** Extra toolbar controls to render in the print enclosure header. */
  readonly toolbarExtras?: React.ReactNode;
}

/**
 * Clones all stylesheet-related elements from the source document head
 * into the target document head so that styles are available in the popup.
 */
function cloneStyles(source: Document, target: Document): void {
  const styles = Array.from(source.querySelectorAll('style'));
  for (const style of styles) {
    target.head.appendChild(style.cloneNode(true));
  }
  const links = Array.from(source.querySelectorAll('link[rel="stylesheet"]'));
  for (const link of links) {
    target.head.appendChild(link.cloneNode(true));
  }
}

/**
 * Opens a popup window and renders the given React content inside a
 * {@link PrintEnclosure} with Print and Close toolbar buttons.
 *
 * @remarks
 * Must be called synchronously from a user click handler to avoid
 * popup blockers. If the popup is blocked, returns `null`.
 *
 * Styles are cloned from the parent document so that Tailwind and other
 * CSS frameworks work in the popup. An independent React root is created
 * in the popup (not a portal) so the popup is fully self-contained.
 *
 * @public
 */
export function openPrintWindow(content: React.ReactElement, options: IPrintWindowOptions): Window | null {
  const { title, width = 900, height = 700, toolbarExtras } = options;

  const popup = window.open('', '', `width=${width},height=${height}`);
  if (!popup) {
    return null;
  }

  popup.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${title.replace(/</g, '&lt;')}</title>
  <style>
    @media screen {
      body {
        background: #f9fafb;
        padding: 2rem;
        margin: 0;
      }
    }
    @media print {
      body {
        margin: 0;
        padding: 0;
        background: white;
      }
      .print-toolbar {
        display: none !important;
      }
      .break-before-page {
        break-before: page;
      }
      .break-inside-avoid {
        break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div id="print-root"></div>
</body>
</html>`);
  popup.document.close();

  cloneStyles(document, popup.document);

  const container = popup.document.getElementById('print-root');
  if (!container) {
    popup.close();
    return null;
  }

  const root = createRoot(container);
  root.render(
    <PrintEnclosure title={title} toolbarExtras={toolbarExtras} popupWindow={popup}>
      {content}
    </PrintEnclosure>
  );

  popup.addEventListener('beforeunload', () => {
    root.unmount();
  });

  return popup;
}
