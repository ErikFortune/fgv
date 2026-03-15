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

import { IngredientId, LibraryRuntime } from '@fgv/ts-chocolate';

import { formatCategorizedNotes, formatNumber, formatUrls, padRight } from '../../shared/outputFormatter';
import { IEntityAction, IRenderResult } from './rendererTypes';

/**
 * Renders a one-line summary for a filling (for list display).
 */
export function renderFillingSummary(filling: LibraryRuntime.IFillingRecipe): string {
  return `${filling.id} - ${filling.name} [${filling.entity.category}] (${
    filling.variations.length
  } variation${filling.variations.length === 1 ? '' : 's'})`;
}

/**
 * Renders a full detail view for a filling variation.
 */
export function renderFillingDetail(
  filling: LibraryRuntime.IFillingRecipe,
  variation: LibraryRuntime.IFillingRecipeVariation
): IRenderResult {
  const lines: string[] = [];
  const actions: IEntityAction[] = [];
  const ingredientIds: IngredientId[] = [];

  lines.push(`Filling: ${filling.name}`);
  lines.push(`ID: ${filling.id}`);
  lines.push(`Category: ${filling.entity.category}`);

  if (filling.description) {
    lines.push(`Description: ${filling.description}`);
  }

  if (filling.tags && filling.tags.length > 0) {
    lines.push(`Tags: ${filling.tags.join(', ')}`);
  }

  lines.push('');

  const isGolden = variation.variationSpec === filling.goldenVariationSpec;
  lines.push(`Variation: ${variation.variationSpec}${isGolden ? ' (golden)' : ''}`);
  lines.push(`Created: ${variation.createdDate}`);
  lines.push(`Base Weight: ${variation.baseWeight}g`);

  if (variation.entity.yield) {
    lines.push(`Yield: ${variation.entity.yield}`);
  }

  // Notes
  const notesStr = formatCategorizedNotes(variation.notes);
  if (notesStr) {
    lines.push(`Notes: ${notesStr}`);
  }

  // Ingredients
  const ingredientsResult = variation.getIngredients();
  if (ingredientsResult.isSuccess()) {
    const ingredients = Array.from(ingredientsResult.value);
    if (ingredients.length > 0) {
      lines.push('');
      lines.push('Ingredients:');

      const maxIdLen = Math.max(...ingredients.map((ri) => ri.ingredient.id.length));

      for (const ri of ingredients) {
        const pct = formatNumber((ri.amount / variation.baseWeight) * 100, 1);
        const altCount = ri.alternates.length;
        const altStr = altCount > 0 ? ` (+${altCount} alt${altCount === 1 ? '' : 's'})` : '';
        const riNotes = formatCategorizedNotes(ri.notes);
        const noteSuffix = riNotes ? `  (${riNotes})` : '';
        lines.push(
          `  ${padRight(ri.ingredient.id, maxIdLen)}  ${padRight(
            formatNumber(ri.amount) + 'g',
            10
          )}  (${pct}%)${altStr}${noteSuffix}`
        );

        ingredientIds.push(ri.ingredient.id);
      }
    }
  }

  // Ratings
  if (variation.ratings && variation.ratings.length > 0) {
    lines.push('');
    lines.push('Ratings:');
    for (const rating of variation.ratings) {
      const ratingNotes = formatCategorizedNotes(rating.notes);
      const ratingNotesSuffix = ratingNotes ? ` - ${ratingNotes}` : '';
      lines.push(`  ${padRight(rating.category, 12)}: ${rating.score}/5${ratingNotesSuffix}`);
    }
  }

  // Procedures
  if (variation.procedures) {
    lines.push('');
    lines.push('Procedures:');
    for (const proc of variation.procedures.procedures) {
      const isPreferred =
        variation.procedures.recommendedProcedure &&
        proc.procedure === variation.procedures.recommendedProcedure;
      const preferredMarker = isPreferred ? ' (preferred)' : '';
      const procNotes = formatCategorizedNotes(proc.notes);
      const notesSuffix = procNotes ? ` - ${procNotes}` : '';
      lines.push(`  ${proc.id}${preferredMarker}${notesSuffix}`);
    }
  }

  // URLs from entity
  if (filling.entity.urls && filling.entity.urls.length > 0) {
    formatUrls(filling.entity.urls, lines);
  }

  // Other variations
  if (filling.variations.length > 1) {
    lines.push('');
    lines.push(`Other variations (${filling.variations.length - 1}):`);
    for (const v of filling.variations) {
      if (v.variationSpec !== variation.variationSpec) {
        const golden = v.variationSpec === filling.goldenVariationSpec ? ' (golden)' : '';
        lines.push(`  ${v.variationSpec}${golden} - ${v.createdDate}`);
      }
    }
  }

  // Ganache analysis
  const ganacheResult = variation.calculateGanache();
  if (ganacheResult.isSuccess()) {
    const ganache = ganacheResult.value;
    lines.push('');
    lines.push('Ganache Analysis:');
    lines.push(`  Total Fat: ${formatNumber(ganache.analysis.totalFat, 1)}%`);
    lines.push(`  Fat:Water Ratio: ${formatNumber(ganache.analysis.fatToWaterRatio, 2)}`);
    lines.push(`  Sugar:Water Ratio: ${formatNumber(ganache.analysis.sugarToWaterRatio, 2)}`);

    if (ganache.validation.warnings.length > 0) {
      lines.push('  Warnings:');
      for (const warning of ganache.validation.warnings) {
        lines.push(`    - ${warning}`);
      }
    }
  }

  // Build actions
  for (const ingredientId of ingredientIds) {
    actions.push({
      label: `View ingredient: ${ingredientId}`,
      key: `view-ingredient:${ingredientId}`,
      description: `Navigate to ingredient details`
    });
  }

  if (filling.variations.length > 1) {
    actions.push({
      label: 'View another variation',
      key: 'view-variation',
      description: `${filling.variations.length} variations available`
    });
  }

  return { text: lines.join('\n'), actions };
}
