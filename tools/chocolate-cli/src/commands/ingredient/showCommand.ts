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
import * as yaml from 'yaml';
import { Converters, Entities, IngredientId } from '@fgv/ts-chocolate';

import {
  IEntityBaseOptions,
  ISelectableItem,
  OutputFormat,
  loadIngredientsLibrary,
  formatNumber,
  formatUrls,
  padRight,
  interactiveSelect
} from '../shared';

/**
 * Options for ingredient show command
 */
interface IIngredientShowOptions extends IEntityBaseOptions {
  interactive?: boolean;
  ganache?: boolean;
  tempering?: boolean;
}

/**
 * Ingredient selectable item for interactive mode
 */
interface IIngredientSelectableItem extends ISelectableItem {
  id: IngredientId;
  ingredient: Entities.Ingredients.IngredientEntity;
}

/**
 * Formats an ingredient for human-readable output
 */
export function formatIngredientHuman(
  ingredient: Entities.Ingredients.IngredientEntity,
  ingredientId: IngredientId,
  options: IIngredientShowOptions
): string {
  const lines: string[] = [];

  lines.push(`Ingredient: ${ingredient.name}`);
  lines.push(`ID: ${ingredientId}`);
  lines.push(`Category: ${ingredient.category}`);

  if (ingredient.manufacturer) {
    lines.push(`Manufacturer: ${ingredient.manufacturer}`);
  }

  if (ingredient.description) {
    lines.push(`Description: ${ingredient.description}`);
  }

  if (ingredient.tags && ingredient.tags.length > 0) {
    lines.push(`Tags: ${ingredient.tags.join(', ')}`);
  }

  // Chocolate-specific information
  if (Entities.Ingredients.isChocolateIngredientEntity(ingredient)) {
    lines.push('');
    lines.push('Chocolate Details:');
    lines.push(`  Type: ${ingredient.chocolateType}`);
    lines.push(`  Cacao: ${ingredient.cacaoPercentage}%`);

    if (ingredient.fluidityStars !== undefined) {
      lines.push(`  Fluidity: ${ingredient.fluidityStars} stars`);
    }

    if (ingredient.viscosityMcM !== undefined) {
      lines.push(`  Viscosity: ${ingredient.viscosityMcM} McM`);
    }

    if (ingredient.applications && ingredient.applications.length > 0) {
      lines.push(`  Applications: ${ingredient.applications.join(', ')}`);
    }

    if (ingredient.origins && ingredient.origins.length > 0) {
      lines.push(`  Origins: ${ingredient.origins.join(', ')}`);
    }

    if (ingredient.beanVarieties && ingredient.beanVarieties.length > 0) {
      lines.push(`  Bean Varieties: ${ingredient.beanVarieties.join(', ')}`);
    }

    // Tempering information
    if ((options.tempering || !options.ganache) && ingredient.temperatureCurve) {
      lines.push('');
      lines.push('Tempering Curve:');
      lines.push(`  Melt: ${ingredient.temperatureCurve.melt}°C`);
      lines.push(`  Cool: ${ingredient.temperatureCurve.cool}°C`);
      lines.push(`  Working: ${ingredient.temperatureCurve.working}°C`);
    }
  }

  // Sugar-specific information
  if (Entities.Ingredients.isSugarIngredientEntity(ingredient)) {
    if (ingredient.sweetnessPotency !== undefined) {
      lines.push(`Sweetness Potency: ${ingredient.sweetnessPotency}x (vs sucrose)`);
    }
    if (ingredient.hydrationNumber !== undefined) {
      lines.push(`Hydration Number: ${ingredient.hydrationNumber}`);
    }
  }

  // Dairy-specific information
  if (Entities.Ingredients.isDairyIngredientEntity(ingredient)) {
    if (ingredient.fatContent !== undefined) {
      lines.push(`Fat Content: ${ingredient.fatContent}%`);
    }
    if (ingredient.waterContent !== undefined) {
      lines.push(`Water Content: ${ingredient.waterContent}%`);
    }
  }

  // Fat-specific information
  if (Entities.Ingredients.isFatIngredientEntity(ingredient)) {
    if (ingredient.meltingPoint !== undefined) {
      lines.push(`Melting Point: ${ingredient.meltingPoint}°C`);
    }
  }

  // Alcohol-specific information
  if (Entities.Ingredients.isAlcoholIngredientEntity(ingredient)) {
    if (ingredient.alcoholByVolume !== undefined) {
      lines.push(`ABV: ${ingredient.alcoholByVolume}%`);
    }
    if (ingredient.flavorProfile) {
      lines.push(`Flavor Profile: ${ingredient.flavorProfile}`);
    }
  }

  // Ganache characteristics
  if (options.ganache !== false) {
    const gc = ingredient.ganacheCharacteristics;
    lines.push('');
    lines.push('Ganache Characteristics:');
    lines.push(`  ${padRight('Cacao Fat:', 14)} ${formatNumber(gc.cacaoFat, 1)}%`);
    lines.push(`  ${padRight('Sugar:', 14)} ${formatNumber(gc.sugar, 1)}%`);
    lines.push(`  ${padRight('Milk Fat:', 14)} ${formatNumber(gc.milkFat, 1)}%`);
    lines.push(`  ${padRight('Water:', 14)} ${formatNumber(gc.water, 1)}%`);
    lines.push(`  ${padRight('Solids:', 14)} ${formatNumber(gc.solids, 1)}%`);
    lines.push(`  ${padRight('Other Fats:', 14)} ${formatNumber(gc.otherFats, 1)}%`);
  }

  // Allergens
  if (ingredient.allergens && ingredient.allergens.length > 0) {
    lines.push('');
    lines.push(`Allergens: ${ingredient.allergens.join(', ')}`);
  }

  if (ingredient.traceAllergens && ingredient.traceAllergens.length > 0) {
    lines.push(`Trace Allergens: ${ingredient.traceAllergens.join(', ')}`);
  }

  // Certifications
  if (ingredient.certifications && ingredient.certifications.length > 0) {
    lines.push('');
    lines.push(`Certifications: ${ingredient.certifications.join(', ')}`);
  }

  if (ingredient.vegan !== undefined) {
    lines.push(`Vegan: ${ingredient.vegan ? 'Yes' : 'No'}`);
  }

  // Additional info
  if (ingredient.density !== undefined) {
    lines.push(`Density: ${ingredient.density} g/mL`);
  }

  if (ingredient.phase) {
    lines.push(`Phase: ${ingredient.phase}`);
  }

  // URLs
  if (ingredient.urls && ingredient.urls.length > 0) {
    formatUrls(ingredient.urls, lines);
  }

  return lines.join('\n');
}

/**
 * Creates the ingredient show subcommand
 */
export function createShowSubcommand(): Command {
  const cmd = new Command('show');

  cmd
    .description('Display details of a specific ingredient')
    .argument('[ingredientId]', 'Ingredient ID (e.g., "felchlin.maracaibo-65")')
    .option('-i, --interactive', 'Interactively select an ingredient')
    .option('--ganache', 'Show ganache characteristics (default: true)')
    .option('--no-ganache', 'Hide ganache characteristics')
    .option('--tempering', 'Show tempering curve for chocolate (default: true)')
    .action(
      async (
        ingredientIdArg: string | undefined,
        localOptions: { interactive?: boolean; ganache?: boolean; tempering?: boolean }
      ) => {
        // Merge with parent options
        const parentOptions = cmd.optsWithGlobals() as IIngredientShowOptions;
        const options: IIngredientShowOptions = {
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

        // Determine ingredient ID - either from argument or interactive selection
        let ingredientId: IngredientId;
        let ingredient: Entities.Ingredients.IngredientEntity;

        if (localOptions.interactive || !ingredientIdArg) {
          if (!localOptions.interactive && !ingredientIdArg) {
            console.error('Error: Either provide an ingredient ID or use --interactive (-i) to select one');
            process.exit(1);
          }

          // Build selectable items
          const selectableItems: IIngredientSelectableItem[] = [];
          for (const [id, ing] of library.entries()) {
            const categoryInfo = Entities.Ingredients.isChocolateIngredientEntity(ing)
              ? `${ing.category}:${ing.chocolateType}`
              : ing.category;
            selectableItems.push({
              id,
              name: ing.name,
              description: `[${categoryInfo}] ${ing.manufacturer ?? ''}`,
              ingredient: ing
            });
          }
          selectableItems.sort((a, b) => a.id.localeCompare(b.id));

          // Show interactive selector
          const selectionResult = await interactiveSelect({
            items: selectableItems,
            prompt: 'Select an ingredient:',
            formatName: (item) => {
              const mfg = item.ingredient.manufacturer ? ` (${item.ingredient.manufacturer})` : '';
              return `${item.id} - ${item.name}${mfg}`;
            }
          });

          if (selectionResult.isFailure()) {
            console.error(`Selection error: ${selectionResult.message}`);
            process.exit(1);
          }

          if (selectionResult.value === 'cancelled') {
            process.exit(0);
          }

          ingredientId = selectionResult.value.id;
          ingredient = selectionResult.value.ingredient;
          console.log(''); // Blank line after selection
        } else {
          // Validate ingredient ID from argument
          const ingredientIdResult = Converters.ingredientId.convert(ingredientIdArg);
          if (ingredientIdResult.isFailure()) {
            console.error(`Invalid ingredient ID "${ingredientIdArg}": ${ingredientIdResult.message}`);
            process.exit(1);
          }
          ingredientId = ingredientIdResult.value;

          // Get the ingredient
          const ingredientResult = library.get(ingredientId);
          if (ingredientResult.isFailure()) {
            console.error(`Ingredient not found: ${ingredientId}`);
            process.exit(1);
          }
          ingredient = ingredientResult.value;
        }

        const format = (options.format ?? 'human') as OutputFormat;

        // Format and output
        switch (format) {
          case 'json':
            console.log(JSON.stringify(ingredient, null, 2));
            break;
          case 'yaml':
            console.log(yaml.stringify(ingredient));
            break;
          case 'table':
          case 'human':
          default:
            console.log(formatIngredientHuman(ingredient, ingredientId, options));
            break;
        }
      }
    );

  return cmd;
}
