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
import { Entities, CollectionId, TaskId } from '@fgv/ts-chocolate';
import { Mustache } from '@fgv/ts-extras';

import {
  IEntityListOptions,
  OutputFormat,
  loadTasksLibrary,
  formatList,
  getCollectionIdFromCompositeId,
  addCommonFilterOptions,
  IColumnConfig,
  IGenericListItem,
  formatCategorizedNotes
} from '../shared';

/**
 * Task list item for display
 */
interface ITaskListItem extends IGenericListItem {
  id: TaskId;
  requiredVariables: number;
  hasDefaults: boolean;
}

/**
 * Extracts required variable count from a template string
 */
function getRequiredVariableCount(template: string): number {
  const result = Mustache.MustacheTemplate.create(template);
  if (result.isSuccess()) {
    return result.value.extractVariableNames().length;
  }
  return 0;
}

/**
 * Checks if a task matches the specified filters
 */
function matchesFilters(
  task: Entities.Tasks.IRawTaskEntity,
  taskId: TaskId,
  collectionId: CollectionId,
  options: IEntityListOptions
): boolean {
  if (options.collection && collectionId !== options.collection) {
    return false;
  }

  // Filter by name (case-insensitive substring)
  if (options.name) {
    const nameLower = task.name.toLowerCase();
    const patternLower = options.name.toLowerCase();
    if (!nameLower.includes(patternLower)) {
      return false;
    }
  }

  // Filter by tags (AND logic - must have all specified tags)
  if (options.tag && options.tag.length > 0) {
    const taskTags = new Set(task.tags ?? []);
    for (const requiredTag of options.tag) {
      if (!taskTags.has(requiredTag)) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Column configuration for task list
 */
const taskColumns: IColumnConfig[] = [
  { header: 'ID', getValue: (item) => item.id, minWidth: 2 },
  { header: 'Name', getValue: (item) => item.name, minWidth: 4 },
  {
    header: 'Variables',
    getValue: (item) => String((item as ITaskListItem).requiredVariables),
    minWidth: 9
  },
  {
    header: 'Defaults',
    getValue: (item) => ((item as ITaskListItem).hasDefaults ? 'Yes' : 'No'),
    minWidth: 8
  },
  { header: 'Tags', getValue: (item) => (item.tags ?? []).join(', '), minWidth: 4 }
];

/**
 * Creates the task list subcommand
 */
export function createListSubcommand(): Command {
  const cmd = new Command('list');

  cmd.description('List tasks with optional filtering');

  // Add common filter options
  addCommonFilterOptions(cmd);

  cmd.action(async (localOptions: { tag?: string[]; collection?: string; name?: string }) => {
    // Merge with parent options
    const parentOptions = cmd.optsWithGlobals() as IEntityListOptions;
    const options: IEntityListOptions = {
      ...parentOptions,
      ...localOptions
    };

    // Load the tasks library
    const libraryResult = await loadTasksLibrary(options);
    if (libraryResult.isFailure()) {
      console.error(`Error loading tasks: ${libraryResult.message}`);
      process.exit(1);
    }
    const library = libraryResult.value;

    // Collect matching tasks
    const matchingTasks: ITaskListItem[] = [];

    for (const [taskId, task] of library.entries()) {
      const collectionId = getCollectionIdFromCompositeId(taskId);

      // Apply filters
      if (!matchesFilters(task, taskId, collectionId, options)) {
        continue;
      }

      // Build list item
      matchingTasks.push({
        id: taskId,
        name: task.name,
        collectionId: collectionId,
        description: formatCategorizedNotes(task.notes),
        tags: task.tags,
        requiredVariables: getRequiredVariableCount(task.template),
        hasDefaults: task.defaults !== undefined && Object.keys(task.defaults).length > 0
      });
    }

    // Sort by ID for consistent output
    matchingTasks.sort((a, b) => a.id.localeCompare(b.id));

    // Format and output
    const format = (options.format ?? 'human') as OutputFormat;
    const output = formatList(matchingTasks, format, 'task', taskColumns);
    console.log(output);
  });

  return cmd;
}
