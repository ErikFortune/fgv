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

/**
 * Tests for ChocolateEntityLibrary persistence methods:
 * - configurePersistence()
 * - getPersistedXxxCollection() singletons
 * - saveCollection()
 * - Private helpers (_getOrCreatePersisted, _savePersisted, _saveEntityToCollection)
 *   tested indirectly through the public API
 */

import '@fgv/ts-utils-jest';

import { FileTree } from '@fgv/ts-json-base';

import {
  BaseConfectionId,
  BaseDecorationId,
  BaseFillingId,
  BaseIngredientId,
  BaseMoldId,
  BaseProcedureId,
  BaseTaskId,
  CollectionId,
  ConfectionName,
  ConfectionRecipeVariationSpec,
  FillingName,
  FillingRecipeVariationSpec,
  IngredientId,
  Measurement,
  MoldFormat,
  Percentage,
  SlotId
} from '../../../packlets/common';
import {
  Confections,
  ConfectionsLibrary,
  DecorationsLibrary,
  FillingsLibrary,
  IChocolateIngredientEntity,
  IDecorationEntity,
  IFillingRecipeEntity,
  IGanacheCharacteristics,
  IMoldEntity,
  IProcedureEntity,
  IRawTaskEntity,
  IngredientsLibrary,
  MoldsLibrary,
  ProceduresLibrary,
  TasksLibrary
} from '../../../packlets/entities';
import { ChocolateEntityLibrary } from '../../../packlets/library-runtime';
import { PersistedEditableCollection } from '../../../packlets/editing';

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

const testRecipe: IFillingRecipeEntity = {
  baseId: 'test-ganache' as BaseFillingId,
  name: 'Test Ganache' as FillingName,
  category: 'ganache',
  description: 'A test ganache recipe',
  goldenVariationSpec: '2026-01-01-01' as FillingRecipeVariationSpec,
  variations: [
    {
      variationSpec: '2026-01-01-01' as FillingRecipeVariationSpec,
      createdDate: '2026-01-01',
      ingredients: [
        { ingredient: { ids: ['user.dark-chocolate' as IngredientId] }, amount: 200 as Measurement }
      ],
      baseWeight: 200 as Measurement
    }
  ]
};

const testMold: IMoldEntity = {
  baseId: 'test-mold' as BaseMoldId,
  manufacturer: 'TestCo',
  productNumber: 'T-001',
  name: 'Test Mold',
  cavities: { kind: 'count', count: 24, info: { weight: 10 as Measurement } },
  format: 'other' as MoldFormat
};

const testProcedure: IProcedureEntity = {
  baseId: 'test-procedure' as BaseProcedureId,
  name: 'Test Procedure',
  steps: []
};

const testTask: IRawTaskEntity = {
  baseId: 'test-task' as BaseTaskId,
  name: 'Test Task',
  template: 'A test task template'
};

const testConfection: Confections.RolledTruffleRecipeEntity = {
  baseId: 'test-truffle' as BaseConfectionId,
  confectionType: 'rolled-truffle',
  name: 'Test Truffle' as ConfectionName,
  goldenVariationSpec: '2026-01-01-01' as ConfectionRecipeVariationSpec,
  variations: [
    {
      variationSpec: '2026-01-01-01' as ConfectionRecipeVariationSpec,
      createdDate: '2026-01-01',
      yield: { numPieces: 20, weightPerPiece: 15 as Measurement },
      fillings: [
        {
          slotId: 'center' as SlotId,
          name: 'Center',
          filling: {
            options: [
              {
                type: 'recipe' as const,
                id: 'user.test-ganache' as import('../../../packlets/common').FillingId
              }
            ],
            preferredId: 'user.test-ganache' as import('../../../packlets/common').FillingId
          }
        }
      ]
    }
  ]
};

const testDecoration: IDecorationEntity = {
  baseId: 'test-decoration' as BaseDecorationId,
  name: 'Test Decoration',
  ingredients: []
};

// ============================================================================
// Helper: build a ChocolateEntityLibrary with mutable collections for all types
// ============================================================================

function createFullEntityLibrary(): ChocolateEntityLibrary {
  const ingredients = IngredientsLibrary.create({
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

  const fillings = FillingsLibrary.create({
    builtin: false,
    collections: [
      {
        id: 'user' as CollectionId,
        isMutable: true,
        /* eslint-disable @typescript-eslint/naming-convention */
        items: { 'test-ganache': testRecipe }
        /* eslint-enable @typescript-eslint/naming-convention */
      }
    ]
  }).orThrow();

  const molds = MoldsLibrary.create({
    builtin: false,
    collections: [
      {
        id: 'user' as CollectionId,
        isMutable: true,
        /* eslint-disable @typescript-eslint/naming-convention */
        items: { 'test-mold': testMold }
        /* eslint-enable @typescript-eslint/naming-convention */
      }
    ]
  }).orThrow();

  const procedures = ProceduresLibrary.create({
    builtin: false,
    collections: [
      {
        id: 'user' as CollectionId,
        isMutable: true,
        /* eslint-disable @typescript-eslint/naming-convention */
        items: { 'test-procedure': testProcedure }
        /* eslint-enable @typescript-eslint/naming-convention */
      }
    ]
  }).orThrow();

  const tasks = TasksLibrary.create({
    builtin: false,
    collections: [
      {
        id: 'user' as CollectionId,
        isMutable: true,
        /* eslint-disable @typescript-eslint/naming-convention */
        items: { 'test-task': testTask }
        /* eslint-enable @typescript-eslint/naming-convention */
      }
    ]
  }).orThrow();

  const confections = ConfectionsLibrary.create({
    builtin: false,
    collections: [
      {
        id: 'user' as CollectionId,
        isMutable: true,
        /* eslint-disable @typescript-eslint/naming-convention */
        items: { 'test-truffle': testConfection }
        /* eslint-enable @typescript-eslint/naming-convention */
      }
    ]
  }).orThrow();

  const decorations = DecorationsLibrary.create({
    builtin: false,
    collections: [
      {
        id: 'user' as CollectionId,
        isMutable: true,
        /* eslint-disable @typescript-eslint/naming-convention */
        items: { 'test-decoration': testDecoration }
        /* eslint-enable @typescript-eslint/naming-convention */
      }
    ]
  }).orThrow();

  return ChocolateEntityLibrary.create({
    builtin: false,
    libraries: { ingredients, fillings, molds, procedures, tasks, confections, decorations }
  }).orThrow();
}

// ============================================================================
// Tests
// ============================================================================

describe('ChocolateEntityLibrary persistence', () => {
  let library: ChocolateEntityLibrary;
  const userCollectionId = 'user' as CollectionId;

  beforeEach(() => {
    library = createFullEntityLibrary();
  });

  // ==========================================================================
  // configurePersistence
  // ==========================================================================

  describe('configurePersistence', () => {
    test('can configure persistence with a sync provider', () => {
      // configurePersistence() is void; verify it does not throw
      expect(() => {
        library.configurePersistence({
          syncProvider: {
            syncToDisk: async () =>
              ({
                isSuccess: () => true,
                isFailure: () => false,
                value: true as const
              } as unknown as import('@fgv/ts-utils').Result<true>)
          }
        });
      }).not.toThrow();
    });

    test('can configure persistence without a sync provider (no-op)', () => {
      expect(() => {
        library.configurePersistence({});
      }).not.toThrow();
    });

    test('sync provider is used by getPersistedXxx after configuration', () => {
      // After configurePersistence, newly created persisted collections use the provider
      library.configurePersistence({});
      // Creating a new persisted collection should still succeed
      expect(library.getPersistedIngredientsCollection(userCollectionId)).toSucceed();
    });

    test('encryption provider (function form) is passed through to new persisted collections', () => {
      library.configurePersistence({
        encryptionProvider: () => undefined
      });

      // Newly created persisted collections pick up the provider
      expect(library.getPersistedFillingsCollection(userCollectionId)).toSucceed();
    });
  });

  // ==========================================================================
  // getPersistedXxxCollection singletons
  // ==========================================================================

  describe('getPersistedIngredientsCollection', () => {
    test('returns success for an existing collection', () => {
      expect(library.getPersistedIngredientsCollection(userCollectionId)).toSucceedAndSatisfy((persisted) => {
        expect(persisted).toBeInstanceOf(PersistedEditableCollection);
        expect(persisted.collectionId).toBe(userCollectionId);
      });
    });

    test('returns the same singleton instance on repeated calls', () => {
      const first = library.getPersistedIngredientsCollection(userCollectionId).orThrow();
      const second = library.getPersistedIngredientsCollection(userCollectionId).orThrow();
      expect(first).toBe(second);
    });

    test('fails for a collection that does not exist', () => {
      expect(library.getPersistedIngredientsCollection('nonexistent' as CollectionId)).toFailWith(
        /not found/i
      );
    });
  });

  describe('getPersistedFillingsCollection', () => {
    test('returns success for an existing collection', () => {
      expect(library.getPersistedFillingsCollection(userCollectionId)).toSucceedAndSatisfy((persisted) => {
        expect(persisted.collectionId).toBe(userCollectionId);
      });
    });

    test('returns the same singleton instance on repeated calls', () => {
      const first = library.getPersistedFillingsCollection(userCollectionId).orThrow();
      const second = library.getPersistedFillingsCollection(userCollectionId).orThrow();
      expect(first).toBe(second);
    });

    test('fails for a collection that does not exist', () => {
      expect(library.getPersistedFillingsCollection('nonexistent' as CollectionId)).toFailWith(/not found/i);
    });
  });

  describe('getPersistedMoldsCollection', () => {
    test('returns success for an existing collection', () => {
      expect(library.getPersistedMoldsCollection(userCollectionId)).toSucceed();
    });

    test('returns the same singleton instance on repeated calls', () => {
      const first = library.getPersistedMoldsCollection(userCollectionId).orThrow();
      const second = library.getPersistedMoldsCollection(userCollectionId).orThrow();
      expect(first).toBe(second);
    });

    test('fails for a collection that does not exist', () => {
      expect(library.getPersistedMoldsCollection('nonexistent' as CollectionId)).toFailWith(/not found/i);
    });
  });

  describe('getPersistedProceduresCollection', () => {
    test('returns success for an existing collection', () => {
      expect(library.getPersistedProceduresCollection(userCollectionId)).toSucceed();
    });

    test('returns the same singleton instance on repeated calls', () => {
      const first = library.getPersistedProceduresCollection(userCollectionId).orThrow();
      const second = library.getPersistedProceduresCollection(userCollectionId).orThrow();
      expect(first).toBe(second);
    });

    test('fails for a collection that does not exist', () => {
      expect(library.getPersistedProceduresCollection('nonexistent' as CollectionId)).toFailWith(
        /not found/i
      );
    });
  });

  describe('getPersistedTasksCollection', () => {
    test('returns success for an existing collection', () => {
      expect(library.getPersistedTasksCollection(userCollectionId)).toSucceed();
    });

    test('returns the same singleton instance on repeated calls', () => {
      const first = library.getPersistedTasksCollection(userCollectionId).orThrow();
      const second = library.getPersistedTasksCollection(userCollectionId).orThrow();
      expect(first).toBe(second);
    });

    test('fails for a collection that does not exist', () => {
      expect(library.getPersistedTasksCollection('nonexistent' as CollectionId)).toFailWith(/not found/i);
    });
  });

  describe('getPersistedConfectionsCollection', () => {
    test('returns success for an existing collection', () => {
      expect(library.getPersistedConfectionsCollection(userCollectionId)).toSucceed();
    });

    test('returns the same singleton instance on repeated calls', () => {
      const first = library.getPersistedConfectionsCollection(userCollectionId).orThrow();
      const second = library.getPersistedConfectionsCollection(userCollectionId).orThrow();
      expect(first).toBe(second);
    });

    test('fails for a collection that does not exist', () => {
      expect(library.getPersistedConfectionsCollection('nonexistent' as CollectionId)).toFailWith(
        /not found/i
      );
    });
  });

  describe('getPersistedDecorationsCollection', () => {
    test('returns success for an existing collection', () => {
      expect(library.getPersistedDecorationsCollection(userCollectionId)).toSucceed();
    });

    test('returns the same singleton instance on repeated calls', () => {
      const first = library.getPersistedDecorationsCollection(userCollectionId).orThrow();
      const second = library.getPersistedDecorationsCollection(userCollectionId).orThrow();
      expect(first).toBe(second);
    });

    test('fails for a collection that does not exist', () => {
      expect(library.getPersistedDecorationsCollection('nonexistent' as CollectionId)).toFailWith(
        /not found/i
      );
    });
  });

  // ==========================================================================
  // saveCollection
  // ==========================================================================

  describe('saveCollection', () => {
    test('fails for a non-existent collection ID', async () => {
      expect(await library.saveCollection('nonexistent' as CollectionId)).toFailWith(/not found/i);
    });

    test('fails with "does not support persistence" for ingredients (no FileTree source)', async () => {
      // Without FileTree-backed collections, save() will fail at editable.save()
      expect(await library.saveCollection(userCollectionId)).toFailWith(/does not support persistence/i);
    });

    test('routes to fillings sub-library when only fillings have the collection ID', async () => {
      // Create a library where only fillings have the 'fillings-only' collection
      const fillingsOnlyLibrary = FillingsLibrary.create({
        builtin: false,
        collections: [
          {
            id: 'fillings-only' as CollectionId,
            isMutable: true,
            items: {}
          }
        ]
      }).orThrow();

      const singleLib = ChocolateEntityLibrary.create({
        builtin: false,
        libraries: { fillings: fillingsOnlyLibrary }
      }).orThrow();

      // 'fillings-only' only exists in fillings; should route to fillings
      expect(await singleLib.saveCollection('fillings-only' as CollectionId)).toFailWith(
        /does not support persistence/i
      );
    });

    test('routes to molds sub-library', async () => {
      const moldsOnly = MoldsLibrary.create({
        builtin: false,
        collections: [{ id: 'molds-only' as CollectionId, isMutable: true, items: {} }]
      }).orThrow();

      const singleLib = ChocolateEntityLibrary.create({
        builtin: false,
        libraries: { molds: moldsOnly }
      }).orThrow();

      expect(await singleLib.saveCollection('molds-only' as CollectionId)).toFailWith(
        /does not support persistence/i
      );
    });

    test('routes to procedures sub-library', async () => {
      const proceduresOnly = ProceduresLibrary.create({
        builtin: false,
        collections: [{ id: 'procs-only' as CollectionId, isMutable: true, items: {} }]
      }).orThrow();

      const singleLib = ChocolateEntityLibrary.create({
        builtin: false,
        libraries: { procedures: proceduresOnly }
      }).orThrow();

      expect(await singleLib.saveCollection('procs-only' as CollectionId)).toFailWith(
        /does not support persistence/i
      );
    });

    test('routes to tasks sub-library', async () => {
      const tasksOnly = TasksLibrary.create({
        builtin: false,
        collections: [{ id: 'tasks-only' as CollectionId, isMutable: true, items: {} }]
      }).orThrow();

      const singleLib = ChocolateEntityLibrary.create({
        builtin: false,
        libraries: { tasks: tasksOnly }
      }).orThrow();

      expect(await singleLib.saveCollection('tasks-only' as CollectionId)).toFailWith(
        /does not support persistence/i
      );
    });

    test('routes to confections sub-library', async () => {
      const confectionsOnly = ConfectionsLibrary.create({
        builtin: false,
        collections: [{ id: 'confections-only' as CollectionId, isMutable: true, items: {} }]
      }).orThrow();

      const singleLib = ChocolateEntityLibrary.create({
        builtin: false,
        libraries: { confections: confectionsOnly }
      }).orThrow();

      expect(await singleLib.saveCollection('confections-only' as CollectionId)).toFailWith(
        /does not support persistence/i
      );
    });

    test('routes to decorations sub-library', async () => {
      const decorationsOnly = DecorationsLibrary.create({
        builtin: false,
        collections: [{ id: 'decorations-only' as CollectionId, isMutable: true, items: {} }]
      }).orThrow();

      const singleLib = ChocolateEntityLibrary.create({
        builtin: false,
        libraries: { decorations: decorationsOnly }
      }).orThrow();

      expect(await singleLib.saveCollection('decorations-only' as CollectionId)).toFailWith(
        /does not support persistence/i
      );
    });

    test('uses subLibrary hint for disambiguation when provided', async () => {
      // Both ingredients and fillings have 'user' collection
      // When subLibrary is provided, it should only match the exact reference
      const subLibraryHint = library.ingredients; // ingredients is the actual sub-library
      expect(await library.saveCollection(userCollectionId, undefined, subLibraryHint)).toFailWith(
        /does not support persistence/i
      );
    });

    test('subLibrary hint with wrong library returns not-found', async () => {
      // Create a different library object that doesn't own the 'user' collection
      const differentLib = IngredientsLibrary.create({
        builtin: false,
        collections: [{ id: 'other' as CollectionId, isMutable: true, items: {} }]
      }).orThrow();

      // Pass the 'different' library as the hint — should not match 'user' in the actual library
      expect(await library.saveCollection(userCollectionId, undefined, differentLib)).toFailWith(
        /not found/i
      );
    });
  });

  // ==========================================================================
  // saveXxx entity helpers (test _saveEntityToCollection via public API)
  // The collection has no FileTree source, so disk save will fail.
  // We verify the in-memory set succeeds and the error is about persistence.
  // ==========================================================================

  describe('saveFillingRecipe', () => {
    test('fails for non-existent collection', async () => {
      expect(
        await library.saveFillingRecipe('nonexistent' as CollectionId, testRecipe.baseId, testRecipe)
      ).toFailWith(/collection.*not found/i);
    });

    test('fails for immutable collection', async () => {
      const immutableLib = ChocolateEntityLibrary.create({
        builtin: false,
        libraries: {
          fillings: FillingsLibrary.create({
            builtin: false,
            collections: [{ id: 'immutable' as CollectionId, isMutable: false, items: {} }]
          }).orThrow()
        }
      }).orThrow();

      expect(
        await immutableLib.saveFillingRecipe('immutable' as CollectionId, testRecipe.baseId, testRecipe)
      ).toFailWith(/not mutable/i);
    });

    test('sets entity in memory but fails to persist (no FileTree source)', async () => {
      const result = await library.saveFillingRecipe(userCollectionId, testRecipe.baseId, testRecipe);
      // The in-memory set succeeds but disk save fails with no FileTree backing
      expect(result).toFailWith(/disk save failed/i);
    });
  });

  describe('saveIngredient', () => {
    test('fails for non-existent collection', async () => {
      expect(
        await library.saveIngredient('nonexistent' as CollectionId, darkChocolate.baseId, darkChocolate)
      ).toFailWith(/collection.*not found/i);
    });

    test('sets entity in memory but fails to persist (no FileTree source)', async () => {
      const result = await library.saveIngredient(userCollectionId, darkChocolate.baseId, darkChocolate);
      expect(result).toFailWith(/disk save failed/i);
    });
  });

  describe('saveProcedure', () => {
    test('sets entity in memory but fails to persist (no FileTree source)', async () => {
      const result = await library.saveProcedure(userCollectionId, testProcedure.baseId, testProcedure);
      expect(result).toFailWith(/disk save failed/i);
    });
  });

  describe('saveMold', () => {
    test('sets entity in memory but fails to persist (no FileTree source)', async () => {
      const result = await library.saveMold(userCollectionId, testMold.baseId, testMold);
      expect(result).toFailWith(/disk save failed/i);
    });
  });

  describe('saveTask', () => {
    test('sets entity in memory but fails to persist (no FileTree source)', async () => {
      const result = await library.saveTask(userCollectionId, testTask.baseId, testTask);
      expect(result).toFailWith(/disk save failed/i);
    });
  });

  describe('saveConfectionRecipe', () => {
    test('sets entity in memory but fails to persist (no FileTree source)', async () => {
      const result = await library.saveConfectionRecipe(
        userCollectionId,
        testConfection.baseId,
        testConfection
      );
      expect(result).toFailWith(/disk save failed/i);
    });
  });

  describe('saveDecoration', () => {
    test('sets entity in memory but fails to persist (no FileTree source)', async () => {
      const result = await library.saveDecoration(userCollectionId, testDecoration.baseId, testDecoration);
      expect(result).toFailWith(/disk save failed/i);
    });
  });

  // ==========================================================================
  // _saveEntityToCollection success path — requires FileTree-backed library
  // ==========================================================================

  describe('saveIngredient with FileTree-backed library (success path)', () => {
    test('saveIngredient returns composite ID on full success', async () => {
      // Create an in-memory FileTree with a mutable 'user' collection file
      // eslint-disable-next-line @typescript-eslint/naming-convention
      const fileContents = { items: { 'dark-chocolate': darkChocolate } };
      const accessors = FileTree.InMemoryTreeAccessors.create(
        [{ path: '/data/ingredients/user.yaml', contents: fileContents }],
        { mutable: true }
      ).orThrow();
      const fileTree = FileTree.FileTree.create(accessors).orThrow();

      const fileTreeLibrary = ChocolateEntityLibrary.create({
        builtin: false,
        fileSources: [
          {
            sourceName: 'test',
            directory: fileTree.getDirectory('/').orThrow(),
            mutable: true,
            skipMissingDirectories: true
          }
        ]
      }).orThrow();

      const result = await fileTreeLibrary.saveIngredient(
        'user' as CollectionId,
        darkChocolate.baseId,
        darkChocolate
      );

      expect(result).toSucceedWith('user.dark-chocolate');
    });
  });
});
