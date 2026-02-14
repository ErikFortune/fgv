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
import { ConfectionId, ConfectionRecipeVariationSpec, Converters, Entities } from '@fgv/ts-chocolate';

import {
  IEntityBaseOptions,
  ISelectableItem,
  OutputFormat,
  loadConfectionsLibrary,
  formatUrls,
  interactiveSelect
} from '../shared';

/**
 * Options for confection show command
 */
interface IConfectionShowOptions extends IEntityBaseOptions {
  interactive?: boolean;
  variation?: string;
}

/**
 * Confection selectable item for interactive mode
 */
interface IConfectionSelectableItem extends ISelectableItem {
  id: ConfectionId;
  confection: Entities.Confections.AnyConfectionRecipeEntity;
}

/**
 * Formats a confection for human-readable output
 */
export function formatConfectionHuman(
  confection: Entities.Confections.AnyConfectionRecipeEntity,
  confectionId: ConfectionId,
  variationSpec?: ConfectionRecipeVariationSpec
): string {
  const lines: string[] = [];

  lines.push(`Confection: ${confection.name}`);
  lines.push(`ID: ${confectionId}`);
  lines.push(`Type: ${confection.confectionType}`);

  if (confection.description) {
    lines.push(`Description: ${confection.description}`);
  }

  if (confection.tags && confection.tags.length > 0) {
    lines.push(`Tags: ${confection.tags.join(', ')}`);
  }

  lines.push('');

  // Find the requested variation
  const targetVariationSpec = variationSpec ?? confection.goldenVariationSpec;
  const variation = confection.variations.find((v) => v.variationSpec === targetVariationSpec);

  if (!variation) {
    lines.push(`Variation ${targetVariationSpec} not found.`);
    lines.push(`Available variations: ${confection.variations.map((v) => v.variationSpec).join(', ')}`);
    return lines.join('\n');
  }

  const isGolden = targetVariationSpec === confection.goldenVariationSpec;
  lines.push(`Variation: ${variation.variationSpec}${isGolden ? ' (golden)' : ''}`);
  lines.push(`Created: ${variation.createdDate}`);

  // Yield
  lines.push(`Yield: ${variation.yield.count} ${variation.yield.unit ?? 'pieces'}`);
  if (variation.yield.weightPerPiece !== undefined) {
    lines.push(`Weight per piece: ${variation.yield.weightPerPiece}g`);
  }

  // Type-specific information
  if (Entities.Confections.isMoldedBonBonRecipeVariationEntity(variation)) {
    lines.push('');
    lines.push('Molds:');
    const preferredMoldId = variation.molds.preferredId;
    for (const moldRef of variation.molds.options) {
      const isPreferred = moldRef.id === preferredMoldId;
      const preferredMarker = isPreferred ? ' (preferred)' : '';
      const notes = moldRef.notes ? ` - ${moldRef.notes}` : '';
      lines.push(`  ${moldRef.id}${preferredMarker}${notes}`);
    }

    lines.push('');
    lines.push('Shell Chocolate:');
    const preferredShellId = variation.shellChocolate.preferredId;
    for (const chocId of variation.shellChocolate.ids) {
      const isPreferred = chocId === preferredShellId;
      const preferredMarker = isPreferred ? ' (preferred)' : '';
      lines.push(`  ${chocId}${preferredMarker}`);
    }

    if (variation.additionalChocolates && variation.additionalChocolates.length > 0) {
      for (const addlChoc of variation.additionalChocolates) {
        lines.push('');
        lines.push(`${addlChoc.purpose} Chocolate:`);
        const preferredAddlId = addlChoc.chocolate.preferredId;
        for (const chocId of addlChoc.chocolate.ids) {
          const isPreferred = chocId === preferredAddlId;
          const preferredMarker = isPreferred ? ' (preferred)' : '';
          lines.push(`  ${chocId}${preferredMarker}`);
        }
      }
    }
  } else if (Entities.Confections.isBarTruffleRecipeVariationEntity(variation)) {
    lines.push('');
    lines.push('Frame Dimensions:');
    const fd = variation.frameDimensions;
    lines.push(`  ${fd.width} x ${fd.height} x ${fd.depth} mm`);

    lines.push('');
    lines.push('BonBon Dimensions:');
    const bd = variation.singleBonBonDimensions;
    lines.push(`  ${bd.width} x ${bd.height} mm`);

    if (variation.enrobingChocolate) {
      lines.push('');
      lines.push('Enrobing Chocolate:');
      const preferredId = variation.enrobingChocolate.preferredId;
      for (const chocId of variation.enrobingChocolate.ids) {
        const isPreferred = chocId === preferredId;
        const preferredMarker = isPreferred ? ' (preferred)' : '';
        lines.push(`  ${chocId}${preferredMarker}`);
      }
    }
  } else if (Entities.Confections.isRolledTruffleRecipeVariationEntity(variation)) {
    if (variation.enrobingChocolate) {
      lines.push('');
      lines.push('Enrobing Chocolate:');
      const preferredId = variation.enrobingChocolate.preferredId;
      for (const chocId of variation.enrobingChocolate.ids) {
        const isPreferred = chocId === preferredId;
        const preferredMarker = isPreferred ? ' (preferred)' : '';
        lines.push(`  ${chocId}${preferredMarker}`);
      }
    }

    if (variation.coatings) {
      lines.push('');
      lines.push('Coatings:');
      const preferredId = variation.coatings.preferredId;
      for (const coatingId of variation.coatings.ids) {
        const isPreferred = coatingId === preferredId;
        const preferredMarker = isPreferred ? ' (preferred)' : '';
        lines.push(`  ${coatingId}${preferredMarker}`);
      }
    }
  }

  // Fillings
  if (variation.fillings && variation.fillings.length > 0) {
    lines.push('');
    lines.push('Fillings:');
    for (const slot of variation.fillings) {
      const slotName = slot.name ?? slot.slotId;
      lines.push(`  ${slotName}:`);
      const preferredId = slot.filling.preferredId;
      for (const opt of slot.filling.options) {
        const isPreferred = opt.id === preferredId;
        const preferredMarker = isPreferred ? ' (preferred)' : '';
        const typeMarker = ` [${opt.type}]`;
        const notes = opt.notes ? ` - ${opt.notes}` : '';
        lines.push(`    ${opt.id}${typeMarker}${preferredMarker}${notes}`);
      }
    }
  }

  // Decorations
  if (variation.decorations && variation.decorations.options.length > 0) {
    lines.push('');
    lines.push('Decorations:');
    const preferredDecId = variation.decorations.preferredId;
    for (const dec of variation.decorations.options) {
      const preferredMarker = dec.id === preferredDecId ? ' (preferred)' : '';
      lines.push(`  ${dec.id}${preferredMarker}`);
    }
  }

  // Procedures
  if (variation.procedures && variation.procedures.options.length > 0) {
    lines.push('');
    lines.push('Procedures:');
    const preferredProcId = variation.procedures.preferredId;
    for (const procRef of variation.procedures.options) {
      const isPreferred = procRef.id === preferredProcId;
      const preferredMarker = isPreferred ? ' (preferred)' : '';
      const notes = procRef.notes ? ` - ${procRef.notes}` : '';
      lines.push(`  ${procRef.id}${preferredMarker}${notes}`);
    }
  }

  // Notes
  if (variation.notes) {
    lines.push('');
    lines.push(`Notes: ${variation.notes}`);
  }

  // URLs
  if (confection.urls && confection.urls.length > 0) {
    formatUrls(confection.urls, lines);
  }

  // Other variations
  if (confection.variations.length > 1) {
    lines.push('');
    lines.push(`Other variations (${confection.variations.length - 1}):`);
    for (const v of confection.variations) {
      if (v.variationSpec !== targetVariationSpec) {
        const golden = v.variationSpec === confection.goldenVariationSpec ? ' (golden)' : '';
        lines.push(`  ${v.variationSpec}${golden} - ${v.createdDate}`);
      }
    }
  }

  return lines.join('\n');
}

/**
 * Creates the confection show subcommand
 */
export function createShowSubcommand(): Command {
  const cmd = new Command('show');

  cmd
    .description('Display details of a specific confection')
    .argument('[confectionId]', 'Confection ID (e.g., "myshop.dark-ganache-bonbon")')
    .option('-i, --interactive', 'Interactively select a confection')
    .option('--variation <spec>', 'Show a specific variation (default: golden variation)')
    .action(
      async (
        confectionIdArg: string | undefined,
        localOptions: { interactive?: boolean; variation?: string }
      ) => {
        // Merge with parent options
        const parentOptions = cmd.optsWithGlobals() as IConfectionShowOptions;
        const options: IConfectionShowOptions = {
          ...parentOptions,
          ...localOptions
        };

        // Load the confections library
        const libraryResult = await loadConfectionsLibrary(options);
        if (libraryResult.isFailure()) {
          console.error(`Error loading confections: ${libraryResult.message}`);
          process.exit(1);
        }
        const library = libraryResult.value;

        // Determine confection ID - either from argument or interactive selection
        let confectionId: ConfectionId;
        let confection: Entities.Confections.AnyConfectionRecipeEntity;

        if (localOptions.interactive || !confectionIdArg) {
          if (!localOptions.interactive && !confectionIdArg) {
            console.error('Error: Either provide a confection ID or use --interactive (-i) to select one');
            process.exit(1);
          }

          // Build selectable items
          const selectableItems: IConfectionSelectableItem[] = [];
          for (const [id, c] of library.entries()) {
            selectableItems.push({
              id,
              name: c.name,
              description: `[${c.confectionType}]`,
              confection: c
            });
          }
          selectableItems.sort((a, b) => a.id.localeCompare(b.id));

          // Show interactive selector
          const selectionResult = await interactiveSelect({
            items: selectableItems,
            prompt: 'Select a confection:',
            formatName: (item) => `${item.id} - ${item.name}`
          });

          if (selectionResult.isFailure()) {
            console.error(`Selection error: ${selectionResult.message}`);
            process.exit(1);
          }

          if (selectionResult.value === 'cancelled') {
            process.exit(0);
          }

          confectionId = selectionResult.value.id;
          confection = selectionResult.value.confection;
          console.log(''); // Blank line after selection
        } else {
          // Validate confection ID from argument
          const confectionIdResult = Converters.confectionId.convert(confectionIdArg);
          if (confectionIdResult.isFailure()) {
            console.error(`Invalid confection ID "${confectionIdArg}": ${confectionIdResult.message}`);
            process.exit(1);
          }
          confectionId = confectionIdResult.value;

          // Get the confection
          const confectionResult = library.get(confectionId);
          if (confectionResult.isFailure()) {
            console.error(`Confection not found: ${confectionId}`);
            process.exit(1);
          }
          confection = confectionResult.value;
        }

        // Validate variation spec if provided
        let variationSpec: ConfectionRecipeVariationSpec | undefined;
        if (options.variation) {
          const variationResult = Converters.confectionRecipeVariationSpec.convert(options.variation);
          if (variationResult.isFailure()) {
            console.error(`Invalid variation spec "${options.variation}": ${variationResult.message}`);
            process.exit(1);
          }
          variationSpec = variationResult.value;

          // Check that the variation exists
          const variation = confection.variations.find((v) => v.variationSpec === variationSpec);
          if (!variation) {
            console.error(`Variation ${variationSpec} not found in confection ${confectionId}`);
            console.error(
              `Available variations: ${confection.variations.map((v) => v.variationSpec).join(', ')}`
            );
            process.exit(1);
          }
        }

        const format = (options.format ?? 'human') as OutputFormat;

        // Format and output
        switch (format) {
          case 'json':
            console.log(JSON.stringify(confection, null, 2));
            break;
          case 'yaml':
            console.log(yaml.stringify(confection));
            break;
          case 'table':
          case 'human':
          default:
            console.log(formatConfectionHuman(confection, confectionId, variationSpec));
            break;
        }
      }
    );

  return cmd;
}
