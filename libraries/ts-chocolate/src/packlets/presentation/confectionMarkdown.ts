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
 * Confection-to-Markdown rendering for the presentation packlet.
 * @packageDocumentation
 */

import { Result, fail, succeed, mapResults } from '@fgv/ts-utils';
import { ZipFileTree } from '@fgv/ts-extras';

import { ConfectionRecipeVariationSpec } from '../common';
import { Confections } from '../entities';
import type {
  AnyConfection,
  AnyConfectionRecipeVariation,
  IResolvedFillingSlot,
  IResolvedConfectionProcedure,
  IScaledRecipeSlot,
  IConfectionScalingTarget
} from '../library-runtime';
import { computeScaledFillings } from '../library-runtime';
import { fillingToMarkdown } from './fillingMarkdown';
import { FillingRecipe } from '../library-runtime';
import { formatCategorizedNote, renderProcedureSection } from './markdownShared';

// ============================================================================
// Options
// ============================================================================

/**
 * Options for confection-to-Markdown rendering.
 * @public
 */
export interface IConfectionMarkdownOptions {
  /**
   * Which variations to render.
   * - `'golden'` (default): only the golden variation
   * - `'all'`: every variation
   * - `ConfectionRecipeVariationSpec[]`: explicit list
   */
  readonly variations?: 'golden' | 'all' | ConfectionRecipeVariationSpec[];

  /**
   * If true, appended scaled filling recipes (ingredient breakdown with weights)
   * for each variation, scaled to the variation's default yield.
   * Default: false
   */
  readonly includeScaledFillings?: boolean;
}

// ============================================================================
// Internal formatting helpers
// ============================================================================

/**
 * Converts a hyphenated confection type string to Title Case.
 * e.g. 'molded-bonbon' → 'Molded Bonbon'
 * @internal
 */
function _formatConfectionType(type: string): string {
  return type
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/**
 * Formats a confection yield as a human-readable string.
 * @internal
 */
function _formatYield(yld: Confections.ConfectionYield): string {
  if (Confections.isYieldInFrames(yld)) {
    return `${yld.numFrames} frame${yld.numFrames !== 1 ? 's' : ''}`;
  }
  const pieces = `${yld.numPieces} piece${yld.numPieces !== 1 ? 's' : ''}`;
  const weight = yld.weightPerPiece !== undefined ? ` × ${yld.weightPerPiece} g` : '';
  if (Confections.isBarTruffleYield(yld)) {
    const d = yld.dimensions;
    const dims = `${d.width} × ${d.height} × ${d.depth} mm`;
    return `${pieces}${weight} — ${dims}`;
  }
  return `${pieces}${weight}`;
}

/**
 * Returns the display name for a resolved filling option.
 * @internal
 */
function _fillingOptionName(option: IResolvedFillingSlot['filling']['options'][number]): string {
  return option.type === 'recipe' ? option.filling.name : option.ingredient.name;
}

/**
 * Renders a single filling slot (name + preferred/alternate options).
 * @internal
 */
function _renderFillingSlot(slot: IResolvedFillingSlot, targetWeight?: number): string[] {
  const lines: string[] = [];
  const slotHeader = slot.name ?? 'Filling';
  const weightSuffix = targetWeight !== undefined ? ` (${Math.round(targetWeight)} g)` : '';
  lines.push(`### ${slotHeader}${weightSuffix}`);

  const preferred =
    slot.filling.options.find((o) => o.id === slot.filling.preferredId) ?? slot.filling.options[0];
  const alternates = slot.filling.options.filter((o) => o !== preferred);

  if (preferred) {
    lines.push(`- **Primary**: ${_fillingOptionName(preferred)}`);
  }
  for (const alt of alternates) {
    lines.push(`- *Alternate*: ${_fillingOptionName(alt)}`);
  }
  return lines;
}

/**
 * Renders a resolved procedure section.
 * @internal
 */
function _renderProcedureSection(procRef: IResolvedConfectionProcedure): Result<string[]> {
  return renderProcedureSection(procRef.procedure);
}

/**
 * Renders scaled filling details for a single recipe slot.
 * @internal
 */
function _renderScaledRecipeSlot(slot: IScaledRecipeSlot): string[] {
  const lines: string[] = [`### ${slot.name ?? 'Filling'} (${Math.round(slot.targetWeight)} g total)`];
  const ingredients = slot.produced.ingredients;

  for (const ing of ingredients) {
    // Match the ingredient name from resolvedIngredients via id
    const resolved = slot.resolvedIngredients.find((r) => r.ingredient.id === ing.ingredientId);
    const name = resolved !== undefined ? resolved.ingredient.name : ing.ingredientId;
    lines.push(`- ${name}: ${Math.round(ing.amount)} g`);
  }

  return lines;
}

/**
 * Renders the scaled fillings section for a variation, if `includeScaledFillings` is set.
 * @internal
 */
function _renderScaledFillingsSection(variation: AnyConfectionRecipeVariation): Result<string[]> {
  // Build the scaling target from the variation's default yield
  const yld = variation.yield;

  let target: IConfectionScalingTarget;
  if (Confections.isYieldInFrames(yld)) {
    target = { targetFrames: yld.numFrames };
  } else {
    target = { targetCount: yld.numPieces };
  }

  return computeScaledFillings(variation, target).onSuccess((scaling) => {
    const recipeSlots = scaling.slots.filter((s): s is IScaledRecipeSlot => s.type === 'recipe');
    if (recipeSlots.length === 0) {
      return succeed<string[]>([]);
    }

    const lines: string[] = ['', '## Scaled Filling Recipes'];
    for (const slot of recipeSlots) {
      lines.push('');
      lines.push(..._renderScaledRecipeSlot(slot));
    }
    return succeed(lines);
  });
}

/**
 * Renders chocolate spec lines (name + alternates).
 * @internal
 */
function _renderChocolateLines(
  label: string,
  spec: { chocolate: { name: string }; alternates: ReadonlyArray<{ name: string }> }
): string[] {
  const lines: string[] = [`## ${label}`, spec.chocolate.name];
  if (spec.alternates.length > 0) {
    lines.push(`*Alternates: ${spec.alternates.map((c) => c.name).join(', ')}*`);
  }
  return lines;
}

function _buildScalingTarget(variation: AnyConfectionRecipeVariation): IConfectionScalingTarget {
  const yld = variation.yield;
  return Confections.isYieldInFrames(yld) ? { targetFrames: yld.numFrames } : { targetCount: yld.numPieces };
}

function _computeSlotWeights(variation: AnyConfectionRecipeVariation): Result<Map<string, number>> {
  return computeScaledFillings(variation, _buildScalingTarget(variation)).onSuccess((scaling) => {
    const slotWeights = new Map<string, number>();
    for (const slot of scaling.slots) {
      slotWeights.set(slot.slotId, slot.targetWeight);
    }
    return succeed(slotWeights);
  });
}

// ============================================================================
// Variation rendering
// ============================================================================

/**
 * Renders the content for a single confection variation (without header).
 * @internal
 */
function _renderVariationContent(
  variation: AnyConfectionRecipeVariation,
  options: IConfectionMarkdownOptions
): Result<string[]> {
  const lines: string[] = [];

  // Yield
  lines.push('', '## Yield', _formatYield(variation.yield));

  // Shell / enrobing chocolate (type-specific)
  if (variation.isMoldedBonBonVariation()) {
    const shell = variation.shellChocolate;
    if (shell) {
      lines.push('', ..._renderChocolateLines('Shell', shell));
    }
  } else if (variation.isBarTruffleVariation() || variation.isRolledTruffleVariation()) {
    const enrobing = variation.enrobingChocolate;
    if (enrobing) {
      lines.push('', ..._renderChocolateLines('Enrobing Chocolate', enrobing));
    }
  }

  // Fillings
  let fillings: ReadonlyArray<IResolvedFillingSlot> = [];

  return variation
    .getFillings()
    .withErrorFormat((msg) => `Failed to get fillings: ${msg}`)
    .onSuccess((resolvedFillings) => {
      fillings = resolvedFillings;
      if (resolvedFillings.length === 0) {
        return succeed(undefined);
      }

      return _computeSlotWeights(variation)
        .withErrorFormat((msg) => `Failed to compute filling weights — data may be corrupted: ${msg}`)
        .onSuccess((slotWeights) => {
          lines.push('', '## Fillings');
          for (const slot of resolvedFillings) {
            lines.push('');
            lines.push(..._renderFillingSlot(slot, slotWeights.get(slot.slotId)));
          }
          return succeed(undefined);
        });
    })
    .onSuccess(() =>
      variation
        .getDecorations()
        .withErrorFormat((msg) => `Failed to get decorations: ${msg}`)
        .onSuccess((decorations) => {
          if (decorations && decorations.options.length > 0) {
            lines.push('', '## Decorations');
            for (const dec of decorations.options) {
              lines.push(`- ${dec.decoration.name}`);
            }
          }
          return succeed(undefined);
        })
    )
    .onSuccess(() =>
      variation
        .getProcedures()
        .withErrorFormat((msg) => `Failed to get procedures: ${msg}`)
        .onSuccess((procedures) => {
          if (!procedures || procedures.options.length === 0) {
            return succeed(undefined);
          }

          const preferred =
            procedures.options.find((p) => p.id === procedures.preferredId) ?? procedures.options[0];
          return _renderProcedureSection(preferred).onSuccess((procLines) => {
            lines.push(...procLines);
            return succeed(undefined);
          });
        })
    )
    .onSuccess(() => {
      if (variation.notes && variation.notes.length > 0) {
        lines.push('', '## Notes');
        for (const note of variation.notes) {
          lines.push(formatCategorizedNote(note));
        }
      }

      if (options.includeScaledFillings && fillings.length > 0) {
        return _renderScaledFillingsSection(variation).onSuccess((scaledLines) => {
          lines.push(...scaledLines);
          return succeed(lines);
        });
      }

      return succeed(lines);
    });
}

// ============================================================================
// Variation selection
// ============================================================================

/**
 * Resolves the list of variations to render based on the options.
 * @internal
 */
function _resolveVariations(
  confection: AnyConfection,
  variations: IConfectionMarkdownOptions['variations']
): Result<ReadonlyArray<AnyConfectionRecipeVariation>> {
  if (!variations || variations === 'golden') {
    return (confection.getGoldenVariation() as unknown as Result<AnyConfectionRecipeVariation>)
      .withErrorFormat((msg) => `Failed to get golden variation for '${confection.name}': ${msg}`)
      .onSuccess((v) => succeed([v]));
  }

  if (variations === 'all') {
    return confection
      .getVariations()
      .withErrorFormat((msg) => `Failed to get variations for '${confection.name}': ${msg}`);
  }

  // Explicit list of variation specs — cast to common variation type
  const results = variations.map((spec) =>
    (confection.getVariation(spec) as unknown as Result<AnyConfectionRecipeVariation>).withErrorFormat(
      (msg) => `Variation '${spec}': ${msg}`
    )
  );
  return mapResults(results);
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Renders a single confection to a Markdown string.
 *
 * @param confection - The resolved runtime confection recipe to render.
 * @param options - Rendering options (which variations, whether to include scaled fillings).
 * @returns Success with the Markdown string, or Failure if rendering fails.
 * @public
 */
export function confectionToMarkdown(
  confection: AnyConfection,
  options?: IConfectionMarkdownOptions
): Result<string> {
  const opts: IConfectionMarkdownOptions = options ?? {};

  const lines: string[] = [];

  // Header
  lines.push(`# ${confection.name}`);
  lines.push(`*id: ${confection.id} | type: ${_formatConfectionType(confection.confectionType)}*`);

  if (confection.description) {
    lines.push('', confection.description);
  }

  return _resolveVariations(confection, opts.variations).onSuccess((variationList) => {
    const multiVariation = variationList.length > 1;

    return mapResults(
      variationList.map((variation) =>
        _renderVariationContent(variation, opts).onSuccess((contentLines) => {
          const variationLines: string[] = [];
          if (multiVariation) {
            const variationLabel = variation.name ?? variation.variationSpec;
            variationLines.push('', `## Variation: ${variationLabel}`);
          }
          variationLines.push(...contentLines);
          return succeed(variationLines);
        })
      )
    ).onSuccess((variationSections) => {
      for (const section of variationSections) {
        lines.push(...section);
      }

      const tags = confection.tags;
      if (tags && tags.length > 0) {
        lines.push('', '## Tags', tags.join(', '));
      }

      return succeed(lines.join('\n'));
    });
  });
}

/**
 * Exports all confections in the iterable to a ZIP archive of Markdown files.
 *
 * ZIP structure: `{confectionType}/{confectionId}.md`
 *
 * @param confections - Iterable of resolved runtime confection recipes to export.
 * @param options - Rendering options passed to {@link confectionToMarkdown}.
 * @returns Success with the ZIP data as a `Uint8Array`, or Failure if any confection fails to render.
 * @public
 */
export async function exportConfectionsAsMarkdown(
  confections: Iterable<AnyConfection>,
  options?: IConfectionMarkdownOptions
): Promise<Result<Uint8Array>> {
  return mapResults(
    Array.from(confections, (confection) =>
      confectionToMarkdown(confection, options)
        .withErrorFormat((msg) => `Failed to render confection '${confection.id}': ${msg}`)
        .onSuccess((contents) =>
          succeed({ path: `${confection.confectionType}/${confection.id}.md`, contents })
        )
    )
  ).onSuccess((files) => {
    if (files.length === 0) {
      return fail('No confections to export');
    }
    return ZipFileTree.createZipFromTextFiles(files);
  });
}

/**
 * Exports all confections and non-built-in filling recipes to a single ZIP archive.
 *
 * ZIP structure:
 * ```
 * confections/{confectionType}/{confectionId}.md
 * fillings/{fillingId}.md
 * ```
 *
 * @param confections - Iterable of resolved runtime confection recipes to export.
 * @param fillings - Iterable of resolved runtime filling recipes to export.
 * @param options - Rendering options passed to {@link confectionToMarkdown}.
 * @returns Success with the ZIP data as a `Uint8Array`, or Failure if any recipe fails to render.
 * @public
 */
export async function exportAllAsMarkdown(
  confections: Iterable<AnyConfection>,
  fillings: Iterable<FillingRecipe>,
  options?: IConfectionMarkdownOptions
): Promise<Result<Uint8Array>> {
  const confectionFilesResult = mapResults(
    Array.from(confections, (confection) =>
      confectionToMarkdown(confection, options)
        .withErrorFormat((msg) => `Failed to render confection '${confection.id}': ${msg}`)
        .onSuccess((contents) =>
          succeed({
            path: `confections/${confection.confectionType}/${confection.id}.md`,
            contents
          })
        )
    )
  );

  return confectionFilesResult.onSuccess((confectionFiles) =>
    mapResults(
      Array.from(fillings)
        .filter((filling) => filling.isMutable)
        .map((filling) =>
          fillingToMarkdown(filling)
            .withErrorFormat((msg) => `Failed to render filling '${filling.id}': ${msg}`)
            .onSuccess((contents) => succeed({ path: `fillings/${filling.id}.md`, contents }))
        )
    ).onSuccess((fillingFiles) => {
      const files = [...confectionFiles, ...fillingFiles];
      if (files.length === 0) {
        return fail('No recipes to export');
      }
      return ZipFileTree.createZipFromTextFiles(files);
    })
  );
}
