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
import { fail, Result, succeed } from '@fgv/ts-utils';
import { Converters, Measurement, RecipeId, RecipeVersionSpec } from '@fgv/ts-chocolate';
import { Recipes } from '@fgv/ts-chocolate';

import {
  IRecipeShowOptions,
  loadRecipesLibrary,
  formatRecipe,
  formatScaledRecipe,
  OutputFormat
} from './shared';

/**
 * Parsed scale target specification
 */
interface IParsedScaleTarget {
  type: 'grams' | 'factor';
  value: number;
}

/**
 * Parses a scale target string into either grams or a factor.
 * Requires explicit suffix: "500g" for grams, "2x" for factor.
 */
function parseScaleTarget(target: string): Result<IParsedScaleTarget> {
  const trimmed = target.trim().toLowerCase();

  // Check for factor suffix (e.g., "2x", "0.5x")
  if (trimmed.endsWith('x')) {
    const factorStr = trimmed.slice(0, -1);
    const factor = parseFloat(factorStr);
    if (isNaN(factor) || factor <= 0) {
      return fail(`Invalid scale factor "${target}": must be a positive number followed by 'x'`);
    }
    return succeed({ type: 'factor', value: factor });
  }

  // Check for grams suffix (e.g., "500g", "1000g")
  if (trimmed.endsWith('g')) {
    const gramsStr = trimmed.slice(0, -1);
    const grams = parseFloat(gramsStr);
    if (isNaN(grams) || grams <= 0) {
      return fail(`Invalid weight "${target}": must be a positive number followed by 'g'`);
    }
    return succeed({ type: 'grams', value: grams });
  }

  return fail(
    `Invalid scale target "${target}": use 'g' suffix for grams (e.g., "500g") or 'x' suffix for multiplier (e.g., "2x")`
  );
}

/**
 * Creates the recipe show subcommand
 */
export function createShowSubcommand(): Command {
  const cmd = new Command('show');

  cmd
    .description('Display details of a specific recipe')
    .argument('<recipeId>', 'Recipe ID (e.g., "common.dark-ganache-classic")')
    .option('--version <spec>', 'Show a specific version (default: golden version)')
    .option('--scale <target>', 'Scale recipe to target weight or multiplier (e.g., "500g" or "2x")')
    .option('--precision <n>', 'Decimal places for scaled amounts (default: 1)')
    .action(
      async (recipeIdArg: string, localOptions: { version?: string; scale?: string; precision?: string }) => {
        // Merge with parent options
        const parentOptions = cmd.optsWithGlobals() as IRecipeShowOptions;
        const options: IRecipeShowOptions = {
          ...parentOptions,
          ...localOptions
        };

        // Validate recipe ID
        const recipeIdResult = Converters.recipeId.convert(recipeIdArg);
        if (recipeIdResult.isFailure()) {
          console.error(`Invalid recipe ID "${recipeIdArg}": ${recipeIdResult.message}`);
          process.exit(1);
        }
        const recipeId = recipeIdResult.value as RecipeId;

        // Load the recipes library
        const libraryResult = await loadRecipesLibrary(options);
        if (libraryResult.isFailure()) {
          console.error(`Error loading recipes: ${libraryResult.message}`);
          process.exit(1);
        }
        const library = libraryResult.value;

        // Get the recipe
        const recipeResult = library.get(recipeId);
        if (recipeResult.isFailure()) {
          console.error(`Recipe not found: ${recipeId}`);
          process.exit(1);
        }
        const recipe = recipeResult.value;

        // Validate version spec if provided
        let versionSpec: RecipeVersionSpec | undefined;
        if (options.version) {
          const versionResult = Converters.recipeVersionSpec.convert(options.version);
          if (versionResult.isFailure()) {
            console.error(`Invalid version spec "${options.version}": ${versionResult.message}`);
            process.exit(1);
          }
          versionSpec = versionResult.value;

          // Check that the version exists
          const version = recipe.versions.find((v) => v.versionSpec === versionSpec);
          if (!version) {
            console.error(`Version ${versionSpec} not found in recipe ${recipeId}`);
            console.error(`Available versions: ${recipe.versions.map((v) => v.versionSpec).join(', ')}`);
            process.exit(1);
          }
        }

        const format = (options.format ?? 'human') as OutputFormat;

        // If scaling requested, show scaled recipe
        if (localOptions.scale) {
          const targetResult = parseScaleTarget(localOptions.scale);
          if (targetResult.isFailure()) {
            console.error(targetResult.message);
            process.exit(1);
          }
          const target = targetResult.value;

          // Build scale options
          const precision = localOptions.precision ? parseInt(localOptions.precision, 10) : undefined;
          const scaleOptions: Recipes.IRecipeScaleOptions = {
            versionSpec,
            precision
          };

          // Scale the recipe
          let scaledResult: Result<Recipes.IComputedScaledRecipe>;
          if (target.type === 'factor') {
            scaledResult = Recipes.scaleRecipeByFactor(recipe, recipeId, target.value, scaleOptions);
          } else {
            scaledResult = Recipes.scaleRecipe(recipe, recipeId, target.value as Measurement, scaleOptions);
          }

          if (scaledResult.isFailure()) {
            console.error(`Error scaling recipe: ${scaledResult.message}`);
            process.exit(1);
          }

          const output = formatScaledRecipe(scaledResult.value, format);
          console.log(output);
        } else {
          // Show regular recipe details
          const output = formatRecipe(recipe, recipeId, format, versionSpec);
          console.log(output);
        }
      }
    );

  return cmd;
}
