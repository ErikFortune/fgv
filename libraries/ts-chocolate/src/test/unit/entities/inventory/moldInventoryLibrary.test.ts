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

import { MoldInventoryLibrary, IMoldInventoryEntryEntity } from '../../../../packlets/entities';
// eslint-disable-next-line @rushstack/packlets/mechanics
import {
  MoldInventoryEntryBaseId,
  MoldInventoryEntryId
} from '../../../../packlets/entities/inventory/model';
import { CollectionId, MoldId } from '../../../../packlets/common';

describe('MoldInventoryLibrary', () => {
  const testCollectionId = 'user-inventory' as CollectionId;

  const testEntry1: IMoldInventoryEntryEntity = {
    inventoryType: 'mold',
    moldId: 'builtin.half-sphere-24' as MoldId,
    count: 3
  };

  const testEntry2: IMoldInventoryEntryEntity = {
    inventoryType: 'mold',
    moldId: 'builtin.bar-mold-50g' as MoldId,
    count: 1,
    location: 'Workshop cabinet'
  };

  // ============================================================================
  // create
  // ============================================================================

  describe('create', () => {
    test('creates empty library with no params', () => {
      expect(MoldInventoryLibrary.create({ builtin: false })).toSucceed();
    });

    test('creates library with collections', () => {
      expect(
        MoldInventoryLibrary.create({
          builtin: false,
          collections: [
            {
              id: testCollectionId,
              isMutable: true,
              items: {
                /* eslint-disable @typescript-eslint/naming-convention */
                'half-sphere-inv': testEntry1
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

  describe('getForMold', () => {
    test('finds entry by moldId', () => {
      const lib = MoldInventoryLibrary.create({
        builtin: false,
        collections: [
          {
            id: testCollectionId,
            isMutable: true,
            items: {
              /* eslint-disable @typescript-eslint/naming-convention */
              'half-sphere-inv': testEntry1,
              'bar-mold-inv': testEntry2
              /* eslint-enable @typescript-eslint/naming-convention */
            }
          }
        ]
      }).orThrow();

      expect(lib.getForMold('builtin.half-sphere-24' as MoldId)).toSucceedAndSatisfy((entry) => {
        expect(entry.moldId).toBe('builtin.half-sphere-24');
        expect(entry.count).toBe(3);
      });
    });

    test('fails for non-existent moldId', () => {
      const lib = MoldInventoryLibrary.create({
        builtin: false,
        collections: [
          {
            id: testCollectionId,
            isMutable: true,
            items: {
              /* eslint-disable @typescript-eslint/naming-convention */
              'half-sphere-inv': testEntry1
              /* eslint-enable @typescript-eslint/naming-convention */
            }
          }
        ]
      }).orThrow();

      expect(lib.getForMold('builtin.nonexistent' as MoldId)).toFailWith(/no inventory entry/i);
    });
  });

  describe('hasForMold', () => {
    test('returns true when entry exists', () => {
      const lib = MoldInventoryLibrary.create({
        builtin: false,
        collections: [
          {
            id: testCollectionId,
            isMutable: true,
            items: {
              /* eslint-disable @typescript-eslint/naming-convention */
              'half-sphere-inv': testEntry1
              /* eslint-enable @typescript-eslint/naming-convention */
            }
          }
        ]
      }).orThrow();

      expect(lib.hasForMold('builtin.half-sphere-24' as MoldId)).toBe(true);
    });

    test('returns false when entry does not exist', () => {
      const lib = MoldInventoryLibrary.create({
        builtin: false,
        collections: [
          {
            id: testCollectionId,
            isMutable: true,
            items: {
              /* eslint-disable @typescript-eslint/naming-convention */
              'half-sphere-inv': testEntry1
              /* eslint-enable @typescript-eslint/naming-convention */
            }
          }
        ]
      }).orThrow();

      expect(lib.hasForMold('builtin.nonexistent' as MoldId)).toBe(false);
    });
  });

  describe('getAllEntries', () => {
    test('returns all entries across collections', () => {
      const lib = MoldInventoryLibrary.create({
        builtin: false,
        collections: [
          {
            id: testCollectionId,
            isMutable: true,
            items: {
              /* eslint-disable @typescript-eslint/naming-convention */
              'half-sphere-inv': testEntry1,
              'bar-mold-inv': testEntry2
              /* eslint-enable @typescript-eslint/naming-convention */
            }
          }
        ]
      }).orThrow();

      expect(lib.getAllEntries()).toHaveLength(2);
    });

    test('returns empty array for empty library', () => {
      const lib = MoldInventoryLibrary.create({ builtin: false }).orThrow();
      expect(lib.getAllEntries()).toHaveLength(0);
    });
  });

  // ============================================================================
  // Write methods
  // ============================================================================

  describe('addEntry', () => {
    test('adds entry to mutable collection', () => {
      const lib = MoldInventoryLibrary.create({
        builtin: false,
        collections: [
          {
            id: testCollectionId,
            isMutable: true,
            items: {}
          }
        ]
      }).orThrow();

      expect(lib.addEntry(testCollectionId, 'new-mold' as MoldInventoryEntryBaseId, testEntry1)).toSucceed();

      expect(lib.hasForMold(testEntry1.moldId)).toBe(true);
    });

    test('fails on duplicate entry', () => {
      const lib = MoldInventoryLibrary.create({
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
        lib.addEntry(testCollectionId, 'existing-entry' as MoldInventoryEntryBaseId, testEntry2)
      ).toFail();
    });
  });

  describe('upsertEntry', () => {
    test('inserts new entry', () => {
      const lib = MoldInventoryLibrary.create({
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
        lib.upsertEntry(testCollectionId, 'new-mold' as MoldInventoryEntryBaseId, testEntry1)
      ).toSucceed();

      expect(lib.hasForMold(testEntry1.moldId)).toBe(true);
    });

    test('updates existing entry', () => {
      const lib = MoldInventoryLibrary.create({
        builtin: false,
        collections: [
          {
            id: testCollectionId,
            isMutable: true,
            items: {
              /* eslint-disable @typescript-eslint/naming-convention */
              'half-sphere-inv': testEntry1
              /* eslint-enable @typescript-eslint/naming-convention */
            }
          }
        ]
      }).orThrow();

      const updatedEntry: IMoldInventoryEntryEntity = {
        ...testEntry1,
        count: 5
      };

      expect(
        lib.upsertEntry(testCollectionId, 'half-sphere-inv' as MoldInventoryEntryBaseId, updatedEntry)
      ).toSucceed();

      expect(lib.getForMold(testEntry1.moldId)).toSucceedAndSatisfy((entry) => {
        expect(entry.count).toBe(5);
      });
    });
  });

  describe('removeEntry', () => {
    test('removes entry by composite ID', () => {
      const lib = MoldInventoryLibrary.create({
        builtin: false,
        collections: [
          {
            id: testCollectionId,
            isMutable: true,
            items: {
              /* eslint-disable @typescript-eslint/naming-convention */
              'half-sphere-inv': testEntry1
              /* eslint-enable @typescript-eslint/naming-convention */
            }
          }
        ]
      }).orThrow();

      const compositeId = `${testCollectionId}.half-sphere-inv` as MoldInventoryEntryId;
      expect(lib.removeEntry(compositeId)).toSucceedAndSatisfy((removed) => {
        expect(removed.moldId).toBe(testEntry1.moldId);
      });

      expect(lib.hasForMold(testEntry1.moldId)).toBe(false);
    });

    test('fails for non-existent entry', () => {
      const lib = MoldInventoryLibrary.create({
        builtin: false,
        collections: [
          {
            id: testCollectionId,
            isMutable: true,
            items: {}
          }
        ]
      }).orThrow();

      expect(lib.removeEntry(`${testCollectionId}.nonexistent` as MoldInventoryEntryId)).toFailWith(
        /not found/i
      );
    });

    test('fails for immutable collection', () => {
      const lib = MoldInventoryLibrary.create({
        builtin: false,
        collections: [
          {
            id: testCollectionId,
            isMutable: false,
            items: {
              /* eslint-disable @typescript-eslint/naming-convention */
              'half-sphere-inv': testEntry1
              /* eslint-enable @typescript-eslint/naming-convention */
            }
          }
        ]
      }).orThrow();

      expect(lib.removeEntry(`${testCollectionId}.half-sphere-inv` as MoldInventoryEntryId)).toFailWith(
        /immutable/i
      );
    });
  });

  describe('removeForMold', () => {
    test('removes entry by moldId', () => {
      const lib = MoldInventoryLibrary.create({
        builtin: false,
        collections: [
          {
            id: testCollectionId,
            isMutable: true,
            items: {
              /* eslint-disable @typescript-eslint/naming-convention */
              'half-sphere-inv': testEntry1,
              'bar-mold-inv': testEntry2
              /* eslint-enable @typescript-eslint/naming-convention */
            }
          }
        ]
      }).orThrow();

      expect(lib.removeForMold(testEntry1.moldId)).toSucceed();
      expect(lib.hasForMold(testEntry1.moldId)).toBe(false);
      expect(lib.hasForMold(testEntry2.moldId)).toBe(true);
    });

    test('fails for non-existent moldId', () => {
      const lib = MoldInventoryLibrary.create({
        builtin: false,
        collections: [
          {
            id: testCollectionId,
            isMutable: true,
            items: {}
          }
        ]
      }).orThrow();

      expect(lib.removeForMold('builtin.nonexistent' as MoldId)).toFailWith(/no inventory entry/i);
    });
  });

  // ============================================================================
  // createCollection
  // ============================================================================

  describe('createCollection', () => {
    test('creates new mutable collection', () => {
      const lib = MoldInventoryLibrary.create({ builtin: false }).orThrow();
      const newCollectionId = 'new-collection' as CollectionId;

      expect(lib.createCollection(newCollectionId)).toSucceedWith(newCollectionId);

      expect(lib.addEntry(newCollectionId, 'entry-1' as MoldInventoryEntryBaseId, testEntry1)).toSucceed();
    });

    test('fails on duplicate collection ID', () => {
      const lib = MoldInventoryLibrary.create({
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
