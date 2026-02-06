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
  RatingScore,
  FillingId,
  FillingName,
  FillingRecipeVariationSpec,
  Model as CommonModel,
  CollectionId
} from '../../../packlets/common';

import {
  IGanacheCharacteristics,
  IChocolateIngredientEntity,
  IIngredientEntity,
  IngredientsLibrary
} from '../../../packlets/entities';
import { IFillingRecipeEntity, FillingsLibrary } from '../../../packlets/entities';
import { ChocolateLibrary, FillingRecipe, FillingRecipeVariation } from '../../../packlets/library-runtime';
import { RuntimeContext } from '../../../packlets/runtime';

describe('RuntimeFillingRecipe and RuntimeFillingRecipeVariation', () => {
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

  const altChocolate: IChocolateIngredientEntity = {
    baseId: 'alt-chocolate' as BaseIngredientId,
    name: 'Alternative Chocolate',
    category: 'chocolate',
    chocolateType: 'dark',
    cacaoPercentage: 65 as Percentage,
    ganacheCharacteristics: testChars
  };

  const cream: IIngredientEntity = {
    baseId: 'cream' as BaseIngredientId,
    name: 'Heavy Cream',
    category: 'dairy',
    ganacheCharacteristics: creamChars
  };

  const butter: IIngredientEntity = {
    baseId: 'butter' as BaseIngredientId,
    name: 'Butter',
    category: 'fat',
    ganacheCharacteristics: {
      cacaoFat: 0 as Percentage,
      sugar: 0 as Percentage,
      milkFat: 82 as Percentage,
      water: 16 as Percentage,
      solids: 2 as Percentage,
      otherFats: 0 as Percentage
    }
  };

  const darkGanacheRecipe: IFillingRecipeEntity = {
    baseId: 'dark-ganache' as BaseFillingId,
    name: 'Dark Ganache' as FillingName,
    category: 'ganache',
    description: 'Classic dark chocolate ganache',
    tags: ['classic', 'dark'],
    goldenVariationSpec: '2026-01-01-01' as FillingRecipeVariationSpec,
    variations: [
      {
        variationSpec: '2026-01-01-01' as FillingRecipeVariationSpec,
        createdDate: '2026-01-01',
        notes: [{ category: 'user', note: 'Original recipe' }] as CommonModel.ICategorizedNote[],
        yield: '50 bonbons',
        ingredients: [
          {
            ingredient: {
              ids: ['test.dark-chocolate' as IngredientId, 'test.alt-chocolate' as IngredientId],
              preferredId: 'test.dark-chocolate' as IngredientId
            },
            amount: 200 as Measurement,
            notes: [{ category: 'user', note: 'Use couverture' }] as CommonModel.ICategorizedNote[]
          },
          { ingredient: { ids: ['test.cream' as IngredientId] }, amount: 100 as Measurement }
        ],
        baseWeight: 300 as Measurement,
        ratings: [
          {
            category: 'texture',
            score: 4 as RatingScore,
            notes: [{ category: 'user', note: 'Good texture' }] as CommonModel.ICategorizedNote[]
          }
        ]
      },
      {
        variationSpec: '2026-02-01-01' as FillingRecipeVariationSpec,
        createdDate: '2026-02-01',
        notes: [{ category: 'user', note: 'Revised with butter' }] as CommonModel.ICategorizedNote[],
        ingredients: [
          { ingredient: { ids: ['test.dark-chocolate' as IngredientId] }, amount: 180 as Measurement },
          { ingredient: { ids: ['test.cream' as IngredientId] }, amount: 100 as Measurement },
          { ingredient: { ids: ['test.butter' as IngredientId] }, amount: 20 as Measurement }
        ],
        baseWeight: 300 as Measurement
      }
    ]
  };

  const emptyRecipe: IFillingRecipeEntity = {
    baseId: 'empty-recipe' as BaseFillingId,
    name: 'Empty Recipe' as FillingName,
    category: 'ganache',
    goldenVariationSpec: '2026-01-01-01' as FillingRecipeVariationSpec,
    variations: [
      {
        variationSpec: '2026-01-01-01' as FillingRecipeVariationSpec,
        createdDate: '2026-01-01',
        ingredients: [
          { ingredient: { ids: ['test.dark-chocolate' as IngredientId] }, amount: 100 as Measurement }
        ],
        baseWeight: 100 as Measurement
      }
    ]
  };

  let ctx: RuntimeContext;

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
            'alt-chocolate': altChocolate,
            /* eslint-enable @typescript-eslint/naming-convention */
            cream,
            butter
          }
        }
      ]
    }).orThrow();

    const recipes = FillingsLibrary.create({
      builtin: false,
      collections: [
        {
          id: 'test' as CollectionId,
          isMutable: false,
          items: {
            /* eslint-disable @typescript-eslint/naming-convention */
            'dark-ganache': darkGanacheRecipe,
            'empty-recipe': emptyRecipe
            /* eslint-enable @typescript-eslint/naming-convention */
          }
        }
      ]
    }).orThrow();

    const library = ChocolateLibrary.create({
      builtin: false,
      libraries: { ingredients, fillings: recipes }
    }).orThrow();

    ctx = RuntimeContext.fromLibrary(library).orThrow();
  });

  // ============================================================================
  // RuntimeFillingRecipe Tests
  // ============================================================================

  describe('RuntimeFillingRecipe', () => {
    describe('identity', () => {
      test('provides composite ID', () => {
        const recipe = ctx.fillings.get('test.dark-ganache' as FillingId).orThrow();
        expect(recipe.id).toBe('test.dark-ganache');
      });

      test('provides source ID', () => {
        const recipe = ctx.fillings.get('test.dark-ganache' as FillingId).orThrow();
        expect(recipe.collectionId).toBe('test');
      });

      test('provides base ID', () => {
        const recipe = ctx.fillings.get('test.dark-ganache' as FillingId).orThrow();
        expect(recipe.baseId).toBe('dark-ganache');
      });
    });

    describe('core properties', () => {
      test('provides name', () => {
        const recipe = ctx.fillings.get('test.dark-ganache' as FillingId).orThrow();
        expect(recipe.name).toBe('Dark Ganache');
      });

      test('provides description', () => {
        const recipe = ctx.fillings.get('test.dark-ganache' as FillingId).orThrow();
        expect(recipe.description).toBe('Classic dark chocolate ganache');
      });

      test('provides tags', () => {
        const recipe = ctx.fillings.get('test.dark-ganache' as FillingId).orThrow();
        expect(recipe.tags).toContain('classic');
        expect(recipe.tags).toContain('dark');
      });

      test('provides empty tags when none defined', () => {
        const recipe = ctx.fillings.get('test.empty-recipe' as FillingId).orThrow();
        expect(recipe.tags).toEqual([]);
      });

      test('provides goldenVariationSpec', () => {
        const recipe = ctx.fillings.get('test.dark-ganache' as FillingId).orThrow();
        expect(recipe.goldenVariationSpec).toBe('2026-01-01-01');
      });
    });

    describe('variation navigation', () => {
      test('provides goldenVariation', () => {
        const recipe = ctx.fillings.get('test.dark-ganache' as FillingId).orThrow();
        const golden = recipe.goldenVariation;
        expect(golden.variationSpec).toBe('2026-01-01-01');
      });

      test('provides all variations', () => {
        const recipe = ctx.fillings.get('test.dark-ganache' as FillingId).orThrow();
        expect(recipe.variations.length).toBe(2);
      });

      test('getVariation returns specific variation', () => {
        const recipe = ctx.fillings.get('test.dark-ganache' as FillingId).orThrow();
        expect(recipe.getVariation('2026-02-01-01' as FillingRecipeVariationSpec)).toSucceedAndSatisfy(
          (v) => {
            expect(v.variationSpec).toBe('2026-02-01-01');
          }
        );
      });

      test('getVariation fails for non-existent variation', () => {
        const recipe = ctx.fillings.get('test.dark-ganache' as FillingId).orThrow();
        expect(recipe.getVariation('nonexistent' as FillingRecipeVariationSpec)).toFailWith(/not found/);
      });

      test('latestVariation returns most recent by date', () => {
        const recipe = ctx.fillings.get('test.dark-ganache' as FillingId).orThrow();
        const latest = recipe.latestVariation;
        expect(latest.variationSpec).toBe('2026-02-01-01');
      });

      test('latestVariation reuses goldenVariation when same', () => {
        // empty-recipe has only one variation which is both golden and latest
        const recipe = ctx.fillings.get('test.empty-recipe' as FillingId).orThrow();
        const latest = recipe.latestVariation;
        const golden = recipe.goldenVariation;
        expect(latest.variationSpec).toBe('2026-01-01-01');
        expect(latest).toBe(golden); // Same instance
      });

      test('variationCount returns correct count', () => {
        const recipe = ctx.fillings.get('test.dark-ganache' as FillingId).orThrow();
        expect(recipe.variationCount).toBe(2);
      });
    });

    describe('ingredient queries', () => {
      test('getIngredientIds returns only preferred IDs by default', () => {
        const recipe = ctx.fillings.get('test.dark-ganache' as FillingId).orThrow();
        const ids = recipe.getIngredientIds();
        // Preferred only: dark-chocolate (preferred), cream, butter
        // Excludes alt-chocolate which is an alternate
        expect(ids.size).toBe(3);
        expect(ids.has('test.dark-chocolate' as IngredientId)).toBe(true);
        expect(ids.has('test.cream' as IngredientId)).toBe(true);
        expect(ids.has('test.butter' as IngredientId)).toBe(true);
        expect(ids.has('test.alt-chocolate' as IngredientId)).toBe(false);
      });

      test('getIngredientIds with includeAlternates returns all IDs', () => {
        const recipe = ctx.fillings.get('test.dark-ganache' as FillingId).orThrow();
        const ids = recipe.getIngredientIds({ includeAlternates: true });
        // All: dark-chocolate, alt-chocolate (alternate), cream, butter
        expect(ids.size).toBe(4);
        expect(ids.has('test.dark-chocolate' as IngredientId)).toBe(true);
        expect(ids.has('test.alt-chocolate' as IngredientId)).toBe(true);
        expect(ids.has('test.cream' as IngredientId)).toBe(true);
        expect(ids.has('test.butter' as IngredientId)).toBe(true);
      });

      test('usesIngredient returns true for preferred ingredient by default', () => {
        const recipe = ctx.fillings.get('test.dark-ganache' as FillingId).orThrow();
        expect(recipe.usesIngredient('test.dark-chocolate' as IngredientId)).toBe(true);
      });

      test('usesIngredient returns false for alternate ingredient by default', () => {
        const recipe = ctx.fillings.get('test.dark-ganache' as FillingId).orThrow();
        // alt-chocolate is an alternate, not preferred - default should not find it
        expect(recipe.usesIngredient('test.alt-chocolate' as IngredientId)).toBe(false);
      });

      test('usesIngredient with includeAlternates returns true for alternate ingredient', () => {
        const recipe = ctx.fillings.get('test.dark-ganache' as FillingId).orThrow();
        // alt-chocolate is an alternate for dark-chocolate in the ids array
        expect(recipe.usesIngredient('test.alt-chocolate' as IngredientId, { includeAlternates: true })).toBe(
          true
        );
      });

      test('usesIngredient returns false for unused ingredient', () => {
        const recipe = ctx.fillings.get('test.dark-ganache' as FillingId).orThrow();
        expect(recipe.usesIngredient('test.nonexistent' as IngredientId)).toBe(false);
      });
    });

    describe('raw access', () => {
      test('raw returns underlying recipe data', () => {
        const recipe = ctx.fillings.get('test.dark-ganache' as FillingId).orThrow();
        expect(recipe.entity.name).toBe('Dark Ganache');
      });
    });

    describe('create factory', () => {
      test('create factory method succeeds', () => {
        const recipe = ctx.fillings.get('test.dark-ganache' as FillingId).orThrow();
        expect(FillingRecipe.create(ctx as never, recipe.id, recipe.entity)).toSucceed();
      });
    });
  });

  describe('RuntimeFillingRecipeVariation', () => {
    describe('identity', () => {
      test('provides variationSpec', () => {
        const recipe = ctx.fillings.get('test.dark-ganache' as FillingId).orThrow();
        expect(recipe.goldenVariation.variationSpec).toBe('2026-01-01-01');
      });

      test('provides createdDate', () => {
        const recipe = ctx.fillings.get('test.dark-ganache' as FillingId).orThrow();
        expect(recipe.goldenVariation.createdDate).toBe('2026-01-01');
      });

      test('provides recipeId', () => {
        const recipe = ctx.fillings.get('test.dark-ganache' as FillingId).orThrow();
        expect(recipe.goldenVariation.fillingId).toBe('test.dark-ganache');
      });

      test('provides recipe parent reference', () => {
        const recipe = ctx.fillings.get('test.dark-ganache' as FillingId).orThrow();
        const variation = recipe.goldenVariation;
        expect(variation.fillingRecipe).toBeDefined();
        expect(variation.fillingRecipe.id).toBe('test.dark-ganache');
        expect(variation.fillingRecipe.name).toBe('Dark Ganache');
      });
    });

    describe('resolved ingredients', () => {
      test('getIngredients returns all resolved ingredients', () => {
        const recipe = ctx.fillings.get('test.dark-ganache' as FillingId).orThrow();
        expect(recipe.goldenVariation.getIngredients()).toSucceedAndSatisfy((iter) => {
          const ingredients = [...iter];
          expect(ingredients.length).toBe(2);
          expect(ingredients[0].ingredient.name).toBe('Dark Chocolate 70%');
          expect(ingredients[0].amount).toBe(200);
        });
      });

      test('resolved ingredient includes notes', () => {
        const recipe = ctx.fillings.get('test.dark-ganache' as FillingId).orThrow();
        const ingredients = [...recipe.goldenVariation.getIngredients().orThrow()];
        expect(ingredients[0].notes).toEqual([{ category: 'user', note: 'Use couverture' }]);
      });

      test('resolved ingredient includes alternates', () => {
        const recipe = ctx.fillings.get('test.dark-ganache' as FillingId).orThrow();
        const ingredients = [...recipe.goldenVariation.getIngredients().orThrow()];
        expect(ingredients[0].alternates.length).toBe(1);
        expect(ingredients[0].alternates[0].name).toBe('Alternative Chocolate');
      });

      test('resolved ingredient includes raw reference', () => {
        const recipe = ctx.fillings.get('test.dark-ganache' as FillingId).orThrow();
        const ingredients = [...recipe.goldenVariation.getIngredients().orThrow()];
        expect(ingredients[0].entity.ingredient.ids[0]).toBe('test.dark-chocolate');
      });

      test('getIngredients with empty array returns nothing', () => {
        const recipe = ctx.fillings.get('test.dark-ganache' as FillingId).orThrow();
        expect(recipe.goldenVariation.getIngredients([])).toSucceedAndSatisfy((iter) => {
          const ingredients = [...iter];
          expect(ingredients.length).toBe(0);
        });
      });

      test('getIngredients with exact ID filter returns matching ingredient', () => {
        const recipe = ctx.fillings.get('test.dark-ganache' as FillingId).orThrow();
        expect(recipe.goldenVariation.getIngredients(['test.dark-chocolate'])).toSucceedAndSatisfy((iter) => {
          const ingredients = [...iter];
          expect(ingredients.length).toBe(1);
          expect(ingredients[0].ingredient.name).toBe('Dark Chocolate 70%');
        });
      });

      test('getIngredients with non-matching ID returns nothing', () => {
        const recipe = ctx.fillings.get('test.dark-ganache' as FillingId).orThrow();
        expect(recipe.goldenVariation.getIngredients(['test.nonexistent'])).toSucceedAndSatisfy((iter) => {
          const ingredients = [...iter];
          expect(ingredients.length).toBe(0);
        });
      });
    });

    describe('computed properties', () => {
      test('provides baseWeight', () => {
        const recipe = ctx.fillings.get('test.dark-ganache' as FillingId).orThrow();
        expect(recipe.goldenVariation.baseWeight).toBe(300);
      });

      test('provides yield', () => {
        const recipe = ctx.fillings.get('test.dark-ganache' as FillingId).orThrow();
        expect(recipe.goldenVariation.yield).toBe('50 bonbons');
      });

      test('provides notes', () => {
        const recipe = ctx.fillings.get('test.dark-ganache' as FillingId).orThrow();
        expect(recipe.goldenVariation.notes).toEqual([{ category: 'user', note: 'Original recipe' }]);
      });

      test('provides ratings', () => {
        const recipe = ctx.fillings.get('test.dark-ganache' as FillingId).orThrow();
        const ratings = recipe.goldenVariation.ratings;
        expect(ratings.length).toBe(1);
        expect(ratings[0].score).toBe(4);
      });

      test('ratings returns empty array when none defined', () => {
        const recipe = ctx.fillings.get('test.dark-ganache' as FillingId).orThrow();
        const variation = recipe.variations[1]; // Second variation has no ratings
        expect(variation.ratings).toEqual([]);
      });
    });

    describe('filtering helpers', () => {
      test('getIngredients with category filter returns matching category', () => {
        const recipe = ctx.fillings.get('test.dark-ganache' as FillingId).orThrow();
        expect(recipe.goldenVariation.getIngredients([{ category: 'chocolate' }])).toSucceedAndSatisfy(
          (iter) => {
            const chocolate = [...iter];
            expect(chocolate.length).toBe(1);
            expect(chocolate[0].ingredient.name).toBe('Dark Chocolate 70%');
          }
        );
      });

      test('getIngredients filters chocolate ingredients only', () => {
        const recipe = ctx.fillings.get('test.dark-ganache' as FillingId).orThrow();
        const chocolate = [...recipe.goldenVariation.getIngredients([{ category: 'chocolate' }]).orThrow()];
        expect(chocolate.length).toBe(1);
      });

      test('getIngredients filters dairy ingredients only', () => {
        const recipe = ctx.fillings.get('test.dark-ganache' as FillingId).orThrow();
        const dairy = [...recipe.goldenVariation.getIngredients([{ category: 'dairy' }]).orThrow()];
        expect(dairy.length).toBe(1);
        expect(dairy[0].ingredient.name).toBe('Heavy Cream');
      });

      test('getIngredients with sugar filter returns empty when no sugar', () => {
        const recipe = ctx.fillings.get('test.dark-ganache' as FillingId).orThrow();
        const sugar = [...recipe.goldenVariation.getIngredients([{ category: 'sugar' }]).orThrow()];
        expect(sugar.length).toBe(0);
      });

      test('getIngredients with fat filter returns fat only', () => {
        const recipe = ctx.fillings.get('test.dark-ganache' as FillingId).orThrow();
        const variation = recipe.variations[1]; // Has butter
        const fat = [...variation.getIngredients([{ category: 'fat' }]).orThrow()];
        expect(fat.length).toBe(1);
        expect(fat[0].ingredient.name).toBe('Butter');
      });

      test('getIngredients with alcohol filter returns empty when no alcohol', () => {
        const recipe = ctx.fillings.get('test.dark-ganache' as FillingId).orThrow();
        const alcohol = [...recipe.goldenVariation.getIngredients([{ category: 'alcohol' }]).orThrow()];
        expect(alcohol.length).toBe(0);
      });

      test('getIngredients with regex pattern filters by ID pattern', () => {
        const recipe = ctx.fillings.get('test.dark-ganache' as FillingId).orThrow();
        const matching = [...recipe.goldenVariation.getIngredients([/^test\.dark/]).orThrow()];
        expect(matching.length).toBe(1);
        expect(matching[0].ingredient.name).toBe('Dark Chocolate 70%');
      });

      test('getIngredients with multiple filters uses OR semantics', () => {
        const recipe = ctx.fillings.get('test.dark-ganache' as FillingId).orThrow();
        const filtered = [
          ...recipe.goldenVariation
            .getIngredients([{ category: 'chocolate' }, { category: 'dairy' }])
            .orThrow()
        ];
        expect(filtered.length).toBe(2);
      });

      test('getIngredients with category regex pattern', () => {
        const recipe = ctx.fillings.get('test.dark-ganache' as FillingId).orThrow();
        const matching = [...recipe.goldenVariation.getIngredients([{ category: /^choc/ }]).orThrow()];
        expect(matching.length).toBe(1);
        expect(matching[0].ingredient.name).toBe('Dark Chocolate 70%');
      });
    });

    describe('operations', () => {
      test('usesIngredient returns true for used ingredient', () => {
        const recipe = ctx.fillings.get('test.dark-ganache' as FillingId).orThrow();
        expect(recipe.goldenVariation.usesIngredient('test.dark-chocolate' as IngredientId)).toBe(true);
      });

      test('usesIngredient returns false for unused ingredient', () => {
        const recipe = ctx.fillings.get('test.dark-ganache' as FillingId).orThrow();
        // butter is used in variation 2 but not golden variation
        expect(recipe.goldenVariation.usesIngredient('test.butter' as IngredientId)).toBe(false);
      });

      test('calculateGanache returns analysis', () => {
        const recipe = ctx.fillings.get('test.dark-ganache' as FillingId).orThrow();
        expect(recipe.goldenVariation.calculateGanache()).toSucceedAndSatisfy((calc) => {
          expect(calc.analysis).toBeDefined();
          expect(calc.validation).toBeDefined();
        });
      });
    });

    describe('raw access', () => {
      test('raw returns underlying variation data', () => {
        const recipe = ctx.fillings.get('test.dark-ganache' as FillingId).orThrow();
        expect(recipe.goldenVariation.entity.variationSpec).toBe('2026-01-01-01');
      });
    });

    describe('create factory', () => {
      test('create factory method succeeds', () => {
        const recipe = ctx.fillings.get('test.dark-ganache' as FillingId).orThrow();
        expect(
          FillingRecipeVariation.create(ctx as never, recipe.id, recipe.goldenVariation.entity)
        ).toSucceed();
      });
    });
  });
});
