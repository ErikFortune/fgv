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
import { Entities, ProcedureId, CollectionId } from '@fgv/ts-chocolate';

import {
  IEntityListOptions,
  OutputFormat,
  loadProceduresLibrary,
  formatList,
  getCollectionIdFromCompositeId,
  addCommonFilterOptions,
  IColumnConfig,
  IGenericListItem
} from '../shared';

/**
 * Procedure list item for display
 */
interface IProcedureListItem extends IGenericListItem {
  id: ProcedureId;
  category?: string;
  stepCount: number;
}

/**
 * Extended options for procedure list command
 */
interface IProcedureListOptions extends IEntityListOptions {
  category?: string;
}

/**
 * Checks if a procedure matches the specified filters
 */
function matchesFilters(
  procedure: Entities.Procedures.IProcedureEntity,
  procedureId: ProcedureId,
  sourceId: CollectionId,
  options: IProcedureListOptions
): boolean {
  // Filter by source
  if (options.collection && sourceId !== options.collection) {
    return false;
  }

  // Filter by name (case-insensitive substring)
  if (options.name) {
    const nameLower = procedure.name.toLowerCase();
    const patternLower = options.name.toLowerCase();
    if (!nameLower.includes(patternLower)) {
      return false;
    }
  }

  // Filter by category
  if (options.category) {
    if (!procedure.category || procedure.category !== options.category) {
      return false;
    }
  }

  // Filter by tags (AND logic - must have all specified tags)
  if (options.tag && options.tag.length > 0) {
    const procedureTags = new Set(procedure.tags ?? []);
    for (const requiredTag of options.tag) {
      if (!procedureTags.has(requiredTag)) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Column configuration for procedure list
 */
const procedureColumns: IColumnConfig[] = [
  { header: 'ID', getValue: (item) => item.id, minWidth: 2 },
  { header: 'Name', getValue: (item) => item.name, minWidth: 4 },
  { header: 'Category', getValue: (item) => (item as IProcedureListItem).category ?? '', minWidth: 8 },
  { header: 'Steps', getValue: (item) => String((item as IProcedureListItem).stepCount), minWidth: 5 },
  { header: 'Tags', getValue: (item) => (item.tags ?? []).join(', '), minWidth: 4 }
];

/**
 * Creates the procedure list subcommand
 */
export function createListSubcommand(): Command {
  const cmd = new Command('list');

  cmd.description('List procedures with optional filtering');

  // Add common filter options
  addCommonFilterOptions(cmd);

  // Add procedure-specific filter options
  cmd.option('--category <category>', 'Filter by filling category');

  cmd.action(async (localOptions: { tag?: string[]; source?: string; name?: string; category?: string }) => {
    // Merge with parent options
    const parentOptions = cmd.optsWithGlobals() as IProcedureListOptions;
    const options: IProcedureListOptions = {
      ...parentOptions,
      ...localOptions
    };

    // Load the procedures library
    const libraryResult = await loadProceduresLibrary(options);
    if (libraryResult.isFailure()) {
      console.error(`Error loading procedures: ${libraryResult.message}`);
      process.exit(1);
    }
    const library = libraryResult.value;

    // Collect matching procedures
    const matchingProcedures: IProcedureListItem[] = [];

    for (const [procedureId, procedure] of library.entries()) {
      // Get the source ID from the composite ID
      const sourceId = getCollectionIdFromCompositeId(procedureId);

      // Apply filters
      if (!matchesFilters(procedure, procedureId, sourceId, options)) {
        continue;
      }

      // Build list item
      matchingProcedures.push({
        id: procedureId,
        name: procedure.name,
        collectionId: sourceId,
        description: procedure.description,
        tags: procedure.tags,
        category: procedure.category,
        stepCount: procedure.steps.length
      });
    }

    // Sort by ID for consistent output
    matchingProcedures.sort((a, b) => a.id.localeCompare(b.id));

    // Format and output
    const format = (options.format ?? 'human') as OutputFormat;
    const output = formatList(matchingProcedures, format, 'procedure', procedureColumns);
    console.log(output);
  });

  return cmd;
}
