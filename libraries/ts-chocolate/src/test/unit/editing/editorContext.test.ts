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
import { Converter, Converters, Result, fail, succeed } from '@fgv/ts-utils';
import { SourceId } from '../../../index';
import { EditableCollection, EditorContext } from '../../../packlets/editing';

const TEST_SOURCE_ID = 'test-collection' as SourceId;

interface TestEntity {
  name: string;
  value: number;
}

type TestBaseId = string & { readonly __brand: 'TestBaseId' };
type TestEntityId = string & { readonly __brand: 'TestEntityId' };

// Test converter for TestEntity with constraints
const testEntityConverter: Converter<TestEntity> = Converters.object<TestEntity>({
  name: Converters.string.withConstraint((s) => s.length > 0, { description: 'cannot be empty' }),
  value: Converters.number.withConstraint((n) => n >= 0, { description: 'must be non-negative' })
});

// Semantic validator for test entity (cross-field validation)
const testEntitySemanticValidator = (entity: TestEntity): Result<TestEntity> => {
  // Example: name cannot be 'invalid'
  if (entity.name === 'invalid') {
    return fail('name cannot be "invalid"');
  }
  return succeed(entity);
};

describe('EditorContext', () => {
  const testKeyConverter = Converters.string as unknown as Converter<TestBaseId>;
  const testValueConverter = testEntityConverter;

  const createTestCollection = (
    items: Map<TestBaseId, TestEntity> = new Map(),
    isMutable: boolean = true
  ): EditableCollection<TestEntity, TestBaseId, TestEntityId> => {
    return EditableCollection.createEditable<TestEntity, TestBaseId, TestEntityId>({
      collectionId: TEST_SOURCE_ID,
      metadata: { name: 'Test Collection' },
      isMutable,
      initialItems: items,
      keyConverter: testKeyConverter,
      valueConverter: testValueConverter
    }).orThrow();
  };

  const createTestContext = (
    collection: EditableCollection<TestEntity, TestBaseId, TestEntityId>,
    semanticValidator?: (entity: TestEntity) => Result<TestEntity>
  ): Result<EditorContext<TestEntity, TestBaseId, TestEntityId>> => {
    return EditorContext.create<TestEntity, TestBaseId, TestEntityId>({
      collection,
      semanticValidator,
      createId: (collectionId, baseId) => `${collectionId}.${baseId}` as TestEntityId,
      getBaseId: (entity) => entity.name.toLowerCase().replace(/\s+/g, '-') as TestBaseId,
      getName: (entity) => entity.name
    });
  };

  describe('create context', () => {
    test('should create editor context with mutable collection', () => {
      const collection = createTestCollection();
      expect(createTestContext(collection)).toSucceedAndSatisfy((context) => {
        expect(context).toBeDefined();
      });
    });

    test('should fail for missing collection', () => {
      expect(
        EditorContext.create({
          collection: null as unknown as EditableCollection<TestEntity, TestBaseId, TestEntityId>,
          createId: (c, b) => `${c}.${b}` as TestEntityId,
          getBaseId: () => 'test' as TestBaseId,
          getName: (e: TestEntity) => e.name
        })
      ).toFailWith(/collection is required/i);
    });

    test('should fail for immutable collection', () => {
      const collection = createTestCollection(new Map(), false);
      expect(createTestContext(collection)).toFailWith(/immutable.*cannot be edited/i);
    });
  });

  describe('get', () => {
    test('should get existing entity', () => {
      const collection = createTestCollection(
        new Map([['item1' as TestBaseId, { name: 'Item 1', value: 10 }]])
      );
      const context = createTestContext(collection).orThrow();

      expect(context.get('test-collection.item1' as TestEntityId)).toSucceedAndSatisfy((entity) => {
        expect(entity.name).toBe('Item 1');
        expect(entity.value).toBe(10);
      });
    });

    test('should fail for non-existing entity', () => {
      const collection = createTestCollection();
      const context = createTestContext(collection).orThrow();

      expect(context.get('test-collection.nonexistent' as TestEntityId)).toFailWith(/not found/i);
    });

    test('should extract base ID from composite ID', () => {
      const collection = createTestCollection(
        new Map([['item1' as TestBaseId, { name: 'Item 1', value: 10 }]])
      );
      const context = createTestContext(collection).orThrow();

      expect(context.get('any-prefix.item1' as TestEntityId)).toSucceedWith({ name: 'Item 1', value: 10 });
    });
  });

  describe('getAll', () => {
    test('should return all entities with composite IDs', () => {
      const collection = createTestCollection(
        new Map([
          ['item1' as TestBaseId, { name: 'Item 1', value: 10 }],
          ['item2' as TestBaseId, { name: 'Item 2', value: 20 }]
        ])
      );
      const context = createTestContext(collection).orThrow();

      const all = context.getAll();
      expect(all.length).toBe(2);
      expect(all[0][0]).toBe('test-collection.item1');
      expect(all[0][1]).toEqual({ name: 'Item 1', value: 10 });
    });

    test('should return empty array for empty collection', () => {
      const collection = createTestCollection();
      const context = createTestContext(collection).orThrow();

      expect(context.getAll()).toEqual([]);
    });
  });

  describe('create entity', () => {
    test('should create entity with specified base ID', () => {
      const collection = createTestCollection();
      const context = createTestContext(collection).orThrow();

      const entity: TestEntity = { name: 'New Item', value: 30 };
      expect(context.create('new-item' as TestBaseId, entity)).toSucceedAndSatisfy((id) => {
        expect(id).toBe('test-collection.new-item');
        expect(context.exists(id)).toBe(true);
        expect(context.hasUnsavedChanges()).toBe(true);
      });
    });

    test('should auto-generate base ID from name when undefined', () => {
      const collection = createTestCollection();
      const context = createTestContext(collection).orThrow();

      const entity: TestEntity = { name: 'Auto Generated', value: 40 };
      expect(context.create(undefined, entity)).toSucceedAndSatisfy((id) => {
        expect(id).toContain('test-collection.');
        expect(context.exists(id)).toBe(true);
      });
    });

    test('should fail for duplicate base ID', () => {
      const collection = createTestCollection(
        new Map([['existing' as TestBaseId, { name: 'Existing', value: 10 }]])
      );
      const context = createTestContext(collection).orThrow();

      const entity: TestEntity = { name: 'Duplicate', value: 20 };
      expect(context.create('existing' as TestBaseId, entity)).toFailWith(/already exists/i);
    });

    test('should fail semantic validation in create', () => {
      const collection = createTestCollection();
      const context = createTestContext(collection, testEntitySemanticValidator).orThrow();

      // Entity with name 'invalid' fails semantic validation
      const entity: TestEntity = { name: 'invalid', value: 10 };
      expect(context.create('test-item' as TestBaseId, entity)).toFailWith(
        /semantic validation failed.*invalid/i
      );
    });

    test('should fail auto-generation with invalid name', () => {
      const collection = createTestCollection();
      const context = EditorContext.create<TestEntity, TestBaseId, TestEntityId>({
        collection,
        createId: (c, b) => `${c}.${b}` as TestEntityId,
        getBaseId: () => 'test' as TestBaseId,
        getName: (e: TestEntity) => e.name
      }).orThrow();

      // Name with only special characters cannot generate valid base ID
      const entity: TestEntity = { name: '---', value: 10 };
      expect(context.create(undefined, entity)).toFailWith(/at least one alphanumeric/i);
    });

    test('should fail when collection.set fails via immutable check', () => {
      // Create an immutable collection that will reject set operations
      const immutableCollection = EditableCollection.createEditable<TestEntity, TestBaseId, TestEntityId>({
        collectionId: TEST_SOURCE_ID,
        metadata: { name: 'Immutable' },
        isMutable: false,
        initialItems: new Map(),
        keyConverter: testKeyConverter,
        valueConverter: testValueConverter
      }).orThrow();

      // This should fail at create because collection is not mutable
      expect(
        EditorContext.create<TestEntity, TestBaseId, TestEntityId>({
          collection: immutableCollection,
          createId: (c, b) => `${c}.${b}` as TestEntityId,
          getBaseId: () => 'test' as TestBaseId,
          getName: (e: TestEntity) => e.name
        })
      ).toFailWith(/immutable.*cannot be edited/i);
    });
  });

  describe('update', () => {
    test('should update existing entity', () => {
      const collection = createTestCollection(
        new Map([['item1' as TestBaseId, { name: 'Original', value: 10 }]])
      );
      const context = createTestContext(collection).orThrow();

      const updated: TestEntity = { name: 'Updated', value: 20 };
      expect(context.update('test-collection.item1' as TestEntityId, updated)).toSucceed();
      expect(context.get('test-collection.item1' as TestEntityId)).toSucceedWith(updated);
      expect(context.hasUnsavedChanges()).toBe(true);
    });

    test('should fail for non-existing entity', () => {
      const collection = createTestCollection();
      const context = createTestContext(collection).orThrow();

      expect(
        context.update('test-collection.nonexistent' as TestEntityId, { name: 'Test', value: 10 })
      ).toFailWith(/not found/i);
    });

    test('should fail semantic validation in update', () => {
      const collection = createTestCollection(
        new Map([['item1' as TestBaseId, { name: 'Item', value: 10 }]])
      );
      const context = createTestContext(collection, testEntitySemanticValidator).orThrow();

      // Entity with name 'invalid' fails semantic validation
      const update: TestEntity = { name: 'invalid', value: 20 };
      expect(context.update('test-collection.item1' as TestEntityId, update)).toFailWith(
        /semantic validation failed.*invalid/i
      );
    });
  });

  describe('delete', () => {
    test('should delete existing entity', () => {
      const collection = createTestCollection(
        new Map([['item1' as TestBaseId, { name: 'Item 1', value: 10 }]])
      );
      const context = createTestContext(collection).orThrow();

      expect(context.delete('test-collection.item1' as TestEntityId)).toSucceed();
      expect(context.exists('test-collection.item1' as TestEntityId)).toBe(false);
      expect(context.hasUnsavedChanges()).toBe(true);
    });

    test('should fail for non-existing entity', () => {
      const collection = createTestCollection();
      const context = createTestContext(collection).orThrow();

      expect(context.delete('test-collection.nonexistent' as TestEntityId)).toFailWith(/not found/i);
    });
  });

  describe('copyTo', () => {
    test('should return not implemented error by default', () => {
      const collection = createTestCollection(
        new Map([['item1' as TestBaseId, { name: 'Item 1', value: 10 }]])
      );
      const context = createTestContext(collection).orThrow();

      expect(context.copyTo('test-collection.item1' as TestEntityId, 'target-collection')).toFailWith(
        /not implemented/i
      );
    });
  });

  describe('exists', () => {
    test('should return true for existing entity', () => {
      const collection = createTestCollection(
        new Map([['item1' as TestBaseId, { name: 'Item 1', value: 10 }]])
      );
      const context = createTestContext(collection).orThrow();

      expect(context.exists('test-collection.item1' as TestEntityId)).toBe(true);
    });

    test('should return false for non-existing entity', () => {
      const collection = createTestCollection();
      const context = createTestContext(collection).orThrow();

      expect(context.exists('test-collection.nonexistent' as TestEntityId)).toBe(false);
    });

    test('should extract base ID from composite ID', () => {
      const collection = createTestCollection(
        new Map([['item1' as TestBaseId, { name: 'Item 1', value: 10 }]])
      );
      const context = createTestContext(collection).orThrow();

      expect(context.exists('any-prefix.item1' as TestEntityId)).toBe(true);
    });
  });

  describe('validate (semantic only)', () => {
    test('should validate entity with no semantic validator', () => {
      const collection = createTestCollection();
      const context = createTestContext(collection).orThrow();

      const entity: TestEntity = { name: 'Valid', value: 10 };
      expect(context.validate(entity)).toSucceedAndSatisfy((report) => {
        expect(report.isValid).toBe(true);
      });
    });

    test('should run semantic validation and report errors', () => {
      const collection = createTestCollection();
      const context = createTestContext(collection, testEntitySemanticValidator).orThrow();

      // Entity with name 'invalid' should fail semantic validation
      const entity: TestEntity = { name: 'invalid', value: 10 };
      expect(context.validate(entity)).toSucceedAndSatisfy((report) => {
        expect(report.isValid).toBe(false);
        expect(report.generalErrors.some((e) => e.includes('invalid'))).toBe(true);
      });
    });

    test('should pass semantic validation for valid entity', () => {
      const collection = createTestCollection();
      const context = createTestContext(collection, testEntitySemanticValidator).orThrow();

      const entity: TestEntity = { name: 'valid-name', value: 10 };
      expect(context.validate(entity)).toSucceedAndSatisfy((report) => {
        expect(report.isValid).toBe(true);
      });
    });
  });

  describe('unsaved changes tracking', () => {
    test('should not have unsaved changes initially', () => {
      const collection = createTestCollection();
      const context = createTestContext(collection).orThrow();

      expect(context.hasUnsavedChanges()).toBe(false);
    });

    test('should track unsaved changes after create', () => {
      const collection = createTestCollection();
      const context = createTestContext(collection).orThrow();

      context.create('new-item' as TestBaseId, { name: 'New', value: 10 }).orThrow();
      expect(context.hasUnsavedChanges()).toBe(true);
    });

    test('should track unsaved changes after update', () => {
      const collection = createTestCollection(
        new Map([['item1' as TestBaseId, { name: 'Item', value: 10 }]])
      );
      const context = createTestContext(collection).orThrow();

      context.update('test-collection.item1' as TestEntityId, { name: 'Updated', value: 20 }).orThrow();
      expect(context.hasUnsavedChanges()).toBe(true);
    });

    test('should track unsaved changes after delete', () => {
      const collection = createTestCollection(
        new Map([['item1' as TestBaseId, { name: 'Item', value: 10 }]])
      );
      const context = createTestContext(collection).orThrow();

      context.delete('test-collection.item1' as TestEntityId).orThrow();
      expect(context.hasUnsavedChanges()).toBe(true);
    });

    test('should clear unsaved changes flag', () => {
      const collection = createTestCollection();
      const context = createTestContext(collection).orThrow();

      context.create('new-item' as TestBaseId, { name: 'New', value: 10 }).orThrow();
      expect(context.hasUnsavedChanges()).toBe(true);

      context.clearUnsavedChanges();
      expect(context.hasUnsavedChanges()).toBe(false);
    });
  });
});
