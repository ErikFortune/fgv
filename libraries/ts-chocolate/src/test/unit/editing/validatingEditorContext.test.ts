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
import { CollectionId } from '../../../index';
import { EditableCollection, ValidatingEditorContext } from '../../../packlets/editing';

const TEST_SOURCE_ID = 'test-collection' as CollectionId;

interface TestEntity {
  name: string;
  value: number;
}

type TestBaseId = string & { readonly __brand: 'TestBaseId' };
type TestEntityId = string & { readonly __brand: 'TestEntityId' };

const toTestEntityId = (from: unknown): Result<TestEntityId> => {
  if (typeof from === 'string') {
    return succeed(from as TestEntityId);
  }
  if (typeof from !== 'object' || from === null || Array.isArray(from)) {
    return fail('invalid composite id');
  }
  const raw = from as Record<string, unknown>;
  if (typeof raw.collectionId !== 'string') {
    return fail('invalid collectionId');
  }
  if (typeof raw.itemId !== 'string') {
    return fail('invalid itemId');
  }
  return succeed(`${raw.collectionId}.${raw.itemId}` as TestEntityId);
};

const testEntityIdConverter: Converter<TestEntityId> = Converters.generic(toTestEntityId);

// Test converter for TestEntity with constraints
const testEntityConverter: Converter<TestEntity> = Converters.object<TestEntity>({
  name: Converters.string.withConstraint((s) => s.length > 0, { description: 'cannot be empty' }),
  value: Converters.number.withConstraint((n) => n >= 0, { description: 'must be non-negative' })
});

// Semantic validator for test entity (cross-field validation)
const testEntitySemanticValidator = (entity: TestEntity): Result<TestEntity> => {
  if (entity.name === 'invalid') {
    return fail('name cannot be "invalid"');
  }
  return succeed(entity);
};

describe('ValidatingEditorContext', () => {
  const testKeyConverter = Converters.string as unknown as Converter<TestBaseId>;
  const testValueConverter = testEntityConverter;

  const createTestCollection = (
    items: Map<TestBaseId, TestEntity> = new Map(),
    isMutable: boolean = true
  ): EditableCollection<TestEntity, TestBaseId> => {
    return EditableCollection.createEditable<TestEntity, TestBaseId>({
      collectionId: TEST_SOURCE_ID,
      metadata: { name: 'Test Collection' },
      isMutable,
      initialItems: items,
      keyConverter: testKeyConverter,
      valueConverter: testValueConverter
    }).orThrow();
  };

  describe('createValidating', () => {
    test('should create validating context with mutable collection', () => {
      const collection = createTestCollection();
      expect(
        ValidatingEditorContext.createValidating<TestEntity, TestBaseId, TestEntityId>({
          collection,
          entityConverter: testEntityConverter,
          keyConverter: testKeyConverter,
          createId: testEntityIdConverter,
          getBaseId: (e) => e.name.toLowerCase() as TestBaseId,
          getName: (e) => e.name
        })
      ).toSucceedAndSatisfy((context) => {
        expect(context).toBeInstanceOf(ValidatingEditorContext);
        expect(context.validating).toBeDefined();
      });
    });

    test('should fail for missing collection', () => {
      expect(
        ValidatingEditorContext.createValidating<TestEntity, TestBaseId, TestEntityId>({
          collection: null as unknown as EditableCollection<TestEntity, TestBaseId>,
          entityConverter: testEntityConverter,
          keyConverter: testKeyConverter,
          createId: testEntityIdConverter,
          getBaseId: (e) => e.name.toLowerCase() as TestBaseId,
          getName: (e) => e.name
        })
      ).toFailWith(/collection is required/i);
    });

    test('should fail for immutable collection', () => {
      const collection = createTestCollection(new Map(), false);
      expect(
        ValidatingEditorContext.createValidating<TestEntity, TestBaseId, TestEntityId>({
          collection,
          entityConverter: testEntityConverter,
          keyConverter: testKeyConverter,
          createId: testEntityIdConverter,
          getBaseId: (e) => e.name.toLowerCase() as TestBaseId,
          getName: (e) => e.name
        })
      ).toFailWith(/immutable.*cannot be edited/i);
    });
  });

  describe('validating property', () => {
    test('should provide access to validating methods', () => {
      const collection = createTestCollection();
      const context = ValidatingEditorContext.createValidating<TestEntity, TestBaseId, TestEntityId>({
        collection,
        entityConverter: testEntityConverter,
        keyConverter: testKeyConverter,
        createId: testEntityIdConverter,
        getBaseId: (e) => e.name.toLowerCase() as TestBaseId,
        getName: (e) => e.name
      }).orThrow();

      expect(typeof context.validating.create).toBe('function');
      expect(typeof context.validating.update).toBe('function');
      expect(typeof context.validating.validate).toBe('function');
    });
  });

  describe('validating.create', () => {
    test('should validate and create entity with raw string ID', () => {
      const collection = createTestCollection();
      const context = ValidatingEditorContext.createValidating<TestEntity, TestBaseId, TestEntityId>({
        collection,
        entityConverter: testEntityConverter,
        keyConverter: testKeyConverter,
        createId: testEntityIdConverter,
        getBaseId: (e) => e.name.toLowerCase() as TestBaseId,
        getName: (e) => e.name
      }).orThrow();

      const rawEntity = { name: 'Test Item', value: 42 };
      expect(context.validating.create('test-item', rawEntity)).toSucceedAndSatisfy((id) => {
        expect(id).toBe('test-collection.test-item');
        expect(context.exists(id)).toBe(true);
      });
    });

    test('should auto-generate ID when empty string', () => {
      const collection = createTestCollection();
      const context = ValidatingEditorContext.createValidating<TestEntity, TestBaseId, TestEntityId>({
        collection,
        entityConverter: testEntityConverter,
        keyConverter: testKeyConverter,
        createId: testEntityIdConverter,
        getBaseId: (e) => e.name.toLowerCase() as TestBaseId,
        getName: (e) => e.name
      }).orThrow();

      const rawEntity = { name: 'Auto Generated', value: 10 };
      expect(context.validating.create('', rawEntity)).toSucceedAndSatisfy((id) => {
        expect(id).toContain('test-collection.');
        expect(context.exists(id)).toBe(true);
      });
    });

    test('should fail for invalid entity', () => {
      const collection = createTestCollection();
      const context = ValidatingEditorContext.createValidating<TestEntity, TestBaseId, TestEntityId>({
        collection,
        entityConverter: testEntityConverter,
        keyConverter: testKeyConverter,
        createId: testEntityIdConverter,
        getBaseId: (e) => e.name.toLowerCase() as TestBaseId,
        getName: (e) => e.name
      }).orThrow();

      const invalidEntity = { name: '', value: -10 };
      expect(context.validating.create('test', invalidEntity)).toFailWith(/validation failed/i);
    });

    test('should fail for invalid base ID', () => {
      const collection = createTestCollection();
      const invalidKeyConverter = Converters.string.withConstraint((s) => s.length > 3, {
        description: 'must be longer than 3 characters'
      }) as unknown as Converter<TestBaseId>;

      const context = ValidatingEditorContext.createValidating<TestEntity, TestBaseId, TestEntityId>({
        collection,
        entityConverter: testEntityConverter,
        keyConverter: invalidKeyConverter,
        createId: testEntityIdConverter,
        getBaseId: (e) => e.name.toLowerCase() as TestBaseId,
        getName: (e) => e.name
      }).orThrow();

      const entity = { name: 'Test', value: 10 };
      expect(context.validating.create('ab', entity)).toFailWith(/invalid base id/i);
    });
  });

  describe('validating.update', () => {
    test('should validate and update entity', () => {
      const existingEntity: TestEntity = { name: 'Original', value: 10 };
      const collection = createTestCollection(new Map([['item1' as TestBaseId, existingEntity]]));
      const context = ValidatingEditorContext.createValidating<TestEntity, TestBaseId, TestEntityId>({
        collection,
        entityConverter: testEntityConverter,
        keyConverter: testKeyConverter,
        createId: testEntityIdConverter,
        getBaseId: (e) => e.name.toLowerCase() as TestBaseId,
        getName: (e) => e.name
      }).orThrow();

      const rawUpdate = { name: 'Updated', value: 20 };
      expect(context.validating.update('test-collection.item1' as TestEntityId, rawUpdate)).toSucceed();
      expect(context.get('test-collection.item1' as TestEntityId)).toSucceedWith(rawUpdate);
    });

    test('should fail validation for invalid update', () => {
      const existingEntity: TestEntity = { name: 'Original', value: 10 };
      const collection = createTestCollection(new Map([['item1' as TestBaseId, existingEntity]]));
      const context = ValidatingEditorContext.createValidating<TestEntity, TestBaseId, TestEntityId>({
        collection,
        entityConverter: testEntityConverter,
        keyConverter: testKeyConverter,
        createId: testEntityIdConverter,
        getBaseId: (e) => e.name.toLowerCase() as TestBaseId,
        getName: (e) => e.name
      }).orThrow();

      const invalidUpdate = { name: '', value: -5 };
      expect(context.validating.update('test-collection.item1' as TestEntityId, invalidUpdate)).toFailWith(
        /validation failed/i
      );
    });
  });

  describe('validating.validate', () => {
    test('should validate raw entity with converter', () => {
      const collection = createTestCollection();
      const context = ValidatingEditorContext.createValidating<TestEntity, TestBaseId, TestEntityId>({
        collection,
        entityConverter: testEntityConverter,
        keyConverter: testKeyConverter,
        createId: testEntityIdConverter,
        getBaseId: (e) => e.name.toLowerCase() as TestBaseId,
        getName: (e) => e.name
      }).orThrow();

      const validEntity = { name: 'Valid', value: 10 };
      expect(context.validating.validate(validEntity)).toSucceedAndSatisfy((report) => {
        expect(report.isValid).toBe(true);
      });
    });

    test('should return validation errors for invalid entity', () => {
      const collection = createTestCollection();
      const context = ValidatingEditorContext.createValidating<TestEntity, TestBaseId, TestEntityId>({
        collection,
        entityConverter: testEntityConverter,
        keyConverter: testKeyConverter,
        createId: testEntityIdConverter,
        getBaseId: (e) => e.name.toLowerCase() as TestBaseId,
        getName: (e) => e.name
      }).orThrow();

      const invalidEntity = { name: '', value: -10 };
      expect(context.validating.validate(invalidEntity)).toSucceedAndSatisfy((report) => {
        expect(report.isValid).toBe(false);
        expect(report.generalErrors.length).toBeGreaterThan(0);
      });
    });

    test('should delegate to semantic validation for valid converter result', () => {
      const collection = createTestCollection();
      const context = ValidatingEditorContext.createValidating<TestEntity, TestBaseId, TestEntityId>({
        collection,
        entityConverter: testEntityConverter,
        keyConverter: testKeyConverter,
        semanticValidator: testEntitySemanticValidator,
        createId: testEntityIdConverter,
        getBaseId: (e) => e.name.toLowerCase() as TestBaseId,
        getName: (e) => e.name
      }).orThrow();

      // Entity passes converter but fails semantic validation
      const entity = { name: 'invalid', value: 10 };
      expect(context.validating.validate(entity)).toSucceedAndSatisfy((report) => {
        expect(report.isValid).toBe(false);
        expect(report.generalErrors.some((e) => e.includes('invalid'))).toBe(true);
      });
    });
  });

  describe('base methods', () => {
    test('should use base create with pre-validated types', () => {
      const collection = createTestCollection();
      const context = ValidatingEditorContext.createValidating<TestEntity, TestBaseId, TestEntityId>({
        collection,
        entityConverter: testEntityConverter,
        keyConverter: testKeyConverter,
        createId: testEntityIdConverter,
        getBaseId: (e) => e.name.toLowerCase() as TestBaseId,
        getName: (e) => e.name
      }).orThrow();

      const entity: TestEntity = { name: 'Direct', value: 100 };
      expect(context.create('direct-item' as TestBaseId, entity)).toSucceedAndSatisfy((id) => {
        expect(id).toBe('test-collection.direct-item');
      });
    });

    test('should use base update with pre-validated types', () => {
      const existingEntity: TestEntity = { name: 'Original', value: 10 };
      const collection = createTestCollection(new Map([['item1' as TestBaseId, existingEntity]]));
      const context = ValidatingEditorContext.createValidating<TestEntity, TestBaseId, TestEntityId>({
        collection,
        entityConverter: testEntityConverter,
        keyConverter: testKeyConverter,
        createId: testEntityIdConverter,
        getBaseId: (e) => e.name.toLowerCase() as TestBaseId,
        getName: (e) => e.name
      }).orThrow();

      const updated: TestEntity = { name: 'Updated', value: 99 };
      expect(context.update('test-collection.item1' as TestEntityId, updated)).toSucceed();
    });
  });
});
