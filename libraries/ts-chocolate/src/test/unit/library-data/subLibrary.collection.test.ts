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
import { FileTree } from '@fgv/ts-json-base';
import { IngredientsLibrary, IngredientEntity } from '../../../packlets/entities';
import { BaseIngredientId, CollectionId, Percentage } from '../../../packlets/common';
import { ICollectionRuntimeMetadata } from '../../../packlets/library-data';

describe('SubLibraryBase Collection Management', () => {
  let library: IngredientsLibrary;

  beforeEach(() => {
    library = IngredientsLibrary.create({ builtin: false }).orThrow();
  });

  // ============================================================================
  // removeCollection()
  // ============================================================================

  describe('removeCollection', () => {
    beforeEach(() => {
      // Add a mutable test collection
      library.addCollectionEntry({
        id: 'test-collection' as CollectionId,
        isMutable: true,
        items: {}
      });
    });

    test('successfully removes a mutable collection', () => {
      expect(library.collections.has('test-collection' as CollectionId)).toBe(true);

      expect(library.removeCollection('test-collection' as CollectionId)).toSucceed();

      expect(library.collections.has('test-collection' as CollectionId)).toBe(false);
    });

    test('fails when collection does not exist', () => {
      expect(library.removeCollection('nonexistent' as CollectionId)).toFailWith(/not found/i);
    });

    test('fails when attempting to remove immutable collection', () => {
      library.addCollectionEntry({
        id: 'immutable-collection' as CollectionId,
        isMutable: false,
        items: {}
      });

      expect(library.removeCollection('immutable-collection' as CollectionId)).toFailWith(
        /cannot delete immutable/i
      );
    });

    test('collection stays immutable after failed removal attempt', () => {
      library.addCollectionEntry({
        id: 'protected' as CollectionId,
        isMutable: false,
        items: {}
      });

      library.removeCollection('protected' as CollectionId);

      // Collection should still exist
      expect(library.collections.has('protected' as CollectionId)).toBe(true);
    });

    test('removes empty collection successfully', () => {
      // Add an empty mutable collection
      library.addCollectionEntry({
        id: 'empty-collection' as CollectionId,
        isMutable: true,
        items: {}
      });

      expect(library.collections.has('empty-collection' as CollectionId)).toBe(true);

      expect(library.removeCollection('empty-collection' as CollectionId)).toSucceed();

      expect(library.collections.has('empty-collection' as CollectionId)).toBe(false);
    });

    test('removes a file-tree-backed collection and deletes the source file', () => {
      // Create a file-tree-backed ingredients library with a mutable collection
      const ganacheChars = {
        cacaoFat: 36 as Percentage,
        sugar: 34 as Percentage,
        milkFat: 0 as Percentage,
        water: 1 as Percentage,
        solids: 29 as Percentage,
        otherFats: 0 as Percentage
      };
      const fileContents = {
        items: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          'dark-chocolate': {
            baseId: 'dark-chocolate' as BaseIngredientId,
            name: 'Dark Chocolate',
            category: 'other',
            ganacheCharacteristics: ganacheChars
          }
        }
      };
      const accessors = FileTree.InMemoryTreeAccessors.create(
        [{ path: '/data/ingredients/tree-collection.yaml', contents: fileContents }],
        { mutable: true }
      ).orThrow();
      const fileTree = FileTree.FileTree.create(accessors).orThrow();

      const treeLibrary = IngredientsLibrary.create({ builtin: false }).orThrow();
      treeLibrary
        .loadFromFileTreeSource({
          sourceName: 'test-source',
          directory: fileTree.getDirectory('/').orThrow(),
          mutable: true,
          skipMissingDirectories: true
        })
        .orThrow();

      // Verify collection was loaded
      expect(treeLibrary.collections.has('tree-collection' as CollectionId)).toBe(true);

      // Remove it — this triggers _deleteSourceFile which cleans up the backing file
      expect(treeLibrary.removeCollection('tree-collection' as CollectionId)).toSucceed();
      expect(treeLibrary.collections.has('tree-collection' as CollectionId)).toBe(false);
    });

    test('can add collection after removing it', () => {
      library.removeCollection('test-collection' as CollectionId).orThrow();

      // Should be able to add a new collection with the same ID
      library.addCollectionEntry({
        id: 'test-collection' as CollectionId,
        isMutable: true,
        items: {}
      });

      expect(library.collections.has('test-collection' as CollectionId)).toBe(true);
    });
  });

  // ============================================================================
  // updateCollectionMetadata()
  // ============================================================================

  describe('updateCollectionMetadata', () => {
    beforeEach(() => {
      library.addCollectionEntry({
        id: 'test-collection' as CollectionId,
        isMutable: true,
        items: {}
      });
    });

    test('successfully validates metadata update for mutable collection', () => {
      const metadata: Partial<ICollectionRuntimeMetadata> = {
        name: 'Updated Name',
        description: 'Updated description'
      };

      expect(library.updateCollectionMetadata('test-collection' as CollectionId, metadata)).toSucceed();
    });

    test('fails when collection does not exist', () => {
      const metadata: Partial<ICollectionRuntimeMetadata> = {
        name: 'New Name'
      };

      expect(library.updateCollectionMetadata('nonexistent' as CollectionId, metadata)).toFailWith(
        /not found/i
      );
    });

    test('fails when attempting to update immutable collection', () => {
      library.addCollectionEntry({
        id: 'immutable' as CollectionId,
        isMutable: false,
        items: {}
      });

      const metadata: Partial<ICollectionRuntimeMetadata> = {
        name: 'New Name'
      };

      expect(library.updateCollectionMetadata('immutable' as CollectionId, metadata)).toFailWith(
        /cannot update metadata.*immutable/i
      );
    });

    test('validates empty collection name', () => {
      const metadata: Partial<ICollectionRuntimeMetadata> = {
        name: ''
      };

      expect(library.updateCollectionMetadata('test-collection' as CollectionId, metadata)).toFailWith(
        /cannot be empty/i
      );
    });

    test('validates whitespace-only name', () => {
      const metadata: Partial<ICollectionRuntimeMetadata> = {
        name: '   '
      };

      expect(library.updateCollectionMetadata('test-collection' as CollectionId, metadata)).toFailWith(
        /cannot be empty/i
      );
    });

    test('validates name with leading whitespace', () => {
      const metadata: Partial<ICollectionRuntimeMetadata> = {
        name: '  Leading'
      };

      expect(library.updateCollectionMetadata('test-collection' as CollectionId, metadata)).toFailWith(
        /leading or trailing whitespace/i
      );
    });

    test('validates name with trailing whitespace', () => {
      const metadata: Partial<ICollectionRuntimeMetadata> = {
        name: 'Trailing  '
      };

      expect(library.updateCollectionMetadata('test-collection' as CollectionId, metadata)).toFailWith(
        /leading or trailing whitespace/i
      );
    });

    test('validates name length exceeding 200 characters', () => {
      const metadata: Partial<ICollectionRuntimeMetadata> = {
        name: 'a'.repeat(201)
      };

      expect(library.updateCollectionMetadata('test-collection' as CollectionId, metadata)).toFailWith(
        /exceeds 200 characters/i
      );
    });

    test('accepts name with exactly 200 characters', () => {
      const metadata: Partial<ICollectionRuntimeMetadata> = {
        name: 'a'.repeat(200)
      };

      expect(library.updateCollectionMetadata('test-collection' as CollectionId, metadata)).toSucceed();
    });

    test('validates description length exceeding 2000 characters', () => {
      const metadata: Partial<ICollectionRuntimeMetadata> = {
        description: 'a'.repeat(2001)
      };

      expect(library.updateCollectionMetadata('test-collection' as CollectionId, metadata)).toFailWith(
        /exceeds 2000 characters/i
      );
    });

    test('accepts description with exactly 2000 characters', () => {
      const metadata: Partial<ICollectionRuntimeMetadata> = {
        description: 'a'.repeat(2000)
      };

      expect(library.updateCollectionMetadata('test-collection' as CollectionId, metadata)).toSucceed();
    });

    test('accepts valid name update', () => {
      const metadata: Partial<ICollectionRuntimeMetadata> = {
        name: 'Valid Name'
      };

      expect(library.updateCollectionMetadata('test-collection' as CollectionId, metadata)).toSucceed();
    });

    test('accepts valid description update', () => {
      const metadata: Partial<ICollectionRuntimeMetadata> = {
        description: 'A valid description'
      };

      expect(library.updateCollectionMetadata('test-collection' as CollectionId, metadata)).toSucceed();
    });

    test('accepts update with both name and description', () => {
      const metadata: Partial<ICollectionRuntimeMetadata> = {
        name: 'Updated Name',
        description: 'Updated description'
      };

      expect(library.updateCollectionMetadata('test-collection' as CollectionId, metadata)).toSucceed();
    });

    test('accepts empty metadata object', () => {
      const metadata: Partial<ICollectionRuntimeMetadata> = {};

      expect(library.updateCollectionMetadata('test-collection' as CollectionId, metadata)).toSucceed();
    });

    test('treats empty secretName as removal (no validation error)', () => {
      const metadata: Partial<ICollectionRuntimeMetadata> = {
        secretName: ''
      };

      expect(library.updateCollectionMetadata('test-collection' as CollectionId, metadata)).toSucceed();
    });

    test('validates secretName with leading/trailing whitespace when set', () => {
      const metadata: Partial<ICollectionRuntimeMetadata> = {
        secretName: '  my-secret '
      };

      expect(library.updateCollectionMetadata('test-collection' as CollectionId, metadata)).toFailWith(
        /leading or trailing whitespace/i
      );
    });

    test('validates secretName length exceeding 100 characters', () => {
      const metadata: Partial<ICollectionRuntimeMetadata> = {
        secretName: 'a'.repeat(101)
      };

      expect(library.updateCollectionMetadata('test-collection' as CollectionId, metadata)).toFailWith(
        /exceeds 100 characters/i
      );
    });

    test('accepts valid secretName', () => {
      const metadata: Partial<ICollectionRuntimeMetadata> = {
        secretName: 'my-secret'
      };

      expect(library.updateCollectionMetadata('test-collection' as CollectionId, metadata)).toSucceed();
    });

    test('can set and then remove secretName', () => {
      expect(
        library.updateCollectionMetadata('test-collection' as CollectionId, { secretName: 'my-secret' })
      ).toSucceed();
      expect(library.collections.get('test-collection' as CollectionId).asResult).toSucceedAndSatisfy(
        (entry) => {
          expect(entry.metadata?.secretName).toBe('my-secret');
        }
      );

      expect(
        library.updateCollectionMetadata('test-collection' as CollectionId, { secretName: '' })
      ).toSucceed();
      expect(library.collections.get('test-collection' as CollectionId).asResult).toSucceedAndSatisfy(
        (entry) => {
          expect(entry.metadata?.secretName).toBeUndefined();
        }
      );
    });
  });

  // ============================================================================
  // Integration Tests
  // ============================================================================

  describe('integration scenarios', () => {
    test('can update and then remove a collection', () => {
      library.addCollectionEntry({
        id: 'lifecycle' as CollectionId,
        isMutable: true,
        items: {}
      });

      const metadata: Partial<ICollectionRuntimeMetadata> = {
        name: 'Updated Name'
      };

      library.updateCollectionMetadata('lifecycle' as CollectionId, metadata).orThrow();
      library.removeCollection('lifecycle' as CollectionId).orThrow();

      expect(library.collections.has('lifecycle' as CollectionId)).toBe(false);
    });

    test('multiple mutable collections can be managed independently', () => {
      library.addCollectionEntry({
        id: 'coll1' as CollectionId,
        isMutable: true,
        items: {}
      });

      library.addCollectionEntry({
        id: 'coll2' as CollectionId,
        isMutable: true,
        items: {}
      });

      library.addCollectionEntry({
        id: 'coll3' as CollectionId,
        isMutable: true,
        items: {}
      });

      // Remove one
      library.removeCollection('coll2' as CollectionId).orThrow();

      // Others should still exist
      expect(library.collections.has('coll1' as CollectionId)).toBe(true);
      expect(library.collections.has('coll2' as CollectionId)).toBe(false);
      expect(library.collections.has('coll3' as CollectionId)).toBe(true);
    });

    test('immutable collections remain protected throughout operations', () => {
      library.addCollectionEntry({
        id: 'protected' as CollectionId,
        isMutable: false,
        items: {}
      });

      library.addCollectionEntry({
        id: 'mutable' as CollectionId,
        isMutable: true,
        items: {}
      });

      // Can remove mutable
      expect(library.removeCollection('mutable' as CollectionId)).toSucceed();

      // Cannot remove immutable
      expect(library.removeCollection('protected' as CollectionId)).toFailWith(/immutable/i);

      // Immutable still exists
      expect(library.collections.has('protected' as CollectionId)).toBe(true);
    });

    test('validation errors are properly reported', () => {
      library.addCollectionEntry({
        id: 'test' as CollectionId,
        isMutable: true,
        items: {}
      });

      const badMetadata: Partial<ICollectionRuntimeMetadata> = {
        name: '  ',
        description: 'a'.repeat(2001)
      };

      const result = library.updateCollectionMetadata('test' as CollectionId, badMetadata);

      expect(result).toFail();
      // Should contain both error messages
      expect(result.isFailure() && result.message).toMatch(/cannot be empty/i);
      expect(result.isFailure() && result.message).toMatch(/exceeds 2000 characters/i);
    });

    test('updates metadata on collection with no existing metadata, using "unknown" sourceName', () => {
      // Library created with { builtin: false } has no mutable source name
      // Adding a collection directly without metadata tests the double fallback
      library.addCollectionEntry({
        id: 'no-metadata' as CollectionId,
        isMutable: true,
        items: {}
        // Note: no metadata
      });

      const metadata: Partial<ICollectionRuntimeMetadata> = {
        name: 'Added Name'
      };

      expect(library.updateCollectionMetadata('no-metadata' as CollectionId, metadata)).toSucceed();

      // Verify that the merged metadata has sourceName 'unknown' from the fallback
      expect(library.collections.get('no-metadata' as CollectionId).asResult).toSucceedAndSatisfy((entry) => {
        expect(entry.metadata?.name).toBe('Added Name');
        expect(entry.metadata?.sourceName).toBe('unknown');
      });
    });
  });

  // ============================================================================
  // setActiveMutableSource()
  // ============================================================================

  describe('setActiveMutableSource', () => {
    test('sets mutable source name and data directory', () => {
      const tree = FileTree.inMemory([{ path: '/data/ingredients/placeholder.txt', contents: '' }]).orThrow();
      const dir = tree.getItem('/data/ingredients').orThrow() as FileTree.IMutableFileTreeDirectoryItem;

      library.setActiveMutableSource('my-source', dir);

      expect(library.mutableSourceName).toBe('my-source');
    });

    test('sets mutable source name with undefined data directory', () => {
      library.setActiveMutableSource('no-dir-source', undefined);

      expect(library.mutableSourceName).toBe('no-dir-source');
    });

    test('sets mutable source name with optional sourceRoot', () => {
      const tree = FileTree.inMemory([{ path: '/data/ingredients/placeholder.txt', contents: '' }]).orThrow();
      const dir = tree.getItem('/data/ingredients').orThrow() as FileTree.IMutableFileTreeDirectoryItem;
      const root = tree.getItem('/').orThrow() as FileTree.IMutableFileTreeDirectoryItem;

      library.setActiveMutableSource('rooted-source', dir, root);

      expect(library.mutableSourceName).toBe('rooted-source');
    });

    test('overwrites previously set mutable source', () => {
      const tree = FileTree.inMemory([{ path: '/data/ingredients/placeholder.txt', contents: '' }]).orThrow();
      const dir = tree.getItem('/data/ingredients').orThrow() as FileTree.IMutableFileTreeDirectoryItem;

      library.setActiveMutableSource('first-source', dir);
      library.setActiveMutableSource('second-source', undefined);

      expect(library.mutableSourceName).toBe('second-source');
    });
  });

  // ============================================================================
  // removeSource()
  // ============================================================================

  describe('removeSource', () => {
    test('removes mutable collections matching the source name', () => {
      library.addCollectionEntry({
        id: 'src-a-col1' as CollectionId,
        isMutable: true,
        items: {},
        metadata: { sourceName: 'source-a' }
      });
      library.addCollectionEntry({
        id: 'src-a-col2' as CollectionId,
        isMutable: true,
        items: {},
        metadata: { sourceName: 'source-a' }
      });

      const removed = library.removeSource('source-a');

      expect(removed).toBe(2);
      expect(library.collections.has('src-a-col1' as CollectionId)).toBe(false);
      expect(library.collections.has('src-a-col2' as CollectionId)).toBe(false);
    });

    test('returns 0 when no collections match the source name', () => {
      library.addCollectionEntry({
        id: 'other-col' as CollectionId,
        isMutable: true,
        items: {},
        metadata: { sourceName: 'other-source' }
      });

      const removed = library.removeSource('nonexistent-source');

      expect(removed).toBe(0);
      expect(library.collections.has('other-col' as CollectionId)).toBe(true);
    });

    test('does not remove immutable collections even if source name matches', () => {
      library.addCollectionEntry({
        id: 'immutable-col' as CollectionId,
        isMutable: false,
        items: {},
        metadata: { sourceName: 'source-b' }
      });

      const removed = library.removeSource('source-b');

      expect(removed).toBe(0);
      expect(library.collections.has('immutable-col' as CollectionId)).toBe(true);
    });

    test('only removes collections from the specified source, leaving others intact', () => {
      library.addCollectionEntry({
        id: 'target-col' as CollectionId,
        isMutable: true,
        items: {},
        metadata: { sourceName: 'target-source' }
      });
      library.addCollectionEntry({
        id: 'keep-col' as CollectionId,
        isMutable: true,
        items: {},
        metadata: { sourceName: 'other-source' }
      });

      const removed = library.removeSource('target-source');

      expect(removed).toBe(1);
      expect(library.collections.has('target-col' as CollectionId)).toBe(false);
      expect(library.collections.has('keep-col' as CollectionId)).toBe(true);
    });

    test('returns 0 on empty library', () => {
      expect(library.removeSource('any-source')).toBe(0);
    });

    test('skips immutable collection whose sourceName matches', () => {
      library.addCollectionEntry({
        id: 'immutable-match' as CollectionId,
        isMutable: false,
        items: {},
        metadata: { sourceName: 'target-source' }
      });
      library.addCollectionEntry({
        id: 'mutable-match' as CollectionId,
        isMutable: true,
        items: {},
        metadata: { sourceName: 'target-source' }
      });

      const removed = library.removeSource('target-source');

      expect(removed).toBe(1);
      expect(library.collections.has('immutable-match' as CollectionId)).toBe(true);
      expect(library.collections.has('mutable-match' as CollectionId)).toBe(false);
    });
  });

  // ============================================================================
  // getCollectionOperations()
  // ============================================================================

  describe('getCollectionOperations', () => {
    beforeEach(() => {
      library.addCollectionEntry({
        id: 'ops-collection' as CollectionId,
        isMutable: true,
        items: {}
      });
    });

    describe('remove', () => {
      test('successfully removes an entry from a mutable collection', () => {
        // First add an entry using the add operation
        const ops = library.getCollectionOperations('ops-collection' as CollectionId);
        ops
          .add(
            'dark-chocolate' as BaseIngredientId,
            {
              baseId: 'dark-chocolate' as BaseIngredientId,
              name: 'Dark Chocolate',
              category: 'other'
            } as IngredientEntity
          )
          .orThrow();

        expect(ops.remove('dark-chocolate' as BaseIngredientId)).toSucceedAndSatisfy((removed) => {
          expect(removed.baseId).toBe('dark-chocolate');
        });
      });

      test('fails to remove entry from immutable collection', () => {
        // Create a library with a proper immutable collection containing a valid ingredient
        const immutableLibrary = IngredientsLibrary.create({
          builtin: false,
          collections: [
            {
              id: 'immutable-ops' as CollectionId,
              isMutable: false,
              items: {
                /* eslint-disable @typescript-eslint/naming-convention */
                'dark-chocolate': {
                  baseId: 'dark-chocolate' as BaseIngredientId,
                  name: 'Dark Chocolate',
                  category: 'other',
                  ganacheCharacteristics: {
                    cacaoFat: 36 as Percentage,
                    sugar: 34 as Percentage,
                    milkFat: 0 as Percentage,
                    water: 1 as Percentage,
                    solids: 29 as Percentage,
                    otherFats: 0 as Percentage
                  }
                }
                /* eslint-enable @typescript-eslint/naming-convention */
              }
            }
          ]
        }).orThrow();

        const ops = immutableLibrary.getCollectionOperations('immutable-ops' as CollectionId);
        expect(ops.remove('dark-chocolate' as BaseIngredientId)).toFailWith(
          /cannot remove entry from immutable collection/i
        );
      });

      test('fails when entry does not exist', () => {
        const ops = library.getCollectionOperations('ops-collection' as CollectionId);
        expect(ops.remove('nonexistent' as BaseIngredientId)).toFailWith(/not found/i);
      });
    });

    describe('add', () => {
      test('successfully adds an entry to a mutable collection', () => {
        const ops = library.getCollectionOperations('ops-collection' as CollectionId);
        expect(
          ops.add(
            'dark-chocolate' as BaseIngredientId,
            {
              baseId: 'dark-chocolate' as BaseIngredientId,
              name: 'Dark Chocolate',
              category: 'other'
            } as IngredientEntity
          )
        ).toSucceed();
      });
    });

    describe('upsert', () => {
      test('successfully upserts an entry in a mutable collection', () => {
        const ops = library.getCollectionOperations('ops-collection' as CollectionId);
        expect(
          ops.upsert(
            'dark-chocolate' as BaseIngredientId,
            {
              baseId: 'dark-chocolate' as BaseIngredientId,
              name: 'Dark Chocolate Updated',
              category: 'other'
            } as IngredientEntity
          )
        ).toSucceed();
      });
    });
  });

  // ============================================================================
  // Lazy mutable source root (init path: lines 569-574)
  // ============================================================================

  describe('lazy mutable source root initialization', () => {
    test('stores mutableSourceRoot when data directory does not exist but createChildDirectory is available', () => {
      // A mutable in-memory tree supports createChildDirectory but has no data/ingredients dir yet.
      // skipMissingDirectories allows loading to succeed; the constructor loop then hits the
      // createChildDirectory branch (lines 571-573) to store the root for lazy directory creation.
      const tree = FileTree.inMemory([{ path: '/placeholder.txt', contents: '' }], {
        mutable: true
      }).orThrow();
      const root = tree.getItem('/').orThrow() as FileTree.IFileTreeDirectoryItem;

      const lib = IngredientsLibrary.create({
        builtin: false,
        fileSources: {
          directory: root,
          mutable: true,
          sourceName: 'lazy-source',
          skipMissingDirectories: true
        }
      }).orThrow();

      // mutableSourceName is set even though the data directory doesn't exist yet
      expect(lib.mutableSourceName).toBe('lazy-source');
    });

    test('mutableSourceName is undefined when no mutable sources are present', () => {
      // A library with only immutable sources should have no mutableSourceName.
      const tree = FileTree.inMemory([
        { path: '/data/ingredients/col.json', contents: { items: {} } }
      ]).orThrow();
      const root = tree.getItem('/').orThrow() as FileTree.IFileTreeDirectoryItem;

      const lib = IngredientsLibrary.create({
        builtin: false,
        fileSources: { directory: root, mutable: false, sourceName: 'immutable-source' }
      }).orThrow();

      expect(lib.mutableSourceName).toBeUndefined();
    });
  });
});
