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
import { fail, succeed } from '@fgv/ts-utils';
import { CollectionManager } from '../../../packlets/editing';
import { IngredientsLibrary } from '../../../packlets/entities';
import { CollectionId } from '../../../packlets/common';
import { ICollectionFileMetadata, ICollectionRuntimeMetadata } from '../../../packlets/library-data';

describe('CollectionManager', () => {
  let library: IngredientsLibrary;
  let manager: CollectionManager<string, string, unknown>;

  beforeEach(() => {
    library = IngredientsLibrary.create({ builtin: false }).orThrow();
    manager = new CollectionManager(library);
  });

  // ============================================================================
  // Constructor
  // ============================================================================

  describe('constructor', () => {
    test('creates manager with library', () => {
      expect(manager).toBeDefined();
      expect(manager.getAll()).toBeDefined();
    });
  });

  // ============================================================================
  // getAll()
  // ============================================================================

  describe('getAll', () => {
    test('returns empty array for new library', () => {
      const collections = manager.getAll();
      expect(collections).toEqual([]);
    });

    test('returns all collection IDs after creating collections', () => {
      const metadata: ICollectionFileMetadata = {
        name: 'Test Collection'
      };

      manager.create('coll1' as CollectionId, metadata).orThrow();
      manager.create('coll2' as CollectionId, metadata).orThrow();

      const collections = manager.getAll();
      expect(collections.length).toBe(2);
      expect(collections).toContain('coll1' as CollectionId);
      expect(collections).toContain('coll2' as CollectionId);
    });
  });

  // ============================================================================
  // get()
  // ============================================================================

  describe('get', () => {
    test('returns metadata for existing collection', () => {
      const metadata: ICollectionFileMetadata = {
        name: 'Test Collection',
        description: 'A test collection'
      };

      manager.create('test-coll' as CollectionId, metadata).orThrow();

      expect(manager.get('test-coll' as CollectionId)).toSucceedAndSatisfy((result) => {
        expect(result).toBeDefined();
      });
    });

    test('fails for non-existent collection', () => {
      expect(manager.get('nonexistent' as CollectionId)).toFailWith(/not found/i);
    });

    test('fails when collection has no metadata', () => {
      // Add collection directly to library without metadata
      library.addCollectionEntry({
        id: 'no-metadata' as CollectionId,
        isMutable: true,
        items: {}
        // Note: no metadata field
      });

      expect(manager.get('no-metadata' as CollectionId)).toFailWith(/has no metadata/i);
    });
  });

  // ============================================================================
  // create()
  // ============================================================================

  describe('create', () => {
    test('creates collection with valid metadata', () => {
      const metadata: ICollectionFileMetadata = {
        name: 'New Collection',
        description: 'A new test collection'
      };

      expect(manager.create('new-coll' as CollectionId, metadata)).toSucceed();
      expect(manager.exists('new-coll' as CollectionId)).toBe(true);
    });

    test('creates collection with minimal metadata', () => {
      const metadata: ICollectionFileMetadata = {
        name: 'Minimal'
      };

      expect(manager.create('minimal' as CollectionId, metadata)).toSucceed();
    });

    test('fails when collection already exists', () => {
      const metadata: ICollectionFileMetadata = {
        name: 'Duplicate'
      };

      manager.create('dup' as CollectionId, metadata).orThrow();
      expect(manager.create('dup' as CollectionId, metadata)).toFailWith(/already exists/i);
    });

    test('fails with empty collection name', () => {
      const metadata: ICollectionFileMetadata = {
        name: ''
      };

      expect(manager.create('test' as CollectionId, metadata)).toFailWith(/cannot be empty/i);
    });

    test('fails with whitespace-only name', () => {
      const metadata: ICollectionFileMetadata = {
        name: '   '
      };

      expect(manager.create('test' as CollectionId, metadata)).toFailWith(/cannot be empty/i);
    });

    test('fails with leading whitespace in name', () => {
      const metadata: ICollectionFileMetadata = {
        name: '  Leading'
      };

      expect(manager.create('test' as CollectionId, metadata)).toFailWith(/leading or trailing whitespace/i);
    });

    test('fails with trailing whitespace in name', () => {
      const metadata: ICollectionFileMetadata = {
        name: 'Trailing  '
      };

      expect(manager.create('test' as CollectionId, metadata)).toFailWith(/leading or trailing whitespace/i);
    });

    test('fails with name exceeding 200 characters', () => {
      const metadata: ICollectionFileMetadata = {
        name: 'a'.repeat(201)
      };

      expect(manager.create('test' as CollectionId, metadata)).toFailWith(/exceeds 200 characters/i);
    });

    test('succeeds with name exactly 200 characters', () => {
      const metadata: ICollectionFileMetadata = {
        name: 'a'.repeat(200)
      };

      expect(manager.create('test' as CollectionId, metadata)).toSucceed();
    });

    test('fails with description exceeding 2000 characters', () => {
      const metadata: ICollectionFileMetadata = {
        name: 'Valid Name',
        description: 'a'.repeat(2001)
      };

      expect(manager.create('test' as CollectionId, metadata)).toFailWith(/exceeds 2000 characters/i);
    });

    test('succeeds with description exactly 2000 characters', () => {
      const metadata: ICollectionFileMetadata = {
        name: 'Valid Name',
        description: 'a'.repeat(2000)
      };

      expect(manager.create('test' as CollectionId, metadata)).toSucceed();
    });

    test('fails with empty secretName', () => {
      const metadata: ICollectionFileMetadata = {
        name: 'Valid Name',
        secretName: ''
      };

      expect(manager.create('test' as CollectionId, metadata)).toFailWith(/secret name cannot be empty/i);
    });

    test('fails with secretName exceeding 100 characters', () => {
      const metadata: ICollectionFileMetadata = {
        name: 'Valid Name',
        secretName: 'a'.repeat(101)
      };

      expect(manager.create('test' as CollectionId, metadata)).toFailWith(/exceeds 100 characters/i);
    });

    test('succeeds with valid secretName', () => {
      const metadata: ICollectionFileMetadata = {
        name: 'Valid Name',
        secretName: 'my-secret'
      };

      expect(manager.create('test' as CollectionId, metadata)).toSucceed();
    });

    test('injects "unknown" sourceName when library has no mutable source', () => {
      // Library created with { builtin: false } has no mutable file source
      const metadata: ICollectionFileMetadata = {
        name: 'No Source'
      };

      manager.create('no-source' as CollectionId, metadata).orThrow();

      // Verify the runtime metadata has sourceName 'unknown'
      expect(library.collections.get('no-source' as CollectionId).asResult).toSucceedAndSatisfy((entry) => {
        const runtimeMetadata = entry.metadata as ICollectionRuntimeMetadata;
        expect(runtimeMetadata.sourceName).toBe('unknown');
      });
    });
  });

  // ============================================================================
  // delete()
  // ============================================================================

  describe('delete', () => {
    test('deletes existing mutable collection', () => {
      const metadata: ICollectionFileMetadata = {
        name: 'To Delete'
      };

      manager.create('deletable' as CollectionId, metadata).orThrow();
      expect(manager.exists('deletable' as CollectionId)).toBe(true);

      expect(manager.delete('deletable' as CollectionId)).toSucceed();
      expect(manager.exists('deletable' as CollectionId)).toBe(false);
    });

    test('fails for non-existent collection', () => {
      expect(manager.delete('nonexistent' as CollectionId)).toFailWith(/not found/i);
    });

    test('fails for immutable collection', () => {
      // Add an immutable collection directly to the library
      library.addCollectionEntry({
        id: 'immutable' as CollectionId,
        isMutable: false,
        items: {}
      });

      expect(manager.delete('immutable' as CollectionId)).toFailWith(/cannot delete immutable/i);
    });
  });

  // ============================================================================
  // updateMetadata()
  // ============================================================================

  describe('updateMetadata', () => {
    beforeEach(() => {
      const metadata: ICollectionFileMetadata = {
        name: 'Original Name',
        description: 'Original description'
      };
      manager.create('test-coll' as CollectionId, metadata).orThrow();
    });

    test('updates collection name', () => {
      const updates: Partial<ICollectionRuntimeMetadata> = {
        name: 'Updated Name'
      };

      expect(manager.updateMetadata('test-coll' as CollectionId, updates)).toSucceed();
    });

    test('updates collection description', () => {
      const updates: Partial<ICollectionRuntimeMetadata> = {
        description: 'Updated description'
      };

      expect(manager.updateMetadata('test-coll' as CollectionId, updates)).toSucceed();
    });

    test('updates multiple metadata fields', () => {
      const updates: Partial<ICollectionRuntimeMetadata> = {
        name: 'New Name',
        description: 'New description'
      };

      expect(manager.updateMetadata('test-coll' as CollectionId, updates)).toSucceed();
    });

    test('fails for non-existent collection', () => {
      const updates: Partial<ICollectionRuntimeMetadata> = {
        name: 'New Name'
      };

      expect(manager.updateMetadata('nonexistent' as CollectionId, updates)).toFailWith(/not found/i);
    });

    test('fails for immutable collection', () => {
      library.addCollectionEntry({
        id: 'immutable' as CollectionId,
        isMutable: false,
        items: {}
      });

      const updates: Partial<ICollectionRuntimeMetadata> = {
        name: 'New Name'
      };

      expect(manager.updateMetadata('immutable' as CollectionId, updates)).toFailWith(
        /cannot update metadata.*immutable/i
      );
    });

    test('fails with empty name', () => {
      const updates: Partial<ICollectionRuntimeMetadata> = {
        name: ''
      };

      expect(manager.updateMetadata('test-coll' as CollectionId, updates)).toFailWith(/cannot be empty/i);
    });

    test('fails with whitespace-only name', () => {
      const updates: Partial<ICollectionRuntimeMetadata> = {
        name: '   '
      };

      expect(manager.updateMetadata('test-coll' as CollectionId, updates)).toFailWith(/cannot be empty/i);
    });

    test('fails with leading whitespace', () => {
      const updates: Partial<ICollectionRuntimeMetadata> = {
        name: '  Leading'
      };

      expect(manager.updateMetadata('test-coll' as CollectionId, updates)).toFailWith(
        /leading or trailing whitespace/i
      );
    });

    test('fails with trailing whitespace', () => {
      const updates: Partial<ICollectionRuntimeMetadata> = {
        name: 'Trailing  '
      };

      expect(manager.updateMetadata('test-coll' as CollectionId, updates)).toFailWith(
        /leading or trailing whitespace/i
      );
    });

    test('fails with name exceeding 200 characters', () => {
      const updates: Partial<ICollectionRuntimeMetadata> = {
        name: 'a'.repeat(201)
      };

      expect(manager.updateMetadata('test-coll' as CollectionId, updates)).toFailWith(
        /exceeds 200 characters/i
      );
    });

    test('fails with description exceeding 2000 characters', () => {
      const updates: Partial<ICollectionRuntimeMetadata> = {
        description: 'a'.repeat(2001)
      };

      expect(manager.updateMetadata('test-coll' as CollectionId, updates)).toFailWith(
        /exceeds 2000 characters/i
      );
    });

    test('succeeds with empty updates object', () => {
      const updates: Partial<ICollectionRuntimeMetadata> = {};

      expect(manager.updateMetadata('test-coll' as CollectionId, updates)).toSucceed();
    });
  });

  // ============================================================================
  // exists()
  // ============================================================================

  describe('exists', () => {
    test('returns false for non-existent collection', () => {
      expect(manager.exists('nonexistent' as CollectionId)).toBe(false);
    });

    test('returns true for existing collection', () => {
      const metadata: ICollectionFileMetadata = {
        name: 'Existing'
      };

      manager.create('existing' as CollectionId, metadata).orThrow();
      expect(manager.exists('existing' as CollectionId)).toBe(true);
    });

    test('returns false after collection is deleted', () => {
      const metadata: ICollectionFileMetadata = {
        name: 'To Delete'
      };

      manager.create('deletable' as CollectionId, metadata).orThrow();
      expect(manager.exists('deletable' as CollectionId)).toBe(true);

      manager.delete('deletable' as CollectionId).orThrow();
      expect(manager.exists('deletable' as CollectionId)).toBe(false);
    });
  });

  // ============================================================================
  // isMutable()
  // ============================================================================

  describe('isMutable', () => {
    test('returns true for mutable collection', () => {
      const metadata: ICollectionFileMetadata = {
        name: 'Mutable'
      };

      manager.create('mutable' as CollectionId, metadata).orThrow();
      expect(manager.isMutable('mutable' as CollectionId)).toSucceedWith(true);
    });

    test('returns false for immutable collection', () => {
      library.addCollectionEntry({
        id: 'immutable' as CollectionId,
        isMutable: false,
        items: {}
      });

      expect(manager.isMutable('immutable' as CollectionId)).toSucceedWith(false);
    });

    test('fails for non-existent collection', () => {
      expect(manager.isMutable('nonexistent' as CollectionId)).toFailWith(/not found/i);
    });
  });

  // ============================================================================
  // createWithFile()
  // ============================================================================

  describe('createWithFile', () => {
    describe('without mutable file source', () => {
      test('fails when no mutable data directory is available', () => {
        const metadata: ICollectionFileMetadata = {
          name: 'File Collection'
        };

        expect(manager.createWithFile('file-coll' as CollectionId, metadata)).toFailWith(
          /no writable data directory/i
        );

        // Verify the collection was not created
        expect(manager.exists('file-coll' as CollectionId)).toBe(false);
      });

      test('fails with invalid metadata', () => {
        const metadata: ICollectionFileMetadata = {
          name: ''
        };

        expect(manager.createWithFile('test' as CollectionId, metadata)).toFailWith(/cannot be empty/i);
      });

      test('fails when collection already exists', () => {
        const metadata: ICollectionFileMetadata = {
          name: 'Existing'
        };

        manager.create('existing' as CollectionId, metadata).orThrow();

        expect(manager.createWithFile('existing' as CollectionId, metadata)).toFailWith(/already exists/i);
      });
    });

    describe('with mutable file source', () => {
      let libraryWithFiles: IngredientsLibrary;
      let managerWithFiles: CollectionManager<string, string, unknown>;
      let createFileResult: jest.Mock;
      let capturedYamlContent: string | undefined;

      beforeEach(() => {
        // Create a basic library
        libraryWithFiles = IngredientsLibrary.create({ builtin: false }).orThrow();
        managerWithFiles = new CollectionManager(libraryWithFiles);

        // Mock createCollectionFile to capture calls and control behavior
        createFileResult = jest.fn();
        capturedYamlContent = undefined;

        jest
          .spyOn(libraryWithFiles, 'createCollectionFile')
          .mockImplementation((collectionId, yamlContent) => {
            capturedYamlContent = yamlContent;
            return createFileResult(collectionId, yamlContent);
          });
      });

      afterEach(() => {
        jest.restoreAllMocks();
      });

      test('successfully creates collection with file', () => {
        const metadata: ICollectionFileMetadata = {
          name: 'Test Collection',
          description: 'A test collection with file'
        };

        // Mock successful file creation
        createFileResult.mockReturnValue(succeed({}));

        expect(managerWithFiles.createWithFile('test-coll' as CollectionId, metadata)).toSucceed();

        // Verify collection exists in memory
        expect(managerWithFiles.exists('test-coll' as CollectionId)).toBe(true);

        // Verify file creation was called
        expect(createFileResult).toHaveBeenCalledWith(
          'test-coll',
          expect.stringContaining('name: Test Collection')
        );
      });

      test('created file contains metadata and empty items', () => {
        const metadata: ICollectionFileMetadata = {
          name: 'Test Collection',
          description: 'Description here'
        };

        // Mock successful file creation
        createFileResult.mockReturnValue(succeed({}));

        managerWithFiles.createWithFile('test' as CollectionId, metadata).orThrow();

        // Verify YAML content structure
        expect(capturedYamlContent).toBeDefined();
        expect(capturedYamlContent).toContain('name: Test Collection');
        expect(capturedYamlContent).toContain('description: Description here');
        expect(capturedYamlContent).toContain('items: {}');
      });

      test('registers source item after file creation', () => {
        const metadata: ICollectionFileMetadata = {
          name: 'With Source'
        };

        // Mock successful file creation
        createFileResult.mockReturnValue(succeed({}));

        managerWithFiles.createWithFile('with-source' as CollectionId, metadata).orThrow();

        // Verify createCollectionFile was called (which registers the source item)
        expect(createFileResult).toHaveBeenCalledWith('with-source', expect.any(String));
      });

      test('rolls back collection on file creation failure', () => {
        const metadata: ICollectionFileMetadata = {
          name: 'Rollback Test'
        };

        // Make file creation fail
        createFileResult.mockReturnValue(fail('File system error'));

        expect(managerWithFiles.createWithFile('rollback' as CollectionId, metadata)).toFailWith(
          /file system error/i
        );

        // Verify collection was rolled back
        expect(managerWithFiles.exists('rollback' as CollectionId)).toBe(false);
      });

      test('fails with invalid metadata', () => {
        const metadata: ICollectionFileMetadata = {
          name: 'a'.repeat(201)
        };

        expect(managerWithFiles.createWithFile('invalid' as CollectionId, metadata)).toFailWith(
          /exceeds 200 characters/i
        );

        // Verify file creation was never attempted
        expect(createFileResult).not.toHaveBeenCalled();
      });

      test('fails when collection already exists', () => {
        const metadata: ICollectionFileMetadata = {
          name: 'Duplicate'
        };

        managerWithFiles.create('dup' as CollectionId, metadata).orThrow();

        expect(managerWithFiles.createWithFile('dup' as CollectionId, metadata)).toFailWith(
          /already exists/i
        );

        // File creation should not have been attempted for duplicate
        expect(createFileResult).not.toHaveBeenCalled();
      });
    });
  });

  // ============================================================================
  // deleteEntity()
  // ============================================================================

  describe('deleteEntity', () => {
    beforeEach(() => {
      manager.create('src' as CollectionId, { name: 'Source' }).orThrow();
      const srcEntry = library.collections.get('src' as CollectionId).orThrow();
      if (srcEntry.isMutable) {
        srcEntry.items.set('item1' as never, { name: 'Item 1' } as never);
      }
    });

    test('deletes an existing entity from a mutable collection', () => {
      expect(manager.deleteEntity('src.item1')).toSucceed();
      expect(
        library.collections
          .get('src' as CollectionId)
          .orThrow()
          .items.has('item1' as never)
      ).toBe(false);
    });

    test('fails for invalid composite ID format (no dot)', () => {
      expect(manager.deleteEntity('nodot')).toFailWith(/invalid composite id/i);
    });

    test('fails for invalid composite ID format (dot at start)', () => {
      expect(manager.deleteEntity('.item1')).toFailWith(/invalid composite id/i);
    });

    test('fails for invalid composite ID format (dot at end)', () => {
      expect(manager.deleteEntity('src.')).toFailWith(/invalid composite id/i);
    });

    test('fails when collection does not exist', () => {
      expect(manager.deleteEntity('missing.item1')).toFailWith(/not found/i);
    });

    test('fails when deleting from an immutable collection', () => {
      library.addCollectionEntry({
        id: 'immutable' as CollectionId,
        isMutable: false,
        items: {}
      });
      expect(manager.deleteEntity('immutable.anything')).toFailWith(/immutable/i);
    });

    test('fails when entity does not exist in collection', () => {
      expect(manager.deleteEntity('src.nonexistent')).toFailWith(/not found|failed to delete/i);
    });
  });

  // ============================================================================
  // copyEntity()
  // ============================================================================

  describe('copyEntity', () => {
    beforeEach(() => {
      manager.create('src' as CollectionId, { name: 'Source' }).orThrow();
      manager.create('dst' as CollectionId, { name: 'Destination' }).orThrow();
      const srcEntry = library.collections.get('src' as CollectionId).orThrow();
      if (srcEntry.isMutable) {
        srcEntry.items.set('item1' as never, { name: 'Item 1' } as never);
      }
    });

    test('copies an entity to another collection using same base ID', () => {
      expect(manager.copyEntity('src.item1', 'dst' as CollectionId)).toSucceedWith('dst.item1');
      expect(
        library.collections
          .get('dst' as CollectionId)
          .orThrow()
          .items.has('item1' as never)
      ).toBe(true);
    });

    test('copies an entity to another collection with a new base ID', () => {
      expect(manager.copyEntity('src.item1', 'dst' as CollectionId, 'item2')).toSucceedWith('dst.item2');
      expect(
        library.collections
          .get('dst' as CollectionId)
          .orThrow()
          .items.has('item2' as never)
      ).toBe(true);
    });

    test('fails for invalid composite ID format', () => {
      expect(manager.copyEntity('nodot', 'dst' as CollectionId)).toFailWith(/invalid composite id/i);
    });

    test('fails when source collection does not exist', () => {
      expect(manager.copyEntity('missing.item1', 'dst' as CollectionId)).toFailWith(/not found/i);
    });

    test('fails when source entity does not exist', () => {
      expect(manager.copyEntity('src.nonexistent', 'dst' as CollectionId)).toFailWith(/not found/i);
    });

    test('fails when target collection does not exist', () => {
      expect(manager.copyEntity('src.item1', 'missing' as CollectionId)).toFailWith(/not found/i);
    });

    test('fails when copying to an immutable target collection', () => {
      library.addCollectionEntry({
        id: 'immutable' as CollectionId,
        isMutable: false,
        items: {}
      });
      expect(manager.copyEntity('src.item1', 'immutable' as CollectionId)).toFailWith(/immutable/i);
    });

    test('fails when entity already exists in target collection', () => {
      const dstEntry = library.collections.get('dst' as CollectionId).orThrow();
      if (dstEntry.isMutable) {
        dstEntry.items.set('item1' as never, { name: 'Existing' } as never);
      }
      expect(manager.copyEntity('src.item1', 'dst' as CollectionId)).toFailWith(/already exists/i);
    });
  });

  // ============================================================================
  // moveEntity()
  // ============================================================================

  describe('moveEntity', () => {
    beforeEach(() => {
      manager.create('src' as CollectionId, { name: 'Source' }).orThrow();
      manager.create('dst' as CollectionId, { name: 'Destination' }).orThrow();
      const srcEntry = library.collections.get('src' as CollectionId).orThrow();
      if (srcEntry.isMutable) {
        srcEntry.items.set('item1' as never, { name: 'Item 1' } as never);
      }
    });

    test('moves an entity to another collection', () => {
      expect(manager.moveEntity('src.item1', 'dst' as CollectionId)).toSucceedWith('dst.item1');
      expect(
        library.collections
          .get('dst' as CollectionId)
          .orThrow()
          .items.has('item1' as never)
      ).toBe(true);
      expect(
        library.collections
          .get('src' as CollectionId)
          .orThrow()
          .items.has('item1' as never)
      ).toBe(false);
    });

    test('moves an entity with a new base ID', () => {
      expect(manager.moveEntity('src.item1', 'dst' as CollectionId, 'item2')).toSucceedWith('dst.item2');
      expect(
        library.collections
          .get('dst' as CollectionId)
          .orThrow()
          .items.has('item2' as never)
      ).toBe(true);
      expect(
        library.collections
          .get('src' as CollectionId)
          .orThrow()
          .items.has('item1' as never)
      ).toBe(false);
    });

    test('fails when copy step fails (source not found)', () => {
      expect(manager.moveEntity('src.nonexistent', 'dst' as CollectionId)).toFailWith(/not found/i);
    });

    test('fails when copy step fails (target immutable)', () => {
      library.addCollectionEntry({
        id: 'immutable' as CollectionId,
        isMutable: false,
        items: {}
      });
      expect(manager.moveEntity('src.item1', 'immutable' as CollectionId)).toFailWith(/immutable/i);
      // Source should still exist since copy failed
      expect(
        library.collections
          .get('src' as CollectionId)
          .orThrow()
          .items.has('item1' as never)
      ).toBe(true);
    });
  });

  // ============================================================================
  // Integration Tests
  // ============================================================================

  describe('integration scenarios', () => {
    test('create, update, and delete lifecycle', () => {
      const metadata: ICollectionFileMetadata = {
        name: 'Initial Name',
        description: 'Initial description'
      };

      // Create
      expect(manager.create('lifecycle' as CollectionId, metadata)).toSucceed();
      expect(manager.exists('lifecycle' as CollectionId)).toBe(true);

      // Update
      const updates: Partial<ICollectionRuntimeMetadata> = {
        name: 'Updated Name',
        description: 'Updated description'
      };
      expect(manager.updateMetadata('lifecycle' as CollectionId, updates)).toSucceed();

      // Delete
      expect(manager.delete('lifecycle' as CollectionId)).toSucceed();
      expect(manager.exists('lifecycle' as CollectionId)).toBe(false);
    });

    test('multiple collections can be managed independently', () => {
      const metadata1: ICollectionFileMetadata = { name: 'Collection 1' };
      const metadata2: ICollectionFileMetadata = { name: 'Collection 2' };
      const metadata3: ICollectionFileMetadata = { name: 'Collection 3' };

      manager.create('coll1' as CollectionId, metadata1).orThrow();
      manager.create('coll2' as CollectionId, metadata2).orThrow();
      manager.create('coll3' as CollectionId, metadata3).orThrow();

      expect(manager.getAll().length).toBe(3);

      manager.delete('coll2' as CollectionId).orThrow();

      expect(manager.getAll().length).toBe(2);
      expect(manager.exists('coll1' as CollectionId)).toBe(true);
      expect(manager.exists('coll2' as CollectionId)).toBe(false);
      expect(manager.exists('coll3' as CollectionId)).toBe(true);
    });

    test('immutable collections are protected from modification', () => {
      library.addCollectionEntry({
        id: 'protected' as CollectionId,
        isMutable: false,
        items: {}
      });

      expect(manager.delete('protected' as CollectionId)).toFailWith(/immutable/i);
      expect(manager.updateMetadata('protected' as CollectionId, { name: 'New Name' })).toFailWith(
        /immutable/i
      );
    });
  });
});
