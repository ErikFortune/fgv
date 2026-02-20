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

import { DetailSection, DetailRow, TagList } from '@fgv/ts-app-shell';
import type { LibraryRuntime, Entities } from '@fgv/ts-chocolate';
import { EntityDetailHeader, NotesSection, UrlsSection } from '../common';

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
  /** Optional callback to switch to edit mode */
  readonly onEdit?: () => void;
  /** Optional callback to close this panel */
  readonly onClose?: () => void;
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
  const { mold, onEdit, onClose } = props;

  return (
    <div className="p-4 overflow-y-auto h-full">
      {/* Header */}
      <EntityDetailHeader
        title={mold.displayName}
        description={mold.description}
        badge={{ label: mold.format, colorClass: 'bg-choco-primary/10 text-choco-primary' }}
        subtitle={mold.id}
        onEdit={onEdit}
        onClose={onClose}
      />

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
