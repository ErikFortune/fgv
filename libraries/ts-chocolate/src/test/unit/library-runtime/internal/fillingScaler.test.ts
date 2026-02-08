import '@fgv/ts-utils-jest';

// eslint-disable-next-line @rushstack/packlets/mechanics
import {
  calculateBaseWeight,
  recalculateFillingRecipeVariation
} from '../../../../packlets/library-runtime/internal/fillingScaler';
import type { IFillingRecipeVariationEntity } from '../../../../packlets/entities';
import { FillingRecipeVariationSpec, IngredientId, Measurement } from '../../../../packlets/common';

describe('fillingScaler', () => {
  describe('calculateBaseWeight', () => {
    test('should calculate weight from single ingredient', () => {
      const variation: IFillingRecipeVariationEntity = {
        variationSpec: 'vanilla' as unknown as FillingRecipeVariationSpec,
        createdDate: '2026-01-01',
        baseWeight: 0 as Measurement,
        ingredients: [
          {
            ingredient: {
              ids: ['sugar' as unknown as IngredientId]
            },
            amount: 100 as Measurement
          }
        ]
      };

      const result = calculateBaseWeight(variation);
      expect(result).toBe(100);
    });

    test('should calculate weight summing multiple ingredients', () => {
      const variation: IFillingRecipeVariationEntity = {
        variationSpec: 'chocolate' as unknown as FillingRecipeVariationSpec,
        createdDate: '2026-01-01',
        baseWeight: 0 as Measurement,
        ingredients: [
          {
            ingredient: {
              ids: ['sugar' as unknown as IngredientId]
            },
            amount: 100 as Measurement
          },
          {
            ingredient: {
              ids: ['butter' as unknown as IngredientId]
            },
            amount: 50 as Measurement
          },
          {
            ingredient: {
              ids: ['chocolate' as unknown as IngredientId]
            },
            amount: 75 as Measurement
          }
        ]
      };

      const result = calculateBaseWeight(variation);
      expect(result).toBe(225);
    });

    test('should return 0 for empty ingredients array', () => {
      const variation: IFillingRecipeVariationEntity = {
        variationSpec: 'empty' as unknown as FillingRecipeVariationSpec,
        createdDate: '2026-01-01',
        baseWeight: 100 as Measurement,
        ingredients: []
      };

      const result = calculateBaseWeight(variation);
      expect(result).toBe(0);
    });
  });

  describe('recalculateFillingRecipeVariation', () => {
    test('should return new variation with recalculated baseWeight', () => {
      const original: IFillingRecipeVariationEntity = {
        variationSpec: 'vanilla' as unknown as FillingRecipeVariationSpec,
        createdDate: '2026-01-01',
        baseWeight: 0 as Measurement,
        ingredients: [
          {
            ingredient: {
              ids: ['sugar' as unknown as IngredientId]
            },
            amount: 100 as Measurement
          },
          {
            ingredient: {
              ids: ['vanilla' as unknown as IngredientId]
            },
            amount: 50 as Measurement
          }
        ]
      };

      const result = recalculateFillingRecipeVariation(original);

      expect(result.baseWeight).toBe(150);
      expect(result.variationSpec).toBe(original.variationSpec);
      expect(result.ingredients).toBe(original.ingredients);
    });

    test('should preserve other variation fields', () => {
      const original: IFillingRecipeVariationEntity = {
        variationSpec: 'caramel' as unknown as FillingRecipeVariationSpec,
        createdDate: '2026-01-01',
        baseWeight: 0 as Measurement,
        ingredients: [
          {
            ingredient: {
              ids: ['sugar' as unknown as IngredientId]
            },
            amount: 200 as Measurement
          }
        ],
        yield: 'Makes 30 bonbons'
      };

      const result = recalculateFillingRecipeVariation(original);

      expect(result.baseWeight).toBe(200);
      expect(result.variationSpec).toBe(original.variationSpec);
      expect(result.ingredients).toBe(original.ingredients);
      expect(result.yield).toBe('Makes 30 bonbons');
    });

    test('should handle variation with zero-weight ingredients', () => {
      const original: IFillingRecipeVariationEntity = {
        variationSpec: 'minimal' as unknown as FillingRecipeVariationSpec,
        createdDate: '2026-01-01',
        baseWeight: 100 as Measurement,
        ingredients: [
          {
            ingredient: {
              ids: ['flavoring' as unknown as IngredientId]
            },
            amount: 0 as Measurement
          },
          {
            ingredient: {
              ids: ['coloring' as unknown as IngredientId]
            },
            amount: 0 as Measurement
          }
        ]
      };

      const result = recalculateFillingRecipeVariation(original);

      expect(result.baseWeight).toBe(0);
      expect(result.variationSpec).toBe(original.variationSpec);
      expect(result.ingredients).toBe(original.ingredients);
    });
  });
});
