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

import '@fgv/ts-utils-jest';
import { Tasks } from '../../../../packlets/entities';
// eslint-disable-next-line @rushstack/packlets/mechanics
import {
  validateTaskName,
  validateTaskTemplate,
  validateTaskTiming,
  validateRawTaskEntity
} from '../../../../packlets/editing/tasks/validators';
// eslint-disable-next-line @rushstack/packlets/mechanics
import { createBlankRawTaskEntity } from '../../../../packlets/entities/tasks/model';
import { BaseTaskId, Minutes } from '../../../../packlets/common';

type IRawTaskEntity = Tasks.IRawTaskEntity;

// Helper to create a valid base task entity
const createBaseTask = (overrides?: Partial<IRawTaskEntity>): IRawTaskEntity => ({
  baseId: 'test-task' as BaseTaskId,
  name: 'Test Task',
  template: 'Mix {{ingredient}} for {{time}} minutes',
  ...overrides
});

describe('validateTaskName', () => {
  test('should succeed for non-empty name', () => {
    expect(validateTaskName(createBaseTask())).toSucceed();
  });

  test('should fail for empty name', () => {
    expect(validateTaskName(createBaseTask({ name: '' }))).toFailWith(/name must not be empty/i);
  });

  test('should fail for whitespace-only name', () => {
    expect(validateTaskName(createBaseTask({ name: '   ' }))).toFailWith(/name must not be empty/i);
  });
});

describe('validateTaskTemplate', () => {
  test('should succeed for non-empty template', () => {
    expect(validateTaskTemplate(createBaseTask())).toSucceed();
  });

  test('should fail for empty template', () => {
    expect(validateTaskTemplate(createBaseTask({ template: '' }))).toFailWith(/template must not be empty/i);
  });

  test('should fail for whitespace-only template', () => {
    expect(validateTaskTemplate(createBaseTask({ template: '   ' }))).toFailWith(
      /template must not be empty/i
    );
  });
});

describe('validateTaskTiming', () => {
  test('should succeed with no timing values', () => {
    expect(validateTaskTiming(createBaseTask())).toSucceed();
  });

  test('should succeed with valid timing values', () => {
    const task = createBaseTask({
      defaultActiveTime: 15 as Minutes,
      defaultWaitTime: 30 as Minutes,
      defaultHoldTime: 60 as Minutes
    });
    expect(validateTaskTiming(task)).toSucceed();
  });

  test('should succeed with zero timing values', () => {
    const task = createBaseTask({
      defaultActiveTime: 0 as Minutes,
      defaultWaitTime: 0 as Minutes,
      defaultHoldTime: 0 as Minutes
    });
    expect(validateTaskTiming(task)).toSucceed();
  });

  test('should fail for negative defaultActiveTime', () => {
    const task = createBaseTask({ defaultActiveTime: -1 as Minutes });
    expect(validateTaskTiming(task)).toFailWith(/defaultActiveTime must be non-negative/i);
  });

  test('should fail for negative defaultWaitTime', () => {
    const task = createBaseTask({ defaultWaitTime: -5 as Minutes });
    expect(validateTaskTiming(task)).toFailWith(/defaultWaitTime must be non-negative/i);
  });

  test('should fail for negative defaultHoldTime', () => {
    const task = createBaseTask({ defaultHoldTime: -10 as Minutes });
    expect(validateTaskTiming(task)).toFailWith(/defaultHoldTime must be non-negative/i);
  });
});

describe('validateRawTaskEntity', () => {
  test('should succeed for a valid task entity', () => {
    const task = createBaseTask();
    expect(validateRawTaskEntity(task)).toSucceedWith(task);
  });

  test('should succeed for a fully-populated task entity', () => {
    const task = createBaseTask({
      defaultActiveTime: 10 as Minutes,
      defaultWaitTime: 20 as Minutes,
      defaultHoldTime: 30 as Minutes,
      tags: ['mixing', 'prep'],
      notes: [{ category: 'general' as never, note: 'A note' }],
      defaults: { ingredient: 'sugar' }
    });
    expect(validateRawTaskEntity(task)).toSucceedWith(task);
  });

  test('should fail for empty name', () => {
    expect(validateRawTaskEntity(createBaseTask({ name: '' }))).toFailWith(/name must not be empty/i);
  });

  test('should fail for empty template', () => {
    expect(validateRawTaskEntity(createBaseTask({ template: '' }))).toFailWith(/template must not be empty/i);
  });

  test('should fail for negative timing', () => {
    expect(validateRawTaskEntity(createBaseTask({ defaultActiveTime: -1 as Minutes }))).toFailWith(
      /defaultActiveTime must be non-negative/i
    );
  });
});

describe('createBlankRawTaskEntity', () => {
  test('creates a minimal valid entity', () => {
    const entity = createBlankRawTaskEntity('my-task' as BaseTaskId, 'My Task');
    expect(entity.baseId).toBe('my-task');
    expect(entity.name).toBe('My Task');
    expect(entity.template).toBe('');
  });

  test('has no optional fields set', () => {
    const entity = createBlankRawTaskEntity('my-task' as BaseTaskId, 'My Task');
    expect(entity.defaultActiveTime).toBeUndefined();
    expect(entity.defaultWaitTime).toBeUndefined();
    expect(entity.defaultHoldTime).toBeUndefined();
    expect(entity.defaultTemperature).toBeUndefined();
    expect(entity.notes).toBeUndefined();
    expect(entity.tags).toBeUndefined();
    expect(entity.defaults).toBeUndefined();
  });
});
