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
import { Helpers, RecipeId, SourceId } from '@fgv/ts-chocolate';
import { Recipes } from '@fgv/ts-chocolate';

import {
  IRecipeListOptions,
  loadRecipesLibrary,
  formatRecipeList,
  IRecipeListItem,
  OutputFormat
} from './shared';

/**
 * Checks if a recipe matches the specified filters
 */
function matchesFilters(
  recipe: Recipes.IRecipe,
  recipeId: RecipeId,
  sourceId: SourceId,
  options: IRecipeListOptions
): boolean {
  // Filter by source
  if (options.source && sourceId !== options.source) {
    return false;
  }

  // Filter by name (case-insensitive substring)
  if (options.name) {
    const nameLower = recipe.name.toLowerCase();
    const patternLower = options.name.toLowerCase();
    if (!nameLower.includes(patternLower)) {
      return false;
    }
  }

  // Filter by tags (AND logic - must have all specified tags)
  if (options.tag && options.tag.length > 0) {
    const recipeTags = new Set(recipe.tags ?? []);
    for (const requiredTag of options.tag) {
      if (!recipeTags.has(requiredTag)) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Creates the recipe list subcommand
 */
export function createListSubcommand(): Command {
  const cmd = new Command('list');

  cmd
    .description('List recipes with optional filtering')
    .option('--tag <tag>', 'Filter by tag (can be repeated)', (val, prev: string[]) => [...prev, val], [])
    .option('--source <sourceId>', 'Filter by source collection ID')
    .option('--name <pattern>', 'Filter by name (case-insensitive substring match)')
    .action(async (localOptions: { tag?: string[]; source?: string; name?: string }) => {
      // Merge with parent options
      const parentOptions = cmd.optsWithGlobals() as IRecipeListOptions;
      const options: IRecipeListOptions = {
        ...parentOptions,
        ...localOptions
      };

      // Load the recipes library
      const libraryResult = await loadRecipesLibrary(options);
      if (libraryResult.isFailure()) {
        console.error(`Error loading recipes: ${libraryResult.message}`);
        process.exit(1);
      }
      const library = libraryResult.value;

      // Collect matching recipes
      const matchingRecipes: IRecipeListItem[] = [];

      for (const [recipeId, recipe] of library.entries()) {
        // Get the source ID from the composite ID
        const sourceId = Helpers.getRecipeSourceId(recipeId);

        // Apply filters
        if (!matchesFilters(recipe, recipeId, sourceId, options)) {
          continue;
        }

        // Add to results
        matchingRecipes.push({
          id: recipeId,
          name: recipe.name,
          sourceId,
          category: recipe.category,
          description: recipe.description,
          tags: recipe.tags,
          versionCount: recipe.versions.length,
          goldenVersionSpec: recipe.goldenVersionSpec
        });
      }

      // Sort by ID for consistent output
      matchingRecipes.sort((a, b) => a.id.localeCompare(b.id));

      // Format and output
      const format = (options.format ?? 'human') as OutputFormat;
      const output = formatRecipeList(matchingRecipes, format);
      console.log(output);
    });

  return cmd;
}
