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

import {
  BaseProcedureId,
  BaseTaskId,
  Celsius,
  CollectionId,
  Minutes,
  NoteCategory,
  ProcedureId,
  ProcedureType,
  TaskId
} from '../../../../packlets/common';
import {
  Fillings,
  IProcedureEntity,
  IProcedureStepEntity,
  IRawTaskEntity,
  TasksLibrary
} from '../../../../packlets/entities';
// eslint-disable-next-line @rushstack/packlets/mechanics
import {
  IProcedureContext,
  IProcedureRenderContext
} from '../../../../packlets/library-runtime/procedures/model';
import { ChocolateEntityLibrary, ChocolateLibrary } from '../../../../packlets/library-runtime';
// eslint-disable-next-line @rushstack/packlets/mechanics
import { Procedure } from '../../../../packlets/library-runtime/procedures/procedure';

describe('Procedure', () => {
  // ============================================================================
  // Test Data
  // ============================================================================

  const stubContext = {} as unknown as IProcedureContext;

  const simpleInlineStep: IProcedureStepEntity = {
    order: 1,
    task: {
      task: {
        baseId: 'inline-1' as BaseTaskId,
        name: 'Inline Task',
        template: 'Heat to {{temp}}C'
      },
      params: { temp: 45 }
    },
    activeTime: 5 as Minutes
  };

  const simpleProcedure: IProcedureEntity = {
    baseId: 'simple' as BaseProcedureId,
    name: 'Simple Procedure',
    steps: [simpleInlineStep]
  };

  const procedureWithDescription: IProcedureEntity = {
    baseId: 'with-description' as BaseProcedureId,
    name: 'Procedure With Description',
    description: 'A test procedure with description',
    steps: [simpleInlineStep]
  };

  const procedureWithCategory: IProcedureEntity = {
    baseId: 'with-category' as BaseProcedureId,
    name: 'Procedure With Category',
    category: 'ganache' as ProcedureType,
    steps: [simpleInlineStep]
  };

  const procedureWithTags: IProcedureEntity = {
    baseId: 'with-tags' as BaseProcedureId,
    name: 'Procedure With Tags',
    tags: ['test', 'basic'],
    steps: [simpleInlineStep]
  };

  const procedureWithNotes: IProcedureEntity = {
    baseId: 'with-notes' as BaseProcedureId,
    name: 'Procedure With Notes',
    notes: [
      {
        category: 'technique' as NoteCategory,
        note: 'Use a thermometer for accuracy'
      }
    ],
    steps: [simpleInlineStep]
  };

  const multiStepProcedure: IProcedureEntity = {
    baseId: 'multi-step' as BaseProcedureId,
    name: 'Multi-Step Procedure',
    steps: [
      {
        order: 1,
        task: {
          task: {
            baseId: 'step-1' as BaseTaskId,
            name: 'Step 1',
            template: 'Heat to {{temp}}C'
          },
          params: { temp: 45 }
        },
        activeTime: 5 as Minutes,
        temperature: 45 as Celsius
      },
      {
        order: 2,
        task: {
          task: {
            baseId: 'step-2' as BaseTaskId,
            name: 'Step 2',
            template: 'Cool to {{temp}}C'
          },
          params: { temp: 28 }
        },
        waitTime: 10 as Minutes,
        temperature: 28 as Celsius
      },
      {
        order: 3,
        task: {
          task: {
            baseId: 'step-3' as BaseTaskId,
            name: 'Step 3',
            template: 'Hold at {{temp}}C'
          },
          params: { temp: 31 }
        },
        holdTime: 15 as Minutes,
        temperature: 31 as Celsius
      }
    ]
  };

  const procedureWithMixedTimes: IProcedureEntity = {
    baseId: 'mixed-times' as BaseProcedureId,
    name: 'Procedure With Mixed Times',
    steps: [
      {
        order: 1,
        task: {
          task: {
            baseId: 'step-1' as BaseTaskId,
            name: 'Step 1',
            template: 'Step 1'
          },
          params: {}
        },
        activeTime: 5 as Minutes
      },
      {
        order: 2,
        task: {
          task: {
            baseId: 'step-2' as BaseTaskId,
            name: 'Step 2',
            template: 'Step 2'
          },
          params: {}
        },
        waitTime: 10 as Minutes
      },
      {
        order: 3,
        task: {
          task: {
            baseId: 'step-3' as BaseTaskId,
            name: 'Step 3',
            template: 'Step 3'
          },
          params: {}
        },
        holdTime: 15 as Minutes
      }
    ]
  };

  // Task reference test data
  const taskEntity: IRawTaskEntity = {
    baseId: 'testTask' as BaseTaskId,
    name: 'Test Task',
    template: 'Melt {{ingredient}} at {{temp}}C'
  };

  // ============================================================================
  // Tests - create
  // ============================================================================

  describe('create', () => {
    test('creates procedure from valid entity', () => {
      const id = 'test.simple' as ProcedureId;
      expect(Procedure.create(stubContext, id, simpleProcedure)).toSucceedAndSatisfy((proc) => {
        expect(proc).toBeInstanceOf(Procedure);
        expect(proc.id).toBe(id);
        expect(proc.name).toBe('Simple Procedure');
      });
    });
  });

  // ============================================================================
  // Tests - Identity Properties
  // ============================================================================

  describe('identity properties', () => {
    test('returns correct id', () => {
      const id = 'test.simple' as ProcedureId;
      const proc = Procedure.create(stubContext, id, simpleProcedure).orThrow();
      expect(proc.id).toBe(id);
    });

    test('returns correct baseId', () => {
      const id = 'test.simple' as ProcedureId;
      const proc = Procedure.create(stubContext, id, simpleProcedure).orThrow();
      expect(proc.baseId).toBe('simple');
    });
  });

  // ============================================================================
  // Tests - Core Property Accessors
  // ============================================================================

  describe('core property accessors', () => {
    test('returns name correctly', () => {
      const id = 'test.simple' as ProcedureId;
      const proc = Procedure.create(stubContext, id, simpleProcedure).orThrow();
      expect(proc.name).toBe('Simple Procedure');
    });

    test('returns description when present', () => {
      const id = 'test.with-description' as ProcedureId;
      const proc = Procedure.create(stubContext, id, procedureWithDescription).orThrow();
      expect(proc.description).toBe('A test procedure with description');
    });

    test('returns undefined description when not present', () => {
      const id = 'test.simple' as ProcedureId;
      const proc = Procedure.create(stubContext, id, simpleProcedure).orThrow();
      expect(proc.description).toBeUndefined();
    });

    test('returns category when present', () => {
      const id = 'test.with-category' as ProcedureId;
      const proc = Procedure.create(stubContext, id, procedureWithCategory).orThrow();
      expect(proc.category).toBe('ganache');
    });

    test('returns undefined category when not present', () => {
      const id = 'test.simple' as ProcedureId;
      const proc = Procedure.create(stubContext, id, simpleProcedure).orThrow();
      expect(proc.category).toBeUndefined();
    });

    test('returns steps array', () => {
      const id = 'test.multi-step' as ProcedureId;
      const proc = Procedure.create(stubContext, id, multiStepProcedure).orThrow();
      expect(proc.steps).toHaveLength(3);
      expect(proc.steps[0].order).toBe(1);
      expect(proc.steps[1].order).toBe(2);
      expect(proc.steps[2].order).toBe(3);
    });

    test('returns tags when present', () => {
      const id = 'test.with-tags' as ProcedureId;
      const proc = Procedure.create(stubContext, id, procedureWithTags).orThrow();
      expect(proc.tags).toEqual(['test', 'basic']);
    });

    test('returns undefined tags when not present', () => {
      const id = 'test.simple' as ProcedureId;
      const proc = Procedure.create(stubContext, id, simpleProcedure).orThrow();
      expect(proc.tags).toBeUndefined();
    });

    test('returns notes when present', () => {
      const id = 'test.with-notes' as ProcedureId;
      const proc = Procedure.create(stubContext, id, procedureWithNotes).orThrow();
      expect(proc.notes).toHaveLength(1);
      expect(proc.notes?.[0].category).toBe('technique');
      expect(proc.notes?.[0].note).toBe('Use a thermometer for accuracy');
    });

    test('returns undefined notes when not present', () => {
      const id = 'test.simple' as ProcedureId;
      const proc = Procedure.create(stubContext, id, simpleProcedure).orThrow();
      expect(proc.notes).toBeUndefined();
    });

    test('returns entity reference', () => {
      const id = 'test.simple' as ProcedureId;
      const proc = Procedure.create(stubContext, id, simpleProcedure).orThrow();
      expect(proc.entity).toBe(simpleProcedure);
    });
  });

  // ============================================================================
  // Tests - Computed Properties
  // ============================================================================

  describe('computed properties - timing', () => {
    test('totalActiveTime returns sum of step active times', () => {
      const id = 'test.mixed-times' as ProcedureId;
      const proc = Procedure.create(stubContext, id, procedureWithMixedTimes).orThrow();
      expect(proc.totalActiveTime).toBe(5);
    });

    test('totalActiveTime returns undefined when no active times', () => {
      const procedureNoActive: IProcedureEntity = {
        baseId: 'no-active' as BaseProcedureId,
        name: 'No Active Time',
        steps: [
          {
            order: 1,
            task: simpleInlineStep.task,
            waitTime: 10 as Minutes
          }
        ]
      };
      const id = 'test.no-active' as ProcedureId;
      const proc = Procedure.create(stubContext, id, procedureNoActive).orThrow();
      expect(proc.totalActiveTime).toBeUndefined();
    });

    test('totalWaitTime returns sum of step wait times', () => {
      const id = 'test.mixed-times' as ProcedureId;
      const proc = Procedure.create(stubContext, id, procedureWithMixedTimes).orThrow();
      expect(proc.totalWaitTime).toBe(10);
    });

    test('totalWaitTime returns undefined when no wait times', () => {
      const procedureNoWait: IProcedureEntity = {
        baseId: 'no-wait' as BaseProcedureId,
        name: 'No Wait Time',
        steps: [
          {
            order: 1,
            task: simpleInlineStep.task,
            activeTime: 5 as Minutes
          }
        ]
      };
      const id = 'test.no-wait' as ProcedureId;
      const proc = Procedure.create(stubContext, id, procedureNoWait).orThrow();
      expect(proc.totalWaitTime).toBeUndefined();
    });

    test('totalHoldTime returns sum of step hold times', () => {
      const id = 'test.mixed-times' as ProcedureId;
      const proc = Procedure.create(stubContext, id, procedureWithMixedTimes).orThrow();
      expect(proc.totalHoldTime).toBe(15);
    });

    test('totalHoldTime returns undefined when no hold times', () => {
      const procedureNoHold: IProcedureEntity = {
        baseId: 'no-hold' as BaseProcedureId,
        name: 'No Hold Time',
        steps: [
          {
            order: 1,
            task: simpleInlineStep.task,
            activeTime: 5 as Minutes
          }
        ]
      };
      const id = 'test.no-hold' as ProcedureId;
      const proc = Procedure.create(stubContext, id, procedureNoHold).orThrow();
      expect(proc.totalHoldTime).toBeUndefined();
    });

    test('totalTime returns sum of all time types', () => {
      const id = 'test.mixed-times' as ProcedureId;
      const proc = Procedure.create(stubContext, id, procedureWithMixedTimes).orThrow();
      expect(proc.totalTime).toBe(30); // 5 + 10 + 15
    });

    test('totalTime returns undefined when all times are zero', () => {
      const procedureNoTimes: IProcedureEntity = {
        baseId: 'no-times' as BaseProcedureId,
        name: 'No Times',
        steps: [
          {
            order: 1,
            task: simpleInlineStep.task
          }
        ]
      };
      const id = 'test.no-times' as ProcedureId;
      const proc = Procedure.create(stubContext, id, procedureNoTimes).orThrow();
      expect(proc.totalTime).toBeUndefined();
    });
  });

  describe('computed properties - counts and flags', () => {
    test('stepCount returns number of steps', () => {
      const id = 'test.multi-step' as ProcedureId;
      const proc = Procedure.create(stubContext, id, multiStepProcedure).orThrow();
      expect(proc.stepCount).toBe(3);
    });

    test('isCategorySpecific returns true when category is set', () => {
      const id = 'test.with-category' as ProcedureId;
      const proc = Procedure.create(stubContext, id, procedureWithCategory).orThrow();
      expect(proc.isCategorySpecific).toBe(true);
    });

    test('isCategorySpecific returns false when category is not set', () => {
      const id = 'test.simple' as ProcedureId;
      const proc = Procedure.create(stubContext, id, simpleProcedure).orThrow();
      expect(proc.isCategorySpecific).toBe(false);
    });
  });

  // ============================================================================
  // Tests - render with inline tasks
  // ============================================================================

  describe('render - inline tasks', () => {
    test('renders procedure with single inline task step', () => {
      const id = 'test.simple' as ProcedureId;
      const proc = Procedure.create(stubContext, id, simpleProcedure).orThrow();

      const renderContext: IProcedureRenderContext = {
        context: stubContext,
        recipe: {} as unknown as Fillings.IProducedFillingEntity
      };

      expect(proc.render(renderContext)).toSucceedAndSatisfy((rendered) => {
        expect(rendered.name).toBe('Simple Procedure');
        expect(rendered.steps).toHaveLength(1);
        expect(rendered.steps[0].renderedDescription).toBe('Heat to 45C');
        expect(rendered.steps[0].resolvedTask).toBeUndefined(); // Inline tasks don't have resolvedTask
      });
    });

    test('renders procedure with multiple inline task steps', () => {
      const id = 'test.multi-step' as ProcedureId;
      const proc = Procedure.create(stubContext, id, multiStepProcedure).orThrow();

      const renderContext: IProcedureRenderContext = {
        context: stubContext,
        recipe: {} as unknown as Fillings.IProducedFillingEntity
      };

      expect(proc.render(renderContext)).toSucceedAndSatisfy((rendered) => {
        expect(rendered.name).toBe('Multi-Step Procedure');
        expect(rendered.steps).toHaveLength(3);
        expect(rendered.steps[0].renderedDescription).toBe('Heat to 45C');
        expect(rendered.steps[1].renderedDescription).toBe('Cool to 28C');
        expect(rendered.steps[2].renderedDescription).toBe('Hold at 31C');
      });
    });

    test('rendered procedure includes timing totals', () => {
      const id = 'test.multi-step' as ProcedureId;
      const proc = Procedure.create(stubContext, id, multiStepProcedure).orThrow();

      const renderContext: IProcedureRenderContext = {
        context: stubContext,
        recipe: {} as unknown as Fillings.IProducedFillingEntity
      };

      expect(proc.render(renderContext)).toSucceedAndSatisfy((rendered) => {
        expect(rendered.totalActiveTime).toBe(5);
        expect(rendered.totalWaitTime).toBe(10);
        expect(rendered.totalHoldTime).toBe(15);
      });
    });

    test('rendered procedure includes description when present', () => {
      const id = 'test.with-description' as ProcedureId;
      const proc = Procedure.create(stubContext, id, procedureWithDescription).orThrow();

      const renderContext: IProcedureRenderContext = {
        context: stubContext,
        recipe: {} as unknown as Fillings.IProducedFillingEntity
      };

      expect(proc.render(renderContext)).toSucceedAndSatisfy((rendered) => {
        expect(rendered.description).toBe('A test procedure with description');
      });
    });
  });

  // ============================================================================
  // Tests - render with task references
  // ============================================================================

  describe('render - task references', () => {
    let context: IProcedureContext;

    beforeEach(() => {
      const tasks = TasksLibrary.create({
        builtin: false,
        collections: [
          {
            id: 'test' as CollectionId,
            isMutable: false,
            items: { testTask: taskEntity }
          }
        ]
      }).orThrow();

      const entityLib = ChocolateEntityLibrary.create({ libraries: { tasks } }).orThrow();
      const library = ChocolateLibrary.fromChocolateEntityLibrary(entityLib).orThrow();
      context = library;
    });

    test('renders procedure with task ref step', () => {
      const procedureWithTaskRef: IProcedureEntity = {
        baseId: 'with-task-ref' as BaseProcedureId,
        name: 'Procedure With Task Ref',
        steps: [
          {
            order: 1,
            task: {
              taskId: 'test.testTask' as TaskId,
              params: { ingredient: 'chocolate', temp: 50 }
            },
            activeTime: 5 as Minutes
          }
        ]
      };

      const id = 'test.with-task-ref' as ProcedureId;
      const proc = Procedure.create(context, id, procedureWithTaskRef).orThrow();

      const renderContext: IProcedureRenderContext = {
        context,
        recipe: {} as unknown as Fillings.IProducedFillingEntity
      };

      expect(proc.render(renderContext)).toSucceedAndSatisfy((rendered) => {
        expect(rendered.name).toBe('Procedure With Task Ref');
        expect(rendered.steps).toHaveLength(1);
        expect(rendered.steps[0].renderedDescription).toBe('Melt chocolate at 50C');
        expect(rendered.steps[0].resolvedTask).toBeDefined();
      });
    });

    test('render fails when task ref not found', () => {
      const procedureWithBadRef: IProcedureEntity = {
        baseId: 'bad-ref' as BaseProcedureId,
        name: 'Procedure With Bad Ref',
        steps: [
          {
            order: 1,
            task: {
              taskId: 'test.nonexistent' as TaskId,
              params: { ingredient: 'chocolate', temp: 50 }
            }
          }
        ]
      };

      const id = 'test.bad-ref' as ProcedureId;
      const proc = Procedure.create(context, id, procedureWithBadRef).orThrow();

      const renderContext: IProcedureRenderContext = {
        context,
        recipe: {} as unknown as Fillings.IProducedFillingEntity
      };

      expect(proc.render(renderContext)).toFailWith(/test\.nonexistent/i);
    });

    test('renders procedure with multiple task ref steps', () => {
      const anotherTaskEntity: IRawTaskEntity = {
        baseId: 'anotherTask' as BaseTaskId,
        name: 'Another Task',
        template: 'Cool {{ingredient}} to {{temp}}C'
      };

      const tasks = TasksLibrary.create({
        builtin: false,
        collections: [
          {
            id: 'test' as CollectionId,
            isMutable: false,
            items: {
              testTask: taskEntity,
              anotherTask: anotherTaskEntity
            }
          }
        ]
      }).orThrow();

      const entityLib = ChocolateEntityLibrary.create({ libraries: { tasks } }).orThrow();
      const library = ChocolateLibrary.fromChocolateEntityLibrary(entityLib).orThrow();

      const procedureWithMultipleRefs: IProcedureEntity = {
        baseId: 'multi-refs' as BaseProcedureId,
        name: 'Procedure With Multiple Refs',
        steps: [
          {
            order: 1,
            task: {
              taskId: 'test.testTask' as TaskId,
              params: { ingredient: 'chocolate', temp: 50 }
            }
          },
          {
            order: 2,
            task: {
              taskId: 'test.anotherTask' as TaskId,
              params: { ingredient: 'chocolate', temp: 28 }
            }
          }
        ]
      };

      const id = 'test.multi-refs' as ProcedureId;
      const proc = Procedure.create(library, id, procedureWithMultipleRefs).orThrow();

      const renderContext: IProcedureRenderContext = {
        context: library,
        recipe: {} as unknown as Fillings.IProducedFillingEntity
      };

      expect(proc.render(renderContext)).toSucceedAndSatisfy((rendered) => {
        expect(rendered.steps).toHaveLength(2);
        expect(rendered.steps[0].renderedDescription).toBe('Melt chocolate at 50C');
        expect(rendered.steps[1].renderedDescription).toBe('Cool chocolate to 28C');
      });
    });
  });
});
