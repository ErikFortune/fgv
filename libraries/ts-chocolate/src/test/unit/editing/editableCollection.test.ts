// Copyright (c) 2024 Erik Fortune
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
import { Converters } from '@fgv/ts-utils';
import { CollectionId } from '../../../index';
import { EditableCollection } from '../../../packlets/editing';

const TEST_SOURCE_ID = 'test' as CollectionId;
const testKeyConverter = Converters.string;
const testValueConverter = Converters.object<TestItem>({
  name: Converters.string,
  value: Converters.number
});

interface TestItem {
  name: string;
  value: number;
}

describe('EditableCollection', () => {
  const testMetadata = {
    name: 'Test Collection',
    description: 'A test collection'
  };

  // ==========================================================================
  // Factory method (create)
  // ==========================================================================

  describe('create', () => {
    test('should create collection with correct properties', () => {
      const items = new Map([['item1', { name: 'Item 1', value: 10 }]]);
      expect(
        EditableCollection.createEditable<TestItem>({
          collectionId: TEST_SOURCE_ID,
          metadata: testMetadata,
          isMutable: true,
          initialItems: items,
          keyConverter: testKeyConverter,
          valueConverter: testValueConverter
        })
      ).toSucceedAndSatisfy((collection) => {
        expect(collection.collectionId).toBe('test');
        expect(collection.isMutable).toBe(true);
        expect(collection.size).toBe(1);
      });
    });

    test('should fail without collection ID', () => {
      expect(
        EditableCollection.createEditable<TestItem>({
          collectionId: '' as CollectionId,
          metadata: testMetadata,
          isMutable: true,
          initialItems: new Map(),
          keyConverter: testKeyConverter,
          valueConverter: testValueConverter
        })
      ).toFailWith(/collection id is required/i);
    });

    test('should create collection with custom valueConverter', () => {
      const customConverter = Converters.object<TestItem>({
        name: Converters.string,
        value: Converters.number
      });
      expect(
        EditableCollection.createEditable<TestItem>({
          collectionId: TEST_SOURCE_ID,
          metadata: testMetadata,
          isMutable: true,
          initialItems: new Map(),
          keyConverter: testKeyConverter,
          valueConverter: customConverter
        })
      ).toSucceedAndSatisfy((collection) => {
        expect(collection.collectionId).toBe('test');
      });
    });

    test('should create collection with custom keyConverter', () => {
      const customKeyConverter = Converters.string.withConstraint((s) => s.length > 0 && s.length <= 50, {
        description: 'must be 1-50 characters'
      });
      expect(
        EditableCollection.createEditable<TestItem>({
          collectionId: TEST_SOURCE_ID,
          metadata: testMetadata,
          isMutable: true,
          initialItems: new Map(),
          keyConverter: customKeyConverter,
          valueConverter: testValueConverter
        })
      ).toSucceedAndSatisfy((collection) => {
        expect(collection.collectionId).toBe('test');
      });
    });
  });

  // ==========================================================================
  // Metadata (new functionality)
  // ==========================================================================

  describe('metadata', () => {
    test('should return metadata copy', () => {
      const collection = EditableCollection.createEditable<TestItem>({
        collectionId: TEST_SOURCE_ID,
        metadata: testMetadata,
        isMutable: true,
        initialItems: new Map(),
        keyConverter: testKeyConverter,
        valueConverter: testValueConverter
      }).orThrow();

      const metadata1 = collection.metadata;
      const metadata2 = collection.metadata;

      expect(metadata1).toEqual(testMetadata);
      expect(metadata1).not.toBe(metadata2); // Different object instances
    });
  });

  describe('updateMetadata', () => {
    test('should update metadata in mutable collection', () => {
      const collection = EditableCollection.createEditable<TestItem>({
        collectionId: TEST_SOURCE_ID,
        metadata: testMetadata,
        isMutable: true,
        initialItems: new Map(),
        keyConverter: testKeyConverter,
        valueConverter: testValueConverter
      }).orThrow();

      expect(collection.updateMetadata({ name: 'Updated Name' })).toSucceed();
      expect(collection.metadata.name).toBe('Updated Name');
      expect(collection.metadata.description).toBe('A test collection'); // Preserved
    });

    test('should fail for immutable collection', () => {
      const collection = EditableCollection.createEditable<TestItem>({
        collectionId: TEST_SOURCE_ID,
        metadata: testMetadata,
        isMutable: false,
        initialItems: new Map(),
        keyConverter: testKeyConverter,
        valueConverter: testValueConverter
      }).orThrow();

      expect(collection.updateMetadata({ name: 'New' })).toFailWith(/immutable.*cannot be modified/i);
    });
  });

  // ==========================================================================
  // Export (new functionality)
  // ==========================================================================

  describe('export', () => {
    test('should export collection to ICollectionSourceFile format', () => {
      const items = new Map([
        ['item1', { name: 'Item 1', value: 10 }],
        ['item2', { name: 'Item 2', value: 20 }]
      ]);

      const collection = EditableCollection.createEditable<TestItem>({
        collectionId: TEST_SOURCE_ID,
        metadata: testMetadata,
        isMutable: true,
        initialItems: items,
        keyConverter: testKeyConverter,
        valueConverter: testValueConverter
      }).orThrow();

      expect(collection.export()).toSucceedAndSatisfy((exported) => {
        expect(exported.metadata).toEqual(testMetadata);
        expect(exported.items).toEqual({
          item1: { name: 'Item 1', value: 10 },
          item2: { name: 'Item 2', value: 20 }
        });
      });
    });

    test('should export empty collection', () => {
      const collection = EditableCollection.createEditable<TestItem>({
        collectionId: TEST_SOURCE_ID,
        metadata: testMetadata,
        isMutable: true,
        initialItems: new Map(),
        keyConverter: testKeyConverter,
        valueConverter: testValueConverter
      }).orThrow();

      expect(collection.export()).toSucceedAndSatisfy((exported) => {
        expect(exported.items).toEqual({});
      });
    });
  });

  // ==========================================================================
  // Immutability guards (overridden behavior)
  // ==========================================================================

  describe('immutability guards', () => {
    test('set should fail for immutable collection', () => {
      const collection = EditableCollection.createEditable<TestItem>({
        collectionId: TEST_SOURCE_ID,
        metadata: testMetadata,
        isMutable: false,
        initialItems: new Map(),
        keyConverter: testKeyConverter,
        valueConverter: testValueConverter
      }).orThrow();

      expect(collection.set('item1', { name: 'Item', value: 10 })).toFailWith(
        /immutable.*cannot be modified/i
      );
    });

    test('add should fail for immutable collection', () => {
      const collection = EditableCollection.createEditable<TestItem>({
        collectionId: TEST_SOURCE_ID,
        metadata: testMetadata,
        isMutable: false,
        initialItems: new Map(),
        keyConverter: testKeyConverter,
        valueConverter: testValueConverter
      }).orThrow();

      expect(collection.add('item1', { name: 'Item', value: 10 })).toFailWith(
        /immutable.*cannot be modified/i
      );
    });

    test('update should fail for immutable collection', () => {
      const collection = EditableCollection.createEditable<TestItem>({
        collectionId: TEST_SOURCE_ID,
        metadata: testMetadata,
        isMutable: false,
        initialItems: new Map([['item1', { name: 'Item 1', value: 10 }]]),
        keyConverter: testKeyConverter,
        valueConverter: testValueConverter
      }).orThrow();

      expect(collection.update('item1', { name: 'Updated', value: 20 })).toFailWith(
        /immutable.*cannot be modified/i
      );
    });

    test('delete should fail for immutable collection', () => {
      const collection = EditableCollection.createEditable<TestItem>({
        collectionId: TEST_SOURCE_ID,
        metadata: testMetadata,
        isMutable: false,
        initialItems: new Map([['item1', { name: 'Item 1', value: 10 }]]),
        keyConverter: testKeyConverter,
        valueConverter: testValueConverter
      }).orThrow();

      expect(collection.delete('item1')).toFailWith(/immutable.*cannot be modified/i);
    });

    test('clear should fail for immutable collection', () => {
      const collection = EditableCollection.createEditable<TestItem>({
        collectionId: TEST_SOURCE_ID,
        metadata: testMetadata,
        isMutable: false,
        initialItems: new Map([['item1', { name: 'Item 1', value: 10 }]]),
        keyConverter: testKeyConverter,
        valueConverter: testValueConverter
      }).orThrow();

      expect(collection.clear()).toFailWith(/immutable.*cannot be modified/i);
    });

    test('mutations should succeed for mutable collection', () => {
      const collection = EditableCollection.createEditable<TestItem>({
        collectionId: TEST_SOURCE_ID,
        metadata: testMetadata,
        isMutable: true,
        initialItems: new Map(),
        keyConverter: testKeyConverter,
        valueConverter: testValueConverter
      }).orThrow();

      // Verify mutations work when mutable
      expect(collection.set('item1', { name: 'Item 1', value: 10 })).toSucceed();
      expect(collection.update('item1', { name: 'Updated', value: 20 })).toSucceed();
      expect(collection.delete('item1')).toSucceed();
      expect(collection.add('item2', { name: 'Item 2', value: 30 })).toSucceed();
      expect(collection.clear()).toSucceed();
    });
  });
});
