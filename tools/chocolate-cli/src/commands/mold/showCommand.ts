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
import { Converters, Entities, MoldId } from '@fgv/ts-chocolate';

import {
  IEntityBaseOptions,
  ISelectableItem,
  OutputFormat,
  loadMoldsLibrary,
  formatUrls,
  interactiveSelect
} from '../shared';

/**
 * Options for mold show command
 */
interface IMoldShowOptions extends IEntityBaseOptions {
  interactive?: boolean;
}

/**
 * Mold selectable item for interactive mode
 */
interface IMoldSelectableItem extends ISelectableItem {
  id: MoldId;
  mold: Entities.Molds.IMoldEntity;
}

/**
 * Gets the cavity count from a mold
 */
function getCavityCount(mold: Entities.Molds.IMoldEntity): number {
  if (mold.cavities.kind === 'grid') {
    return mold.cavities.columns * mold.cavities.rows;
  }
  return mold.cavities.count;
}

/**
 * Formats a mold for human-readable output
 */
export function formatMoldHuman(mold: Entities.Molds.IMoldEntity, moldId: MoldId): string {
  const lines: string[] = [];

  lines.push(`Mold: ${mold.name}`);
  lines.push(`ID: ${moldId}`);
  lines.push(`Manufacturer: ${mold.manufacturer}`);
  lines.push(`Product Number: ${mold.productNumber}`);
  lines.push(`Format: ${mold.format}`);

  if (mold.name) {
    lines.push(`Name: ${mold.name}`);
  }

  if (mold.description) {
    lines.push(`Description: ${mold.description}`);
  }

  if (mold.tags && mold.tags.length > 0) {
    lines.push(`Tags: ${mold.tags.join(', ')}`);
  }

  // Cavity information
  lines.push('');
  lines.push('Cavities:');
  if (mold.cavities.kind === 'grid') {
    lines.push(`  Layout: ${mold.cavities.columns} x ${mold.cavities.rows} grid`);
    lines.push(`  Total Count: ${getCavityCount(mold)}`);
  } else {
    lines.push(`  Count: ${mold.cavities.count}`);
  }

  // Cavity dimensions if available
  const cavityInfo = mold.cavities.info;
  if (cavityInfo) {
    if (cavityInfo.weight !== undefined) {
      lines.push(`  Weight per cavity: ${cavityInfo.weight}g`);
    }
    if (cavityInfo.dimensions) {
      const dims = cavityInfo.dimensions;
      lines.push(`  Dimensions: ${dims.width} x ${dims.length} x ${dims.depth} mm`);
    }
  }

  // Related molds
  if (mold.related && mold.related.length > 0) {
    lines.push('');
    lines.push('Related Molds:');
    for (const relatedId of mold.related) {
      lines.push(`  ${relatedId}`);
    }
  }

  // Notes
  if (mold.notes) {
    lines.push('');
    lines.push(`Notes: ${mold.notes}`);
  }

  // URLs
  if (mold.urls && mold.urls.length > 0) {
    formatUrls(mold.urls, lines);
  }

  return lines.join('\n');
}

/**
 * Creates the mold show subcommand
 */
export function createShowSubcommand(): Command {
  const cmd = new Command('show');

  cmd
    .description('Display details of a specific mold')
    .argument('[moldId]', 'Mold ID (e.g., "chocolateworld.cw1000")')
    .option('-i, --interactive', 'Interactively select a mold')
    .action(async (moldIdArg: string | undefined, localOptions: { interactive?: boolean }) => {
      // Merge with parent options
      const parentOptions = cmd.optsWithGlobals() as IMoldShowOptions;
      const options: IMoldShowOptions = {
        ...parentOptions,
        ...localOptions
      };

      // Load the molds library
      const libraryResult = await loadMoldsLibrary(options);
      if (libraryResult.isFailure()) {
        console.error(`Error loading molds: ${libraryResult.message}`);
        process.exit(1);
      }
      const library = libraryResult.value;

      // Determine mold ID - either from argument or interactive selection
      let moldId: MoldId;
      let mold: Entities.Molds.IMoldEntity;

      if (localOptions.interactive || !moldIdArg) {
        if (!localOptions.interactive && !moldIdArg) {
          console.error('Error: Either provide a mold ID or use --interactive (-i) to select one');
          process.exit(1);
        }

        // Build selectable items
        const selectableItems: IMoldSelectableItem[] = [];
        for (const [id, m] of library.entries()) {
          const cavities = getCavityCount(m);
          selectableItems.push({
            id,
            name: m.name,
            description: `[${m.manufacturer}] ${cavities} cavities`,
            mold: m
          });
        }
        selectableItems.sort((a, b) => a.id.localeCompare(b.id));

        // Show interactive selector
        const selectionResult = await interactiveSelect({
          items: selectableItems,
          prompt: 'Select a mold:',
          formatName: (item) => {
            return `${item.id} - ${item.mold.name}`;
          }
        });

        if (selectionResult.isFailure()) {
          console.error(`Selection error: ${selectionResult.message}`);
          process.exit(1);
        }

        if (selectionResult.value === 'cancelled') {
          process.exit(0);
        }

        moldId = selectionResult.value.id;
        mold = selectionResult.value.mold;
        console.log(''); // Blank line after selection
      } else {
        // Validate mold ID from argument
        const moldIdResult = Converters.moldId.convert(moldIdArg);
        if (moldIdResult.isFailure()) {
          console.error(`Invalid mold ID "${moldIdArg}": ${moldIdResult.message}`);
          process.exit(1);
        }
        moldId = moldIdResult.value;

        // Get the mold
        const moldResult = library.get(moldId);
        if (moldResult.isFailure()) {
          console.error(`Mold not found: ${moldId}`);
          process.exit(1);
        }
        mold = moldResult.value;
      }

      const format = (options.format ?? 'human') as OutputFormat;

      // Format and output
      switch (format) {
        case 'json':
          console.log(JSON.stringify(mold, null, 2));
          break;
        case 'yaml':
          console.log(yaml.stringify(mold));
          break;
        case 'table':
        case 'human':
        default:
          console.log(formatMoldHuman(mold, moldId));
          break;
      }
    });

  return cmd;
}
