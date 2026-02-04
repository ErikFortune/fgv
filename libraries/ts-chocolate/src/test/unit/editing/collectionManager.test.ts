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
import { CollectionManager } from '../../../packlets/editing';
import { IngredientsLibrary } from '../../../packlets/entities';
import { CollectionId } from '../../../packlets/common';
import { ICollectionSourceMetadata } from '../../../packlets/library-data';

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
      const metadata: ICollectionSourceMetadata = {
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
      const metadata: ICollectionSourceMetadata = {
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

    test('returns empty object when collection has no metadata', () => {
      // Add collection directly to library without metadata
      library.addCollectionEntry({
        id: 'no-metadata' as CollectionId,
        isMutable: true,
        items: {}
        // Note: no metadata field
      });

      expect(manager.get('no-metadata' as CollectionId)).toSucceedAndSatisfy((result) => {
        expect(result).toEqual({});
      });
    });
  });

  // ============================================================================
  // create()
  // ============================================================================

  describe('create', () => {
    test('creates collection with valid metadata', () => {
      const metadata: ICollectionSourceMetadata = {
        name: 'New Collection',
        description: 'A new test collection'
      };

      expect(manager.create('new-coll' as CollectionId, metadata)).toSucceed();
      expect(manager.exists('new-coll' as CollectionId)).toBe(true);
    });

    test('creates collection with minimal metadata', () => {
      const metadata: ICollectionSourceMetadata = {
        name: 'Minimal'
      };

      expect(manager.create('minimal' as CollectionId, metadata)).toSucceed();
    });

    test('fails when collection already exists', () => {
      const metadata: ICollectionSourceMetadata = {
        name: 'Duplicate'
      };

      manager.create('dup' as CollectionId, metadata).orThrow();
      expect(manager.create('dup' as CollectionId, metadata)).toFailWith(/already exists/i);
    });

    test('fails with empty collection name', () => {
      const metadata: ICollectionSourceMetadata = {
        name: ''
      };

      expect(manager.create('test' as CollectionId, metadata)).toFailWith(/cannot be empty/i);
    });

    test('fails with whitespace-only name', () => {
      const metadata: ICollectionSourceMetadata = {
        name: '   '
      };

      expect(manager.create('test' as CollectionId, metadata)).toFailWith(/cannot be empty/i);
    });

    test('fails with leading whitespace in name', () => {
      const metadata: ICollectionSourceMetadata = {
        name: '  Leading'
      };

      expect(manager.create('test' as CollectionId, metadata)).toFailWith(/leading or trailing whitespace/i);
    });

    test('fails with trailing whitespace in name', () => {
      const metadata: ICollectionSourceMetadata = {
        name: 'Trailing  '
      };

      expect(manager.create('test' as CollectionId, metadata)).toFailWith(/leading or trailing whitespace/i);
    });

    test('fails with name exceeding 200 characters', () => {
      const metadata: ICollectionSourceMetadata = {
        name: 'a'.repeat(201)
      };

      expect(manager.create('test' as CollectionId, metadata)).toFailWith(/exceeds 200 characters/i);
    });

    test('succeeds with name exactly 200 characters', () => {
      const metadata: ICollectionSourceMetadata = {
        name: 'a'.repeat(200)
      };

      expect(manager.create('test' as CollectionId, metadata)).toSucceed();
    });

    test('fails with description exceeding 2000 characters', () => {
      const metadata: ICollectionSourceMetadata = {
        name: 'Valid Name',
        description: 'a'.repeat(2001)
      };

      expect(manager.create('test' as CollectionId, metadata)).toFailWith(/exceeds 2000 characters/i);
    });

    test('succeeds with description exactly 2000 characters', () => {
      const metadata: ICollectionSourceMetadata = {
        name: 'Valid Name',
        description: 'a'.repeat(2000)
      };

      expect(manager.create('test' as CollectionId, metadata)).toSucceed();
    });

    test('fails with empty secretName', () => {
      const metadata: ICollectionSourceMetadata = {
        name: 'Valid Name',
        secretName: ''
      };

      expect(manager.create('test' as CollectionId, metadata)).toFailWith(/secret name cannot be empty/i);
    });

    test('fails with secretName exceeding 100 characters', () => {
      const metadata: ICollectionSourceMetadata = {
        name: 'Valid Name',
        secretName: 'a'.repeat(101)
      };

      expect(manager.create('test' as CollectionId, metadata)).toFailWith(/exceeds 100 characters/i);
    });

    test('succeeds with valid secretName', () => {
      const metadata: ICollectionSourceMetadata = {
        name: 'Valid Name',
        secretName: 'my-secret'
      };

      expect(manager.create('test' as CollectionId, metadata)).toSucceed();
    });
  });

  // ============================================================================
  // delete()
  // ============================================================================

  describe('delete', () => {
    test('deletes existing mutable collection', () => {
      const metadata: ICollectionSourceMetadata = {
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
      const metadata: ICollectionSourceMetadata = {
        name: 'Original Name',
        description: 'Original description'
      };
      manager.create('test-coll' as CollectionId, metadata).orThrow();
    });

    test('updates collection name', () => {
      const updates: Partial<ICollectionSourceMetadata> = {
        name: 'Updated Name'
      };

      expect(manager.updateMetadata('test-coll' as CollectionId, updates)).toSucceed();
    });

    test('updates collection description', () => {
      const updates: Partial<ICollectionSourceMetadata> = {
        description: 'Updated description'
      };

      expect(manager.updateMetadata('test-coll' as CollectionId, updates)).toSucceed();
    });

    test('updates multiple metadata fields', () => {
      const updates: Partial<ICollectionSourceMetadata> = {
        name: 'New Name',
        description: 'New description'
      };

      expect(manager.updateMetadata('test-coll' as CollectionId, updates)).toSucceed();
    });

    test('fails for non-existent collection', () => {
      const updates: Partial<ICollectionSourceMetadata> = {
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

      const updates: Partial<ICollectionSourceMetadata> = {
        name: 'New Name'
      };

      expect(manager.updateMetadata('immutable' as CollectionId, updates)).toFailWith(
        /cannot update metadata.*immutable/i
      );
    });

    test('fails with empty name', () => {
      const updates: Partial<ICollectionSourceMetadata> = {
        name: ''
      };

      expect(manager.updateMetadata('test-coll' as CollectionId, updates)).toFailWith(/cannot be empty/i);
    });

    test('fails with whitespace-only name', () => {
      const updates: Partial<ICollectionSourceMetadata> = {
        name: '   '
      };

      expect(manager.updateMetadata('test-coll' as CollectionId, updates)).toFailWith(/cannot be empty/i);
    });

    test('fails with leading whitespace', () => {
      const updates: Partial<ICollectionSourceMetadata> = {
        name: '  Leading'
      };

      expect(manager.updateMetadata('test-coll' as CollectionId, updates)).toFailWith(
        /leading or trailing whitespace/i
      );
    });

    test('fails with trailing whitespace', () => {
      const updates: Partial<ICollectionSourceMetadata> = {
        name: 'Trailing  '
      };

      expect(manager.updateMetadata('test-coll' as CollectionId, updates)).toFailWith(
        /leading or trailing whitespace/i
      );
    });

    test('fails with name exceeding 200 characters', () => {
      const updates: Partial<ICollectionSourceMetadata> = {
        name: 'a'.repeat(201)
      };

      expect(manager.updateMetadata('test-coll' as CollectionId, updates)).toFailWith(
        /exceeds 200 characters/i
      );
    });

    test('fails with description exceeding 2000 characters', () => {
      const updates: Partial<ICollectionSourceMetadata> = {
        description: 'a'.repeat(2001)
      };

      expect(manager.updateMetadata('test-coll' as CollectionId, updates)).toFailWith(
        /exceeds 2000 characters/i
      );
    });

    test('succeeds with empty updates object', () => {
      const updates: Partial<ICollectionSourceMetadata> = {};

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
      const metadata: ICollectionSourceMetadata = {
        name: 'Existing'
      };

      manager.create('existing' as CollectionId, metadata).orThrow();
      expect(manager.exists('existing' as CollectionId)).toBe(true);
    });

    test('returns false after collection is deleted', () => {
      const metadata: ICollectionSourceMetadata = {
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
      const metadata: ICollectionSourceMetadata = {
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
  // Integration Tests
  // ============================================================================

  describe('integration scenarios', () => {
    test('create, update, and delete lifecycle', () => {
      const metadata: ICollectionSourceMetadata = {
        name: 'Initial Name',
        description: 'Initial description'
      };

      // Create
      expect(manager.create('lifecycle' as CollectionId, metadata)).toSucceed();
      expect(manager.exists('lifecycle' as CollectionId)).toBe(true);

      // Update
      const updates: Partial<ICollectionSourceMetadata> = {
        name: 'Updated Name',
        description: 'Updated description'
      };
      expect(manager.updateMetadata('lifecycle' as CollectionId, updates)).toSucceed();

      // Delete
      expect(manager.delete('lifecycle' as CollectionId)).toSucceed();
      expect(manager.exists('lifecycle' as CollectionId)).toBe(false);
    });

    test('multiple collections can be managed independently', () => {
      const metadata1: ICollectionSourceMetadata = { name: 'Collection 1' };
      const metadata2: ICollectionSourceMetadata = { name: 'Collection 2' };
      const metadata3: ICollectionSourceMetadata = { name: 'Collection 3' };

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
