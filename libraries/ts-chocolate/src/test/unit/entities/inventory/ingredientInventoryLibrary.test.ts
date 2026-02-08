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

import { IngredientInventoryLibrary, IIngredientInventoryEntryEntity } from '../../../../packlets/entities';
// eslint-disable-next-line @rushstack/packlets/mechanics
import {
  IngredientInventoryEntryBaseId,
  IngredientInventoryEntryId
} from '../../../../packlets/entities/inventory/model';
import { CollectionId, IngredientId, Measurement } from '../../../../packlets/common';

describe('IngredientInventoryLibrary', () => {
  const testCollectionId = 'user-inventory' as CollectionId;

  const testEntry1: IIngredientInventoryEntryEntity = {
    inventoryType: 'ingredient',
    ingredientId: 'builtin.dark-chocolate' as IngredientId,
    quantity: 500 as Measurement
  };

  const testEntry2: IIngredientInventoryEntryEntity = {
    inventoryType: 'ingredient',
    ingredientId: 'builtin.cream' as IngredientId,
    quantity: 250 as Measurement,
    location: 'Fridge'
  };

  // ============================================================================
  // create
  // ============================================================================

  describe('create', () => {
    test('creates empty library with no params', () => {
      expect(IngredientInventoryLibrary.create({ builtin: false })).toSucceed();
    });

    test('creates library with collections', () => {
      expect(
        IngredientInventoryLibrary.create({
          builtin: false,
          collections: [
            {
              id: testCollectionId,
              isMutable: true,
              items: {
                /* eslint-disable @typescript-eslint/naming-convention */
                'dark-choc-inv': testEntry1
                /* eslint-enable @typescript-eslint/naming-convention */
              }
            }
          ]
        })
      ).toSucceed();
    });
  });

  // ============================================================================
  // Query methods
  // ============================================================================

  describe('getForIngredient', () => {
    test('finds entry by ingredientId', () => {
      const lib = IngredientInventoryLibrary.create({
        builtin: false,
        collections: [
          {
            id: testCollectionId,
            isMutable: true,
            items: {
              /* eslint-disable @typescript-eslint/naming-convention */
              'dark-choc-inv': testEntry1,
              'cream-inv': testEntry2
              /* eslint-enable @typescript-eslint/naming-convention */
            }
          }
        ]
      }).orThrow();

      expect(lib.getForIngredient('builtin.dark-chocolate' as IngredientId)).toSucceedAndSatisfy((entry) => {
        expect(entry.ingredientId).toBe('builtin.dark-chocolate');
        expect(entry.quantity).toBe(500);
      });
    });

    test('fails for non-existent ingredientId', () => {
      const lib = IngredientInventoryLibrary.create({
        builtin: false,
        collections: [
          {
            id: testCollectionId,
            isMutable: true,
            items: {
              /* eslint-disable @typescript-eslint/naming-convention */
              'dark-choc-inv': testEntry1
              /* eslint-enable @typescript-eslint/naming-convention */
            }
          }
        ]
      }).orThrow();

      expect(lib.getForIngredient('builtin.nonexistent' as IngredientId)).toFailWith(/no inventory entry/i);
    });
  });

  describe('hasForIngredient', () => {
    test('returns true when entry exists', () => {
      const lib = IngredientInventoryLibrary.create({
        builtin: false,
        collections: [
          {
            id: testCollectionId,
            isMutable: true,
            items: {
              /* eslint-disable @typescript-eslint/naming-convention */
              'dark-choc-inv': testEntry1
              /* eslint-enable @typescript-eslint/naming-convention */
            }
          }
        ]
      }).orThrow();

      expect(lib.hasForIngredient('builtin.dark-chocolate' as IngredientId)).toBe(true);
    });

    test('returns false when entry does not exist', () => {
      const lib = IngredientInventoryLibrary.create({
        builtin: false,
        collections: [
          {
            id: testCollectionId,
            isMutable: true,
            items: {
              /* eslint-disable @typescript-eslint/naming-convention */
              'dark-choc-inv': testEntry1
              /* eslint-enable @typescript-eslint/naming-convention */
            }
          }
        ]
      }).orThrow();

      expect(lib.hasForIngredient('builtin.nonexistent' as IngredientId)).toBe(false);
    });
  });

  describe('getAllEntries', () => {
    test('returns all entries across collections', () => {
      const lib = IngredientInventoryLibrary.create({
        builtin: false,
        collections: [
          {
            id: testCollectionId,
            isMutable: true,
            items: {
              /* eslint-disable @typescript-eslint/naming-convention */
              'dark-choc-inv': testEntry1,
              'cream-inv': testEntry2
              /* eslint-enable @typescript-eslint/naming-convention */
            }
          }
        ]
      }).orThrow();

      expect(lib.getAllEntries()).toHaveLength(2);
    });

    test('returns empty array for empty library', () => {
      const lib = IngredientInventoryLibrary.create({ builtin: false }).orThrow();
      expect(lib.getAllEntries()).toHaveLength(0);
    });
  });

  // ============================================================================
  // Write methods
  // ============================================================================

  describe('addEntry', () => {
    test('adds entry to mutable collection', () => {
      const lib = IngredientInventoryLibrary.create({
        builtin: false,
        collections: [
          {
            id: testCollectionId,
            isMutable: true,
            items: {}
          }
        ]
      }).orThrow();

      expect(
        lib.addEntry(testCollectionId, 'new-entry' as IngredientInventoryEntryBaseId, testEntry1)
      ).toSucceed();

      expect(lib.hasForIngredient(testEntry1.ingredientId)).toBe(true);
    });

    test('fails on duplicate entry', () => {
      const lib = IngredientInventoryLibrary.create({
        builtin: false,
        collections: [
          {
            id: testCollectionId,
            isMutable: true,
            items: {
              /* eslint-disable @typescript-eslint/naming-convention */
              'existing-entry': testEntry1
              /* eslint-enable @typescript-eslint/naming-convention */
            }
          }
        ]
      }).orThrow();

      expect(
        lib.addEntry(testCollectionId, 'existing-entry' as IngredientInventoryEntryBaseId, testEntry2)
      ).toFail();
    });
  });

  describe('upsertEntry', () => {
    test('inserts new entry', () => {
      const lib = IngredientInventoryLibrary.create({
        builtin: false,
        collections: [
          {
            id: testCollectionId,
            isMutable: true,
            items: {}
          }
        ]
      }).orThrow();

      expect(
        lib.upsertEntry(testCollectionId, 'new-entry' as IngredientInventoryEntryBaseId, testEntry1)
      ).toSucceed();

      expect(lib.hasForIngredient(testEntry1.ingredientId)).toBe(true);
    });

    test('updates existing entry', () => {
      const lib = IngredientInventoryLibrary.create({
        builtin: false,
        collections: [
          {
            id: testCollectionId,
            isMutable: true,
            items: {
              /* eslint-disable @typescript-eslint/naming-convention */
              'dark-choc-inv': testEntry1
              /* eslint-enable @typescript-eslint/naming-convention */
            }
          }
        ]
      }).orThrow();

      const updatedEntry: IIngredientInventoryEntryEntity = {
        ...testEntry1,
        quantity: 750 as Measurement
      };

      expect(
        lib.upsertEntry(testCollectionId, 'dark-choc-inv' as IngredientInventoryEntryBaseId, updatedEntry)
      ).toSucceed();

      expect(lib.getForIngredient(testEntry1.ingredientId)).toSucceedAndSatisfy((entry) => {
        expect(entry.quantity).toBe(750);
      });
    });
  });

  describe('removeEntry', () => {
    test('removes entry by composite ID', () => {
      const lib = IngredientInventoryLibrary.create({
        builtin: false,
        collections: [
          {
            id: testCollectionId,
            isMutable: true,
            items: {
              /* eslint-disable @typescript-eslint/naming-convention */
              'dark-choc-inv': testEntry1
              /* eslint-enable @typescript-eslint/naming-convention */
            }
          }
        ]
      }).orThrow();

      const compositeId = `${testCollectionId}.dark-choc-inv` as IngredientInventoryEntryId;
      expect(lib.removeEntry(compositeId)).toSucceedAndSatisfy((removed) => {
        expect(removed.ingredientId).toBe(testEntry1.ingredientId);
      });

      expect(lib.hasForIngredient(testEntry1.ingredientId)).toBe(false);
    });

    test('fails for non-existent entry', () => {
      const lib = IngredientInventoryLibrary.create({
        builtin: false,
        collections: [
          {
            id: testCollectionId,
            isMutable: true,
            items: {}
          }
        ]
      }).orThrow();

      expect(lib.removeEntry(`${testCollectionId}.nonexistent` as IngredientInventoryEntryId)).toFailWith(
        /not found/i
      );
    });

    test('fails for immutable collection', () => {
      const lib = IngredientInventoryLibrary.create({
        builtin: false,
        collections: [
          {
            id: testCollectionId,
            isMutable: false,
            items: {
              /* eslint-disable @typescript-eslint/naming-convention */
              'dark-choc-inv': testEntry1
              /* eslint-enable @typescript-eslint/naming-convention */
            }
          }
        ]
      }).orThrow();

      expect(lib.removeEntry(`${testCollectionId}.dark-choc-inv` as IngredientInventoryEntryId)).toFailWith(
        /immutable/i
      );
    });
  });

  describe('removeForIngredient', () => {
    test('removes entry by ingredientId', () => {
      const lib = IngredientInventoryLibrary.create({
        builtin: false,
        collections: [
          {
            id: testCollectionId,
            isMutable: true,
            items: {
              /* eslint-disable @typescript-eslint/naming-convention */
              'dark-choc-inv': testEntry1,
              'cream-inv': testEntry2
              /* eslint-enable @typescript-eslint/naming-convention */
            }
          }
        ]
      }).orThrow();

      expect(lib.removeForIngredient(testEntry1.ingredientId)).toSucceed();
      expect(lib.hasForIngredient(testEntry1.ingredientId)).toBe(false);
      expect(lib.hasForIngredient(testEntry2.ingredientId)).toBe(true);
    });

    test('fails for non-existent ingredientId', () => {
      const lib = IngredientInventoryLibrary.create({
        builtin: false,
        collections: [
          {
            id: testCollectionId,
            isMutable: true,
            items: {}
          }
        ]
      }).orThrow();

      expect(lib.removeForIngredient('builtin.nonexistent' as IngredientId)).toFailWith(
        /no inventory entry/i
      );
    });
  });

  // ============================================================================
  // createCollection
  // ============================================================================

  describe('createCollection', () => {
    test('creates new mutable collection', () => {
      const lib = IngredientInventoryLibrary.create({ builtin: false }).orThrow();
      const newCollectionId = 'new-collection' as CollectionId;

      expect(lib.createCollection(newCollectionId)).toSucceedWith(newCollectionId);

      // Can add entries to the new collection
      expect(
        lib.addEntry(newCollectionId, 'entry-1' as IngredientInventoryEntryBaseId, testEntry1)
      ).toSucceed();
    });

    test('fails on duplicate collection ID', () => {
      const lib = IngredientInventoryLibrary.create({
        builtin: false,
        collections: [
          {
            id: testCollectionId,
            isMutable: true,
            items: {}
          }
        ]
      }).orThrow();

      expect(lib.createCollection(testCollectionId)).toFailWith(/already exists/i);
    });
  });
});
