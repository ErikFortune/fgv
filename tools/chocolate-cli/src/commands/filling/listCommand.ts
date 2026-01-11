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
import { FillingId, Fillings, Helpers, SourceId } from '@fgv/ts-chocolate';

import {
  IFillingListOptions,
  loadFillingsLibrary,
  formatFillingList,
  IFillingListItem,
  OutputFormat
} from './shared';

/**
 * Checks if a filling matches the specified filters
 */
function matchesFilters(
  filling: Fillings.IFillingRecipe,
  fillingId: FillingId,
  sourceId: SourceId,
  options: IFillingListOptions
): boolean {
  // Filter by source
  if (options.source && sourceId !== options.source) {
    return false;
  }

  // Filter by name (case-insensitive substring)
  if (options.name) {
    const nameLower = filling.name.toLowerCase();
    const patternLower = options.name.toLowerCase();
    if (!nameLower.includes(patternLower)) {
      return false;
    }
  }

  // Filter by tags (AND logic - must have all specified tags)
  if (options.tag && options.tag.length > 0) {
    const fillingTags = new Set(filling.tags ?? []);
    for (const requiredTag of options.tag) {
      if (!fillingTags.has(requiredTag)) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Creates the filling list subcommand
 */
export function createListSubcommand(): Command {
  const cmd = new Command('list');

  cmd
    .description('List fillings with optional filtering')
    .option('--tag <tag>', 'Filter by tag (can be repeated)', (val, prev: string[]) => [...prev, val], [])
    .option('--source <sourceId>', 'Filter by source collection ID')
    .option('--name <pattern>', 'Filter by name (case-insensitive substring match)')
    .action(async (localOptions: { tag?: string[]; source?: string; name?: string }) => {
      // Merge with parent options
      const parentOptions = cmd.optsWithGlobals() as IFillingListOptions;
      const options: IFillingListOptions = {
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

      // Collect matching fillings
      const matchingFillings: IFillingListItem[] = [];

      for (const [fillingId, filling] of library.entries()) {
        // Get the source ID from the composite ID
        const sourceId = Helpers.getFillingSourceId(fillingId);

        // Apply filters
        if (!matchesFilters(filling, fillingId, sourceId, options)) {
          continue;
        }

        // Add to results
        matchingFillings.push({
          id: fillingId,
          name: filling.name,
          sourceId,
          category: filling.category,
          description: filling.description,
          tags: filling.tags,
          versionCount: filling.versions.length,
          goldenVersionSpec: filling.goldenVersionSpec
        });
      }

      // Sort by ID for consistent output
      matchingFillings.sort((a, b) => a.id.localeCompare(b.id));

      // Format and output
      const format = (options.format ?? 'human') as OutputFormat;
      const output = formatFillingList(matchingFillings, format);
      console.log(output);
    });

  return cmd;
}
