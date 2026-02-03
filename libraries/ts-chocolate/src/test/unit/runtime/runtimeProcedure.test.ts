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
import { fail, succeed } from '@fgv/ts-utils';

import {
  BaseProcedureId,
  BaseTaskId,
  ICategorizedNote,
  Minutes,
  ProcedureId,
  TaskId
} from '../../../packlets/common';
import { IProcedure } from '../../../packlets/entities';
import { ITaskData } from '../../../packlets/entities';
import { IComputedScaledFillingRecipe, FillingCategory } from '../../../packlets/entities';
import {
  RuntimeProcedure,
  IProcedureContext,
  IRuntimeProcedureRenderContext,
  RuntimeTask
} from '../../../packlets/library-runtime';

describe('RuntimeProcedure', () => {
  // Sample task for testing (now just ITaskData, no Task class)
  const meltChocolateTaskData: ITaskData = {
    baseId: 'melt-chocolate' as BaseTaskId,
    name: 'Melt Chocolate',
    template: 'Melt {{amount}}g of chocolate at {{temp}}°C'
  };

  // Mock procedure context that can resolve tasks
  const mockContext: IProcedureContext = {
    getTask: (id: TaskId) => {
      if (id === ('common.melt-chocolate' as TaskId)) {
        return succeed(meltChocolateTaskData);
      }
      return fail(`Task not found: ${id}`);
    },
    getRuntimeTask: (id: TaskId) => {
      if (id === ('common.melt-chocolate' as TaskId)) {
        return RuntimeTask.create(mockContext, id, meltChocolateTaskData);
      }
      return fail(`Task not found: ${id}`);
    }
  };

  // Mock recipe for render context
  const mockRecipe: IComputedScaledFillingRecipe = {
    id: 'test.test-recipe' as string,
    name: 'Test Recipe',
    scaledFrom: {
      sourceVersionId: 'test.test-recipe.v1' as string,
      sourceVersion: { id: 'v1' as string, yields: { amount: 100, unit: 'g' as string } },
      yields: { amount: 100, unit: 'g' as string }
    },
    ingredients: [],
    category: 'ganache' as FillingCategory,
    procedure: 'test.test-procedure' as ProcedureId,
    targetYield: { amount: 200, unit: 'g' as string },
    scaleFactor: 2.0,
    computedIngredients: []
  } as unknown as IComputedScaledFillingRecipe;

  // Mock render context
  const mockRenderContext: IRuntimeProcedureRenderContext = {
    context: mockContext,
    recipe: mockRecipe
  };

  // Procedure with inline task
  const inlineTaskProcedure: IProcedure = {
    baseId: 'test-inline' as BaseProcedureId,
    name: 'Test Inline Procedure',
    steps: [
      {
        order: 1,
        task: {
          task: {
            baseId: 'inline-task' as BaseTaskId,
            name: 'Inline Task',
            template: 'Do something with {{item}}'
          },
          params: { item: 'chocolate' }
        },
        activeTime: 5 as Minutes
      }
    ]
  };

  // Procedure with task reference
  const taskRefProcedure: IProcedure = {
    baseId: 'test-ref' as BaseProcedureId,
    name: 'Test Ref Procedure',
    steps: [
      {
        order: 1,
        task: {
          taskId: 'common.melt-chocolate' as TaskId,
          params: { amount: 200, temp: 45 }
        },
        activeTime: 10 as Minutes
      }
    ]
  };

  // Procedure with multiple steps
  const multiStepProcedure: IProcedure = {
    baseId: 'multi-step' as BaseProcedureId,
    name: 'Multi-Step Procedure',
    description: 'A procedure with multiple steps',
    category: 'ganache' as FillingCategory,
    steps: [
      {
        order: 1,
        task: {
          taskId: 'common.melt-chocolate' as TaskId,
          params: { amount: 200, temp: 45 }
        },
        activeTime: 10 as Minutes
      },
      {
        order: 2,
        task: {
          task: {
            baseId: 'stir-task' as BaseTaskId,
            name: 'Stir',
            template: 'Stir {{times}} times'
          },
          params: { times: 20 }
        },
        activeTime: 5 as Minutes
      }
    ],
    tags: ['multi', 'test'],
    notes: [{ category: 'user', note: 'Test notes' }] as ICategorizedNote[]
  };

  // Procedure with all timing types (wait and hold)
  const allTimingProcedure: IProcedure = {
    baseId: 'all-timing' as BaseProcedureId,
    name: 'All Timing Procedure',
    steps: [
      {
        order: 1,
        task: {
          task: {
            baseId: 'wait-task' as BaseTaskId,
            name: 'Wait Task',
            template: 'Wait for cooling'
          },
          params: {}
        },
        activeTime: 5 as Minutes,
        waitTime: 10 as Minutes,
        holdTime: 2 as Minutes
      }
    ]
  };

  // Procedure with no timing data at all
  const noTimingProcedure: IProcedure = {
    baseId: 'no-timing' as BaseProcedureId,
    name: 'No Timing Procedure',
    steps: [
      {
        order: 1,
        task: {
          task: {
            baseId: 'simple-task' as BaseTaskId,
            name: 'Simple Task',
            template: 'Do something'
          },
          params: {}
        }
        // No activeTime, waitTime, or holdTime
      }
    ]
  };

  describe('create', () => {
    test('should create RuntimeProcedure from IProcedure', () => {
      const procedureId = 'test.test-inline' as ProcedureId;

      expect(RuntimeProcedure.create(mockContext, procedureId, inlineTaskProcedure)).toSucceedAndSatisfy(
        (runtimeProcedure) => {
          expect(runtimeProcedure.id).toBe(procedureId);
          expect(runtimeProcedure.baseId).toBe('test-inline');
          expect(runtimeProcedure.name).toBe('Test Inline Procedure');
        }
      );
    });

    test('should expose all procedure properties', () => {
      const procedureId = 'test.multi-step' as ProcedureId;

      expect(RuntimeProcedure.create(mockContext, procedureId, multiStepProcedure)).toSucceedAndSatisfy(
        (runtimeProcedure) => {
          expect(runtimeProcedure.description).toBe('A procedure with multiple steps');
          expect(runtimeProcedure.category).toBe('ganache');
          expect(runtimeProcedure.steps.length).toBe(2);
          expect(runtimeProcedure.tags).toEqual(['multi', 'test']);
          expect(runtimeProcedure.notes).toEqual([{ category: 'user', note: 'Test notes' }]);
          expect(runtimeProcedure.stepCount).toBe(2);
          expect(runtimeProcedure.isCategorySpecific).toBe(true);
        }
      );
    });

    test('should compute total times', () => {
      const procedureId = 'test.multi-step' as ProcedureId;

      expect(RuntimeProcedure.create(mockContext, procedureId, multiStepProcedure)).toSucceedAndSatisfy(
        (runtimeProcedure) => {
          expect(runtimeProcedure.totalActiveTime).toBe(15);
          expect(runtimeProcedure.totalWaitTime).toBeUndefined();
          expect(runtimeProcedure.totalHoldTime).toBeUndefined();
          expect(runtimeProcedure.totalTime).toBe(15);
        }
      );
    });

    test('should compute all timing types (active, wait, hold)', () => {
      const procedureId = 'test.all-timing' as ProcedureId;

      expect(RuntimeProcedure.create(mockContext, procedureId, allTimingProcedure)).toSucceedAndSatisfy(
        (runtimeProcedure) => {
          expect(runtimeProcedure.totalActiveTime).toBe(5);
          expect(runtimeProcedure.totalWaitTime).toBe(10);
          expect(runtimeProcedure.totalHoldTime).toBe(2);
          expect(runtimeProcedure.totalTime).toBe(17); // 5 + 10 + 2
        }
      );
    });

    test('should return undefined for all times when no timing data', () => {
      const procedureId = 'test.no-timing' as ProcedureId;

      expect(RuntimeProcedure.create(mockContext, procedureId, noTimingProcedure)).toSucceedAndSatisfy(
        (runtimeProcedure) => {
          expect(runtimeProcedure.totalActiveTime).toBeUndefined();
          expect(runtimeProcedure.totalWaitTime).toBeUndefined();
          expect(runtimeProcedure.totalHoldTime).toBeUndefined();
          expect(runtimeProcedure.totalTime).toBeUndefined();
        }
      );
    });
  });

  describe('render', () => {
    test('should render inline task steps', () => {
      const procedureId = 'test.test-inline' as ProcedureId;
      const runtimeProcedure = RuntimeProcedure.create(
        mockContext,
        procedureId,
        inlineTaskProcedure
      ).orThrow();

      expect(runtimeProcedure.render(mockRenderContext)).toSucceedAndSatisfy((rendered) => {
        expect(rendered.steps.length).toBe(1);
        expect(rendered.steps[0].renderedDescription).toBe('Do something with chocolate');
        expect(rendered.steps[0].resolvedTask).toBeUndefined(); // Inline tasks don't have resolved task
      });
    });

    test('should resolve task references and render their templates', () => {
      // THIS IS THE KEY TEST - verifying that task refs are actually resolved,
      // not returned as placeholders like the data-layer Procedure.render()
      const procedureId = 'test.test-ref' as ProcedureId;
      const runtimeProcedure = RuntimeProcedure.create(mockContext, procedureId, taskRefProcedure).orThrow();

      expect(runtimeProcedure.render(mockRenderContext)).toSucceedAndSatisfy((rendered) => {
        expect(rendered.steps.length).toBe(1);
        // Actual rendered content, NOT a placeholder like '[Task: common.melt-chocolate]'
        expect(rendered.steps[0].renderedDescription).toBe('Melt 200g of chocolate at 45°C');
        // Should include the resolved RuntimeTask
        expect(rendered.steps[0].resolvedTask).toBeDefined();
        expect(rendered.steps[0].resolvedTask?.id).toBe('common.melt-chocolate');
      });
    });

    test('should render multiple steps with mixed task types', () => {
      const procedureId = 'test.multi-step' as ProcedureId;
      const runtimeProcedure = RuntimeProcedure.create(
        mockContext,
        procedureId,
        multiStepProcedure
      ).orThrow();

      expect(runtimeProcedure.render(mockRenderContext)).toSucceedAndSatisfy((rendered) => {
        expect(rendered.name).toBe('Multi-Step Procedure');
        expect(rendered.description).toBe('A procedure with multiple steps');
        expect(rendered.steps.length).toBe(2);

        // First step: task reference
        expect(rendered.steps[0].renderedDescription).toBe('Melt 200g of chocolate at 45°C');
        expect(rendered.steps[0].resolvedTask).toBeDefined();

        // Second step: inline task
        expect(rendered.steps[1].renderedDescription).toBe('Stir 20 times');
        expect(rendered.steps[1].resolvedTask).toBeUndefined();

        // Total times should be computed
        expect(rendered.totalActiveTime).toBe(15);
      });
    });

    test('should fail when task reference cannot be resolved', () => {
      const unknownRefProcedure: IProcedure = {
        baseId: 'test-unknown' as BaseProcedureId,
        name: 'Unknown Ref',
        steps: [
          {
            order: 1,
            task: {
              taskId: 'unknown.task' as TaskId,
              params: {}
            }
          }
        ]
      };

      const procedureId = 'test.test-unknown' as ProcedureId;
      const runtimeProcedure = RuntimeProcedure.create(
        mockContext,
        procedureId,
        unknownRefProcedure
      ).orThrow();

      expect(runtimeProcedure.render(mockRenderContext)).toFailWith(/unknown\.task.*not found/i);
    });
  });

  describe('raw', () => {
    test('should expose underlying IProcedure', () => {
      const procedureId = 'test.test-inline' as ProcedureId;
      const runtimeProcedure = RuntimeProcedure.create(
        mockContext,
        procedureId,
        inlineTaskProcedure
      ).orThrow();

      expect(runtimeProcedure.raw).toBe(inlineTaskProcedure);
    });
  });
});
