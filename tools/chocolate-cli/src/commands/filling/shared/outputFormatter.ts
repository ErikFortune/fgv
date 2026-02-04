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

import * as yaml from 'yaml';
import {
  Entities,
  FillingId,
  FillingName,
  FillingVersionSpec,
  Measurement,
  Model as CommonModel,
  ProcedureId,
  SourceId
} from '@fgv/ts-chocolate';

import { OutputFormat } from './types';
import { formatNumber, formatUrls, padRight, getPreferredId as getPreferredIdGeneric } from '../../shared';

/**
 * Context for rendering procedures (prepared for future templating support)
 */
export interface IFillingRenderContext {
  /**
   * The library for ingredient/filling lookups (for future templating)
   */
  library?: Entities.Fillings.FillingsLibrary;

  /**
   * Procedure library for resolving procedure references
   */
  procedureLibrary?: Entities.Procedures.ProceduresLibrary;
}

/**
 * Summary information for a filling in list output
 */
export interface IFillingListItem {
  id: FillingId;
  name: FillingName;
  sourceId: SourceId;
  category: Entities.Fillings.FillingCategory;
  description?: string;
  tags?: ReadonlyArray<string>;
  versionCount: number;
  goldenVersionSpec: FillingVersionSpec;
}

/**
 * Calculates the percentage of an ingredient amount
 */
function calculatePercentage(amount: Measurement, baseWeight: Measurement): string {
  const pct = (amount / baseWeight) * 100;
  return formatNumber(pct, 1);
}

/**
 * Gets the display ID for a filling ingredient.
 * Uses preferredId if available, otherwise the first ID in the list.
 */
function getIngredientDisplayId(ingredient: Entities.Fillings.IFillingIngredientEntity): string {
  return ingredient.ingredient.preferredId ?? ingredient.ingredient.ids[0];
}

/**
 * Gets the preferred ID from an IOptionsWithPreferred structure.
 * Returns preferredId if set, otherwise the first option's ID.
 */
function getPreferredId<TOption extends { id: TId }, TId extends string>(
  options: CommonModel.IOptionsWithPreferred<TOption, TId>
): TId | undefined {
  return getPreferredIdGeneric(options);
}

/**
 * Formats procedure references for human output
 */
function formatProcedureRefs(
  procedures: CommonModel.IOptionsWithPreferred<CommonModel.IRefWithNotes<ProcedureId>, ProcedureId>,
  lines: string[],
  _context?: IFillingRenderContext
): void {
  const preferredId = getPreferredId(procedures);

  lines.push('');
  lines.push('Procedures:');

  for (const ref of procedures.options) {
    const isPreferred = ref.id === preferredId;
    const preferredMarker = isPreferred ? ' (preferred)' : '';
    const notes = ref.notes ? ` - ${ref.notes}` : '';
    lines.push(`  ${ref.id}${preferredMarker}${notes}`);
  }

  // TODO: When context.procedureLibrary is available, resolve and display
  // the full procedure with rendered steps
}

// ============================================================================
// Filling List Formatting
// ============================================================================

/**
 * Formats filling list as human-readable output
 */
function formatFillingListHuman(fillings: IFillingListItem[]): string {
  if (fillings.length === 0) {
    return 'No fillings found.';
  }

  const lines: string[] = [];
  lines.push(`Found ${fillings.length} filling(s):\n`);

  // Find max lengths for table alignment
  const maxIdLen = Math.max(...fillings.map((r) => r.id.length), 2);
  const maxNameLen = Math.max(...fillings.map((r) => r.name.length), 4);
  const maxCategoryLen = Math.max(...fillings.map((r) => (r.category ?? '').length), 8);

  // Header
  lines.push(
    `${padRight('ID', maxIdLen)}  ${padRight('Name', maxNameLen)}  ${padRight(
      'Category',
      maxCategoryLen
    )}  Versions  Tags`
  );
  lines.push(
    `${'-'.repeat(maxIdLen)}  ${'-'.repeat(maxNameLen)}  ${'-'.repeat(maxCategoryLen)}  --------  ----`
  );

  for (const filling of fillings) {
    const tags = filling.tags?.join(', ') ?? '';
    const category = filling.category;
    lines.push(
      `${padRight(filling.id, maxIdLen)}  ${padRight(filling.name, maxNameLen)}  ${padRight(
        category,
        maxCategoryLen
      )}  ${padRight(String(filling.versionCount), 8)}  ${tags}`
    );
  }

  return lines.join('\n');
}

/**
 * Formats filling list as table output
 */
function formatFillingListTable(fillings: IFillingListItem[]): string {
  if (fillings.length === 0) {
    return 'No fillings found.';
  }

  const lines: string[] = [];

  // Find max lengths for table alignment
  const maxIdLen = Math.max(...fillings.map((r) => r.id.length), 2);
  const maxNameLen = Math.max(...fillings.map((r) => r.name.length), 4);
  const maxCategoryLen = Math.max(...fillings.map((r) => (r.category ?? '').length), 8);
  const maxVersionsLen = Math.max(...fillings.map((r) => String(r.versionCount).length), 8);

  // Header
  lines.push(
    `${padRight('ID', maxIdLen)} | ${padRight('Name', maxNameLen)} | ${padRight(
      'Category',
      maxCategoryLen
    )} | ${padRight('Versions', maxVersionsLen)} | Tags`
  );
  lines.push(
    `${'-'.repeat(maxIdLen)}-+-${'-'.repeat(maxNameLen)}-+-${'-'.repeat(maxCategoryLen)}-+-${'-'.repeat(
      maxVersionsLen
    )}-+------`
  );

  for (const filling of fillings) {
    const tags = filling.tags?.join(', ') ?? '';
    const category = filling.category;
    lines.push(
      `${padRight(filling.id, maxIdLen)} | ${padRight(filling.name, maxNameLen)} | ${padRight(
        category,
        maxCategoryLen
      )} | ${padRight(String(filling.versionCount), maxVersionsLen)} | ${tags}`
    );
  }

  return lines.join('\n');
}

/**
 * Formats filling list for output
 */
export function formatFillingList(fillings: IFillingListItem[], format: OutputFormat): string {
  switch (format) {
    case 'json':
      return JSON.stringify(fillings, null, 2);
    case 'yaml':
      return yaml.stringify(fillings);
    case 'table':
      return formatFillingListTable(fillings);
    case 'human':
    default:
      return formatFillingListHuman(fillings);
  }
}

// ============================================================================
// Filling Detail Formatting
// ============================================================================

/**
 * Formats a filling for human-readable output
 */
function formatFillingHuman(
  filling: Entities.Fillings.IFillingRecipeEntity,
  fillingId: FillingId,
  versionSpec?: FillingVersionSpec,
  context?: IFillingRenderContext
): string {
  const lines: string[] = [];

  lines.push(`Filling: ${filling.name}`);
  lines.push(`ID: ${fillingId}`);
  lines.push(`Category: ${filling.category}`);

  if (filling.description) {
    lines.push(`Description: ${filling.description}`);
  }

  if (filling.tags && filling.tags.length > 0) {
    lines.push(`Tags: ${filling.tags.join(', ')}`);
  }

  lines.push('');

  // Find the requested version
  const targetVersionSpec = versionSpec ?? filling.goldenVersionSpec;
  const version = filling.versions.find((v) => v.versionSpec === targetVersionSpec);

  if (!version) {
    lines.push(`Version ${targetVersionSpec} not found.`);
    lines.push(`Available versions: ${filling.versions.map((v) => v.versionSpec).join(', ')}`);
    return lines.join('\n');
  }

  const isGolden = targetVersionSpec === filling.goldenVersionSpec;
  lines.push(`Version: ${version.versionSpec}${isGolden ? ' (golden)' : ''}`);
  lines.push(`Created: ${version.createdDate}`);
  lines.push(`Base Weight: ${version.baseWeight}g`);

  if (version.yield) {
    lines.push(`Yield: ${version.yield}`);
  }

  if (version.notes) {
    lines.push(`Notes: ${version.notes}`);
  }

  lines.push('');
  lines.push('Ingredients:');

  // Find max ingredient ID length for alignment
  const maxIdLen = Math.max(...version.ingredients.map((i) => getIngredientDisplayId(i).length));

  for (const ingredient of version.ingredients) {
    const displayId = getIngredientDisplayId(ingredient);
    const pct = calculatePercentage(ingredient.amount, version.baseWeight);
    const notes = ingredient.notes ? `  (${ingredient.notes})` : '';
    lines.push(
      `  ${padRight(displayId, maxIdLen)}  ${padRight(
        formatNumber(ingredient.amount) + 'g',
        10
      )}  (${pct}%)${notes}`
    );
  }

  // Show ratings if present
  if (version.ratings && version.ratings.length > 0) {
    lines.push('');
    lines.push('Ratings:');
    for (const rating of version.ratings) {
      const notes = rating.notes ? ` - ${rating.notes}` : '';
      lines.push(`  ${padRight(rating.category, 12)}: ${rating.score}/5${notes}`);
    }
  }

  // Show procedures if present
  if (version.procedures && version.procedures.options.length > 0) {
    formatProcedureRefs(version.procedures, lines, context);
  }

  // Show URLs if present
  if (filling.urls && filling.urls.length > 0) {
    formatUrls(filling.urls, lines);
  }

  // Show other versions
  if (filling.versions.length > 1) {
    lines.push('');
    lines.push(`Other versions (${filling.versions.length - 1}):`);
    for (const v of filling.versions) {
      if (v.versionSpec !== targetVersionSpec) {
        const golden = v.versionSpec === filling.goldenVersionSpec ? ' (golden)' : '';
        lines.push(`  ${v.versionSpec}${golden} - ${v.createdDate}`);
      }
    }
  }

  return lines.join('\n');
}

/**
 * Formats a filling for table output (same as human for details)
 */
function formatFillingTable(
  filling: Entities.Fillings.IFillingRecipeEntity,
  fillingId: FillingId,
  versionSpec?: FillingVersionSpec,
  context?: IFillingRenderContext
): string {
  return formatFillingHuman(filling, fillingId, versionSpec, context);
}

/**
 * Formats a filling for output
 */
export function formatFilling(
  filling: Entities.Fillings.IFillingRecipeEntity,
  fillingId: FillingId,
  format: OutputFormat,
  versionSpec?: FillingVersionSpec,
  context?: IFillingRenderContext
): string {
  switch (format) {
    case 'json':
      return JSON.stringify(filling, null, 2);
    case 'yaml':
      return yaml.stringify(filling);
    case 'table':
      return formatFillingTable(filling, fillingId, versionSpec, context);
    case 'human':
    default:
      return formatFillingHuman(filling, fillingId, versionSpec, context);
  }
}

// ============================================================================
// Produced Filling Formatting
// ============================================================================

/**
 * Formats a produced filling for human-readable output
 */
function formatProducedFillingHuman(
  produced: Entities.Fillings.IProducedFillingEntity,
  sourceVersion: Entities.Fillings.IFillingRecipeVersionEntity,
  precision?: number
): string {
  const lines: string[] = [];

  const factor = produced.scaleFactor;
  const targetWeight = produced.targetWeight;
  const sourceWeight = sourceVersion.baseWeight;

  lines.push(`Produced Filling`);
  lines.push(`Source: ${produced.versionId}`);
  lines.push(`Scale Factor: ${formatNumber(factor, 2)}x`);
  lines.push(`Source Weight: ${sourceWeight}g`);
  lines.push(`Target Weight: ${targetWeight}g`);
  lines.push('');

  lines.push('Ingredients:');

  // Find max ingredient ID length for alignment
  const maxIdLen = Math.max(...produced.ingredients.map((i) => i.ingredientId.length));

  for (const ingredient of produced.ingredients) {
    const displayId = ingredient.ingredientId;
    const amount = ingredient.amount;
    const pct = calculatePercentage(amount, targetWeight);

    // Find original amount from source version
    const sourceIngredient = sourceVersion.ingredients.find((si) =>
      si.ingredient.ids.includes(ingredient.ingredientId)
    );
    const originalAmount = sourceIngredient ? sourceIngredient.amount : 0;
    const originalStr = `(was ${formatNumber(originalAmount, precision)}g)`;

    lines.push(
      `  ${padRight(displayId, maxIdLen)}  ${padRight(formatNumber(amount, precision) + 'g', 10)}  ${padRight(
        originalStr,
        16
      )}  (${pct}%)`
    );
  }

  lines.push('');
  lines.push(`Total: ${targetWeight}g`);

  return lines.join('\n');
}

/**
 * Formats a produced filling for table output (same as human)
 */
function formatProducedFillingTable(
  produced: Entities.Fillings.IProducedFillingEntity,
  sourceVersion: Entities.Fillings.IFillingRecipeVersionEntity,
  precision?: number
): string {
  return formatProducedFillingHuman(produced, sourceVersion, precision);
}

/**
 * Formats a produced filling for output
 */
export function formatProducedFilling(
  produced: Entities.Fillings.IProducedFillingEntity,
  sourceVersion: Entities.Fillings.IFillingRecipeVersionEntity,
  format: OutputFormat,
  precision?: number
): string {
  switch (format) {
    case 'json':
      return JSON.stringify(produced, null, 2);
    case 'yaml':
      return yaml.stringify(produced);
    case 'table':
      return formatProducedFillingTable(produced, sourceVersion, precision);
    case 'human':
    default:
      return formatProducedFillingHuman(produced, sourceVersion, precision);
  }
}
