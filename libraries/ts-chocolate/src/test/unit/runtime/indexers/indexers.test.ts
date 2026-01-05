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
import { Result, Success } from '@fgv/ts-utils';

import {
  BaseIngredientId,
  BaseRecipeId,
  Grams,
  IngredientId,
  Percentage,
  RecipeId,
  RecipeName,
  RecipeVersionSpec,
  SourceId
} from '../../../../packlets/common';

import {
  IGanacheCharacteristics,
  IChocolateIngredient,
  IIngredient,
  IngredientsLibrary
} from '../../../../packlets/ingredients';
import { IRecipe, RecipesLibrary } from '../../../../packlets/recipes';
import { ChocolateLibrary, Indexers, IRuntimeRecipe, IRuntimeIngredient } from '../../../../packlets/runtime';

// Destructure the Indexers namespace for convenient access
const {
  IndexerIds,
  IndexOrchestrator,
  RecipesByIngredientIndexer,
  RecipesByTagIndexer,
  IngredientsByTagIndexer,
  RecipesByChocolateTypeIndexer,
  recipesByIngredientConfig,
  recipesByTagConfig,
  ingredientsByTagConfig,
  recipesByChocolateTypeConfig
} = Indexers;

// Type aliases for types from Indexers namespace
type IEntityResolver<TEntity, TId> = Indexers.IEntityResolver<TEntity, TId>;
type RecipesByIngredientIndexerType = InstanceType<typeof RecipesByIngredientIndexer>;
type RecipesByTagIndexerType = InstanceType<typeof RecipesByTagIndexer>;
type IngredientsByTagIndexerType = InstanceType<typeof IngredientsByTagIndexer>;
type RecipesByChocolateTypeIndexerType = InstanceType<typeof RecipesByChocolateTypeIndexer>;
type IndexOrchestratorType<
  TEntity,
  TId,
  TOrchestratorConfig extends Indexers.IIndexOrchestratorConfig
> = InstanceType<typeof IndexOrchestrator<TEntity, TId, TOrchestratorConfig>>;

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

  const darkChocolate: IChocolateIngredient = {
    baseId: 'dark-chocolate' as BaseIngredientId,
    name: 'Dark Chocolate',
    category: 'chocolate',
    chocolateType: 'dark',
    cacaoPercentage: 70 as Percentage,
    ganacheCharacteristics: testChars,
    tags: ['premium', 'single-origin']
  };

  const milkChocolate: IChocolateIngredient = {
    baseId: 'milk-chocolate' as BaseIngredientId,
    name: 'Milk Chocolate',
    category: 'chocolate',
    chocolateType: 'milk',
    cacaoPercentage: 40 as Percentage,
    ganacheCharacteristics: { ...testChars, milkFat: 8 as Percentage },
    tags: ['classic']
  };

  const altChocolate: IChocolateIngredient = {
    baseId: 'alt-chocolate' as BaseIngredientId,
    name: 'Alternative Chocolate',
    category: 'chocolate',
    chocolateType: 'dark',
    cacaoPercentage: 65 as Percentage,
    ganacheCharacteristics: testChars,
    tags: ['premium']
  };

  const cream: IIngredient = {
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

  const darkGanacheRecipe: IRecipe = {
    baseId: 'dark-ganache' as BaseRecipeId,
    name: 'Dark Ganache' as RecipeName,
    tags: ['classic', 'dark'],
    goldenVersionSpec: '2026-01-01-01' as RecipeVersionSpec,
    versions: [
      {
        versionSpec: '2026-01-01-01' as RecipeVersionSpec,
        createdDate: '2026-01-01',
        ingredients: [
          {
            ingredientId: 'test.dark-chocolate' as IngredientId,
            amount: 200 as Grams,
            alternateIngredientIds: ['test.alt-chocolate' as IngredientId]
          },
          { ingredientId: 'test.cream' as IngredientId, amount: 100 as Grams }
        ],
        baseWeight: 300 as Grams
      }
    ],
    usage: []
  };

  const milkGanacheRecipe: IRecipe = {
    baseId: 'milk-ganache' as BaseRecipeId,
    name: 'Milk Ganache' as RecipeName,
    tags: ['classic', 'milk'],
    goldenVersionSpec: '2026-01-01-01' as RecipeVersionSpec,
    versions: [
      {
        versionSpec: '2026-01-01-01' as RecipeVersionSpec,
        createdDate: '2026-01-01',
        ingredients: [
          { ingredientId: 'test.milk-chocolate' as IngredientId, amount: 200 as Grams },
          { ingredientId: 'test.cream' as IngredientId, amount: 150 as Grams }
        ],
        baseWeight: 350 as Grams
      }
    ],
    usage: []
  };

  let library: ChocolateLibrary;

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
            'milk-chocolate': milkChocolate,
            'alt-chocolate': altChocolate,
            /* eslint-enable @typescript-eslint/naming-convention */
            cream
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
            'milk-ganache': milkGanacheRecipe
            /* eslint-enable @typescript-eslint/naming-convention */
          }
        }
      ]
    }).orThrow();

    library = ChocolateLibrary.create({
      builtin: false,
      libraries: { ingredients, recipes }
    }).orThrow();
  });

  // ============================================================================
  // RecipesByIngredientIndexer Tests
  // ============================================================================

  describe('RecipesByIngredientIndexer', () => {
    let indexer: RecipesByIngredientIndexerType;

    beforeEach(() => {
      indexer = new RecipesByIngredientIndexer(library);
    });

    test('has correct ID', () => {
      expect(indexer.id).toBe(IndexerIds.recipesByIngredient);
    });

    test('finds recipes by primary ingredient', () => {
      const config = recipesByIngredientConfig('test.dark-chocolate' as IngredientId, 'primary');
      const result = indexer.find(config);

      expect(result).toBeDefined();
      expect(result).toSucceedAndSatisfy((ids) => {
        expect(ids).toHaveLength(1);
        expect(ids).toContain('test.dark-ganache');
      });
    });

    test('finds recipes by alternate ingredient', () => {
      const config = recipesByIngredientConfig('test.alt-chocolate' as IngredientId, 'alternate');
      const result = indexer.find(config);

      expect(result).toBeDefined();
      expect(result).toSucceedAndSatisfy((ids) => {
        expect(ids).toHaveLength(1);
        expect(ids).toContain('test.dark-ganache');
      });
    });

    test('finds recipes by any usage', () => {
      const config = recipesByIngredientConfig('test.cream' as IngredientId);
      const result = indexer.find(config);

      expect(result).toBeDefined();
      expect(result).toSucceedAndSatisfy((ids) => {
        expect(ids).toHaveLength(2);
        expect(ids).toContain('test.dark-ganache');
        expect(ids).toContain('test.milk-ganache');
      });
    });

    test('returns empty array for unknown ingredient', () => {
      const config = recipesByIngredientConfig('test.unknown' as IngredientId);
      const result = indexer.find(config);

      expect(result).toBeDefined();
      expect(result).toSucceedWith([]);
    });

    test('returns undefined for wrong indexer ID', () => {
      const wrongConfig = {
        indexerId: IndexerIds.recipesByTag,
        ingredientId: 'test.dark-chocolate' as IngredientId
      };
      const result = indexer.find(wrongConfig as unknown as ReturnType<typeof recipesByIngredientConfig>);
      expect(result).toBeUndefined();
    });

    test('warmUp pre-builds the index', () => {
      indexer.warmUp();
      // Subsequent query should work without rebuilding
      const config = recipesByIngredientConfig('test.cream' as IngredientId);
      const result = indexer.find(config);
      expect(result).toSucceedAndSatisfy((ids) => {
        expect(ids).toHaveLength(2);
      });
    });

    test('invalidate clears the index', () => {
      // First query to build index
      indexer.find(recipesByIngredientConfig('test.cream' as IngredientId));

      // Invalidate
      indexer.invalidate();

      // Index should be rebuilt on next query
      const result = indexer.find(recipesByIngredientConfig('test.cream' as IngredientId));
      expect(result).toSucceedAndSatisfy((ids) => {
        expect(ids).toHaveLength(2);
      });
    });
  });

  // ============================================================================
  // RecipesByTagIndexer Tests
  // ============================================================================

  describe('RecipesByTagIndexer', () => {
    let indexer: RecipesByTagIndexerType;

    beforeEach(() => {
      indexer = new RecipesByTagIndexer(library);
    });

    test('has correct ID', () => {
      expect(indexer.id).toBe(IndexerIds.recipesByTag);
    });

    test('finds recipes by tag (case-insensitive)', () => {
      const config = recipesByTagConfig('CLASSIC');
      const result = indexer.find(config);

      expect(result).toBeDefined();
      expect(result).toSucceedAndSatisfy((ids) => {
        expect(ids).toHaveLength(2);
        expect(ids).toContain('test.dark-ganache');
        expect(ids).toContain('test.milk-ganache');
      });
    });

    test('finds recipes by specific tag', () => {
      const config = recipesByTagConfig('dark');
      const result = indexer.find(config);

      expect(result).toBeDefined();
      expect(result).toSucceedAndSatisfy((ids) => {
        expect(ids).toHaveLength(1);
        expect(ids).toContain('test.dark-ganache');
      });
    });

    test('returns empty array for unknown tag', () => {
      const config = recipesByTagConfig('unknown-tag');
      const result = indexer.find(config);

      expect(result).toBeDefined();
      expect(result).toSucceedWith([]);
    });

    test('getAllTags returns all unique tags', () => {
      const tags = indexer.getAllTags();
      expect(tags).toContain('classic');
      expect(tags).toContain('dark');
      expect(tags).toContain('milk');
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

    test('has correct ID', () => {
      expect(indexer.id).toBe(IndexerIds.ingredientsByTag);
    });

    test('finds ingredients by tag', () => {
      const config = ingredientsByTagConfig('premium');
      const result = indexer.find(config);

      expect(result).toBeDefined();
      expect(result).toSucceedAndSatisfy((ids) => {
        expect(ids).toHaveLength(2);
        expect(ids).toContain('test.dark-chocolate');
        expect(ids).toContain('test.alt-chocolate');
      });
    });

    test('returns empty array for unknown tag', () => {
      const config = ingredientsByTagConfig('unknown-tag');
      const result = indexer.find(config);

      expect(result).toBeDefined();
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
  // RecipesByChocolateTypeIndexer Tests
  // ============================================================================

  describe('RecipesByChocolateTypeIndexer', () => {
    let indexer: RecipesByChocolateTypeIndexerType;

    beforeEach(() => {
      indexer = new RecipesByChocolateTypeIndexer(library);
    });

    test('has correct ID', () => {
      expect(indexer.id).toBe(IndexerIds.recipesByChocolateType);
    });

    test('finds recipes by chocolate type', () => {
      const config = recipesByChocolateTypeConfig('dark');
      const result = indexer.find(config);

      expect(result).toBeDefined();
      expect(result).toSucceedAndSatisfy((ids) => {
        expect(ids).toHaveLength(1);
        expect(ids).toContain('test.dark-ganache');
      });
    });

    test('finds recipes by milk chocolate type', () => {
      const config = recipesByChocolateTypeConfig('milk');
      const result = indexer.find(config);

      expect(result).toBeDefined();
      expect(result).toSucceedAndSatisfy((ids) => {
        expect(ids).toHaveLength(1);
        expect(ids).toContain('test.milk-ganache');
      });
    });

    test('returns empty array for unused chocolate type', () => {
      const config = recipesByChocolateTypeConfig('white');
      const result = indexer.find(config);

      expect(result).toBeDefined();
      expect(result).toSucceedWith([]);
    });
  });

  // ============================================================================
  // IndexOrchestrator Tests
  // ============================================================================

  describe('IndexOrchestrator', () => {
    // Mock recipe resolver that just returns ID as "resolved"
    const mockRecipeResolver: IEntityResolver<IRuntimeRecipe, RecipeId> = {
      resolve: (id: RecipeId): Result<IRuntimeRecipe> => {
        // Create a minimal mock recipe - in real usage this would come from RuntimeContext
        return Success.with({
          id,
          name: `Recipe ${id}` as RecipeName
        } as unknown as IRuntimeRecipe);
      },
      isId: (value: IRuntimeRecipe | RecipeId): value is RecipeId => {
        return typeof value === 'string';
      }
    };

    let orchestrator: IndexOrchestratorType<IRuntimeRecipe, RecipeId, Indexers.IIndexOrchestratorConfig>;

    beforeEach(() => {
      orchestrator = new IndexOrchestrator(mockRecipeResolver);
      orchestrator.register(new RecipesByIngredientIndexer(library));
      orchestrator.register(new RecipesByTagIndexer(library));
      orchestrator.register(new RecipesByChocolateTypeIndexer(library));
    });

    test('finds with single indexer', () => {
      const result = orchestrator.find({
        [IndexerIds.recipesByTag]: recipesByTagConfig('classic')
      });

      expect(result).toSucceedAndSatisfy((recipes) => {
        expect(recipes).toHaveLength(2);
      });
    });

    test('finds with intersection (AND) semantics', () => {
      const result = orchestrator.find({
        [IndexerIds.recipesByTag]: recipesByTagConfig('classic'),
        [IndexerIds.recipesByChocolateType]: recipesByChocolateTypeConfig('dark')
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
          [IndexerIds.recipesByChocolateType]: recipesByChocolateTypeConfig('dark'),
          [IndexerIds.recipesByTag]: recipesByTagConfig('milk')
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

    test('fails for unknown indexer', () => {
      const result = orchestrator.find({
        ['unknown-indexer' as unknown as keyof typeof IndexerIds]: { indexerId: 'unknown-indexer' }
      } as unknown as Parameters<typeof orchestrator.find>[0]);

      expect(result).toFailWith(/unknown indexer/i);
    });

    test('warmUp warms all indexers', () => {
      orchestrator.warmUp();

      // Queries should work without indexers rebuilding
      const result = orchestrator.find({
        [IndexerIds.recipesByTag]: recipesByTagConfig('classic')
      });
      expect(result).toSucceed();
    });

    test('invalidate invalidates all indexers', () => {
      // First query to build indexes
      orchestrator.find({
        [IndexerIds.recipesByTag]: recipesByTagConfig('classic')
      });

      // Invalidate
      orchestrator.invalidate();

      // Should still work after invalidation (indexes rebuilt)
      const result = orchestrator.find({
        [IndexerIds.recipesByTag]: recipesByTagConfig('classic')
      });
      expect(result).toSucceed();
    });
  });

  // ============================================================================
  // IndexOrchestrator with Ingredient Tests
  // ============================================================================

  describe('IndexOrchestrator for Ingredients', () => {
    const mockIngredientResolver: IEntityResolver<IRuntimeIngredient, IngredientId> = {
      resolve: (id: IngredientId): Result<IRuntimeIngredient> => {
        return Success.with({
          id,
          name: `Ingredient ${id}`
        } as unknown as IRuntimeIngredient);
      },
      isId: (value: IRuntimeIngredient | IngredientId): value is IngredientId => {
        return typeof value === 'string';
      }
    };

    test('finds ingredients with single indexer', () => {
      const orchestrator = new IndexOrchestrator(mockIngredientResolver);
      orchestrator.register(new IngredientsByTagIndexer(library));

      const result = orchestrator.find({
        [IndexerIds.ingredientsByTag]: ingredientsByTagConfig('premium')
      });

      expect(result).toSucceedAndSatisfy((ingredients) => {
        expect(ingredients).toHaveLength(2);
      });
    });
  });
});
