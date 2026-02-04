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
import { Failure, Result, Success } from '@fgv/ts-utils';

import {
  BaseIngredientId,
  BaseFillingId,
  Measurement,
  IngredientId,
  Percentage,
  FillingId,
  FillingName,
  FillingVersionSpec,
  CollectionId
} from '../../../../packlets/common';

import {
  IGanacheCharacteristics,
  IChocolateIngredientEntity,
  Ingredients,
  IngredientsLibrary
} from '../../../../packlets/entities';
import { IFillingRecipeEntity, FillingsLibrary } from '../../../../packlets/entities';
import {
  ChocolateLibrary,
  Indexers,
  IRuntimeFillingRecipe,
  IRuntimeIngredient
} from '../../../../packlets/library-runtime';

// Destructure the Indexers namespace for convenient access
const {
  FillingRecipesByIngredientIndexer,
  FillingRecipesByTagIndexer,
  IngredientsByTagIndexer,
  FillingRecipesByChocolateTypeIndexer,
  FillingRecipesByCategoryIndexer,
  FillingRecipeIndexerOrchestrator,
  IngredientIndexerOrchestrator,
  fillingRecipesByIngredientConfig,
  fillingRecipesByTagConfig,
  ingredientsByTagConfig,
  fillingRecipesByChocolateTypeConfig,
  fillingRecipesByCategoryConfig
} = Indexers;

// Type aliases for types from Indexers namespace
type FillingRecipesByIngredientIndexerType = InstanceType<typeof FillingRecipesByIngredientIndexer>;
type FillingRecipesByTagIndexerType = InstanceType<typeof FillingRecipesByTagIndexer>;
type IngredientsByTagIndexerType = InstanceType<typeof IngredientsByTagIndexer>;
type FillingRecipesByChocolateTypeIndexerType = InstanceType<typeof FillingRecipesByChocolateTypeIndexer>;
type FillingRecipesByCategoryIndexerType = InstanceType<typeof FillingRecipesByCategoryIndexer>;

describe('Indexers', () => {
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

  const darkChocolate: IChocolateIngredientEntity = {
    baseId: 'dark-chocolate' as BaseIngredientId,
    name: 'Dark Chocolate',
    category: 'chocolate',
    chocolateType: 'dark',
    cacaoPercentage: 70 as Percentage,
    ganacheCharacteristics: testChars,
    tags: ['premium', 'single-origin']
  };

  const milkChocolate: IChocolateIngredientEntity = {
    baseId: 'milk-chocolate' as BaseIngredientId,
    name: 'Milk Chocolate',
    category: 'chocolate',
    chocolateType: 'milk',
    cacaoPercentage: 40 as Percentage,
    ganacheCharacteristics: { ...testChars, milkFat: 8 as Percentage },
    tags: ['classic']
  };

  const altChocolate: IChocolateIngredientEntity = {
    baseId: 'alt-chocolate' as BaseIngredientId,
    name: 'Alternative Chocolate',
    category: 'chocolate',
    chocolateType: 'dark',
    cacaoPercentage: 65 as Percentage,
    ganacheCharacteristics: testChars,
    tags: ['premium']
  };

  const cream: Ingredients.IIngredientEntity = {
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
    tags: ['fresh']
  };

  const darkGanacheRecipe: IFillingRecipeEntity = {
    baseId: 'dark-ganache' as BaseFillingId,
    name: 'Dark Ganache' as FillingName,
    category: 'ganache',
    tags: ['classic', 'dark'],
    goldenVersionSpec: '2026-01-01-01' as FillingVersionSpec,
    versions: [
      {
        versionSpec: '2026-01-01-01' as FillingVersionSpec,
        createdDate: '2026-01-01',
        ingredients: [
          {
            ingredient: {
              ids: ['test.dark-chocolate' as IngredientId, 'test.alt-chocolate' as IngredientId],
              preferredId: 'test.dark-chocolate' as IngredientId
            },
            amount: 200 as Measurement
          },
          { ingredient: { ids: ['test.cream' as IngredientId] }, amount: 100 as Measurement }
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
    goldenVersionSpec: '2026-01-01-01' as FillingVersionSpec,
    versions: [
      {
        versionSpec: '2026-01-01-01' as FillingVersionSpec,
        createdDate: '2026-01-01',
        ingredients: [
          { ingredient: { ids: ['test.milk-chocolate' as IngredientId] }, amount: 200 as Measurement },
          { ingredient: { ids: ['test.cream' as IngredientId] }, amount: 150 as Measurement }
        ],
        baseWeight: 350 as Measurement
      }
    ]
  };

  const saltedCaramelRecipe: IFillingRecipeEntity = {
    baseId: 'salted-caramel' as BaseFillingId,
    name: 'Salted Caramel' as FillingName,
    category: 'caramel',
    tags: ['classic', 'salted'],
    goldenVersionSpec: '2026-01-01-01' as FillingVersionSpec,
    versions: [
      {
        versionSpec: '2026-01-01-01' as FillingVersionSpec,
        createdDate: '2026-01-01',
        ingredients: [{ ingredient: { ids: ['test.cream' as IngredientId] }, amount: 200 as Measurement }],
        baseWeight: 200 as Measurement
      }
    ]
  };

  let library: ChocolateLibrary;

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
            'alt-chocolate': altChocolate,
            /* eslint-enable @typescript-eslint/naming-convention */
            cream
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
            'milk-ganache': milkGanacheRecipe,
            'salted-caramel': saltedCaramelRecipe
            /* eslint-enable @typescript-eslint/naming-convention */
          }
        }
      ]
    }).orThrow();

    library = ChocolateLibrary.create({
      builtin: false,
      libraries: { ingredients, fillings: recipes }
    }).orThrow();
  });

  // ============================================================================
  // FillingRecipesByIngredientIndexer Tests
  // ============================================================================

  describe('FillingRecipesByIngredientIndexer', () => {
    let indexer: FillingRecipesByIngredientIndexerType;

    beforeEach(() => {
      indexer = new FillingRecipesByIngredientIndexer(library);
    });

    test('finds recipes by primary ingredient', () => {
      const config = fillingRecipesByIngredientConfig('test.dark-chocolate' as IngredientId, 'primary');
      const result = indexer.find(config);

      expect(result).toSucceedAndSatisfy((ids) => {
        expect(ids).toHaveLength(1);
        expect(ids).toContain('test.dark-ganache');
      });
    });

    test('finds recipes by alternate ingredient', () => {
      const config = fillingRecipesByIngredientConfig('test.alt-chocolate' as IngredientId, 'alternate');
      const result = indexer.find(config);

      expect(result).toSucceedAndSatisfy((ids) => {
        expect(ids).toHaveLength(1);
        expect(ids).toContain('test.dark-ganache');
      });
    });

    test('finds recipes by any usage', () => {
      const config = fillingRecipesByIngredientConfig('test.cream' as IngredientId);
      const result = indexer.find(config);

      expect(result).toSucceedAndSatisfy((ids) => {
        // All three recipes use cream
        expect(ids).toHaveLength(3);
        expect(ids).toContain('test.dark-ganache');
        expect(ids).toContain('test.milk-ganache');
        expect(ids).toContain('test.salted-caramel');
      });
    });

    test('returns empty array for unknown ingredient', () => {
      const config = fillingRecipesByIngredientConfig('test.unknown' as IngredientId);
      const result = indexer.find(config);

      expect(result).toSucceedWith([]);
    });

    test('warmUp pre-builds the index', () => {
      indexer.warmUp();
      // Subsequent query should work without rebuilding
      const config = fillingRecipesByIngredientConfig('test.cream' as IngredientId);
      const result = indexer.find(config);
      expect(result).toSucceedAndSatisfy((ids) => {
        // All three recipes use cream
        expect(ids).toHaveLength(3);
      });
    });

    test('invalidate clears the index', () => {
      // First query to build index
      indexer.find(fillingRecipesByIngredientConfig('test.cream' as IngredientId));

      // Invalidate
      indexer.invalidate();

      // Index should be rebuilt on next query
      const result = indexer.find(fillingRecipesByIngredientConfig('test.cream' as IngredientId));
      expect(result).toSucceedAndSatisfy((ids) => {
        // All three recipes use cream
        expect(ids).toHaveLength(3);
      });
    });
  });

  // ============================================================================
  // FillingRecipesByTagIndexer Tests
  // ============================================================================

  describe('FillingRecipesByTagIndexer', () => {
    let indexer: FillingRecipesByTagIndexerType;

    beforeEach(() => {
      indexer = new FillingRecipesByTagIndexer(library);
    });

    test('finds recipes by tag (case-insensitive)', () => {
      const config = fillingRecipesByTagConfig('CLASSIC');
      const result = indexer.find(config);

      expect(result).toSucceedAndSatisfy((ids) => {
        // All three recipes have the 'classic' tag
        expect(ids).toHaveLength(3);
        expect(ids).toContain('test.dark-ganache');
        expect(ids).toContain('test.milk-ganache');
        expect(ids).toContain('test.salted-caramel');
      });
    });

    test('finds recipes by specific tag', () => {
      const config = fillingRecipesByTagConfig('dark');
      const result = indexer.find(config);

      expect(result).toSucceedAndSatisfy((ids) => {
        expect(ids).toHaveLength(1);
        expect(ids).toContain('test.dark-ganache');
      });
    });

    test('returns empty array for unknown tag', () => {
      const config = fillingRecipesByTagConfig('unknown-tag');
      const result = indexer.find(config);

      expect(result).toSucceedWith([]);
    });

    test('getAllTags returns all unique tags', () => {
      const tags = indexer.getAllTags();
      expect(tags).toContain('classic');
      expect(tags).toContain('dark');
      expect(tags).toContain('milk');
      expect(tags).toContain('salted');
    });
  });

  // ============================================================================
  // IngredientsByTagIndexer Tests
  // ============================================================================

  describe('IngredientsByTagIndexer', () => {
    let indexer: IngredientsByTagIndexerType;

    beforeEach(() => {
      indexer = new IngredientsByTagIndexer(library);
    });

    test('finds ingredients by tag', () => {
      const config = ingredientsByTagConfig('premium');
      const result = indexer.find(config);

      expect(result).toSucceedAndSatisfy((ids) => {
        expect(ids).toHaveLength(2);
        expect(ids).toContain('test.dark-chocolate');
        expect(ids).toContain('test.alt-chocolate');
      });
    });

    test('returns empty array for unknown tag', () => {
      const config = ingredientsByTagConfig('unknown-tag');
      const result = indexer.find(config);

      expect(result).toSucceedWith([]);
    });

    test('getAllTags returns all unique tags', () => {
      const tags = indexer.getAllTags();
      expect(tags).toContain('premium');
      expect(tags).toContain('single-origin');
      expect(tags).toContain('classic');
      expect(tags).toContain('fresh');
    });

    test('invalidate clears the index', () => {
      // First query to build index
      indexer.find(ingredientsByTagConfig('premium'));

      // Invalidate
      indexer.invalidate();

      // Index should be rebuilt on next query
      const result = indexer.find(ingredientsByTagConfig('premium'));
      expect(result).toSucceedAndSatisfy((ids) => {
        expect(ids).toHaveLength(2);
      });
    });
  });

  // ============================================================================
  // FillingRecipesByChocolateTypeIndexer Tests
  // ============================================================================

  describe('FillingRecipesByChocolateTypeIndexer', () => {
    let indexer: FillingRecipesByChocolateTypeIndexerType;

    beforeEach(() => {
      indexer = new FillingRecipesByChocolateTypeIndexer(library);
    });

    test('finds recipes by chocolate type', () => {
      const config = fillingRecipesByChocolateTypeConfig('dark');
      const result = indexer.find(config);

      expect(result).toSucceedAndSatisfy((ids) => {
        expect(ids).toHaveLength(1);
        expect(ids).toContain('test.dark-ganache');
      });
    });

    test('finds recipes by milk chocolate type', () => {
      const config = fillingRecipesByChocolateTypeConfig('milk');
      const result = indexer.find(config);

      expect(result).toSucceedAndSatisfy((ids) => {
        expect(ids).toHaveLength(1);
        expect(ids).toContain('test.milk-ganache');
      });
    });

    test('returns empty array for unused chocolate type', () => {
      const config = fillingRecipesByChocolateTypeConfig('white');
      const result = indexer.find(config);

      expect(result).toSucceedWith([]);
    });
  });

  // ============================================================================
  // FillingRecipesByCategoryIndexer Tests
  // ============================================================================

  describe('FillingRecipesByCategoryIndexer', () => {
    let indexer: FillingRecipesByCategoryIndexerType;

    beforeEach(() => {
      indexer = new FillingRecipesByCategoryIndexer(library);
    });

    test('finds recipes by ganache category', () => {
      const config = fillingRecipesByCategoryConfig('ganache');
      const result = indexer.find(config);

      expect(result).toSucceedAndSatisfy((ids) => {
        expect(ids).toHaveLength(2);
        expect(ids).toContain('test.dark-ganache');
        expect(ids).toContain('test.milk-ganache');
      });
    });

    test('finds recipes by caramel category', () => {
      const config = fillingRecipesByCategoryConfig('caramel');
      const result = indexer.find(config);

      expect(result).toSucceedAndSatisfy((ids) => {
        expect(ids).toHaveLength(1);
        expect(ids).toContain('test.salted-caramel');
      });
    });

    test('getAllCategories returns all categories with recipes', () => {
      const categories = indexer.getAllCategories();
      expect(categories).toContain('ganache');
      expect(categories).toContain('caramel');
      expect(categories).toHaveLength(2);
    });

    test('warmUp pre-builds the index', () => {
      indexer.warmUp();
      // Subsequent query should work without rebuilding
      const config = fillingRecipesByCategoryConfig('ganache');
      const result = indexer.find(config);
      expect(result).toSucceedAndSatisfy((ids) => {
        expect(ids).toHaveLength(2);
      });
    });

    test('invalidate clears the index', () => {
      // First query to build index
      indexer.find(fillingRecipesByCategoryConfig('ganache'));

      // Invalidate
      indexer.invalidate();

      // Index should be rebuilt on next query
      const result = indexer.find(fillingRecipesByCategoryConfig('ganache'));
      expect(result).toSucceedAndSatisfy((ids) => {
        expect(ids).toHaveLength(2);
      });
    });
  });

  // ============================================================================
  // FillingRecipeIndexerOrchestrator Tests
  // ============================================================================

  describe('FillingRecipeIndexerOrchestrator', () => {
    // Mock recipe resolver that just returns ID as "resolved"
    const mockRecipeResolver = (id: FillingId): Result<IRuntimeFillingRecipe> => {
      // Create a minimal mock recipe - in real usage this would come from RuntimeContext
      return Success.with({
        id,
        name: `Recipe ${id}` as FillingName
      } as unknown as IRuntimeFillingRecipe);
    };

    let orchestrator: InstanceType<typeof FillingRecipeIndexerOrchestrator>;

    beforeEach(() => {
      orchestrator = new FillingRecipeIndexerOrchestrator(library, mockRecipeResolver);
    });

    test('finds with single indexer', () => {
      const result = orchestrator.find({
        byTag: { tag: 'classic' }
      });

      expect(result).toSucceedAndSatisfy((recipes) => {
        // All three recipes have the 'classic' tag
        expect(recipes).toHaveLength(3);
      });
    });

    test('finds recipes by category', () => {
      const result = orchestrator.find({
        byCategory: { category: 'ganache' }
      });

      expect(result).toSucceedAndSatisfy((recipes) => {
        expect(recipes).toHaveLength(2);
        const ids = recipes.map((r) => r.id);
        expect(ids).toContain('test.dark-ganache');
        expect(ids).toContain('test.milk-ganache');
      });
    });

    test('finds recipes by category and tag intersection', () => {
      const result = orchestrator.find({
        byCategory: { category: 'ganache' },
        byTag: { tag: 'dark' }
      });

      expect(result).toSucceedAndSatisfy((recipes) => {
        // Only dark-ganache has both ganache category AND dark tag
        expect(recipes).toHaveLength(1);
        expect(recipes[0].id).toBe('test.dark-ganache');
      });
    });

    test('finds with intersection (AND) semantics', () => {
      const result = orchestrator.find({
        byTag: { tag: 'classic' },
        byChocolateType: { chocolateType: 'dark' }
      });

      expect(result).toSucceedAndSatisfy((recipes) => {
        // Only dark-ganache has both classic tag AND dark chocolate
        expect(recipes).toHaveLength(1);
        expect(recipes[0].id).toBe('test.dark-ganache');
      });
    });

    test('finds with union (OR) semantics', () => {
      const result = orchestrator.find(
        {
          byChocolateType: { chocolateType: 'dark' },
          byTag: { tag: 'milk' }
        },
        { aggregation: 'union' }
      );

      expect(result).toSucceedAndSatisfy((recipes) => {
        // dark-ganache (dark chocolate) + milk-ganache (milk tag)
        expect(recipes).toHaveLength(2);
      });
    });

    test('returns empty array for empty spec', () => {
      const result = orchestrator.find({});
      expect(result).toSucceedWith([]);
    });

    test('warmUp warms all indexers', () => {
      orchestrator.warmUp();

      // Queries should work without indexers rebuilding
      const result = orchestrator.find({
        byTag: { tag: 'classic' }
      });
      expect(result).toSucceed();
    });

    test('invalidate invalidates all indexers', () => {
      // First query to build indexes
      orchestrator.find({
        byTag: { tag: 'classic' }
      });

      // Invalidate
      orchestrator.invalidate();

      // Should still work after invalidation (indexes rebuilt)
      const result = orchestrator.find({
        byTag: { tag: 'classic' }
      });
      expect(result).toSucceed();
    });

    test('convertConfig converts JSON to typed spec', () => {
      const json = {
        byTag: { tag: 'classic' }
      };

      const result = orchestrator.convertConfig(json);
      expect(result).toSucceedAndSatisfy((spec) => {
        expect(spec.byTag).toEqual({ tag: 'classic' });
      });
    });
  });

  // ============================================================================
  // IngredientIndexerOrchestrator Tests
  // ============================================================================

  describe('IngredientIndexerOrchestrator', () => {
    const mockIngredientResolver = (id: IngredientId): Result<IRuntimeIngredient> => {
      return Success.with({
        id,
        name: `Ingredient ${id}`
      } as unknown as IRuntimeIngredient);
    };

    test('finds ingredients with single indexer', () => {
      const orchestrator = new IngredientIndexerOrchestrator(library, mockIngredientResolver);

      const result = orchestrator.find({
        byTag: { tag: 'premium' }
      });

      expect(result).toSucceedAndSatisfy((ingredients) => {
        expect(ingredients).toHaveLength(2);
      });
    });

    test('convertConfig converts JSON to typed spec', () => {
      const orchestrator = new IngredientIndexerOrchestrator(library, mockIngredientResolver);

      const json = {
        byTag: { tag: 'premium' }
      };

      const result = orchestrator.convertConfig(json);
      expect(result).toSucceedAndSatisfy((spec) => {
        expect(spec.byTag).toEqual({ tag: 'premium' });
      });
    });

    test('returns empty array for empty spec', () => {
      const orchestrator = new IngredientIndexerOrchestrator(library, mockIngredientResolver);
      const result = orchestrator.find({});
      expect(result).toSucceedWith([]);
    });

    test('warmUp and invalidate work correctly', () => {
      const orchestrator = new IngredientIndexerOrchestrator(library, mockIngredientResolver);

      // Warm up should not throw
      orchestrator.warmUp();

      // Query should work
      const result1 = orchestrator.find({ byTag: { tag: 'premium' } });
      expect(result1).toSucceed();

      // Invalidate should not throw
      orchestrator.invalidate();

      // Query should still work after invalidation
      const result2 = orchestrator.find({ byTag: { tag: 'premium' } });
      expect(result2).toSucceed();
    });

    test('finds ingredients with union aggregation', () => {
      const orchestrator = new IngredientIndexerOrchestrator(library, mockIngredientResolver);

      // Use union aggregation to cover that code path
      const result = orchestrator.find({ byTag: { tag: 'premium' } }, { aggregation: 'union' });

      expect(result).toSucceedAndSatisfy((ingredients) => {
        expect(ingredients).toHaveLength(2);
      });
    });
  });

  // ============================================================================
  // BaseIndexerOrchestrator Coverage Tests
  // ============================================================================

  describe('BaseIndexerOrchestrator (via orchestrators)', () => {
    describe('intersection logic', () => {
      test('intersection removes items not in all sets', () => {
        // Create a resolver that works for all IDs
        const mockRecipeResolver = (id: FillingId): Result<IRuntimeFillingRecipe> => {
          return Success.with({
            id,
            name: `Recipe ${id}` as FillingName
          } as unknown as IRuntimeFillingRecipe);
        };

        const orchestrator = new FillingRecipeIndexerOrchestrator(library, mockRecipeResolver);

        // Find recipes that have BOTH 'dark' tag AND milk chocolate type
        // dark-ganache has 'dark' tag but dark chocolate type
        // milk-ganache has 'milk' tag and milk chocolate type
        // This should return empty since no recipe has both dark tag AND milk chocolate type
        const result = orchestrator.find({
          byTag: { tag: 'dark' },
          byChocolateType: { chocolateType: 'milk' }
        });

        expect(result).toSucceedWith([]);
      });
    });

    describe('entity resolution failures', () => {
      test('fails when recipe resolver returns failure', () => {
        // Create a resolver that always fails
        const failingResolver = (id: FillingId): Result<IRuntimeFillingRecipe> => {
          return Failure.with(`Cannot resolve recipe: ${id}`);
        };

        const orchestrator = new FillingRecipeIndexerOrchestrator(library, failingResolver);

        const result = orchestrator.find({
          byTag: { tag: 'classic' }
        });

        expect(result).toFailWith(/Failed to resolve entities/);
      });

      test('fails when ingredient resolver returns failure', () => {
        // Create a resolver that always fails
        const failingResolver = (id: IngredientId): Result<IRuntimeIngredient> => {
          return Failure.with(`Cannot resolve ingredient: ${id}`);
        };

        const orchestrator = new IngredientIndexerOrchestrator(library, failingResolver);

        const result = orchestrator.find({
          byTag: { tag: 'premium' }
        });

        expect(result).toFailWith(/Failed to resolve entities/);
      });

      test('aggregates multiple resolution failures', () => {
        // Create a resolver that fails for all IDs
        const failingResolver = (id: FillingId): Result<IRuntimeFillingRecipe> => {
          return Failure.with(`Not found: ${id}`);
        };

        const orchestrator = new FillingRecipeIndexerOrchestrator(library, failingResolver);

        // classic tag matches both recipes, so both should fail to resolve
        const result = orchestrator.find({
          byTag: { tag: 'classic' }
        });

        expect(result).toFailWith(/Failed to resolve entities.*Not found/);
      });
    });
  });
});
