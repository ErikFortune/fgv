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

/**
 * Filling recipe to Markdown rendering for the presentation packlet.
 * @packageDocumentation
 */

import { Result, fail, succeed, mapResults } from '@fgv/ts-utils';
import { ZipFileTree } from '@fgv/ts-extras';

import { MeasurementUnit } from '../common';
import { Fillings } from '../entities';
import type { FillingRecipeVariation, IResolvedFillingIngredient, IProcedure } from '../library-runtime';
import { FillingRecipe } from '../library-runtime';
import { formatCategorizedNote, renderProcedureSection } from './markdownShared';

// ============================================================================
// Internal formatting helpers
// ============================================================================

/**
 * Formats an ingredient amount with its unit, applying modifier qualifiers.
 * Rounds grams/mL to the nearest integer; other units to one decimal place.
 * @internal
 */
function _formatAmount(
  amount: number,
  unit: MeasurementUnit | undefined,
  modifiers: Fillings.IIngredientModifiers | undefined
): string {
  const u = unit ?? 'g';
  const rounded =
    u === 'g' || u === 'mL' ? `${Math.round(amount)} ${u}` : `${Math.round(amount * 10) / 10} ${u}`;
  if (modifiers?.toTaste) return `${rounded}, to taste`;
  if (modifiers?.spoonLevel) return `${rounded} (${modifiers.spoonLevel})`;
  return rounded;
}

/**
 * Renders a single resolved ingredient line (with alternates and notes).
 * @internal
 */
function _renderIngredient(resolved: IResolvedFillingIngredient): string[] {
  const lines: string[] = [];

  const unit = resolved.entity.unit;
  const modifiers = resolved.entity.modifiers;
  const label = resolved.role ? `${resolved.ingredient.name} *(${resolved.role})*` : resolved.ingredient.name;
  lines.push(`- ${label}: ${_formatAmount(resolved.amount, unit, modifiers)}`);

  // Show yield factor / process note as a sub-line
  if (modifiers?.yieldFactor !== undefined && modifiers.yieldFactor !== 1.0) {
    const contributed = Math.round(resolved.amount * modifiers.yieldFactor);
    const note = modifiers.processNote ? `${modifiers.processNote} → ` : '';
    lines.push(`  *(${note}contributes ~${contributed} ${unit ?? 'g'})*`);
  } else if (modifiers?.processNote) {
    lines.push(`  *${modifiers.processNote}*`);
  }

  for (const alt of resolved.alternates) {
    lines.push(`  - *Alternate: ${alt.name}*`);
  }

  if (resolved.notes && resolved.notes.length > 0) {
    lines.push(`  > ${resolved.notes.map((n) => formatCategorizedNote(n)).join(' — ')}`);
  }

  return lines;
}

/**
 * Renders the steps of a procedure from an IProcedure object.
 * @internal
 */
function _renderProcedure(procedure: IProcedure): Result<string[]> {
  return renderProcedureSection(procedure);
}

// ============================================================================
// Variation rendering
// ============================================================================

/**
 * Renders the content for a single filling recipe variation.
 * @internal
 */
function _renderVariationContent(variation: FillingRecipeVariation): Result<string[]> {
  const lines: string[] = [];

  // Base weight
  lines.push('', `## Ingredients (${Math.round(variation.baseWeight)} g total)`);

  return variation
    .getIngredients()
    .withErrorFormat((msg) => `Failed to get ingredients: ${msg}`)
    .onSuccess((ingredients) => {
      for (const resolved of ingredients) {
        lines.push(..._renderIngredient(resolved));
      }
      return succeed(undefined);
    })
    .onSuccess(() => {
      const proc = variation.preferredProcedure;
      if (!proc) {
        return succeed(undefined);
      }
      return _renderProcedure(proc.procedure).onSuccess((procLines) => {
        lines.push(...procLines);
        return succeed(undefined);
      });
    })
    .onSuccess(() => {
      if (variation.notes && variation.notes.length > 0) {
        lines.push('', '## Notes');
        for (const note of variation.notes) {
          lines.push(formatCategorizedNote(note));
        }
      }
      return succeed(lines);
    });
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Renders a single non-built-in filling recipe to a Markdown string
 * using its golden variation.
 *
 * @param filling - The resolved runtime filling recipe to render.
 * @returns Success with the Markdown string, or Failure if rendering fails.
 * @public
 */
export function fillingToMarkdown(filling: FillingRecipe): Result<string> {
  const lines: string[] = [];

  return filling
    .getGoldenVariation()
    .withErrorFormat((msg) => `Failed to get golden variation for '${filling.name}': ${msg}`)
    .onSuccess((golden) => {
      lines.push(`# ${filling.name}`);
      const yieldSuffix = golden.yield ? ` | yield: ${golden.yield}` : '';
      lines.push(`*id: ${filling.id}${yieldSuffix}*`);

      if (filling.description) {
        lines.push('', filling.description);
      }

      return _renderVariationContent(golden).onSuccess((contentLines) => {
        lines.push(...contentLines);

        if (filling.tags && filling.tags.length > 0) {
          lines.push('', '## Tags', filling.tags.join(', '));
        }

        return succeed(lines.join('\n'));
      });
    });
}

/**
 * Exports all non-built-in filling recipes to a ZIP archive of Markdown files.
 *
 * ZIP structure: `{fillingId}.md` (flat, since filling IDs are already namespaced)
 *
 * @param fillings - Iterable of resolved runtime filling recipes.
 * @returns Success with the ZIP data as a `Uint8Array`, or Failure if any filling fails to render.
 * @public
 */
export async function exportFillingsAsMarkdown(
  fillings: Iterable<FillingRecipe>
): Promise<Result<Uint8Array>> {
  return mapResults(
    Array.from(fillings)
      .filter((filling) => filling.isMutable)
      .map((filling) =>
        fillingToMarkdown(filling)
          .withErrorFormat((msg) => `Failed to render filling '${filling.id}': ${msg}`)
          .onSuccess((contents) => succeed({ path: `${filling.id}.md`, contents }))
      )
  ).onSuccess((files) => {
    if (files.length === 0) {
      return fail('No user filling recipes to export');
    }

    return ZipFileTree.createZipFromTextFiles(files);
  });
}
