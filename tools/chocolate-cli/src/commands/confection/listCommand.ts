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
import { ConfectionId, ConfectionVersionSpec, Entities, SourceId } from '@fgv/ts-chocolate';

import {
  IEntityListOptions,
  OutputFormat,
  loadConfectionsLibrary,
  formatList,
  getSourceIdFromCompositeId,
  addCommonFilterOptions,
  IColumnConfig,
  IGenericListItem
} from '../shared';

/**
 * Confection list item for display
 */
interface IConfectionListItem extends IGenericListItem {
  id: ConfectionId;
  confectionType: string;
  versionCount: number;
  goldenVersionSpec: ConfectionVersionSpec;
  yield?: string;
}

/**
 * Extended options for confection list command
 */
interface IConfectionListOptions extends IEntityListOptions {
  confectionType?: string;
  mold?: string;
  filling?: string;
}

/**
 * Gets yield string from a confection version
 */
function getYieldString(confection: Entities.Confections.AnyConfection): string {
  const goldenVersion = confection.versions.find((v) => v.versionSpec === confection.goldenVersionSpec);
  if (!goldenVersion) {
    return '';
  }
  const yieldInfo = goldenVersion.yield;
  return `${yieldInfo.count} ${yieldInfo.unit ?? 'pieces'}`;
}

/**
 * Checks if a confection matches the specified filters
 */
function matchesFilters(
  confection: Entities.Confections.AnyConfection,
  confectionId: ConfectionId,
  sourceId: SourceId,
  options: IConfectionListOptions
): boolean {
  // Filter by source
  if (options.source && sourceId !== options.source) {
    return false;
  }

  // Filter by name (case-insensitive substring)
  if (options.name) {
    const nameLower = confection.name.toLowerCase();
    const patternLower = options.name.toLowerCase();
    if (!nameLower.includes(patternLower)) {
      return false;
    }
  }

  // Filter by confection type
  if (options.confectionType && confection.confectionType !== options.confectionType) {
    return false;
  }

  // Filter by mold (for molded bonbons)
  if (options.mold) {
    if (!Entities.Confections.isMoldedBonBon(confection)) {
      return false;
    }
    const goldenVersion = confection.versions.find((v) => v.versionSpec === confection.goldenVersionSpec);
    if (!goldenVersion) {
      return false;
    }
    const hasMold = goldenVersion.molds.options.some((m) => m.id === options.mold);
    if (!hasMold) {
      return false;
    }
  }

  // Filter by filling
  if (options.filling) {
    const goldenVersion = confection.versions.find((v) => v.versionSpec === confection.goldenVersionSpec);
    if (!goldenVersion?.fillings) {
      return false;
    }
    const hasFilling = goldenVersion.fillings.some((slot) =>
      slot.filling.options.some((opt) => opt.id === options.filling)
    );
    if (!hasFilling) {
      return false;
    }
  }

  // Filter by tags (AND logic - must have all specified tags)
  if (options.tag && options.tag.length > 0) {
    const confectionTags = new Set(confection.tags ?? []);
    for (const requiredTag of options.tag) {
      if (!confectionTags.has(requiredTag)) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Column configuration for confection list
 */
const confectionColumns: IColumnConfig[] = [
  { header: 'ID', getValue: (item) => item.id, minWidth: 2 },
  { header: 'Name', getValue: (item) => item.name, minWidth: 4 },
  { header: 'Type', getValue: (item) => (item as IConfectionListItem).confectionType, minWidth: 4 },
  { header: 'Yield', getValue: (item) => (item as IConfectionListItem).yield ?? '', minWidth: 5 },
  { header: 'Golden', getValue: (item) => (item as IConfectionListItem).goldenVersionSpec, minWidth: 6 },
  { header: 'Tags', getValue: (item) => (item.tags ?? []).join(', '), minWidth: 4 }
];

/**
 * Creates the confection list subcommand
 */
export function createListSubcommand(): Command {
  const cmd = new Command('list');

  cmd.description('List confections with optional filtering');

  // Add common filter options
  addCommonFilterOptions(cmd);

  // Add confection-specific filter options
  cmd
    .option('--type <type>', 'Filter by confection type (molded-bonbon, bar-truffle, rolled-truffle)')
    .option('--mold <moldId>', 'Filter by mold ID (for molded bonbons)')
    .option('--filling <fillingId>', 'Filter by filling ID');

  cmd.action(
    async (localOptions: {
      tag?: string[];
      source?: string;
      name?: string;
      type?: string;
      mold?: string;
      filling?: string;
    }) => {
      // Merge with parent options
      const parentOptions = cmd.optsWithGlobals() as IConfectionListOptions;
      const options: IConfectionListOptions = {
        ...parentOptions,
        ...localOptions,
        confectionType: localOptions.type
      };

      // Load the confections library
      const libraryResult = await loadConfectionsLibrary(options);
      if (libraryResult.isFailure()) {
        console.error(`Error loading confections: ${libraryResult.message}`);
        process.exit(1);
      }
      const library = libraryResult.value;

      // Collect matching confections
      const matchingConfections: IConfectionListItem[] = [];

      for (const [confectionId, confection] of library.entries()) {
        // Get the source ID from the composite ID
        const sourceId = getSourceIdFromCompositeId(confectionId);

        // Apply filters
        if (!matchesFilters(confection, confectionId, sourceId, options)) {
          continue;
        }

        // Build list item
        matchingConfections.push({
          id: confectionId,
          name: confection.name,
          sourceId,
          description: confection.description,
          tags: confection.tags,
          confectionType: confection.confectionType,
          versionCount: confection.versions.length,
          goldenVersionSpec: confection.goldenVersionSpec,
          yield: getYieldString(confection)
        });
      }

      // Sort by ID for consistent output
      matchingConfections.sort((a, b) => a.id.localeCompare(b.id));

      // Format and output
      const format = (options.format ?? 'human') as OutputFormat;
      const output = formatList(matchingConfections, format, 'confection', confectionColumns);
      console.log(output);
    }
  );

  return cmd;
}
