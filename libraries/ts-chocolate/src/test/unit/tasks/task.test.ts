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
import { Task, ITaskData } from '../../../packlets/tasks';
import { BaseTaskId, Celsius, Minutes } from '../../../packlets/common';

/**
 * Tests for Task - pure data layer class.
 */
describe('Task', () => {
  // ============================================================================
  // Test Data
  // ============================================================================

  const minimalTaskData: ITaskData = {
    baseId: 'simple-task' as BaseTaskId,
    name: 'Simple Task',
    template: 'Do something'
  };

  const taskWithVariables: ITaskData = {
    baseId: 'melt-chocolate' as BaseTaskId,
    name: 'Melt Chocolate',
    template: 'Melt {{ingredient}} to {{temp}}C',
    defaultActiveTime: 5 as Minutes,
    defaultTemperature: 45 as Celsius,
    notes: 'Use double boiler for best results',
    tags: ['chocolate', 'melting']
  };

  const fullTaskData: ITaskData = {
    baseId: 'full-task' as BaseTaskId,
    name: 'Full Task',
    template: 'Process {{item}} for {{duration}} minutes',
    defaultActiveTime: 10 as Minutes,
    defaultWaitTime: 5 as Minutes,
    defaultHoldTime: 2 as Minutes,
    defaultTemperature: 35 as Celsius,
    notes: 'Full task notes',
    tags: ['processing', 'timing']
  };

  // ============================================================================
  // Creation Tests
  // ============================================================================

  describe('create', () => {
    test('creates Task from minimal data', () => {
      expect(Task.create(minimalTaskData)).toSucceedAndSatisfy((task) => {
        expect(task.baseId).toBe('simple-task');
        expect(task.name).toBe('Simple Task');
        expect(task.template).toBe('Do something');
        expect(task.defaultActiveTime).toBeUndefined();
        expect(task.defaultWaitTime).toBeUndefined();
        expect(task.defaultHoldTime).toBeUndefined();
        expect(task.defaultTemperature).toBeUndefined();
        expect(task.notes).toBeUndefined();
        expect(task.tags).toBeUndefined();
      });
    });

    test('creates Task with all optional properties', () => {
      expect(Task.create(fullTaskData)).toSucceedAndSatisfy((task) => {
        expect(task.baseId).toBe('full-task');
        expect(task.name).toBe('Full Task');
        expect(task.template).toBe('Process {{item}} for {{duration}} minutes');
        expect(task.defaultActiveTime).toBe(10);
        expect(task.defaultWaitTime).toBe(5);
        expect(task.defaultHoldTime).toBe(2);
        expect(task.defaultTemperature).toBe(35);
        expect(task.notes).toBe('Full task notes');
        expect(task.tags).toEqual(['processing', 'timing']);
      });
    });

    test('creates Task with template containing variables', () => {
      expect(Task.create(taskWithVariables)).toSucceedAndSatisfy((task) => {
        expect(task.baseId).toBe('melt-chocolate');
        expect(task.template).toBe('Melt {{ingredient}} to {{temp}}C');
        expect(task.defaultActiveTime).toBe(5);
        expect(task.defaultTemperature).toBe(45);
        expect(task.notes).toBe('Use double boiler for best results');
        expect(task.tags).toEqual(['chocolate', 'melting']);
      });
    });

    test('creates Task with defaults', () => {
      const taskDataWithDefaults: ITaskData = {
        baseId: 'with-defaults' as BaseTaskId,
        name: 'With Defaults',
        template: 'Melt {{ingredient}} to {{temp}}',
        defaults: { ingredient: 'chocolate', temp: '40C' }
      };

      expect(Task.create(taskDataWithDefaults)).toSucceedAndSatisfy((task) => {
        expect(task.defaults).toEqual({ ingredient: 'chocolate', temp: '40C' });
      });
    });
  });

  // ============================================================================
  // toData Tests
  // ============================================================================

  describe('toData', () => {
    test('converts minimal task back to data', () => {
      const task = Task.create(minimalTaskData).orThrow();
      const data = task.toData();

      expect(data.baseId).toBe('simple-task');
      expect(data.name).toBe('Simple Task');
      expect(data.template).toBe('Do something');
      expect(data.defaultActiveTime).toBeUndefined();
      expect(data.defaultWaitTime).toBeUndefined();
      expect(data.defaultHoldTime).toBeUndefined();
      expect(data.defaultTemperature).toBeUndefined();
      expect(data.notes).toBeUndefined();
      expect(data.tags).toBeUndefined();
    });

    test('converts full task back to data', () => {
      const task = Task.create(fullTaskData).orThrow();
      const data = task.toData();

      expect(data.baseId).toBe('full-task');
      expect(data.name).toBe('Full Task');
      expect(data.template).toBe('Process {{item}} for {{duration}} minutes');
      expect(data.defaultActiveTime).toBe(10);
      expect(data.defaultWaitTime).toBe(5);
      expect(data.defaultHoldTime).toBe(2);
      expect(data.defaultTemperature).toBe(35);
      expect(data.notes).toBe('Full task notes');
      expect(data.tags).toEqual(['processing', 'timing']);
    });

    test('round-trips data correctly', () => {
      const original = Task.create(taskWithVariables).orThrow();
      const data = original.toData();
      const recreated = Task.create(data).orThrow();

      expect(recreated.baseId).toBe(original.baseId);
      expect(recreated.name).toBe(original.name);
      expect(recreated.template).toBe(original.template);
      expect(recreated.defaultActiveTime).toBe(original.defaultActiveTime);
      expect(recreated.defaultTemperature).toBe(original.defaultTemperature);
      expect(recreated.notes).toBe(original.notes);
      expect(recreated.tags).toEqual(original.tags);
    });

    test('includes defaults in toData when present', () => {
      const taskWithDefaults: ITaskData = {
        baseId: 'with-defaults' as BaseTaskId,
        name: 'With Defaults',
        template: 'Melt {{ingredient}} to {{temp}}',
        defaults: { ingredient: 'chocolate', temp: '40C' }
      };

      const task = Task.create(taskWithDefaults).orThrow();
      const data = task.toData();

      expect(data.defaults).toEqual({ ingredient: 'chocolate', temp: '40C' });
    });
  });

  // ============================================================================
  // ITaskData interface implementation
  // ============================================================================

  describe('ITaskData interface implementation', () => {
    test('implements all ITaskData properties', () => {
      expect(Task.create(fullTaskData)).toSucceedAndSatisfy((task) => {
        // Required properties
        expect(typeof task.baseId).toBe('string');
        expect(typeof task.name).toBe('string');
        expect(typeof task.template).toBe('string');

        // Optional properties - verify they exist on the object
        const taskData: ITaskData = task;
        expect(taskData.defaultActiveTime).toBeDefined();
        expect(taskData.defaultWaitTime).toBeDefined();
        expect(taskData.defaultHoldTime).toBeDefined();
        expect(taskData.defaultTemperature).toBeDefined();
        expect(taskData.notes).toBeDefined();
        expect(taskData.tags).toBeDefined();
      });
    });

    test('task can be used as ITaskData', () => {
      expect(Task.create(fullTaskData)).toSucceedAndSatisfy((task) => {
        // Type check - this compiles if Task implements ITaskData correctly
        const taskData: ITaskData = task;
        expect(taskData.baseId).toBe(task.baseId);
      });
    });
  });
});
