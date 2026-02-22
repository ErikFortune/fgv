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

// --- Mocks must come before imports ---

const mockResolveCollectionId = jest.fn();
jest.mock('../../../../../commands/workspace/edit/collectionSelector', () => ({
  resolveCollectionId: mockResolveCollectionId
}));

const mockLoadEntityFromFile = jest.fn();
jest.mock('../../../../../commands/workspace/edit/entityFileLoader', () => ({
  loadEntityFromFile: mockLoadEntityFromFile
}));

const mockPromptNewTask = jest.fn();
const mockPromptEditTask = jest.fn();
jest.mock('../../../../../commands/workspace/edit/prompts/taskPrompts', () => ({
  promptNewTask: mockPromptNewTask,
  promptEditTask: mockPromptEditTask
}));

const mockPromptNewIngredient = jest.fn();
const mockPromptEditIngredient = jest.fn();
jest.mock('../../../../../commands/workspace/edit/prompts/ingredientPrompts', () => ({
  promptNewIngredient: mockPromptNewIngredient,
  promptEditIngredient: mockPromptEditIngredient
}));

const mockPromptNewMold = jest.fn();
const mockPromptEditMold = jest.fn();
jest.mock('../../../../../commands/workspace/edit/prompts/moldPrompts', () => ({
  promptNewMold: mockPromptNewMold,
  promptEditMold: mockPromptEditMold
}));

const mockPromptNewProcedure = jest.fn();
const mockPromptEditProcedure = jest.fn();
jest.mock('../../../../../commands/workspace/edit/prompts/procedurePrompts', () => ({
  promptNewProcedure: mockPromptNewProcedure,
  promptEditProcedure: mockPromptEditProcedure
}));

const mockPromptNewFilling = jest.fn();
const mockPromptEditFilling = jest.fn();
jest.mock('../../../../../commands/workspace/edit/prompts/fillingPrompts', () => ({
  promptNewFilling: mockPromptNewFilling,
  promptEditFilling: mockPromptEditFilling
}));

const mockPromptNewConfection = jest.fn();
const mockPromptEditConfection = jest.fn();
jest.mock('../../../../../commands/workspace/edit/prompts/confectionPrompts', () => ({
  promptNewConfection: mockPromptNewConfection,
  promptEditConfection: mockPromptEditConfection
}));

const mockShowMenu = jest.fn();
const mockPromptInput = jest.fn();
const mockShowInfo = jest.fn();
jest.mock('../../../../../commands/workspace/shared', () => ({
  showMenu: mockShowMenu,
  promptInput: mockPromptInput,
  showInfo: mockShowInfo
}));

import '@fgv/ts-utils-jest';
import { succeed, fail } from '@fgv/ts-utils';
import { CollectionId, IWorkspace } from '@fgv/ts-chocolate';

import {
  executeAdd,
  executeUpdate,
  executeInteractive
} from '../../../../../commands/workspace/edit/editOrchestrator';
import { EntityTypeName } from '../../../../../commands/workspace/edit/editTypes';

/**
 * Creates a mock editable collection with add, set, and save methods.
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function createMockEditableCollection() {
  return {
    add: jest.fn().mockReturnValue({ asResult: succeed(undefined) }),
    set: jest.fn().mockReturnValue({ asResult: succeed(undefined) }),
    save: jest.fn().mockReturnValue(succeed(undefined))
  };
}

/**
 * Creates a mock workspace with configurable entity library.
 */
function createMockWorkspace(entities?: Map<string, unknown>): IWorkspace {
  const mockCollection = createMockEditableCollection();
  const entriesArray = entities ? [...entities.entries()] : [];

  const entityLib = {
    tasks: {
      entries: jest.fn().mockReturnValue(entriesArray[Symbol.iterator] ? entriesArray : []),
      collections: { keys: jest.fn().mockReturnValue([][Symbol.iterator]()), get: jest.fn() }
    },
    ingredients: {
      entries: jest.fn().mockReturnValue([]),
      collections: { keys: jest.fn().mockReturnValue([][Symbol.iterator]()), get: jest.fn() }
    },
    molds: {
      entries: jest.fn().mockReturnValue([]),
      collections: { keys: jest.fn().mockReturnValue([][Symbol.iterator]()), get: jest.fn() }
    },
    procedures: {
      entries: jest.fn().mockReturnValue([]),
      collections: { keys: jest.fn().mockReturnValue([][Symbol.iterator]()), get: jest.fn() }
    },
    fillings: {
      entries: jest.fn().mockReturnValue([]),
      collections: { keys: jest.fn().mockReturnValue([][Symbol.iterator]()), get: jest.fn() }
    },
    confections: {
      entries: jest.fn().mockReturnValue([]),
      collections: { keys: jest.fn().mockReturnValue([][Symbol.iterator]()), get: jest.fn() }
    },
    getEditableTasksEntityCollection: jest.fn().mockReturnValue(succeed(mockCollection)),
    getEditableIngredientsEntityCollection: jest.fn().mockReturnValue(succeed(mockCollection)),
    getEditableMoldsEntityCollection: jest.fn().mockReturnValue(succeed(mockCollection)),
    getEditableProceduresEntityCollection: jest.fn().mockReturnValue(succeed(mockCollection)),
    getEditableFillingsRecipeEntityCollection: jest.fn().mockReturnValue(succeed(mockCollection)),
    getEditableConfectionsEntityCollection: jest.fn().mockReturnValue(succeed(mockCollection))
  };

  return {
    state: 'unlocked',
    isReady: true,
    data: { entities: entityLib },
    userData: {},
    keyStore: undefined,
    settings: undefined,
    unlock: jest.fn(),
    lock: jest.fn()
  } as unknown as IWorkspace;
}

describe('editOrchestrator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================================
  // executeAdd
  // ============================================================================

  describe('executeAdd', () => {
    test('adds entity from file import', async () => {
      const workspace = createMockWorkspace();
      mockResolveCollectionId.mockResolvedValue(succeed('user' as CollectionId));
      mockLoadEntityFromFile.mockReturnValue(
        succeed({ entity: { baseId: 'test-task', name: 'Test Task' }, format: 'json' })
      );

      const result = await executeAdd(workspace, 'task', '/path/to/task.json');
      expect(result).toSucceedAndSatisfy((msg: string) => {
        expect(msg).toContain('added successfully');
      });
    });

    test('adds entity from interactive prompts', async () => {
      const workspace = createMockWorkspace();
      mockResolveCollectionId.mockResolvedValue(succeed('user' as CollectionId));
      mockPromptNewTask.mockResolvedValue(
        succeed({ baseId: 'new-task', name: 'New Task', template: 'do {{thing}}', defaults: {} })
      );

      const result = await executeAdd(workspace, 'task');
      expect(result).toSucceedAndSatisfy((msg: string) => {
        expect(msg).toContain('added successfully');
      });
    });

    test.each([
      ['ingredient', mockPromptNewIngredient],
      ['mold', mockPromptNewMold],
      ['procedure', mockPromptNewProcedure],
      ['filling', mockPromptNewFilling],
      ['confection', mockPromptNewConfection]
    ] as const)('adds %s via interactive prompts', async (entityType, mockPrompt) => {
      const workspace = createMockWorkspace();
      mockResolveCollectionId.mockResolvedValue(succeed('user' as CollectionId));
      (mockPrompt as jest.Mock).mockResolvedValue(
        succeed({ baseId: `test-${entityType}`, name: `Test ${entityType}` })
      );

      const result = await executeAdd(workspace, entityType as EntityTypeName);
      expect(result).toSucceedAndSatisfy((msg: string) => {
        expect(msg).toContain('added successfully');
      });
    });

    test('fails when collection resolution fails', async () => {
      const workspace = createMockWorkspace();
      mockResolveCollectionId.mockResolvedValue(fail('no mutable collection'));

      const result = await executeAdd(workspace, 'task');
      expect(result).toFailWith(/no mutable collection/i);
    });

    test('fails when file load fails', async () => {
      const workspace = createMockWorkspace();
      mockResolveCollectionId.mockResolvedValue(succeed('user' as CollectionId));
      mockLoadEntityFromFile.mockReturnValue(fail('file not found'));

      const result = await executeAdd(workspace, 'task', '/missing.json');
      expect(result).toFailWith(/file not found/i);
    });

    test('fails when interactive prompt fails', async () => {
      const workspace = createMockWorkspace();
      mockResolveCollectionId.mockResolvedValue(succeed('user' as CollectionId));
      mockPromptNewTask.mockResolvedValue(fail('user cancelled'));

      const result = await executeAdd(workspace, 'task');
      expect(result).toFailWith(/user cancelled/i);
    });

    test('fails when entity has no baseId', async () => {
      const workspace = createMockWorkspace();
      mockResolveCollectionId.mockResolvedValue(succeed('user' as CollectionId));
      mockLoadEntityFromFile.mockReturnValue(succeed({ entity: { name: 'No ID' }, format: 'json' }));

      const result = await executeAdd(workspace, 'task', '/path/to/file.json');
      expect(result).toFailWith(/entity must have a base id/i);
    });

    test('fails when add to collection fails', async () => {
      const mockCollection = createMockEditableCollection();
      mockCollection.add.mockReturnValue({ asResult: fail('duplicate key') });

      const workspace = createMockWorkspace();
      // Override the getEditable method for this test
      (
        workspace.data as unknown as { entities: { getEditableTasksEntityCollection: jest.Mock } }
      ).entities.getEditableTasksEntityCollection.mockReturnValue(succeed(mockCollection));

      mockResolveCollectionId.mockResolvedValue(succeed('user' as CollectionId));
      mockLoadEntityFromFile.mockReturnValue(
        succeed({ entity: { baseId: 'dup', name: 'Dup' }, format: 'json' })
      );

      const result = await executeAdd(workspace, 'task', '/path/to/file.json');
      expect(result).toFailWith(/failed to add task/i);
    });

    test('fails when save after add fails', async () => {
      const mockCollection = createMockEditableCollection();
      mockCollection.save.mockReturnValue(fail('disk full'));

      const workspace = createMockWorkspace();
      (
        workspace.data as unknown as { entities: { getEditableTasksEntityCollection: jest.Mock } }
      ).entities.getEditableTasksEntityCollection.mockReturnValue(succeed(mockCollection));

      mockResolveCollectionId.mockResolvedValue(succeed('user' as CollectionId));
      mockLoadEntityFromFile.mockReturnValue(
        succeed({ entity: { baseId: 'test', name: 'Test' }, format: 'json' })
      );

      const result = await executeAdd(workspace, 'task', '/path/to/file.json');
      expect(result).toFailWith(/save failed/i);
    });

    test('fails when getEditableCollection fails', async () => {
      const workspace = createMockWorkspace();
      (
        workspace.data as unknown as { entities: { getEditableTasksEntityCollection: jest.Mock } }
      ).entities.getEditableTasksEntityCollection.mockReturnValue(fail('collection not editable'));

      mockResolveCollectionId.mockResolvedValue(succeed('user' as CollectionId));
      mockLoadEntityFromFile.mockReturnValue(
        succeed({ entity: { baseId: 'test', name: 'Test' }, format: 'json' })
      );

      const result = await executeAdd(workspace, 'task', '/path/to/file.json');
      expect(result).toFailWith(/collection not editable/i);
    });

    test('adds entity from file to each entity type', async () => {
      const entityTypes: EntityTypeName[] = [
        'task',
        'ingredient',
        'mold',
        'procedure',
        'filling',
        'confection'
      ];

      for (const entityType of entityTypes) {
        jest.clearAllMocks();
        const workspace = createMockWorkspace();
        mockResolveCollectionId.mockResolvedValue(succeed('user' as CollectionId));
        mockLoadEntityFromFile.mockReturnValue(
          succeed({ entity: { baseId: `test-${entityType}`, name: `Test` }, format: 'json' })
        );

        const result = await executeAdd(workspace, entityType, '/file.json');
        expect(result).toSucceedAndSatisfy((msg: string) => {
          expect(msg).toContain('added successfully');
        });
      }
    });

    test('passes explicit collection option through', async () => {
      const workspace = createMockWorkspace();
      mockResolveCollectionId.mockResolvedValue(succeed('custom' as CollectionId));
      mockLoadEntityFromFile.mockReturnValue(
        succeed({ entity: { baseId: 'test', name: 'Test' }, format: 'json' })
      );

      await executeAdd(workspace, 'task', '/file.json', 'custom');
      expect(mockResolveCollectionId).toHaveBeenCalledWith(workspace, 'task', 'custom');
    });
  });

  // ============================================================================
  // executeUpdate
  // ============================================================================

  describe('executeUpdate', () => {
    test('fails with invalid entity ID format (no dot)', async () => {
      const workspace = createMockWorkspace();

      const result = await executeUpdate(workspace, 'task', 'no-dot-here');
      expect(result).toFailWith(/invalid entity id/i);
    });

    test('fails with empty collection or base ID', async () => {
      const workspace = createMockWorkspace();

      const result = await executeUpdate(workspace, 'task', '.baseOnly');
      expect(result).toFailWith(/both collection id and base id/i);
    });

    test('updates entity from file import', async () => {
      const workspace = createMockWorkspace();
      const taskEntries = [['user.my-task', { baseId: 'my-task', name: 'My Task' }]];
      (
        workspace.data as unknown as { entities: { tasks: { entries: jest.Mock } } }
      ).entities.tasks.entries.mockReturnValue(taskEntries);

      mockLoadEntityFromFile.mockReturnValue(
        succeed({ entity: { baseId: 'my-task', name: 'Updated Task' }, format: 'json' })
      );

      const result = await executeUpdate(workspace, 'task', 'user.my-task', '/path/to/task.json');
      expect(result).toSucceedAndSatisfy((msg: string) => {
        expect(msg).toContain('updated successfully');
      });
    });

    test('updates entity from interactive prompts', async () => {
      const workspace = createMockWorkspace();
      const taskEntries = [['user.my-task', { baseId: 'my-task', name: 'My Task' }]];
      (
        workspace.data as unknown as { entities: { tasks: { entries: jest.Mock } } }
      ).entities.tasks.entries.mockReturnValue(taskEntries);

      mockPromptEditTask.mockResolvedValue(succeed({ baseId: 'my-task', name: 'Updated Task' }));

      const result = await executeUpdate(workspace, 'task', 'user.my-task');
      expect(result).toSucceedAndSatisfy((msg: string) => {
        expect(msg).toContain('updated successfully');
      });
    });

    test('fails when entity not found', async () => {
      const workspace = createMockWorkspace();
      // Empty entries - entity doesn't exist
      (
        workspace.data as unknown as { entities: { tasks: { entries: jest.Mock } } }
      ).entities.tasks.entries.mockReturnValue([]);

      const result = await executeUpdate(workspace, 'task', 'user.missing-task');
      expect(result).toFailWith(/task.*not found/i);
    });

    test('fails when file load fails during update', async () => {
      const workspace = createMockWorkspace();
      const taskEntries = [['user.my-task', { baseId: 'my-task', name: 'My Task' }]];
      (
        workspace.data as unknown as { entities: { tasks: { entries: jest.Mock } } }
      ).entities.tasks.entries.mockReturnValue(taskEntries);
      mockLoadEntityFromFile.mockReturnValue(fail('bad format'));

      const result = await executeUpdate(workspace, 'task', 'user.my-task', '/bad-file.json');
      expect(result).toFailWith(/bad format/i);
    });

    test('fails when edit prompt fails during update', async () => {
      const workspace = createMockWorkspace();
      const taskEntries = [['user.my-task', { baseId: 'my-task', name: 'My Task' }]];
      (
        workspace.data as unknown as { entities: { tasks: { entries: jest.Mock } } }
      ).entities.tasks.entries.mockReturnValue(taskEntries);
      mockPromptEditTask.mockResolvedValue(fail('cancelled by user'));

      const result = await executeUpdate(workspace, 'task', 'user.my-task');
      expect(result).toFailWith(/cancelled by user/i);
    });

    test.each([
      ['ingredient', 'ingredients', [['user.sugar', { baseId: 'sugar', name: 'Sugar' }]]],
      [
        'mold',
        'molds',
        [['user.mold-1', { baseId: 'mold-1', manufacturer: 'TestCo', productNumber: 'M-1' }]]
      ],
      ['procedure', 'procedures', [['user.proc-1', { baseId: 'proc-1', name: 'Temper' }]]],
      ['filling', 'fillings', [['user.ganache', { baseId: 'ganache', name: 'Ganache' }]]],
      ['confection', 'confections', [['user.bonbon', { baseId: 'bonbon', name: 'BonBon' }]]]
    ] as const)('updates %s entity from file', async (entityType, libKey, entries) => {
      const workspace = createMockWorkspace();
      const lib = (workspace.data as unknown as { entities: Record<string, { entries: jest.Mock }> })
        .entities;
      lib[libKey].entries.mockReturnValue(entries);

      mockLoadEntityFromFile.mockReturnValue(
        succeed({ entity: { ...entries[0][1], name: 'Updated' }, format: 'json' })
      );

      const entityId = entries[0][0] as string;
      const result = await executeUpdate(workspace, entityType as EntityTypeName, entityId, '/file.json');
      expect(result).toSucceedAndSatisfy((msg: string) => {
        expect(msg).toContain('updated successfully');
      });
    });

    test('fails when update set fails', async () => {
      const mockCollection = createMockEditableCollection();
      mockCollection.set.mockReturnValue({ asResult: fail('validation error') });

      const workspace = createMockWorkspace();
      (
        workspace.data as unknown as {
          entities: { getEditableTasksEntityCollection: jest.Mock; tasks: { entries: jest.Mock } };
        }
      ).entities.getEditableTasksEntityCollection.mockReturnValue(succeed(mockCollection));

      const taskEntries = [['user.my-task', { baseId: 'my-task', name: 'My Task' }]];
      (
        workspace.data as unknown as { entities: { tasks: { entries: jest.Mock } } }
      ).entities.tasks.entries.mockReturnValue(taskEntries);

      mockLoadEntityFromFile.mockReturnValue(
        succeed({ entity: { baseId: 'my-task', name: 'Updated' }, format: 'json' })
      );

      const result = await executeUpdate(workspace, 'task', 'user.my-task', '/file.json');
      expect(result).toFailWith(/failed to update task/i);
    });

    test('fails when save after update fails', async () => {
      const mockCollection = createMockEditableCollection();
      mockCollection.save.mockReturnValue(fail('write error'));

      const workspace = createMockWorkspace();
      (
        workspace.data as unknown as {
          entities: { getEditableTasksEntityCollection: jest.Mock; tasks: { entries: jest.Mock } };
        }
      ).entities.getEditableTasksEntityCollection.mockReturnValue(succeed(mockCollection));

      const taskEntries = [['user.my-task', { baseId: 'my-task', name: 'My Task' }]];
      (
        workspace.data as unknown as { entities: { tasks: { entries: jest.Mock } } }
      ).entities.tasks.entries.mockReturnValue(taskEntries);

      mockLoadEntityFromFile.mockReturnValue(
        succeed({ entity: { baseId: 'my-task', name: 'Updated' }, format: 'json' })
      );

      const result = await executeUpdate(workspace, 'task', 'user.my-task', '/file.json');
      expect(result).toFailWith(/save failed/i);
    });

    test.each([
      ['ingredient', 'ingredients'],
      ['mold', 'molds'],
      ['procedure', 'procedures'],
      ['filling', 'fillings'],
      ['confection', 'confections']
    ] as const)('fails when %s entity not found', async (entityType, libKey) => {
      const workspace = createMockWorkspace();
      const lib = (workspace.data as unknown as { entities: Record<string, { entries: jest.Mock }> })
        .entities;
      lib[libKey].entries.mockReturnValue([]);

      const result = await executeUpdate(workspace, entityType as EntityTypeName, 'user.missing');
      // eslint-disable-next-line @rushstack/security/no-unsafe-regexp
      expect(result).toFailWith(new RegExp(`${entityType}.*not found`, 'i'));
    });

    test('uses collection option override', async () => {
      const workspace = createMockWorkspace();
      const taskEntries = [['custom.my-task', { baseId: 'my-task', name: 'My Task' }]];
      (
        workspace.data as unknown as { entities: { tasks: { entries: jest.Mock } } }
      ).entities.tasks.entries.mockReturnValue(taskEntries);

      mockLoadEntityFromFile.mockReturnValue(
        succeed({ entity: { baseId: 'my-task', name: 'Updated' }, format: 'json' })
      );

      const result = await executeUpdate(workspace, 'task', 'user.my-task', '/file.json', 'custom');
      expect(result).toSucceedAndSatisfy((msg: string) => {
        expect(msg).toContain('updated successfully');
      });
    });
  });

  // ============================================================================
  // executeInteractive
  // ============================================================================

  describe('executeInteractive', () => {
    test('returns cancelled when user exits action selection', async () => {
      const workspace = createMockWorkspace();
      mockShowMenu.mockResolvedValueOnce({ action: 'exit' });

      const result = await executeInteractive(workspace);
      expect(result).toSucceedWith('Cancelled');
    });

    test('returns cancelled when user exits entity type selection', async () => {
      const workspace = createMockWorkspace();
      mockShowMenu
        .mockResolvedValueOnce({ action: 'value', value: 'add' }) // action
        .mockResolvedValueOnce({ action: 'exit' }); // entity type

      const result = await executeInteractive(workspace);
      expect(result).toSucceedWith('Cancelled');
    });

    test('executes add flow with interactive prompts', async () => {
      const workspace = createMockWorkspace();
      mockShowMenu
        .mockResolvedValueOnce({ action: 'value', value: 'add' }) // action
        .mockResolvedValueOnce({ action: 'value', value: 'task' }) // entity type
        .mockResolvedValueOnce({ action: 'value', value: 'interactive' }); // data source

      mockResolveCollectionId.mockResolvedValue(succeed('user' as CollectionId));
      mockPromptNewTask.mockResolvedValue(succeed({ baseId: 'new-task', name: 'New Task' }));

      const result = await executeInteractive(workspace);
      expect(result).toSucceedAndSatisfy((msg: string) => {
        expect(msg).toContain('added successfully');
      });
    });

    test('executes add flow with file import', async () => {
      const workspace = createMockWorkspace();
      mockShowMenu
        .mockResolvedValueOnce({ action: 'value', value: 'add' }) // action
        .mockResolvedValueOnce({ action: 'value', value: 'task' }) // entity type
        .mockResolvedValueOnce({ action: 'value', value: 'file' }); // data source

      mockPromptInput.mockResolvedValueOnce('/path/to/task.json');
      mockResolveCollectionId.mockResolvedValue(succeed('user' as CollectionId));
      mockLoadEntityFromFile.mockReturnValue(
        succeed({ entity: { baseId: 'file-task', name: 'File Task' }, format: 'json' })
      );

      const result = await executeInteractive(workspace);
      expect(result).toSucceedAndSatisfy((msg: string) => {
        expect(msg).toContain('added successfully');
      });
    });

    test('cancels add when user provides empty file path', async () => {
      const workspace = createMockWorkspace();
      mockShowMenu
        .mockResolvedValueOnce({ action: 'value', value: 'add' }) // action
        .mockResolvedValueOnce({ action: 'value', value: 'task' }) // entity type
        .mockResolvedValueOnce({ action: 'value', value: 'file' }); // data source

      mockPromptInput.mockResolvedValueOnce(''); // empty file path

      const result = await executeInteractive(workspace);
      expect(result).toSucceedWith('Cancelled');
    });

    test('cancels add when data source selection is cancelled', async () => {
      const workspace = createMockWorkspace();
      mockShowMenu
        .mockResolvedValueOnce({ action: 'value', value: 'add' }) // action
        .mockResolvedValueOnce({ action: 'value', value: 'task' }) // entity type
        .mockResolvedValueOnce({ action: 'back' }); // data source cancelled

      const result = await executeInteractive(workspace);
      expect(result).toSucceedWith('Cancelled');
    });

    test('prompts for file when entity type does not support interactive', async () => {
      const workspace = createMockWorkspace();
      mockShowMenu
        .mockResolvedValueOnce({ action: 'value', value: 'add' }) // action
        .mockResolvedValueOnce({ action: 'value', value: 'filling' }); // non-interactive type

      mockPromptInput.mockResolvedValueOnce('/path/to/filling.json');
      mockResolveCollectionId.mockResolvedValue(succeed('user' as CollectionId));
      mockLoadEntityFromFile.mockReturnValue(
        succeed({ entity: { baseId: 'test-filling', name: 'Test Filling' }, format: 'json' })
      );

      const result = await executeInteractive(workspace);
      expect(result).toSucceedAndSatisfy((msg: string) => {
        expect(msg).toContain('added successfully');
      });
      expect(mockShowInfo).toHaveBeenCalledWith(expect.stringContaining('require file import'));
    });

    test('cancels non-interactive add when empty file path', async () => {
      const workspace = createMockWorkspace();
      mockShowMenu
        .mockResolvedValueOnce({ action: 'value', value: 'add' }) // action
        .mockResolvedValueOnce({ action: 'value', value: 'confection' }); // non-interactive type

      mockPromptInput.mockResolvedValueOnce(''); // empty

      const result = await executeInteractive(workspace);
      expect(result).toSucceedWith('Cancelled');
    });

    test('executes update flow with entity selection', async () => {
      // Create workspace with entities to select from
      const taskEntries = [
        ['user.my-task', { baseId: 'my-task', name: 'My Task' }],
        ['user.other-task', { baseId: 'other-task', name: 'Other Task' }]
      ];
      const workspace = createMockWorkspace();
      (
        workspace.data as unknown as { entities: { tasks: { entries: jest.Mock } } }
      ).entities.tasks.entries.mockReturnValue(taskEntries);

      mockShowMenu
        .mockResolvedValueOnce({ action: 'value', value: 'update' }) // action
        .mockResolvedValueOnce({ action: 'value', value: 'task' }) // entity type
        .mockResolvedValueOnce({ action: 'value', value: 'user.my-task' }); // entity selection

      mockPromptEditTask.mockResolvedValue(succeed({ baseId: 'my-task', name: 'Updated Task' }));

      const result = await executeInteractive(workspace);
      expect(result).toSucceedAndSatisfy((msg: string) => {
        expect(msg).toContain('updated successfully');
      });
    });

    test('fails update when no entities exist', async () => {
      const workspace = createMockWorkspace();
      // Default mock returns empty entries

      mockShowMenu
        .mockResolvedValueOnce({ action: 'value', value: 'update' }) // action
        .mockResolvedValueOnce({ action: 'value', value: 'task' }); // entity type

      const result = await executeInteractive(workspace);
      expect(result).toFailWith(/no task entities found/i);
    });

    test('cancels update when user backs out of entity selection', async () => {
      const taskEntries = [['user.my-task', { name: 'My Task' }]];
      const workspace = createMockWorkspace();
      (
        workspace.data as unknown as { entities: { tasks: { entries: jest.Mock } } }
      ).entities.tasks.entries.mockReturnValue(taskEntries);

      mockShowMenu
        .mockResolvedValueOnce({ action: 'value', value: 'update' }) // action
        .mockResolvedValueOnce({ action: 'value', value: 'task' }) // entity type
        .mockResolvedValueOnce({ action: 'back' }); // cancel entity selection

      const result = await executeInteractive(workspace);
      expect(result).toFailWith(/cancelled/i);
    });

    test.each([
      [
        'ingredient',
        'ingredients',
        [['user.sugar', { baseId: 'sugar', name: 'Sugar' }]],
        mockPromptEditIngredient
      ],
      [
        'mold',
        'molds',
        [['user.mold-1', { baseId: 'mold-1', manufacturer: 'TestCo', productNumber: 'M-1' }]],
        mockPromptEditMold
      ],
      [
        'procedure',
        'procedures',
        [['user.proc-1', { baseId: 'proc-1', name: 'Temper' }]],
        mockPromptEditProcedure
      ],
      [
        'filling',
        'fillings',
        [['user.ganache', { baseId: 'ganache', name: 'Ganache' }]],
        mockPromptEditFilling
      ],
      [
        'confection',
        'confections',
        [['user.bonbon', { baseId: 'bonbon', name: 'BonBon' }]],
        mockPromptEditConfection
      ]
    ] as const)('selects %s entity for update', async (entityType, libKey, entries, mockPrompt) => {
      const workspace = createMockWorkspace();
      const lib = (workspace.data as unknown as { entities: Record<string, { entries: jest.Mock }> })
        .entities;
      lib[libKey].entries.mockReturnValue(entries);

      mockShowMenu
        .mockResolvedValueOnce({ action: 'value', value: 'update' })
        .mockResolvedValueOnce({ action: 'value', value: entityType })
        .mockResolvedValueOnce({ action: 'value', value: entries[0][0] });

      (mockPrompt as jest.Mock).mockResolvedValue(succeed({ ...entries[0][1], name: 'Updated' }));

      const result = await executeInteractive(workspace);
      expect(result).toSucceedAndSatisfy((msg: string) => {
        expect(msg).toContain('updated successfully');
      });
    });

    test('fails chooseDataSource when data source prompt returns failure', async () => {
      const workspace = createMockWorkspace();
      mockShowMenu
        .mockResolvedValueOnce({ action: 'value', value: 'add' }) // action
        .mockResolvedValueOnce({ action: 'value', value: 'task' }) // entity type
        .mockResolvedValueOnce({ action: 'exit' }); // data source cancelled

      const result = await executeInteractive(workspace);
      expect(result).toSucceedWith('Cancelled');
    });
  });
});
