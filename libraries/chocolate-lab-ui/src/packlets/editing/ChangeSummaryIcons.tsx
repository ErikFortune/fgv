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
 * Compact icon indicators showing which categories of an entity have been modified.
 *
 * Each icon lights up (colored) when its corresponding change flag is true,
 * and stays muted (gray) otherwise.
 *
 * @packageDocumentation
 */

import React from 'react';

// ============================================================================
// Types
// ============================================================================

/**
 * A single change indicator entry.
 * @public
 */
export interface IChangeIndicator {
  /** Unique key for this indicator. */
  readonly key: string;
  /** Tooltip label shown on hover. */
  readonly label: string;
  /** The icon component (rendered at h-3.5 w-3.5). */
  readonly icon: React.ReactElement;
  /** Whether this category has changes. */
  readonly changed: boolean;
}

/**
 * Props for the ChangeSummaryIcons component.
 * @public
 */
export interface IChangeSummaryIconsProps {
  /** The change indicators to display. */
  readonly indicators: ReadonlyArray<IChangeIndicator>;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Renders a compact row of small icons indicating which categories of an entity
 * have been modified. Changed categories are shown in amber; unchanged in light gray.
 *
 * Returns null if there are no indicators to display.
 *
 * @public
 */
export function ChangeSummaryIcons({ indicators }: IChangeSummaryIconsProps): React.ReactElement | null {
  if (indicators.length === 0) {
    return null;
  }

  const anyChanged = indicators.some((i) => i.changed);
  if (!anyChanged) {
    return null;
  }

  return (
    <div className="flex items-center gap-0.5 ml-2 pl-2 border-l border-gray-200">
      {indicators.map((indicator) => (
        <span
          key={indicator.key}
          title={indicator.changed ? `${indicator.label} (modified)` : indicator.label}
          className={`inline-flex items-center p-0.5 rounded ${
            indicator.changed ? 'text-amber-600' : 'text-gray-300'
          }`}
        >
          {React.cloneElement(indicator.icon, { className: 'h-3 w-3' } as React.SVGProps<SVGSVGElement>)}
        </span>
      ))}
    </div>
  );
}
