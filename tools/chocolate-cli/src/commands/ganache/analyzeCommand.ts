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
import { Converters, FillingId, FillingVersionSpec, IngredientId, LibraryRuntime } from '@fgv/ts-chocolate';

import {
  IEntityBaseOptions,
  OutputFormat,
  loadFillingsLibrary,
  loadIngredientsLibrary,
  formatNumber,
  padRight
} from '../shared';

/**
 * Options for ganache analyze command
 */
interface IGanacheAnalyzeOptions extends IEntityBaseOptions {
  version?: string;
}

/**
 * Formats ganache analysis for human-readable output
 */
function formatGanacheHuman(
  calculation: LibraryRuntime.IGanacheCalculation,
  fillingId: FillingId,
  versionSpec: FillingVersionSpec
): string {
  const lines: string[] = [];

  lines.push(`Ganache Analysis for: ${fillingId}`);
  lines.push(`Version: ${versionSpec}`);
  lines.push(`Total Weight: ${calculation.analysis.totalWeight}g`);

  lines.push('');
  lines.push('Composition:');

  const chars = calculation.analysis.characteristics;
  const charLines: Array<[string, number]> = [
    ['Cacao Fat', chars.cacaoFat],
    ['Milk Fat', chars.milkFat],
    ['Other Fats', chars.otherFats],
    ['Sugar', chars.sugar],
    ['Water', chars.water],
    ['Solids', chars.solids]
  ];

  for (const [label, value] of charLines) {
    const pct = formatNumber(value, 1);
    const bar = '█'.repeat(Math.round(value / 2));
    lines.push(`  ${padRight(label + ':', 14)} ${padRight(pct + '%', 8)} ${bar}`);
  }

  lines.push('');
  lines.push('Derived Values:');
  lines.push(`  Total Fat:          ${formatNumber(calculation.analysis.totalFat, 1)}%`);
  lines.push(`  Fat:Water Ratio:    ${formatNumber(calculation.analysis.fatToWaterRatio, 2)} : 1`);
  lines.push(`  Sugar:Water Ratio:  ${formatNumber(calculation.analysis.sugarToWaterRatio, 2)} : 1`);

  // Validation results
  const validation = calculation.validation;
  lines.push('');
  lines.push(`Validation: ${validation.isValid ? '✓ PASS' : '✗ FAIL'}`);

  if (validation.errors.length > 0) {
    lines.push('');
    lines.push('Errors:');
    for (const error of validation.errors) {
      lines.push(`  ✗ ${error}`);
    }
  }

  if (validation.warnings.length > 0) {
    lines.push('');
    lines.push('Warnings:');
    for (const warning of validation.warnings) {
      lines.push(`  ⚠ ${warning}`);
    }
  }

  if (validation.isValid && validation.warnings.length === 0) {
    lines.push('  All ratios are within recommended guidelines.');
  }

  return lines.join('\n');
}

/**
 * Creates the ganache analyze subcommand
 */
export function createAnalyzeSubcommand(): Command {
  const cmd = new Command('analyze');

  cmd
    .description('Analyze ganache composition for a filling recipe')
    .argument('<fillingId>', 'Filling ID to analyze (e.g., "common.dark-ganache-classic")')
    .option('--version <spec>', 'Analyze a specific version (default: golden version)')
    .action(async (fillingIdArg: string, localOptions: { version?: string }) => {
      // Merge with parent options
      const parentOptions = cmd.optsWithGlobals() as IGanacheAnalyzeOptions;
      const options: IGanacheAnalyzeOptions = {
        ...parentOptions,
        ...localOptions
      };

      // Validate filling ID
      const fillingIdResult = Converters.fillingId.convert(fillingIdArg);
      if (fillingIdResult.isFailure()) {
        console.error(`Invalid filling ID "${fillingIdArg}": ${fillingIdResult.message}`);
        process.exit(1);
      }
      const fillingId = fillingIdResult.value;

      // Load the fillings library
      const fillingsResult = await loadFillingsLibrary(options);
      if (fillingsResult.isFailure()) {
        console.error(`Error loading fillings: ${fillingsResult.message}`);
        process.exit(1);
      }
      const fillingsLibrary = fillingsResult.value;

      // Load the ingredients library
      const ingredientsResult = await loadIngredientsLibrary(options);
      if (ingredientsResult.isFailure()) {
        console.error(`Error loading ingredients: ${ingredientsResult.message}`);
        process.exit(1);
      }
      const ingredientsLibrary = ingredientsResult.value;

      // Get the filling
      const fillingResult = fillingsLibrary.get(fillingId);
      if (fillingResult.isFailure()) {
        console.error(`Filling not found: ${fillingId}`);
        process.exit(1);
      }
      const filling = fillingResult.value;

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

      // Calculate ganache characteristics
      const calculationResult = LibraryRuntime.Internal.calculateGanache(
        filling,
        (ingredientId: IngredientId) => ingredientsLibrary.get(ingredientId),
        versionSpec
      );

      if (calculationResult.isFailure()) {
        console.error(`Error calculating ganache: ${calculationResult.message}`);
        process.exit(1);
      }
      const calculation = calculationResult.value;

      const format = (options.format ?? 'human') as OutputFormat;
      const targetVersionSpec = versionSpec ?? filling.goldenVersionSpec;

      // Format and output
      switch (format) {
        case 'json':
          console.log(JSON.stringify(calculation, null, 2));
          break;
        case 'yaml':
          console.log(yaml.stringify(calculation));
          break;
        case 'table':
        case 'human':
        default:
          console.log(formatGanacheHuman(calculation, fillingId, targetVersionSpec));
          break;
      }
    });

  return cmd;
}
