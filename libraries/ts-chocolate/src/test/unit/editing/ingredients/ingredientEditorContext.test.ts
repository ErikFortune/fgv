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
import { Converter, Converters } from '@fgv/ts-utils';
import { EditableCollection } from '../../../../packlets/editing';
// eslint-disable-next-line @rushstack/packlets/mechanics
import { IngredientEditorContext } from '../../../../packlets/editing/ingredients';
import {
  Ingredient,
  IChocolateIngredient,
  IGanacheCharacteristics,
  Converters as EntityConverters
} from '../../../../packlets/entities';
import { BaseIngredientId, Celsius, IngredientId, Percentage, SourceId } from '../../../../index';

const TEST_SOURCE_ID = 'test-ingredients' as SourceId;
const testKeyConverter = Converters.string as unknown as Converter<BaseIngredientId>;

// Helper functions for branded types
const pct = (n: number): Percentage => n as Percentage;
const temp = (n: number): Celsius => n as Celsius;

// Helper to create ganache characteristics
const createGanache = (
  cacaoFat: number,
  sugar: number,
  milkFat: number,
  water: number,
  solids: number,
  otherFats: number
): IGanacheCharacteristics => ({
  cacaoFat: pct(cacaoFat),
  sugar: pct(sugar),
  milkFat: pct(milkFat),
  water: pct(water),
  solids: pct(solids),
  otherFats: pct(otherFats)
});

describe('IngredientEditorContext', () => {
  const createTestCollection = (
    items: Map<BaseIngredientId, Ingredient> = new Map(),
    isMutable: boolean = true
  ): EditableCollection<Ingredient, BaseIngredientId, IngredientId> => {
    return EditableCollection.createEditable<Ingredient, BaseIngredientId, IngredientId>({
      collectionId: TEST_SOURCE_ID,
      metadata: { name: 'Test Ingredients' },
      isMutable,
      initialItems: items,
      keyConverter: testKeyConverter,
      valueConverter: EntityConverters.Ingredients.ingredient
    }).orThrow();
  };

  const createValidIngredient = (): Ingredient => ({
    baseId: 'test-ingredient' as BaseIngredientId,
    name: 'Test Ingredient',
    category: 'other',
    description: 'A test ingredient',
    manufacturer: 'Test Manufacturer',
    density: 1.0,
    ganacheCharacteristics: createGanache(0, 50, 0, 30, 20, 0)
  });

  const createChocolateIngredient = (): IChocolateIngredient => ({
    baseId: 'dark-chocolate' as BaseIngredientId,
    name: 'Dark Chocolate',
    category: 'chocolate',
    description: 'A dark chocolate ingredient',
    manufacturer: 'Test Chocolatier',
    density: 1.2,
    chocolateType: 'dark',
    cacaoPercentage: pct(70),
    ganacheCharacteristics: createGanache(40, 20, 0, 0, 40, 0),
    temperatureCurve: {
      melt: temp(50),
      cool: temp(32),
      working: temp(31)
    }
  });

  describe('createFromCollection', () => {
    test('should create ingredient editor context with mutable collection', () => {
      const collection = createTestCollection();
      expect(IngredientEditorContext.createFromCollection(collection)).toSucceedAndSatisfy((context) => {
        expect(context).toBeInstanceOf(IngredientEditorContext);
      });
    });

    test('should fail for immutable collection', () => {
      const collection = createTestCollection(new Map(), false);
      expect(IngredientEditorContext.createFromCollection(collection)).toFailWith(
        /immutable.*cannot be edited/i
      );
    });

    test('should create context with existing items', () => {
      const ingredient = createValidIngredient();
      const collection = createTestCollection(new Map([['test-ingredient' as BaseIngredientId, ingredient]]));
      expect(IngredientEditorContext.createFromCollection(collection)).toSucceedAndSatisfy((context) => {
        expect(context.exists('test-ingredients.test-ingredient' as IngredientId)).toBe(true);
      });
    });
  });

  describe('validate', () => {
    test('should validate valid ingredient', () => {
      const collection = createTestCollection();
      const context = IngredientEditorContext.createFromCollection(collection).orThrow();
      const ingredient = createValidIngredient();

      expect(context.validate(ingredient)).toSucceedAndSatisfy((report) => {
        expect(report.isValid).toBe(true);
      });
    });

    test('should validate valid chocolate ingredient with temperature curve', () => {
      const collection = createTestCollection();
      const context = IngredientEditorContext.createFromCollection(collection).orThrow();
      const ingredient = createChocolateIngredient();

      expect(context.validate(ingredient)).toSucceedAndSatisfy((report) => {
        expect(report.isValid).toBe(true);
      });
    });

    test('should fail for invalid field via validating.validate', () => {
      const collection = createTestCollection();
      const context = IngredientEditorContext.createFromCollection(collection).orThrow();
      const ingredient = {
        ...createValidIngredient(),
        name: '' // Invalid: name is required
      };

      // Use validating.validate for raw input validation (converter-based)
      expect(context.validating.validate(ingredient)).toSucceedAndSatisfy((report) => {
        expect(report.isValid).toBe(false);
        // Converter-based validation reports errors as general errors
        expect(report.generalErrors.length).toBeGreaterThan(0);
      });
    });

    test('should run entity-level validation for chocolate ingredients', () => {
      const collection = createTestCollection();
      const context = IngredientEditorContext.createFromCollection(collection).orThrow();
      const ingredient: IChocolateIngredient = {
        baseId: 'invalid-chocolate' as BaseIngredientId,
        name: 'Invalid Chocolate',
        category: 'chocolate',
        description: 'Chocolate with invalid temp curve',
        manufacturer: 'Test',
        density: 1.2,
        chocolateType: 'dark',
        cacaoPercentage: pct(70),
        ganacheCharacteristics: createGanache(40, 20, 0, 0, 40, 0),
        temperatureCurve: {
          melt: temp(50),
          cool: temp(27), // Invalid: cool < working
          working: temp(31)
        }
      };

      expect(context.validate(ingredient)).toSucceedAndSatisfy((report) => {
        expect(report.isValid).toBe(false);
        expect(report.generalErrors.length).toBeGreaterThan(0);
        expect(report.generalErrors[0]).toMatch(/cool.*must be greater than working/i);
      });
    });

    test('should return validation errors early without semantic validation via validating.validate', () => {
      const collection = createTestCollection();
      const context = IngredientEditorContext.createFromCollection(collection).orThrow();
      const ingredient = {
        ...createValidIngredient(),
        name: '' // Invalid: name is required
      };

      // Use validating.validate for converter validation - should report errors early
      // without running semantic validation (because converter validation fails first)
      expect(context.validating.validate(ingredient)).toSucceedAndSatisfy((report) => {
        expect(report.isValid).toBe(false);
        // Converter-based validation reports errors as general errors
        expect(report.generalErrors.length).toBeGreaterThan(0);
        // Semantic validation should not be run because converter validation failed
      });
    });
  });

  describe('getIngredientName', () => {
    test('should return ingredient name', () => {
      const collection = createTestCollection();
      const context = IngredientEditorContext.createFromCollection(collection).orThrow();
      const ingredient = createValidIngredient();

      expect(context.getIngredientName(ingredient)).toBe('Test Ingredient');
    });
  });

  describe('getIngredientCategory', () => {
    test('should return ingredient category', () => {
      const collection = createTestCollection();
      const context = IngredientEditorContext.createFromCollection(collection).orThrow();
      const ingredient = createValidIngredient();

      expect(context.getIngredientCategory(ingredient)).toBe('other');
    });
  });

  describe('inherited CRUD operations', () => {
    test('should create new ingredient with base method using branded ID', () => {
      const collection = createTestCollection();
      const context = IngredientEditorContext.createFromCollection(collection).orThrow();
      const ingredient = createValidIngredient();

      expect(context.create('my-ingredient' as BaseIngredientId, ingredient)).toSucceedAndSatisfy((id) => {
        expect(id).toBe('test-ingredients.my-ingredient');
        expect(context.exists(id)).toBe(true);
      });
    });

    test('should create new ingredient with validating method using raw string', () => {
      const collection = createTestCollection();
      const context = IngredientEditorContext.createFromCollection(collection).orThrow();
      const ingredient = createValidIngredient();

      // Use validating.create() for raw string input
      expect(context.validating.create('my-ingredient', ingredient)).toSucceedAndSatisfy((id) => {
        expect(id).toBe('test-ingredients.my-ingredient');
        expect(context.exists(id)).toBe(true);
      });
    });

    test('should auto-generate ID from ingredient name when baseId is empty string via validating', () => {
      const collection = createTestCollection();
      const context = IngredientEditorContext.createFromCollection(collection).orThrow();
      const ingredient = createValidIngredient();

      // Use validating.create() with empty string for auto-generation
      expect(context.validating.create('', ingredient)).toSucceedAndSatisfy((id) => {
        // ID should be generated from 'Test Ingredient' -> 'test-ingredient'
        expect(id).toBe('test-ingredients.test-ingredient');
        expect(context.exists(id)).toBe(true);
      });
    });

    test('should auto-generate ID from ingredient name when baseId is undefined', () => {
      const collection = createTestCollection();
      const context = IngredientEditorContext.createFromCollection(collection).orThrow();
      const ingredient = createValidIngredient();

      // Use base create() with undefined for auto-generation
      expect(context.create(undefined, ingredient)).toSucceedAndSatisfy((id) => {
        // ID should be generated from 'Test Ingredient' -> 'test-ingredient'
        expect(id).toBe('test-ingredients.test-ingredient');
        expect(context.exists(id)).toBe(true);
      });
    });

    test('should get existing ingredient', () => {
      const ingredient = createValidIngredient();
      const collection = createTestCollection(new Map([['test-ingredient' as BaseIngredientId, ingredient]]));
      const context = IngredientEditorContext.createFromCollection(collection).orThrow();

      expect(context.get('test-ingredients.test-ingredient' as IngredientId)).toSucceedWith(ingredient);
    });

    test('should update existing ingredient', () => {
      const ingredient = createValidIngredient();
      const collection = createTestCollection(new Map([['test-ingredient' as BaseIngredientId, ingredient]]));
      const context = IngredientEditorContext.createFromCollection(collection).orThrow();

      const updated = { ...ingredient, name: 'Updated Name' };
      expect(context.update('test-ingredients.test-ingredient' as IngredientId, updated)).toSucceed();
      expect(context.get('test-ingredients.test-ingredient' as IngredientId)).toSucceedWith(updated);
    });

    test('should delete existing ingredient', () => {
      const ingredient = createValidIngredient();
      const collection = createTestCollection(new Map([['test-ingredient' as BaseIngredientId, ingredient]]));
      const context = IngredientEditorContext.createFromCollection(collection).orThrow();

      expect(context.delete('test-ingredients.test-ingredient' as IngredientId)).toSucceed();
      expect(context.exists('test-ingredients.test-ingredient' as IngredientId)).toBe(false);
    });
  });
});
