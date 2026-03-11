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
 * Generic detail-view primitive components.
 *
 * Domain-agnostic building blocks for entity detail panels:
 * - `DetailSection` — labeled section wrapper
 * - `DetailRow` — key/value row with spread or inline layout
 * - `TagList` — pill tag row
 * - `StatusBadge` — colored pill badge (caller supplies color classes)
 * - `DetailHeader` — two-line header with indicators and action slots
 *
 * @packageDocumentation
 */

import React from 'react';
import { XMarkIcon } from '@heroicons/react/20/solid';

// ============================================================================
// DetailSection
// ============================================================================

export interface IDetailSectionProps {
  readonly title: string;
  readonly children: React.ReactNode;
}

/**
 * Labeled section wrapper with uppercase tracking header.
 * @public
 */
export function DetailSection({ title, children }: IDetailSectionProps): React.ReactElement {
  return (
    <div className="mb-4">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">{title}</h3>
      {children}
    </div>
  );
}

// ============================================================================
// DetailRow
// ============================================================================

export interface IDetailRowProps {
  readonly label: string;
  readonly value: React.ReactNode;
  /**
   * Layout variant:
   * - `'spread'` (default) — label left, value right, justify-between
   * - `'inline'` — label fixed-width, value follows immediately
   */
  readonly layout?: 'spread' | 'inline';
}

/**
 * Key/value row for detail panels.
 * Returns `null` if `value` is `null` or `undefined`.
 * @public
 */
export function DetailRow({ label, value, layout = 'spread' }: IDetailRowProps): React.ReactElement | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (layout === 'inline') {
    return (
      <div className="flex items-baseline gap-2 py-0.5">
        <span className="text-xs text-gray-500 w-32 shrink-0">{label}</span>
        <span className="text-sm text-gray-800">{value}</span>
      </div>
    );
  }
  return (
    <div className="flex items-baseline justify-between py-0.5 text-sm">
      <span className="text-gray-500 shrink-0 mr-2">{label}</span>
      <span className="text-gray-900 text-right">{value}</span>
    </div>
  );
}

// ============================================================================
// TagList
// ============================================================================

export interface ITagListProps {
  readonly tags: ReadonlyArray<string>;
}

/**
 * Horizontal pill row for string tags. Returns `null` if tags is empty.
 * @public
 */
export function TagList({ tags }: ITagListProps): React.ReactElement | null {
  if (tags.length === 0) {
    return null;
  }
  return (
    <div className="flex flex-wrap gap-1">
      {tags.map((tag) => (
        <span key={tag} className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">
          {tag}
        </span>
      ))}
    </div>
  );
}

// ============================================================================
// StatusBadge
// ============================================================================

export interface IStatusBadgeProps {
  readonly label: string;
  /** Tailwind color classes, e.g. `'bg-amber-100 text-amber-800'` */
  readonly colorClass: string;
}

/**
 * Generic pill badge. Caller supplies the Tailwind color classes.
 * @public
 */
export function StatusBadge({ label, colorClass }: IStatusBadgeProps): React.ReactElement {
  return (
    <span className={`inline-block px-2 py-0.5 text-[11px] font-medium rounded-full ${colorClass}`}>
      {label}
    </span>
  );
}

// ============================================================================
// DetailHeader
// ============================================================================

export interface IDetailHeaderProps {
  /** Primary entity name — rendered full-width on its own line */
  readonly title: string;
  /** Optional de-emphasized subtitle (e.g. entity ID) rendered below the title */
  readonly subtitle?: string;
  /** Optional description rendered below the status bar */
  readonly description?: string;
  /** Left slot of the status bar — badges, icons, etc. */
  readonly indicators?: React.ReactNode;
  /** Right slot of the status bar — action buttons */
  readonly actions?: React.ReactNode;
  /** If provided, renders a close button in the upper-right corner, inline with the title */
  readonly onClose?: () => void;
}

/**
 * Three-line entity detail header.
 *
 * Line 1: full-width `title` (bold headline)
 * Line 2: optional `subtitle` (de-emphasized, monospace — e.g. entity ID)
 * Line 3: `indicators` left-justified, `actions` right-justified (status bar)
 * Below: optional `description`
 *
 * Both `indicators` and `actions` are `React.ReactNode` — callers own the content.
 * @public
 */
export function DetailHeader({
  title,
  subtitle,
  description,
  indicators,
  actions,
  onClose
}: IDetailHeaderProps): React.ReactElement {
  return (
    <div className="mb-4 relative">
      <div className="flex items-start">
        <h2 className="text-lg font-semibold text-gray-900 flex-1 min-w-0">{title}</h2>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            title="Close"
            className="shrink-0 ml-2 mt-0.5 p-0.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        )}
      </div>
      {subtitle && <p className="text-xs text-gray-400 font-mono mt-0.5 mb-1">{subtitle}</p>}
      {(indicators !== undefined || actions !== undefined) && (
        <div className="flex items-center justify-between gap-2 mt-1">
          <div className="flex items-center gap-2">{indicators}</div>
          {actions !== undefined && <div className="flex items-center gap-1 shrink-0">{actions}</div>}
        </div>
      )}
      {description && <p className="text-sm text-gray-600 mt-1">{description}</p>}
    </div>
  );
}
