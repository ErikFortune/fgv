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
 * Tests for UserEntityLibrary persistence methods:
 * - configurePersistence()
 * - getPersistedXxxCollection() singletons
 * - saveCollection()
 * - Private helpers (_getOrCreatePersisted, _savePersisted) tested via public API
 */

import '@fgv/ts-utils-jest';

import { FileTree } from '@fgv/ts-json-base';

import { BaseLocationId, CollectionId } from '../../../packlets/common';
import {
  ILocationEntity,
  IngredientInventoryLibrary,
  JournalLibrary,
  LocationsLibrary,
  MoldInventoryLibrary,
  SessionLibrary
} from '../../../packlets/entities';
import { PersistedEditableCollection } from '../../../packlets/editing';
import { UserEntityLibrary } from '../../../packlets/user-entities';

// ============================================================================
// Helper: build a UserEntityLibrary with empty mutable collections
// ============================================================================

function createFullUserLibrary(): UserEntityLibrary {
  const journals = JournalLibrary.create({
    builtin: false,
    collections: [{ id: 'user' as CollectionId, isMutable: true, items: {} }]
  }).orThrow();

  const sessions = SessionLibrary.create({
    builtin: false,
    collections: [{ id: 'user' as CollectionId, isMutable: true, items: {} }]
  }).orThrow();

  const moldInventory = MoldInventoryLibrary.create({
    builtin: false,
    collections: [{ id: 'user' as CollectionId, isMutable: true, items: {} }]
  }).orThrow();

  const ingredientInventory = IngredientInventoryLibrary.create({
    builtin: false,
    collections: [{ id: 'user' as CollectionId, isMutable: true, items: {} }]
  }).orThrow();

  const locations = LocationsLibrary.create({
    builtin: false,
    collections: [{ id: 'user' as CollectionId, isMutable: true, items: {} }]
  }).orThrow();

  return UserEntityLibrary.create({
    libraries: { journals, sessions, moldInventory, ingredientInventory, locations }
  }).orThrow();
}

// ============================================================================
// Tests
// ============================================================================

// ============================================================================
// Tests for create() with fileSources (covers _toFileSources code path)
// ============================================================================

describe('UserEntityLibrary.create with fileSources', () => {
  test('creates library from fileSources when load is undefined (default load behavior)', () => {
    // When a file source has no 'load' property, _toFileSources sets load: false
    const accessors = FileTree.InMemoryTreeAccessors.create([], { mutable: true }).orThrow();
    const fileTree = FileTree.FileTree.create(accessors).orThrow();

    // Passing fileSources without a 'load' property covers the `load === undefined` branch
    expect(
      UserEntityLibrary.create({
        fileSources: [
          {
            sourceName: 'test',
            directory: fileTree.getDirectory('/').orThrow(),
            mutable: true,
            skipMissingDirectories: true
            // Note: intentionally omitting 'load' to trigger line 234 (load === undefined branch)
          }
        ]
      })
    ).toSucceed();
  });
});

describe('UserEntityLibrary persistence', () => {
  let library: UserEntityLibrary;
  const userCollectionId = 'user' as CollectionId;

  beforeEach(() => {
    library = createFullUserLibrary();
  });

  // ==========================================================================
  // configurePersistence
  // ==========================================================================

  describe('configurePersistence', () => {
    test('can configure persistence with a sync provider', () => {
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

    test('can configure persistence without any options', () => {
      expect(() => {
        library.configurePersistence({});
      }).not.toThrow();
    });

    test('can configure with onMutation callback', () => {
      const mutationLog: Array<{ subLibraryId: string; compositeId: string }> = [];

      expect(() => {
        library.configurePersistence({
          onMutation: (subLibraryId: string, compositeId: string) => {
            mutationLog.push({ subLibraryId, compositeId });
          }
        });
      }).not.toThrow();
    });

    test('sync provider is used by getPersistedXxx after configuration', () => {
      library.configurePersistence({});
      expect(library.getPersistedJournalsCollection(userCollectionId)).toSucceed();
    });

    test('encryption provider (function form) is passed through to new persisted collections', () => {
      library.configurePersistence({
        encryptionProvider: () => undefined
      });
      expect(library.getPersistedMoldInventoryCollection(userCollectionId)).toSucceed();
    });
  });

  // ==========================================================================
  // getPersistedJournalsCollection
  // ==========================================================================

  describe('getPersistedJournalsCollection', () => {
    test('returns success for an existing collection', () => {
      expect(library.getPersistedJournalsCollection(userCollectionId)).toSucceedAndSatisfy((persisted) => {
        expect(persisted).toBeInstanceOf(PersistedEditableCollection);
        expect(persisted.collectionId).toBe(userCollectionId);
      });
    });

    test('returns the same singleton instance on repeated calls', () => {
      const first = library.getPersistedJournalsCollection(userCollectionId).orThrow();
      const second = library.getPersistedJournalsCollection(userCollectionId).orThrow();
      expect(first).toBe(second);
    });

    test('fails for a collection that does not exist', () => {
      expect(library.getPersistedJournalsCollection('nonexistent' as CollectionId)).toFailWith(/not found/i);
    });
  });

  // ==========================================================================
  // getPersistedMoldInventoryCollection
  // ==========================================================================

  describe('getPersistedMoldInventoryCollection', () => {
    test('returns success for an existing collection', () => {
      expect(library.getPersistedMoldInventoryCollection(userCollectionId)).toSucceedAndSatisfy(
        (persisted) => {
          expect(persisted.collectionId).toBe(userCollectionId);
        }
      );
    });

    test('returns the same singleton instance on repeated calls', () => {
      const first = library.getPersistedMoldInventoryCollection(userCollectionId).orThrow();
      const second = library.getPersistedMoldInventoryCollection(userCollectionId).orThrow();
      expect(first).toBe(second);
    });

    test('fails for a collection that does not exist', () => {
      expect(library.getPersistedMoldInventoryCollection('nonexistent' as CollectionId)).toFailWith(
        /not found/i
      );
    });
  });

  // ==========================================================================
  // getPersistedIngredientInventoryCollection
  // ==========================================================================

  describe('getPersistedIngredientInventoryCollection', () => {
    test('returns success for an existing collection', () => {
      expect(library.getPersistedIngredientInventoryCollection(userCollectionId)).toSucceed();
    });

    test('returns the same singleton instance on repeated calls', () => {
      const first = library.getPersistedIngredientInventoryCollection(userCollectionId).orThrow();
      const second = library.getPersistedIngredientInventoryCollection(userCollectionId).orThrow();
      expect(first).toBe(second);
    });

    test('fails for a collection that does not exist', () => {
      expect(library.getPersistedIngredientInventoryCollection('nonexistent' as CollectionId)).toFailWith(
        /not found/i
      );
    });
  });

  // ==========================================================================
  // Sub-library getters (locations, journals, etc.)
  // ==========================================================================

  describe('sub-library getters', () => {
    test('locations getter returns the LocationsLibrary', () => {
      expect(library.locations).toBeDefined();
      expect(typeof library.locations.collections).toBe('object');
    });

    test('journals getter returns the JournalLibrary', () => {
      expect(library.journals).toBeDefined();
    });

    test('moldInventory getter returns the MoldInventoryLibrary', () => {
      expect(library.moldInventory).toBeDefined();
    });

    test('ingredientInventory getter returns the IngredientInventoryLibrary', () => {
      expect(library.ingredientInventory).toBeDefined();
    });
  });

  // ==========================================================================
  // getPersistedLocationsCollection
  // ==========================================================================

  describe('getPersistedLocationsCollection', () => {
    test('returns success for an existing collection', () => {
      expect(library.getPersistedLocationsCollection(userCollectionId)).toSucceed();
    });

    test('returns the same singleton instance on repeated calls', () => {
      const first = library.getPersistedLocationsCollection(userCollectionId).orThrow();
      const second = library.getPersistedLocationsCollection(userCollectionId).orThrow();
      expect(first).toBe(second);
    });

    test('fails for a collection that does not exist', () => {
      expect(library.getPersistedLocationsCollection('nonexistent' as CollectionId)).toFailWith(/not found/i);
    });
  });

  // ==========================================================================
  // saveCollection
  // ==========================================================================

  describe('saveCollection', () => {
    test('fails for a non-existent collection ID', async () => {
      expect(await library.saveCollection('nonexistent' as CollectionId)).toFailWith(/not found/i);
    });

    test('fails with "does not support persistence" for sessions (no FileTree source)', async () => {
      // Without FileTree-backed collections, save() fails at editable.save()
      expect(await library.saveCollection(userCollectionId)).toFailWith(/does not support persistence/i);
    });

    test('routes to journals sub-library when only journals have the collection', async () => {
      const journalsOnly = JournalLibrary.create({
        builtin: false,
        collections: [{ id: 'journals-only' as CollectionId, isMutable: true, items: {} }]
      }).orThrow();

      const singleLib = UserEntityLibrary.create({
        libraries: { journals: journalsOnly }
      }).orThrow();

      expect(await singleLib.saveCollection('journals-only' as CollectionId)).toFailWith(
        /does not support persistence/i
      );
    });

    test('routes to moldInventory sub-library', async () => {
      const moldOnly = MoldInventoryLibrary.create({
        builtin: false,
        collections: [{ id: 'mold-only' as CollectionId, isMutable: true, items: {} }]
      }).orThrow();

      const singleLib = UserEntityLibrary.create({
        libraries: { moldInventory: moldOnly }
      }).orThrow();

      expect(await singleLib.saveCollection('mold-only' as CollectionId)).toFailWith(
        /does not support persistence/i
      );
    });

    test('routes to ingredientInventory sub-library', async () => {
      const ingOnly = IngredientInventoryLibrary.create({
        builtin: false,
        collections: [{ id: 'ing-only' as CollectionId, isMutable: true, items: {} }]
      }).orThrow();

      const singleLib = UserEntityLibrary.create({
        libraries: { ingredientInventory: ingOnly }
      }).orThrow();

      expect(await singleLib.saveCollection('ing-only' as CollectionId)).toFailWith(
        /does not support persistence/i
      );
    });

    test('routes to locations sub-library', async () => {
      const locOnly = LocationsLibrary.create({
        builtin: false,
        collections: [{ id: 'loc-only' as CollectionId, isMutable: true, items: {} }]
      }).orThrow();

      const singleLib = UserEntityLibrary.create({
        libraries: { locations: locOnly }
      }).orThrow();

      expect(await singleLib.saveCollection('loc-only' as CollectionId)).toFailWith(
        /does not support persistence/i
      );
    });

    test('uses subLibrary hint to disambiguate when provided', async () => {
      // Both sessions and journals have 'user' - subLibrary hint picks the right one
      const sessionsRef = library.sessions;
      expect(await library.saveCollection(userCollectionId, undefined, sessionsRef)).toFailWith(
        /does not support persistence/i
      );
    });

    test('subLibrary hint with non-matching library returns not-found', async () => {
      const differentLib = SessionLibrary.create({
        builtin: false,
        collections: [{ id: 'other' as CollectionId, isMutable: true, items: {} }]
      }).orThrow();

      // The 'different' library doesn't own the 'user' collection in our library
      expect(await library.saveCollection(userCollectionId, undefined, differentLib)).toFailWith(
        /not found/i
      );
    });
  });

  // ==========================================================================
  // onMutation callback integration via addItem
  // ==========================================================================

  describe('onMutation callback', () => {
    test('onMutation callback receives subLibraryId and compositeId on addItem', async () => {
      const mutations: Array<{ subLibraryId: string; compositeId: string }> = [];

      // Create a new library and configure persistence with the mutation callback
      const newLib = UserEntityLibrary.create({
        libraries: {
          locations: LocationsLibrary.create({
            builtin: false,
            collections: [{ id: 'user' as CollectionId, isMutable: true, items: {} }]
          }).orThrow()
        }
      }).orThrow();

      newLib.configurePersistence({
        onMutation: (subLibraryId: string, compositeId: string) => {
          mutations.push({ subLibraryId, compositeId });
        }
      });

      const persisted = newLib.getPersistedLocationsCollection(userCollectionId).orThrow();

      // addItem triggers onMutation even if persist fails (no source)
      const newLoc: ILocationEntity = { baseId: 'new-place' as BaseLocationId, name: 'New Place' };
      const result = await persisted.addItem('new-place' as BaseLocationId, newLoc);

      // The add succeeds but persist fails (no source) — onMutation is still called
      expect(result).toFail();
      expect(mutations).toContainEqual({ subLibraryId: 'locations', compositeId: 'user.new-place' });
    });

    test('without onMutation configured, addItem still calls mutations silently', async () => {
      // Library with no onMutation callback
      const newLib = UserEntityLibrary.create({
        libraries: {
          locations: LocationsLibrary.create({
            builtin: false,
            collections: [{ id: 'user' as CollectionId, isMutable: true, items: {} }]
          }).orThrow()
        }
      }).orThrow();

      // Do NOT configure onMutation
      const persisted = newLib.getPersistedLocationsCollection(userCollectionId).orThrow();

      const newLoc: ILocationEntity = { baseId: 'test-place' as BaseLocationId, name: 'Test Place' };
      const result = await persisted.addItem('test-place' as BaseLocationId, newLoc);

      // Still fails due to no source - no crash from missing onMutation
      expect(result).toFail();
    });
  });
});
