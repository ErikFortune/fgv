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

// Mock ESM-only module before imports
jest.mock('@inquirer/prompts', () => ({
  search: jest.fn()
}));

import '@fgv/ts-utils-jest';
import { succeed, fail } from '@fgv/ts-utils';
import { Entities, ProcedureId, TaskId } from '@fgv/ts-chocolate';

import { formatProcedureHuman } from '../../../../commands/procedure/showCommand';

// ============================================================================
// Test Data Helpers
// ============================================================================

function createTaskRefStep(
  order: number,
  taskId: string,
  params?: Record<string, unknown>,
  overrides?: Record<string, unknown>
): Entities.Procedures.IProcedureStepEntity {
  return {
    order,
    task: {
      taskId: taskId as TaskId,
      params: params ?? {}
    },
    ...overrides
  } as unknown as Entities.Procedures.IProcedureStepEntity;
}

function createInlineTaskStep(
  order: number,
  template: string,
  params?: Record<string, unknown>,
  overrides?: Record<string, unknown>
): Entities.Procedures.IProcedureStepEntity {
  return {
    order,
    task: {
      task: {
        baseId: 'inline',
        name: 'Inline Task',
        template
      },
      params: params ?? {}
    },
    ...overrides
  } as unknown as Entities.Procedures.IProcedureStepEntity;
}

function createProcedure(overrides?: Record<string, unknown>): Entities.Procedures.IProcedureEntity {
  return {
    baseId: 'make-ganache',
    name: 'Make Ganache',
    steps: [
      createTaskRefStep(1, 'coll.heat-cream', { temperature: 85 }),
      createTaskRefStep(2, 'coll.pour-chocolate'),
      createTaskRefStep(3, 'coll.emulsify')
    ],
    ...overrides
  } as unknown as Entities.Procedures.IProcedureEntity;
}

function createMockTasksLibrary(
  tasks: Record<string, { template: string; defaults?: Record<string, unknown> }>
): Entities.Tasks.TasksLibrary {
  return {
    get(id: TaskId) {
      const key = id as string;
      if (tasks[key]) {
        return succeed({
          baseId: key.split('.')[1],
          name: key,
          template: tasks[key].template,
          defaults: tasks[key].defaults
        } as unknown as Entities.Tasks.IRawTaskEntity);
      }
      return fail(`Task ${id} not found`);
    }
  } as unknown as Entities.Tasks.TasksLibrary;
}

// ============================================================================
// Tests
// ============================================================================

describe('formatProcedureHuman', () => {
  test('formats basic procedure', () => {
    const procedure = createProcedure();
    const output = formatProcedureHuman(procedure, 'coll.make-ganache' as ProcedureId);
    expect(output).toContain('Procedure: Make Ganache');
    expect(output).toContain('ID: coll.make-ganache');
    expect(output).toContain('Steps (3):');
  });

  test('formats procedure with category', () => {
    const procedure = createProcedure({ category: 'ganache' });
    const output = formatProcedureHuman(procedure, 'coll.make-ganache' as ProcedureId);
    expect(output).toContain('Category: ganache');
  });

  test('formats procedure with description', () => {
    const procedure = createProcedure({ description: 'Standard ganache preparation' });
    const output = formatProcedureHuman(procedure, 'coll.make-ganache' as ProcedureId);
    expect(output).toContain('Description: Standard ganache preparation');
  });

  test('formats procedure with tags', () => {
    const procedure = createProcedure({ tags: ['ganache', 'basic'] });
    const output = formatProcedureHuman(procedure, 'coll.make-ganache' as ProcedureId);
    expect(output).toContain('Tags: ganache, basic');
  });

  test('formats procedure with notes', () => {
    const procedure = createProcedure({ notes: 'Always use fresh cream' });
    const output = formatProcedureHuman(procedure, 'coll.make-ganache' as ProcedureId);
    expect(output).toContain('Notes: Always use fresh cream');
  });

  test('shows task ID when no tasks library provided', () => {
    const procedure = createProcedure();
    const output = formatProcedureHuman(procedure, 'coll.make-ganache' as ProcedureId);
    expect(output).toContain('Task: coll.heat-cream');
    expect(output).toContain('Task: coll.pour-chocolate');
    expect(output).toContain('Task: coll.emulsify');
  });

  test('shows task template when tasks library provided without context', () => {
    const procedure = createProcedure();
    const tasksLibrary = createMockTasksLibrary({
      /* eslint-disable @typescript-eslint/naming-convention */
      'coll.heat-cream': { template: 'Heat {{amount}}g cream to {{temperature}}°C' },
      'coll.pour-chocolate': { template: 'Pour over chopped chocolate' },
      'coll.emulsify': { template: 'Emulsify with immersion blender' }
      /* eslint-enable @typescript-eslint/naming-convention */
    });
    const output = formatProcedureHuman(procedure, 'coll.make-ganache' as ProcedureId, tasksLibrary);
    expect(output).toContain('Heat {{amount}}g cream to {{temperature}}°C');
    expect(output).toContain('Pour over chopped chocolate');
    expect(output).toContain('Emulsify with immersion blender');
  });

  test('renders task templates when context provided', () => {
    const procedure = createProcedure({
      steps: [createTaskRefStep(1, 'coll.heat-cream', { temperature: 85 })]
    });
    const tasksLibrary = createMockTasksLibrary({
      // eslint-disable-next-line @typescript-eslint/naming-convention
      'coll.heat-cream': {
        template: 'Heat {{amount}}g cream to {{temperature}}°C',
        defaults: { amount: 200 }
      }
    });
    const context = { amount: 300 };
    const output = formatProcedureHuman(procedure, 'coll.make-ganache' as ProcedureId, tasksLibrary, context);
    expect(output).toContain('Heat 300g cream to 85°C');
  });

  test('shows task not found message', () => {
    const procedure = createProcedure({
      steps: [createTaskRefStep(1, 'coll.nonexistent')]
    });
    const tasksLibrary = createMockTasksLibrary({});
    const output = formatProcedureHuman(procedure, 'coll.make-ganache' as ProcedureId, tasksLibrary);
    expect(output).toContain('[Task not found: coll.nonexistent]');
  });

  test('formats inline task steps', () => {
    const procedure = createProcedure({
      steps: [createInlineTaskStep(1, 'Combine all ingredients in bowl')]
    });
    const output = formatProcedureHuman(procedure, 'coll.make-ganache' as ProcedureId);
    expect(output).toContain('Combine all ingredients in bowl');
  });

  test('renders inline task with context', () => {
    const procedure = createProcedure({
      steps: [createInlineTaskStep(1, 'Heat to {{temperature}}°C', { temperature: 85 })]
    });
    const output = formatProcedureHuman(procedure, 'coll.make-ganache' as ProcedureId, undefined, {
      temperature: 90
    });
    expect(output).toContain('Heat to 90°C');
  });

  test('formats step time details', () => {
    const procedure = createProcedure({
      steps: [
        createTaskRefStep(
          1,
          'coll.heat-cream',
          {},
          {
            activeTime: 5,
            waitTime: 10,
            holdTime: 3,
            temperature: 85
          }
        )
      ]
    });
    const output = formatProcedureHuman(procedure, 'coll.make-ganache' as ProcedureId);
    expect(output).toContain('active: 5min');
    expect(output).toContain('wait: 10min');
    expect(output).toContain('hold: 3min');
    expect(output).toContain('temp: 85°C');
  });

  test('formats step notes', () => {
    const procedure = createProcedure({
      steps: [
        createTaskRefStep(
          1,
          'coll.heat-cream',
          {},
          {
            notes: 'Use a thermometer'
          }
        )
      ]
    });
    const output = formatProcedureHuman(procedure, 'coll.make-ganache' as ProcedureId);
    expect(output).toContain('Note: Use a thermometer');
  });
});
