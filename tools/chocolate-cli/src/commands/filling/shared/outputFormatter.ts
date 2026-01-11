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
  FillingId,
  FillingName,
  FillingVersionSpec,
  Fillings,
  ICategorizedUrl,
  IOptionsWithPreferred,
  IRefWithNotes,
  Measurement,
  ProcedureId,
  Procedures,
  SourceId
} from '@fgv/ts-chocolate';

import { OutputFormat } from './types';

/**
 * Context for rendering procedures (prepared for future templating support)
 */
export interface IFillingRenderContext {
  /**
   * The library for ingredient/filling lookups (for future templating)
   */
  library?: Fillings.FillingsLibrary;

  /**
   * Procedure library for resolving procedure references
   */
  procedureLibrary?: Procedures.ProceduresLibrary;
}

/**
 * Summary information for a filling in list output
 */
export interface IFillingListItem {
  id: FillingId;
  name: FillingName;
  sourceId: SourceId;
  category: Fillings.FillingCategory;
  description?: string;
  tags?: ReadonlyArray<string>;
  versionCount: number;
  goldenVersionSpec: FillingVersionSpec;
}

/**
 * Formats a number with a specified precision
 */
function formatNumber(value: number, precision: number = 1): string {
  return value.toFixed(precision);
}

/**
 * Pads a string to a given length
 */
function padRight(str: string, length: number): string {
  return str.padEnd(length);
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
function getIngredientDisplayId(ingredient: Fillings.IFillingIngredient): string {
  return ingredient.ingredient.preferredId ?? ingredient.ingredient.ids[0];
}

/**
 * Gets the preferred ID from an IOptionsWithPreferred structure.
 * Returns preferredId if set, otherwise the first option's ID.
 */
function getPreferredId<TOption extends { id: TId }, TId extends string>(
  options: IOptionsWithPreferred<TOption, TId>
): TId | undefined {
  if (options.preferredId) {
    return options.preferredId;
  }
  return options.options.length > 0 ? options.options[0].id : undefined;
}

/**
 * Formats procedure references for human output
 */
function formatProcedureRefs(
  procedures: IOptionsWithPreferred<IRefWithNotes<ProcedureId>, ProcedureId>,
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

/**
 * Formats categorized URLs for human output
 */
function formatUrls(urls: ReadonlyArray<ICategorizedUrl>, lines: string[]): void {
  lines.push('');
  lines.push('URLs:');

  for (const url of urls) {
    lines.push(`  [${url.category}] ${url.url}`);
  }
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
  filling: Fillings.IFillingRecipe,
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
  filling: Fillings.IFillingRecipe,
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
  filling: Fillings.IFillingRecipe,
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
// Scaled Filling Formatting
// ============================================================================

/**
 * Formats a scaled filling for human-readable output
 */
function formatScaledFillingHuman(scaled: Fillings.IComputedScaledFillingRecipe): string {
  const lines: string[] = [];

  const sourceVersionId = scaled.scaledFrom.sourceVersionId;
  const factor = scaled.scaledFrom.scaleFactor;
  const targetWeight = scaled.scaledFrom.targetWeight;

  lines.push(`Scaled Filling`);
  lines.push(`Source: ${sourceVersionId}`);
  lines.push(`Scale Factor: ${formatNumber(factor, 2)}x`);
  lines.push(`Target Weight: ${targetWeight}g`);
  lines.push('');

  if (scaled.yield) {
    lines.push(`Original Yield: ${scaled.yield}`);
    lines.push('');
  }

  lines.push('Ingredients:');

  // Find max ingredient ID length for alignment
  const maxIdLen = Math.max(...scaled.ingredients.map((i) => getIngredientDisplayId(i).length));

  for (const ingredient of scaled.ingredients) {
    const displayId = getIngredientDisplayId(ingredient);
    const pct = calculatePercentage(ingredient.amount, scaled.baseWeight);
    const originalStr = `(was ${formatNumber(ingredient.originalAmount)}g)`;
    lines.push(
      `  ${padRight(displayId, maxIdLen)}  ${padRight(formatNumber(ingredient.amount) + 'g', 10)}  ${padRight(
        originalStr,
        16
      )}  (${pct}%)`
    );
  }

  lines.push('');
  lines.push(`Total: ${scaled.baseWeight}g`);

  return lines.join('\n');
}

/**
 * Formats a scaled filling for table output (same as human)
 */
function formatScaledFillingTable(scaled: Fillings.IComputedScaledFillingRecipe): string {
  return formatScaledFillingHuman(scaled);
}

/**
 * Formats a scaled filling for output
 */
export function formatScaledFilling(
  scaled: Fillings.IComputedScaledFillingRecipe,
  format: OutputFormat
): string {
  switch (format) {
    case 'json':
      return JSON.stringify(scaled, null, 2);
    case 'yaml':
      return yaml.stringify(scaled);
    case 'table':
      return formatScaledFillingTable(scaled);
    case 'human':
    default:
      return formatScaledFillingHuman(scaled);
  }
}
