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

describe('Task', () => {
  // ============================================================================
  // Test Data
  // ============================================================================

  // ITaskData is the persisted format - requiredVariables is extracted from template at runtime
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
        expect(task.requiredVariables).toEqual([]);
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
        expect(task.requiredVariables).toEqual(['item', 'duration']);
        expect(task.defaultActiveTime).toBe(10);
        expect(task.defaultWaitTime).toBe(5);
        expect(task.defaultHoldTime).toBe(2);
        expect(task.defaultTemperature).toBe(35);
        expect(task.notes).toBe('Full task notes');
        expect(task.tags).toEqual(['processing', 'timing']);
      });
    });

    test('creates Task with template variables', () => {
      expect(Task.create(taskWithVariables)).toSucceedAndSatisfy((task) => {
        expect(task.baseId).toBe('melt-chocolate');
        expect(task.requiredVariables).toEqual(['ingredient', 'temp']);
        expect(task.defaultActiveTime).toBe(5);
        expect(task.defaultTemperature).toBe(45);
        expect(task.notes).toBe('Use double boiler for best results');
        expect(task.tags).toEqual(['chocolate', 'melting']);
      });
    });

    test('fails for invalid Mustache template', () => {
      const invalidData: ITaskData = {
        baseId: 'invalid' as BaseTaskId,
        name: 'Invalid',
        template: 'Unclosed {{bracket'
      };

      expect(Task.create(invalidData)).toFail();
    });

    test('extracts requiredVariables from template automatically', () => {
      const data: ITaskData = {
        baseId: 'auto-extract' as BaseTaskId,
        name: 'Auto Extract',
        template: 'Use {{ingredient}} and {{tool}}'
      };

      expect(Task.create(data)).toSucceedAndSatisfy((task) => {
        // Variables are extracted from template - single source of truth
        expect(task.requiredVariables).toEqual(['ingredient', 'tool']);
      });
    });

    test('extracts no variables from plain text template', () => {
      const data: ITaskData = {
        baseId: 'no-vars' as BaseTaskId,
        name: 'No Variables',
        template: 'Do something simple'
      };

      expect(Task.create(data)).toSucceedAndSatisfy((task) => {
        expect(task.requiredVariables).toEqual([]);
      });
    });
  });

  // ============================================================================
  // getTemplateVariables Tests
  // ============================================================================

  describe('getTemplateVariables', () => {
    test('returns empty array for template without variables', () => {
      const task = Task.create(minimalTaskData).orThrow();
      expect(task.getTemplateVariables()).toEqual([]);
    });

    test('returns variable names from template', () => {
      const task = Task.create(taskWithVariables).orThrow();
      const vars = task.getTemplateVariables();
      expect(vars).toContain('ingredient');
      expect(vars).toContain('temp');
    });

    test('extracts nested variables correctly', () => {
      const nestedData: ITaskData = {
        baseId: 'nested' as BaseTaskId,
        name: 'Nested',
        template: 'Use {{ingredient.name}} at {{settings.temp}}'
      };

      const task = Task.create(nestedData).orThrow();
      const vars = task.getTemplateVariables();
      expect(vars).toContain('ingredient.name');
      expect(vars).toContain('settings.temp');
    });
  });

  // ============================================================================
  // validateParams Tests
  // ============================================================================

  describe('validateParams', () => {
    let task: Task;

    beforeEach(() => {
      task = Task.create(taskWithVariables).orThrow();
    });

    test('validates params with all required variables present', () => {
      const params = { ingredient: 'chocolate', temp: 45 };

      expect(task.validateParams(params)).toSucceedAndSatisfy((result) => {
        expect(result.isValid).toBe(true);
        expect(result.taskFound).toBe(true);
        expect(result.missingVariables).toEqual([]);
        expect(result.messages).toEqual([]);
      });
    });

    test('reports missing variables', () => {
      const params = { ingredient: 'chocolate' }; // missing 'temp'

      expect(task.validateParams(params)).toSucceedAndSatisfy((result) => {
        expect(result.isValid).toBe(false);
        expect(result.missingVariables).toContain('temp');
        expect(result.messages.length).toBeGreaterThan(0);
        expect(result.messages[0]).toMatch(/missing required variables.*temp/i);
      });
    });

    test('reports all missing variables', () => {
      const params = {}; // missing both

      expect(task.validateParams(params)).toSucceedAndSatisfy((result) => {
        expect(result.isValid).toBe(false);
        expect(result.missingVariables).toContain('ingredient');
        expect(result.missingVariables).toContain('temp');
      });
    });

    test('reports extra variables', () => {
      const params = { ingredient: 'chocolate', temp: 45, extra: 'value' };

      expect(task.validateParams(params)).toSucceedAndSatisfy((result) => {
        expect(result.isValid).toBe(true); // Still valid, extras are allowed
        expect(result.extraVariables).toContain('extra');
        expect(result.messages.some((m) => m.match(/extra variables provided/i))).toBe(true);
      });
    });

    test('valid params on task with no required variables', () => {
      const simpleTask = Task.create(minimalTaskData).orThrow();

      expect(simpleTask.validateParams({})).toSucceedAndSatisfy((result) => {
        expect(result.isValid).toBe(true);
        expect(result.missingVariables).toEqual([]);
      });
    });
  });

  // ============================================================================
  // render Tests
  // ============================================================================

  describe('render', () => {
    let task: Task;

    beforeEach(() => {
      task = Task.create(taskWithVariables).orThrow();
    });

    test('renders template with all params', () => {
      expect(task.render({ ingredient: 'dark chocolate', temp: 45 })).toSucceedWith(
        'Melt dark chocolate to 45C'
      );
    });

    test('renders template with extra params', () => {
      expect(task.render({ ingredient: 'milk chocolate', temp: 40, extra: 'ignored' })).toSucceedWith(
        'Melt milk chocolate to 40C'
      );
    });

    test('renders with missing params (empty string)', () => {
      // Mustache typically replaces missing variables with empty string
      expect(task.render({ ingredient: 'chocolate' })).toSucceedAndSatisfy((result) => {
        expect(result).toContain('chocolate');
      });
    });

    test('renders template without variables', () => {
      const simpleTask = Task.create(minimalTaskData).orThrow();
      expect(simpleTask.render({})).toSucceedWith('Do something');
    });
  });

  // ============================================================================
  // validateAndRender Tests
  // ============================================================================

  describe('validateAndRender', () => {
    let task: Task;

    beforeEach(() => {
      task = Task.create(taskWithVariables).orThrow();
    });

    test('validates and renders with valid params', () => {
      expect(task.validateAndRender({ ingredient: 'white chocolate', temp: 42 })).toSucceedWith(
        'Melt white chocolate to 42C'
      );
    });

    test('fails with missing params', () => {
      expect(task.validateAndRender({ ingredient: 'chocolate' })).toFail();
    });

    test('fails with all params missing', () => {
      expect(task.validateAndRender({})).toFail();
    });
  });

  // ============================================================================
  // toData Tests
  // ============================================================================

  describe('toData', () => {
    test('converts minimal task back to data without requiredVariables', () => {
      const task = Task.create(minimalTaskData).orThrow();
      const data = task.toData();

      expect(data.baseId).toBe('simple-task');
      expect(data.name).toBe('Simple Task');
      expect(data.template).toBe('Do something');
      // requiredVariables is NOT included in toData() - computed from template at runtime
      expect('requiredVariables' in data).toBe(false);
      expect(data.defaultActiveTime).toBeUndefined();
      expect(data.defaultWaitTime).toBeUndefined();
      expect(data.defaultHoldTime).toBeUndefined();
      expect(data.defaultTemperature).toBeUndefined();
      expect(data.notes).toBeUndefined();
      expect(data.tags).toBeUndefined();
    });

    test('converts full task back to data without requiredVariables', () => {
      const task = Task.create(fullTaskData).orThrow();
      const data = task.toData();

      expect(data.baseId).toBe('full-task');
      expect(data.name).toBe('Full Task');
      expect(data.template).toBe('Process {{item}} for {{duration}} minutes');
      // requiredVariables is NOT included in toData() - computed from template at runtime
      expect('requiredVariables' in data).toBe(false);
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
      expect(recreated.requiredVariables).toEqual(original.requiredVariables);
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
  // Defaults Tests
  // ============================================================================

  describe('defaults', () => {
    const taskDataWithDefaults: ITaskData = {
      baseId: 'melt-with-defaults' as BaseTaskId,
      name: 'Melt With Defaults',
      template: 'Melt {{ingredient}} to {{temp}}',
      defaults: { ingredient: 'chocolate', temp: '40C' }
    };

    const taskDataWithPartialDefaults: ITaskData = {
      baseId: 'melt-partial-defaults' as BaseTaskId,
      name: 'Melt Partial Defaults',
      template: 'Melt {{ingredient}} to {{temp}}',
      defaults: { temp: '45C' }
    };

    describe('create', () => {
      test('creates Task with defaults', () => {
        expect(Task.create(taskDataWithDefaults)).toSucceedAndSatisfy((task) => {
          expect(task.defaults).toEqual({ ingredient: 'chocolate', temp: '40C' });
          expect(task.requiredVariables).toEqual(['ingredient', 'temp']);
        });
      });

      test('creates Task without defaults', () => {
        expect(Task.create(minimalTaskData)).toSucceedAndSatisfy((task) => {
          expect(task.defaults).toBeUndefined();
        });
      });
    });

    describe('validateParams with defaults', () => {
      test('validates params when defaults provide all missing values', () => {
        const task = Task.create(taskDataWithDefaults).orThrow();

        expect(task.validateParams({})).toSucceedAndSatisfy((result) => {
          expect(result.isValid).toBe(true);
          expect(result.missingVariables).toEqual([]);
        });
      });

      test('validates params when defaults provide some values', () => {
        const task = Task.create(taskDataWithPartialDefaults).orThrow();

        // Missing ingredient, but temp has default
        expect(task.validateParams({})).toSucceedAndSatisfy((result) => {
          expect(result.isValid).toBe(false);
          expect(result.missingVariables).toContain('ingredient');
          expect(result.missingVariables).not.toContain('temp');
        });
      });

      test('allows overriding defaults with params', () => {
        const task = Task.create(taskDataWithDefaults).orThrow();

        expect(task.validateParams({ ingredient: 'white chocolate' })).toSucceedAndSatisfy((result) => {
          expect(result.isValid).toBe(true);
        });
      });

      test('validates params when all required values provided explicitly', () => {
        const task = Task.create(taskDataWithDefaults).orThrow();

        expect(task.validateParams({ ingredient: 'dark chocolate', temp: '50C' })).toSucceedAndSatisfy(
          (result) => {
            expect(result.isValid).toBe(true);
          }
        );
      });
    });

    describe('render with defaults', () => {
      test('renders with only defaults (no params)', () => {
        const task = Task.create(taskDataWithDefaults).orThrow();

        expect(task.render({})).toSucceedWith('Melt chocolate to 40C');
      });

      test('renders with defaults and partial params override', () => {
        const task = Task.create(taskDataWithDefaults).orThrow();

        expect(task.render({ ingredient: 'white chocolate' })).toSucceedWith('Melt white chocolate to 40C');
      });

      test('renders with all params overriding defaults', () => {
        const task = Task.create(taskDataWithDefaults).orThrow();

        expect(task.render({ ingredient: 'dark chocolate', temp: '50C' })).toSucceedWith(
          'Melt dark chocolate to 50C'
        );
      });

      test('renders with partial defaults and required params', () => {
        const task = Task.create(taskDataWithPartialDefaults).orThrow();

        expect(task.render({ ingredient: 'milk chocolate' })).toSucceedWith('Melt milk chocolate to 45C');
      });
    });

    describe('validateAndRender with defaults', () => {
      test('validates and renders with only defaults', () => {
        const task = Task.create(taskDataWithDefaults).orThrow();

        expect(task.validateAndRender({})).toSucceedWith('Melt chocolate to 40C');
      });

      test('validates and renders with partial override', () => {
        const task = Task.create(taskDataWithDefaults).orThrow();

        expect(task.validateAndRender({ temp: '55C' })).toSucceedWith('Melt chocolate to 55C');
      });

      test('fails validation when required param missing and no default', () => {
        const task = Task.create(taskDataWithPartialDefaults).orThrow();

        expect(task.validateAndRender({})).toFail();
      });

      test('succeeds when required param provided with partial defaults', () => {
        const task = Task.create(taskDataWithPartialDefaults).orThrow();

        expect(task.validateAndRender({ ingredient: 'dark chocolate' })).toSucceedWith(
          'Melt dark chocolate to 45C'
        );
      });
    });

    describe('round-trip with defaults', () => {
      test('round-trips task with defaults correctly', () => {
        const original = Task.create(taskDataWithDefaults).orThrow();
        const data = original.toData();
        const recreated = Task.create(data).orThrow();

        expect(recreated.defaults).toEqual(original.defaults);
        expect(recreated.render({})).toSucceedWith('Melt chocolate to 40C');
      });
    });
  });
});
