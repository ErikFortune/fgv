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

import { Command } from 'commander';
import { Entities, Helpers, IngredientId, SourceId } from '@fgv/ts-chocolate';

import {
  IEntityListOptions,
  OutputFormat,
  loadIngredientsLibrary,
  formatList,
  addCommonFilterOptions,
  IColumnConfig,
  IGenericListItem
} from '../shared';

/**
 * Ingredient list item for display
 */
interface IIngredientListItem extends IGenericListItem {
  id: IngredientId;
  category: string;
  manufacturer?: string;
  chocolateType?: string;
  cacaoPercentage?: number;
}

/**
 * Extended options for ingredient list command
 */
interface IIngredientListOptions extends IEntityListOptions {
  category?: string;
  chocolateType?: string;
  manufacturer?: string;
}

/**
 * Checks if an ingredient matches the specified filters
 */
function matchesFilters(
  ingredient: Entities.Ingredients.Ingredient,
  ingredientId: IngredientId,
  sourceId: SourceId,
  options: IIngredientListOptions
): boolean {
  // Filter by source
  if (options.source && sourceId !== options.source) {
    return false;
  }

  // Filter by name (case-insensitive substring)
  if (options.name) {
    const nameLower = ingredient.name.toLowerCase();
    const patternLower = options.name.toLowerCase();
    if (!nameLower.includes(patternLower)) {
      return false;
    }
  }

  // Filter by category
  if (options.category && ingredient.category !== options.category) {
    return false;
  }

  // Filter by manufacturer (case-insensitive substring)
  if (options.manufacturer) {
    const mfgLower = (ingredient.manufacturer ?? '').toLowerCase();
    const patternLower = options.manufacturer.toLowerCase();
    if (!mfgLower.includes(patternLower)) {
      return false;
    }
  }

  // Filter by chocolate type (only for chocolate ingredients)
  if (options.chocolateType) {
    if (!Entities.Ingredients.isChocolateIngredient(ingredient)) {
      return false;
    }
    if (ingredient.chocolateType !== options.chocolateType) {
      return false;
    }
  }

  // Filter by tags (AND logic - must have all specified tags)
  if (options.tag && options.tag.length > 0) {
    const ingredientTags = new Set(ingredient.tags ?? []);
    for (const requiredTag of options.tag) {
      if (!ingredientTags.has(requiredTag)) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Column configuration for ingredient list
 */
const ingredientColumns: IColumnConfig[] = [
  { header: 'ID', getValue: (item) => item.id, minWidth: 2 },
  { header: 'Name', getValue: (item) => item.name, minWidth: 4 },
  { header: 'Category', getValue: (item) => (item as IIngredientListItem).category, minWidth: 8 },
  {
    header: 'Manufacturer',
    getValue: (item) => (item as IIngredientListItem).manufacturer ?? '',
    minWidth: 12
  },
  { header: 'Type', getValue: (item) => (item as IIngredientListItem).chocolateType ?? '', minWidth: 4 },
  {
    header: 'Cacao%',
    getValue: (item) => {
      const pct = (item as IIngredientListItem).cacaoPercentage;
      return pct !== undefined ? `${pct}%` : '';
    },
    minWidth: 6
  },
  { header: 'Tags', getValue: (item) => (item.tags ?? []).join(', '), minWidth: 4 }
];

/**
 * Creates the ingredient list subcommand
 */
export function createListSubcommand(): Command {
  const cmd = new Command('list');

  cmd.description('List ingredients with optional filtering');

  // Add common filter options
  addCommonFilterOptions(cmd);

  // Add ingredient-specific filter options
  cmd
    .option('--category <category>', 'Filter by ingredient category (chocolate, sugar, dairy, fat, alcohol)')
    .option('--chocolate-type <type>', 'Filter by chocolate type (dark, milk, white, ruby)')
    .option('--manufacturer <name>', 'Filter by manufacturer (case-insensitive substring match)');

  cmd.action(
    async (localOptions: {
      tag?: string[];
      source?: string;
      name?: string;
      category?: string;
      chocolateType?: string;
      manufacturer?: string;
    }) => {
      // Merge with parent options
      const parentOptions = cmd.optsWithGlobals() as IIngredientListOptions;
      const options: IIngredientListOptions = {
        ...parentOptions,
        ...localOptions
      };

      // Load the ingredients library
      const libraryResult = await loadIngredientsLibrary(options);
      if (libraryResult.isFailure()) {
        console.error(`Error loading ingredients: ${libraryResult.message}`);
        process.exit(1);
      }
      const library = libraryResult.value;

      // Collect matching ingredients
      const matchingIngredients: IIngredientListItem[] = [];

      for (const [ingredientId, ingredient] of library.entries()) {
        // Get the source ID from the composite ID
        const sourceId = Helpers.getIngredientSourceId(ingredientId);

        // Apply filters
        if (!matchesFilters(ingredient, ingredientId, sourceId, options)) {
          continue;
        }

        // Build list item
        const listItem: IIngredientListItem = {
          id: ingredientId,
          name: ingredient.name,
          sourceId,
          category: ingredient.category,
          description: ingredient.description,
          tags: ingredient.tags,
          manufacturer: ingredient.manufacturer
        };

        // Add chocolate-specific fields
        if (Entities.Ingredients.isChocolateIngredient(ingredient)) {
          listItem.chocolateType = ingredient.chocolateType;
          listItem.cacaoPercentage = ingredient.cacaoPercentage;
        }

        matchingIngredients.push(listItem);
      }

      // Sort by ID for consistent output
      matchingIngredients.sort((a, b) => a.id.localeCompare(b.id));

      // Format and output
      const format = (options.format ?? 'human') as OutputFormat;
      const output = formatList(matchingIngredients, format, 'ingredient', ingredientColumns);
      console.log(output);
    }
  );

  return cmd;
}
