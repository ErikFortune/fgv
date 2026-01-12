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
import { fail } from '@fgv/ts-utils';

import { BaseTaskId, TaskId, Minutes, Celsius } from '../../../packlets/common';
import { Task, ITaskData } from '../../../packlets/tasks';
import { RuntimeTask, ITaskContext } from '../../../packlets/runtime';

describe('RuntimeTask', () => {
  // Mock task context
  const mockContext: ITaskContext = {
    getTask: (id: TaskId) => fail(`Task not found: ${id}`)
  };

  // Sample task data
  const simpleTaskData: ITaskData = {
    baseId: 'melt-chocolate' as BaseTaskId,
    name: 'Melt Chocolate',
    template: 'Melt {{amount}}g of {{type}} chocolate at {{temp}}°C'
  };

  const taskWithDefaults: ITaskData = {
    baseId: 'temper-chocolate' as BaseTaskId,
    name: 'Temper Chocolate',
    template: 'Temper chocolate to {{temp}}°C using {{method}} method',
    defaults: {
      method: 'seeding'
    },
    defaultActiveTime: 15 as Minutes,
    defaultTemperature: 32 as Celsius,
    tags: ['tempering', 'chocolate'],
    notes: 'Ensure accurate temperature control'
  };

  describe('create', () => {
    test('should create RuntimeTask from Task', () => {
      const task = Task.create(simpleTaskData).orThrow();
      const taskId = 'common.melt-chocolate' as TaskId;

      expect(RuntimeTask.create(mockContext, taskId, task)).toSucceedAndSatisfy((runtimeTask) => {
        expect(runtimeTask.id).toBe(taskId);
        expect(runtimeTask.baseId).toBe('melt-chocolate');
        expect(runtimeTask.name).toBe('Melt Chocolate');
        expect(runtimeTask.template).toBe('Melt {{amount}}g of {{type}} chocolate at {{temp}}°C');
      });
    });

    test('should expose required variables from template', () => {
      const task = Task.create(simpleTaskData).orThrow();
      const taskId = 'common.melt-chocolate' as TaskId;

      expect(RuntimeTask.create(mockContext, taskId, task)).toSucceedAndSatisfy((runtimeTask) => {
        expect(runtimeTask.requiredVariables).toEqual(['amount', 'type', 'temp']);
      });
    });

    test('should expose optional properties', () => {
      const task = Task.create(taskWithDefaults).orThrow();
      const taskId = 'common.temper-chocolate' as TaskId;

      expect(RuntimeTask.create(mockContext, taskId, task)).toSucceedAndSatisfy((runtimeTask) => {
        expect(runtimeTask.defaultActiveTime).toBe(15);
        expect(runtimeTask.defaultTemperature).toBe(32);
        expect(runtimeTask.tags).toEqual(['tempering', 'chocolate']);
        expect(runtimeTask.notes).toBe('Ensure accurate temperature control');
        expect(runtimeTask.defaults).toEqual({ method: 'seeding' });
      });
    });
  });

  describe('validateParams', () => {
    test('should succeed when all required variables are provided', () => {
      const task = Task.create(simpleTaskData).orThrow();
      const taskId = 'common.melt-chocolate' as TaskId;
      const runtimeTask = RuntimeTask.create(mockContext, taskId, task).orThrow();

      expect(runtimeTask.validateParams({ amount: 200, type: 'dark', temp: 45 })).toSucceedAndSatisfy(
        (validation) => {
          expect(validation.isValid).toBe(true);
          expect(validation.missingVariables).toEqual([]);
        }
      );
    });

    test('should report missing variables', () => {
      const task = Task.create(simpleTaskData).orThrow();
      const taskId = 'common.melt-chocolate' as TaskId;
      const runtimeTask = RuntimeTask.create(mockContext, taskId, task).orThrow();

      expect(runtimeTask.validateParams({ amount: 200 })).toSucceedAndSatisfy((validation) => {
        expect(validation.isValid).toBe(false);
        expect(validation.missingVariables).toContain('type');
        expect(validation.missingVariables).toContain('temp');
      });
    });

    test('should use defaults to satisfy required variables', () => {
      const task = Task.create(taskWithDefaults).orThrow();
      const taskId = 'common.temper-chocolate' as TaskId;
      const runtimeTask = RuntimeTask.create(mockContext, taskId, task).orThrow();

      // Only provide 'temp', 'method' has a default
      expect(runtimeTask.validateParams({ temp: 32 })).toSucceedAndSatisfy((validation) => {
        expect(validation.isValid).toBe(true);
        expect(validation.missingVariables).toEqual([]);
      });
    });
  });

  describe('render', () => {
    test('should render template with provided params', () => {
      const task = Task.create(simpleTaskData).orThrow();
      const taskId = 'common.melt-chocolate' as TaskId;
      const runtimeTask = RuntimeTask.create(mockContext, taskId, task).orThrow();

      expect(runtimeTask.render({ amount: 200, type: 'dark', temp: 45 })).toSucceedWith(
        'Melt 200g of dark chocolate at 45°C'
      );
    });

    test('should render template using defaults for missing params', () => {
      const task = Task.create(taskWithDefaults).orThrow();
      const taskId = 'common.temper-chocolate' as TaskId;
      const runtimeTask = RuntimeTask.create(mockContext, taskId, task).orThrow();

      expect(runtimeTask.render({ temp: 32 })).toSucceedWith('Temper chocolate to 32°C using seeding method');
    });

    test('should allow overriding defaults', () => {
      const task = Task.create(taskWithDefaults).orThrow();
      const taskId = 'common.temper-chocolate' as TaskId;
      const runtimeTask = RuntimeTask.create(mockContext, taskId, task).orThrow();

      expect(runtimeTask.render({ temp: 28, method: 'tabling' })).toSucceedWith(
        'Temper chocolate to 28°C using tabling method'
      );
    });
  });

  describe('validateAndRender', () => {
    test('should render when validation passes', () => {
      const task = Task.create(simpleTaskData).orThrow();
      const taskId = 'common.melt-chocolate' as TaskId;
      const runtimeTask = RuntimeTask.create(mockContext, taskId, task).orThrow();

      expect(runtimeTask.validateAndRender({ amount: 200, type: 'dark', temp: 45 })).toSucceedWith(
        'Melt 200g of dark chocolate at 45°C'
      );
    });

    test('should fail when validation fails', () => {
      const task = Task.create(simpleTaskData).orThrow();
      const taskId = 'common.melt-chocolate' as TaskId;
      const runtimeTask = RuntimeTask.create(mockContext, taskId, task).orThrow();

      expect(runtimeTask.validateAndRender({ amount: 200 })).toFailWith(/missing.*type.*temp/i);
    });
  });

  describe('raw', () => {
    test('should expose underlying Task', () => {
      const task = Task.create(simpleTaskData).orThrow();
      const taskId = 'common.melt-chocolate' as TaskId;
      const runtimeTask = RuntimeTask.create(mockContext, taskId, task).orThrow();

      expect(runtimeTask.raw).toBe(task);
    });
  });
});
