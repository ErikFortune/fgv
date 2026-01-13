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
import { IngredientsLibrary } from '../../../packlets/entities';
import { SourceId } from '../../../packlets/common';
import { ICollectionSourceMetadata } from '../../../packlets/library-data';

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
        id: 'test-collection' as SourceId,
        isMutable: true,
        items: {}
      });
    });

    test('successfully removes a mutable collection', () => {
      expect(library.collections.has('test-collection' as SourceId)).toBe(true);

      expect(library.removeCollection('test-collection' as SourceId)).toSucceed();

      expect(library.collections.has('test-collection' as SourceId)).toBe(false);
    });

    test('fails when collection does not exist', () => {
      expect(library.removeCollection('nonexistent' as SourceId)).toFailWith(/not found/i);
    });

    test('fails when attempting to remove immutable collection', () => {
      library.addCollectionEntry({
        id: 'immutable-collection' as SourceId,
        isMutable: false,
        items: {}
      });

      expect(library.removeCollection('immutable-collection' as SourceId)).toFailWith(
        /cannot delete immutable/i
      );
    });

    test('collection stays immutable after failed removal attempt', () => {
      library.addCollectionEntry({
        id: 'protected' as SourceId,
        isMutable: false,
        items: {}
      });

      library.removeCollection('protected' as SourceId);

      // Collection should still exist
      expect(library.collections.has('protected' as SourceId)).toBe(true);
    });

    test('removes empty collection successfully', () => {
      // Add an empty mutable collection
      library.addCollectionEntry({
        id: 'empty-collection' as SourceId,
        isMutable: true,
        items: {}
      });

      expect(library.collections.has('empty-collection' as SourceId)).toBe(true);

      expect(library.removeCollection('empty-collection' as SourceId)).toSucceed();

      expect(library.collections.has('empty-collection' as SourceId)).toBe(false);
    });

    test('can add collection after removing it', () => {
      library.removeCollection('test-collection' as SourceId).orThrow();

      // Should be able to add a new collection with the same ID
      library.addCollectionEntry({
        id: 'test-collection' as SourceId,
        isMutable: true,
        items: {}
      });

      expect(library.collections.has('test-collection' as SourceId)).toBe(true);
    });
  });

  // ============================================================================
  // updateCollectionMetadata()
  // ============================================================================

  describe('updateCollectionMetadata', () => {
    beforeEach(() => {
      library.addCollectionEntry({
        id: 'test-collection' as SourceId,
        isMutable: true,
        items: {}
      });
    });

    test('successfully validates metadata update for mutable collection', () => {
      const metadata: Partial<ICollectionSourceMetadata> = {
        name: 'Updated Name',
        description: 'Updated description'
      };

      expect(library.updateCollectionMetadata('test-collection' as SourceId, metadata)).toSucceed();
    });

    test('fails when collection does not exist', () => {
      const metadata: Partial<ICollectionSourceMetadata> = {
        name: 'New Name'
      };

      expect(library.updateCollectionMetadata('nonexistent' as SourceId, metadata)).toFailWith(/not found/i);
    });

    test('fails when attempting to update immutable collection', () => {
      library.addCollectionEntry({
        id: 'immutable' as SourceId,
        isMutable: false,
        items: {}
      });

      const metadata: Partial<ICollectionSourceMetadata> = {
        name: 'New Name'
      };

      expect(library.updateCollectionMetadata('immutable' as SourceId, metadata)).toFailWith(
        /cannot update metadata.*immutable/i
      );
    });

    test('validates empty collection name', () => {
      const metadata: Partial<ICollectionSourceMetadata> = {
        name: ''
      };

      expect(library.updateCollectionMetadata('test-collection' as SourceId, metadata)).toFailWith(
        /cannot be empty/i
      );
    });

    test('validates whitespace-only name', () => {
      const metadata: Partial<ICollectionSourceMetadata> = {
        name: '   '
      };

      expect(library.updateCollectionMetadata('test-collection' as SourceId, metadata)).toFailWith(
        /cannot be empty/i
      );
    });

    test('validates name with leading whitespace', () => {
      const metadata: Partial<ICollectionSourceMetadata> = {
        name: '  Leading'
      };

      expect(library.updateCollectionMetadata('test-collection' as SourceId, metadata)).toFailWith(
        /leading or trailing whitespace/i
      );
    });

    test('validates name with trailing whitespace', () => {
      const metadata: Partial<ICollectionSourceMetadata> = {
        name: 'Trailing  '
      };

      expect(library.updateCollectionMetadata('test-collection' as SourceId, metadata)).toFailWith(
        /leading or trailing whitespace/i
      );
    });

    test('validates name length exceeding 200 characters', () => {
      const metadata: Partial<ICollectionSourceMetadata> = {
        name: 'a'.repeat(201)
      };

      expect(library.updateCollectionMetadata('test-collection' as SourceId, metadata)).toFailWith(
        /exceeds 200 characters/i
      );
    });

    test('accepts name with exactly 200 characters', () => {
      const metadata: Partial<ICollectionSourceMetadata> = {
        name: 'a'.repeat(200)
      };

      expect(library.updateCollectionMetadata('test-collection' as SourceId, metadata)).toSucceed();
    });

    test('validates description length exceeding 2000 characters', () => {
      const metadata: Partial<ICollectionSourceMetadata> = {
        description: 'a'.repeat(2001)
      };

      expect(library.updateCollectionMetadata('test-collection' as SourceId, metadata)).toFailWith(
        /exceeds 2000 characters/i
      );
    });

    test('accepts description with exactly 2000 characters', () => {
      const metadata: Partial<ICollectionSourceMetadata> = {
        description: 'a'.repeat(2000)
      };

      expect(library.updateCollectionMetadata('test-collection' as SourceId, metadata)).toSucceed();
    });

    test('accepts valid name update', () => {
      const metadata: Partial<ICollectionSourceMetadata> = {
        name: 'Valid Name'
      };

      expect(library.updateCollectionMetadata('test-collection' as SourceId, metadata)).toSucceed();
    });

    test('accepts valid description update', () => {
      const metadata: Partial<ICollectionSourceMetadata> = {
        description: 'A valid description'
      };

      expect(library.updateCollectionMetadata('test-collection' as SourceId, metadata)).toSucceed();
    });

    test('accepts update with both name and description', () => {
      const metadata: Partial<ICollectionSourceMetadata> = {
        name: 'Updated Name',
        description: 'Updated description'
      };

      expect(library.updateCollectionMetadata('test-collection' as SourceId, metadata)).toSucceed();
    });

    test('accepts empty metadata object', () => {
      const metadata: Partial<ICollectionSourceMetadata> = {};

      expect(library.updateCollectionMetadata('test-collection' as SourceId, metadata)).toSucceed();
    });

    test('validates secretName when empty', () => {
      const metadata: Partial<ICollectionSourceMetadata> = {
        secretName: ''
      };

      expect(library.updateCollectionMetadata('test-collection' as SourceId, metadata)).toFailWith(
        /secret name cannot be empty/i
      );
    });

    test('validates secretName length exceeding 100 characters', () => {
      const metadata: Partial<ICollectionSourceMetadata> = {
        secretName: 'a'.repeat(101)
      };

      expect(library.updateCollectionMetadata('test-collection' as SourceId, metadata)).toFailWith(
        /exceeds 100 characters/i
      );
    });

    test('accepts valid secretName', () => {
      const metadata: Partial<ICollectionSourceMetadata> = {
        secretName: 'my-secret'
      };

      expect(library.updateCollectionMetadata('test-collection' as SourceId, metadata)).toSucceed();
    });
  });

  // ============================================================================
  // Integration Tests
  // ============================================================================

  describe('integration scenarios', () => {
    test('can update and then remove a collection', () => {
      library.addCollectionEntry({
        id: 'lifecycle' as SourceId,
        isMutable: true,
        items: {}
      });

      const metadata: Partial<ICollectionSourceMetadata> = {
        name: 'Updated Name'
      };

      library.updateCollectionMetadata('lifecycle' as SourceId, metadata).orThrow();
      library.removeCollection('lifecycle' as SourceId).orThrow();

      expect(library.collections.has('lifecycle' as SourceId)).toBe(false);
    });

    test('multiple mutable collections can be managed independently', () => {
      library.addCollectionEntry({
        id: 'coll1' as SourceId,
        isMutable: true,
        items: {}
      });

      library.addCollectionEntry({
        id: 'coll2' as SourceId,
        isMutable: true,
        items: {}
      });

      library.addCollectionEntry({
        id: 'coll3' as SourceId,
        isMutable: true,
        items: {}
      });

      // Remove one
      library.removeCollection('coll2' as SourceId).orThrow();

      // Others should still exist
      expect(library.collections.has('coll1' as SourceId)).toBe(true);
      expect(library.collections.has('coll2' as SourceId)).toBe(false);
      expect(library.collections.has('coll3' as SourceId)).toBe(true);
    });

    test('immutable collections remain protected throughout operations', () => {
      library.addCollectionEntry({
        id: 'protected' as SourceId,
        isMutable: false,
        items: {}
      });

      library.addCollectionEntry({
        id: 'mutable' as SourceId,
        isMutable: true,
        items: {}
      });

      // Can remove mutable
      expect(library.removeCollection('mutable' as SourceId)).toSucceed();

      // Cannot remove immutable
      expect(library.removeCollection('protected' as SourceId)).toFailWith(/immutable/i);

      // Immutable still exists
      expect(library.collections.has('protected' as SourceId)).toBe(true);
    });

    test('validation errors are properly reported', () => {
      library.addCollectionEntry({
        id: 'test' as SourceId,
        isMutable: true,
        items: {}
      });

      const badMetadata: Partial<ICollectionSourceMetadata> = {
        name: '  ',
        description: 'a'.repeat(2001)
      };

      const result = library.updateCollectionMetadata('test' as SourceId, badMetadata);

      expect(result).toFail();
      // Should contain both error messages
      expect(result.isFailure() && result.message).toMatch(/cannot be empty/i);
      expect(result.isFailure() && result.message).toMatch(/exceeds 2000 characters/i);
    });
  });
});
