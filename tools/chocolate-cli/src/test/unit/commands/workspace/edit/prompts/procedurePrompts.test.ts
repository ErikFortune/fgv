/*
 * MIT License
 *
 * Copyright (c) 2025 Erik Fortune
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

// Mock the shared module (which wraps @inquirer/prompts + chalk)
const mockPromptInput = jest.fn();
const mockConfirmAction = jest.fn();
const mockShowMenu = jest.fn();
jest.mock('../../../../../../commands/workspace/shared', () => ({
  promptInput: mockPromptInput,
  confirmAction: mockConfirmAction,
  showMenu: mockShowMenu,
  showInfo: jest.fn(),
  showSuccess: jest.fn(),
  showError: jest.fn(),
  showWarning: jest.fn()
}));

import '@fgv/ts-utils-jest';
import type { Entities, BaseProcedureId, NoteCategory, TaskId } from '@fgv/ts-chocolate';
import {
  promptNewProcedure,
  promptEditProcedure
} from '../../../../../../commands/workspace/edit/prompts/procedurePrompts';
import { createResponder } from './helpers/promptTestHelper';
import type { IMockSharedPrompts } from './helpers/promptTestHelper';

const mocks: IMockSharedPrompts = {
  promptInput: mockPromptInput,
  confirmAction: mockConfirmAction,
  showMenu: mockShowMenu
};

// ============================================================================
// promptNewProcedure Tests
// ============================================================================

describe('promptNewProcedure', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('success scenarios', () => {
    test('should create procedure with name, auto-generated baseId, no category, one reference step, no timings', async () => {
      createResponder()
        .onInput(/^Procedure name/i, 'Make Ganache')
        .onInput(/^Base ID/i, '')
        .onInput(/^Description/i, 'A delicious ganache procedure')
        .onInput(/^Task ID/i, 'common.heat-chocolate')
        .onConfirm(/^Set a category/i, false)
        .onConfirm(/^Add step 1/i, true)
        .onConfirm(/^Add task param/i, false)
        .onConfirm(/^Add timing/i, false)
        .onConfirm(/^Add step 2/i, false)
        .onMenu(/Task type/i, 'reference')
        .install(mocks);

      expect(await promptNewProcedure()).toSucceedAndSatisfy((entity) => {
        expect(entity.name).toBe('Make Ganache');
        expect(entity.baseId).toBe('make-ganache');
        expect(entity.description).toBe('A delicious ganache procedure');
        expect(entity.category).toBeUndefined();
        expect(entity.steps).toHaveLength(1);
        expect(entity.steps[0]).toEqual(
          expect.objectContaining({
            order: 1,
            task: { taskId: 'common.heat-chocolate', params: {} }
          })
        );
      });
    });

    test('should create procedure with explicit baseId', async () => {
      createResponder()
        .onInput(/^Procedure name/i, 'Make Ganache')
        .onInput(/^Base ID/i, 'custom-ganache-id')
        .onInput(/^Description/i, '')
        .onConfirm(/^Set a category/i, false)
        .onConfirm(/^Add step 1/i, false)
        .install(mocks);

      expect(await promptNewProcedure()).toSucceedAndSatisfy((entity) => {
        expect(entity.name).toBe('Make Ganache');
        expect(entity.baseId).toBe('custom-ganache-id');
        expect(entity.steps).toHaveLength(0);
      });
    });

    test('should create procedure with a category selected', async () => {
      createResponder()
        .onInput(/^Procedure name/i, 'Make Ganache')
        .onInput(/^Base ID/i, '')
        .onInput(/^Description/i, '')
        .onConfirm(/^Set a category/i, true)
        .onConfirm(/^Add step 1/i, false)
        .onMenu(/^Select procedure category/i, 'ganache')
        .install(mocks);

      expect(await promptNewProcedure()).toSucceedAndSatisfy((entity) => {
        expect(entity.category).toBe('ganache');
      });
    });

    test('should create procedure with inline task step', async () => {
      createResponder()
        .onInput(/^Procedure name/i, 'Make Ganache')
        .onInput(/^Base ID/i, '')
        .onInput(/^Description/i, '')
        .onInput(/^Task name/i, 'Heat Chocolate')
        .onInput(/^Task base ID/i, '')
        .onInput(/^Task template/i, 'Heat chocolate to {{temperature}}')
        .onConfirm(/^Set a category/i, false)
        .onConfirm(/^Add step 1/i, true)
        .onConfirm(/^Add task param/i, false)
        .onConfirm(/^Add timing/i, false)
        .onConfirm(/^Add step 2/i, false)
        .onMenu(/Task type/i, 'inline')
        .install(mocks);

      expect(await promptNewProcedure()).toSucceedAndSatisfy((entity) => {
        expect(entity.steps).toHaveLength(1);
        expect(entity.steps[0]).toEqual(
          expect.objectContaining({
            order: 1,
            task: {
              task: {
                baseId: 'heat-chocolate',
                name: 'Heat Chocolate',
                template: 'Heat chocolate to {{temperature}}'
              },
              params: {}
            }
          })
        );
      });
    });

    test('should create procedure with step that has task params', async () => {
      // For params loop, we need sequential mock since same message repeats
      const responder = createResponder()
        .onInput(/^Procedure name/i, 'Make Ganache')
        .onInput(/^Base ID/i, '')
        .onInput(/^Description/i, '')
        .onInput(/^Task ID/i, 'common.heat-chocolate')
        .onConfirm(/^Set a category/i, false)
        .onConfirm(/^Add step 1/i, true)
        .onConfirm(/^Add task param/i, true)
        .onConfirm(/^Add timing/i, false)
        .onConfirm(/^Add step 2/i, false)
        .onMenu(/Task type/i, 'reference');
      responder.install(mocks);

      // Parameter loop needs sequential mocks since message is identical each time
      let paramCallCount = 0;
      const paramResponses = ['temperature=45', ''];
      const originalImpl = mockPromptInput.getMockImplementation();
      mockPromptInput.mockImplementation((message: string, defaultValue?: string) => {
        if (/^Parameter/i.test(message)) {
          return Promise.resolve(paramResponses[paramCallCount++] ?? '');
        }
        return originalImpl!(message, defaultValue);
      });

      expect(await promptNewProcedure()).toSucceedAndSatisfy((entity) => {
        expect(entity.steps).toHaveLength(1);
        expect(entity.steps[0]).toEqual(
          expect.objectContaining({
            order: 1,
            task: { taskId: 'common.heat-chocolate', params: { temperature: '45' } }
          })
        );
      });
    });

    test('should create procedure with step timings', async () => {
      createResponder()
        .onInput(/^Procedure name/i, 'Make Ganache')
        .onInput(/^Base ID/i, '')
        .onInput(/^Description/i, '')
        .onInput(/^Task ID/i, 'common.heat-chocolate')
        .onInput(/^Active time/i, '10')
        .onInput(/^Wait time/i, '20')
        .onInput(/^Hold time/i, '30')
        .onInput(/^Temperature/i, '45')
        .onConfirm(/^Set a category/i, false)
        .onConfirm(/^Add step 1/i, true)
        .onConfirm(/^Add task param/i, false)
        .onConfirm(/^Add timing/i, true)
        .onConfirm(/^Add step 2/i, false)
        .onMenu(/Task type/i, 'reference')
        .install(mocks);

      expect(await promptNewProcedure()).toSucceedAndSatisfy((entity) => {
        expect(entity.steps).toHaveLength(1);
        expect(entity.steps[0]).toEqual(
          expect.objectContaining({
            order: 1,
            task: { taskId: 'common.heat-chocolate', params: {} },
            activeTime: 10,
            waitTime: 20,
            holdTime: 30,
            temperature: 45
          })
        );
      });
    });

    test('should create procedure with no steps when user declines immediately', async () => {
      createResponder()
        .onInput(/^Procedure name/i, 'Make Ganache')
        .onInput(/^Base ID/i, '')
        .onInput(/^Description/i, '')
        .onConfirm(/^Set a category/i, false)
        .onConfirm(/^Add step 1/i, false)
        .install(mocks);

      expect(await promptNewProcedure()).toSucceedAndSatisfy((entity) => {
        expect(entity.name).toBe('Make Ganache');
        expect(entity.steps).toHaveLength(0);
      });
    });

    test('should create procedure with multiple steps', async () => {
      createResponder()
        .onInput(/^Procedure name/i, 'Make Ganache')
        .onInput(/^Base ID/i, '')
        .onInput(/^Description/i, '')
        .onConfirm(/^Set a category/i, false)
        .onConfirm(/^Add step [12]/i, true)
        .onConfirm(/^Add step 3/i, false)
        .onConfirm(/^Add task param/i, false)
        .onConfirm(/^Add timing/i, false)
        .onMenu(/Task type/i, 'reference')
        .install(mocks);

      // Task ID is called twice with same message, need sequential
      let taskIdCallCount = 0;
      const taskIds = ['common.heat-chocolate', 'common.mix-ingredients'];
      const originalImpl = mockPromptInput.getMockImplementation();
      mockPromptInput.mockImplementation((message: string, defaultValue?: string) => {
        if (/^Task ID/i.test(message)) {
          return Promise.resolve(taskIds[taskIdCallCount++] ?? '');
        }
        return originalImpl!(message, defaultValue);
      });

      expect(await promptNewProcedure()).toSucceedAndSatisfy((entity) => {
        expect(entity.steps).toHaveLength(2);
        expect(entity.steps[0]).toEqual(
          expect.objectContaining({ order: 1, task: { taskId: 'common.heat-chocolate', params: {} } })
        );
        expect(entity.steps[1]).toEqual(
          expect.objectContaining({ order: 2, task: { taskId: 'common.mix-ingredients', params: {} } })
        );
      });
    });

    test('should create procedure with inline task with explicit baseTaskId', async () => {
      createResponder()
        .onInput(/^Procedure name/i, 'Make Ganache')
        .onInput(/^Base ID/i, '')
        .onInput(/^Description/i, '')
        .onInput(/^Task name/i, 'Heat Chocolate')
        .onInput(/^Task base ID/i, 'custom-heat-id')
        .onInput(/^Task template/i, 'Heat to temp')
        .onConfirm(/^Set a category/i, false)
        .onConfirm(/^Add step 1/i, true)
        .onConfirm(/^Add task param/i, false)
        .onConfirm(/^Add timing/i, false)
        .onConfirm(/^Add step 2/i, false)
        .onMenu(/Task type/i, 'inline')
        .install(mocks);

      expect(await promptNewProcedure()).toSucceedAndSatisfy((entity) => {
        expect(entity.steps[0]).toEqual(
          expect.objectContaining({
            order: 1,
            task: {
              task: {
                baseId: 'custom-heat-id',
                name: 'Heat Chocolate',
                template: 'Heat to temp'
              },
              params: {}
            }
          })
        );
      });
    });

    test('should create procedure with category set to none', async () => {
      createResponder()
        .onInput(/^Procedure name/i, 'Make Ganache')
        .onInput(/^Base ID/i, '')
        .onInput(/^Description/i, '')
        .onConfirm(/^Set a category/i, true)
        .onConfirm(/^Add step 1/i, false)
        .onMenu(/^Select procedure category/i, undefined)
        .install(mocks);

      expect(await promptNewProcedure()).toSucceedAndSatisfy((entity) => {
        expect(entity.category).toBeUndefined();
      });
    });

    test('should create procedure with multiple task params', async () => {
      const responder = createResponder()
        .onInput(/^Procedure name/i, 'Make Ganache')
        .onInput(/^Base ID/i, '')
        .onInput(/^Description/i, '')
        .onInput(/^Task ID/i, 'common.heat-chocolate')
        .onConfirm(/^Set a category/i, false)
        .onConfirm(/^Add step 1/i, true)
        .onConfirm(/^Add task param/i, true)
        .onConfirm(/^Add timing/i, false)
        .onConfirm(/^Add step 2/i, false)
        .onMenu(/Task type/i, 'reference');
      responder.install(mocks);

      let paramCallCount = 0;
      const paramResponses = ['temperature=45', 'time=10', ''];
      const originalImpl = mockPromptInput.getMockImplementation();
      mockPromptInput.mockImplementation((message: string, defaultValue?: string) => {
        if (/^Parameter/i.test(message)) {
          return Promise.resolve(paramResponses[paramCallCount++] ?? '');
        }
        return originalImpl!(message, defaultValue);
      });

      expect(await promptNewProcedure()).toSucceedAndSatisfy((entity) => {
        expect(entity.steps[0]).toEqual(
          expect.objectContaining({
            task: { taskId: 'common.heat-chocolate', params: { temperature: '45', time: '10' } }
          })
        );
      });
    });

    test('should create procedure with step that has only some timing values', async () => {
      createResponder()
        .onInput(/^Procedure name/i, 'Make Ganache')
        .onInput(/^Base ID/i, '')
        .onInput(/^Description/i, '')
        .onInput(/^Task ID/i, 'common.heat-chocolate')
        .onInput(/^Active time/i, '10')
        .onInput(/^Wait time/i, '')
        .onInput(/^Hold time/i, '')
        .onInput(/^Temperature/i, '')
        .onConfirm(/^Set a category/i, false)
        .onConfirm(/^Add step 1/i, true)
        .onConfirm(/^Add task param/i, false)
        .onConfirm(/^Add timing/i, true)
        .onConfirm(/^Add step 2/i, false)
        .onMenu(/Task type/i, 'reference')
        .install(mocks);

      expect(await promptNewProcedure()).toSucceedAndSatisfy((entity) => {
        const step = entity.steps[0];
        expect(step.activeTime).toBe(10);
        expect(step.waitTime).toBeUndefined();
        expect(step.holdTime).toBeUndefined();
        expect(step.temperature).toBeUndefined();
      });
    });
  });

  describe('failure scenarios', () => {
    test('should return failure for empty name', async () => {
      createResponder()
        .onInput(/^Procedure name/i, '')
        .install(mocks);

      expect(await promptNewProcedure()).toFailWith(/name.*required/i);
    });

    test('should return failure for empty template in inline task', async () => {
      createResponder()
        .onInput(/^Procedure name/i, 'Make Ganache')
        .onInput(/^Base ID/i, '')
        .onInput(/^Description/i, '')
        .onInput(/^Task name/i, 'Heat Chocolate')
        .onInput(/^Task base ID/i, '')
        .onInput(/^Task template/i, '')
        .onConfirm(/^Set a category/i, false)
        .onConfirm(/^Add step 1/i, true)
        .onMenu(/Task type/i, 'inline')
        .install(mocks);

      expect(await promptNewProcedure()).toFailWith(/template.*required/i);
    });

    test('should return failure for empty task ID in reference step', async () => {
      createResponder()
        .onInput(/^Procedure name/i, 'Make Ganache')
        .onInput(/^Base ID/i, '')
        .onInput(/^Description/i, '')
        .onInput(/^Task ID/i, '')
        .onConfirm(/^Set a category/i, false)
        .onConfirm(/^Add step 1/i, true)
        .onMenu(/Task type/i, 'reference')
        .install(mocks);

      expect(await promptNewProcedure()).toFailWith(/task id.*required/i);
    });

    test('should return failure for invalid param format (not key=value)', async () => {
      const responder = createResponder()
        .onInput(/^Procedure name/i, 'Make Ganache')
        .onInput(/^Base ID/i, '')
        .onInput(/^Description/i, '')
        .onInput(/^Task ID/i, 'common.heat-chocolate')
        .onInput(/^Parameter/i, 'invalid-param-no-equals')
        .onConfirm(/^Set a category/i, false)
        .onConfirm(/^Add step 1/i, true)
        .onConfirm(/^Add task param/i, true)
        .onMenu(/Task type/i, 'reference');
      responder.install(mocks);

      expect(await promptNewProcedure()).toFailWith(/param.*key=value/i);
    });

    test('should return failure for negative active time', async () => {
      createResponder()
        .onInput(/^Procedure name/i, 'Make Ganache')
        .onInput(/^Base ID/i, '')
        .onInput(/^Description/i, '')
        .onInput(/^Task ID/i, 'common.heat-chocolate')
        .onInput(/^Active time/i, '-10')
        .onConfirm(/^Set a category/i, false)
        .onConfirm(/^Add step 1/i, true)
        .onConfirm(/^Add task param/i, false)
        .onConfirm(/^Add timing/i, true)
        .onMenu(/Task type/i, 'reference')
        .install(mocks);

      expect(await promptNewProcedure()).toFailWith(/non-negative/i);
    });

    test('should return failure when category selection is cancelled', async () => {
      createResponder()
        .onInput(/^Procedure name/i, 'Make Ganache')
        .onInput(/^Base ID/i, '')
        .onInput(/^Description/i, '')
        .onConfirm(/^Set a category/i, true)
        .onMenuBack(/^Select procedure category/i)
        .install(mocks);

      expect(await promptNewProcedure()).toFailWith(/cancel/i);
    });

    test('should return failure when task type selection is cancelled', async () => {
      createResponder()
        .onInput(/^Procedure name/i, 'Make Ganache')
        .onInput(/^Base ID/i, '')
        .onInput(/^Description/i, '')
        .onConfirm(/^Set a category/i, false)
        .onConfirm(/^Add step 1/i, true)
        .onMenuBack(/Task type/i)
        .install(mocks);

      expect(await promptNewProcedure()).toFailWith(/cancel/i);
    });

    test('should return failure for invalid baseId', async () => {
      createResponder()
        .onInput(/^Procedure name/i, 'Make Ganache')
        .onInput(/^Base ID/i, 'invalid.with.dots')
        .install(mocks);

      expect(await promptNewProcedure()).toFailWith(/invalid base id/i);
    });

    test('should return failure for invalid baseTaskId in inline task', async () => {
      createResponder()
        .onInput(/^Procedure name/i, 'Make Ganache')
        .onInput(/^Base ID/i, '')
        .onInput(/^Description/i, '')
        .onInput(/^Task name/i, 'Heat Chocolate')
        .onInput(/^Task base ID/i, 'invalid.task.id')
        .onConfirm(/^Set a category/i, false)
        .onConfirm(/^Add step 1/i, true)
        .onMenu(/Task type/i, 'inline')
        .install(mocks);

      expect(await promptNewProcedure()).toFailWith(/invalid base task id/i);
    });

    test('should return failure for non-numeric active time', async () => {
      createResponder()
        .onInput(/^Procedure name/i, 'Make Ganache')
        .onInput(/^Base ID/i, '')
        .onInput(/^Description/i, '')
        .onInput(/^Task ID/i, 'common.heat-chocolate')
        .onInput(/^Active time/i, 'not-a-number')
        .onConfirm(/^Set a category/i, false)
        .onConfirm(/^Add step 1/i, true)
        .onConfirm(/^Add task param/i, false)
        .onConfirm(/^Add timing/i, true)
        .onMenu(/Task type/i, 'reference')
        .install(mocks);

      expect(await promptNewProcedure()).toFailWith(/non-negative number/i);
    });

    test('should return failure for negative wait time', async () => {
      createResponder()
        .onInput(/^Procedure name/i, 'Make Ganache')
        .onInput(/^Base ID/i, '')
        .onInput(/^Description/i, '')
        .onInput(/^Task ID/i, 'common.heat-chocolate')
        .onInput(/^Active time/i, '10')
        .onInput(/^Wait time/i, '-5')
        .onConfirm(/^Set a category/i, false)
        .onConfirm(/^Add step 1/i, true)
        .onConfirm(/^Add task param/i, false)
        .onConfirm(/^Add timing/i, true)
        .onMenu(/Task type/i, 'reference')
        .install(mocks);

      expect(await promptNewProcedure()).toFailWith(/non-negative/i);
    });

    test('should return failure for negative hold time', async () => {
      createResponder()
        .onInput(/^Procedure name/i, 'Make Ganache')
        .onInput(/^Base ID/i, '')
        .onInput(/^Description/i, '')
        .onInput(/^Task ID/i, 'common.heat-chocolate')
        .onInput(/^Active time/i, '10')
        .onInput(/^Wait time/i, '5')
        .onInput(/^Hold time/i, '-3')
        .onConfirm(/^Set a category/i, false)
        .onConfirm(/^Add step 1/i, true)
        .onConfirm(/^Add task param/i, false)
        .onConfirm(/^Add timing/i, true)
        .onMenu(/Task type/i, 'reference')
        .install(mocks);

      expect(await promptNewProcedure()).toFailWith(/non-negative/i);
    });
  });
});

// ============================================================================
// promptEditProcedure Tests
// ============================================================================

describe('promptEditProcedure', () => {
  const baseExisting: Entities.Procedures.IProcedureEntity = {
    baseId: 'original-ganache' as unknown as BaseProcedureId,
    name: 'Original Ganache',
    description: 'Original description',
    category: 'ganache',
    steps: [
      {
        order: 1,
        task: { taskId: 'common.heat-chocolate' as unknown as TaskId, params: {} }
      }
    ],
    notes: [{ category: 'general' as unknown as NoteCategory, note: 'Original note' }],
    tags: ['original-tag']
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('success scenarios', () => {
    test('should edit procedure name and description with no new steps', async () => {
      createResponder()
        .onInput(/^Procedure name/i, 'Updated Ganache')
        .onInput(/^Description/i, 'Updated description')
        .onConfirm(/category/i, false)
        .onConfirm(/^Add new steps/i, false)
        .install(mocks);

      expect(await promptEditProcedure(baseExisting)).toSucceedAndSatisfy((entity) => {
        expect(entity.name).toBe('Updated Ganache');
        expect(entity.description).toBe('Updated description');
        expect(entity.steps).toHaveLength(1);
      });
    });

    test('should preserve existing steps, notes, and tags', async () => {
      createResponder()
        .onInput(/^Procedure name/i, 'Updated Ganache')
        .onInput(/^Description/i, 'Updated description')
        .onConfirm(/category/i, false)
        .onConfirm(/^Add new steps/i, false)
        .install(mocks);

      expect(await promptEditProcedure(baseExisting)).toSucceedAndSatisfy((entity) => {
        expect(entity.notes).toEqual([{ category: 'general', note: 'Original note' }]);
        expect(entity.tags).toEqual(['original-tag']);
        expect(entity.steps).toHaveLength(1);
      });
    });

    test('should add new steps to existing steps', async () => {
      createResponder()
        .onInput(/^Procedure name/i, 'Updated Ganache')
        .onInput(/^Description/i, 'Updated description')
        .onInput(/^Task ID/i, 'common.mix-ingredients')
        .onConfirm(/category/i, false)
        .onConfirm(/^Add new steps/i, true)
        .onConfirm(/^Add step 2/i, true)
        .onConfirm(/^Add task param/i, false)
        .onConfirm(/^Add timing/i, false)
        .onConfirm(/^Add step 3/i, false)
        .onMenu(/Task type/i, 'reference')
        .install(mocks);

      expect(await promptEditProcedure(baseExisting)).toSucceedAndSatisfy((entity) => {
        expect(entity.steps).toHaveLength(2);
        expect(entity.steps[0]).toEqual(expect.objectContaining({ order: 1 }));
        expect(entity.steps[1]).toEqual(
          expect.objectContaining({
            order: 2,
            task: { taskId: 'common.mix-ingredients', params: {} }
          })
        );
      });
    });

    test('should edit category when confirmed', async () => {
      createResponder()
        .onInput(/^Procedure name/i, 'Updated Ganache')
        .onInput(/^Description/i, 'Updated description')
        .onConfirm(/category/i, true)
        .onConfirm(/^Add new steps/i, false)
        .onMenu(/^Select procedure category/i, 'caramel')
        .install(mocks);

      expect(await promptEditProcedure(baseExisting)).toSucceedAndSatisfy((entity) => {
        expect(entity.category).toBe('caramel');
      });
    });

    test('should preserve existing category when not editing', async () => {
      createResponder()
        .onInput(/^Procedure name/i, 'Updated Ganache')
        .onInput(/^Description/i, 'Updated description')
        .onConfirm(/category/i, false)
        .onConfirm(/^Add new steps/i, false)
        .install(mocks);

      expect(await promptEditProcedure(baseExisting)).toSucceedAndSatisfy((entity) => {
        expect(entity.category).toBe('ganache');
      });
    });

    test('should handle existing procedure with no category', async () => {
      const noCategoryExisting: Entities.Procedures.IProcedureEntity = {
        ...baseExisting,
        category: undefined
      };

      createResponder()
        .onInput(/^Procedure name/i, 'Updated Ganache')
        .onInput(/^Description/i, '')
        .onConfirm(/category/i, false)
        .onConfirm(/^Add new steps/i, false)
        .install(mocks);

      expect(await promptEditProcedure(noCategoryExisting)).toSucceedAndSatisfy((entity) => {
        expect(entity.category).toBeUndefined();
      });
    });

    test('should handle existing procedure with no steps', async () => {
      const noStepsExisting: Entities.Procedures.IProcedureEntity = {
        ...baseExisting,
        steps: []
      };

      createResponder()
        .onInput(/^Procedure name/i, 'Updated Ganache')
        .onInput(/^Description/i, '')
        .onInput(/^Task ID/i, 'common.heat-chocolate')
        .onConfirm(/category/i, false)
        .onConfirm(/^Add new steps/i, true)
        .onConfirm(/^Add step 1/i, true)
        .onConfirm(/^Add task param/i, false)
        .onConfirm(/^Add timing/i, false)
        .onConfirm(/^Add step 2/i, false)
        .onMenu(/Task type/i, 'reference')
        .install(mocks);

      expect(await promptEditProcedure(noStepsExisting)).toSucceedAndSatisfy((entity) => {
        expect(entity.steps).toHaveLength(1);
        expect(entity.steps[0]).toEqual(
          expect.objectContaining({
            order: 1,
            task: { taskId: 'common.heat-chocolate', params: {} }
          })
        );
      });
    });

    test('should handle existing procedure with no description', async () => {
      const noDescExisting: Entities.Procedures.IProcedureEntity = {
        ...baseExisting,
        description: undefined
      };

      createResponder()
        .onInput(/^Procedure name/i, 'Updated Ganache')
        .onInput(/^Description/i, 'New description')
        .onConfirm(/category/i, false)
        .onConfirm(/^Add new steps/i, false)
        .install(mocks);

      expect(await promptEditProcedure(noDescExisting)).toSucceedAndSatisfy((entity) => {
        expect(entity.description).toBe('New description');
      });
    });

    test('should set category to none when selected', async () => {
      createResponder()
        .onInput(/^Procedure name/i, 'Updated Ganache')
        .onInput(/^Description/i, '')
        .onConfirm(/category/i, true)
        .onConfirm(/^Add new steps/i, false)
        .onMenu(/^Select procedure category/i, undefined)
        .install(mocks);

      expect(await promptEditProcedure(baseExisting)).toSucceedAndSatisfy((entity) => {
        expect(entity.category).toBeUndefined();
      });
    });

    test('should add inline task step to existing steps', async () => {
      createResponder()
        .onInput(/^Procedure name/i, 'Updated Ganache')
        .onInput(/^Description/i, '')
        .onInput(/^Task name/i, 'Cool Chocolate')
        .onInput(/^Task base ID/i, '')
        .onInput(/^Task template/i, 'Cool to {{temperature}}')
        .onConfirm(/category/i, false)
        .onConfirm(/^Add new steps/i, true)
        .onConfirm(/^Add step 2/i, true)
        .onConfirm(/^Add task param/i, false)
        .onConfirm(/^Add timing/i, false)
        .onConfirm(/^Add step 3/i, false)
        .onMenu(/Task type/i, 'inline')
        .install(mocks);

      expect(await promptEditProcedure(baseExisting)).toSucceedAndSatisfy((entity) => {
        expect(entity.steps).toHaveLength(2);
        expect(entity.steps[1]).toEqual(
          expect.objectContaining({
            order: 2,
            task: {
              task: {
                baseId: 'cool-chocolate',
                name: 'Cool Chocolate',
                template: 'Cool to {{temperature}}'
              },
              params: {}
            }
          })
        );
      });
    });
  });

  describe('failure scenarios', () => {
    test('should return failure for empty name', async () => {
      createResponder()
        .onInput(/^Procedure name/i, '')
        .install(mocks);

      expect(await promptEditProcedure(baseExisting)).toFailWith(/name.*required/i);
    });

    test('should return failure when category selection is cancelled', async () => {
      createResponder()
        .onInput(/^Procedure name/i, 'Updated Ganache')
        .onInput(/^Description/i, '')
        .onConfirm(/category/i, true)
        .onMenuBack(/^Select procedure category/i)
        .install(mocks);

      expect(await promptEditProcedure(baseExisting)).toFailWith(/cancel/i);
    });

    test('should return failure for empty task ID in new step', async () => {
      createResponder()
        .onInput(/^Procedure name/i, 'Updated Ganache')
        .onInput(/^Description/i, '')
        .onInput(/^Task ID/i, '')
        .onConfirm(/category/i, false)
        .onConfirm(/^Add new steps/i, true)
        .onConfirm(/^Add step 2/i, true)
        .onMenu(/Task type/i, 'reference')
        .install(mocks);

      expect(await promptEditProcedure(baseExisting)).toFailWith(/task id.*required/i);
    });

    test('should return failure for invalid param format in new step', async () => {
      const responder = createResponder()
        .onInput(/^Procedure name/i, 'Updated Ganache')
        .onInput(/^Description/i, '')
        .onInput(/^Task ID/i, 'common.heat-chocolate')
        .onInput(/^Parameter/i, 'invalid-param')
        .onConfirm(/category/i, false)
        .onConfirm(/^Add new steps/i, true)
        .onConfirm(/^Add step 2/i, true)
        .onConfirm(/^Add task param/i, true)
        .onMenu(/Task type/i, 'reference');
      responder.install(mocks);

      expect(await promptEditProcedure(baseExisting)).toFailWith(/param.*key=value/i);
    });

    test('should return failure when task type selection is cancelled', async () => {
      createResponder()
        .onInput(/^Procedure name/i, 'Updated Ganache')
        .onInput(/^Description/i, '')
        .onConfirm(/category/i, false)
        .onConfirm(/^Add new steps/i, true)
        .onConfirm(/^Add step 2/i, true)
        .onMenuBack(/Task type/i)
        .install(mocks);

      expect(await promptEditProcedure(baseExisting)).toFailWith(/cancel/i);
    });
  });
});
