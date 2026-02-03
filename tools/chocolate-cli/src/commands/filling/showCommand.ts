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
import {
  Converters,
  Entities,
  FillingId,
  FillingVersionId,
  FillingVersionSpec,
  Measurement
} from '@fgv/ts-chocolate';

import {
  IFillingShowOptions,
  loadFillingsLibrary,
  formatFilling,
  formatProducedFilling,
  OutputFormat
} from './shared';
import { interactiveSelect, ISelectableItem } from '../shared';

/**
 * Filling selectable item for interactive mode
 */
interface IFillingSelectableItem extends ISelectableItem {
  id: FillingId;
  filling: Entities.Fillings.IFillingRecipe;
}

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
 * Creates the filling show subcommand
 */
export function createShowSubcommand(): Command {
  const cmd = new Command('show');

  cmd
    .description('Display details of a specific filling')
    .argument('[fillingId]', 'Filling ID (e.g., "common.dark-ganache-classic")')
    .option('-i, --interactive', 'Interactively select a filling')
    .option('--version <spec>', 'Show a specific version (default: golden version)')
    .option('--scale <target>', 'Scale filling to target weight or multiplier (e.g., "500g" or "2x")')
    .option('--precision <n>', 'Decimal places for scaled amounts (default: 1)')
    .action(
      async (
        fillingIdArg: string | undefined,
        localOptions: { interactive?: boolean; version?: string; scale?: string; precision?: string }
      ) => {
        // Merge with parent options
        const parentOptions = cmd.optsWithGlobals() as IFillingShowOptions;
        const options: IFillingShowOptions = {
          ...parentOptions,
          ...localOptions
        };

        // Load the fillings library
        const libraryResult = await loadFillingsLibrary(options);
        if (libraryResult.isFailure()) {
          console.error(`Error loading fillings: ${libraryResult.message}`);
          process.exit(1);
        }
        const library = libraryResult.value;

        // Determine filling ID - either from argument or interactive selection
        let fillingId: FillingId;
        let filling: Entities.Fillings.IFillingRecipe;

        if (localOptions.interactive || !fillingIdArg) {
          if (!localOptions.interactive && !fillingIdArg) {
            console.error('Error: Either provide a filling ID or use --interactive (-i) to select one');
            process.exit(1);
          }

          // Build selectable items
          const selectableItems: IFillingSelectableItem[] = [];
          for (const [id, f] of library.entries()) {
            selectableItems.push({
              id,
              name: f.name,
              description: `[${f.category}]`,
              filling: f
            });
          }
          selectableItems.sort((a, b) => a.id.localeCompare(b.id));

          // Show interactive selector
          const selectionResult = await interactiveSelect({
            items: selectableItems,
            prompt: 'Select a filling:',
            formatName: (item) => `${item.id} - ${item.name}`
          });

          if (selectionResult.isFailure()) {
            console.error(`Selection error: ${selectionResult.message}`);
            process.exit(1);
          }

          if (selectionResult.value === 'cancelled') {
            process.exit(0);
          }

          fillingId = selectionResult.value.id;
          filling = selectionResult.value.filling;
          console.log(''); // Blank line after selection
        } else {
          // Validate filling ID from argument
          const fillingIdResult = Converters.fillingId.convert(fillingIdArg);
          if (fillingIdResult.isFailure()) {
            console.error(`Invalid filling ID "${fillingIdArg}": ${fillingIdResult.message}`);
            process.exit(1);
          }
          fillingId = fillingIdResult.value as FillingId;

          // Get the filling
          const fillingResult = library.get(fillingId);
          if (fillingResult.isFailure()) {
            console.error(`Filling not found: ${fillingId}`);
            process.exit(1);
          }
          filling = fillingResult.value;
        }

        // Validate version spec if provided
        let versionSpec: FillingVersionSpec | undefined;
        if (options.version) {
          const versionResult = Converters.fillingVersionSpec.convert(options.version);
          if (versionResult.isFailure()) {
            console.error(`Invalid version spec "${options.version}": ${versionResult.message}`);
            process.exit(1);
          }
          versionSpec = versionResult.value;

          // Check that the version exists
          const version = filling.versions.find((v) => v.versionSpec === versionSpec);
          if (!version) {
            console.error(`Version ${versionSpec} not found in filling ${fillingId}`);
            console.error(`Available versions: ${filling.versions.map((v) => v.versionSpec).join(', ')}`);
            process.exit(1);
          }
        }

        const format = (options.format ?? 'human') as OutputFormat;

        // If scaling requested, show produced filling
        if (localOptions.scale) {
          const targetResult = parseScaleTarget(localOptions.scale);
          if (targetResult.isFailure()) {
            console.error(targetResult.message);
            process.exit(1);
          }
          const target = targetResult.value;

          // Get the version to scale
          const sourceVersion = versionSpec
            ? filling.versions.find((v) => v.versionSpec === versionSpec)
            : filling.versions.find((v) => v.versionSpec === filling.goldenVersionSpec);

          if (!sourceVersion) {
            console.error(`Version not found`);
            process.exit(1);
          }

          // Calculate scale factor and target weight
          const sourceWeight = sourceVersion.baseWeight;
          let scaleFactor: number;
          let targetWeight: Measurement;

          if (target.type === 'factor') {
            scaleFactor = target.value;
            targetWeight = (sourceWeight * scaleFactor) as Measurement;
          } else {
            targetWeight = target.value as Measurement;
            scaleFactor = targetWeight / sourceWeight;
          }

          // Create produced filling snapshot directly
          const producedIngredients: Entities.Fillings.IProducedFillingIngredient[] =
            sourceVersion.ingredients.map((ing) => {
              const ingredientId = ing.ingredient.preferredId ?? ing.ingredient.ids[0];
              return {
                ingredientId,
                amount: (ing.amount * scaleFactor) as Measurement,
                notes: ing.notes
              };
            });

          const versionId = `${fillingId}@${sourceVersion.versionSpec}`;
          const producedFilling: Entities.Fillings.IProducedFilling = {
            versionId: versionId as FillingVersionId,
            scaleFactor,
            targetWeight,
            ingredients: producedIngredients,
            procedureId: sourceVersion.procedures?.preferredId,
            notes: sourceVersion.notes
          };

          const precision = localOptions.precision ? parseInt(localOptions.precision, 10) : undefined;
          const output = formatProducedFilling(producedFilling, sourceVersion, format, precision);
          console.log(output);
        } else {
          // Show regular filling details
          const output = formatFilling(filling, fillingId, format, versionSpec);
          console.log(output);
        }
      }
    );

  return cmd;
}
