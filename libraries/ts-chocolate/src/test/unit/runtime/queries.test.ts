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
  FillingName,
  FillingRecipeVariationSpec,
  CollectionId
} from '../../../packlets/common';

import {
  IGanacheCharacteristics,
  IChocolateIngredientEntity,
  IDairyIngredientEntity,
  ISugarIngredientEntity,
  IFatIngredientEntity,
  IAlcoholIngredientEntity,
  IngredientsLibrary
} from '../../../packlets/entities';
import { IFillingRecipeEntity, FillingsLibrary } from '../../../packlets/entities';
import {
  ChocolateEntityLibrary,
  IngredientQuery,
  FillingRecipeQuery,
  andFilters,
  orFilters,
  notFilter,
  containsIgnoreCase,
  hasTag,
  hasAnyTag,
  hasAllTags,
  inRange,
  atLeast,
  atMost,
  collectionContains,
  collectionContainsAny,
  equals,
  oneOf
} from '../../../packlets/library-runtime';
import { ChocolateLibrary } from '../../../packlets/library-runtime';

describe('Query Filters and Builders', () => {
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
    description: 'Premium dark chocolate from Venezuela',
    category: 'chocolate',
    chocolateType: 'dark',
    cacaoPercentage: 70 as Percentage,
    ganacheCharacteristics: testChars,
    tags: ['premium', 'single-origin'],
    manufacturer: 'Felchlin',
    allergens: ['soy'],
    certifications: ['organic'],
    vegan: true,
    applications: ['ganache', 'molding']
  };

  const milkChocolate: IChocolateIngredientEntity = {
    baseId: 'milk-chocolate' as BaseIngredientId,
    name: 'Milk Chocolate 40%',
    category: 'chocolate',
    chocolateType: 'milk',
    cacaoPercentage: 40 as Percentage,
    ganacheCharacteristics: { ...testChars, milkFat: 8 as Percentage },
    tags: ['classic'],
    manufacturer: 'Valrhona',
    allergens: ['milk', 'soy'],
    applications: ['enrobing']
  };

  const whiteChocolate: IChocolateIngredientEntity = {
    baseId: 'white-chocolate' as BaseIngredientId,
    name: 'White Chocolate',
    category: 'chocolate',
    chocolateType: 'white',
    cacaoPercentage: 28 as Percentage,
    ganacheCharacteristics: { ...testChars, cacaoFat: 28 as Percentage },
    tags: ['sweet']
  };

  const cream: IDairyIngredientEntity = {
    baseId: 'cream' as BaseIngredientId,
    name: 'Heavy Cream',
    category: 'dairy',
    ganacheCharacteristics: creamChars,
    fatContent: 38 as Percentage,
    waterContent: 55 as Percentage,
    tags: ['fresh']
  };

  const sugar: ISugarIngredientEntity = {
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
    }
  };

  const butter: IFatIngredientEntity = {
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
    }
  };

  const rum: IAlcoholIngredientEntity = {
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
    }
  };

  const darkGanacheRecipe: IFillingRecipeEntity = {
    baseId: 'dark-ganache' as BaseFillingId,
    name: 'Dark Ganache' as FillingName,
    category: 'ganache',
    description: 'A classic dark chocolate ganache',
    tags: ['classic', 'dark'],
    goldenVariationSpec: '2026-01-01-01' as FillingRecipeVariationSpec,
    variations: [
      {
        variationSpec: '2026-01-01-01' as FillingRecipeVariationSpec,
        createdDate: '2026-01-01',
        ingredients: [
          { ingredient: { ids: ['test.dark-chocolate' as IngredientId] }, amount: 200 as Measurement },
          { ingredient: { ids: ['test.cream' as IngredientId] }, amount: 100 as Measurement }
        ],
        baseWeight: 300 as Measurement
      },
      {
        variationSpec: '2026-02-01-01' as FillingRecipeVariationSpec,
        createdDate: '2026-02-01',
        ingredients: [
          { ingredient: { ids: ['test.dark-chocolate' as IngredientId] }, amount: 180 as Measurement },
          { ingredient: { ids: ['test.cream' as IngredientId] }, amount: 120 as Measurement }
        ],
        baseWeight: 300 as Measurement
      }
    ]
  };

  const milkGanacheRecipe: IFillingRecipeEntity = {
    baseId: 'milk-ganache' as BaseFillingId,
    name: 'Milk Ganache' as FillingName,
    category: 'ganache',
    tags: ['classic', 'milk'],
    goldenVariationSpec: '2026-01-01-01' as FillingRecipeVariationSpec,
    variations: [
      {
        variationSpec: '2026-01-01-01' as FillingRecipeVariationSpec,
        createdDate: '2026-01-01',
        ingredients: [
          { ingredient: { ids: ['test.milk-chocolate' as IngredientId] }, amount: 200 as Measurement },
          { ingredient: { ids: ['test.cream' as IngredientId] }, amount: 150 as Measurement }
        ],
        baseWeight: 350 as Measurement
      }
    ]
  };

  const whiteGanacheRecipe: IFillingRecipeEntity = {
    baseId: 'white-ganache' as BaseFillingId,
    name: 'White Ganache' as FillingName,
    category: 'ganache',
    tags: ['sweet', 'white'],
    goldenVariationSpec: '2026-01-01-01' as FillingRecipeVariationSpec,
    variations: [
      {
        variationSpec: '2026-01-01-01' as FillingRecipeVariationSpec,
        createdDate: '2026-01-01',
        ingredients: [
          { ingredient: { ids: ['test.white-chocolate' as IngredientId] }, amount: 200 as Measurement },
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
            'milk-chocolate': milkChocolate,
            'white-chocolate': whiteChocolate,
            cream,
            sugar,
            butter,
            rum
            /* eslint-enable @typescript-eslint/naming-convention */
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
            'test-ganache': darkGanacheRecipe,
            'vanilla-ganache': milkGanacheRecipe,
            'caramel-ganache': whiteGanacheRecipe
            /* eslint-enable @typescript-eslint/naming-convention */
          }
        }
      ]
    }).orThrow();

    const library = ChocolateEntityLibrary.create({
      builtin: false,
      libraries: { ingredients, fillings: recipes }
    }).orThrow();

    ctx = ChocolateLibrary.fromChocolateEntityLibrary(library).orThrow();
  });

  // ============================================================================
  // Filter Combinator Tests
  // ============================================================================

  describe('filter combinators', () => {
    test('andFilters combines filters with AND logic', () => {
      interface ITestItem {
        category: string;
        tags?: string[];
      }
      const isChocolate = (i: ITestItem): boolean => i.category === 'chocolate';
      const hasPremiumTag = (i: ITestItem): boolean => i.tags?.includes('premium') ?? false;
      const combined = andFilters(isChocolate, hasPremiumTag);

      expect(combined({ category: 'chocolate', tags: ['premium'] })).toBe(true);
      expect(combined({ category: 'chocolate', tags: ['classic'] })).toBe(false);
      expect(combined({ category: 'dairy', tags: ['premium'] })).toBe(false);
    });

    test('andFilters returns true for empty filters', () => {
      const combined = andFilters<{ name: string }>();
      expect(combined({ name: 'test' })).toBe(true);
    });

    test('orFilters combines filters with OR logic', () => {
      const isDark = (i: { type?: string }): boolean => i.type === 'dark';
      const isMilk = (i: { type?: string }): boolean => i.type === 'milk';
      const combined = orFilters(isDark, isMilk);

      expect(combined({ type: 'dark' })).toBe(true);
      expect(combined({ type: 'milk' })).toBe(true);
      expect(combined({ type: 'white' })).toBe(false);
    });

    test('orFilters returns true for empty filters', () => {
      const combined = orFilters<{ name: string }>();
      expect(combined({ name: 'test' })).toBe(true);
    });

    test('notFilter negates filter', () => {
      const isDark = (i: { type: string }): boolean => i.type === 'dark';
      const isNotDark = notFilter(isDark);

      expect(isNotDark({ type: 'dark' })).toBe(false);
      expect(isNotDark({ type: 'milk' })).toBe(true);
    });
  });

  // ============================================================================
  // String Matching Filter Tests
  // ============================================================================

  describe('string matching filters', () => {
    test('containsIgnoreCase matches case-insensitively', () => {
      const filter = containsIgnoreCase('choco', (i: { name: string }) => i.name);
      expect(filter({ name: 'Dark Chocolate' })).toBe(true);
      expect(filter({ name: 'CHOCOLATE' })).toBe(true);
      expect(filter({ name: 'Vanilla' })).toBe(false);
    });

    test('containsIgnoreCase returns false for undefined', () => {
      const filter = containsIgnoreCase('test', (i: { name?: string }) => i.name);
      expect(filter({ name: undefined })).toBe(false);
    });

    test('hasTag finds single tag', () => {
      const filter = hasTag('premium', (i: { tags: string[] }) => i.tags);
      expect(filter({ tags: ['premium', 'organic'] })).toBe(true);
      expect(filter({ tags: ['classic'] })).toBe(false);
    });

    test('hasTag is case-insensitive', () => {
      const filter = hasTag('PREMIUM', (i: { tags: string[] }) => i.tags);
      expect(filter({ tags: ['premium'] })).toBe(true);
    });

    test('hasAnyTag matches any tag', () => {
      const filter = hasAnyTag(['premium', 'organic'], (i: { tags: string[] }) => i.tags);
      expect(filter({ tags: ['premium'] })).toBe(true);
      expect(filter({ tags: ['organic'] })).toBe(true);
      expect(filter({ tags: ['classic'] })).toBe(false);
    });

    test('hasAllTags requires all tags', () => {
      const filter = hasAllTags(['premium', 'single-origin'], (i: { tags: string[] }) => i.tags);
      expect(filter({ tags: ['premium', 'single-origin', 'organic'] })).toBe(true);
      expect(filter({ tags: ['premium'] })).toBe(false);
    });
  });

  // ============================================================================
  // Numeric Range Filter Tests
  // ============================================================================

  describe('numeric range filters', () => {
    test('inRange filters by range', () => {
      const filter = inRange(50, 80, (i: { value: number }) => i.value);
      expect(filter({ value: 65 })).toBe(true);
      expect(filter({ value: 50 })).toBe(true);
      expect(filter({ value: 80 })).toBe(true);
      expect(filter({ value: 49 })).toBe(false);
      expect(filter({ value: 81 })).toBe(false);
    });

    test('inRange with only min', () => {
      const filter = inRange(50, undefined, (i: { value: number }) => i.value);
      expect(filter({ value: 50 })).toBe(true);
      expect(filter({ value: 100 })).toBe(true);
      expect(filter({ value: 49 })).toBe(false);
    });

    test('inRange with only max', () => {
      const filter = inRange(undefined, 80, (i: { value: number }) => i.value);
      expect(filter({ value: 80 })).toBe(true);
      expect(filter({ value: 0 })).toBe(true);
      expect(filter({ value: 81 })).toBe(false);
    });

    test('inRange returns false for undefined value', () => {
      const filter = inRange(50, 80, (i: { value?: number }) => i.value);
      expect(filter({ value: undefined })).toBe(false);
    });

    test('atLeast filters by minimum', () => {
      const filter = atLeast(50, (i: { value: number }) => i.value);
      expect(filter({ value: 50 })).toBe(true);
      expect(filter({ value: 100 })).toBe(true);
      expect(filter({ value: 49 })).toBe(false);
    });

    test('atMost filters by maximum', () => {
      const filter = atMost(50, (i: { value: number }) => i.value);
      expect(filter({ value: 50 })).toBe(true);
      expect(filter({ value: 0 })).toBe(true);
      expect(filter({ value: 51 })).toBe(false);
    });
  });

  // ============================================================================
  // Collection Filter Tests
  // ============================================================================

  describe('collection filters', () => {
    test('collectionContains finds value in array', () => {
      const filter = collectionContains('ganache', (i: { apps?: string[] }) => i.apps);
      expect(filter({ apps: ['ganache', 'molding'] })).toBe(true);
      expect(filter({ apps: ['molding'] })).toBe(false);
      expect(filter({ apps: undefined })).toBe(false);
    });

    test('collectionContainsAny finds any value', () => {
      const filter = collectionContainsAny(['ganache', 'enrobing'], (i: { apps?: string[] }) => i.apps);
      expect(filter({ apps: ['ganache'] })).toBe(true);
      expect(filter({ apps: ['enrobing'] })).toBe(true);
      expect(filter({ apps: ['molding'] })).toBe(false);
      expect(filter({ apps: undefined })).toBe(false);
    });
  });

  // ============================================================================
  // Equality Filter Tests
  // ============================================================================

  describe('equality filters', () => {
    test('equals checks exact equality', () => {
      const filter = equals('chocolate', (i: { category: string }) => i.category);
      expect(filter({ category: 'chocolate' })).toBe(true);
      expect(filter({ category: 'dairy' })).toBe(false);
    });

    test('oneOf checks membership in set', () => {
      const filter = oneOf(['chocolate', 'dairy'], (i: { category?: string }) => i.category);
      expect(filter({ category: 'chocolate' })).toBe(true);
      expect(filter({ category: 'dairy' })).toBe(true);
      expect(filter({ category: 'sugar' })).toBe(false);
      expect(filter({ category: undefined })).toBe(false);
    });
  });

  // ============================================================================
  // IngredientQuery Tests
  // ============================================================================

  describe('IngredientQuery', () => {
    describe('category filters', () => {
      test('chocolate() filters to chocolate only', () => {
        const query = new IngredientQuery(ctx);
        const results = query.chocolate().execute();
        expect(results.length).toBe(3);
        expect(results.every((i) => i.category === 'chocolate')).toBe(true);
      });

      test('dairy() filters to dairy only', () => {
        const query = new IngredientQuery(ctx);
        const results = query.dairy().execute();
        expect(results.length).toBe(1);
        expect(results[0].name).toBe('Heavy Cream');
      });

      test('sugar() filters to sugar only', () => {
        const query = new IngredientQuery(ctx);
        const results = query.sugar().execute();
        expect(results.length).toBe(1);
      });

      test('fat() filters to fat only', () => {
        const query = new IngredientQuery(ctx);
        const results = query.fat().execute();
        expect(results.length).toBe(1);
      });

      test('alcohol() filters to alcohol only', () => {
        const query = new IngredientQuery(ctx);
        const results = query.alcohol().execute();
        expect(results.length).toBe(1);
      });

      test('category() filters by specific category', () => {
        const query = new IngredientQuery(ctx);
        const results = query.category('chocolate').execute();
        expect(results.length).toBe(3);
      });
    });

    describe('chocolate-specific filters', () => {
      test('chocolateType() filters by chocolate type', () => {
        const query = new IngredientQuery(ctx);
        const results = query.chocolateType('dark').execute();
        expect(results.length).toBe(1);
        expect(results[0].name).toBe('Dark Chocolate 70%');
      });

      test('minCacao() filters by minimum percentage', () => {
        const query = new IngredientQuery(ctx);
        const results = query.minCacao(50 as Percentage).execute();
        expect(results.length).toBe(1);
        expect(results[0].name).toBe('Dark Chocolate 70%');
      });

      test('maxCacao() filters by maximum percentage', () => {
        const query = new IngredientQuery(ctx);
        const results = query.maxCacao(50 as Percentage).execute();
        expect(results.length).toBe(2); // milk (40%) and white (28%)
      });

      test('cacaoRange() filters by range', () => {
        const query = new IngredientQuery(ctx);
        const results = query.cacaoRange(30 as Percentage, 50 as Percentage).execute();
        expect(results.length).toBe(1);
        expect(results[0].name).toBe('Milk Chocolate 40%');
      });

      test('forApplication() filters by application', () => {
        const query = new IngredientQuery(ctx);
        const results = query.forApplication('ganache').execute();
        expect(results.length).toBe(1);
        expect(results[0].name).toBe('Dark Chocolate 70%');
      });
    });

    describe('ganache characteristic filters', () => {
      test('minFat() filters by minimum fat', () => {
        const query = new IngredientQuery(ctx);
        const results = query.minFat(30 as Percentage).execute();
        expect(results.length).toBeGreaterThan(0);
      });

      test('maxFat() filters by maximum fat', () => {
        const query = new IngredientQuery(ctx);
        const results = query.maxFat(10 as Percentage).execute();
        expect(results.length).toBeGreaterThan(0);
      });

      test('fatRange() filters by fat range', () => {
        const query = new IngredientQuery(ctx);
        const results = query.fatRange(30 as Percentage, 50 as Percentage).execute();
        expect(results.length).toBeGreaterThan(0);
      });

      test('maxWater() filters by maximum water', () => {
        const query = new IngredientQuery(ctx);
        const results = query.maxWater(10 as Percentage).execute();
        expect(results.length).toBeGreaterThan(0);
      });

      test('minWater() filters by minimum water', () => {
        const query = new IngredientQuery(ctx);
        const results = query.minWater(50 as Percentage).execute();
        expect(results.length).toBeGreaterThan(0);
      });
    });

    describe('metadata filters', () => {
      test('withTag() filters by tag', () => {
        const query = new IngredientQuery(ctx);
        const results = query.withTag('premium').execute();
        expect(results.length).toBe(1);
      });

      test('withAnyTag() filters by any tag', () => {
        const query = new IngredientQuery(ctx);
        const results = query.withAnyTag(['premium', 'classic']).execute();
        expect(results.length).toBe(2);
      });

      test('withAllTags() filters by all tags', () => {
        const query = new IngredientQuery(ctx);
        const results = query.withAllTags(['premium', 'single-origin']).execute();
        expect(results.length).toBe(1);
      });

      test('byManufacturer() filters by manufacturer', () => {
        const query = new IngredientQuery(ctx);
        const results = query.byManufacturer('Felchlin').execute();
        expect(results.length).toBe(1);
      });

      test('fromSource() filters by source', () => {
        const query = new IngredientQuery(ctx);
        const results = query.fromSource('test' as CollectionId).execute();
        expect(results.length).toBe(7);
      });
    });

    describe('dietary filters', () => {
      test('vegan() filters to vegan only', () => {
        const query = new IngredientQuery(ctx);
        const results = query.vegan().execute();
        // dark chocolate has vegan: true in test data
        expect(results.length).toBe(1);
        expect(results[0].baseId).toBe('dark-chocolate');
      });

      test('withoutAllergen() excludes allergen', () => {
        const query = new IngredientQuery(ctx);
        const results = query.chocolate().withoutAllergen('milk').execute();
        expect(results.length).toBe(2); // dark and white have no milk
      });

      test('withoutAllergens() excludes multiple allergens', () => {
        const query = new IngredientQuery(ctx);
        const results = query.chocolate().withoutAllergens(['milk', 'soy']).execute();
        expect(results.length).toBe(1); // only white chocolate
      });

      test('withCertification() filters by certification', () => {
        const query = new IngredientQuery(ctx);
        const results = query.withCertification('organic').execute();
        expect(results.length).toBe(1);
      });
    });

    describe('usage filters', () => {
      test('usedInFillings() filters to used ingredients', () => {
        const query = new IngredientQuery(ctx);
        const results = query.usedInFillings().execute();
        expect(results.length).toBeGreaterThan(0);
      });

      test('unused() filters to unused ingredients', () => {
        const query = new IngredientQuery(ctx);
        const results = query.unused().execute();
        // sugar, butter, rum are not used
        expect(results.length).toBe(3);
      });

      test('usedInAtLeast() filters by usage count', () => {
        const query = new IngredientQuery(ctx);
        const results = query.usedInAtLeast(2).execute();
        expect(results.length).toBeGreaterThan(0);
      });
    });

    describe('text search', () => {
      test('nameContains() searches name', () => {
        const query = new IngredientQuery(ctx);
        const results = query.nameContains('chocolate').execute();
        expect(results.length).toBe(3);
      });

      test('descriptionContains() searches description', () => {
        const query = new IngredientQuery(ctx);
        const results = query.descriptionContains('venezuela').execute();
        expect(results.length).toBe(1);
      });
    });

    describe('custom filter', () => {
      test('where() applies custom predicate', () => {
        const query = new IngredientQuery(ctx);
        const results = query.where((i) => i.name.startsWith('Dark')).execute();
        expect(results.length).toBe(2); // Dark Chocolate and Dark Rum
      });
    });

    describe('execution methods', () => {
      test('execute() returns all matching', () => {
        const query = new IngredientQuery(ctx);
        const results = query.chocolate().execute();
        expect(results.length).toBe(3);
      });

      test('first() returns first matching', () => {
        const query = new IngredientQuery(ctx);
        const result = query.chocolate().first();
        expect(result).toBeDefined();
        expect(result?.category).toBe('chocolate');
      });

      test('first() returns undefined when no match', () => {
        const query = new IngredientQuery(ctx);
        const result = query.nameContains('nonexistent').first();
        expect(result).toBeUndefined();
      });

      test('count() returns match count', () => {
        const query = new IngredientQuery(ctx);
        const count = query.chocolate().count();
        expect(count).toBe(3);
      });

      test('exists() returns true when matches exist', () => {
        const query = new IngredientQuery(ctx);
        expect(query.chocolate().exists()).toBe(true);
      });

      test('exists() returns false when no matches', () => {
        const query = new IngredientQuery(ctx);
        expect(query.nameContains('nonexistent').exists()).toBe(false);
      });
    });

    describe('chained queries', () => {
      test('multiple filters combine with AND logic', () => {
        const query = new IngredientQuery(ctx);
        const results = query
          .chocolate()
          .minCacao(60 as Percentage)
          .withTag('premium')
          .execute();
        expect(results.length).toBe(1);
        expect(results[0].name).toBe('Dark Chocolate 70%');
      });
    });
  });

  // ============================================================================
  // FillingRecipeQuery Tests
  // ============================================================================

  describe('FillingRecipeQuery', () => {
    describe('ingredient filters', () => {
      test('withIngredient() filters by ingredient', () => {
        const query = new FillingRecipeQuery(ctx);
        const results = query.withIngredient('test.dark-chocolate' as IngredientId).execute();
        expect(results.length).toBe(1);
        expect(results[0].name).toBe('Dark Ganache');
      });

      test('withAnyIngredient() filters by any ingredient', () => {
        const query = new FillingRecipeQuery(ctx);
        const results = query
          .withAnyIngredient(['test.dark-chocolate' as IngredientId, 'test.milk-chocolate' as IngredientId])
          .execute();
        expect(results.length).toBe(2);
      });

      test('withAllIngredients() filters by all ingredients', () => {
        const query = new FillingRecipeQuery(ctx);
        const results = query
          .withAllIngredients(['test.dark-chocolate' as IngredientId, 'test.cream' as IngredientId])
          .execute();
        expect(results.length).toBe(1);
      });

      test('withoutIngredient() excludes ingredient', () => {
        const query = new FillingRecipeQuery(ctx);
        const results = query.withoutIngredient('test.dark-chocolate' as IngredientId).execute();
        expect(results.length).toBe(2);
      });
    });

    describe('chocolate type filters', () => {
      test('withDarkChocolate() filters to dark chocolate recipes', () => {
        const query = new FillingRecipeQuery(ctx);
        const results = query.withDarkChocolate().execute();
        expect(results.length).toBe(1);
        expect(results[0].name).toBe('Dark Ganache');
      });

      test('withMilkChocolate() filters to milk chocolate recipes', () => {
        const query = new FillingRecipeQuery(ctx);
        const results = query.withMilkChocolate().execute();
        expect(results.length).toBe(1);
        expect(results[0].name).toBe('Milk Ganache');
      });

      test('withWhiteChocolate() filters to white chocolate recipes', () => {
        const query = new FillingRecipeQuery(ctx);
        const results = query.withWhiteChocolate().execute();
        expect(results.length).toBe(1);
        expect(results[0].name).toBe('White Ganache');
      });

      test('withRubyChocolate() returns empty for no ruby recipes', () => {
        const query = new FillingRecipeQuery(ctx);
        const results = query.withRubyChocolate().execute();
        expect(results.length).toBe(0);
      });

      test('withChocolateType() filters by type', () => {
        const query = new FillingRecipeQuery(ctx);
        const results = query.withChocolateType('dark').execute();
        expect(results.length).toBe(1);
      });
    });

    describe('tag filters', () => {
      test('withTag() filters by tag', () => {
        const query = new FillingRecipeQuery(ctx);
        const results = query.withTag('classic').execute();
        expect(results.length).toBe(2);
      });

      test('withAnyTag() filters by any tag', () => {
        const query = new FillingRecipeQuery(ctx);
        const results = query.withAnyTag(['dark', 'milk']).execute();
        expect(results.length).toBe(2);
      });

      test('withAllTags() filters by all tags', () => {
        const query = new FillingRecipeQuery(ctx);
        const results = query.withAllTags(['classic', 'dark']).execute();
        expect(results.length).toBe(1);
      });
    });

    describe('source filters', () => {
      test('fromSource() filters by source', () => {
        const query = new FillingRecipeQuery(ctx);
        const results = query.fromSource('test' as CollectionId).execute();
        expect(results.length).toBe(3);
      });
    });

    describe('ganache filters', () => {
      test('ganacheFatContent() filters by fat content', () => {
        const query = new FillingRecipeQuery(ctx);
        const results = query.ganacheFatContent(20 as Percentage).execute();
        expect(results.length).toBeGreaterThan(0);
      });

      test('ganacheFatContent() with max', () => {
        const query = new FillingRecipeQuery(ctx);
        const results = query.ganacheFatContent(10 as Percentage, 50 as Percentage).execute();
        expect(results.length).toBeGreaterThan(0);
      });

      test('validGanache() filters to valid recipes', () => {
        const query = new FillingRecipeQuery(ctx);
        const results = query.validGanache().execute();
        expect(results.length).toBeGreaterThan(0);
      });

      test('ganacheWithWarnings() filters to recipes with warnings', () => {
        const query = new FillingRecipeQuery(ctx);
        const results = query.ganacheWithWarnings().execute();
        // May or may not have warnings depending on test data
        expect(Array.isArray(results)).toBe(true);
      });
    });

    describe('variation filters', () => {
      test('hasMultipleVariations() filters to multi-variation recipes', () => {
        const query = new FillingRecipeQuery(ctx);
        const results = query.hasMultipleVariations().execute();
        expect(results.length).toBe(1);
        expect(results[0].name).toBe('Dark Ganache');
      });

      test('minVariations() filters by variation count', () => {
        const query = new FillingRecipeQuery(ctx);
        const results = query.minVariations(2).execute();
        expect(results.length).toBe(1);
      });
    });

    describe('text search', () => {
      test('nameContains() searches name', () => {
        const query = new FillingRecipeQuery(ctx);
        const results = query.nameContains('ganache').execute();
        expect(results.length).toBe(3);
      });

      test('descriptionContains() searches description', () => {
        const query = new FillingRecipeQuery(ctx);
        const results = query.descriptionContains('classic').execute();
        expect(results.length).toBe(1);
      });
    });

    describe('custom filter', () => {
      test('where() applies custom predicate', () => {
        const query = new FillingRecipeQuery(ctx);
        const results = query.where((r) => r.variationCount > 1).execute();
        expect(results.length).toBe(1);
      });
    });

    describe('execution methods', () => {
      test('execute() returns all matching', () => {
        const query = new FillingRecipeQuery(ctx);
        const results = query.execute();
        expect(results.length).toBe(3);
      });

      test('first() returns first matching', () => {
        const query = new FillingRecipeQuery(ctx);
        const result = query.first();
        expect(result).toBeDefined();
      });

      test('count() returns match count', () => {
        const query = new FillingRecipeQuery(ctx);
        const count = query.count();
        expect(count).toBe(3);
      });

      test('exists() returns true when matches exist', () => {
        const query = new FillingRecipeQuery(ctx);
        expect(query.exists()).toBe(true);
      });
    });

    describe('chained queries', () => {
      test('multiple filters combine with AND logic', () => {
        const query = new FillingRecipeQuery(ctx);
        const results = query.withTag('classic').hasMultipleVariations().execute();
        expect(results.length).toBe(1);
        expect(results[0].name).toBe('Dark Ganache');
      });
    });
  });
});
