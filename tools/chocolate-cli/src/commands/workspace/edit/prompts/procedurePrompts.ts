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

import { Result, succeed, fail } from '@fgv/ts-utils';
import {
  Entities,
  BaseProcedureId,
  BaseTaskId,
  ProcedureType,
  Minutes,
  Celsius,
  Converters as CommonConverters
} from '@fgv/ts-chocolate';

import { promptInput, confirmAction, showMenu, IMenuChoice } from '../../shared';

/**
 * All possible procedure types
 */
const allProcedureTypes: ProcedureType[] = [
  'ganache',
  'caramel',
  'gianduja',
  'molded-bonbon',
  'bar-truffle',
  'rolled-truffle',
  'other'
];

/**
 * Prompts the user to build a new procedure entity interactively.
 * @returns Result containing the new procedure entity
 */
export async function promptNewProcedure(): Promise<Result<Entities.Procedures.IProcedureEntity>> {
  const name = await promptInput('Procedure name:');
  if (!name.trim()) {
    return fail('Procedure name is required');
  }

  const baseIdInput = await promptInput('Base ID (leave empty to auto-generate from name):');
  let baseId: BaseProcedureId;
  if (baseIdInput.trim()) {
    const idResult = CommonConverters.baseProcedureId.convert(baseIdInput.trim());
    if (idResult.isFailure()) {
      return fail(`Invalid base ID: ${idResult.message}`);
    }
    baseId = idResult.value;
  } else {
    // Auto-generate from name: lowercase, replace spaces with hyphens, strip non-alphanumeric
    baseId = name
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9_-]/g, '') as BaseProcedureId;
    if (!baseId) {
      return fail('Could not generate a valid base ID from the provided name');
    }
  }

  const description = await promptInput('Description (optional):');

  // Prompt for category
  const addCategory = await confirmAction('Set a category?', false);
  let category: ProcedureType | undefined;
  if (addCategory) {
    const categoryResult = await promptProcedureCategory();
    if (categoryResult.isFailure()) {
      return fail(categoryResult.message);
    }
    category = categoryResult.value;
  }

  // Build entity with required fields
  let entity: Entities.Procedures.IProcedureEntity = {
    baseId,
    name: name.trim(),
    steps: []
  };

  if (description.trim()) {
    entity = { ...entity, description: description.trim() };
  }
  if (category !== undefined) {
    entity = { ...entity, category };
  }

  // Prompt for steps
  const stepsResult = await promptProcedureSteps([]);
  if (stepsResult.isFailure()) {
    return fail(stepsResult.message);
  }
  entity = { ...entity, steps: stepsResult.value };

  return validateProcedure(entity);
}

/**
 * Prompts the user to edit an existing procedure entity interactively.
 * Fields are pre-filled with current values.
 * @param existing - The existing procedure entity to edit
 * @returns Result containing the updated procedure entity
 */
export async function promptEditProcedure(
  existing: Entities.Procedures.IProcedureEntity
): Promise<Result<Entities.Procedures.IProcedureEntity>> {
  const name = await promptInput('Procedure name:', existing.name);
  if (!name.trim()) {
    return fail('Procedure name is required');
  }

  const description = await promptInput('Description (optional):', existing.description);

  // Edit category
  const editCategory = await confirmAction(existing.category ? 'Edit category?' : 'Set a category?', false);
  let category: ProcedureType | undefined = existing.category;
  if (editCategory) {
    const categoryResult = await promptProcedureCategory(existing.category);
    if (categoryResult.isFailure()) {
      return fail(categoryResult.message);
    }
    category = categoryResult.value;
  }

  let entity: Entities.Procedures.IProcedureEntity = {
    baseId: existing.baseId,
    name: name.trim(),
    steps: existing.steps
  };

  if (description.trim()) {
    entity = { ...entity, description: description.trim() };
  }
  if (category !== undefined) {
    entity = { ...entity, category };
  }

  // Prompt to add new steps (preserving existing)
  const addSteps = await confirmAction('Add new steps?', false);
  if (addSteps) {
    const stepsResult = await promptProcedureSteps(existing.steps);
    if (stepsResult.isFailure()) {
      return fail(stepsResult.message);
    }
    entity = { ...entity, steps: stepsResult.value };
  }

  // Preserve notes and tags from existing
  if (existing.notes) {
    entity = { ...entity, notes: existing.notes };
  }
  if (existing.tags) {
    entity = { ...entity, tags: existing.tags };
  }

  return validateProcedure(entity);
}

/**
 * Prompts for a procedure category.
 */
async function promptProcedureCategory(current?: ProcedureType): Promise<Result<ProcedureType | undefined>> {
  const choices: Array<IMenuChoice<ProcedureType | undefined>> = allProcedureTypes.map(
    (type: ProcedureType) => ({
      value: type,
      name: type,
      description: current === type ? '(current)' : undefined
    })
  );

  choices.push({
    value: undefined,
    name: '(none)',
    description: 'No category'
  });

  const result = await showMenu({
    message: 'Select procedure category:',
    choices,
    showBack: false,
    showExit: false
  });

  if (result.action !== 'value') {
    return fail('Category selection cancelled');
  }

  return succeed(result.value);
}

/**
 * Prompts for procedure steps, starting from an existing list.
 */
async function promptProcedureSteps(
  existing: ReadonlyArray<Entities.Procedures.IProcedureStepEntity>
): Promise<Result<ReadonlyArray<Entities.Procedures.IProcedureStepEntity>>> {
  const steps = [...existing];
  let order = steps.length + 1;

  while (true) {
    const addStep = await confirmAction(`Add step ${order}?`, order === 1);
    if (!addStep) {
      break;
    }

    const stepResult = await promptProcedureStep(order);
    if (stepResult.isFailure()) {
      return fail(stepResult.message);
    }

    steps.push(stepResult.value);
    order++;
  }

  return succeed(steps);
}

/**
 * Prompts for a single procedure step.
 */
async function promptProcedureStep(order: number): Promise<Result<Entities.Procedures.IProcedureStepEntity>> {
  // Choose between task reference or inline task
  const taskTypeChoices: Array<IMenuChoice<'reference' | 'inline'>> = [
    {
      value: 'reference',
      name: 'Task Reference',
      description: 'Reference an existing task by ID'
    },
    {
      value: 'inline',
      name: 'Inline Task',
      description: 'Define a task inline for this step'
    }
  ];

  const taskTypeResult = await showMenu({
    message: `Step ${order} - Task type:`,
    choices: taskTypeChoices,
    showBack: false,
    showExit: false
  });

  if (taskTypeResult.action !== 'value') {
    return fail('Task type selection cancelled');
  }

  let task: Entities.Tasks.ITaskEntityInvocation;

  if (taskTypeResult.value === 'reference') {
    // Task reference
    const taskIdStr = await promptInput('Task ID (e.g., "collection.task-name"):');
    if (!taskIdStr.trim()) {
      return fail('Task ID is required');
    }

    const taskIdResult = CommonConverters.taskId.convert(taskIdStr.trim());
    if (taskIdResult.isFailure()) {
      return fail(`Invalid task ID: ${taskIdResult.message}`);
    }

    const paramsResult = await promptTaskParams();
    if (paramsResult.isFailure()) {
      return fail(paramsResult.message);
    }

    task = {
      taskId: taskIdResult.value,
      params: paramsResult.value
    };
  } else {
    // Inline task
    const taskName = await promptInput('Task name:');
    if (!taskName.trim()) {
      return fail('Task name is required');
    }

    const baseTaskIdInput = await promptInput('Task base ID (leave empty to auto-generate):');
    let baseTaskId: BaseTaskId;
    if (baseTaskIdInput.trim()) {
      const idResult = CommonConverters.baseTaskId.convert(baseTaskIdInput.trim());
      if (idResult.isFailure()) {
        return fail(`Invalid base task ID: ${idResult.message}`);
      }
      baseTaskId = idResult.value;
    } else {
      baseTaskId = taskName
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9_-]/g, '') as BaseTaskId;
      if (!baseTaskId) {
        return fail('Could not generate a valid base task ID from the provided name');
      }
    }

    const template = await promptInput('Task template (Mustache format):');
    if (!template.trim()) {
      return fail('Task template is required');
    }

    const paramsResult = await promptTaskParams();
    if (paramsResult.isFailure()) {
      return fail(paramsResult.message);
    }

    task = {
      task: {
        baseId: baseTaskId,
        name: taskName.trim(),
        template: template.trim()
      },
      params: paramsResult.value
    };
  }

  // Prompt for optional timing fields
  let step: Entities.Procedures.IProcedureStepEntity = {
    order,
    task
  };

  const addTimings = await confirmAction('Add timing/temperature values?', false);
  if (addTimings) {
    const timingsResult = await promptStepTimings();
    if (timingsResult.isFailure()) {
      return fail(timingsResult.message);
    }
    step = { ...step, ...timingsResult.value };
  }

  return succeed(step);
}

/**
 * Prompts for task parameters as key=value pairs.
 */
async function promptTaskParams(): Promise<Result<Record<string, unknown>>> {
  const addParams = await confirmAction('Add task parameters?', false);
  if (!addParams) {
    return succeed({});
  }

  const params: Record<string, unknown> = {};

  while (true) {
    const paramInput = await promptInput('Parameter (key=value, or empty to finish):');
    if (!paramInput.trim()) {
      break;
    }

    const match = /^([a-zA-Z0-9_-]+)=(.*)$/.exec(paramInput.trim());
    if (!match) {
      return fail('Parameter must be in format key=value');
    }

    const [, key, value] = match;
    params[key] = value;
  }

  return succeed(params);
}

/**
 * Prompts for optional step timing values.
 */
async function promptStepTimings(): Promise<
  Result<{
    activeTime?: Minutes;
    waitTime?: Minutes;
    holdTime?: Minutes;
    temperature?: Celsius;
  }>
> {
  const timings: {
    activeTime?: Minutes;
    waitTime?: Minutes;
    holdTime?: Minutes;
    temperature?: Celsius;
  } = {};

  const activeTime = await promptInput('Active time (minutes, or empty to skip):');
  if (activeTime.trim()) {
    const parsed = parseFloat(activeTime);
    if (isNaN(parsed) || parsed < 0) {
      return fail('Active time must be a non-negative number');
    }
    timings.activeTime = parsed as Minutes;
  }

  const waitTime = await promptInput('Wait time (minutes, or empty to skip):');
  if (waitTime.trim()) {
    const parsed = parseFloat(waitTime);
    if (isNaN(parsed) || parsed < 0) {
      return fail('Wait time must be a non-negative number');
    }
    timings.waitTime = parsed as Minutes;
  }

  const holdTime = await promptInput('Hold time (minutes, or empty to skip):');
  if (holdTime.trim()) {
    const parsed = parseFloat(holdTime);
    if (isNaN(parsed) || parsed < 0) {
      return fail('Hold time must be a non-negative number');
    }
    timings.holdTime = parsed as Minutes;
  }

  const temperature = await promptInput('Temperature (celsius, or empty to skip):');
  if (temperature.trim()) {
    const parsed = parseFloat(temperature);
    if (isNaN(parsed)) {
      return fail('Temperature must be a number');
    }
    timings.temperature = parsed as Celsius;
  }

  return succeed(timings);
}

/**
 * Validates a procedure entity through the converter.
 */
function validateProcedure(
  entity: Entities.Procedures.IProcedureEntity
): Result<Entities.Procedures.IProcedureEntity> {
  return Entities.Converters.Procedures.procedureEntity
    .convert(entity)
    .withErrorFormat((msg) => `Procedure validation failed: ${msg}`);
}
