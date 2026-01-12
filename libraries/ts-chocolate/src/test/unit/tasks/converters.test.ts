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
import { Converters as TaskConverters } from '../../../packlets/tasks';
import { BaseTaskId, TaskId } from '../../../packlets/common';

const {
  taskData,
  taskRef,
  taskRefStatus,
  inlineTask,
  taskInvocation,
  procedureStepTask,
  validationBehavior,
  renderOptions,
  taskIdOrBaseTaskId
} = TaskConverters;

describe('TaskConverters', () => {
  // ============================================================================
  // taskIdOrBaseTaskId
  // ============================================================================
  describe('taskIdOrBaseTaskId', () => {
    test('converts composite TaskId with dot', () => {
      expect(taskIdOrBaseTaskId.convert('common.melt-chocolate')).toSucceedWith(
        'common.melt-chocolate' as TaskId
      );
    });

    test('converts local BaseTaskId without dot', () => {
      expect(taskIdOrBaseTaskId.convert('melt-chocolate')).toSucceedWith('melt-chocolate' as BaseTaskId);
    });

    test('fails for non-string input', () => {
      expect(taskIdOrBaseTaskId.convert(123)).toFailWith(/invalid taskid/i);
    });

    test('fails for null', () => {
      expect(taskIdOrBaseTaskId.convert(null)).toFailWith(/invalid taskid/i);
    });
  });

  // ============================================================================
  // taskData
  // ============================================================================
  describe('taskData', () => {
    test('converts valid task data with all optional fields', () => {
      const data = {
        baseId: 'melt-chocolate',
        name: 'Melt Chocolate',
        template: 'Melt {{ingredient}} to {{temp}}C',
        defaultActiveTime: 5,
        defaultWaitTime: 10,
        defaultHoldTime: 2,
        defaultTemperature: 45,
        notes: 'Use double boiler',
        tags: ['chocolate', 'melting']
      };

      expect(taskData.convert(data)).toSucceedAndSatisfy((result) => {
        expect(result.baseId).toBe('melt-chocolate');
        expect(result.name).toBe('Melt Chocolate');
        expect(result.template).toBe('Melt {{ingredient}} to {{temp}}C');
        // requiredVariables is not in persisted data - extracted from template at runtime
        expect(result.defaultActiveTime).toBe(5);
        expect(result.defaultWaitTime).toBe(10);
        expect(result.defaultHoldTime).toBe(2);
        expect(result.defaultTemperature).toBe(45);
        expect(result.notes).toBe('Use double boiler');
        expect(result.tags).toEqual(['chocolate', 'melting']);
      });
    });

    test('converts minimal task data', () => {
      const data = {
        baseId: 'simple-task',
        name: 'Simple Task',
        template: 'Do something'
      };

      expect(taskData.convert(data)).toSucceedAndSatisfy((result) => {
        expect(result.baseId).toBe('simple-task');
        expect(result.name).toBe('Simple Task');
        expect(result.template).toBe('Do something');
        // requiredVariables is not in persisted data - extracted from template at runtime
        expect(result.defaultActiveTime).toBeUndefined();
        expect(result.notes).toBeUndefined();
        expect(result.tags).toBeUndefined();
      });
    });

    test('fails for missing required fields', () => {
      expect(taskData.convert({ baseId: 'test' })).toFail();
      expect(taskData.convert({ name: 'test' })).toFail();
      expect(taskData.convert({})).toFail();
    });

    test('fails for non-object input', () => {
      expect(taskData.convert('string')).toFail();
      expect(taskData.convert(null)).toFail();
      expect(taskData.convert(123)).toFail();
    });

    test('converts task data with defaults', () => {
      const data = {
        baseId: 'melt-chocolate',
        name: 'Melt Chocolate',
        template: 'Melt {{ingredient}} to {{temp}}',
        defaults: { ingredient: 'chocolate', temp: '40C' }
      };

      expect(taskData.convert(data)).toSucceedAndSatisfy((result) => {
        expect(result.baseId).toBe('melt-chocolate');
        expect(result.defaults).toEqual({ ingredient: 'chocolate', temp: '40C' });
      });
    });

    test('converts task data without defaults', () => {
      const data = {
        baseId: 'simple-task',
        name: 'Simple Task',
        template: 'Do something'
      };

      expect(taskData.convert(data)).toSucceedAndSatisfy((result) => {
        expect(result.defaults).toBeUndefined();
      });
    });

    test('fails for defaults that is not an object', () => {
      const data = {
        baseId: 'bad-task',
        name: 'Bad Task',
        template: 'Do something',
        defaults: 'not-an-object'
      };

      expect(taskData.convert(data)).toFailWith(/not a string-keyed object/i);
    });

    test('fails for defaults that is an array', () => {
      const data = {
        baseId: 'bad-task',
        name: 'Bad Task',
        template: 'Do something',
        defaults: ['not', 'an', 'object']
      };

      expect(taskData.convert(data)).toFailWith(/not a string-keyed object/i);
    });
  });

  // ============================================================================
  // taskRef
  // ============================================================================
  describe('taskRef', () => {
    test('converts valid task reference with composite ID', () => {
      const ref = {
        taskId: 'common.melt-chocolate',
        params: { ingredient: 'chocolate', temp: 45 }
      };

      expect(taskRef.convert(ref)).toSucceedAndSatisfy((result) => {
        expect(result.taskId).toBe('common.melt-chocolate');
        expect(result.params).toEqual({ ingredient: 'chocolate', temp: 45 });
      });
    });

    test('converts valid task reference with local BaseTaskId', () => {
      const ref = {
        taskId: 'melt-chocolate',
        params: { ingredient: 'dark chocolate' }
      };

      expect(taskRef.convert(ref)).toSucceedAndSatisfy((result) => {
        expect(result.taskId).toBe('melt-chocolate');
        expect(result.params).toEqual({ ingredient: 'dark chocolate' });
      });
    });

    test('converts task reference with empty params', () => {
      const ref = {
        taskId: 'simple-task',
        params: {}
      };

      expect(taskRef.convert(ref)).toSucceedAndSatisfy((result) => {
        expect(result.taskId).toBe('simple-task');
        expect(result.params).toEqual({});
      });
    });

    test('fails for missing taskId', () => {
      expect(taskRef.convert({ params: {} })).toFail();
    });

    test('fails for missing params', () => {
      expect(taskRef.convert({ taskId: 'test' })).toFail();
    });

    test('fails for invalid params (array)', () => {
      expect(taskRef.convert({ taskId: 'test', params: [1, 2, 3] })).toFailWith(/not a string-keyed object/i);
    });

    test('fails for invalid params (null)', () => {
      expect(taskRef.convert({ taskId: 'test', params: null })).toFailWith(/not a string-keyed object/i);
    });
  });

  // ============================================================================
  // taskRefStatus
  // ============================================================================
  describe('taskRefStatus', () => {
    test('converts valid status values', () => {
      expect(taskRefStatus.convert('valid')).toSucceedWith('valid');
      expect(taskRefStatus.convert('task-not-found')).toSucceedWith('task-not-found');
      expect(taskRefStatus.convert('missing-variables')).toSucceedWith('missing-variables');
      expect(taskRefStatus.convert('invalid-params')).toSucceedWith('invalid-params');
    });

    test('fails for invalid status', () => {
      expect(taskRefStatus.convert('unknown')).toFail();
      expect(taskRefStatus.convert('')).toFail();
      expect(taskRefStatus.convert(123)).toFail();
    });
  });

  // ============================================================================
  // inlineTask
  // ============================================================================
  describe('inlineTask', () => {
    test('converts valid inline task with full task definition', () => {
      const data = {
        task: {
          baseId: 'ganache-cold-method-step-4',
          name: 'Add Butter',
          template: 'Add {{ingredient}} at {{temp}}C',
          defaultActiveTime: 2,
          defaultWaitTime: 5,
          defaultHoldTime: 1,
          defaultTemperature: 35,
          notes: 'Blend until smooth',
          tags: ['mixing']
        },
        params: { ingredient: 'butter', temp: 35 }
      };

      expect(inlineTask.convert(data)).toSucceedAndSatisfy((result) => {
        expect(result.task.baseId).toBe('ganache-cold-method-step-4');
        expect(result.task.name).toBe('Add Butter');
        expect(result.task.template).toBe('Add {{ingredient}} at {{temp}}C');
        expect(result.task.defaultActiveTime).toBe(2);
        expect(result.task.defaultWaitTime).toBe(5);
        expect(result.task.defaultHoldTime).toBe(1);
        expect(result.task.defaultTemperature).toBe(35);
        expect(result.task.notes).toBe('Blend until smooth');
        expect(result.task.tags).toEqual(['mixing']);
        expect(result.params).toEqual({ ingredient: 'butter', temp: 35 });
      });
    });

    test('converts minimal inline task', () => {
      const data = {
        task: {
          baseId: 'proc-step-1',
          name: 'Simple Step',
          template: 'Do something simple'
        },
        params: {}
      };

      expect(inlineTask.convert(data)).toSucceedAndSatisfy((result) => {
        expect(result.task.baseId).toBe('proc-step-1');
        expect(result.task.name).toBe('Simple Step');
        expect(result.task.template).toBe('Do something simple');
        expect(result.task.defaultActiveTime).toBeUndefined();
        expect(result.params).toEqual({});
      });
    });

    test('fails for missing task', () => {
      expect(inlineTask.convert({ params: {} })).toFail();
    });

    test('fails for missing params', () => {
      expect(inlineTask.convert({ task: { baseId: 'test', name: 'Test', template: 'test' } })).toFail();
    });

    test('fails for invalid task definition', () => {
      // Missing required fields in task
      expect(inlineTask.convert({ task: { baseId: 'test' }, params: {} })).toFail();
    });
  });

  // ============================================================================
  // taskInvocation (and deprecated procedureStepTask alias)
  // ============================================================================
  describe('taskInvocation', () => {
    test('converts task reference (discriminated by taskId)', () => {
      const data = {
        taskId: 'common.melt-chocolate',
        params: { ingredient: 'chocolate' }
      };

      expect(taskInvocation.convert(data)).toSucceedAndSatisfy((result) => {
        expect('taskId' in result).toBe(true);
        if ('taskId' in result) {
          expect(result.taskId).toBe('common.melt-chocolate');
          expect(result.params).toEqual({ ingredient: 'chocolate' });
        }
      });
    });

    test('converts inline task (discriminated by task)', () => {
      const data = {
        task: {
          baseId: 'proc-step-1',
          name: 'Custom Step',
          template: 'Do something {{action}}'
        },
        params: { action: 'quickly' }
      };

      expect(taskInvocation.convert(data)).toSucceedAndSatisfy((result) => {
        expect('task' in result).toBe(true);
        if ('task' in result) {
          expect(result.task.baseId).toBe('proc-step-1');
          expect(result.task.name).toBe('Custom Step');
          expect(result.task.template).toBe('Do something {{action}}');
          expect(result.params).toEqual({ action: 'quickly' });
        }
      });
    });

    test('fails for null', () => {
      expect(taskInvocation.convert(null)).toFailWith(/invocation must/i);
    });

    test('fails for non-object', () => {
      expect(taskInvocation.convert('string')).toFailWith(/invocation must/i);
    });

    test('fails for object without task or taskId', () => {
      expect(taskInvocation.convert({})).toFailWith(/invocation must/i);
    });

    test('fails for object with other properties', () => {
      expect(taskInvocation.convert({ other: 'value' })).toFailWith(/invocation must/i);
    });
  });

  // ============================================================================
  // procedureStepTask (deprecated alias)
  // ============================================================================
  describe('procedureStepTask (deprecated)', () => {
    test('is an alias for taskInvocation', () => {
      const data = {
        taskId: 'common.melt-chocolate',
        params: { ingredient: 'chocolate' }
      };

      // Both should work identically
      expect(procedureStepTask.convert(data)).toSucceedAndSatisfy((result) => {
        expect('taskId' in result).toBe(true);
        if ('taskId' in result) {
          expect(result.taskId).toBe('common.melt-chocolate');
        }
      });
    });
  });

  // ============================================================================
  // validationBehavior
  // ============================================================================
  describe('validationBehavior', () => {
    test('converts valid behavior values', () => {
      expect(validationBehavior.convert('ignore')).toSucceedWith('ignore');
      expect(validationBehavior.convert('warn')).toSucceedWith('warn');
      expect(validationBehavior.convert('fail')).toSucceedWith('fail');
    });

    test('fails for invalid behavior', () => {
      expect(validationBehavior.convert('skip')).toFail();
      expect(validationBehavior.convert('')).toFail();
    });
  });

  // ============================================================================
  // renderOptions
  // ============================================================================
  describe('renderOptions', () => {
    test('converts valid render options with all fields', () => {
      const options = {
        onInvalidTaskRef: 'warn',
        onMissingVariables: 'fail',
        additionalContext: { key: 'value' }
      };

      expect(renderOptions.convert(options)).toSucceedAndSatisfy((result) => {
        expect(result.onInvalidTaskRef).toBe('warn');
        expect(result.onMissingVariables).toBe('fail');
        expect(result.additionalContext).toEqual({ key: 'value' });
      });
    });

    test('converts empty render options', () => {
      expect(renderOptions.convert({})).toSucceedAndSatisfy((result) => {
        expect(result.onInvalidTaskRef).toBeUndefined();
        expect(result.onMissingVariables).toBeUndefined();
        expect(result.additionalContext).toBeUndefined();
      });
    });
  });
});
