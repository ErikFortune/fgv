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

// Mocks must come before imports
const mockShowMenu = jest.fn();
const mockConfirmAction = jest.fn();
const mockPromptInput = jest.fn();
const mockShowInfo = jest.fn();
const mockShowWarning = jest.fn();

jest.mock('../../../../../commands/workspace/shared', () => ({
  showMenu: mockShowMenu,
  confirmAction: mockConfirmAction,
  promptInput: mockPromptInput,
  showInfo: mockShowInfo,
  showWarning: mockShowWarning
}));

// Mock CollectionManager
const mockCreateWithFile = jest.fn();
jest.mock('@fgv/ts-chocolate', () => {
  const actual = jest.requireActual('@fgv/ts-chocolate');
  return {
    ...actual,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    Editing: {
      ...actual.Editing,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      CollectionManager: jest.fn().mockImplementation(() => ({
        createWithFile: mockCreateWithFile
      }))
    }
  };
});

import '@fgv/ts-utils-jest';
import { succeed, fail } from '@fgv/ts-utils';
import { CollectionId, IWorkspace } from '@fgv/ts-chocolate';

import {
  selectCollection,
  resolveCollectionId
} from '../../../../../commands/workspace/edit/collectionSelector';

/**
 * Creates a mock sub-library with configurable collections.
 */
function createMockSubLibrary(
  collections: Array<{
    id: CollectionId;
    isMutable: boolean;
    itemCount: number;
    name?: string;
  }>
): unknown {
  const collMap = new Map(
    collections.map((c) => [
      c.id,
      {
        asResult: succeed({
          isMutable: c.isMutable,
          items: { size: c.itemCount },
          metadata: c.name ? { name: c.name } : undefined
        })
      }
    ])
  );
  return {
    collections: {
      keys(): IterableIterator<CollectionId> {
        return collMap.keys();
      },
      get(id: CollectionId) {
        return collMap.get(id) ?? { asResult: fail(`Collection ${id} not found`) };
      }
    }
  };
}

/**
 * Creates a mock workspace with a sub-library for each entity type pointing to the same collections.
 */
function createMockWorkspace(
  collections: Array<{
    id: CollectionId;
    isMutable: boolean;
    itemCount: number;
    name?: string;
  }>
): IWorkspace {
  const subLib = createMockSubLibrary(collections);
  return {
    state: 'unlocked',
    isReady: true,
    data: {
      entities: {
        tasks: subLib,
        ingredients: subLib,
        molds: subLib,
        procedures: subLib,
        fillings: subLib,
        confections: subLib
      }
    },
    userData: {},
    keyStore: undefined,
    settings: undefined,
    unlock: jest.fn(),
    lock: jest.fn()
  } as unknown as IWorkspace;
}

describe('collectionSelector', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================================
  // selectCollection
  // ============================================================================

  describe('selectCollection', () => {
    test('auto-selects when only one mutable collection exists', async () => {
      const workspace = createMockWorkspace([
        { id: 'user' as CollectionId, isMutable: true, itemCount: 5 },
        { id: 'builtin' as CollectionId, isMutable: false, itemCount: 20 }
      ]);

      const result = await selectCollection(workspace, 'task');
      expect(result).toSucceedWith('user' as CollectionId);
    });

    test('prompts when multiple mutable collections exist', async () => {
      const workspace = createMockWorkspace([
        { id: 'user' as CollectionId, isMutable: true, itemCount: 3, name: 'My Tasks' },
        { id: 'custom' as CollectionId, isMutable: true, itemCount: 7, name: 'Custom Tasks' }
      ]);
      mockShowMenu.mockResolvedValue({ action: 'value', value: 'custom' as CollectionId });

      const result = await selectCollection(workspace, 'task');
      expect(result).toSucceedWith('custom' as CollectionId);
      expect(mockShowMenu).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('task'),
          choices: expect.arrayContaining([
            expect.objectContaining({ value: 'user' }),
            expect.objectContaining({ value: 'custom' })
          ])
        })
      );
    });

    test('returns failure when user exits menu selection', async () => {
      const workspace = createMockWorkspace([
        { id: 'a' as CollectionId, isMutable: true, itemCount: 1 },
        { id: 'b' as CollectionId, isMutable: true, itemCount: 2 }
      ]);
      mockShowMenu.mockResolvedValue({ action: 'exit' });

      const result = await selectCollection(workspace, 'ingredient');
      expect(result).toFailWith(/cancelled/i);
    });

    test('returns failure when user goes back from menu', async () => {
      const workspace = createMockWorkspace([
        { id: 'a' as CollectionId, isMutable: true, itemCount: 1 },
        { id: 'b' as CollectionId, isMutable: true, itemCount: 2 }
      ]);
      mockShowMenu.mockResolvedValue({ action: 'back' });

      const result = await selectCollection(workspace, 'mold');
      expect(result).toFailWith(/cancelled/i);
    });

    test('offers to create collection when no mutable collections but immutable exist', async () => {
      const workspace = createMockWorkspace([
        { id: 'builtin' as CollectionId, isMutable: false, itemCount: 10 }
      ]);
      mockConfirmAction.mockResolvedValue(false);

      const result = await selectCollection(workspace, 'task');
      expect(result).toFailWith(/no mutable collection/i);
      expect(mockShowInfo).toHaveBeenCalledWith(expect.stringContaining('read-only'));
      expect(mockConfirmAction).toHaveBeenCalledWith('Create a new collection?', true);
    });

    test('offers to create collection when no collections exist at all', async () => {
      const workspace = createMockWorkspace([]);
      mockConfirmAction.mockResolvedValue(false);

      const result = await selectCollection(workspace, 'procedure');
      expect(result).toFailWith(/no mutable collection/i);
      expect(mockShowInfo).toHaveBeenCalledWith(expect.stringContaining('No procedure'));
    });

    test.each(['task', 'ingredient', 'mold', 'procedure', 'filling', 'confection'] as const)(
      'creates new %s collection when user confirms',
      async (entityType) => {
        const workspace = createMockWorkspace([]);
        mockConfirmAction.mockResolvedValue(true);
        mockPromptInput
          .mockResolvedValueOnce('user') // collection ID
          .mockResolvedValueOnce('My Collection'); // collection name
        mockCreateWithFile.mockReturnValue(succeed(undefined));

        const result = await selectCollection(workspace, entityType);
        expect(result).toSucceedWith('user' as CollectionId);
        expect(mockShowInfo).toHaveBeenCalledWith(expect.stringContaining('created successfully'));
      }
    );

    test('creates new collection without name when name is empty', async () => {
      const workspace = createMockWorkspace([]);
      mockConfirmAction.mockResolvedValue(true);
      mockPromptInput
        .mockResolvedValueOnce('user') // collection ID
        .mockResolvedValueOnce(''); // empty name
      mockCreateWithFile.mockReturnValue(succeed(undefined));

      const result = await selectCollection(workspace, 'task');
      expect(result).toSucceedWith('user' as CollectionId);
    });

    test('fails when creating collection with empty ID', async () => {
      const workspace = createMockWorkspace([]);
      mockConfirmAction.mockResolvedValue(true);
      mockPromptInput.mockResolvedValueOnce('   '); // empty/whitespace

      const result = await selectCollection(workspace, 'ingredient');
      expect(result).toFailWith(/collection id is required/i);
    });

    test('fails when collection ID is invalid', async () => {
      const workspace = createMockWorkspace([]);
      mockConfirmAction.mockResolvedValue(true);
      mockPromptInput.mockResolvedValueOnce('INVALID ID WITH SPACES');

      const result = await selectCollection(workspace, 'task');
      expect(result).toFailWith(/invalid collection id/i);
    });

    test('fails when collection creation returns failure', async () => {
      const workspace = createMockWorkspace([]);
      mockConfirmAction.mockResolvedValue(true);
      mockPromptInput.mockResolvedValueOnce('bad-id').mockResolvedValueOnce('');
      mockCreateWithFile.mockReturnValue(fail('directory already exists'));

      const result = await selectCollection(workspace, 'mold');
      expect(result).toFailWith(/failed to create collection/i);
    });

    test('works for all entity types', async () => {
      const types = ['task', 'ingredient', 'mold', 'procedure', 'filling', 'confection'] as const;

      for (const entityType of types) {
        const workspace = createMockWorkspace([
          { id: 'only' as CollectionId, isMutable: true, itemCount: 1 }
        ]);
        const result = await selectCollection(workspace, entityType);
        expect(result).toSucceedWith('only' as CollectionId);
      }
    });
  });

  // ============================================================================
  // resolveCollectionId
  // ============================================================================

  describe('resolveCollectionId', () => {
    test('validates and returns explicit collection option', async () => {
      const workspace = createMockWorkspace([{ id: 'user' as CollectionId, isMutable: true, itemCount: 5 }]);

      const result = await resolveCollectionId(workspace, 'task', 'user');
      expect(result).toSucceedWith('user' as CollectionId);
    });

    test('fails when explicit collection is not found', async () => {
      const workspace = createMockWorkspace([{ id: 'user' as CollectionId, isMutable: true, itemCount: 5 }]);

      const result = await resolveCollectionId(workspace, 'task', 'nonexistent');
      expect(result).toFailWith(/not found/i);
    });

    test('fails when explicit collection is read-only', async () => {
      const workspace = createMockWorkspace([
        { id: 'builtin' as CollectionId, isMutable: false, itemCount: 20 }
      ]);

      const result = await resolveCollectionId(workspace, 'ingredient', 'builtin');
      expect(result).toFailWith(/not mutable/i);
      expect(mockShowWarning).toHaveBeenCalledWith(expect.stringContaining('read-only'));
    });

    test('falls through to selectCollection when no option provided', async () => {
      const workspace = createMockWorkspace([{ id: 'user' as CollectionId, isMutable: true, itemCount: 3 }]);

      const result = await resolveCollectionId(workspace, 'mold');
      expect(result).toSucceedWith('user' as CollectionId);
    });

    test('falls through to selectCollection with multiple collections', async () => {
      const workspace = createMockWorkspace([
        { id: 'a' as CollectionId, isMutable: true, itemCount: 1 },
        { id: 'b' as CollectionId, isMutable: true, itemCount: 2 }
      ]);
      mockShowMenu.mockResolvedValue({ action: 'value', value: 'b' as CollectionId });

      const result = await resolveCollectionId(workspace, 'filling');
      expect(result).toSucceedWith('b' as CollectionId);
    });
  });
});
