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

import { BaseTaskId, Celsius, TaskId, Minutes, Model as CommonModel } from '../../../packlets/common';
import { IRawTaskEntity } from '../../../packlets/entities';
import { RuntimeTask, ITaskContext } from '../../../packlets/library-runtime';

describe('RuntimeTask', () => {
  // Mock task context
  const mockContext: ITaskContext = {
    getTask: (id: TaskId) => fail(`Task not found: ${id}`)
  };

  // Sample task data
  const simpleTaskData: IRawTaskEntity = {
    baseId: 'melt-chocolate' as BaseTaskId,
    name: 'Melt Chocolate',
    template: 'Melt {{amount}}g of {{type}} chocolate at {{temp}}°C'
  };

  const taskWithDefaults: IRawTaskEntity = {
    baseId: 'temper-chocolate' as BaseTaskId,
    name: 'Temper Chocolate',
    template: 'Temper chocolate to {{temp}}°C using {{method}} method',
    defaults: {
      method: 'seeding'
    },
    defaultActiveTime: 15 as Minutes,
    defaultTemperature: 32 as Celsius,
    tags: ['tempering', 'chocolate'],
    notes: [
      { category: 'user', note: 'Ensure accurate temperature control' }
    ] as CommonModel.ICategorizedNote[]
  };

  describe('create', () => {
    test('should create RuntimeTask from ITaskData', () => {
      const taskId = 'common.melt-chocolate' as TaskId;

      expect(RuntimeTask.create(mockContext, taskId, simpleTaskData)).toSucceedAndSatisfy((runtimeTask) => {
        expect(runtimeTask.id).toBe(taskId);
        expect(runtimeTask.baseId).toBe('melt-chocolate');
        expect(runtimeTask.name).toBe('Melt Chocolate');
        expect(runtimeTask.template).toBe('Melt {{amount}}g of {{type}} chocolate at {{temp}}°C');
      });
    });

    test('should expose required variables from template', () => {
      const taskId = 'common.melt-chocolate' as TaskId;

      expect(RuntimeTask.create(mockContext, taskId, simpleTaskData)).toSucceedAndSatisfy((runtimeTask) => {
        expect(runtimeTask.requiredVariables).toEqual(['amount', 'type', 'temp']);
      });
    });

    test('should expose optional properties', () => {
      const taskId = 'common.temper-chocolate' as TaskId;

      expect(RuntimeTask.create(mockContext, taskId, taskWithDefaults)).toSucceedAndSatisfy((runtimeTask) => {
        expect(runtimeTask.defaultActiveTime).toBe(15);
        expect(runtimeTask.defaultTemperature).toBe(32);
        expect(runtimeTask.tags).toEqual(['tempering', 'chocolate']);
        expect(runtimeTask.notes).toEqual([
          { category: 'user', note: 'Ensure accurate temperature control' }
        ]);
        expect(runtimeTask.defaults).toEqual({ method: 'seeding' });
      });
    });
  });

  describe('validateParams', () => {
    test('should succeed when all required variables are provided', () => {
      const taskId = 'common.melt-chocolate' as TaskId;
      const runtimeTask = RuntimeTask.create(mockContext, taskId, simpleTaskData).orThrow();

      expect(runtimeTask.validateParams({ amount: 200, type: 'dark', temp: 45 })).toSucceedAndSatisfy(
        (validation) => {
          expect(validation.isValid).toBe(true);
          expect(validation.missingVariables).toEqual([]);
        }
      );
    });

    test('should report missing variables', () => {
      const taskId = 'common.melt-chocolate' as TaskId;
      const runtimeTask = RuntimeTask.create(mockContext, taskId, simpleTaskData).orThrow();

      expect(runtimeTask.validateParams({ amount: 200 })).toSucceedAndSatisfy((validation) => {
        expect(validation.isValid).toBe(false);
        expect(validation.missingVariables).toContain('type');
        expect(validation.missingVariables).toContain('temp');
      });
    });

    test('should use defaults to satisfy required variables', () => {
      const taskId = 'common.temper-chocolate' as TaskId;
      const runtimeTask = RuntimeTask.create(mockContext, taskId, taskWithDefaults).orThrow();

      // Only provide 'temp', 'method' has a default
      expect(runtimeTask.validateParams({ temp: 32 })).toSucceedAndSatisfy((validation) => {
        expect(validation.isValid).toBe(true);
        expect(validation.missingVariables).toEqual([]);
      });
    });

    test('should report extra variables provided', () => {
      const taskId = 'common.melt-chocolate' as TaskId;
      const runtimeTask = RuntimeTask.create(mockContext, taskId, simpleTaskData).orThrow();

      // Provide required variables plus an extra one
      expect(
        runtimeTask.validateParams({ amount: 200, type: 'dark', temp: 45, extra: 'not-needed' })
      ).toSucceedAndSatisfy((validation) => {
        expect(validation.isValid).toBe(true);
        expect(validation.extraVariables).toContain('extra');
        expect(validation.messages.some((m) => m.match(/extra variables provided/i))).toBe(true);
      });
    });
  });

  describe('render', () => {
    test('should render template with provided params', () => {
      const taskId = 'common.melt-chocolate' as TaskId;
      const runtimeTask = RuntimeTask.create(mockContext, taskId, simpleTaskData).orThrow();

      expect(runtimeTask.render({ amount: 200, type: 'dark', temp: 45 })).toSucceedWith(
        'Melt 200g of dark chocolate at 45°C'
      );
    });

    test('should render template using defaults for missing params', () => {
      const taskId = 'common.temper-chocolate' as TaskId;
      const runtimeTask = RuntimeTask.create(mockContext, taskId, taskWithDefaults).orThrow();

      expect(runtimeTask.render({ temp: 32 })).toSucceedWith('Temper chocolate to 32°C using seeding method');
    });

    test('should allow overriding defaults', () => {
      const taskId = 'common.temper-chocolate' as TaskId;
      const runtimeTask = RuntimeTask.create(mockContext, taskId, taskWithDefaults).orThrow();

      expect(runtimeTask.render({ temp: 28, method: 'tabling' })).toSucceedWith(
        'Temper chocolate to 28°C using tabling method'
      );
    });
  });

  describe('validateAndRender', () => {
    test('should render when validation passes', () => {
      const taskId = 'common.melt-chocolate' as TaskId;
      const runtimeTask = RuntimeTask.create(mockContext, taskId, simpleTaskData).orThrow();

      expect(runtimeTask.validateAndRender({ amount: 200, type: 'dark', temp: 45 })).toSucceedWith(
        'Melt 200g of dark chocolate at 45°C'
      );
    });

    test('should fail when validation fails', () => {
      const taskId = 'common.melt-chocolate' as TaskId;
      const runtimeTask = RuntimeTask.create(mockContext, taskId, simpleTaskData).orThrow();

      expect(runtimeTask.validateAndRender({ amount: 200 })).toFailWith(/missing.*type.*temp/i);
    });
  });

  describe('raw', () => {
    test('should expose underlying ITaskData', () => {
      const taskId = 'common.melt-chocolate' as TaskId;
      const runtimeTask = RuntimeTask.create(mockContext, taskId, simpleTaskData).orThrow();

      expect(runtimeTask.raw).toBe(simpleTaskData);
    });
  });
});
