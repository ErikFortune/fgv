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
import { Entities, BaseTaskId, Converters as CommonConverters } from '@fgv/ts-chocolate';

import { promptInput, confirmAction } from '../../shared';

/**
 * Prompts the user to build a new task entity interactively.
 * @returns Result containing the new task entity
 */
export async function promptNewTask(): Promise<Result<Entities.Tasks.IRawTaskEntity>> {
  const name = await promptInput('Task name:');
  if (!name.trim()) {
    return fail('Task name is required');
  }

  const baseIdInput = await promptInput('Base ID (leave empty to auto-generate from name):');
  let baseId: BaseTaskId;
  if (baseIdInput.trim()) {
    const idResult = CommonConverters.baseTaskId.convert(baseIdInput.trim());
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
      .replace(/[^a-z0-9_-]/g, '') as BaseTaskId;
    if (!baseId) {
      return fail('Could not generate a valid base ID from the provided name');
    }
  }

  const template = await promptInput('Template (Mustache format):');
  if (!template.trim()) {
    return fail('Template is required');
  }

  const entity: Entities.Tasks.IRawTaskEntity = {
    baseId,
    name: name.trim(),
    template: template.trim()
  };

  // Ask about optional timing defaults
  const addTimings = await confirmAction('Add default timing values?', false);
  if (addTimings) {
    const updatedEntity = await promptTaskTimings(entity);
    if (updatedEntity.isFailure()) {
      return updatedEntity;
    }
    return validateTask(updatedEntity.value);
  }

  return validateTask(entity);
}

/**
 * Prompts the user to edit an existing task entity interactively.
 * Fields are pre-filled with current values.
 * @param existing - The existing task entity to edit
 * @returns Result containing the updated task entity
 */
export async function promptEditTask(
  existing: Entities.Tasks.IRawTaskEntity
): Promise<Result<Entities.Tasks.IRawTaskEntity>> {
  const name = await promptInput('Task name:', existing.name);
  if (!name.trim()) {
    return fail('Task name is required');
  }

  const template = await promptInput('Template (Mustache format):', existing.template);
  if (!template.trim()) {
    return fail('Template is required');
  }

  let entity: Entities.Tasks.IRawTaskEntity = {
    baseId: existing.baseId,
    name: name.trim(),
    template: template.trim()
  };

  // Preserve existing optional fields, then allow editing
  const hasTimings =
    existing.defaultActiveTime !== undefined ||
    existing.defaultWaitTime !== undefined ||
    existing.defaultHoldTime !== undefined ||
    existing.defaultTemperature !== undefined;

  const editTimings = await confirmAction(
    hasTimings ? 'Edit default timing values?' : 'Add default timing values?',
    hasTimings
  );

  if (editTimings) {
    // Start with existing optional values
    entity = {
      ...entity,
      ...(existing.defaultActiveTime !== undefined && { defaultActiveTime: existing.defaultActiveTime }),
      ...(existing.defaultWaitTime !== undefined && { defaultWaitTime: existing.defaultWaitTime }),
      ...(existing.defaultHoldTime !== undefined && { defaultHoldTime: existing.defaultHoldTime }),
      ...(existing.defaultTemperature !== undefined && { defaultTemperature: existing.defaultTemperature })
    };

    const updatedEntity = await promptTaskTimings(entity);
    if (updatedEntity.isFailure()) {
      return updatedEntity;
    }
    entity = updatedEntity.value;
  }

  // Preserve notes, tags, and defaults from existing
  if (existing.notes) {
    entity = { ...entity, notes: existing.notes };
  }
  if (existing.tags) {
    entity = { ...entity, tags: existing.tags };
  }
  if (existing.defaults) {
    entity = { ...entity, defaults: existing.defaults };
  }

  return validateTask(entity);
}

/**
 * Prompts for optional timing values.
 */
async function promptTaskTimings(
  entity: Entities.Tasks.IRawTaskEntity
): Promise<Result<Entities.Tasks.IRawTaskEntity>> {
  const result = { ...entity };
  const fields: Record<string, string> = {};

  const activeTime = await promptInput(
    'Default active time (minutes, or empty to skip):',
    entity.defaultActiveTime?.toString()
  );
  if (activeTime.trim()) {
    const parsed = parseFloat(activeTime);
    if (isNaN(parsed) || parsed < 0) {
      return fail('Active time must be a non-negative number');
    }
    fields.defaultActiveTime = activeTime;
  }

  const waitTime = await promptInput(
    'Default wait time (minutes, or empty to skip):',
    entity.defaultWaitTime?.toString()
  );
  if (waitTime.trim()) {
    const parsed = parseFloat(waitTime);
    if (isNaN(parsed) || parsed < 0) {
      return fail('Wait time must be a non-negative number');
    }
    fields.defaultWaitTime = waitTime;
  }

  const holdTime = await promptInput(
    'Default hold time (minutes, or empty to skip):',
    entity.defaultHoldTime?.toString()
  );
  if (holdTime.trim()) {
    const parsed = parseFloat(holdTime);
    if (isNaN(parsed) || parsed < 0) {
      return fail('Hold time must be a non-negative number');
    }
    fields.defaultHoldTime = holdTime;
  }

  const temperature = await promptInput(
    'Default temperature (celsius, or empty to skip):',
    entity.defaultTemperature?.toString()
  );
  if (temperature.trim()) {
    const parsed = parseFloat(temperature);
    if (isNaN(parsed)) {
      return fail('Temperature must be a number');
    }
    fields.defaultTemperature = temperature;
  }

  return succeed({
    ...result,
    ...(fields.defaultActiveTime !== undefined && {
      defaultActiveTime: parseFloat(
        fields.defaultActiveTime
      ) as Entities.Tasks.IRawTaskEntity['defaultActiveTime']
    }),
    ...(fields.defaultWaitTime !== undefined && {
      defaultWaitTime: parseFloat(fields.defaultWaitTime) as Entities.Tasks.IRawTaskEntity['defaultWaitTime']
    }),
    ...(fields.defaultHoldTime !== undefined && {
      defaultHoldTime: parseFloat(fields.defaultHoldTime) as Entities.Tasks.IRawTaskEntity['defaultHoldTime']
    }),
    ...(fields.defaultTemperature !== undefined && {
      defaultTemperature: parseFloat(
        fields.defaultTemperature
      ) as Entities.Tasks.IRawTaskEntity['defaultTemperature']
    })
  });
}

/**
 * Validates a task entity through the converter.
 */
function validateTask(entity: Entities.Tasks.IRawTaskEntity): Result<Entities.Tasks.IRawTaskEntity> {
  return Entities.Converters.Tasks.rawTaskEntity
    .convert(entity)
    .withErrorFormat((msg) => `Task validation failed: ${msg}`);
}
