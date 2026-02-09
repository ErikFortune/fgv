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

import { formatCategorizedNotes, formatUrls } from '../../shared';
import { IEntityAction, IRenderResult } from './rendererTypes';

/**
 * Renders a one-line summary for a confection (for list display).
 */
export function renderConfectionSummary(confection: LibraryRuntime.IConfectionBase): string {
  return `${confection.id} - ${confection.name} [${confection.confectionType}]`;
}

/**
 * Renders type-specific details for a molded bonbon variation.
 */
function renderMoldedBonBonDetails(
  confection: LibraryRuntime.IMoldedBonBonRecipe,
  lines: string[],
  actions: IEntityAction[]
): void {
  // Molds
  lines.push('');
  lines.push('Molds:');
  const preferredMoldId = confection.molds.preferredId;
  for (const moldRef of confection.molds.options) {
    const isPreferred = moldRef.id === preferredMoldId;
    const preferredMarker = isPreferred ? ' (preferred)' : '';
    const notes = formatCategorizedNotes(moldRef.notes);
    const notesSuffix = notes ? ` - ${notes}` : '';
    lines.push(`  ${moldRef.mold.displayName} (${moldRef.id})${preferredMarker}${notesSuffix}`);

    actions.push({
      label: `View mold: ${moldRef.mold.displayName}`,
      key: `view-mold:${moldRef.id}`,
      description: `Navigate to mold ${moldRef.id}`
    });
  }

  // Shell Chocolate
  lines.push('');
  lines.push('Shell Chocolate:');
  lines.push(`  ${confection.shellChocolate.chocolate.name} (${confection.shellChocolate.chocolate.id})`);
  if (confection.shellChocolate.alternates.length > 0) {
    lines.push(`  Alternates: ${confection.shellChocolate.alternates.map((a) => a.id).join(', ')}`);
  }
  actions.push({
    label: `View chocolate: ${confection.shellChocolate.chocolate.name}`,
    key: `view-ingredient:${confection.shellChocolate.chocolate.id}`,
    description: `Navigate to ${confection.shellChocolate.chocolate.id}`
  });

  // Additional Chocolates
  if (confection.additionalChocolates && confection.additionalChocolates.length > 0) {
    for (const addlChoc of confection.additionalChocolates) {
      lines.push('');
      lines.push(`${addlChoc.purpose} Chocolate:`);
      lines.push(`  ${addlChoc.chocolate.chocolate.name} (${addlChoc.chocolate.chocolate.id})`);
      if (addlChoc.chocolate.alternates.length > 0) {
        lines.push(`  Alternates: ${addlChoc.chocolate.alternates.map((a) => a.id).join(', ')}`);
      }
    }
  }
}

/**
 * Renders type-specific details for a bar truffle variation.
 */
function renderBarTruffleDetails(
  confection: LibraryRuntime.IBarTruffleRecipe,
  lines: string[],
  actions: IEntityAction[]
): void {
  // Frame Dimensions
  lines.push('');
  lines.push('Frame Dimensions:');
  const fd = confection.frameDimensions;
  lines.push(`  ${fd.width} x ${fd.height} x ${fd.depth} mm`);

  // BonBon Dimensions
  lines.push('');
  lines.push('BonBon Dimensions:');
  const bd = confection.singleBonBonDimensions;
  lines.push(`  ${bd.width} x ${bd.height} mm`);

  // Enrobing Chocolate
  if (confection.enrobingChocolate) {
    lines.push('');
    lines.push('Enrobing Chocolate:');
    lines.push(
      `  ${confection.enrobingChocolate.chocolate.name} (${confection.enrobingChocolate.chocolate.id})`
    );
    if (confection.enrobingChocolate.alternates.length > 0) {
      lines.push(`  Alternates: ${confection.enrobingChocolate.alternates.map((a) => a.id).join(', ')}`);
    }
    actions.push({
      label: `View chocolate: ${confection.enrobingChocolate.chocolate.name}`,
      key: `view-ingredient:${confection.enrobingChocolate.chocolate.id}`,
      description: `Navigate to ${confection.enrobingChocolate.chocolate.id}`
    });
  }
}

/**
 * Renders type-specific details for a rolled truffle variation.
 */
function renderRolledTruffleDetails(
  confection: LibraryRuntime.IRolledTruffleRecipe,
  lines: string[],
  actions: IEntityAction[]
): void {
  // Enrobing Chocolate
  if (confection.enrobingChocolate) {
    lines.push('');
    lines.push('Enrobing Chocolate:');
    lines.push(
      `  ${confection.enrobingChocolate.chocolate.name} (${confection.enrobingChocolate.chocolate.id})`
    );
    if (confection.enrobingChocolate.alternates.length > 0) {
      lines.push(`  Alternates: ${confection.enrobingChocolate.alternates.map((a) => a.id).join(', ')}`);
    }
    actions.push({
      label: `View chocolate: ${confection.enrobingChocolate.chocolate.name}`,
      key: `view-ingredient:${confection.enrobingChocolate.chocolate.id}`,
      description: `Navigate to ${confection.enrobingChocolate.chocolate.id}`
    });
  }

  // Coatings
  if (confection.coatings) {
    lines.push('');
    lines.push('Coatings:');
    for (const coating of confection.coatings.options) {
      const isPreferred = confection.coatings.preferred && coating.id === confection.coatings.preferred.id;
      const preferredMarker = isPreferred ? ' (preferred)' : '';
      lines.push(`  ${coating.ingredient.name} (${coating.id})${preferredMarker}`);
    }
  }
}

/**
 * Renders a full detail view for a confection.
 */
export function renderConfectionDetail(confection: LibraryRuntime.IConfectionBase): IRenderResult {
  const lines: string[] = [];
  const actions: IEntityAction[] = [];

  lines.push(`Confection: ${confection.name}`);
  lines.push(`ID: ${confection.id}`);
  lines.push(`Type: ${confection.confectionType}`);

  if (confection.description) {
    lines.push(`Description: ${confection.description}`);
  }

  const tags = confection.effectiveTags;
  if (tags.length > 0) {
    lines.push(`Tags: ${tags.join(', ')}`);
  }

  // Yield
  lines.push('');
  lines.push(`Yield: ${confection.yield.count} ${confection.yield.unit ?? 'pieces'}`);
  if (confection.yield.weightPerPiece !== undefined) {
    lines.push(`Weight per piece: ${confection.yield.weightPerPiece}g`);
  }

  // Type-specific rendering
  if (confection.isMoldedBonBon()) {
    renderMoldedBonBonDetails(confection, lines, actions);
  } else if (confection.isBarTruffle()) {
    renderBarTruffleDetails(confection, lines, actions);
  } else if (confection.isRolledTruffle()) {
    renderRolledTruffleDetails(confection, lines, actions);
  }

  // Fillings
  if (confection.fillings && confection.fillings.length > 0) {
    lines.push('');
    lines.push('Fillings:');
    for (const slot of confection.fillings) {
      const slotName = slot.name ?? slot.slotId;
      lines.push(`  ${slotName}:`);
      const preferredId = slot.filling.preferredId;
      for (const opt of slot.filling.options) {
        const isPreferred = opt.id === preferredId;
        const preferredMarker = isPreferred ? ' (preferred)' : '';
        const typeMarker = ` [${opt.type}]`;
        const optNotes = formatCategorizedNotes(opt.notes);
        const notesSuffix = optNotes ? ` - ${optNotes}` : '';
        lines.push(`    ${opt.id}${typeMarker}${preferredMarker}${notesSuffix}`);

        if (opt.type === 'recipe') {
          actions.push({
            label: `View filling: ${opt.filling.name}`,
            key: `view-filling:${opt.id}`,
            description: `Navigate to filling ${opt.id}`
          });
        }
      }
    }
  }

  // Decorations
  if (confection.decorations && confection.decorations.length > 0) {
    lines.push('');
    lines.push('Decorations:');
    for (const decoration of confection.decorations) {
      const preferredMarker = decoration.preferred ? ' (preferred)' : '';
      lines.push(`  ${decoration.description}${preferredMarker}`);
    }
  }

  // Procedures
  if (confection.procedures && confection.procedures.options.length > 0) {
    lines.push('');
    lines.push('Procedures:');
    const preferredProcId = confection.procedures.preferredId;
    for (const procRef of confection.procedures.options) {
      const isPreferred = procRef.id === preferredProcId;
      const preferredMarker = isPreferred ? ' (preferred)' : '';
      const procNotes = formatCategorizedNotes(procRef.notes);
      const notesSuffix = procNotes ? ` - ${procNotes}` : '';
      lines.push(`  ${procRef.procedure.name} (${procRef.id})${preferredMarker}${notesSuffix}`);
    }
  }

  // URLs
  const urls = confection.effectiveUrls;
  if (urls.length > 0) {
    formatUrls(urls, lines);
  }

  // Other variations
  if (confection.variations.length > 1) {
    lines.push('');
    lines.push(`Other variations (${confection.variations.length - 1}):`);
    const golden = confection.goldenVariation;
    for (const v of confection.variations) {
      if (v.variationSpec !== golden.variationSpec) {
        const goldenMarker = v.variationSpec === confection.goldenVariationSpec ? ' (golden)' : '';
        lines.push(`  ${v.variationSpec}${goldenMarker} - ${v.createdDate}`);
      }
    }
  }

  return { text: lines.join('\n'), actions };
}
