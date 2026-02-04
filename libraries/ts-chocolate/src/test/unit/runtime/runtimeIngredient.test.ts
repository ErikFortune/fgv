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
  Celsius,
  DegreesMacMichael,
  Measurement,
  IngredientId,
  Percentage,
  FillingName,
  FillingVersionSpec,
  SourceId
} from '../../../packlets/common';

import {
  IGanacheCharacteristics,
  IChocolateIngredient,
  IDairyIngredient,
  ISugarIngredient,
  IFatIngredient,
  IAlcoholIngredient,
  Ingredients,
  IngredientsLibrary
} from '../../../packlets/entities';
import { IFillingRecipeEntity, FillingsLibrary } from '../../../packlets/entities';
import { ChocolateLibrary } from '../../../packlets/library-runtime';
import { RuntimeContext } from '../../../packlets/runtime';
import {
  RuntimeIngredient,
  RuntimeChocolateIngredient,
  RuntimeDairyIngredient,
  RuntimeSugarIngredient,
  RuntimeFatIngredient,
  RuntimeAlcoholIngredient
} from '../../../packlets/library-runtime';
// eslint-disable-next-line @rushstack/packlets/mechanics
import { RuntimeGenericIngredient } from '../../../packlets/library-runtime/ingredients/runtimeGenericIngredient';

describe('RuntimeIngredient', () => {
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

  const darkChocolate: IChocolateIngredient = {
    baseId: 'dark-chocolate' as BaseIngredientId,
    name: 'Dark Chocolate 70%',
    description: 'Premium dark chocolate',
    category: 'chocolate',
    chocolateType: 'dark',
    cacaoPercentage: 70 as Percentage,
    ganacheCharacteristics: testChars,
    tags: ['premium', 'single-origin'],
    manufacturer: 'Test Manufacturer',
    allergens: ['soy'],
    traceAllergens: ['milk'],
    certifications: ['organic', 'fair-trade'],
    vegan: true,
    fluidityStars: 3,
    viscosityMcM: 2500 as DegreesMacMichael,
    temperatureCurve: { melt: 50 as Celsius, cool: 28 as Celsius, working: 31 as Celsius },
    beanVarieties: ['Criollo'],
    applications: ['ganache', 'molding'],
    origins: ['Venezuela']
  };

  const cream: IDairyIngredient = {
    baseId: 'cream' as BaseIngredientId,
    name: 'Heavy Cream',
    category: 'dairy',
    ganacheCharacteristics: {
      cacaoFat: 0 as Percentage,
      sugar: 3 as Percentage,
      milkFat: 38 as Percentage,
      water: 55 as Percentage,
      solids: 4 as Percentage,
      otherFats: 0 as Percentage
    },
    fatContent: 38 as Percentage,
    waterContent: 55 as Percentage
  };

  const sugar: ISugarIngredient = {
    baseId: 'sugar' as BaseIngredientId,
    name: 'Granulated Sugar',
    category: 'sugar',
    ganacheCharacteristics: {
      cacaoFat: 0 as Percentage,
      sugar: 100 as Percentage,
      milkFat: 0 as Percentage,
      water: 0 as Percentage,
      solids: 0 as Percentage,
      otherFats: 0 as Percentage
    },
    hydrationNumber: 1.0,
    sweetnessPotency: 1.0
  };

  const butter: IFatIngredient = {
    baseId: 'butter' as BaseIngredientId,
    name: 'Unsalted Butter',
    category: 'fat',
    ganacheCharacteristics: {
      cacaoFat: 0 as Percentage,
      sugar: 0 as Percentage,
      milkFat: 82 as Percentage,
      water: 16 as Percentage,
      solids: 2 as Percentage,
      otherFats: 0 as Percentage
    },
    meltingPoint: 32 as Celsius
  };

  const rum: IAlcoholIngredient = {
    baseId: 'rum' as BaseIngredientId,
    name: 'Dark Rum',
    category: 'alcohol',
    ganacheCharacteristics: {
      cacaoFat: 0 as Percentage,
      sugar: 0 as Percentage,
      milkFat: 0 as Percentage,
      water: 60 as Percentage,
      solids: 0 as Percentage,
      otherFats: 0 as Percentage
    },
    alcoholByVolume: 40 as Percentage,
    flavorProfile: 'Rich, sweet, with vanilla and caramel notes'
  };

  // Generic ingredient categories (liquid, flavor, other)
  const water: Ingredients.IIngredient = {
    baseId: 'water' as BaseIngredientId,
    name: 'Water',
    category: 'liquid',
    ganacheCharacteristics: {
      cacaoFat: 0 as Percentage,
      sugar: 0 as Percentage,
      milkFat: 0 as Percentage,
      water: 100 as Percentage,
      solids: 0 as Percentage,
      otherFats: 0 as Percentage
    }
  };

  const vanillaExtract: Ingredients.IIngredient = {
    baseId: 'vanilla-extract' as BaseIngredientId,
    name: 'Vanilla Extract',
    category: 'flavor',
    ganacheCharacteristics: {
      cacaoFat: 0 as Percentage,
      sugar: 0 as Percentage,
      milkFat: 0 as Percentage,
      water: 35 as Percentage,
      solids: 0 as Percentage,
      otherFats: 0 as Percentage
    },
    tags: ['natural', 'aroma']
  };

  const lecithin: Ingredients.IIngredient = {
    baseId: 'lecithin' as BaseIngredientId,
    name: 'Soy Lecithin',
    category: 'other',
    ganacheCharacteristics: {
      cacaoFat: 0 as Percentage,
      sugar: 0 as Percentage,
      milkFat: 0 as Percentage,
      water: 0 as Percentage,
      solids: 100 as Percentage,
      otherFats: 0 as Percentage
    },
    description: 'Emulsifier used in chocolate production',
    allergens: ['soy']
  };

  const testRecipe: IFillingRecipeEntity = {
    baseId: 'ganache' as BaseFillingId,
    name: 'Test Ganache' as FillingName,
    category: 'ganache',
    goldenVersionSpec: '2026-01-01-01' as FillingVersionSpec,
    versions: [
      {
        versionSpec: '2026-01-01-01' as FillingVersionSpec,
        createdDate: '2026-01-01',
        ingredients: [
          { ingredient: { ids: ['test.dark-chocolate' as IngredientId] }, amount: 200 as Measurement },
          { ingredient: { ids: ['test.cream' as IngredientId] }, amount: 100 as Measurement }
        ],
        baseWeight: 300 as Measurement
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
            // eslint-disable-next-line @typescript-eslint/naming-convention
            'dark-chocolate': darkChocolate,
            cream,
            sugar,
            butter,
            rum,
            water,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            'vanilla-extract': vanillaExtract,
            lecithin
          }
        }
      ]
    }).orThrow();

    const recipes = FillingsLibrary.create({
      builtin: false,
      collections: [
        {
          id: 'test' as SourceId,
          isMutable: false,
          items: { ganache: testRecipe }
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
  // Factory Method Tests
  // ============================================================================

  describe('create', () => {
    test('create factory method succeeds', () => {
      const ingredient = ctx.ingredients.get('test.dark-chocolate' as IngredientId).orThrow();
      expect(RuntimeIngredient.create(ctx as never, ingredient.id, ingredient.raw)).toSucceed();
    });
  });

  // ============================================================================
  // Identity Tests
  // ============================================================================

  describe('identity', () => {
    test('provides composite ID', () => {
      const ingredient = ctx.ingredients.get('test.dark-chocolate' as IngredientId).orThrow();
      expect(ingredient.id).toBe('test.dark-chocolate');
    });

    test('provides source ID', () => {
      const ingredient = ctx.ingredients.get('test.dark-chocolate' as IngredientId).orThrow();
      expect(ingredient.sourceId).toBe('test');
    });

    test('provides base ID', () => {
      const ingredient = ctx.ingredients.get('test.dark-chocolate' as IngredientId).orThrow();
      expect(ingredient.baseId).toBe('dark-chocolate');
    });
  });

  // ============================================================================
  // Core Properties Tests
  // ============================================================================

  describe('core properties', () => {
    test('provides name', () => {
      const ingredient = ctx.ingredients.get('test.dark-chocolate' as IngredientId).orThrow();
      expect(ingredient.name).toBe('Dark Chocolate 70%');
    });

    test('provides category', () => {
      const ingredient = ctx.ingredients.get('test.dark-chocolate' as IngredientId).orThrow();
      expect(ingredient.category).toBe('chocolate');
    });

    test('provides description', () => {
      const ingredient = ctx.ingredients.get('test.dark-chocolate' as IngredientId).orThrow();
      expect(ingredient.description).toBe('Premium dark chocolate');
    });

    test('provides manufacturer', () => {
      const ingredient = ctx.ingredients.get('test.dark-chocolate' as IngredientId).orThrow();
      expect(ingredient.manufacturer).toBe('Test Manufacturer');
    });

    test('provides ganache characteristics', () => {
      const ingredient = ctx.ingredients.get('test.dark-chocolate' as IngredientId).orThrow();
      expect(ingredient.ganacheCharacteristics.cacaoFat).toBe(36);
    });

    test('provides tags', () => {
      const ingredient = ctx.ingredients.get('test.dark-chocolate' as IngredientId).orThrow();
      expect(ingredient.tags).toContain('premium');
      expect(ingredient.tags).toContain('single-origin');
    });

    test('provides empty tags when none defined', () => {
      const ingredient = ctx.ingredients.get('test.sugar' as IngredientId).orThrow();
      expect(ingredient.tags).toEqual([]);
    });

    test('provides allergens', () => {
      const ingredient = ctx.ingredients.get('test.dark-chocolate' as IngredientId).orThrow();
      expect(ingredient.allergens).toContain('soy');
    });

    test('provides trace allergens', () => {
      const ingredient = ctx.ingredients.get('test.dark-chocolate' as IngredientId).orThrow();
      expect(ingredient.traceAllergens).toContain('milk');
    });

    test('provides certifications', () => {
      const ingredient = ctx.ingredients.get('test.dark-chocolate' as IngredientId).orThrow();
      expect(ingredient.certifications).toContain('organic');
    });

    test('provides vegan status', () => {
      const ingredient = ctx.ingredients.get('test.dark-chocolate' as IngredientId).orThrow();
      // vegan: true is set in the test fixture
      expect(ingredient.vegan).toBe(true);
    });
  });

  // ============================================================================
  // Type Guard Tests
  // ============================================================================

  describe('type guards', () => {
    test('isChocolate returns true for chocolate', () => {
      const ingredient = ctx.ingredients.get('test.dark-chocolate' as IngredientId).orThrow();
      expect(ingredient.isChocolate()).toBe(true);
    });

    test('isChocolate returns false for non-chocolate', () => {
      const ingredient = ctx.ingredients.get('test.cream' as IngredientId).orThrow();
      expect(ingredient.isChocolate()).toBe(false);
    });

    test('isDairy returns true for dairy', () => {
      const ingredient = ctx.ingredients.get('test.cream' as IngredientId).orThrow();
      expect(ingredient.isDairy()).toBe(true);
    });

    test('isDairy returns false for non-dairy', () => {
      const ingredient = ctx.ingredients.get('test.dark-chocolate' as IngredientId).orThrow();
      expect(ingredient.isDairy()).toBe(false);
    });

    test('isSugar returns true for sugar', () => {
      const ingredient = ctx.ingredients.get('test.sugar' as IngredientId).orThrow();
      expect(ingredient.isSugar()).toBe(true);
    });

    test('isFat returns true for fat', () => {
      const ingredient = ctx.ingredients.get('test.butter' as IngredientId).orThrow();
      expect(ingredient.isFat()).toBe(true);
    });

    test('isAlcohol returns true for alcohol', () => {
      const ingredient = ctx.ingredients.get('test.rum' as IngredientId).orThrow();
      expect(ingredient.isAlcohol()).toBe(true);
    });
  });

  // ============================================================================
  // Chocolate-Specific Properties Tests
  // ============================================================================

  describe('chocolate-specific properties', () => {
    test('provides chocolateType via type narrowing', () => {
      const ingredient = ctx.ingredients.get('test.dark-chocolate' as IngredientId).orThrow();
      expect(ingredient.isChocolate()).toBe(true);
      if (ingredient.isChocolate()) {
        expect(ingredient.chocolateType).toBe('dark');
      }
    });

    test('isChocolate returns false for non-chocolate', () => {
      const ingredient = ctx.ingredients.get('test.cream' as IngredientId).orThrow();
      expect(ingredient.isChocolate()).toBe(false);
    });

    test('provides cacaoPercentage via type narrowing', () => {
      const ingredient = ctx.ingredients.get('test.dark-chocolate' as IngredientId).orThrow();
      if (ingredient.isChocolate()) {
        expect(ingredient.cacaoPercentage).toBe(70);
      }
    });

    test('provides fluidityStars via type narrowing', () => {
      const ingredient = ctx.ingredients.get('test.dark-chocolate' as IngredientId).orThrow();
      if (ingredient.isChocolate()) {
        expect(ingredient.fluidityStars).toBe(3);
      }
    });

    test('provides viscosityMcM via type narrowing', () => {
      const ingredient = ctx.ingredients.get('test.dark-chocolate' as IngredientId).orThrow();
      if (ingredient.isChocolate()) {
        expect(ingredient.viscosityMcM).toBe(2500);
      }
    });

    test('provides temperatureCurve via type narrowing', () => {
      const ingredient = ctx.ingredients.get('test.dark-chocolate' as IngredientId).orThrow();
      if (ingredient.isChocolate()) {
        expect(ingredient.temperatureCurve).toEqual({ melt: 50, cool: 28, working: 31 });
      }
    });

    test('provides beanVarieties via type narrowing', () => {
      const ingredient = ctx.ingredients.get('test.dark-chocolate' as IngredientId).orThrow();
      if (ingredient.isChocolate()) {
        expect(ingredient.beanVarieties).toContain('Criollo');
      }
    });

    test('provides applications via type narrowing', () => {
      const ingredient = ctx.ingredients.get('test.dark-chocolate' as IngredientId).orThrow();
      if (ingredient.isChocolate()) {
        expect(ingredient.applications).toContain('ganache');
      }
    });

    test('provides origins via type narrowing', () => {
      const ingredient = ctx.ingredients.get('test.dark-chocolate' as IngredientId).orThrow();
      if (ingredient.isChocolate()) {
        expect(ingredient.origins).toContain('Venezuela');
      }
    });

    test('returns RuntimeChocolateIngredient instance', () => {
      const ingredient = ctx.ingredients.get('test.dark-chocolate' as IngredientId).orThrow();
      expect(ingredient).toBeInstanceOf(RuntimeChocolateIngredient);
    });
  });

  // ============================================================================
  // Category-Specific Properties Tests
  // ============================================================================

  describe('dairy-specific properties', () => {
    test('provides fatContent via type narrowing', () => {
      const ingredient = ctx.ingredients.get('test.cream' as IngredientId).orThrow();
      if (ingredient.isDairy()) {
        expect(ingredient.fatContent).toBe(38);
      }
    });

    test('provides waterContent via type narrowing', () => {
      const ingredient = ctx.ingredients.get('test.cream' as IngredientId).orThrow();
      if (ingredient.isDairy()) {
        expect(ingredient.waterContent).toBe(55);
      }
    });

    test('isDairy returns false for non-dairy', () => {
      const ingredient = ctx.ingredients.get('test.dark-chocolate' as IngredientId).orThrow();
      expect(ingredient.isDairy()).toBe(false);
    });

    test('returns RuntimeDairyIngredient instance', () => {
      const ingredient = ctx.ingredients.get('test.cream' as IngredientId).orThrow();
      expect(ingredient).toBeInstanceOf(RuntimeDairyIngredient);
    });
  });

  describe('sugar-specific properties', () => {
    test('provides hydrationNumber via type narrowing', () => {
      const ingredient = ctx.ingredients.get('test.sugar' as IngredientId).orThrow();
      if (ingredient.isSugar()) {
        expect(ingredient.hydrationNumber).toBe(1.0);
      }
    });

    test('provides sweetnessPotency via type narrowing', () => {
      const ingredient = ctx.ingredients.get('test.sugar' as IngredientId).orThrow();
      if (ingredient.isSugar()) {
        expect(ingredient.sweetnessPotency).toBe(1.0);
      }
    });

    test('isSugar returns false for non-sugar', () => {
      const ingredient = ctx.ingredients.get('test.dark-chocolate' as IngredientId).orThrow();
      expect(ingredient.isSugar()).toBe(false);
    });

    test('returns RuntimeSugarIngredient instance', () => {
      const ingredient = ctx.ingredients.get('test.sugar' as IngredientId).orThrow();
      expect(ingredient).toBeInstanceOf(RuntimeSugarIngredient);
    });

    test('provides raw access to underlying sugar ingredient', () => {
      const ingredient = ctx.ingredients.get('test.sugar' as IngredientId).orThrow();
      if (ingredient.isSugar()) {
        expect(ingredient.raw.category).toBe('sugar');
        expect(ingredient.raw.baseId).toBe('sugar');
      }
    });
  });

  describe('fat-specific properties', () => {
    test('provides meltingPoint via type narrowing', () => {
      const ingredient = ctx.ingredients.get('test.butter' as IngredientId).orThrow();
      if (ingredient.isFat()) {
        expect(ingredient.meltingPoint).toBe(32);
      }
    });

    test('isFat returns false for non-fat', () => {
      const ingredient = ctx.ingredients.get('test.dark-chocolate' as IngredientId).orThrow();
      expect(ingredient.isFat()).toBe(false);
    });

    test('returns RuntimeFatIngredient instance', () => {
      const ingredient = ctx.ingredients.get('test.butter' as IngredientId).orThrow();
      expect(ingredient).toBeInstanceOf(RuntimeFatIngredient);
    });

    test('provides raw access to underlying fat ingredient', () => {
      const ingredient = ctx.ingredients.get('test.butter' as IngredientId).orThrow();
      if (ingredient.isFat()) {
        expect(ingredient.raw.category).toBe('fat');
        expect(ingredient.raw.baseId).toBe('butter');
      }
    });
  });

  describe('alcohol-specific properties', () => {
    test('provides alcoholByVolume via type narrowing', () => {
      const ingredient = ctx.ingredients.get('test.rum' as IngredientId).orThrow();
      if (ingredient.isAlcohol()) {
        expect(ingredient.alcoholByVolume).toBe(40);
      }
    });

    test('provides flavorProfile via type narrowing', () => {
      const ingredient = ctx.ingredients.get('test.rum' as IngredientId).orThrow();
      if (ingredient.isAlcohol()) {
        expect(ingredient.flavorProfile).toContain('vanilla');
      }
    });

    test('isAlcohol returns false for non-alcohol', () => {
      const ingredient = ctx.ingredients.get('test.dark-chocolate' as IngredientId).orThrow();
      expect(ingredient.isAlcohol()).toBe(false);
    });

    test('returns RuntimeAlcoholIngredient instance', () => {
      const ingredient = ctx.ingredients.get('test.rum' as IngredientId).orThrow();
      expect(ingredient).toBeInstanceOf(RuntimeAlcoholIngredient);
    });

    test('provides raw access to underlying alcohol ingredient', () => {
      const ingredient = ctx.ingredients.get('test.rum' as IngredientId).orThrow();
      if (ingredient.isAlcohol()) {
        expect(ingredient.raw.category).toBe('alcohol');
        expect(ingredient.raw.baseId).toBe('rum');
      }
    });
  });

  // ============================================================================
  // Navigation Tests
  // ============================================================================

  describe('navigation', () => {
    test('usedByFillings returns recipes using ingredient', () => {
      const ingredient = ctx.ingredients.get('test.dark-chocolate' as IngredientId).orThrow();
      const recipes = ingredient.usedByFillings();
      expect(recipes.length).toBe(1);
      expect(recipes[0].id).toBe('test.ganache');
    });

    test('primaryInFillings returns primary usages', () => {
      const ingredient = ctx.ingredients.get('test.dark-chocolate' as IngredientId).orThrow();
      const recipes = ingredient.primaryInFillings();
      expect(recipes.length).toBe(1);
    });

    test('alternateInFillings returns alternate usages', () => {
      const ingredient = ctx.ingredients.get('test.dark-chocolate' as IngredientId).orThrow();
      const recipes = ingredient.alternateInFillings();
      expect(recipes.length).toBe(0);
    });
  });

  // ============================================================================
  // Raw Access Tests
  // ============================================================================

  describe('raw access', () => {
    test('raw returns underlying ingredient', () => {
      const ingredient = ctx.ingredients.get('test.dark-chocolate' as IngredientId).orThrow();
      expect(ingredient.raw.name).toBe('Dark Chocolate 70%');
    });
  });

  // ============================================================================
  // Generic Ingredient Tests (liquid, flavor, other categories)
  // ============================================================================

  describe('generic ingredients', () => {
    describe('liquid category', () => {
      test('creates RuntimeGenericIngredient for liquid category', () => {
        const ingredient = ctx.ingredients.get('test.water' as IngredientId).orThrow();
        expect(ingredient).toBeInstanceOf(RuntimeGenericIngredient);
        expect(ingredient.category).toBe('liquid');
      });

      test('liquid ingredient has correct raw data', () => {
        const ingredient = ctx.ingredients.get('test.water' as IngredientId).orThrow();
        expect(ingredient.raw.name).toBe('Water');
        expect(ingredient.raw.ganacheCharacteristics.water).toBe(100);
      });
    });

    describe('flavor category', () => {
      test('creates RuntimeGenericIngredient for flavor category', () => {
        const ingredient = ctx.ingredients.get('test.vanilla-extract' as IngredientId).orThrow();
        expect(ingredient).toBeInstanceOf(RuntimeGenericIngredient);
        expect(ingredient.category).toBe('flavor');
      });

      test('flavor ingredient has correct raw data and tags', () => {
        const ingredient = ctx.ingredients.get('test.vanilla-extract' as IngredientId).orThrow();
        expect(ingredient.raw.name).toBe('Vanilla Extract');
        expect(ingredient.raw.tags).toContain('natural');
        expect(ingredient.raw.tags).toContain('aroma');
      });
    });

    describe('other category', () => {
      test('creates RuntimeGenericIngredient for other category', () => {
        const ingredient = ctx.ingredients.get('test.lecithin' as IngredientId).orThrow();
        expect(ingredient).toBeInstanceOf(RuntimeGenericIngredient);
        expect(ingredient.category).toBe('other');
      });

      test('other ingredient has correct raw data and description', () => {
        const ingredient = ctx.ingredients.get('test.lecithin' as IngredientId).orThrow();
        expect(ingredient.raw.name).toBe('Soy Lecithin');
        expect(ingredient.raw.description).toBe('Emulsifier used in chocolate production');
        expect(ingredient.raw.allergens).toContain('soy');
      });
    });

    describe('RuntimeGenericIngredient factory', () => {
      test('create succeeds with valid parameters', () => {
        const ingredient = ctx.ingredients.get('test.water' as IngredientId).orThrow();
        expect(RuntimeGenericIngredient.create(ctx as never, ingredient.id, ingredient.raw)).toSucceed();
      });

      test('created instance has correct category and raw access', () => {
        const originalIngredient = ctx.ingredients.get('test.vanilla-extract' as IngredientId).orThrow();
        expect(
          RuntimeGenericIngredient.create(ctx as never, originalIngredient.id, originalIngredient.raw)
        ).toSucceedAndSatisfy((newIngredient) => {
          expect(newIngredient.category).toBe('flavor');
          expect(newIngredient.raw.name).toBe('Vanilla Extract');
        });
      });
    });
  });
});
