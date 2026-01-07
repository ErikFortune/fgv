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
import { Grams, RecipeId, RecipeName, RecipeVersionSpec, SourceId } from '@fgv/ts-chocolate';
import { Recipes } from '@fgv/ts-chocolate';

import { OutputFormat } from './types';

/**
 * Summary information for a recipe in list output
 */
export interface IRecipeListItem {
  id: RecipeId;
  name: RecipeName;
  sourceId: SourceId;
  description?: string;
  tags?: ReadonlyArray<string>;
  versionCount: number;
  goldenVersionSpec: RecipeVersionSpec;
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
function calculatePercentage(amount: Grams, baseWeight: Grams): string {
  const pct = (amount / baseWeight) * 100;
  return formatNumber(pct, 1);
}

// ============================================================================
// Recipe List Formatting
// ============================================================================

/**
 * Formats recipe list as human-readable output
 */
function formatRecipeListHuman(recipes: IRecipeListItem[]): string {
  if (recipes.length === 0) {
    return 'No recipes found.';
  }

  const lines: string[] = [];
  lines.push(`Found ${recipes.length} recipe(s):\n`);

  // Find max lengths for table alignment
  const maxIdLen = Math.max(...recipes.map((r) => r.id.length), 2);
  const maxNameLen = Math.max(...recipes.map((r) => r.name.length), 4);

  // Header
  lines.push(`${padRight('ID', maxIdLen)}  ${padRight('Name', maxNameLen)}  Versions  Tags`);
  lines.push(`${'-'.repeat(maxIdLen)}  ${'-'.repeat(maxNameLen)}  --------  ----`);

  for (const recipe of recipes) {
    const tags = recipe.tags?.join(', ') ?? '';
    lines.push(
      `${padRight(recipe.id, maxIdLen)}  ${padRight(recipe.name, maxNameLen)}  ${padRight(
        String(recipe.versionCount),
        8
      )}  ${tags}`
    );
  }

  return lines.join('\n');
}

/**
 * Formats recipe list as table output
 */
function formatRecipeListTable(recipes: IRecipeListItem[]): string {
  if (recipes.length === 0) {
    return 'No recipes found.';
  }

  const lines: string[] = [];

  // Find max lengths for table alignment
  const maxIdLen = Math.max(...recipes.map((r) => r.id.length), 2);
  const maxNameLen = Math.max(...recipes.map((r) => r.name.length), 4);
  const maxVersionsLen = Math.max(...recipes.map((r) => String(r.versionCount).length), 8);

  // Header
  lines.push(
    `${padRight('ID', maxIdLen)} | ${padRight('Name', maxNameLen)} | ${padRight(
      'Versions',
      maxVersionsLen
    )} | Tags`
  );
  lines.push(`${'-'.repeat(maxIdLen)}-+-${'-'.repeat(maxNameLen)}-+-${'-'.repeat(maxVersionsLen)}-+------`);

  for (const recipe of recipes) {
    const tags = recipe.tags?.join(', ') ?? '';
    lines.push(
      `${padRight(recipe.id, maxIdLen)} | ${padRight(recipe.name, maxNameLen)} | ${padRight(
        String(recipe.versionCount),
        maxVersionsLen
      )} | ${tags}`
    );
  }

  return lines.join('\n');
}

/**
 * Formats recipe list for output
 */
export function formatRecipeList(recipes: IRecipeListItem[], format: OutputFormat): string {
  switch (format) {
    case 'json':
      return JSON.stringify(recipes, null, 2);
    case 'yaml':
      return yaml.stringify(recipes);
    case 'table':
      return formatRecipeListTable(recipes);
    case 'human':
    default:
      return formatRecipeListHuman(recipes);
  }
}

// ============================================================================
// Recipe Detail Formatting
// ============================================================================

/**
 * Formats a recipe for human-readable output
 */
function formatRecipeHuman(
  recipe: Recipes.IRecipe,
  recipeId: RecipeId,
  versionSpec?: RecipeVersionSpec
): string {
  const lines: string[] = [];

  lines.push(`Recipe: ${recipe.name}`);
  lines.push(`ID: ${recipeId}`);

  if (recipe.description) {
    lines.push(`Description: ${recipe.description}`);
  }

  if (recipe.tags && recipe.tags.length > 0) {
    lines.push(`Tags: ${recipe.tags.join(', ')}`);
  }

  lines.push('');

  // Find the requested version
  const targetVersionSpec = versionSpec ?? recipe.goldenVersionSpec;
  const version = recipe.versions.find((v) => v.versionSpec === targetVersionSpec);

  if (!version) {
    lines.push(`Version ${targetVersionSpec} not found.`);
    lines.push(`Available versions: ${recipe.versions.map((v) => v.versionSpec).join(', ')}`);
    return lines.join('\n');
  }

  const isGolden = targetVersionSpec === recipe.goldenVersionSpec;
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
  const maxIdLen = Math.max(...version.ingredients.map((i) => i.ingredientId.length));

  for (const ingredient of version.ingredients) {
    const pct = calculatePercentage(ingredient.amount, version.baseWeight);
    const notes = ingredient.notes ? `  (${ingredient.notes})` : '';
    lines.push(
      `  ${padRight(ingredient.ingredientId, maxIdLen)}  ${padRight(
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

  // Show other versions
  if (recipe.versions.length > 1) {
    lines.push('');
    lines.push(`Other versions (${recipe.versions.length - 1}):`);
    for (const v of recipe.versions) {
      if (v.versionSpec !== targetVersionSpec) {
        const golden = v.versionSpec === recipe.goldenVersionSpec ? ' (golden)' : '';
        lines.push(`  ${v.versionSpec}${golden} - ${v.createdDate}`);
      }
    }
  }

  return lines.join('\n');
}

/**
 * Formats a recipe for table output (same as human for details)
 */
function formatRecipeTable(
  recipe: Recipes.IRecipe,
  recipeId: RecipeId,
  versionSpec?: RecipeVersionSpec
): string {
  return formatRecipeHuman(recipe, recipeId, versionSpec);
}

/**
 * Formats a recipe for output
 */
export function formatRecipe(
  recipe: Recipes.IRecipe,
  recipeId: RecipeId,
  format: OutputFormat,
  versionSpec?: RecipeVersionSpec
): string {
  switch (format) {
    case 'json':
      return JSON.stringify(recipe, null, 2);
    case 'yaml':
      return yaml.stringify(recipe);
    case 'table':
      return formatRecipeTable(recipe, recipeId, versionSpec);
    case 'human':
    default:
      return formatRecipeHuman(recipe, recipeId, versionSpec);
  }
}

// ============================================================================
// Scaled Recipe Formatting
// ============================================================================

/**
 * Formats a scaled recipe for human-readable output
 */
function formatScaledRecipeHuman(scaled: Recipes.IComputedScaledRecipe): string {
  const lines: string[] = [];

  const sourceVersionId = scaled.scaledFrom.sourceVersionId;
  const factor = scaled.scaledFrom.scaleFactor;
  const targetWeight = scaled.scaledFrom.targetWeight;

  lines.push(`Scaled Recipe`);
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
  const maxIdLen = Math.max(...scaled.ingredients.map((i) => i.ingredientId.length));

  for (const ingredient of scaled.ingredients) {
    const pct = calculatePercentage(ingredient.amount, scaled.baseWeight);
    const originalStr = `(was ${formatNumber(ingredient.originalAmount)}g)`;
    lines.push(
      `  ${padRight(ingredient.ingredientId, maxIdLen)}  ${padRight(
        formatNumber(ingredient.amount) + 'g',
        10
      )}  ${padRight(originalStr, 16)}  (${pct}%)`
    );
  }

  lines.push('');
  lines.push(`Total: ${scaled.baseWeight}g`);

  return lines.join('\n');
}

/**
 * Formats a scaled recipe for table output (same as human)
 */
function formatScaledRecipeTable(scaled: Recipes.IComputedScaledRecipe): string {
  return formatScaledRecipeHuman(scaled);
}

/**
 * Formats a scaled recipe for output
 */
export function formatScaledRecipe(scaled: Recipes.IComputedScaledRecipe, format: OutputFormat): string {
  switch (format) {
    case 'json':
      return JSON.stringify(scaled, null, 2);
    case 'yaml':
      return yaml.stringify(scaled);
    case 'table':
      return formatScaledRecipeTable(scaled);
    case 'human':
    default:
      return formatScaledRecipeHuman(scaled);
  }
}
