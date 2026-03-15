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
import { Converters, Result, fail, succeed } from '@fgv/ts-utils';
import { FileTree } from '@fgv/ts-json-base';

import {
  BaseIngredientId,
  CollectionId,
  Converters as CommonConverters,
  Percentage
} from '../../../packlets/common';
import {
  IChocolateIngredientEntity,
  IGanacheCharacteristics,
  IngredientsLibrary
} from '../../../packlets/entities';
import { Converters as EntityConverters } from '../../../packlets/entities';
import { ISyncProvider, ICollectionOperations, PersistedEditableCollection } from '../../../packlets/editing';

// ============================================================================
// Mock Helpers
// ============================================================================

interface IMockMutableFileItemOptions {
  name?: string;
  getIsMutable?: () => Result<boolean>;
  setRawContents?: (content: string) => Result<undefined>;
}

function createMockMutableFileItem(options?: IMockMutableFileItemOptions): FileTree.IMutableFileTreeFileItem {
  return {
    type: 'file' as const,
    absolutePath: `/${options?.name ?? 'test.yaml'}`,
    name: options?.name ?? 'test.yaml',
    baseName: options?.name ?? 'test',
    extension: '.yaml',
    contentType: undefined,
    getContents: () => succeed({}),
    getRawContents: () => succeed(''),
    getIsMutable: options?.getIsMutable ?? (() => succeed(true)),
    setContents: () => succeed(undefined),
    setRawContents: options?.setRawContents ?? ((_content: string) => succeed(undefined)),
    delete: () => succeed(true)
  } as unknown as FileTree.IMutableFileTreeFileItem;
}

// ============================================================================
// Test Data
// ============================================================================

const testChars: IGanacheCharacteristics = {
  cacaoFat: 36 as Percentage,
  sugar: 34 as Percentage,
  milkFat: 0 as Percentage,
  water: 1 as Percentage,
  solids: 29 as Percentage,
  otherFats: 0 as Percentage
};

const darkChocolate: IChocolateIngredientEntity = {
  baseId: 'dark-chocolate' as BaseIngredientId,
  name: 'Dark Chocolate 70%',
  category: 'chocolate',
  chocolateType: 'dark',
  cacaoPercentage: 70 as Percentage,
  ganacheCharacteristics: testChars
};

const milkChocolate: IChocolateIngredientEntity = {
  baseId: 'milk-chocolate' as BaseIngredientId,
  name: 'Milk Chocolate 40%',
  category: 'chocolate',
  chocolateType: 'milk',
  cacaoPercentage: 40 as Percentage,
  ganacheCharacteristics: testChars
};

// ============================================================================
// Helper: create a library WITHOUT a FileTree source (for no-source tests)
// ============================================================================

function createLibraryWithoutSource(): IngredientsLibrary {
  return IngredientsLibrary.create({
    builtin: false,
    collections: [
      {
        id: 'user' as CollectionId,
        isMutable: true,
        /* eslint-disable @typescript-eslint/naming-convention */
        items: { 'dark-chocolate': darkChocolate }
        /* eslint-enable @typescript-eslint/naming-convention */
      }
    ]
  }).orThrow();
}

// ============================================================================
// PersistedEditableCollection Tests
// ============================================================================

describe('PersistedEditableCollection', () => {
  const collectionId = 'user' as CollectionId;
  const keyConverter = CommonConverters.baseIngredientId;
  const valueConverter = EntityConverters.Ingredients.ingredientEntity;

  // ==========================================================================
  // Constructor and basic getters
  // ==========================================================================

  describe('getters', () => {
    test('collectionId returns the configured collection ID', () => {
      const library = createLibraryWithoutSource();
      const persisted = new PersistedEditableCollection({
        subLibrary: library,
        collectionId,
        keyConverter,
        valueConverter
      });

      expect(persisted.collectionId).toBe(collectionId);
    });

    test('subLibrary returns the underlying sub-library', () => {
      const library = createLibraryWithoutSource();
      const persisted = new PersistedEditableCollection({
        subLibrary: library,
        collectionId,
        keyConverter,
        valueConverter
      });

      expect(persisted.subLibrary).toBe(library);
    });
  });

  // ==========================================================================
  // getEditable
  // ==========================================================================

  describe('getEditable', () => {
    test('returns success with an EditableCollection for a known collection', () => {
      const library = createLibraryWithoutSource();
      const persisted = new PersistedEditableCollection({
        subLibrary: library,
        collectionId,
        keyConverter,
        valueConverter
      });

      expect(persisted.getEditable()).toSucceedAndSatisfy((editable) => {
        expect(editable.collectionId).toBe(collectionId);
        expect(editable.size).toBe(1);
      });
    });

    test('returns the same EditableCollection instance on repeated calls (cached)', () => {
      const library = createLibraryWithoutSource();
      const persisted = new PersistedEditableCollection({
        subLibrary: library,
        collectionId,
        keyConverter,
        valueConverter
      });

      const first = persisted.getEditable().orThrow();
      const second = persisted.getEditable().orThrow();
      expect(first).toBe(second);
    });

    test('re-creates EditableCollection after invalidate()', () => {
      const library = createLibraryWithoutSource();
      const persisted = new PersistedEditableCollection({
        subLibrary: library,
        collectionId,
        keyConverter,
        valueConverter
      });

      const first = persisted.getEditable().orThrow();
      persisted.invalidate();
      const second = persisted.getEditable().orThrow();
      expect(first).not.toBe(second);
    });

    test('creates EditableCollection with encryption provider when provided as value', () => {
      const library = createLibraryWithoutSource();
      // Use unknown cast because the mock doesn't need full interface for this structural test
      const mockProvider = {} as unknown as import('@fgv/ts-extras').CryptoUtils.IEncryptionProvider;

      const persisted = new PersistedEditableCollection({
        subLibrary: library,
        collectionId,
        keyConverter,
        valueConverter,
        encryptionProvider: mockProvider
      });

      // Should still succeed; encryption provider is passed through to EditableCollection
      expect(persisted.getEditable()).toSucceed();
    });

    test('creates EditableCollection with encryption provider when provided as getter function', () => {
      const library = createLibraryWithoutSource();
      const mockProvider = {} as unknown as import('@fgv/ts-extras').CryptoUtils.IEncryptionProvider;

      const persisted = new PersistedEditableCollection({
        subLibrary: library,
        collectionId,
        keyConverter,
        valueConverter,
        encryptionProvider: () => mockProvider
      });

      expect(persisted.getEditable()).toSucceed();
    });

    test('handles getter function returning undefined for encryption provider', () => {
      const library = createLibraryWithoutSource();

      const persisted = new PersistedEditableCollection({
        subLibrary: library,
        collectionId,
        keyConverter,
        valueConverter,
        encryptionProvider: () => undefined
      });

      expect(persisted.getEditable()).toSucceed();
    });
  });

  // ==========================================================================
  // invalidate
  // ==========================================================================

  describe('invalidate', () => {
    test('clears the cached EditableCollection', () => {
      const library = createLibraryWithoutSource();
      const persisted = new PersistedEditableCollection({
        subLibrary: library,
        collectionId,
        keyConverter,
        valueConverter
      });

      // Cache it first
      persisted.getEditable().orThrow();
      // Invalidate
      persisted.invalidate();
      // After invalidate, getEditable creates a new instance
      const newEditable = persisted.getEditable().orThrow();
      expect(newEditable).toBeDefined();
    });
  });

  // ==========================================================================
  // canSave
  // ==========================================================================

  describe('canSave', () => {
    test('returns false when collection has no FileTree source item', () => {
      const library = createLibraryWithoutSource();
      const persisted = new PersistedEditableCollection({
        subLibrary: library,
        collectionId,
        keyConverter,
        valueConverter
      });

      expect(persisted.canSave()).toBe(false);
    });
  });

  // ==========================================================================
  // operations getter
  // ==========================================================================

  describe('operations', () => {
    test('returns default operations from SubLibrary when no custom operations provided', () => {
      const library = createLibraryWithoutSource();
      const persisted = new PersistedEditableCollection({
        subLibrary: library,
        collectionId,
        keyConverter,
        valueConverter
      });

      const ops = persisted.operations;
      expect(ops).toBeDefined();
      expect(typeof ops.add).toBe('function');
      expect(typeof ops.upsert).toBe('function');
      expect(typeof ops.remove).toBe('function');
    });

    test('returns same default operations instance on repeated access (cached)', () => {
      const library = createLibraryWithoutSource();
      const persisted = new PersistedEditableCollection({
        subLibrary: library,
        collectionId,
        keyConverter,
        valueConverter
      });

      const ops1 = persisted.operations;
      const ops2 = persisted.operations;
      expect(ops1).toBe(ops2);
    });

    test('returns custom operations when provided', () => {
      const library = createLibraryWithoutSource();
      const customOps: ICollectionOperations<IChocolateIngredientEntity, BaseIngredientId> = {
        add: (_baseId, _entity) => succeed('custom-add'),
        upsert: (_baseId, _entity) => succeed('custom-upsert'),
        remove: (_baseId) => succeed(darkChocolate)
      };

      const persisted = new PersistedEditableCollection({
        subLibrary: library,
        collectionId,
        keyConverter,
        valueConverter,
        operations: customOps
      });

      expect(persisted.operations).toBe(customOps);
    });
  });

  // ==========================================================================
  // save (without FileTree source — always fails "no source file")
  // ==========================================================================

  describe('save (no FileTree source)', () => {
    test('fails when collection has no FileTree source item', async () => {
      const library = createLibraryWithoutSource();
      const persisted = new PersistedEditableCollection({
        subLibrary: library,
        collectionId,
        keyConverter,
        valueConverter
      });

      expect(await persisted.save()).toFailWith(/does not support persistence/i);
    });

    test('fails with collection ID in message when no source item', async () => {
      const library = createLibraryWithoutSource();
      const persisted = new PersistedEditableCollection({
        subLibrary: library,
        collectionId,
        keyConverter,
        valueConverter
      });

      expect(await persisted.save()).toFailWith(/user/i);
    });

    test('save succeeds when collection has mutable in-memory source and sync provider succeeds', async () => {
      // Use a mock sync provider
      const mockSyncProvider: ISyncProvider = {
        syncToDisk: async () => succeed(true as const)
      };

      // Use a mock library with a saveable editable collection
      const mockSourceItem = createMockMutableFileItem({ name: 'user.yaml' });

      const mockLibrary = {
        collections: {
          get: (id: CollectionId) => {
            if (id === collectionId) {
              return {
                asResult: succeed({
                  metadata: { name: 'User Collection' },
                  isMutable: true,
                  items: new Map([['dark-chocolate' as BaseIngredientId, darkChocolate]])
                }),
                isSuccess: () => true
              };
            }
            return {
              asResult: { isFailure: () => true, message: 'Not found' },
              isSuccess: () => false
            };
          },
          has: (_id: CollectionId) => true
        },
        getCollectionSourceItem: (_id: CollectionId) => mockSourceItem,
        getCollectionOperations: (_id: CollectionId) => ({
          add: () => succeed('user.dark-chocolate'),
          upsert: () => succeed('user.dark-chocolate'),
          remove: () => succeed(darkChocolate)
        })
      } as unknown as import('../../../packlets/library-data').SubLibraryBase<
        string,
        BaseIngredientId,
        IChocolateIngredientEntity
      >;

      const persisted = new PersistedEditableCollection({
        subLibrary: mockLibrary,
        collectionId,
        keyConverter,
        valueConverter,
        syncProvider: mockSyncProvider
      });

      expect(await persisted.save()).toSucceedWith(true as const);
    });

    test('save fails when sync provider fails', async () => {
      const failingSyncProvider: ISyncProvider = {
        syncToDisk: async () =>
          ({
            isSuccess: () => false,
            isFailure: () => true,
            message: 'network error'
          } as unknown as Result<true>)
      };

      const mockSourceItem = createMockMutableFileItem({ name: 'user.yaml' });

      const mockLibrary = {
        collections: {
          get: (id: CollectionId) => {
            if (id === collectionId) {
              return {
                asResult: succeed({
                  metadata: { name: 'User Collection' },
                  isMutable: true,
                  items: new Map([['dark-chocolate' as BaseIngredientId, darkChocolate]])
                }),
                isSuccess: () => true
              };
            }
            return {
              asResult: { isFailure: () => true, message: 'Not found' },
              isSuccess: () => false
            };
          },
          has: (_id: CollectionId) => true
        },
        getCollectionSourceItem: (_id: CollectionId) => mockSourceItem,
        getCollectionOperations: (_id: CollectionId) => ({
          add: () => succeed('user.dark-chocolate'),
          upsert: () => succeed('user.dark-chocolate'),
          remove: () => succeed(darkChocolate)
        })
      } as unknown as import('../../../packlets/library-data').SubLibraryBase<
        string,
        BaseIngredientId,
        IChocolateIngredientEntity
      >;

      const persisted = new PersistedEditableCollection({
        subLibrary: mockLibrary,
        collectionId,
        keyConverter,
        valueConverter,
        syncProvider: failingSyncProvider
      });

      expect(await persisted.save()).toFailWith(/disk sync failed.*network error/i);
    });
  });

  // ==========================================================================
  // addItem / upsertItem / removeItem
  // ==========================================================================

  describe('addItem / upsertItem / removeItem (no FileTree source)', () => {
    let library: IngredientsLibrary;

    beforeEach(() => {
      library = createLibraryWithoutSource();
    });

    test('addItem fails when underlying add fails', async () => {
      // Since library has 'dark-chocolate' already, adding it again should trigger "already exists"
      const persisted = new PersistedEditableCollection({
        subLibrary: library,
        collectionId,
        keyConverter,
        valueConverter
      });

      // add() on an entry that already exists fails
      expect(await persisted.addItem('dark-chocolate' as BaseIngredientId, darkChocolate)).toFail();
    });

    test('addItem succeeds for a new entry then fails to persist (no source)', async () => {
      const mutationIds: string[] = [];
      const persisted = new PersistedEditableCollection({
        subLibrary: library,
        collectionId,
        keyConverter,
        valueConverter,
        onMutation: (compositeId: string) => mutationIds.push(compositeId)
      });

      const result = await persisted.addItem('milk-chocolate' as BaseIngredientId, milkChocolate);
      // Add succeeds (in-memory mutation works) but persist fails (no source item)
      expect(result).toFailWith(/add succeeded but persist failed/i);
      // onMutation was still called
      expect(mutationIds).toContain('user.milk-chocolate');
    });

    test('upsertItem succeeds for an existing entry then fails to persist (no source)', async () => {
      const mutationIds: string[] = [];
      const persisted = new PersistedEditableCollection({
        subLibrary: library,
        collectionId,
        keyConverter,
        valueConverter,
        onMutation: (compositeId: string) => mutationIds.push(compositeId)
      });

      const updatedChocolate: IChocolateIngredientEntity = {
        ...darkChocolate,
        name: 'Updated Dark Chocolate'
      };
      const result = await persisted.upsertItem('dark-chocolate' as BaseIngredientId, updatedChocolate);
      expect(result).toFailWith(/upsert succeeded but persist failed/i);
      expect(mutationIds).toContain('user.dark-chocolate');
    });

    test('removeItem succeeds for an existing entry then fails to persist (no source)', async () => {
      const mutationIds: string[] = [];
      const persisted = new PersistedEditableCollection({
        subLibrary: library,
        collectionId,
        keyConverter,
        valueConverter,
        onMutation: (compositeId: string) => mutationIds.push(compositeId)
      });

      const result = await persisted.removeItem('dark-chocolate' as BaseIngredientId);
      expect(result).toFailWith(/remove succeeded but persist failed/i);
      expect(mutationIds).toContain('user.dark-chocolate');
    });

    test('upsertItem fails when underlying upsert fails (immutable collection)', async () => {
      const immutableLibrary = IngredientsLibrary.create({
        builtin: false,
        collections: [
          {
            id: 'builtin' as CollectionId,
            isMutable: false,
            /* eslint-disable @typescript-eslint/naming-convention */
            items: { 'dark-chocolate': darkChocolate }
            /* eslint-enable @typescript-eslint/naming-convention */
          }
        ]
      }).orThrow();

      const persisted = new PersistedEditableCollection({
        subLibrary: immutableLibrary,
        collectionId: 'builtin' as CollectionId,
        keyConverter,
        valueConverter
      });

      const result = await persisted.upsertItem('dark-chocolate' as BaseIngredientId, darkChocolate);
      expect(result).toFail();
    });

    test('removeItem fails when entry does not exist', async () => {
      const persisted = new PersistedEditableCollection({
        subLibrary: library,
        collectionId,
        keyConverter,
        valueConverter
      });

      const result = await persisted.removeItem('nonexistent' as BaseIngredientId);
      expect(result).toFail();
    });
  });

  // ==========================================================================
  // set / delete (proxied mutations)
  // ==========================================================================

  describe('set', () => {
    test('sets an item in the collection', () => {
      const library = createLibraryWithoutSource();
      const persisted = new PersistedEditableCollection({
        subLibrary: library,
        collectionId,
        keyConverter,
        valueConverter
      });

      const result = persisted.set('dark-chocolate' as BaseIngredientId, darkChocolate);
      expect(result).toSucceed();
    });

    test('set with a valid item succeeds', () => {
      const library = createLibraryWithoutSource();
      const persisted = new PersistedEditableCollection({
        subLibrary: library,
        collectionId,
        keyConverter,
        valueConverter
      });

      // upsert the existing item (set replaces or adds)
      const result = persisted.set('dark-chocolate' as BaseIngredientId, darkChocolate);
      expect(result).toSucceed();
    });

    test('set with autoPersist fires save (best-effort)', async () => {
      const library = createLibraryWithoutSource();
      const persisted = new PersistedEditableCollection({
        subLibrary: library,
        collectionId,
        keyConverter,
        valueConverter,
        autoPersist: true
      });

      // set() is synchronous, autoPersist fires save async (fire-and-forget)
      const result = persisted.set('dark-chocolate' as BaseIngredientId, darkChocolate);
      expect(result).toSucceed();
    });
  });

  describe('delete', () => {
    test('deletes an existing item from the collection', () => {
      const library = createLibraryWithoutSource();
      const persisted = new PersistedEditableCollection({
        subLibrary: library,
        collectionId,
        keyConverter,
        valueConverter
      });

      const result = persisted.delete('dark-chocolate' as BaseIngredientId);
      expect(result).toSucceed();
    });

    test('delete returns failure when item does not exist', () => {
      const library = createLibraryWithoutSource();
      const persisted = new PersistedEditableCollection({
        subLibrary: library,
        collectionId,
        keyConverter,
        valueConverter
      });

      const result = persisted.delete('nonexistent' as BaseIngredientId);
      expect(result).toFail();
    });

    test('delete with autoPersist fires save (best-effort)', async () => {
      const library = createLibraryWithoutSource();
      const persisted = new PersistedEditableCollection({
        subLibrary: library,
        collectionId,
        keyConverter,
        valueConverter,
        autoPersist: true
      });

      const result = persisted.delete('dark-chocolate' as BaseIngredientId);
      expect(result).toSucceed();
    });
  });

  // ==========================================================================
  // getEditable failure (mock library that returns failure for collection)
  // ==========================================================================

  describe('getEditable failure propagation', () => {
    test('getEditable fails when collection not found in library', () => {
      const mockLibrary = {
        collections: {
          get: (_id: CollectionId) => ({
            asResult: { isFailure: () => true, isSuccess: () => false, message: 'not found' },
            isSuccess: () => false
          })
        },
        getCollectionSourceItem: (_id: CollectionId) => undefined,
        getCollectionOperations: (_id: CollectionId) => ({
          add: () => succeed(''),
          upsert: () => succeed(''),
          remove: () => succeed(darkChocolate)
        })
      } as unknown as import('../../../packlets/library-data').SubLibraryBase<
        string,
        BaseIngredientId,
        IChocolateIngredientEntity
      >;

      const persisted = new PersistedEditableCollection({
        subLibrary: mockLibrary,
        collectionId,
        keyConverter,
        valueConverter
      });

      expect(persisted.getEditable()).toFail();
    });

    test('canSave returns false when getEditable fails', () => {
      const mockLibrary = {
        collections: {
          get: (_id: CollectionId) => ({
            asResult: { isFailure: () => true, isSuccess: () => false, message: 'not found' },
            isSuccess: () => false
          })
        },
        getCollectionSourceItem: (_id: CollectionId) => undefined,
        getCollectionOperations: (_id: CollectionId) => ({
          add: () => succeed(''),
          upsert: () => succeed(''),
          remove: () => succeed(darkChocolate)
        })
      } as unknown as import('../../../packlets/library-data').SubLibraryBase<
        string,
        BaseIngredientId,
        IChocolateIngredientEntity
      >;

      const persisted = new PersistedEditableCollection({
        subLibrary: mockLibrary,
        collectionId,
        keyConverter,
        valueConverter
      });

      expect(persisted.canSave()).toBe(false);
    });

    test('set returns failure when getEditable fails', () => {
      const mockLibrary = {
        collections: {
          get: (_id: CollectionId) => ({
            asResult: { isFailure: () => true, isSuccess: () => false, message: 'not found' },
            isSuccess: () => false
          })
        },
        getCollectionSourceItem: (_id: CollectionId) => undefined,
        getCollectionOperations: (_id: CollectionId) => ({
          add: () => succeed(''),
          upsert: () => succeed(''),
          remove: () => succeed(darkChocolate)
        })
      } as unknown as import('../../../packlets/library-data').SubLibraryBase<
        string,
        BaseIngredientId,
        IChocolateIngredientEntity
      >;

      const persisted = new PersistedEditableCollection({
        subLibrary: mockLibrary,
        collectionId,
        keyConverter,
        valueConverter
      });

      expect(persisted.set('dark-chocolate' as BaseIngredientId, darkChocolate)).toFail();
    });

    test('delete returns failure when getEditable fails', () => {
      const mockLibrary = {
        collections: {
          get: (_id: CollectionId) => ({
            asResult: { isFailure: () => true, isSuccess: () => false, message: 'not found' },
            isSuccess: () => false
          })
        },
        getCollectionSourceItem: (_id: CollectionId) => undefined,
        getCollectionOperations: (_id: CollectionId) => ({
          add: () => succeed(''),
          upsert: () => succeed(''),
          remove: () => succeed(darkChocolate)
        })
      } as unknown as import('../../../packlets/library-data').SubLibraryBase<
        string,
        BaseIngredientId,
        IChocolateIngredientEntity
      >;

      const persisted = new PersistedEditableCollection({
        subLibrary: mockLibrary,
        collectionId,
        keyConverter,
        valueConverter
      });

      expect(persisted.delete('dark-chocolate' as BaseIngredientId)).toFail();
    });

    test('save fails when getEditable fails (message includes collection ID)', async () => {
      const mockLibrary = {
        collections: {
          get: (_id: CollectionId) => ({
            asResult: { isFailure: () => true, isSuccess: () => false, message: 'not found' },
            isSuccess: () => false
          })
        },
        getCollectionSourceItem: (_id: CollectionId) => undefined,
        getCollectionOperations: (_id: CollectionId) => ({
          add: () => succeed(''),
          upsert: () => succeed(''),
          remove: () => succeed(darkChocolate)
        })
      } as unknown as import('../../../packlets/library-data').SubLibraryBase<
        string,
        BaseIngredientId,
        IChocolateIngredientEntity
      >;

      const persisted = new PersistedEditableCollection({
        subLibrary: mockLibrary,
        collectionId,
        keyConverter,
        valueConverter
      });

      expect(await persisted.save()).toFailWith(/user/i);
    });
  });

  // ==========================================================================
  // String converters (simple types for Converters.string)
  // ==========================================================================

  describe('with simple string converters', () => {
    interface TestItem {
      name: string;
      value: number;
    }

    const testKeyConverter = Converters.string;
    const testValueConverter = Converters.object<TestItem>({
      name: Converters.string,
      value: Converters.number
    });

    function createMockLibrary(
      items: Record<string, TestItem>,
      saveRawContents?: (content: string) => Result<undefined>
    ): import('../../../packlets/library-data').SubLibraryBase<string, string, TestItem> {
      const itemMap = new Map(Object.entries(items));
      const mockSourceItem = saveRawContents
        ? createMockMutableFileItem({ name: 'test.yaml', setRawContents: saveRawContents })
        : undefined;
      return {
        collections: {
          get: (id: CollectionId) => {
            if (id === ('test' as CollectionId)) {
              return {
                asResult: succeed({
                  metadata: { name: 'Test Collection' },
                  isMutable: true,
                  items: itemMap
                }),
                isSuccess: () => true
              };
            }
            return {
              asResult: { isFailure: () => true, isSuccess: () => false, message: 'not found' },
              isSuccess: () => false
            };
          },
          has: (id: CollectionId) => id === ('test' as CollectionId)
        },
        getCollectionSourceItem: (_id: CollectionId) => mockSourceItem,
        getCollectionOperations: (_id: CollectionId) => ({
          add: (baseId: string, entity: TestItem) => {
            if (itemMap.has(baseId)) {
              return {
                isSuccess: () => false,
                isFailure: () => true,
                message: 'already exists'
              } as unknown as Result<string>;
            }
            itemMap.set(baseId, entity);
            return succeed(`test.${baseId}`);
          },
          upsert: (baseId: string, entity: TestItem) => {
            itemMap.set(baseId, entity);
            return succeed(`test.${baseId}`);
          },
          remove: (baseId: string) => {
            const existing = itemMap.get(baseId);
            if (!existing) {
              return {
                isSuccess: () => false,
                isFailure: () => true,
                message: 'not found'
              } as unknown as Result<TestItem>;
            }
            itemMap.delete(baseId);
            return succeed(existing);
          }
        })
      } as unknown as import('../../../packlets/library-data').SubLibraryBase<string, string, TestItem>;
    }

    test('addItem succeeds then fails to persist (no source)', async () => {
      const mockLib = createMockLibrary({ existing: { name: 'Existing', value: 1 } });
      const persisted = new PersistedEditableCollection({
        subLibrary: mockLib,
        collectionId: 'test' as CollectionId,
        keyConverter: testKeyConverter,
        valueConverter: testValueConverter
      });

      const result = await persisted.addItem('new-item', { name: 'New', value: 2 });
      expect(result).toFailWith(/add succeeded but persist failed/i);
    });

    test('upsertItem succeeds then fails to persist (no source)', async () => {
      const mockLib = createMockLibrary({ existing: { name: 'Existing', value: 1 } });
      const persisted = new PersistedEditableCollection({
        subLibrary: mockLib,
        collectionId: 'test' as CollectionId,
        keyConverter: testKeyConverter,
        valueConverter: testValueConverter
      });

      const result = await persisted.upsertItem('existing', { name: 'Updated', value: 99 });
      expect(result).toFailWith(/upsert succeeded but persist failed/i);
    });

    test('removeItem succeeds then fails to persist (no source)', async () => {
      const mockLib = createMockLibrary({ existing: { name: 'Existing', value: 1 } });
      const persisted = new PersistedEditableCollection({
        subLibrary: mockLib,
        collectionId: 'test' as CollectionId,
        keyConverter: testKeyConverter,
        valueConverter: testValueConverter
      });

      const result = await persisted.removeItem('existing');
      expect(result).toFailWith(/remove succeeded but persist failed/i);
    });

    test('addItem succeeds and persists when FileTree save succeeds', async () => {
      const mockLib = createMockLibrary({ existing: { name: 'Existing', value: 1 } }, (_content: string) =>
        succeed(undefined)
      );
      const persisted = new PersistedEditableCollection({
        subLibrary: mockLib,
        collectionId: 'test' as CollectionId,
        keyConverter: testKeyConverter,
        valueConverter: testValueConverter
      });

      const result = await persisted.addItem('new-item', { name: 'New', value: 2 });
      expect(result).toSucceedWith('test.new-item');
    });

    test('upsertItem succeeds and persists when FileTree save succeeds', async () => {
      const mockLib = createMockLibrary({ existing: { name: 'Existing', value: 1 } }, (_content: string) =>
        succeed(undefined)
      );
      const persisted = new PersistedEditableCollection({
        subLibrary: mockLib,
        collectionId: 'test' as CollectionId,
        keyConverter: testKeyConverter,
        valueConverter: testValueConverter
      });

      const result = await persisted.upsertItem('existing', { name: 'Updated', value: 99 });
      expect(result).toSucceedWith('test.existing');
    });

    test('removeItem succeeds and persists when FileTree save succeeds', async () => {
      const mockLib = createMockLibrary({ existing: { name: 'Existing', value: 1 } }, (_content: string) =>
        succeed(undefined)
      );
      const persisted = new PersistedEditableCollection({
        subLibrary: mockLib,
        collectionId: 'test' as CollectionId,
        keyConverter: testKeyConverter,
        valueConverter: testValueConverter
      });

      const result = await persisted.removeItem('existing');
      expect(result).toSucceedAndSatisfy((removed) => {
        expect(removed.name).toBe('Existing');
      });
    });

    test('save fails with error context when editable.save() fails', async () => {
      const mockLib = createMockLibrary(
        { existing: { name: 'Existing', value: 1 } },
        (_content: string) => fail('write error') as unknown as Result<undefined>
      );
      const persisted = new PersistedEditableCollection({
        subLibrary: mockLib,
        collectionId: 'test' as CollectionId,
        keyConverter: testKeyConverter,
        valueConverter: testValueConverter
      });

      expect(await persisted.save()).toFailWith(/save failed.*write error/i);
    });

    test('addItem fails with persist error when editable.save() fails', async () => {
      const mockLib = createMockLibrary(
        { existing: { name: 'Existing', value: 1 } },
        (_content: string) => fail('write error') as unknown as Result<undefined>
      );
      const persisted = new PersistedEditableCollection({
        subLibrary: mockLib,
        collectionId: 'test' as CollectionId,
        keyConverter: testKeyConverter,
        valueConverter: testValueConverter
      });

      const result = await persisted.addItem('new-item', { name: 'New', value: 2 });
      expect(result).toFailWith(/add succeeded but persist failed/i);
    });
  });
});
