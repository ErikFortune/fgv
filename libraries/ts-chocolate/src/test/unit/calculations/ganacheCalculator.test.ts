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
import { Failure, Success } from '@fgv/ts-utils';

import {
  BaseIngredientId,
  BaseFillingId,
  Measurement,
  IngredientId,
  Percentage,
  FillingName,
  FillingVersionSpec
} from '../../../packlets/common';

import { Ingredients, Ingredient } from '../../../packlets/entities';

import { Fillings, IFillingRecipe, IFillingRecipeVersion } from '../../../packlets/entities';

import {
  IngredientResolver,
  IResolvedIngredient,
  Internal as RuntimeInternal
} from '../../../packlets/library-runtime';

describe('Ganache Calculator', () => {
  // ============================================================================
  // Test Data
  // ============================================================================

  const darkChocolateChars: Ingredients.IGanacheCharacteristics = {
    cacaoFat: 36 as Percentage,
    sugar: 34 as Percentage,
    milkFat: 0 as Percentage,
    water: 1 as Percentage,
    solids: 29 as Percentage,
    otherFats: 0 as Percentage
  };

  const creamChars: Ingredients.IGanacheCharacteristics = {
    cacaoFat: 0 as Percentage,
    sugar: 0 as Percentage,
    milkFat: 35 as Percentage,
    water: 60 as Percentage,
    solids: 5 as Percentage,
    otherFats: 0 as Percentage
  };

  const darkChocolate: Ingredient = {
    baseId: 'dark-70' as BaseIngredientId,
    name: 'Dark 70%',
    category: 'chocolate',
    chocolateType: 'dark',
    cacaoPercentage: 70 as Percentage,
    ganacheCharacteristics: darkChocolateChars
  };

  const cream: Ingredients.IIngredient = {
    baseId: 'cream-35' as BaseIngredientId,
    name: 'Heavy Cream 35%',
    category: 'dairy',
    ganacheCharacteristics: creamChars
  };

  const testResolver: IngredientResolver = (id: IngredientId) => {
    if (id === ('test.chocolate' as IngredientId)) return Success.with(darkChocolate);
    if (id === ('test.cream' as IngredientId)) return Success.with(cream);
    return Failure.with(`Unknown ingredient: ${id}`);
  };

  // ============================================================================
  // calculateFromIngredients Tests
  // ============================================================================

  describe('calculateFromIngredients', () => {
    test('calculates blended characteristics', () => {
      const resolved: IResolvedIngredient[] = [
        { ingredient: darkChocolate, amount: 100 as Measurement },
        { ingredient: cream, amount: 50 as Measurement }
      ];

      const analysis = RuntimeInternal.calculateFromIngredients(resolved);

      // Total weight
      expect(analysis.totalWeight).toBe(150);

      // Weighted averages: chocolate contributes 2/3, cream contributes 1/3
      // cacaoFat: (36*100 + 0*50) / 150 = 24
      expect(analysis.characteristics.cacaoFat).toBeCloseTo(24, 1);
      // milkFat: (0*100 + 35*50) / 150 = 11.67
      expect(analysis.characteristics.milkFat).toBeCloseTo(11.67, 1);
      // water: (1*100 + 60*50) / 150 = 20.67
      expect(analysis.characteristics.water).toBeCloseTo(20.67, 1);
    });

    test('calculates total fat correctly', () => {
      const resolved: IResolvedIngredient[] = [
        { ingredient: darkChocolate, amount: 100 as Measurement },
        { ingredient: cream, amount: 50 as Measurement }
      ];

      const analysis = RuntimeInternal.calculateFromIngredients(resolved);

      // totalFat = cacaoFat + milkFat + otherFats
      const expectedTotalFat =
        analysis.characteristics.cacaoFat +
        analysis.characteristics.milkFat +
        analysis.characteristics.otherFats;
      expect(analysis.totalFat).toBeCloseTo(expectedTotalFat, 5);
    });

    test('calculates ratios correctly', () => {
      const resolved: IResolvedIngredient[] = [
        { ingredient: darkChocolate, amount: 100 as Measurement },
        { ingredient: cream, amount: 50 as Measurement }
      ];

      const analysis = RuntimeInternal.calculateFromIngredients(resolved);

      expect(analysis.fatToWaterRatio).toBeCloseTo(analysis.totalFat / analysis.characteristics.water, 2);
      expect(analysis.sugarToWaterRatio).toBeCloseTo(
        analysis.characteristics.sugar / analysis.characteristics.water,
        2
      );
    });

    test('handles empty ingredients list', () => {
      const analysis = RuntimeInternal.calculateFromIngredients([]);

      expect(analysis.totalWeight).toBe(0);
      expect(analysis.characteristics.cacaoFat).toBe(0);
    });

    test('handles zero water (Infinity ratios)', () => {
      const noWaterIngredient: Ingredients.IIngredient = {
        baseId: 'no-water' as BaseIngredientId,
        name: 'No Water',
        category: 'other',
        ganacheCharacteristics: {
          cacaoFat: 50 as Percentage,
          sugar: 50 as Percentage,
          milkFat: 0 as Percentage,
          water: 0 as Percentage,
          solids: 0 as Percentage,
          otherFats: 0 as Percentage
        }
      };

      const resolved: IResolvedIngredient[] = [{ ingredient: noWaterIngredient, amount: 100 as Measurement }];

      const analysis = RuntimeInternal.calculateFromIngredients(resolved);
      expect(analysis.fatToWaterRatio).toBe(Infinity);
      expect(analysis.sugarToWaterRatio).toBe(Infinity);
    });
  });

  // ============================================================================
  // calculateFromFillingRecipeIngredients Tests
  // ============================================================================

  describe('calculateFromFillingRecipeIngredients', () => {
    test('resolves and calculates ingredients', () => {
      const fillingIngredients: Fillings.IFillingIngredient[] = [
        { ingredient: { ids: ['test.chocolate' as IngredientId] }, amount: 100 as Measurement },
        { ingredient: { ids: ['test.cream' as IngredientId] }, amount: 50 as Measurement }
      ];

      expect(
        RuntimeInternal.calculateFromFillingRecipeIngredients(fillingIngredients, testResolver)
      ).toSucceedAndSatisfy((analysis) => {
        expect(analysis.totalWeight).toBe(150);
      });
    });

    test('fails when ingredient not found', () => {
      const fillingIngredients: Fillings.IFillingIngredient[] = [
        { ingredient: { ids: ['test.nonexistent' as IngredientId] }, amount: 100 as Measurement }
      ];

      expect(
        RuntimeInternal.calculateFromFillingRecipeIngredients(fillingIngredients, testResolver)
      ).toFailWith(/Unknown ingredient/);
    });
  });

  // ============================================================================
  // calculateForFillingRecipe Tests
  // ============================================================================

  describe('calculateForFillingRecipe', () => {
    const testVersion: IFillingRecipeVersion = {
      versionSpec: '2026-01-01-01' as FillingVersionSpec,
      createdDate: '2026-01-01',
      ingredients: [
        { ingredient: { ids: ['test.chocolate' as IngredientId] }, amount: 100 as Measurement },
        { ingredient: { ids: ['test.cream' as IngredientId] }, amount: 50 as Measurement }
      ],
      baseWeight: 150 as Measurement
    };

    const testRecipe: IFillingRecipe = {
      baseId: 'test-ganache' as BaseFillingId,
      name: 'Test Ganache' as FillingName,
      category: 'ganache',
      versions: [testVersion],
      goldenVersionSpec: '2026-01-01-01' as FillingVersionSpec
    };

    test('calculates for golden version by default', () => {
      expect(RuntimeInternal.calculateForFillingRecipe(testRecipe, testResolver)).toSucceedAndSatisfy(
        (analysis) => {
          expect(analysis.totalWeight).toBe(150);
        }
      );
    });

    test('calculates for specific version by ID', () => {
      expect(
        RuntimeInternal.calculateForFillingRecipe(
          testRecipe,
          testResolver,
          '2026-01-01-01' as FillingVersionSpec
        )
      ).toSucceedAndSatisfy((analysis) => {
        expect(analysis.totalWeight).toBe(150);
      });
    });

    test('fails for invalid version ID', () => {
      expect(
        RuntimeInternal.calculateForFillingRecipe(
          testRecipe,
          testResolver,
          '2026-12-31-99' as FillingVersionSpec
        )
      ).toFailWith(/not found/);
    });
  });

  // ============================================================================
  // validateGanache Tests
  // ============================================================================

  describe('validateGanache', () => {
    test('validates balanced ganache as valid', () => {
      const analysis = RuntimeInternal.calculateFromIngredients([
        { ingredient: darkChocolate, amount: 100 as Measurement },
        { ingredient: cream, amount: 50 as Measurement }
      ]);

      const validation = RuntimeInternal.validateGanache(analysis);
      expect(validation.isValid).toBe(true);
    });

    test('warns on low fat', () => {
      // Cream only - low fat
      const analysis = RuntimeInternal.calculateFromIngredients([
        { ingredient: cream, amount: 100 as Measurement }
      ]);

      const validation = RuntimeInternal.validateGanache(analysis);
      expect(validation.warnings.some((w) => w.includes('Low fat'))).toBe(true);
    });

    test('warns on high fat', () => {
      // High fat scenario
      const highFatIngredient: Ingredients.IIngredient = {
        baseId: 'highfat' as BaseIngredientId,
        name: 'High Fat',
        category: 'fat',
        ganacheCharacteristics: {
          cacaoFat: 50 as Percentage,
          sugar: 0 as Percentage,
          milkFat: 10 as Percentage,
          water: 5 as Percentage,
          solids: 35 as Percentage,
          otherFats: 0 as Percentage
        }
      };

      const analysis = RuntimeInternal.calculateFromIngredients([
        { ingredient: highFatIngredient, amount: 100 as Measurement }
      ]);

      const validation = RuntimeInternal.validateGanache(analysis);
      expect(validation.warnings.some((w) => w.includes('High fat'))).toBe(true);
    });

    test('errors on high water', () => {
      // High water scenario
      const highWaterIngredient: Ingredients.IIngredient = {
        baseId: 'highwater' as BaseIngredientId,
        name: 'High Water',
        category: 'liquid',
        ganacheCharacteristics: {
          cacaoFat: 10 as Percentage,
          sugar: 10 as Percentage,
          milkFat: 5 as Percentage,
          water: 50 as Percentage,
          solids: 25 as Percentage,
          otherFats: 0 as Percentage
        }
      };

      const analysis = RuntimeInternal.calculateFromIngredients([
        { ingredient: highWaterIngredient, amount: 100 as Measurement }
      ]);

      const validation = RuntimeInternal.validateGanache(analysis);
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some((e) => e.includes('High water'))).toBe(true);
    });

    test('warns on low water', () => {
      // Low water
      const lowWaterIngredient: Ingredients.IIngredient = {
        baseId: 'lowwater' as BaseIngredientId,
        name: 'Low Water',
        category: 'other',
        ganacheCharacteristics: {
          cacaoFat: 30 as Percentage,
          sugar: 30 as Percentage,
          milkFat: 5 as Percentage,
          water: 5 as Percentage,
          solids: 30 as Percentage,
          otherFats: 0 as Percentage
        }
      };

      const analysis = RuntimeInternal.calculateFromIngredients([
        { ingredient: lowWaterIngredient, amount: 100 as Measurement }
      ]);

      const validation = RuntimeInternal.validateGanache(analysis);
      expect(validation.warnings.some((w) => w.includes('Low water'))).toBe(true);
    });

    test('warns on fat to water ratio issues', () => {
      // Very high fat to water ratio
      const unbalanced: Ingredients.IIngredient = {
        baseId: 'unbalanced' as BaseIngredientId,
        name: 'Unbalanced',
        category: 'other',
        ganacheCharacteristics: {
          cacaoFat: 40 as Percentage,
          sugar: 10 as Percentage,
          milkFat: 10 as Percentage,
          water: 10 as Percentage,
          solids: 30 as Percentage,
          otherFats: 0 as Percentage
        }
      };

      const analysis = RuntimeInternal.calculateFromIngredients([
        { ingredient: unbalanced, amount: 100 as Measurement }
      ]);

      const validation = RuntimeInternal.validateGanache(analysis);
      expect(validation.warnings.some((w) => w.includes('fat-to-water'))).toBe(true);
    });

    test('warns on low sugar to water ratio', () => {
      // Low sugar to water
      const lowSugar: Ingredients.IIngredient = {
        baseId: 'lowsugar' as BaseIngredientId,
        name: 'Low Sugar',
        category: 'other',
        ganacheCharacteristics: {
          cacaoFat: 30 as Percentage,
          sugar: 5 as Percentage,
          milkFat: 5 as Percentage,
          water: 30 as Percentage,
          solids: 30 as Percentage,
          otherFats: 0 as Percentage
        }
      };

      const analysis = RuntimeInternal.calculateFromIngredients([
        { ingredient: lowSugar, amount: 100 as Measurement }
      ]);

      const validation = RuntimeInternal.validateGanache(analysis);
      expect(validation.warnings.some((w) => w.includes('sugar-to-water'))).toBe(true);
    });
  });

  // ============================================================================
  // calculateGanache Tests
  // ============================================================================

  describe('calculateGanache', () => {
    const testVersion: IFillingRecipeVersion = {
      versionSpec: '2026-01-01-01' as FillingVersionSpec,
      createdDate: '2026-01-01',
      ingredients: [
        { ingredient: { ids: ['test.chocolate' as IngredientId] }, amount: 100 as Measurement },
        { ingredient: { ids: ['test.cream' as IngredientId] }, amount: 50 as Measurement }
      ],
      baseWeight: 150 as Measurement
    };

    const testRecipe: IFillingRecipe = {
      baseId: 'test' as BaseFillingId,
      name: 'Test' as FillingName,
      category: 'ganache',
      versions: [testVersion],
      goldenVersionSpec: '2026-01-01-01' as FillingVersionSpec
    };

    test('returns complete calculation with analysis and validation', () => {
      expect(RuntimeInternal.calculateGanache(testRecipe, testResolver)).toSucceedAndSatisfy((calc) => {
        expect(calc.analysis).toBeDefined();
        expect(calc.validation).toBeDefined();
        expect(calc.analysis.totalWeight).toBe(150);
      });
    });
  });
});
