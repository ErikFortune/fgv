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
 * Chocolate-lab-specific detail-view components.
 *
 * Builds on `@fgv/ts-app-shell` detail primitives and adds:
 * - `NotesSection` — renders `ICategorizedNote[]`
 * - `UrlsSection` — renders `ICategorizedUrl[]`
 * - `EntityDetailHeader` — `DetailHeader` wrapper with standard Preview/Edit buttons
 *
 * @packageDocumentation
 */

import React, { useCallback, useState } from 'react';
import { ArrowUturnLeftIcon, EyeIcon, PencilSquareIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { ClipboardDocumentIcon } from '@heroicons/react/20/solid';
import { DetailHeader, DetailSection, StatusBadge } from '@fgv/ts-app-shell';
import type { Model } from '@fgv/ts-chocolate';

// ============================================================================
// NotesSection
// ============================================================================

export interface INotesSectionProps {
  readonly notes: ReadonlyArray<Model.ICategorizedNote>;
}

/**
 * Renders a list of categorized notes inside a `DetailSection`.
 * Returns `null` if notes is empty.
 * @public
 */
export function NotesSection({ notes }: INotesSectionProps): React.ReactElement | null {
  if (notes.length === 0) {
    return null;
  }
  return (
    <DetailSection title="Notes">
      {notes.map((note, i) => (
        <div key={i} className="text-sm text-gray-700 mb-1">
          <span className="text-xs text-gray-400 mr-1">[{note.category}]</span>
          {note.note}
        </div>
      ))}
    </DetailSection>
  );
}

// ============================================================================
// UrlsSection
// ============================================================================

export interface IUrlsSectionProps {
  readonly urls: ReadonlyArray<Model.ICategorizedUrl>;
}

/**
 * Renders a list of categorized URLs inside a `DetailSection`.
 * Returns `null` if urls is empty.
 * @public
 */
export function UrlsSection({ urls }: IUrlsSectionProps): React.ReactElement | null {
  if (urls.length === 0) {
    return null;
  }
  return (
    <DetailSection title="Links">
      {urls.map((u, i) => (
        <div key={i} className="text-sm mb-1">
          <span className="text-xs text-gray-400 mr-1">[{u.category}]</span>
          <a
            href={u.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-choco-primary hover:underline"
          >
            {u.url}
          </a>
        </div>
      ))}
    </DetailSection>
  );
}

// ============================================================================
// EntityDetailHeader
// ============================================================================

/**
 * Writes JSON text to the clipboard. Intended for use in `onCopyJson` handlers.
 * @public
 */
export function copyJsonToClipboard(entity: object): void {
  navigator.clipboard.writeText(JSON.stringify(entity, null, 2)).catch(() => undefined);
}

export interface IEntityDetailHeaderBadge {
  readonly label: string;
  readonly colorClass: string;
}

/**
 * Options for the copy-to-clipboard action.
 * @public
 */
export interface ICopyJsonOptions {
  /** For recipe entities: 'selected' copies only the current variation, 'all' copies every variation */
  readonly scope?: 'selected' | 'all';
}

export interface IEntityDetailHeaderProps {
  /** Primary entity name */
  readonly title: string;
  /** Optional description rendered below the status bar */
  readonly description?: string;
  /** Optional mono subtitle (e.g. entity ID) rendered in the indicators slot */
  readonly subtitle?: string;
  /** Optional badge rendered in the indicators slot */
  readonly badge?: IEntityDetailHeaderBadge;
  /** Additional indicator content rendered after badge and subtitle */
  readonly extraIndicators?: React.ReactNode;
  /** If provided, renders a clipboard icon button that calls this handler */
  readonly onCopyJson?: (options?: ICopyJsonOptions) => void;
  /** If provided, renders a Preview button in the actions slot */
  readonly onPreview?: () => void;
  /** If provided, renders an Edit button in the actions slot */
  readonly onEdit?: () => void;
  /** Additional action content rendered after Preview and Edit buttons */
  readonly extraActions?: React.ReactNode;
  /** If provided, renders an X close button as the last action */
  readonly onClose?: () => void;
}

/**
 * Chocolate-lab standard entity detail header.
 *
 * Wraps `DetailHeader` with the standard Preview/Edit button pattern
 * and badge/subtitle indicator conventions used across all entity detail views.
 *
 * For non-standard action signatures (e.g. `onEdit(spec)`), use `DetailHeader` directly
 * and build the actions slot manually.
 *
 * @public
 */
export function EntityDetailHeader({
  title,
  description,
  subtitle,
  badge,
  extraIndicators,
  onCopyJson,
  onPreview,
  onEdit,
  extraActions,
  onClose
}: IEntityDetailHeaderProps): React.ReactElement {
  const [copied, setCopied] = useState(false);

  const handleCopyJson = useCallback((): void => {
    if (!onCopyJson) return;
    onCopyJson();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [onCopyJson]);

  const indicators = (
    <>
      {badge && <StatusBadge label={badge.label} colorClass={badge.colorClass} />}
      {extraIndicators}
    </>
  );

  const actions = (
    <>
      {onCopyJson && (
        <button
          type="button"
          onClick={handleCopyJson}
          className="p-1 text-gray-400 hover:text-choco-primary hover:bg-gray-100 rounded transition-colors"
          title={copied ? 'Copied!' : 'Copy JSON to clipboard'}
        >
          <ClipboardDocumentIcon className="w-4 h-4" />
        </button>
      )}
      {onPreview && (
        <button
          type="button"
          onClick={onPreview}
          className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-600 hover:text-choco-primary hover:bg-gray-100 rounded transition-colors"
          title="Preview"
        >
          <EyeIcon className="w-4 h-4" />
          Preview
        </button>
      )}
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-600 hover:text-choco-primary hover:bg-gray-100 rounded transition-colors"
          title="Edit"
        >
          <PencilSquareIcon className="w-4 h-4" />
          Edit
        </button>
      )}
      {extraActions}
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
          title="Close"
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      )}
    </>
  );

  return (
    <DetailHeader
      title={title}
      subtitle={subtitle}
      description={description}
      indicators={indicators}
      actions={actions}
    />
  );
}

// ============================================================================
// DerivedFromIndicator
// ============================================================================

/**
 * Props for the DerivedFromIndicator component.
 * @public
 */
export interface IDerivedFromIndicatorProps {
  /** The source variation ID (e.g. "collection.recipe-id\@2024-01-15") */
  readonly sourceVariationId: string;
  /** ISO 8601 date of derivation */
  readonly derivedDate: string;
}

/**
 * Renders a compact "Adapted from [source]" indicator.
 * Used in detail and edit view headers for recipes that were derived from another.
 * @public
 */
export function DerivedFromIndicator({
  sourceVariationId,
  derivedDate
}: IDerivedFromIndicatorProps): React.ReactElement {
  const formattedDate = derivedDate.slice(0, 10);
  return (
    <span
      className="inline-flex items-center gap-1 text-xs text-gray-500 italic"
      title={`Derived on ${formattedDate}`}
    >
      <ArrowUturnLeftIcon className="h-3 w-3 text-gray-400" />
      Adapted from {sourceVariationId}
    </span>
  );
}
