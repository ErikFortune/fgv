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
import { Converters, Entities, ProcedureId } from '@fgv/ts-chocolate';

import { IEntityBaseOptions, OutputFormat, loadProceduresLibrary, loadTasksLibrary } from '../shared';

/**
 * Options for procedure show command
 */
interface IProcedureShowOptions extends IEntityBaseOptions {
  render?: boolean;
  context?: string;
}

/**
 * Formats a step for human output
 */
function formatStep(
  step: Entities.Procedures.IProcedureStep,
  tasksLibrary?: Entities.Tasks.TasksLibrary,
  context?: Record<string, unknown>
): string[] {
  const lines: string[] = [];
  let description = '';

  // Get task description
  if (Entities.Tasks.isTaskRef(step.task)) {
    const taskId = step.task.taskId;
    if (tasksLibrary) {
      const taskResult = tasksLibrary.get(taskId);
      if (taskResult.isSuccess()) {
        const task = taskResult.value;
        if (context) {
          // Merge task defaults, step params, and context
          const mergedParams = { ...task.defaults, ...step.task.params, ...context };
          const templateResult = Mustache.MustacheTemplate.create(task.template);
          if (templateResult.isSuccess()) {
            const renderResult = templateResult.value.render(mergedParams);
            description = renderResult.isSuccess() ? renderResult.value : `[Render error] ${task.template}`;
          } else {
            description = `[Template error] ${task.template}`;
          }
        } else {
          description = task.template;
        }
      } else {
        description = `[Task not found: ${taskId}]`;
      }
    } else {
      description = `Task: ${taskId}`;
    }
  } else {
    // Inline task
    const inlineTask = step.task.task;
    if (context) {
      const mergedParams = { ...inlineTask.defaults, ...step.task.params, ...context };
      const templateResult = Mustache.MustacheTemplate.create(inlineTask.template);
      if (templateResult.isSuccess()) {
        const renderResult = templateResult.value.render(mergedParams);
        description = renderResult.isSuccess() ? renderResult.value : `[Render error] ${inlineTask.template}`;
      } else {
        description = `[Template error] ${inlineTask.template}`;
      }
    } else {
      description = inlineTask.template;
    }
  }

  lines.push(`  ${step.order}. ${description}`);

  // Step details
  const details: string[] = [];
  if (step.activeTime !== undefined) {
    details.push(`active: ${step.activeTime}min`);
  }
  if (step.waitTime !== undefined) {
    details.push(`wait: ${step.waitTime}min`);
  }
  if (step.holdTime !== undefined) {
    details.push(`hold: ${step.holdTime}min`);
  }
  if (step.temperature !== undefined) {
    details.push(`temp: ${step.temperature}°C`);
  }

  if (details.length > 0) {
    lines.push(`     [${details.join(', ')}]`);
  }

  if (step.notes) {
    lines.push(`     Note: ${step.notes}`);
  }

  return lines;
}

/**
 * Formats a procedure for human-readable output
 */
function formatProcedureHuman(
  procedure: Entities.Procedures.IProcedure,
  procedureId: ProcedureId,
  tasksLibrary?: Entities.Tasks.TasksLibrary,
  context?: Record<string, unknown>
): string {
  const lines: string[] = [];

  lines.push(`Procedure: ${procedure.name}`);
  lines.push(`ID: ${procedureId}`);

  if (procedure.category) {
    lines.push(`Category: ${procedure.category}`);
  }

  if (procedure.description) {
    lines.push(`Description: ${procedure.description}`);
  }

  if (procedure.tags && procedure.tags.length > 0) {
    lines.push(`Tags: ${procedure.tags.join(', ')}`);
  }

  // Steps
  lines.push('');
  lines.push(`Steps (${procedure.steps.length}):`);
  for (const step of procedure.steps) {
    lines.push(...formatStep(step, tasksLibrary, context));
  }

  // Notes
  if (procedure.notes) {
    lines.push('');
    lines.push(`Notes: ${procedure.notes}`);
  }

  return lines.join('\n');
}

/**
 * Creates the procedure show subcommand
 */
export function createShowSubcommand(): Command {
  const cmd = new Command('show');

  cmd
    .description('Display details of a specific procedure')
    .argument('<procedureId>', 'Procedure ID (e.g., "common.make-ganache")')
    .option('--render', 'Render task templates with context')
    .option('--context <json>', 'JSON context for template rendering (requires --render)')
    .action(async (procedureIdArg: string, localOptions: { render?: boolean; context?: string }) => {
      // Merge with parent options
      const parentOptions = cmd.optsWithGlobals() as IProcedureShowOptions;
      const options: IProcedureShowOptions = {
        ...parentOptions,
        ...localOptions
      };

      // Validate procedure ID
      const procedureIdResult = Converters.procedureId.convert(procedureIdArg);
      if (procedureIdResult.isFailure()) {
        console.error(`Invalid procedure ID "${procedureIdArg}": ${procedureIdResult.message}`);
        process.exit(1);
      }
      const procedureId = procedureIdResult.value;

      // Load the procedures library
      const libraryResult = await loadProceduresLibrary(options);
      if (libraryResult.isFailure()) {
        console.error(`Error loading procedures: ${libraryResult.message}`);
        process.exit(1);
      }
      const library = libraryResult.value;

      // Get the procedure
      const procedureResult = library.get(procedureId);
      if (procedureResult.isFailure()) {
        console.error(`Procedure not found: ${procedureId}`);
        process.exit(1);
      }
      const procedure = procedureResult.value;

      // Load tasks library if rendering
      let tasksLibrary: Entities.Tasks.TasksLibrary | undefined;
      if (options.render) {
        const tasksResult = await loadTasksLibrary(options);
        if (tasksResult.isSuccess()) {
          tasksLibrary = tasksResult.value;
        }
      }

      // Parse context if provided
      let context: Record<string, unknown> | undefined;
      if (options.context) {
        try {
          context = JSON.parse(options.context);
        } catch (e) {
          console.error(`Invalid JSON context: ${e}`);
          process.exit(1);
        }
      }

      const format = (options.format ?? 'human') as OutputFormat;

      // Format and output
      switch (format) {
        case 'json':
          console.log(JSON.stringify(procedure, null, 2));
          break;
        case 'yaml':
          console.log(yaml.stringify(procedure));
          break;
        case 'table':
        case 'human':
        default:
          console.log(
            formatProcedureHuman(procedure, procedureId, options.render ? tasksLibrary : undefined, context)
          );
          break;
      }
    });

  return cmd;
}
