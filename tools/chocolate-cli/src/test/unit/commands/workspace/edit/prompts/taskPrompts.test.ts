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
import type { BaseTaskId, Minutes, Celsius, NoteCategory } from '@fgv/ts-chocolate';
import type { Entities } from '@fgv/ts-chocolate';
import { promptNewTask, promptEditTask } from '../../../../../../commands/workspace/edit/prompts/taskPrompts';
import { createResponder } from './helpers/promptTestHelper';
import type { IMockSharedPrompts } from './helpers/promptTestHelper';

const mocks: IMockSharedPrompts = {
  promptInput: mockPromptInput,
  confirmAction: mockConfirmAction,
  showMenu: mockShowMenu
};

describe('taskPrompts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('promptNewTask', () => {
    describe('with valid inputs', () => {
      test('should create task with name, auto-generated baseId, and template', async () => {
        createResponder()
          .onInput(/^Task name/i, 'Tempering Chocolate')
          .onInput(/^Base ID/i, '') // auto-generate
          .onInput(/^Template/i, 'Temper {{chocolate}} to {{temperature}}')
          .defaultConfirm(false)
          .install(mocks);

        expect(await promptNewTask()).toSucceedAndSatisfy((entity) => {
          expect(entity.baseId).toBe('tempering-chocolate');
          expect(entity.name).toBe('Tempering Chocolate');
          expect(entity.template).toBe('Temper {{chocolate}} to {{temperature}}');
          expect(entity.defaultActiveTime).toBeUndefined();
        });
      });

      test('should create task with explicit baseId', async () => {
        createResponder()
          .onInput(/^Task name/i, 'Tempering Chocolate')
          .onInput(/^Base ID/i, 'custom-temper-id')
          .onInput(/^Template/i, 'Temper {{chocolate}}')
          .defaultConfirm(false)
          .install(mocks);

        expect(await promptNewTask()).toSucceedAndSatisfy((entity) => {
          expect(entity.baseId).toBe('custom-temper-id');
          expect(entity.name).toBe('Tempering Chocolate');
        });
      });

      test('should add timing defaults when user confirms', async () => {
        createResponder()
          .onInput(/^Task name/i, 'Molding')
          .onInput(/^Base ID/i, '')
          .onInput(/^Template/i, 'Mold {{filling}}')
          .onConfirm(/timing/i, true)
          .onInput(/active time/i, '15')
          .onInput(/wait time/i, '30')
          .onInput(/hold time/i, '10')
          .onInput(/temperature/i, '18')
          .install(mocks);

        expect(await promptNewTask()).toSucceedAndSatisfy((entity) => {
          expect(entity.defaultActiveTime).toBe(15);
          expect(entity.defaultWaitTime).toBe(30);
          expect(entity.defaultHoldTime).toBe(10);
          expect(entity.defaultTemperature).toBe(18);
        });
      });

      test('should skip timing defaults when user declines', async () => {
        createResponder()
          .onInput(/^Task name/i, 'Molding')
          .onInput(/^Base ID/i, '')
          .onInput(/^Template/i, 'Mold {{filling}}')
          .onConfirm(/timing/i, false)
          .install(mocks);

        expect(await promptNewTask()).toSucceedAndSatisfy((entity) => {
          expect(entity.defaultActiveTime).toBeUndefined();
          expect(entity.defaultWaitTime).toBeUndefined();
          expect(entity.defaultHoldTime).toBeUndefined();
          expect(entity.defaultTemperature).toBeUndefined();
        });
      });

      test('should handle partial timing values with empty strings', async () => {
        createResponder()
          .onInput(/^Task name/i, 'Molding')
          .onInput(/^Base ID/i, '')
          .onInput(/^Template/i, 'Mold {{filling}}')
          .onConfirm(/timing/i, true)
          .onInput(/active time/i, '15')
          .onInput(/wait time/i, '') // skip
          .onInput(/hold time/i, '10')
          .onInput(/temperature/i, '') // skip
          .install(mocks);

        expect(await promptNewTask()).toSucceedAndSatisfy((entity) => {
          expect(entity.defaultActiveTime).toBe(15);
          expect(entity.defaultWaitTime).toBeUndefined();
          expect(entity.defaultHoldTime).toBe(10);
          expect(entity.defaultTemperature).toBeUndefined();
        });
      });

      test('should trim whitespace from name and template', async () => {
        createResponder()
          .onInput(/^Task name/i, '  Tempering Chocolate  ')
          .onInput(/^Base ID/i, '')
          .onInput(/^Template/i, '  Template {{var}}  ')
          .defaultConfirm(false)
          .install(mocks);

        expect(await promptNewTask()).toSucceedAndSatisfy((entity) => {
          expect(entity.name).toBe('Tempering Chocolate');
          expect(entity.template).toBe('Template {{var}}');
        });
      });

      test('should auto-generate baseId converting spaces to hyphens', async () => {
        createResponder()
          .onInput(/^Task name/i, 'Temper  Dark   Chocolate')
          .onInput(/^Base ID/i, '')
          .onInput(/^Template/i, 'Template')
          .defaultConfirm(false)
          .install(mocks);

        expect(await promptNewTask()).toSucceedAndSatisfy((entity) => {
          expect(entity.baseId).toBe('temper-dark-chocolate');
        });
      });

      test('should auto-generate baseId stripping special characters', async () => {
        createResponder()
          .onInput(/^Task name/i, 'Temper (Dark) Chocolate!')
          .onInput(/^Base ID/i, '')
          .onInput(/^Template/i, 'Template')
          .defaultConfirm(false)
          .install(mocks);

        expect(await promptNewTask()).toSucceedAndSatisfy((entity) => {
          expect(entity.baseId).toBe('temper-dark-chocolate');
        });
      });

      test('should allow negative temperature values', async () => {
        createResponder()
          .onInput(/^Task name/i, 'Cooling')
          .onInput(/^Base ID/i, '')
          .onInput(/^Template/i, 'Cool {{item}}')
          .onConfirm(/timing/i, true)
          .onInput(/active time/i, '')
          .onInput(/wait time/i, '')
          .onInput(/hold time/i, '')
          .onInput(/temperature/i, '-5')
          .install(mocks);

        expect(await promptNewTask()).toSucceedAndSatisfy((entity) => {
          expect(entity.defaultTemperature).toBe(-5);
        });
      });
    });

    describe('with invalid inputs', () => {
      test('should return failure for empty name', async () => {
        createResponder()
          .onInput(/^Task name/i, '')
          .install(mocks);

        expect(await promptNewTask()).toFailWith(/task name is required/i);
      });

      test('should return failure for whitespace-only name', async () => {
        createResponder()
          .onInput(/^Task name/i, '   ')
          .install(mocks);

        expect(await promptNewTask()).toFailWith(/task name is required/i);
      });

      test('should return failure for empty template', async () => {
        createResponder()
          .onInput(/^Task name/i, 'Tempering')
          .onInput(/^Base ID/i, '')
          .onInput(/^Template/i, '')
          .install(mocks);

        expect(await promptNewTask()).toFailWith(/template is required/i);
      });

      test('should return failure for whitespace-only template', async () => {
        createResponder()
          .onInput(/^Task name/i, 'Tempering')
          .onInput(/^Base ID/i, '')
          .onInput(/^Template/i, '   ')
          .install(mocks);

        expect(await promptNewTask()).toFailWith(/template is required/i);
      });

      test('should return failure when auto-generated baseId is empty', async () => {
        createResponder()
          .onInput(/^Task name/i, '!!!@@@###')
          .onInput(/^Base ID/i, '')
          .install(mocks);

        expect(await promptNewTask()).toFailWith(/could not generate a valid base id/i);
      });

      test('should return failure for negative active time', async () => {
        createResponder()
          .onInput(/^Task name/i, 'Molding')
          .onInput(/^Base ID/i, '')
          .onInput(/^Template/i, 'Template')
          .onConfirm(/timing/i, true)
          .onInput(/active time/i, '-5')
          .install(mocks);

        expect(await promptNewTask()).toFailWith(/active time must be a non-negative number/i);
      });

      test('should return failure for NaN active time', async () => {
        createResponder()
          .onInput(/^Task name/i, 'Molding')
          .onInput(/^Base ID/i, '')
          .onInput(/^Template/i, 'Template')
          .onConfirm(/timing/i, true)
          .onInput(/active time/i, 'not-a-number')
          .install(mocks);

        expect(await promptNewTask()).toFailWith(/active time must be a non-negative number/i);
      });

      test('should return failure for negative wait time', async () => {
        createResponder()
          .onInput(/^Task name/i, 'Molding')
          .onInput(/^Base ID/i, '')
          .onInput(/^Template/i, 'Template')
          .onConfirm(/timing/i, true)
          .onInput(/active time/i, '')
          .onInput(/wait time/i, '-10')
          .install(mocks);

        expect(await promptNewTask()).toFailWith(/wait time must be a non-negative number/i);
      });

      test('should return failure for NaN temperature', async () => {
        createResponder()
          .onInput(/^Task name/i, 'Molding')
          .onInput(/^Base ID/i, '')
          .onInput(/^Template/i, 'Template')
          .onConfirm(/timing/i, true)
          .onInput(/active time/i, '')
          .onInput(/wait time/i, '')
          .onInput(/hold time/i, '')
          .onInput(/temperature/i, 'not-a-temp')
          .install(mocks);

        expect(await promptNewTask()).toFailWith(/temperature must be a number/i);
      });
    });
  });

  describe('promptEditTask', () => {
    const baseExisting: Entities.Tasks.IRawTaskEntity = {
      baseId: 'test-task' as BaseTaskId,
      name: 'Test Task',
      template: 'Template {{variable}}'
    };

    describe('with valid edits', () => {
      test('should edit task preserving baseId', async () => {
        createResponder()
          .onInput(/^Task name/i, 'Updated Task Name')
          .onInput(/^Template/i, 'Updated template {{var}}')
          .defaultConfirm(false)
          .install(mocks);

        expect(await promptEditTask(baseExisting)).toSucceedAndSatisfy((entity) => {
          expect(entity.baseId).toBe('test-task'); // preserved
          expect(entity.name).toBe('Updated Task Name');
          expect(entity.template).toBe('Updated template {{var}}');
        });
      });

      test('should preserve existing notes, tags, and defaults', async () => {
        const existing: Entities.Tasks.IRawTaskEntity = {
          ...baseExisting,
          notes: [{ category: 'general' as NoteCategory, note: 'Important notes' }],
          tags: ['tag1', 'tag2'],
          defaults: { key: 'value' } as Record<string, unknown>
        };

        createResponder()
          .onInput(/^Task name/i, 'Updated Name')
          .onInput(/^Template/i, 'Updated Template')
          .defaultConfirm(false)
          .install(mocks);

        expect(await promptEditTask(existing)).toSucceedAndSatisfy((entity) => {
          expect(entity.notes).toEqual([{ category: 'general', note: 'Important notes' }]);
          expect(entity.tags).toEqual(['tag1', 'tag2']);
          expect(entity.defaults).toEqual({ key: 'value' });
        });
      });

      test('should edit timing values when user confirms and timings exist', async () => {
        const existing: Entities.Tasks.IRawTaskEntity = {
          ...baseExisting,
          defaultActiveTime: 10 as Minutes,
          defaultWaitTime: 20 as Minutes,
          defaultHoldTime: 5 as Minutes,
          defaultTemperature: 18 as Celsius
        };

        createResponder()
          .onInput(/^Task name/i, 'Updated Name')
          .onInput(/^Template/i, 'Updated Template')
          .onConfirm(/timing/i, true)
          .onInput(/active time/i, '15')
          .onInput(/wait time/i, '25')
          .onInput(/hold time/i, '8')
          .onInput(/temperature/i, '20')
          .install(mocks);

        expect(await promptEditTask(existing)).toSucceedAndSatisfy((entity) => {
          expect(entity.defaultActiveTime).toBe(15);
          expect(entity.defaultWaitTime).toBe(25);
          expect(entity.defaultHoldTime).toBe(8);
          expect(entity.defaultTemperature).toBe(20);
        });
      });

      test('should skip timing editing when user declines', async () => {
        const existing: Entities.Tasks.IRawTaskEntity = {
          ...baseExisting,
          defaultActiveTime: 10 as Minutes,
          defaultWaitTime: 20 as Minutes
        };

        createResponder()
          .onInput(/^Task name/i, 'Updated Name')
          .onInput(/^Template/i, 'Updated Template')
          .onConfirm(/timing/i, false)
          .install(mocks);

        expect(await promptEditTask(existing)).toSucceedAndSatisfy((entity) => {
          expect(entity.defaultActiveTime).toBeUndefined();
          expect(entity.defaultWaitTime).toBeUndefined();
        });
      });

      test('should handle partial timing updates preserving skipped fields', async () => {
        const existing: Entities.Tasks.IRawTaskEntity = {
          ...baseExisting,
          defaultActiveTime: 10 as Minutes,
          defaultWaitTime: 20 as Minutes
        };

        createResponder()
          .onInput(/^Task name/i, 'Updated Name')
          .onInput(/^Template/i, 'Updated Template')
          .onConfirm(/timing/i, true)
          .onInput(/active time/i, '15')
          .onInput(/wait time/i, '') // skip — preserves existing value
          .onInput(/hold time/i, '8') // new
          .onInput(/temperature/i, '') // skip — no existing value
          .install(mocks);

        expect(await promptEditTask(existing)).toSucceedAndSatisfy((entity) => {
          expect(entity.defaultActiveTime).toBe(15);
          expect(entity.defaultWaitTime).toBe(20); // preserved from existing
          expect(entity.defaultHoldTime).toBe(8);
          expect(entity.defaultTemperature).toBeUndefined();
        });
      });

      test('should trim whitespace from name and template', async () => {
        createResponder()
          .onInput(/^Task name/i, '  Updated Name  ')
          .onInput(/^Template/i, '  Updated Template  ')
          .defaultConfirm(false)
          .install(mocks);

        expect(await promptEditTask(baseExisting)).toSucceedAndSatisfy((entity) => {
          expect(entity.name).toBe('Updated Name');
          expect(entity.template).toBe('Updated Template');
        });
      });
    });

    describe('with invalid edits', () => {
      test('should return failure for empty name', async () => {
        createResponder()
          .onInput(/^Task name/i, '')
          .install(mocks);

        expect(await promptEditTask(baseExisting)).toFailWith(/task name is required/i);
      });

      test('should return failure for whitespace-only name', async () => {
        createResponder()
          .onInput(/^Task name/i, '   ')
          .install(mocks);

        expect(await promptEditTask(baseExisting)).toFailWith(/task name is required/i);
      });

      test('should return failure for empty template', async () => {
        createResponder()
          .onInput(/^Task name/i, 'Updated Name')
          .onInput(/^Template/i, '')
          .install(mocks);

        expect(await promptEditTask(baseExisting)).toFailWith(/template is required/i);
      });

      test('should return failure for negative active time', async () => {
        createResponder()
          .onInput(/^Task name/i, 'Updated Name')
          .onInput(/^Template/i, 'Updated Template')
          .onConfirm(/timing/i, true)
          .onInput(/active time/i, '-5')
          .install(mocks);

        expect(await promptEditTask(baseExisting)).toFailWith(/active time must be a non-negative number/i);
      });

      test('should return failure for NaN temperature', async () => {
        createResponder()
          .onInput(/^Task name/i, 'Updated Name')
          .onInput(/^Template/i, 'Updated Template')
          .onConfirm(/timing/i, true)
          .onInput(/active time/i, '')
          .onInput(/wait time/i, '')
          .onInput(/hold time/i, '')
          .onInput(/temperature/i, 'not-a-temp')
          .install(mocks);

        expect(await promptEditTask(baseExisting)).toFailWith(/temperature must be a number/i);
      });
    });
  });
});
