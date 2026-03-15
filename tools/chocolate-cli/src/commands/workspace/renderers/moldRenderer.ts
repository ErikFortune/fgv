// Copyright (c) 2026 Erik Fortune
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

import { LibraryRuntime } from '@fgv/ts-chocolate';

import { formatCategorizedNotes, formatUrls } from '../../shared/outputFormatter';
import { IEntityAction, IRenderContext, IRenderResult } from './rendererTypes';

/**
 * Renders a one-line summary for a mold (for list display).
 */
export function renderMoldSummary(mold: LibraryRuntime.IMold): string {
  return `${mold.id} - ${mold.displayName} [${mold.format}] ${mold.cavityCount} cavities`;
}

/**
 * Renders a full detail view for a mold.
 */
export function renderMoldDetail(mold: LibraryRuntime.IMold, context: IRenderContext): IRenderResult {
  const lines: string[] = [];
  const actions: IEntityAction[] = [];

  lines.push(`Mold: ${mold.displayName}`);
  lines.push(`ID: ${mold.id}`);
  lines.push(`Manufacturer: ${mold.manufacturer}`);
  lines.push(`Product Number: ${mold.productNumber}`);
  lines.push(`Format: ${mold.format}`);

  if (mold.name) {
    lines.push(`Name: ${mold.name}`);
  }

  if (mold.description) {
    lines.push(`Description: ${mold.description}`);
  }

  if (mold.tags && mold.tags.length > 0) {
    lines.push(`Tags: ${mold.tags.join(', ')}`);
  }

  // Cavity information
  lines.push('');
  lines.push('Cavities:');
  if (mold.cavities.kind === 'grid') {
    lines.push(`  Layout: ${mold.cavities.columns} x ${mold.cavities.rows} grid`);
    lines.push(`  Total Count: ${mold.cavityCount}`);
  } else {
    lines.push(`  Count: ${mold.cavityCount}`);
  }

  if (mold.cavityWeight !== undefined) {
    lines.push(`  Weight per cavity: ${mold.cavityWeight}g`);
  }

  if (mold.cavityDimensions) {
    const dims = mold.cavityDimensions;
    lines.push(`  Dimensions: ${dims.width} x ${dims.length} x ${dims.depth} mm`);
  }

  if (mold.totalCapacity !== undefined) {
    lines.push(`  Total Capacity: ${mold.totalCapacity}g`);
  }

  // Related molds
  if (mold.related && mold.related.length > 0) {
    lines.push('');
    lines.push('Related Molds:');
    for (const relatedId of mold.related) {
      lines.push(`  ${relatedId}`);
      // Add action to view each related mold
      const relatedMoldResult = context.library.molds.get(relatedId);
      if (relatedMoldResult.isSuccess()) {
        actions.push({
          label: `View related mold: ${relatedMoldResult.value.displayName}`,
          key: `view-mold:${relatedId}`,
          description: `Navigate to ${relatedId}`
        });
      }
    }
  }

  // Notes
  const notesStr = formatCategorizedNotes(mold.notes);
  if (notesStr) {
    lines.push('');
    lines.push(`Notes: ${notesStr}`);
  }

  // URLs
  if (mold.urls && mold.urls.length > 0) {
    formatUrls(mold.urls, lines);
  }

  return { text: lines.join('\n'), actions };
}
