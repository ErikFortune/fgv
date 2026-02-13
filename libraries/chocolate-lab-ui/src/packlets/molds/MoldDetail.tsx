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
 * Read-only mold detail view.
 * @packageDocumentation
 */

import React from 'react';

import type { LibraryRuntime, Model, Entities } from '@fgv/ts-chocolate';

// ============================================================================
// Props
// ============================================================================

/**
 * Props for the MoldDetail component.
 * @public
 */
export interface IMoldDetailProps {
  /** The resolved mold to display */
  readonly mold: LibraryRuntime.IMold;
}

// ============================================================================
// Shared Helpers
// ============================================================================

function DetailSection({
  title,
  children
}: {
  readonly title: string;
  readonly children: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="mb-4">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">{title}</h3>
      {children}
    </div>
  );
}

function DetailRow({
  label,
  value
}: {
  readonly label: string;
  readonly value: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="flex items-baseline justify-between py-0.5 text-sm">
      <span className="text-gray-500 shrink-0 mr-2">{label}</span>
      <span className="text-gray-900 text-right">{value}</span>
    </div>
  );
}

function CategoryBadge({ label }: { readonly label: string }): React.ReactElement {
  return (
    <span className="inline-block px-2 py-0.5 text-[11px] font-medium rounded-full bg-choco-primary/10 text-choco-primary">
      {label}
    </span>
  );
}

function TagList({ tags }: { readonly tags: ReadonlyArray<string> }): React.ReactElement | null {
  if (tags.length === 0) {
    return null;
  }
  return (
    <DetailSection title="Tags">
      <div className="flex flex-wrap gap-1">
        {tags.map((tag) => (
          <span key={tag} className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">
            {tag}
          </span>
        ))}
      </div>
    </DetailSection>
  );
}

// ============================================================================
// Cavities Section
// ============================================================================

function CavitiesSection({ mold }: { readonly mold: LibraryRuntime.IMold }): React.ReactElement {
  const cavities = mold.cavities;
  return (
    <DetailSection title="Cavities">
      {cavities.kind === 'grid' ? (
        <DetailRow label="Layout" value={`${cavities.columns} × ${cavities.rows} grid`} />
      ) : (
        <DetailRow label="Count" value={cavities.count} />
      )}
      <DetailRow label="Total cavities" value={mold.cavityCount} />
      {mold.cavityWeight !== undefined && <DetailRow label="Cavity weight" value={`${mold.cavityWeight}g`} />}
      {mold.totalCapacity !== undefined && (
        <DetailRow label="Total capacity" value={`${mold.totalCapacity}g`} />
      )}
    </DetailSection>
  );
}

// ============================================================================
// Dimensions Section
// ============================================================================

function DimensionsSection({
  dimensions
}: {
  readonly dimensions: Entities.ICavityDimensions;
}): React.ReactElement {
  return (
    <DetailSection title="Cavity Dimensions">
      <DetailRow label="Width" value={`${dimensions.width}mm`} />
      <DetailRow label="Length" value={`${dimensions.length}mm`} />
      <DetailRow label="Depth" value={`${dimensions.depth}mm`} />
    </DetailSection>
  );
}

// ============================================================================
// Notes Section
// ============================================================================

function NotesSection({
  notes
}: {
  readonly notes: ReadonlyArray<Model.ICategorizedNote>;
}): React.ReactElement | null {
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
// URLs Section
// ============================================================================

function UrlsSection({
  urls
}: {
  readonly urls: ReadonlyArray<Model.ICategorizedUrl>;
}): React.ReactElement | null {
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
// MoldDetail Component
// ============================================================================

/**
 * Read-only detail view for a mold entity.
 *
 * Displays:
 * - Header with display name, format badge, description
 * - Manufacturer and product number
 * - Cavity layout, count, weight, and total capacity
 * - Cavity dimensions (if available)
 * - Notes, URLs, tags
 *
 * @public
 */
export function MoldDetail(props: IMoldDetailProps): React.ReactElement {
  const { mold } = props;

  return (
    <div className="p-4 overflow-y-auto h-full">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-lg font-semibold text-gray-900">{mold.displayName}</h2>
          <CategoryBadge label={mold.format} />
        </div>
        {mold.description && <p className="text-sm text-gray-600">{mold.description}</p>}
        <p className="text-xs text-gray-400 mt-0.5 font-mono">{mold.id}</p>
      </div>

      {/* Manufacturer info */}
      <DetailSection title="Manufacturer">
        <DetailRow label="Manufacturer" value={mold.manufacturer} />
        <DetailRow label="Product #" value={mold.productNumber} />
      </DetailSection>

      {/* Cavities */}
      <CavitiesSection mold={mold} />

      {/* Dimensions */}
      {mold.cavityDimensions && <DimensionsSection dimensions={mold.cavityDimensions} />}

      {/* Notes */}
      {mold.notes && <NotesSection notes={mold.notes} />}

      {/* URLs */}
      {mold.urls && <UrlsSection urls={mold.urls} />}

      {/* Tags */}
      <TagList tags={mold.tags ?? []} />

      {/* Related molds */}
      {mold.related && mold.related.length > 0 && (
        <DetailSection title="Related Molds">
          <div className="flex flex-wrap gap-1">
            {mold.related.map((relatedId) => (
              <span
                key={relatedId}
                className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600 font-mono"
              >
                {relatedId}
              </span>
            ))}
          </div>
        </DetailSection>
      )}
    </div>
  );
}
