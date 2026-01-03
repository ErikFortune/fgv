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

import { BaseIngredientId, IngredientId, Percentage, SourceId } from '../../../packlets/common';

import {
  IngredientsLibrary,
  Ingredient,
  IIngredient,
  IGanacheCharacteristics,
  isChocolateIngredient,
  isDairyIngredient,
  isFatIngredient,
  isSugarIngredient
} from '../../../packlets/ingredients';

describe('IngredientsLibrary', () => {
  // ============================================================================
  // Test Data
  // ============================================================================

  const testCharacteristics: IGanacheCharacteristics = {
    cacaoFat: 36 as Percentage,
    sugar: 34 as Percentage,
    milkFat: 0 as Percentage,
    water: 1 as Percentage,
    solids: 29 as Percentage,
    otherFats: 0 as Percentage
  };

  const testIngredient: IIngredient = {
    baseId: 'test-choco' as BaseIngredientId,
    name: 'Test Chocolate',
    category: 'chocolate',
    ganacheCharacteristics: testCharacteristics
  };

  // ============================================================================
  // Creation Tests
  // ============================================================================

  describe('create', () => {
    test('creates empty library with builtin: false', () => {
      expect(IngredientsLibrary.create({ builtin: false })).toSucceedAndSatisfy((lib) => {
        expect(lib.size).toBe(0);
        expect(lib.collectionCount).toBe(0);
      });
    });

    test('creates library with built-ins by default', () => {
      expect(IngredientsLibrary.create()).toSucceedAndSatisfy((lib) => {
        expect(lib.size).toBeGreaterThan(0);
        expect(lib.collectionCount).toBe(4);
      });
    });

    test('creates library with additional collections', () => {
      const result = IngredientsLibrary.create({
        builtin: false,
        collections: [
          {
            id: 'test' as SourceId,
            isMutable: true,
            items: {
              testChoco: testIngredient
            }
          }
        ]
      });

      expect(result).toSucceedAndSatisfy((lib) => {
        expect(lib.size).toBe(1);
        expect(lib.collectionCount).toBe(1);
      });
    });

    test('combines built-ins with additional collections', () => {
      const result = IngredientsLibrary.create({
        collections: [
          {
            id: 'test' as SourceId,
            isMutable: true,
            items: {
              testChoco: testIngredient
            }
          }
        ]
      });

      expect(result).toSucceedAndSatisfy((lib) => {
        expect(lib.collectionCount).toBe(5); // 4 built-in + 1 custom
        expect(lib.validating.has('test.testChoco')).toBe(true);
        expect(lib.validating.has('common.heavy-cream-35')).toBe(true);
      });
    });
  });

  describe('builtin parameter', () => {
    test('includes common ingredients', () => {
      expect(IngredientsLibrary.create()).toSucceedAndSatisfy((lib) => {
        expect(lib.validating.has('common.heavy-cream-35')).toBe(true);
      });
    });

    test('includes felchlin ingredients', () => {
      expect(IngredientsLibrary.create()).toSucceedAndSatisfy((lib) => {
        expect(lib.validating.has('felchlin.maracaibo-65')).toBe(true);
      });
    });

    test('loads specific built-in collections with array', () => {
      expect(
        IngredientsLibrary.create({
          builtin: ['common' as SourceId, 'felchlin' as SourceId]
        })
      ).toSucceedAndSatisfy((lib) => {
        expect(lib.collectionCount).toBe(2);
        expect(lib.validating.has('common.heavy-cream-35')).toBe(true);
        expect(lib.validating.has('felchlin.maracaibo-65')).toBe(true);
      });
    });

    test('loads built-ins with fine-grained params', () => {
      expect(
        IngredientsLibrary.create({
          builtin: {
            excluded: ['guittard', 'cacao-barry']
          }
        })
      ).toSucceedAndSatisfy((lib) => {
        expect(lib.collectionCount).toBe(2);
        expect(lib.validating.has('common.heavy-cream-35')).toBe(true);
        expect(lib.validating.has('felchlin.maracaibo-65')).toBe(true);
      });
    });
  });

  // ============================================================================
  // Lookup Tests
  // ============================================================================

  describe('get and has', () => {
    let library: IngredientsLibrary;

    beforeEach(() => {
      library = IngredientsLibrary.create().orThrow();
    });

    test('gets existing ingredient', () => {
      const id = 'felchlin.maracaibo-65';
      expect(library.validating.get(id)).toSucceedAndSatisfy((ingredient) => {
        expect(ingredient.name).toBe('Felchlin Maracaibo Clasificado 65%');
      });
    });

    test('fails for non-existent ingredient', () => {
      const id = 'felchlin.nonexistent' as IngredientId;
      expect(library.get(id)).toFail();
    });

    test('has returns true for existing ingredient', () => {
      expect(library.has('felchlin.maracaibo-65' as IngredientId)).toBe(true);
    });

    test('has returns false for non-existent ingredient', () => {
      expect(library.has('felchlin.nonexistent' as IngredientId)).toBe(false);
    });
  });

  // ============================================================================
  // Iteration Tests
  // ============================================================================

  describe('iteration', () => {
    let library: IngredientsLibrary;

    beforeEach(() => {
      library = IngredientsLibrary.create().orThrow();
    });

    test('entries iterates all items', () => {
      const entries = Array.from(library.entries());
      expect(entries.length).toBe(library.size);
      // KeyValueEntry is a tuple [key, value]
      expect(entries[0]).toHaveLength(2);
      expect(typeof entries[0][0]).toBe('string');
    });

    test('keys iterates all keys', () => {
      const keys = Array.from(library.keys());
      expect(keys.length).toBe(library.size);
      expect(keys.every((k) => typeof k === 'string')).toBe(true);
    });

    test('values iterates all values', () => {
      const values = Array.from(library.values());
      expect(values.length).toBe(library.size);
      expect(values.every((v) => typeof v.name === 'string')).toBe(true);
    });

    test('Symbol.iterator works', () => {
      const items = Array.from(library);
      expect(items.length).toBe(library.size);
    });
  });

  // ============================================================================
  // Mutation Tests
  // ============================================================================

  describe('mutation', () => {
    let library: IngredientsLibrary;

    beforeEach(() => {
      library = IngredientsLibrary.create({
        builtin: false,
        collections: [
          {
            id: 'test' as SourceId,
            isMutable: true,
            items: {}
          }
        ]
      }).orThrow();
    });

    test('add succeeds for new ingredient', () => {
      const id = 'test.new-choco' as IngredientId;
      expect(library.add(id, testIngredient)).toSucceed();
      expect(library.has(id)).toBe(true);
    });

    test('add fails for duplicate ingredient', () => {
      const id = 'test.new-choco' as IngredientId;
      library.add(id, testIngredient).orThrow();
      expect(library.add(id, testIngredient)).toFail();
    });

    test('set adds or updates ingredient', () => {
      const id = 'test.set-choco' as IngredientId;
      expect(library.set(id, testIngredient)).toSucceed();
      expect(library.has(id)).toBe(true);

      const updated = { ...testIngredient, name: 'Updated Name' };
      expect(library.set(id, updated)).toSucceed();
      expect(library.get(id)).toSucceedAndSatisfy((ing) => {
        expect(ing.name).toBe('Updated Name');
      });
    });

    test('update fails for non-existent ingredient', () => {
      const id = 'test.nonexistent' as IngredientId;
      expect(library.update(id, testIngredient)).toFail();
    });

    test('update succeeds for existing ingredient', () => {
      const id = 'test.update-choco' as IngredientId;
      library.add(id, testIngredient).orThrow();

      const updated = { ...testIngredient, name: 'Updated Name' };
      expect(library.update(id, updated)).toSucceed();
    });

    test('delete removes ingredient', () => {
      const id = 'test.delete-choco' as IngredientId;
      library.add(id, testIngredient).orThrow();
      expect(library.delete(id)).toSucceed();
      expect(library.has(id)).toBe(false);
    });

    test('delete fails for non-existent ingredient', () => {
      expect(library.delete('test.nonexistent' as IngredientId)).toFail();
    });
  });

  describe('mutation of immutable collections', () => {
    let library: IngredientsLibrary;

    beforeEach(() => {
      // Built-in collections are always immutable
      library = IngredientsLibrary.create().orThrow();
    });

    test('add fails for immutable collection', () => {
      const id = 'felchlin.new-choco' as IngredientId;
      expect(library.add(id, testIngredient)).toFail();
    });

    test('set fails for immutable collection', () => {
      const id = 'felchlin.maracaibo-65' as IngredientId;
      expect(library.set(id, testIngredient)).toFail();
    });

    test('delete fails for immutable collection', () => {
      const id = 'felchlin.maracaibo-65' as IngredientId;
      expect(library.delete(id)).toFail();
    });
  });

  // ============================================================================
  // Collection Management Tests
  // ============================================================================

  describe('collection management', () => {
    let library: IngredientsLibrary;

    beforeEach(() => {
      library = IngredientsLibrary.create({ builtin: false }).orThrow();
    });

    test('addCollectionEntry adds a collection', () => {
      expect(
        library.addCollectionEntry({
          id: 'new-source' as SourceId,
          isMutable: true,
          items: { testItem: testIngredient }
        })
      ).toSucceed();
      expect(library.collectionCount).toBe(1);
    });

    test('addCollectionWithItems adds a collection', () => {
      expect(library.addCollectionWithItems('custom', [['item1', testIngredient]])).toSucceed();
      expect(library.collectionCount).toBe(1);
    });

    test('composeId creates valid composite ID', () => {
      expect(library.composeId('source' as SourceId, 'base' as BaseIngredientId)).toSucceedWith(
        'source.base' as IngredientId
      );
    });
  });

  // ============================================================================
  // Validating Access Tests
  // ============================================================================

  describe('validating access', () => {
    let library: IngredientsLibrary;

    beforeEach(() => {
      library = IngredientsLibrary.create().orThrow();
    });

    test('validating.get converts string key', () => {
      expect(library.validating.get('felchlin.maracaibo-65')).toSucceed();
    });

    test('validating.has works with string key', () => {
      expect(library.validating.has('felchlin.maracaibo-65')).toBe(true);
      expect(library.validating.has('nonexistent.id')).toBe(false);
    });
  });

  // ============================================================================
  // Collections Access Tests
  // ============================================================================

  describe('collections access', () => {
    let library: IngredientsLibrary;

    beforeEach(() => {
      library = IngredientsLibrary.create().orThrow();
    });

    test('collections returns readonly map', () => {
      const collections = library.collections;
      expect(collections.validating.has('common')).toBe(true);
      expect(collections.validating.has('felchlin')).toBe(true);
    });
  });
});

// ============================================================================
// Type Guard Tests
// ============================================================================

describe('Ingredient type guards', () => {
  const baseIngredient: IIngredient = {
    baseId: 'test' as BaseIngredientId,
    name: 'Test',
    category: 'other',
    ganacheCharacteristics: {
      cacaoFat: 0 as Percentage,
      sugar: 0 as Percentage,
      milkFat: 0 as Percentage,
      water: 0 as Percentage,
      solids: 0 as Percentage,
      otherFats: 0 as Percentage
    }
  };

  const chocolateIngredient: Ingredient = {
    ...baseIngredient,
    category: 'chocolate',
    chocolateType: 'dark',
    cacaoPercentage: 70 as Percentage
  };

  const sugarIngredient: Ingredient = { ...baseIngredient, category: 'sugar' };
  const dairyIngredient: Ingredient = { ...baseIngredient, category: 'dairy' };
  const fatIngredient: Ingredient = { ...baseIngredient, category: 'fat' };

  test.each([
    ['isChocolateIngredient', isChocolateIngredient, chocolateIngredient, true],
    ['isChocolateIngredient', isChocolateIngredient, sugarIngredient, false],
    ['isSugarIngredient', isSugarIngredient, sugarIngredient, true],
    ['isSugarIngredient', isSugarIngredient, chocolateIngredient, false],
    ['isDairyIngredient', isDairyIngredient, dairyIngredient, true],
    ['isDairyIngredient', isDairyIngredient, chocolateIngredient, false],
    ['isFatIngredient', isFatIngredient, fatIngredient, true],
    ['isFatIngredient', isFatIngredient, chocolateIngredient, false]
  ])('%s returns %p for %p', (name, fn, input, expected) => {
    expect(fn(input)).toBe(expected);
  });
});
