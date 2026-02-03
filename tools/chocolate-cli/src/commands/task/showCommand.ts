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
import { Mustache } from '@fgv/ts-extras';
import { Converters, Entities, TaskId } from '@fgv/ts-chocolate';

import {
  IEntityBaseOptions,
  ISelectableItem,
  OutputFormat,
  loadTasksLibrary,
  interactiveSelect,
  formatCategorizedNotes
} from '../shared';

/**
 * Options for task show command
 */
interface ITaskShowOptions extends IEntityBaseOptions {
  interactive?: boolean;
  render?: boolean;
  params?: string;
}

/**
 * Task selectable item for interactive mode
 */
interface ITaskSelectableItem extends ISelectableItem {
  id: TaskId;
  task: Entities.Tasks.ITaskData;
}

/**
 * Extracts required variables from a template string
 */
function getRequiredVariables(template: string): string[] {
  const result = Mustache.MustacheTemplate.create(template);
  if (result.isSuccess()) {
    return [...result.value.extractVariableNames()];
  }
  return [];
}

/**
 * Formats a task for human-readable output
 */
export function formatTaskHuman(
  task: Entities.Tasks.ITaskData,
  taskId: TaskId,
  renderedDescription?: string
): string {
  const lines: string[] = [];

  lines.push(`Task: ${task.name}`);
  lines.push(`ID: ${taskId}`);

  if (task.notes) {
    lines.push(`Notes: ${task.notes}`);
  }

  if (task.tags && task.tags.length > 0) {
    lines.push(`Tags: ${task.tags.join(', ')}`);
  }

  // Template
  lines.push('');
  lines.push('Template:');
  lines.push(`  ${task.template}`);

  // Required variables
  const requiredVariables = getRequiredVariables(task.template);
  if (requiredVariables.length > 0) {
    lines.push('');
    lines.push('Required Variables:');
    for (const variable of requiredVariables) {
      const hasDefault = task.defaults?.[variable] !== undefined;
      const defaultMarker = hasDefault ? ` (default: ${JSON.stringify(task.defaults?.[variable])})` : '';
      lines.push(`  {{${variable}}}${defaultMarker}`);
    }
  }

  // Default times
  lines.push('');
  lines.push('Default Times:');
  if (task.defaultActiveTime !== undefined) {
    lines.push(`  Active: ${task.defaultActiveTime} min`);
  }
  if (task.defaultWaitTime !== undefined) {
    lines.push(`  Wait: ${task.defaultWaitTime} min`);
  }
  if (task.defaultHoldTime !== undefined) {
    lines.push(`  Hold: ${task.defaultHoldTime} min`);
  }
  if (task.defaultTemperature !== undefined) {
    lines.push(`  Temperature: ${task.defaultTemperature}°C`);
  }

  // Rendered description if provided
  if (renderedDescription) {
    lines.push('');
    lines.push('Rendered Description:');
    lines.push(`  ${renderedDescription}`);
  }

  return lines.join('\n');
}

/**
 * Creates the task show subcommand
 */
export function createShowSubcommand(): Command {
  const cmd = new Command('show');

  cmd
    .description('Display details of a specific task')
    .argument('[taskId]', 'Task ID (e.g., "common.heat-cream")')
    .option('-i, --interactive', 'Interactively select a task')
    .option('--render', 'Render the template with provided params')
    .option('--params <json>', 'JSON params for template rendering (requires --render)')
    .action(
      async (
        taskIdArg: string | undefined,
        localOptions: { interactive?: boolean; render?: boolean; params?: string }
      ) => {
        // Merge with parent options
        const parentOptions = cmd.optsWithGlobals() as ITaskShowOptions;
        const options: ITaskShowOptions = {
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

        // Determine task ID - either from argument or interactive selection
        let taskId: TaskId;
        let task: Entities.Tasks.ITaskData;

        if (localOptions.interactive || !taskIdArg) {
          if (!localOptions.interactive && !taskIdArg) {
            console.error('Error: Either provide a task ID or use --interactive (-i) to select one');
            process.exit(1);
          }

          // Build selectable items
          const selectableItems: ITaskSelectableItem[] = [];
          for (const [id, t] of library.entries()) {
            selectableItems.push({
              id,
              name: t.name,
              description: formatCategorizedNotes(t.notes),
              task: t
            });
          }
          selectableItems.sort((a, b) => a.id.localeCompare(b.id));

          // Show interactive selector
          const selectionResult = await interactiveSelect({
            items: selectableItems,
            prompt: 'Select a task:',
            formatName: (item) => `${item.id} - ${item.name}`
          });

          if (selectionResult.isFailure()) {
            console.error(`Selection error: ${selectionResult.message}`);
            process.exit(1);
          }

          if (selectionResult.value === 'cancelled') {
            process.exit(0);
          }

          taskId = selectionResult.value.id;
          task = selectionResult.value.task;
          console.log(''); // Blank line after selection
        } else {
          // Validate task ID from argument
          const taskIdResult = Converters.taskId.convert(taskIdArg);
          if (taskIdResult.isFailure()) {
            console.error(`Invalid task ID "${taskIdArg}": ${taskIdResult.message}`);
            process.exit(1);
          }
          taskId = taskIdResult.value;

          // Get the task
          const taskResult = library.get(taskId);
          if (taskResult.isFailure()) {
            console.error(`Task not found: ${taskId}`);
            process.exit(1);
          }
          task = taskResult.value;
        }

        // Render template if requested
        let renderedDescription: string | undefined;
        if (options.render) {
          let params: Record<string, unknown> = {};
          if (options.params) {
            try {
              params = JSON.parse(options.params);
            } catch (e) {
              console.error(`Invalid JSON params: ${e}`);
              process.exit(1);
            }
          }

          // Merge with defaults
          const mergedParams = { ...task.defaults, ...params };

          const templateResult = Mustache.MustacheTemplate.create(task.template);
          if (templateResult.isFailure()) {
            console.error(`Failed to parse template: ${templateResult.message}`);
            process.exit(1);
          }
          const renderResult = templateResult.value.render(mergedParams);
          if (renderResult.isFailure()) {
            console.error(`Failed to render template: ${renderResult.message}`);
            process.exit(1);
          }
          renderedDescription = renderResult.value;
        }

        const format = (options.format ?? 'human') as OutputFormat;

        // Format and output
        switch (format) {
          case 'json':
            console.log(JSON.stringify(task, null, 2));
            break;
          case 'yaml':
            console.log(yaml.stringify(task));
            break;
          case 'table':
          case 'human':
          default:
            console.log(formatTaskHuman(task, taskId, renderedDescription));
            break;
        }
      }
    );

  return cmd;
}
