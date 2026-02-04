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
import { Entities, MoldId, SourceId } from '@fgv/ts-chocolate';

import {
  IEntityListOptions,
  OutputFormat,
  loadMoldsLibrary,
  formatList,
  getSourceIdFromCompositeId,
  addCommonFilterOptions,
  IColumnConfig,
  IGenericListItem
} from '../shared';

/**
 * Mold list item for display
 */
interface IMoldListItem extends IGenericListItem {
  id: MoldId;
  manufacturer: string;
  productNumber: string;
  format: string;
  cavityCount: number;
}

/**
 * Extended options for mold list command
 */
interface IMoldListOptions extends IEntityListOptions {
  manufacturer?: string;
  moldFormat?: string;
  minCavities?: string;
  maxCavities?: string;
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
 * Checks if a mold matches the specified filters
 */
function matchesFilters(
  mold: Entities.Molds.IMoldEntity,
  moldId: MoldId,
  sourceId: SourceId,
  options: IMoldListOptions
): boolean {
  // Filter by source
  if (options.source && sourceId !== options.source) {
    return false;
  }

  // Filter by name (case-insensitive substring on description)
  if (options.name) {
    const descLower = (mold.description ?? '').toLowerCase();
    const patternLower = options.name.toLowerCase();
    if (!descLower.includes(patternLower)) {
      return false;
    }
  }

  // Filter by manufacturer (case-insensitive substring)
  if (options.manufacturer) {
    const mfgLower = mold.manufacturer.toLowerCase();
    const patternLower = options.manufacturer.toLowerCase();
    if (!mfgLower.includes(patternLower)) {
      return false;
    }
  }

  // Filter by format/series
  if (options.moldFormat && mold.format !== options.moldFormat) {
    return false;
  }

  // Filter by minimum cavities
  const cavityCount = getCavityCount(mold);
  if (options.minCavities) {
    const min = parseInt(options.minCavities, 10);
    if (!isNaN(min) && cavityCount < min) {
      return false;
    }
  }

  // Filter by maximum cavities
  if (options.maxCavities) {
    const max = parseInt(options.maxCavities, 10);
    if (!isNaN(max) && cavityCount > max) {
      return false;
    }
  }

  // Filter by tags (AND logic - must have all specified tags)
  if (options.tag && options.tag.length > 0) {
    const moldTags = new Set(mold.tags ?? []);
    for (const requiredTag of options.tag) {
      if (!moldTags.has(requiredTag)) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Column configuration for mold list
 */
const moldColumns: IColumnConfig[] = [
  { header: 'ID', getValue: (item) => item.id, minWidth: 2 },
  { header: 'Manufacturer', getValue: (item) => (item as IMoldListItem).manufacturer, minWidth: 12 },
  { header: 'Product#', getValue: (item) => (item as IMoldListItem).productNumber, minWidth: 8 },
  { header: 'Cavities', getValue: (item) => String((item as IMoldListItem).cavityCount), minWidth: 8 },
  { header: 'Format', getValue: (item) => (item as IMoldListItem).format, minWidth: 6 },
  { header: 'Description', getValue: (item) => item.description ?? '', minWidth: 11 }
];

/**
 * Creates the mold list subcommand
 */
export function createListSubcommand(): Command {
  const cmd = new Command('list');

  cmd.description('List molds with optional filtering');

  // Add common filter options
  addCommonFilterOptions(cmd);

  // Add mold-specific filter options
  cmd
    .option('--manufacturer <name>', 'Filter by manufacturer (case-insensitive substring match)')
    .option('--mold-format <format>', 'Filter by mold format/series')
    .option('--min-cavities <n>', 'Filter by minimum cavity count')
    .option('--max-cavities <n>', 'Filter by maximum cavity count');

  cmd.action(
    async (localOptions: {
      tag?: string[];
      source?: string;
      name?: string;
      manufacturer?: string;
      moldFormat?: string;
      minCavities?: string;
      maxCavities?: string;
    }) => {
      // Merge with parent options
      const parentOptions = cmd.optsWithGlobals() as IMoldListOptions;
      const options: IMoldListOptions = {
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

      // Collect matching molds
      const matchingMolds: IMoldListItem[] = [];

      for (const [moldId, mold] of library.entries()) {
        // Get the source ID from the composite ID
        const sourceId = getSourceIdFromCompositeId(moldId);

        // Apply filters
        if (!matchesFilters(mold, moldId, sourceId, options)) {
          continue;
        }

        // Build list item
        matchingMolds.push({
          id: moldId,
          name: mold.description ?? mold.productNumber,
          sourceId,
          description: mold.description,
          tags: mold.tags,
          manufacturer: mold.manufacturer,
          productNumber: mold.productNumber,
          format: mold.format,
          cavityCount: getCavityCount(mold)
        });
      }

      // Sort by ID for consistent output
      matchingMolds.sort((a, b) => a.id.localeCompare(b.id));

      // Format and output
      const format = (options.format ?? 'human') as OutputFormat;
      const output = formatList(matchingMolds, format, 'mold', moldColumns);
      console.log(output);
    }
  );

  return cmd;
}
