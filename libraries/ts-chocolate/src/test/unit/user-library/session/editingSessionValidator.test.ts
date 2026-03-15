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

import {
  BaseIngredientId,
  BaseFillingId,
  Measurement,
  IngredientId,
  Percentage,
  FillingId,
  FillingName,
  FillingRecipeVariationSpec,
  Model as CommonModel,
  CollectionId
} from '../../../../packlets/common';
import {
  IGanacheCharacteristics,
  IChocolateIngredientEntity,
  IIngredientEntity,
  IngredientsLibrary,
  IFillingRecipeEntity,
  FillingsLibrary
} from '../../../../packlets/entities';
import { ChocolateEntityLibrary, ChocolateLibrary } from '../../../../packlets/library-runtime';
import { Session } from '../../../../packlets/user-library';

describe('EditingSessionValidator', () => {
  // ============================================================================
  // Test Data
  // ============================================================================

  const testChars: IGanacheCharacteristics = {
    cacaoFat: 36 as Percentage,
    sugar: 34 as Percentage,
    milkFat: 0 as Percentage,
    water: 1 as Percentage,
    solids: 29 as Percentage,
    otherFats: 0 as Percentage
  };

  const creamChars: IGanacheCharacteristics = {
    cacaoFat: 0 as Percentage,
    sugar: 3 as Percentage,
    milkFat: 38 as Percentage,
    water: 55 as Percentage,
    solids: 4 as Percentage,
    otherFats: 0 as Percentage
  };

  const darkChocolate: IChocolateIngredientEntity = {
    baseId: 'dark-chocolate' as BaseIngredientId,
    name: 'Dark Chocolate 70%',
    category: 'chocolate',
    chocolateType: 'dark',
    cacaoPercentage: 70 as Percentage,
    ganacheCharacteristics: testChars
  };

  const cream: IIngredientEntity = {
    baseId: 'cream' as BaseIngredientId,
    name: 'Heavy Cream',
    category: 'dairy',
    ganacheCharacteristics: creamChars
  };

  const testRecipe: IFillingRecipeEntity = {
    baseId: 'test-ganache' as BaseFillingId,
    name: 'Test Ganache' as FillingName,
    category: 'ganache',
    description: 'A test ganache recipe',
    goldenVariationSpec: '2026-01-01-01' as FillingRecipeVariationSpec,
    variations: [
      {
        variationSpec: '2026-01-01-01' as FillingRecipeVariationSpec,
        createdDate: '2026-01-01',
        notes: [{ category: 'user', note: 'Original recipe' }] as CommonModel.ICategorizedNote[],
        ingredients: [
          { ingredient: { ids: ['test.dark-chocolate' as IngredientId] }, amount: 200 as Measurement },
          { ingredient: { ids: ['test.cream' as IngredientId] }, amount: 100 as Measurement }
        ],
        baseWeight: 300 as Measurement
      }
    ]
  };

  let ctx: ChocolateLibrary;

  beforeEach(() => {
    const ingredients = IngredientsLibrary.create({
      builtin: false,
      collections: [
        {
          id: 'test' as CollectionId,
          isMutable: false,
          items: {
            /* eslint-disable @typescript-eslint/naming-convention */
            'dark-chocolate': darkChocolate,
            cream
            /* eslint-enable @typescript-eslint/naming-convention */
          }
        }
      ]
    }).orThrow();

    const fillings = FillingsLibrary.create({
      builtin: false,
      collections: [
        {
          id: 'test' as CollectionId,
          isMutable: false,
          items: {
            /* eslint-disable @typescript-eslint/naming-convention */
            'test-ganache': testRecipe
            /* eslint-enable @typescript-eslint/naming-convention */
          }
        }
      ]
    }).orThrow();

    const library = ChocolateEntityLibrary.create({
      builtin: false,
      libraries: { ingredients, fillings }
    }).orThrow();

    ctx = ChocolateLibrary.fromChocolateEntityLibrary(library).orThrow();
  });

  // ============================================================================
  // Accessor Tests
  // ============================================================================

  describe('accessors', () => {
    test('session accessor returns the underlying EditingSession', () => {
      const variation = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVariation;
      const editingSession = Session.EditingSession.create(variation).orThrow();
      const validator = new Session.EditingSessionValidator(editingSession);

      expect(validator.session).toBe(editingSession);
    });
  });

  // ============================================================================
  // setIngredient Tests
  // ============================================================================

  describe('setIngredient', () => {
    test('succeeds with valid string ID and numeric amount', () => {
      const variation = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVariation;
      const editingSession = Session.EditingSession.create(variation).orThrow();
      const validator = new Session.EditingSessionValidator(editingSession);

      expect(validator.setIngredient('test.dark-chocolate', 250)).toSucceed();
    });

    test('fails with empty string ID', () => {
      const variation = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVariation;
      const editingSession = Session.EditingSession.create(variation).orThrow();
      const validator = new Session.EditingSessionValidator(editingSession);

      expect(validator.setIngredient('', 250)).toFail();
    });

    test('fails with negative amount', () => {
      const variation = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVariation;
      const editingSession = Session.EditingSession.create(variation).orThrow();
      const validator = new Session.EditingSessionValidator(editingSession);

      expect(validator.setIngredient('test.dark-chocolate', -10)).toFail();
    });
  });

  // ============================================================================
  // removeIngredient Tests
  // ============================================================================

  describe('removeIngredient', () => {
    test('succeeds with valid string ID', () => {
      const variation = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVariation;
      const editingSession = Session.EditingSession.create(variation).orThrow();
      const validator = new Session.EditingSessionValidator(editingSession);

      expect(validator.removeIngredient('test.cream')).toSucceed();
    });

    test('fails with empty string ID', () => {
      const variation = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVariation;
      const editingSession = Session.EditingSession.create(variation).orThrow();
      const validator = new Session.EditingSessionValidator(editingSession);

      expect(validator.removeIngredient('')).toFail();
    });
  });

  // ============================================================================
  // scaleToTargetWeight Tests
  // ============================================================================

  describe('scaleToTargetWeight', () => {
    test('succeeds with positive weight', () => {
      const variation = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVariation;
      const editingSession = Session.EditingSession.create(variation).orThrow();
      const validator = new Session.EditingSessionValidator(editingSession);

      expect(validator.scaleToTargetWeight(600)).toSucceedAndSatisfy((result) => {
        expect(result).toBe(600);
      });
    });

    test('fails with negative weight', () => {
      const variation = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVariation;
      const editingSession = Session.EditingSession.create(variation).orThrow();
      const validator = new Session.EditingSessionValidator(editingSession);

      expect(validator.scaleToTargetWeight(-100)).toFail();
    });
  });

  // ============================================================================
  // setProcedure Tests
  // ============================================================================

  describe('setProcedure', () => {
    test('succeeds with valid procedure ID string', () => {
      const variation = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVariation;
      const editingSession = Session.EditingSession.create(variation).orThrow();
      const validator = new Session.EditingSessionValidator(editingSession);

      expect(validator.setProcedure('test.some-procedure')).toSucceed();
    });

    test('succeeds with undefined to clear procedure', () => {
      const variation = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVariation;
      const editingSession = Session.EditingSession.create(variation).orThrow();
      const validator = new Session.EditingSessionValidator(editingSession);

      expect(validator.setProcedure(undefined)).toSucceed();
    });
  });

  // ============================================================================
  // toReadOnly Tests
  // ============================================================================

  describe('toReadOnly', () => {
    test('returns object with session accessor', () => {
      const variation = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVariation;
      const editingSession = Session.EditingSession.create(variation).orThrow();
      const validator = new Session.EditingSessionValidator(editingSession);

      const readOnly = validator.toReadOnly();
      expect(readOnly.session).toBe(editingSession);
    });
  });
});
