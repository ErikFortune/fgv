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

import { IngredientId, Measurement } from '../../../packlets/common';
import { IFillingIngredient } from '../../../packlets/entities';
import {
  IWeightCalculationContext,
  IWeightContribution,
  calculateIngredientWeight,
  calculateTotalWeight,
  calculateWeightContributions,
  contributesToWeight,
  defaultWeightContext,
  isWeightExcluded
} from '../../../packlets/calculations';

describe('WeightCalculator', () => {
  // ============================================================================
  // Test Fixtures
  // ============================================================================

  const mockContext: IWeightCalculationContext = {
    getIngredientDensity: (id: IngredientId): number => {
      // Simulate density lookup for known ingredients
      switch (id) {
        case 'common.heavy-cream':
          return 1.032;
        case 'common.milk':
          return 1.03;
        case 'common.water':
          return 1.0;
        case 'common.honey':
          return 1.42;
        default:
          return 1.0;
      }
    }
  };

  const makeIngredient = (
    baseId: string,
    amount: number,
    unit?: 'g' | 'mL' | 'tsp' | 'Tbsp' | 'pinch' | 'seeds' | 'pods'
  ): IFillingIngredient => ({
    ingredient: {
      ids: [`common.${baseId}` as IngredientId],
      preferredId: `common.${baseId}` as IngredientId
    },
    amount: amount as Measurement,
    unit
  });

  // ============================================================================
  // contributesToWeight Tests
  // ============================================================================

  describe('contributesToWeight', () => {
    test('returns true for grams', () => {
      expect(contributesToWeight('g')).toBe(true);
    });

    test('returns true for milliliters', () => {
      expect(contributesToWeight('mL')).toBe(true);
    });

    test('returns false for teaspoons', () => {
      expect(contributesToWeight('tsp')).toBe(false);
    });

    test('returns false for tablespoons', () => {
      expect(contributesToWeight('Tbsp')).toBe(false);
    });

    test('returns false for pinch', () => {
      expect(contributesToWeight('pinch')).toBe(false);
    });

    test('returns false for seeds', () => {
      expect(contributesToWeight('seeds')).toBe(false);
    });

    test('returns false for pods', () => {
      expect(contributesToWeight('pods')).toBe(false);
    });
  });

  // ============================================================================
  // isWeightExcluded Tests
  // ============================================================================

  describe('isWeightExcluded', () => {
    test('returns true for teaspoons', () => {
      expect(isWeightExcluded('tsp')).toBe(true);
    });

    test('returns true for tablespoons', () => {
      expect(isWeightExcluded('Tbsp')).toBe(true);
    });

    test('returns true for pinch', () => {
      expect(isWeightExcluded('pinch')).toBe(true);
    });

    test('returns true for seeds', () => {
      expect(isWeightExcluded('seeds')).toBe(true);
    });

    test('returns true for pods', () => {
      expect(isWeightExcluded('pods')).toBe(true);
    });

    test('returns false for grams', () => {
      expect(isWeightExcluded('g')).toBe(false);
    });

    test('returns false for milliliters', () => {
      expect(isWeightExcluded('mL')).toBe(false);
    });
  });

  // ============================================================================
  // defaultWeightContext Tests
  // ============================================================================

  describe('defaultWeightContext', () => {
    test('returns 1.0 for any ingredient', () => {
      expect(defaultWeightContext.getIngredientDensity('any.ingredient' as IngredientId)).toBe(1.0);
    });
  });

  // ============================================================================
  // calculateIngredientWeight Tests
  // ============================================================================

  describe('calculateIngredientWeight', () => {
    describe('with grams', () => {
      test('adds weight directly', () => {
        const ingredient = makeIngredient('chocolate', 100, 'g');
        const result = calculateIngredientWeight(ingredient, mockContext);

        expect(result.ingredientId).toBe('common.chocolate');
        expect(result.amount).toBe(100);
        expect(result.unit).toBe('g');
        expect(result.weightGrams).toBe(100);
        expect(result.contributesToWeight).toBe(true);
      });

      test('uses default unit of grams when not specified', () => {
        const ingredient = makeIngredient('chocolate', 100);
        const result = calculateIngredientWeight(ingredient, mockContext);

        expect(result.unit).toBe('g');
        expect(result.weightGrams).toBe(100);
        expect(result.contributesToWeight).toBe(true);
      });
    });

    describe('with milliliters', () => {
      test('converts using density from context', () => {
        const ingredient = makeIngredient('heavy-cream', 100, 'mL');
        const result = calculateIngredientWeight(ingredient, mockContext);

        expect(result.ingredientId).toBe('common.heavy-cream');
        expect(result.amount).toBe(100);
        expect(result.unit).toBe('mL');
        expect(result.weightGrams).toBeCloseTo(103.2, 1); // 100 * 1.032
        expect(result.contributesToWeight).toBe(true);
      });

      test('uses default density of 1.0 for unknown ingredients', () => {
        const ingredient = makeIngredient('unknown', 100, 'mL');
        const result = calculateIngredientWeight(ingredient, mockContext);

        expect(result.weightGrams).toBe(100); // 100 * 1.0
        expect(result.contributesToWeight).toBe(true);
      });

      test('uses default context when none provided', () => {
        const ingredient = makeIngredient('heavy-cream', 100, 'mL');
        const result = calculateIngredientWeight(ingredient);

        // Default context returns 1.0 for all ingredients
        expect(result.weightGrams).toBe(100);
      });
    });

    describe('with excluded units', () => {
      test('teaspoons return zero weight', () => {
        const ingredient = makeIngredient('vanilla', 1, 'tsp');
        const result = calculateIngredientWeight(ingredient, mockContext);

        expect(result.amount).toBe(1);
        expect(result.unit).toBe('tsp');
        expect(result.weightGrams).toBe(0);
        expect(result.contributesToWeight).toBe(false);
      });

      test('tablespoons return zero weight', () => {
        const ingredient = makeIngredient('vanilla', 2, 'Tbsp');
        const result = calculateIngredientWeight(ingredient, mockContext);

        expect(result.weightGrams).toBe(0);
        expect(result.contributesToWeight).toBe(false);
      });

      test('pinch returns zero weight', () => {
        const ingredient = makeIngredient('salt', 1, 'pinch');
        const result = calculateIngredientWeight(ingredient, mockContext);

        expect(result.weightGrams).toBe(0);
        expect(result.contributesToWeight).toBe(false);
      });

      test('seeds return zero weight', () => {
        const ingredient = makeIngredient('vanilla-seeds', 10, 'seeds');
        const result = calculateIngredientWeight(ingredient, mockContext);

        expect(result.amount).toBe(10);
        expect(result.unit).toBe('seeds');
        expect(result.weightGrams).toBe(0);
        expect(result.contributesToWeight).toBe(false);
      });

      test('pods return zero weight', () => {
        const ingredient = makeIngredient('vanilla-pod', 2, 'pods');
        const result = calculateIngredientWeight(ingredient, mockContext);

        expect(result.amount).toBe(2);
        expect(result.unit).toBe('pods');
        expect(result.weightGrams).toBe(0);
        expect(result.contributesToWeight).toBe(false);
      });
    });

    describe('with ingredient having multiple IDs', () => {
      test('uses preferredId when available', () => {
        const ingredient: IFillingIngredient = {
          ingredient: {
            ids: ['alt.cream' as IngredientId, 'common.heavy-cream' as IngredientId],
            preferredId: 'common.heavy-cream' as IngredientId
          },
          amount: 100 as Measurement,
          unit: 'mL'
        };
        const result = calculateIngredientWeight(ingredient, mockContext);

        expect(result.ingredientId).toBe('common.heavy-cream');
        expect(result.weightGrams).toBeCloseTo(103.2, 1); // Uses cream density
      });

      test('uses first ID when preferredId is not set', () => {
        const ingredient: IFillingIngredient = {
          ingredient: {
            ids: ['common.water' as IngredientId, 'alt.water' as IngredientId]
          },
          amount: 100 as Measurement,
          unit: 'mL'
        };
        const result = calculateIngredientWeight(ingredient, mockContext);

        expect(result.ingredientId).toBe('common.water');
        expect(result.weightGrams).toBe(100); // Water density is 1.0
      });
    });
  });

  // ============================================================================
  // calculateTotalWeight Tests
  // ============================================================================

  describe('calculateTotalWeight', () => {
    test('sums grams directly', () => {
      const ingredients = [
        makeIngredient('chocolate', 200, 'g'),
        makeIngredient('sugar', 50, 'g'),
        makeIngredient('butter', 30, 'g')
      ];

      const total = calculateTotalWeight(ingredients, mockContext);
      expect(total).toBe(280);
    });

    test('converts milliliters using density', () => {
      const ingredients = [
        makeIngredient('chocolate', 200, 'g'),
        makeIngredient('heavy-cream', 100, 'mL') // 103.2g
      ];

      const total = calculateTotalWeight(ingredients, mockContext);
      expect(total).toBeCloseTo(303.2, 1);
    });

    test('excludes tsp, Tbsp, and pinch', () => {
      const ingredients = [
        makeIngredient('chocolate', 200, 'g'),
        makeIngredient('vanilla', 1, 'tsp'), // excluded
        makeIngredient('salt', 1, 'pinch') // excluded
      ];

      const total = calculateTotalWeight(ingredients, mockContext);
      expect(total).toBe(200);
    });

    test('handles mixed units correctly', () => {
      const ingredients = [
        makeIngredient('chocolate', 200, 'g'), // 200g
        makeIngredient('heavy-cream', 100, 'mL'), // 103.2g
        makeIngredient('vanilla', 1, 'tsp'), // excluded
        makeIngredient('honey', 50, 'mL'), // 71g (50 * 1.42)
        makeIngredient('salt', 1, 'pinch') // excluded
      ];

      const total = calculateTotalWeight(ingredients, mockContext);
      // 200 + 103.2 + 71 = 374.2
      expect(total).toBeCloseTo(374.2, 1);
    });

    test('returns zero for empty array', () => {
      const total = calculateTotalWeight([], mockContext);
      expect(total).toBe(0);
    });

    test('uses default context when none provided', () => {
      const ingredients = [
        makeIngredient('chocolate', 200, 'g'),
        makeIngredient('cream', 100, 'mL') // 100g with default density
      ];

      const total = calculateTotalWeight(ingredients);
      expect(total).toBe(300);
    });
  });

  // ============================================================================
  // calculateWeightContributions Tests
  // ============================================================================

  describe('calculateWeightContributions', () => {
    test('returns contributions for all ingredients', () => {
      const ingredients = [
        makeIngredient('chocolate', 200, 'g'),
        makeIngredient('heavy-cream', 100, 'mL'),
        makeIngredient('salt', 1, 'pinch')
      ];

      const contributions = calculateWeightContributions(ingredients, mockContext);

      expect(contributions).toHaveLength(3);

      expect(contributions[0]).toEqual<IWeightContribution>({
        ingredientId: 'common.chocolate' as IngredientId,
        amount: 200 as Measurement,
        unit: 'g',
        weightGrams: 200 as Measurement,
        contributesToWeight: true
      });

      expect(contributions[1].ingredientId).toBe('common.heavy-cream');
      expect(contributions[1].weightGrams).toBeCloseTo(103.2, 1);
      expect(contributions[1].contributesToWeight).toBe(true);

      expect(contributions[2]).toEqual<IWeightContribution>({
        ingredientId: 'common.salt' as IngredientId,
        amount: 1 as Measurement,
        unit: 'pinch',
        weightGrams: 0 as Measurement,
        contributesToWeight: false
      });
    });

    test('returns empty array for empty ingredients', () => {
      const contributions = calculateWeightContributions([], mockContext);
      expect(contributions).toEqual([]);
    });
  });
});
