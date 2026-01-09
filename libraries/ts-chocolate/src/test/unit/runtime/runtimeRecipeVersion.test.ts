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
  BaseRecipeId,
  Grams,
  IngredientId,
  Percentage,
  RatingScore,
  RecipeId,
  RecipeName,
  RecipeVersionSpec,
  SourceId
} from '../../../packlets/common';

import {
  IGanacheCharacteristics,
  IChocolateIngredient,
  IIngredient,
  IngredientsLibrary
} from '../../../packlets/ingredients';
import { IRecipe, RecipesLibrary } from '../../../packlets/recipes';
import { ChocolateLibrary, RuntimeContext, RuntimeRecipe, RuntimeVersion } from '../../../packlets/runtime';

describe('RuntimeRecipe and RuntimeVersion', () => {
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

  const darkChocolate: IChocolateIngredient = {
    baseId: 'dark-chocolate' as BaseIngredientId,
    name: 'Dark Chocolate 70%',
    category: 'chocolate',
    chocolateType: 'dark',
    cacaoPercentage: 70 as Percentage,
    ganacheCharacteristics: testChars
  };

  const altChocolate: IChocolateIngredient = {
    baseId: 'alt-chocolate' as BaseIngredientId,
    name: 'Alternative Chocolate',
    category: 'chocolate',
    chocolateType: 'dark',
    cacaoPercentage: 65 as Percentage,
    ganacheCharacteristics: testChars
  };

  const cream: IIngredient = {
    baseId: 'cream' as BaseIngredientId,
    name: 'Heavy Cream',
    category: 'dairy',
    ganacheCharacteristics: creamChars
  };

  const butter: IIngredient = {
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

  const darkGanacheRecipe: IRecipe = {
    baseId: 'dark-ganache' as BaseRecipeId,
    name: 'Dark Ganache' as RecipeName,
    category: 'ganache',
    description: 'Classic dark chocolate ganache',
    tags: ['classic', 'dark'],
    goldenVersionSpec: '2026-01-01-01' as RecipeVersionSpec,
    versions: [
      {
        versionSpec: '2026-01-01-01' as RecipeVersionSpec,
        createdDate: '2026-01-01',
        notes: 'Original recipe',
        yield: '50 bonbons',
        ingredients: [
          {
            ingredient: {
              ids: ['test.dark-chocolate' as IngredientId, 'test.alt-chocolate' as IngredientId],
              preferredId: 'test.dark-chocolate' as IngredientId
            },
            amount: 200 as Grams,
            notes: 'Use couverture'
          },
          { ingredient: { ids: ['test.cream' as IngredientId] }, amount: 100 as Grams }
        ],
        baseWeight: 300 as Grams,
        ratings: [{ category: 'texture', score: 4 as RatingScore, notes: 'Good texture' }]
      },
      {
        versionSpec: '2026-02-01-01' as RecipeVersionSpec,
        createdDate: '2026-02-01',
        notes: 'Revised with butter',
        ingredients: [
          { ingredient: { ids: ['test.dark-chocolate' as IngredientId] }, amount: 180 as Grams },
          { ingredient: { ids: ['test.cream' as IngredientId] }, amount: 100 as Grams },
          { ingredient: { ids: ['test.butter' as IngredientId] }, amount: 20 as Grams }
        ],
        baseWeight: 300 as Grams
      }
    ]
  };

  const emptyRecipe: IRecipe = {
    baseId: 'empty-recipe' as BaseRecipeId,
    name: 'Empty Recipe' as RecipeName,
    category: 'ganache',
    goldenVersionSpec: '2026-01-01-01' as RecipeVersionSpec,
    versions: [
      {
        versionSpec: '2026-01-01-01' as RecipeVersionSpec,
        createdDate: '2026-01-01',
        ingredients: [{ ingredient: { ids: ['test.dark-chocolate' as IngredientId] }, amount: 100 as Grams }],
        baseWeight: 100 as Grams
      }
    ]
  };

  let ctx: RuntimeContext;

  beforeEach(() => {
    const ingredients = IngredientsLibrary.create({
      builtin: false,
      collections: [
        {
          id: 'test' as SourceId,
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

    const recipes = RecipesLibrary.create({
      builtin: false,
      collections: [
        {
          id: 'test' as SourceId,
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
      libraries: { ingredients, recipes }
    }).orThrow();

    ctx = RuntimeContext.fromLibrary(library).orThrow();
  });

  // ============================================================================
  // RuntimeRecipe Tests
  // ============================================================================

  describe('RuntimeRecipe', () => {
    describe('identity', () => {
      test('provides composite ID', () => {
        const recipe = ctx.recipes.get('test.dark-ganache' as RecipeId).orThrow();
        expect(recipe.id).toBe('test.dark-ganache');
      });

      test('provides source ID', () => {
        const recipe = ctx.recipes.get('test.dark-ganache' as RecipeId).orThrow();
        expect(recipe.sourceId).toBe('test');
      });

      test('provides base ID', () => {
        const recipe = ctx.recipes.get('test.dark-ganache' as RecipeId).orThrow();
        expect(recipe.baseId).toBe('dark-ganache');
      });
    });

    describe('core properties', () => {
      test('provides name', () => {
        const recipe = ctx.recipes.get('test.dark-ganache' as RecipeId).orThrow();
        expect(recipe.name).toBe('Dark Ganache');
      });

      test('provides description', () => {
        const recipe = ctx.recipes.get('test.dark-ganache' as RecipeId).orThrow();
        expect(recipe.description).toBe('Classic dark chocolate ganache');
      });

      test('provides tags', () => {
        const recipe = ctx.recipes.get('test.dark-ganache' as RecipeId).orThrow();
        expect(recipe.tags).toContain('classic');
        expect(recipe.tags).toContain('dark');
      });

      test('provides empty tags when none defined', () => {
        const recipe = ctx.recipes.get('test.empty-recipe' as RecipeId).orThrow();
        expect(recipe.tags).toEqual([]);
      });

      test('provides goldenVersionSpec', () => {
        const recipe = ctx.recipes.get('test.dark-ganache' as RecipeId).orThrow();
        expect(recipe.goldenVersionSpec).toBe('2026-01-01-01');
      });
    });

    describe('version navigation', () => {
      test('provides goldenVersion', () => {
        const recipe = ctx.recipes.get('test.dark-ganache' as RecipeId).orThrow();
        const golden = recipe.goldenVersion;
        expect(golden.versionSpec).toBe('2026-01-01-01');
      });

      test('provides all versions', () => {
        const recipe = ctx.recipes.get('test.dark-ganache' as RecipeId).orThrow();
        expect(recipe.versions.length).toBe(2);
      });

      test('getVersion returns specific version', () => {
        const recipe = ctx.recipes.get('test.dark-ganache' as RecipeId).orThrow();
        expect(recipe.getVersion('2026-02-01-01' as RecipeVersionSpec)).toSucceedAndSatisfy((v) => {
          expect(v.versionSpec).toBe('2026-02-01-01');
        });
      });

      test('getVersion fails for non-existent version', () => {
        const recipe = ctx.recipes.get('test.dark-ganache' as RecipeId).orThrow();
        expect(recipe.getVersion('nonexistent' as RecipeVersionSpec)).toFailWith(/not found/);
      });

      test('latestVersion returns most recent by date', () => {
        const recipe = ctx.recipes.get('test.dark-ganache' as RecipeId).orThrow();
        const latest = recipe.latestVersion;
        expect(latest.versionSpec).toBe('2026-02-01-01');
      });

      test('latestVersion reuses goldenVersion when same', () => {
        // empty-recipe has only one version which is both golden and latest
        const recipe = ctx.recipes.get('test.empty-recipe' as RecipeId).orThrow();
        const latest = recipe.latestVersion;
        const golden = recipe.goldenVersion;
        expect(latest.versionSpec).toBe('2026-01-01-01');
        expect(latest).toBe(golden); // Same instance
      });

      test('versionCount returns correct count', () => {
        const recipe = ctx.recipes.get('test.dark-ganache' as RecipeId).orThrow();
        expect(recipe.versionCount).toBe(2);
      });
    });

    describe('ingredient queries', () => {
      test('getIngredientIds returns only preferred IDs by default', () => {
        const recipe = ctx.recipes.get('test.dark-ganache' as RecipeId).orThrow();
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
        const recipe = ctx.recipes.get('test.dark-ganache' as RecipeId).orThrow();
        const ids = recipe.getIngredientIds({ includeAlternates: true });
        // All: dark-chocolate, alt-chocolate (alternate), cream, butter
        expect(ids.size).toBe(4);
        expect(ids.has('test.dark-chocolate' as IngredientId)).toBe(true);
        expect(ids.has('test.alt-chocolate' as IngredientId)).toBe(true);
        expect(ids.has('test.cream' as IngredientId)).toBe(true);
        expect(ids.has('test.butter' as IngredientId)).toBe(true);
      });

      test('usesIngredient returns true for preferred ingredient by default', () => {
        const recipe = ctx.recipes.get('test.dark-ganache' as RecipeId).orThrow();
        expect(recipe.usesIngredient('test.dark-chocolate' as IngredientId)).toBe(true);
      });

      test('usesIngredient returns false for alternate ingredient by default', () => {
        const recipe = ctx.recipes.get('test.dark-ganache' as RecipeId).orThrow();
        // alt-chocolate is an alternate, not preferred - default should not find it
        expect(recipe.usesIngredient('test.alt-chocolate' as IngredientId)).toBe(false);
      });

      test('usesIngredient with includeAlternates returns true for alternate ingredient', () => {
        const recipe = ctx.recipes.get('test.dark-ganache' as RecipeId).orThrow();
        // alt-chocolate is an alternate for dark-chocolate in the ids array
        expect(recipe.usesIngredient('test.alt-chocolate' as IngredientId, { includeAlternates: true })).toBe(
          true
        );
      });

      test('usesIngredient returns false for unused ingredient', () => {
        const recipe = ctx.recipes.get('test.dark-ganache' as RecipeId).orThrow();
        expect(recipe.usesIngredient('test.nonexistent' as IngredientId)).toBe(false);
      });
    });

    describe('raw access', () => {
      test('raw returns underlying recipe data', () => {
        const recipe = ctx.recipes.get('test.dark-ganache' as RecipeId).orThrow();
        expect(recipe.raw.name).toBe('Dark Ganache');
      });

      test('rawAsRecipe returns Recipe instance when underlying data is Recipe', () => {
        const recipe = ctx.recipes.get('test.dark-ganache' as RecipeId).orThrow();
        // RecipesLibrary converts IRecipe data to Recipe class instances
        // So rawAsRecipe should return the Recipe instance
        expect(recipe.rawAsRecipe).toBeDefined();
        expect(recipe.rawAsRecipe).toBe(recipe.raw);
      });
    });

    describe('create factory', () => {
      test('create factory method succeeds', () => {
        const recipe = ctx.recipes.get('test.dark-ganache' as RecipeId).orThrow();
        expect(RuntimeRecipe.create(ctx as never, recipe.id, recipe.raw)).toSucceed();
      });
    });
  });

  // ============================================================================
  // RuntimeVersion Tests
  // ============================================================================

  describe('RuntimeVersion', () => {
    describe('identity', () => {
      test('provides versionSpec', () => {
        const recipe = ctx.recipes.get('test.dark-ganache' as RecipeId).orThrow();
        expect(recipe.goldenVersion.versionSpec).toBe('2026-01-01-01');
      });

      test('provides createdDate', () => {
        const recipe = ctx.recipes.get('test.dark-ganache' as RecipeId).orThrow();
        expect(recipe.goldenVersion.createdDate).toBe('2026-01-01');
      });

      test('provides recipeId', () => {
        const recipe = ctx.recipes.get('test.dark-ganache' as RecipeId).orThrow();
        expect(recipe.goldenVersion.recipeId).toBe('test.dark-ganache');
      });

      test('provides recipe parent reference', () => {
        const recipe = ctx.recipes.get('test.dark-ganache' as RecipeId).orThrow();
        const version = recipe.goldenVersion;
        expect(version.recipe).toBeDefined();
        expect(version.recipe.id).toBe('test.dark-ganache');
        expect(version.recipe.name).toBe('Dark Ganache');
      });
    });

    describe('resolved ingredients', () => {
      test('getIngredients returns all resolved ingredients', () => {
        const recipe = ctx.recipes.get('test.dark-ganache' as RecipeId).orThrow();
        expect(recipe.goldenVersion.getIngredients()).toSucceedAndSatisfy((iter) => {
          const ingredients = [...iter];
          expect(ingredients.length).toBe(2);
          expect(ingredients[0].ingredient.name).toBe('Dark Chocolate 70%');
          expect(ingredients[0].amount).toBe(200);
        });
      });

      test('resolved ingredient includes notes', () => {
        const recipe = ctx.recipes.get('test.dark-ganache' as RecipeId).orThrow();
        const ingredients = [...recipe.goldenVersion.getIngredients().orThrow()];
        expect(ingredients[0].notes).toBe('Use couverture');
      });

      test('resolved ingredient includes alternates', () => {
        const recipe = ctx.recipes.get('test.dark-ganache' as RecipeId).orThrow();
        const ingredients = [...recipe.goldenVersion.getIngredients().orThrow()];
        expect(ingredients[0].alternates.length).toBe(1);
        expect(ingredients[0].alternates[0].name).toBe('Alternative Chocolate');
      });

      test('resolved ingredient includes raw reference', () => {
        const recipe = ctx.recipes.get('test.dark-ganache' as RecipeId).orThrow();
        const ingredients = [...recipe.goldenVersion.getIngredients().orThrow()];
        expect(ingredients[0].raw.ingredient.ids[0]).toBe('test.dark-chocolate');
      });

      test('getIngredients with empty array returns nothing', () => {
        const recipe = ctx.recipes.get('test.dark-ganache' as RecipeId).orThrow();
        expect(recipe.goldenVersion.getIngredients([])).toSucceedAndSatisfy((iter) => {
          const ingredients = [...iter];
          expect(ingredients.length).toBe(0);
        });
      });

      test('getIngredients with exact ID filter returns matching ingredient', () => {
        const recipe = ctx.recipes.get('test.dark-ganache' as RecipeId).orThrow();
        expect(recipe.goldenVersion.getIngredients(['test.dark-chocolate'])).toSucceedAndSatisfy((iter) => {
          const ingredients = [...iter];
          expect(ingredients.length).toBe(1);
          expect(ingredients[0].ingredient.name).toBe('Dark Chocolate 70%');
        });
      });

      test('getIngredients with non-matching ID returns nothing', () => {
        const recipe = ctx.recipes.get('test.dark-ganache' as RecipeId).orThrow();
        expect(recipe.goldenVersion.getIngredients(['test.nonexistent'])).toSucceedAndSatisfy((iter) => {
          const ingredients = [...iter];
          expect(ingredients.length).toBe(0);
        });
      });
    });

    describe('computed properties', () => {
      test('provides baseWeight', () => {
        const recipe = ctx.recipes.get('test.dark-ganache' as RecipeId).orThrow();
        expect(recipe.goldenVersion.baseWeight).toBe(300);
      });

      test('provides yield', () => {
        const recipe = ctx.recipes.get('test.dark-ganache' as RecipeId).orThrow();
        expect(recipe.goldenVersion.yield).toBe('50 bonbons');
      });

      test('provides notes', () => {
        const recipe = ctx.recipes.get('test.dark-ganache' as RecipeId).orThrow();
        expect(recipe.goldenVersion.notes).toBe('Original recipe');
      });

      test('provides ratings', () => {
        const recipe = ctx.recipes.get('test.dark-ganache' as RecipeId).orThrow();
        const ratings = recipe.goldenVersion.ratings;
        expect(ratings.length).toBe(1);
        expect(ratings[0].score).toBe(4);
      });

      test('ratings returns empty array when none defined', () => {
        const recipe = ctx.recipes.get('test.dark-ganache' as RecipeId).orThrow();
        const version = recipe.versions[1]; // Second version has no ratings
        expect(version.ratings).toEqual([]);
      });
    });

    describe('filtering helpers', () => {
      test('getIngredients with category filter returns matching category', () => {
        const recipe = ctx.recipes.get('test.dark-ganache' as RecipeId).orThrow();
        expect(recipe.goldenVersion.getIngredients([{ category: 'chocolate' }])).toSucceedAndSatisfy(
          (iter) => {
            const chocolate = [...iter];
            expect(chocolate.length).toBe(1);
            expect(chocolate[0].ingredient.name).toBe('Dark Chocolate 70%');
          }
        );
      });

      test('getIngredients filters chocolate ingredients only', () => {
        const recipe = ctx.recipes.get('test.dark-ganache' as RecipeId).orThrow();
        const chocolate = [...recipe.goldenVersion.getIngredients([{ category: 'chocolate' }]).orThrow()];
        expect(chocolate.length).toBe(1);
      });

      test('getIngredients filters dairy ingredients only', () => {
        const recipe = ctx.recipes.get('test.dark-ganache' as RecipeId).orThrow();
        const dairy = [...recipe.goldenVersion.getIngredients([{ category: 'dairy' }]).orThrow()];
        expect(dairy.length).toBe(1);
        expect(dairy[0].ingredient.name).toBe('Heavy Cream');
      });

      test('getIngredients with sugar filter returns empty when no sugar', () => {
        const recipe = ctx.recipes.get('test.dark-ganache' as RecipeId).orThrow();
        const sugar = [...recipe.goldenVersion.getIngredients([{ category: 'sugar' }]).orThrow()];
        expect(sugar.length).toBe(0);
      });

      test('getIngredients with fat filter returns fat only', () => {
        const recipe = ctx.recipes.get('test.dark-ganache' as RecipeId).orThrow();
        const version = recipe.versions[1]; // Has butter
        const fat = [...version.getIngredients([{ category: 'fat' }]).orThrow()];
        expect(fat.length).toBe(1);
        expect(fat[0].ingredient.name).toBe('Butter');
      });

      test('getIngredients with alcohol filter returns empty when no alcohol', () => {
        const recipe = ctx.recipes.get('test.dark-ganache' as RecipeId).orThrow();
        const alcohol = [...recipe.goldenVersion.getIngredients([{ category: 'alcohol' }]).orThrow()];
        expect(alcohol.length).toBe(0);
      });

      test('getIngredients with regex pattern filters by ID pattern', () => {
        const recipe = ctx.recipes.get('test.dark-ganache' as RecipeId).orThrow();
        const matching = [...recipe.goldenVersion.getIngredients([/^test\.dark/]).orThrow()];
        expect(matching.length).toBe(1);
        expect(matching[0].ingredient.name).toBe('Dark Chocolate 70%');
      });

      test('getIngredients with multiple filters uses OR semantics', () => {
        const recipe = ctx.recipes.get('test.dark-ganache' as RecipeId).orThrow();
        const filtered = [
          ...recipe.goldenVersion.getIngredients([{ category: 'chocolate' }, { category: 'dairy' }]).orThrow()
        ];
        expect(filtered.length).toBe(2);
      });

      test('getIngredients with category regex pattern', () => {
        const recipe = ctx.recipes.get('test.dark-ganache' as RecipeId).orThrow();
        const matching = [...recipe.goldenVersion.getIngredients([{ category: /^choc/ }]).orThrow()];
        expect(matching.length).toBe(1);
        expect(matching[0].ingredient.name).toBe('Dark Chocolate 70%');
      });
    });

    describe('operations', () => {
      test('usesIngredient returns true for used ingredient', () => {
        const recipe = ctx.recipes.get('test.dark-ganache' as RecipeId).orThrow();
        expect(recipe.goldenVersion.usesIngredient('test.dark-chocolate' as IngredientId)).toBe(true);
      });

      test('usesIngredient returns false for unused ingredient', () => {
        const recipe = ctx.recipes.get('test.dark-ganache' as RecipeId).orThrow();
        // butter is used in version 2 but not golden version
        expect(recipe.goldenVersion.usesIngredient('test.butter' as IngredientId)).toBe(false);
      });

      test('scale scales to target weight', () => {
        const recipe = ctx.recipes.get('test.dark-ganache' as RecipeId).orThrow();
        expect(recipe.goldenVersion.scale(600 as Grams)).toSucceedAndSatisfy((scaled) => {
          expect(scaled.scaledFrom.scaleFactor).toBe(2);
          expect(scaled.scaledFrom.sourceVersion.versionSpec).toBe('2026-01-01-01');
        });
      });

      test('scale fails for zero target weight', () => {
        const recipe = ctx.recipes.get('test.dark-ganache' as RecipeId).orThrow();
        expect(recipe.goldenVersion.scale(0 as Grams)).toFailWith(/greater than zero/);
      });

      test('scale fails for negative target weight', () => {
        const recipe = ctx.recipes.get('test.dark-ganache' as RecipeId).orThrow();
        expect(recipe.goldenVersion.scale(-100 as Grams)).toFailWith(/greater than zero/);
      });

      test('scaleByFactor scales by multiplicative factor', () => {
        const recipe = ctx.recipes.get('test.dark-ganache' as RecipeId).orThrow();
        expect(recipe.goldenVersion.scaleByFactor(2.0)).toSucceedAndSatisfy((scaled) => {
          expect(scaled.baseWeight).toBe(600);
        });
      });

      test('scaleByFactor fails for zero factor', () => {
        const recipe = ctx.recipes.get('test.dark-ganache' as RecipeId).orThrow();
        expect(recipe.goldenVersion.scaleByFactor(0)).toFailWith(/greater than zero/);
      });

      test('scaleByFactor fails for negative factor', () => {
        const recipe = ctx.recipes.get('test.dark-ganache' as RecipeId).orThrow();
        expect(recipe.goldenVersion.scaleByFactor(-1)).toFailWith(/greater than zero/);
      });

      test('calculateGanache returns analysis', () => {
        const recipe = ctx.recipes.get('test.dark-ganache' as RecipeId).orThrow();
        expect(recipe.goldenVersion.calculateGanache()).toSucceedAndSatisfy((calc) => {
          expect(calc.analysis).toBeDefined();
          expect(calc.validation).toBeDefined();
        });
      });
    });

    describe('raw access', () => {
      test('raw returns underlying version data', () => {
        const recipe = ctx.recipes.get('test.dark-ganache' as RecipeId).orThrow();
        expect(recipe.goldenVersion.raw.versionSpec).toBe('2026-01-01-01');
      });
    });

    describe('create factory', () => {
      test('create factory method succeeds', () => {
        const recipe = ctx.recipes.get('test.dark-ganache' as RecipeId).orThrow();
        expect(RuntimeVersion.create(ctx as never, recipe.id, recipe.goldenVersion.raw)).toSucceed();
      });
    });
  });

  // ============================================================================
  // RuntimeScaledVersion Tests
  // ============================================================================

  describe('RuntimeScaledVersion', () => {
    describe('getIngredients filtering', () => {
      test('getIngredients with no filter returns all ingredients', () => {
        const recipe = ctx.recipes.get('test.dark-ganache' as RecipeId).orThrow();
        expect(recipe.goldenVersion.scale(600 as Grams)).toSucceedAndSatisfy((scaled) => {
          expect(scaled.getIngredients()).toSucceedAndSatisfy((iter) => {
            const ingredients = [...iter];
            expect(ingredients.length).toBe(2);
          });
        });
      });

      test('getIngredients with empty array returns nothing', () => {
        const recipe = ctx.recipes.get('test.dark-ganache' as RecipeId).orThrow();
        expect(recipe.goldenVersion.scale(600 as Grams)).toSucceedAndSatisfy((scaled) => {
          expect(scaled.getIngredients([])).toSucceedAndSatisfy((iter) => {
            const ingredients = [...iter];
            expect(ingredients.length).toBe(0);
          });
        });
      });

      test('getIngredients with string filter matches exact ID', () => {
        const recipe = ctx.recipes.get('test.dark-ganache' as RecipeId).orThrow();
        expect(recipe.goldenVersion.scale(600 as Grams)).toSucceedAndSatisfy((scaled) => {
          expect(scaled.getIngredients(['test.dark-chocolate'])).toSucceedAndSatisfy((iter) => {
            const ingredients = [...iter];
            expect(ingredients.length).toBe(1);
            expect(ingredients[0].ingredient.id).toBe('test.dark-chocolate');
          });
        });
      });

      test('getIngredients with regex filter matches pattern', () => {
        const recipe = ctx.recipes.get('test.dark-ganache' as RecipeId).orThrow();
        expect(recipe.goldenVersion.scale(600 as Grams)).toSucceedAndSatisfy((scaled) => {
          expect(scaled.getIngredients([/^test\.dark/])).toSucceedAndSatisfy((iter) => {
            const ingredients = [...iter];
            expect(ingredients.length).toBe(1);
            expect(ingredients[0].ingredient.id).toBe('test.dark-chocolate');
          });
        });
      });

      test('getIngredients with category filter matches category', () => {
        const recipe = ctx.recipes.get('test.dark-ganache' as RecipeId).orThrow();
        expect(recipe.goldenVersion.scale(600 as Grams)).toSucceedAndSatisfy((scaled) => {
          expect(scaled.getIngredients([{ category: 'dairy' }])).toSucceedAndSatisfy((iter) => {
            const ingredients = [...iter];
            expect(ingredients.length).toBe(1);
            expect(ingredients[0].ingredient.category).toBe('dairy');
          });
        });
      });

      test('getIngredients with category regex filter matches pattern', () => {
        const recipe = ctx.recipes.get('test.dark-ganache' as RecipeId).orThrow();
        expect(recipe.goldenVersion.scale(600 as Grams)).toSucceedAndSatisfy((scaled) => {
          expect(scaled.getIngredients([{ category: /^choc/ }])).toSucceedAndSatisfy((iter) => {
            const ingredients = [...iter];
            expect(ingredients.length).toBe(1);
            expect(ingredients[0].ingredient.category).toBe('chocolate');
          });
        });
      });

      test('getIngredients with multiple filters uses OR semantics', () => {
        const recipe = ctx.recipes.get('test.dark-ganache' as RecipeId).orThrow();
        expect(recipe.goldenVersion.scale(600 as Grams)).toSucceedAndSatisfy((scaled) => {
          expect(
            scaled.getIngredients([{ category: 'chocolate' }, { category: 'dairy' }])
          ).toSucceedAndSatisfy((iter) => {
            const ingredients = [...iter];
            expect(ingredients.length).toBe(2);
          });
        });
      });

      test('getIngredients with non-matching filter returns empty', () => {
        const recipe = ctx.recipes.get('test.dark-ganache' as RecipeId).orThrow();
        expect(recipe.goldenVersion.scale(600 as Grams)).toSucceedAndSatisfy((scaled) => {
          expect(scaled.getIngredients(['test.nonexistent'])).toSucceedAndSatisfy((iter) => {
            const ingredients = [...iter];
            expect(ingredients.length).toBe(0);
          });
        });
      });
    });

    describe('scaled properties', () => {
      test('scaledFrom contains source version reference', () => {
        const recipe = ctx.recipes.get('test.dark-ganache' as RecipeId).orThrow();
        expect(recipe.goldenVersion.scale(600 as Grams)).toSucceedAndSatisfy((scaled) => {
          expect(scaled.scaledFrom.sourceVersion.versionSpec).toBe('2026-01-01-01');
          expect(scaled.scaledFrom.scaleFactor).toBe(2);
          expect(scaled.scaledFrom.targetWeight).toBe(600);
        });
      });

      test('targetWeight returns requested weight', () => {
        const recipe = ctx.recipes.get('test.dark-ganache' as RecipeId).orThrow();
        expect(recipe.goldenVersion.scale(600 as Grams)).toSucceedAndSatisfy((scaled) => {
          expect(scaled.targetWeight).toBe(600);
        });
      });

      test('baseWeight matches target weight', () => {
        const recipe = ctx.recipes.get('test.dark-ganache' as RecipeId).orThrow();
        expect(recipe.goldenVersion.scale(600 as Grams)).toSucceedAndSatisfy((scaled) => {
          expect(scaled.baseWeight).toBe(600);
        });
      });

      test('createdDate is present', () => {
        const recipe = ctx.recipes.get('test.dark-ganache' as RecipeId).orThrow();
        expect(recipe.goldenVersion.scale(600 as Grams)).toSucceedAndSatisfy((scaled) => {
          expect(scaled.createdDate).toBeDefined();
          expect(typeof scaled.createdDate).toBe('string');
        });
      });

      test('yields is accessible', () => {
        const recipe = ctx.recipes.get('test.dark-ganache' as RecipeId).orThrow();
        expect(recipe.goldenVersion.scale(600 as Grams)).toSucceedAndSatisfy((scaled) => {
          // yield may or may not be defined based on source
          expect(() => scaled.yield).not.toThrow();
        });
      });

      test('notes is accessible', () => {
        const recipe = ctx.recipes.get('test.dark-ganache' as RecipeId).orThrow();
        expect(recipe.goldenVersion.scale(600 as Grams)).toSucceedAndSatisfy((scaled) => {
          // notes may or may not be defined based on source
          expect(() => scaled.notes).not.toThrow();
        });
      });

      test('ratings returns array', () => {
        const recipe = ctx.recipes.get('test.dark-ganache' as RecipeId).orThrow();
        expect(recipe.goldenVersion.scale(600 as Grams)).toSucceedAndSatisfy((scaled) => {
          expect(Array.isArray(scaled.ratings)).toBe(true);
        });
      });

      test('raw returns underlying computed scaled recipe', () => {
        const recipe = ctx.recipes.get('test.dark-ganache' as RecipeId).orThrow();
        expect(recipe.goldenVersion.scale(600 as Grams)).toSucceedAndSatisfy((scaled) => {
          expect(scaled.raw).toBeDefined();
          expect(scaled.raw.scaledFrom).toBeDefined();
          expect(scaled.raw.ingredients).toBeDefined();
        });
      });
    });

    describe('calculateGanache', () => {
      test('calculateGanache uses scaled amounts', () => {
        const recipe = ctx.recipes.get('test.dark-ganache' as RecipeId).orThrow();
        expect(recipe.goldenVersion.scale(600 as Grams)).toSucceedAndSatisfy((scaled) => {
          expect(scaled.calculateGanache()).toSucceedAndSatisfy((calc) => {
            // Scaled to 2x, so total weight should be 600
            expect(calc.analysis.totalWeight).toBe(600);
          });
        });
      });
    });
  });
});
