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
  AdditionalChocolatePurpose,
  BaseConfectionId,
  BaseIngredientId,
  BaseProcedureId,
  BaseFillingId,
  Celsius,
  ConfectionId,
  Measurement,
  IngredientId,
  Minutes,
  Model as CommonModel,
  MoldId,
  Percentage,
  ProcedureId,
  FillingId,
  FillingName,
  FillingVersionSpec,
  CollectionId,
  TaskId
} from '../../../packlets/common';

import {
  Confections as ConfectionsEntities,
  IGanacheCharacteristics,
  IChocolateIngredientEntity,
  Ingredients,
  IngredientsLibrary
} from '../../../packlets/entities';
import { IProcedureEntity, ProceduresLibrary, ConfectionsLibrary } from '../../../packlets/entities';
import {
  IFillingRecipeEntity,
  IFillingRecipeVersionEntity,
  FillingsLibrary
} from '../../../packlets/entities';
import { ChocolateLibrary } from '../../../packlets/library-runtime';
import { RuntimeContext } from '../../../packlets/runtime';
import { ITaskEntityInvocation } from '../../../packlets/entities';
import { BaseTaskId } from '../../../packlets/common';

/**
 * Helper to create an inline task from a description string.
 * Creates a synthetic baseId from the template for testing purposes.
 */
function inlineTask(template: string): ITaskEntityInvocation {
  const baseId = `test-inline-${template.slice(0, 20).replace(/\s+/g, '-').toLowerCase()}` as BaseTaskId;
  return {
    task: {
      baseId,
      name: template.slice(0, 30),
      template
    },
    params: {}
  };
}

describe('RuntimeContext', () => {
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
    ganacheCharacteristics: testChars,
    tags: ['premium', 'single-origin'],
    manufacturer: 'Test Manufacturer'
  };

  const milkChocolate: IChocolateIngredientEntity = {
    baseId: 'milk-chocolate' as BaseIngredientId,
    name: 'Milk Chocolate 40%',
    category: 'chocolate',
    chocolateType: 'milk',
    cacaoPercentage: 40 as Percentage,
    ganacheCharacteristics: { ...testChars, milkFat: 8 as Percentage },
    tags: ['classic']
  };

  const altChocolate: IChocolateIngredientEntity = {
    baseId: 'alt-chocolate' as BaseIngredientId,
    name: 'Alternative Dark Chocolate',
    category: 'chocolate',
    chocolateType: 'dark',
    cacaoPercentage: 65 as Percentage,
    ganacheCharacteristics: testChars
  };

  const cream: Ingredients.IIngredientEntity = {
    baseId: 'cream' as BaseIngredientId,
    name: 'Heavy Cream',
    category: 'dairy',
    ganacheCharacteristics: creamChars,
    tags: ['fresh']
  };

  const darkGanacheRecipe: IFillingRecipeEntity = {
    baseId: 'dark-ganache' as BaseFillingId,
    name: 'Dark Ganache' as FillingName,
    category: 'ganache',
    description: 'A classic dark chocolate ganache',
    tags: ['classic', 'dark'],
    goldenVersionSpec: '2026-01-01-01' as FillingVersionSpec,
    versions: [
      {
        versionSpec: '2026-01-01-01' as FillingVersionSpec,
        createdDate: '2026-01-01',
        notes: [{ category: 'user', note: 'Original version' }] as CommonModel.ICategorizedNote[],
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
      },
      {
        versionSpec: '2026-02-01-01' as FillingVersionSpec,
        createdDate: '2026-02-01',
        notes: [{ category: 'user', note: 'Revised version' }] as CommonModel.ICategorizedNote[],
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

  // Procedure test data
  const coldMethodProcedure: IProcedureEntity = {
    baseId: 'ganache-cold-method' as BaseProcedureId,
    name: 'Ganache (Cold Method)',
    description: 'Cold method for making ganache',
    category: 'ganache',
    steps: [
      {
        order: 1,
        task: inlineTask('Melt chocolate to 40-45C'),
        activeTime: 5 as Minutes,
        temperature: 45 as Celsius
      },
      {
        order: 2,
        task: inlineTask('Warm cream to 35C'),
        activeTime: 3 as Minutes,
        temperature: 35 as Celsius
      },
      { order: 3, task: inlineTask('Combine and emulsify'), activeTime: 5 as Minutes },
      { order: 4, task: inlineTask('Rest at room temperature'), waitTime: 30 as Minutes }
    ],
    tags: ['ganache', 'cold-process']
  };

  const hotMethodProcedure: IProcedureEntity = {
    baseId: 'ganache-hot-method' as BaseProcedureId,
    name: 'Ganache (Hot Method)',
    description: 'Hot method for making ganache',
    category: 'ganache',
    steps: [
      {
        order: 1,
        task: inlineTask('Bring cream to boil'),
        activeTime: 5 as Minutes,
        temperature: 100 as Celsius
      },
      { order: 2, task: inlineTask('Pour over chocolate'), activeTime: 2 as Minutes },
      { order: 3, task: inlineTask('Stir to emulsify'), activeTime: 5 as Minutes }
    ],
    tags: ['ganache', 'hot-process']
  };

  // Version with procedures - using IOptionsWithPreferred pattern at version level
  const versionWithProcedures: IFillingRecipeVersionEntity = {
    versionSpec: '2026-01-01-01' as FillingVersionSpec,
    createdDate: '2026-01-01',
    ingredients: [
      { ingredient: { ids: ['test.dark-chocolate' as IngredientId] }, amount: 200 as Measurement },
      { ingredient: { ids: ['test.cream' as IngredientId] }, amount: 100 as Measurement }
    ],
    baseWeight: 300 as Measurement,
    procedures: {
      options: [
        {
          id: 'test.ganache-cold-method' as ProcedureId,
          notes: [
            { category: 'user', note: 'Preferred method for this recipe' }
          ] as CommonModel.ICategorizedNote[]
        },
        { id: 'test.ganache-hot-method' as ProcedureId }
      ],
      preferredId: 'test.ganache-cold-method' as ProcedureId
    }
  };

  const darkGanacheWithProceduresRecipe: IFillingRecipeEntity = {
    baseId: 'dark-ganache-with-procedures' as BaseFillingId,
    name: 'Dark Ganache with Procedures' as FillingName,
    category: 'ganache',
    description: 'A dark ganache with linked procedures',
    tags: ['classic', 'dark'],
    goldenVersionSpec: '2026-01-01-01' as FillingVersionSpec,
    versions: [versionWithProcedures]
  };

  // Recipe with missing procedure reference (for error handling test)
  const recipeWithMissingProcedure: IFillingRecipeEntity = {
    baseId: 'ganache-missing-proc' as BaseFillingId,
    name: 'Ganache Missing Proc' as FillingName,
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
        baseWeight: 300 as Measurement,
        procedures: {
          options: [{ id: 'test.nonexistent-procedure' as ProcedureId }]
        }
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
            'milk-ganache': milkGanacheRecipe
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
  // Creation Tests
  // ============================================================================

  describe('creation', () => {
    test('fromLibrary wraps existing library', () => {
      expect(RuntimeContext.fromLibrary(library)).toSucceedAndSatisfy((ctx) => {
        expect(ctx.library).toBe(library);
      });
    });

    test('create with no params creates context with default library', () => {
      expect(RuntimeContext.create()).toSucceedAndSatisfy((ctx) => {
        // Default includes builtin data
        expect(ctx.library.ingredients.size).toBeGreaterThan(0);
      });
    });

    test('create with no builtins creates empty library', () => {
      expect(RuntimeContext.create({ libraryParams: { builtin: false } })).toSucceedAndSatisfy((ctx) => {
        expect(ctx.library.ingredients.size).toBe(0);
        expect(ctx.library.fillings.size).toBe(0);
      });
    });

    test('create with preWarm option', () => {
      expect(RuntimeContext.create({ libraryParams: { builtin: false }, preWarm: true })).toSucceedAndSatisfy(
        (ctx) => {
          // preWarm causes reverse index to be built eagerly
          expect(ctx.cachedRecipeCount).toBe(0);
          expect(ctx.cachedIngredientCount).toBe(0);
        }
      );
    });

    test('fromLibrary with preWarm option', () => {
      expect(RuntimeContext.fromLibrary(library, true)).toSucceedAndSatisfy((ctx) => {
        // preWarm causes reverse index to be built eagerly
        // Verify context was created successfully with preWarm
        expect(ctx.cachedRecipeCount).toBe(0); // Cache starts empty, preWarm only affects reverse index
        expect(ctx.cachedIngredientCount).toBe(0);
      });
    });
  });

  // ============================================================================
  // Ingredient Resolution Tests
  // ============================================================================

  describe('ingredient resolution', () => {
    let ctx: RuntimeContext;

    beforeEach(() => {
      ctx = RuntimeContext.fromLibrary(library).orThrow();
    });

    test('ingredients.get returns RuntimeIngredient', () => {
      expect(ctx.ingredients.get('test.dark-chocolate' as IngredientId)).toSucceedAndSatisfy((ing) => {
        expect(ing.id).toBe('test.dark-chocolate');
        expect(ing.name).toBe('Dark Chocolate 70%');
        expect(ing.category).toBe('chocolate');
        expect(ing.collectionId).toBe('test');
        expect(ing.baseId).toBe('dark-chocolate');
      });
    });

    test('ingredients.get caches results', () => {
      const result1 = ctx.ingredients.get('test.dark-chocolate' as IngredientId).value;
      const result2 = ctx.ingredients.get('test.dark-chocolate' as IngredientId).value;
      expect(result1).toBe(result2); // Same instance
    });

    test('ingredients.get fails for non-existent', () => {
      expect(ctx.ingredients.get('test.nonexistent' as IngredientId)).toFail();
    });

    test('ingredients.has returns true for existing', () => {
      expect(ctx.ingredients.has('test.dark-chocolate' as IngredientId)).toBe(true);
    });

    test('ingredients.has returns false for non-existent', () => {
      expect(ctx.ingredients.has('test.nonexistent' as IngredientId)).toBe(false);
    });
  });

  // ============================================================================
  // Recipe Resolution Tests
  // ============================================================================

  describe('recipe resolution', () => {
    let ctx: RuntimeContext;

    beforeEach(() => {
      ctx = RuntimeContext.fromLibrary(library).orThrow();
    });

    test('recipes.get returns RuntimeFillingRecipe', () => {
      expect(ctx.fillings.get('test.dark-ganache' as FillingId)).toSucceedAndSatisfy((recipe) => {
        expect(recipe.id).toBe('test.dark-ganache');
        expect(recipe.name).toBe('Dark Ganache');
        expect(recipe.collectionId).toBe('test');
        expect(recipe.baseId).toBe('dark-ganache');
      });
    });

    test('recipes.get caches results', () => {
      const result1 = ctx.fillings.get('test.dark-ganache' as FillingId).value;
      const result2 = ctx.fillings.get('test.dark-ganache' as FillingId).value;
      expect(result1).toBe(result2); // Same instance
    });

    test('recipes.get fails for non-existent', () => {
      expect(ctx.fillings.get('test.nonexistent' as FillingId)).toFail();
    });

    test('recipes.has returns true for existing', () => {
      expect(ctx.fillings.has('test.dark-ganache' as FillingId)).toBe(true);
    });

    test('recipes.has returns false for non-existent', () => {
      expect(ctx.fillings.has('test.nonexistent' as FillingId)).toBe(false);
    });
  });

  // ============================================================================
  // Iteration Tests
  // ============================================================================

  describe('iteration', () => {
    let ctx: RuntimeContext;

    beforeEach(() => {
      ctx = RuntimeContext.fromLibrary(library).orThrow();
    });

    test('ingredients.values() iterates all ingredients', () => {
      const ingredients = Array.from(ctx.ingredients.values());
      expect(ingredients.length).toBe(4);
      const names = ingredients.map((i) => i.name);
      expect(names).toContain('Dark Chocolate 70%');
      expect(names).toContain('Heavy Cream');
    });

    test('recipes.values() iterates all recipes', () => {
      const recipes = Array.from(ctx.fillings.values());
      expect(recipes.length).toBe(2);
      const names = recipes.map((r) => r.name);
      expect(names).toContain('Dark Ganache');
      expect(names).toContain('Milk Ganache');
    });

    test('ingredients.size returns count', () => {
      expect(ctx.ingredients.size).toBe(4);
    });

    test('recipes.size returns count', () => {
      expect(ctx.fillings.size).toBe(2);
    });
  });

  // ============================================================================
  // Reverse Lookup Tests
  // ============================================================================

  describe('reverse lookups', () => {
    let ctx: RuntimeContext;

    beforeEach(() => {
      ctx = RuntimeContext.fromLibrary(library).orThrow();
    });

    test('getIngredientUsage returns usage info', () => {
      expect(ctx.getIngredientUsage('test.dark-chocolate' as IngredientId)).toSucceedAndSatisfy((usage) => {
        expect(usage.length).toBe(1);
        expect(usage[0].isPrimary).toBe(true);
      });
    });

    test('getIngredientUsage fails for unknown ingredient', () => {
      expect(ctx.getIngredientUsage('test.unknown' as IngredientId)).toFailWith(/not found/i);
    });
  });

  // ============================================================================
  // Tag Lookup Tests
  // ============================================================================

  describe('tag discovery', () => {
    let ctx: RuntimeContext;

    beforeEach(() => {
      ctx = RuntimeContext.fromLibrary(library).orThrow();
    });

    test('getAllFillingTags returns unique tags', () => {
      const tags = ctx.getAllFillingTags();
      expect(tags).toContain('classic');
      expect(tags).toContain('dark');
      expect(tags).toContain('milk');
    });

    test('getAllIngredientTags returns unique tags', () => {
      const tags = ctx.getAllIngredientTags();
      expect(tags).toContain('premium');
      expect(tags).toContain('single-origin');
      expect(tags).toContain('fresh');
    });
  });

  // ============================================================================
  // Unified Find Interface Tests (Extensible Indexer System)
  // ============================================================================

  describe('unified find interface', () => {
    let ctx: RuntimeContext;

    beforeEach(() => {
      ctx = RuntimeContext.fromLibrary(library).orThrow();
    });

    describe('recipes.find', () => {
      test('finds recipes by tag using indexer', () => {
        expect(ctx.fillings.find({ byTag: { tag: 'classic' } })).toSucceedAndSatisfy((recipes) => {
          expect(recipes.length).toBe(2);
        });
      });

      test('finds recipes by chocolate type using indexer', () => {
        expect(ctx.fillings.find({ byChocolateType: { chocolateType: 'dark' } })).toSucceedAndSatisfy(
          (recipes) => {
            expect(recipes.length).toBe(1);
            expect(recipes[0].name).toBe('Dark Ganache');
          }
        );
      });

      test('finds recipes by ingredient using indexer', () => {
        expect(
          ctx.fillings.find({ byIngredient: { ingredientId: 'test.cream' as IngredientId } })
        ).toSucceedAndSatisfy((recipes) => {
          expect(recipes.length).toBe(2);
        });
      });

      test('returns empty for no matches', () => {
        expect(ctx.fillings.find({ byChocolateType: { chocolateType: 'white' } })).toSucceedAndSatisfy(
          (recipes) => {
            expect(recipes.length).toBe(0);
          }
        );
      });

      test('returns empty for empty spec', () => {
        expect(ctx.fillings.find({})).toSucceedAndSatisfy((recipes) => {
          expect(recipes.length).toBe(0);
        });
      });
    });

    describe('ingredients.find', () => {
      test('finds ingredients by tag using indexer', () => {
        expect(ctx.ingredients.find({ byTag: { tag: 'premium' } })).toSucceedAndSatisfy((ingredients) => {
          expect(ingredients.length).toBe(1);
          expect(ingredients[0].name).toBe('Dark Chocolate 70%');
        });
      });

      test('returns empty for no matches', () => {
        expect(ctx.ingredients.find({ byTag: { tag: 'nonexistent' } })).toSucceedAndSatisfy((ingredients) => {
          expect(ingredients.length).toBe(0);
        });
      });

      test('returns empty for empty spec', () => {
        expect(ctx.ingredients.find({})).toSucceedAndSatisfy((ingredients) => {
          expect(ingredients.length).toBe(0);
        });
      });
    });

    describe('invalidateIndexers', () => {
      test('invalidates all indexer caches', () => {
        // Warm up indexers first
        ctx.warmUp();

        // Use an indexer to build its index
        expect(ctx.fillings.find({ byTag: { tag: 'classic' } })).toSucceed();

        // Invalidate and verify still works (rebuilds on next query)
        ctx.invalidateIndexers();

        expect(ctx.fillings.find({ byTag: { tag: 'classic' } })).toSucceedAndSatisfy((recipes) => {
          expect(recipes.length).toBe(2);
        });
      });
    });
  });

  // ============================================================================
  // Cache Management Tests
  // ============================================================================

  describe('cache management', () => {
    let ctx: RuntimeContext;

    beforeEach(() => {
      ctx = RuntimeContext.fromLibrary(library).orThrow();
    });

    test('cache counts reflect cached items', () => {
      // Access ingredients to populate cache (eager loading populates all)
      ctx.ingredients.get('test.dark-chocolate' as IngredientId);
      ctx.fillings.get('test.dark-ganache' as FillingId);

      // With eager loading, accessing any item loads all items
      expect(ctx.cachedIngredientCount).toBe(4);
      expect(ctx.cachedRecipeCount).toBe(2);
    });

    test('clearCache clears all caches', () => {
      // Populate cache
      ctx.ingredients.get('test.dark-chocolate' as IngredientId);
      ctx.fillings.get('test.dark-ganache' as FillingId);

      ctx.clearCache();

      expect(ctx.cachedIngredientCount).toBe(0);
      expect(ctx.cachedRecipeCount).toBe(0);
    });

    test('warmUp pre-builds reverse indexes', () => {
      ctx.warmUp();

      // Lookups should still work
      expect(ctx.fillings.find({ byTag: { tag: 'classic' } })).toSucceedAndSatisfy((recipes) => {
        expect(recipes.length).toBe(2);
      });
    });
  });

  // ============================================================================
  // Runtime Recipe Procedures Tests
  // ============================================================================

  describe('runtime recipe procedures', () => {
    let libraryWithProcedures: ChocolateLibrary;

    beforeEach(() => {
      // Create procedures library
      const procedures = ProceduresLibrary.create({
        builtin: false,
        collections: [
          {
            id: 'test' as CollectionId,
            isMutable: false,
            items: {
              /* eslint-disable @typescript-eslint/naming-convention */
              'ganache-cold-method': coldMethodProcedure,
              'ganache-hot-method': hotMethodProcedure
              /* eslint-enable @typescript-eslint/naming-convention */
            }
          }
        ]
      }).orThrow();

      // Create recipes library with procedure references
      const recipes = FillingsLibrary.create({
        builtin: false,
        collections: [
          {
            id: 'test' as CollectionId,
            isMutable: false,
            items: {
              /* eslint-disable @typescript-eslint/naming-convention */
              'dark-ganache': darkGanacheRecipe, // No procedures
              'dark-ganache-with-procedures': darkGanacheWithProceduresRecipe,
              'ganache-missing-proc': recipeWithMissingProcedure
              /* eslint-enable @typescript-eslint/naming-convention */
            }
          }
        ]
      }).orThrow();

      libraryWithProcedures = ChocolateLibrary.create({
        builtin: false,
        libraries: {
          ingredients: library.ingredients,
          fillings: recipes,
          procedures
        }
      }).orThrow();
    });

    test('version without procedures returns undefined', () => {
      const ctx = RuntimeContext.fromLibrary(libraryWithProcedures).orThrow();
      expect(ctx.fillings.get('test.dark-ganache' as FillingId)).toSucceedAndSatisfy((recipe) => {
        expect(recipe.goldenVersion.procedures).toBeUndefined();
      });
    });

    test('version with procedures resolves procedure objects', () => {
      const ctx = RuntimeContext.fromLibrary(libraryWithProcedures).orThrow();
      expect(ctx.fillings.get('test.dark-ganache-with-procedures' as FillingId)).toSucceedAndSatisfy(
        (recipe) => {
          const version = recipe.goldenVersion;
          expect(version.procedures).toBeDefined();
          expect(version.procedures!.procedures).toHaveLength(2);

          // Check first procedure (cold method)
          const coldResolved = version.procedures!.procedures[0];
          expect(coldResolved.procedure.name).toBe('Ganache (Cold Method)');
          expect(coldResolved.notes).toEqual([
            { category: 'user', note: 'Preferred method for this recipe' }
          ]);
          expect(coldResolved.entity.id).toBe('test.ganache-cold-method');

          // Check second procedure (hot method)
          const hotResolved = version.procedures!.procedures[1];
          expect(hotResolved.procedure.name).toBe('Ganache (Hot Method)');
          expect(hotResolved.notes).toBeUndefined();
        }
      );
    });

    test('version with procedures resolves recommended procedure', () => {
      const ctx = RuntimeContext.fromLibrary(libraryWithProcedures).orThrow();
      expect(ctx.fillings.get('test.dark-ganache-with-procedures' as FillingId)).toSucceedAndSatisfy(
        (recipe) => {
          const version = recipe.goldenVersion;
          expect(version.procedures).toBeDefined();
          expect(version.procedures!.recommendedProcedure).toBeDefined();
          expect(version.procedures!.recommendedProcedure!.name).toBe('Ganache (Cold Method)');
        }
      );
    });

    test('version with missing procedure reference returns undefined procedures', () => {
      const ctx = RuntimeContext.fromLibrary(libraryWithProcedures).orThrow();
      expect(ctx.fillings.get('test.ganache-missing-proc' as FillingId)).toSucceedAndSatisfy((recipe) => {
        // When all procedure references fail to resolve, procedures returns undefined
        expect(recipe.goldenVersion.procedures).toBeUndefined();
      });
    });

    test('getProcedure returns procedure by id', () => {
      const ctx = RuntimeContext.fromLibrary(libraryWithProcedures).orThrow();
      expect(ctx.getProcedure('test.ganache-cold-method')).toSucceedAndSatisfy((proc) => {
        expect(proc.name).toBe('Ganache (Cold Method)');
        expect(proc.steps).toHaveLength(4);
      });
    });

    test('getProcedure fails for non-existent procedure', () => {
      const ctx = RuntimeContext.fromLibrary(libraryWithProcedures).orThrow();
      expect(ctx.getProcedure('test.nonexistent')).toFail();
    });

    test('procedures are lazily resolved and cached', () => {
      const ctx = RuntimeContext.fromLibrary(libraryWithProcedures).orThrow();
      expect(ctx.fillings.get('test.dark-ganache-with-procedures' as FillingId)).toSucceedAndSatisfy(
        (recipe) => {
          const version = recipe.goldenVersion;
          // First access
          const procs1 = version.procedures;
          // Second access should return cached value
          const procs2 = version.procedures;
          expect(procs1).toBe(procs2); // Same object reference
        }
      );
    });
  });

  // ============================================================================
  // Confection Convenience Methods
  // ============================================================================

  describe('confection convenience methods', () => {
    test('confections getter returns confections library', () => {
      expect(RuntimeContext.create({ libraryParams: { builtin: true } })).toSucceedAndSatisfy((ctx) => {
        expect(ctx.confections).toBeDefined();
        expect(ctx.confections.size).toBeGreaterThan(0);
      });
    });

    test('getConfection returns confection for valid ID', () => {
      expect(RuntimeContext.create({ libraryParams: { builtin: true } })).toSucceedAndSatisfy((ctx) => {
        expect(ctx.getConfection('common.dark-dome-bonbon' as ConfectionId)).toSucceedAndSatisfy(
          (confection) => {
            expect(confection.name).toBe('Classic Dark Dome Bonbon');
            expect(confection.confectionType).toBe('molded-bonbon');
          }
        );
      });
    });

    test('getConfection fails for non-existent ID', () => {
      expect(RuntimeContext.create({ libraryParams: { builtin: true } })).toSucceedAndSatisfy((ctx) => {
        expect(ctx.getConfection('common.nonexistent' as ConfectionId)).toFail();
      });
    });

    test('hasConfection returns true for existing ID', () => {
      expect(RuntimeContext.create({ libraryParams: { builtin: true } })).toSucceedAndSatisfy((ctx) => {
        expect(ctx.hasConfection('common.dark-dome-bonbon' as ConfectionId)).toBe(true);
      });
    });

    test('hasConfection returns false for non-existent ID', () => {
      expect(RuntimeContext.create({ libraryParams: { builtin: true } })).toSucceedAndSatisfy((ctx) => {
        expect(ctx.hasConfection('common.nonexistent' as ConfectionId)).toBe(false);
      });
    });
  });

  // ============================================================================
  // Runtime Wrapper Methods Tests
  // ============================================================================

  describe('runtime wrapper methods', () => {
    let ctx: RuntimeContext;

    beforeEach(() => {
      // Create a library with procedures, tasks, and molds using built-in data
      ctx = RuntimeContext.create({ libraryParams: { builtin: true } }).orThrow();
    });

    describe('getTask', () => {
      test('returns task for valid ID', () => {
        expect(ctx.getTaskEntity('common.melt-chocolate' as TaskId)).toSucceedAndSatisfy((task) => {
          expect(task.name).toBe('Melt Chocolate');
        });
      });

      test('fails for non-existent ID', () => {
        expect(ctx.getTaskEntity('common.nonexistent' as TaskId)).toFail();
      });
    });

    describe('getRuntimeTask', () => {
      test('returns RuntimeTask for valid ID', () => {
        expect(ctx.getTask('common.melt-chocolate' as TaskId)).toSucceedAndSatisfy((runtimeTask) => {
          expect(runtimeTask.id).toBe('common.melt-chocolate');
          expect(runtimeTask.name).toBe('Melt Chocolate');
        });
      });

      test('caches runtime tasks', () => {
        const result1 = ctx.getTask('common.melt-chocolate' as TaskId).orThrow();
        const result2 = ctx.getTask('common.melt-chocolate' as TaskId).orThrow();
        expect(result1).toBe(result2); // Same instance
      });

      test('fails for non-existent ID', () => {
        expect(ctx.getTask('common.nonexistent' as TaskId)).toFail();
      });
    });

    describe('getRuntimeProcedure', () => {
      test('returns RuntimeProcedure for valid ID', () => {
        expect(ctx.getRuntimeProcedure('common.ganache-cold-method' as ProcedureId)).toSucceedAndSatisfy(
          (runtimeProcedure) => {
            expect(runtimeProcedure.id).toBe('common.ganache-cold-method');
            expect(runtimeProcedure.name).toBe('Ganache (Cold Method)');
          }
        );
      });

      test('caches runtime procedures', () => {
        const result1 = ctx.getRuntimeProcedure('common.ganache-cold-method' as ProcedureId).orThrow();
        const result2 = ctx.getRuntimeProcedure('common.ganache-cold-method' as ProcedureId).orThrow();
        expect(result1).toBe(result2); // Same instance
      });

      test('fails for non-existent ID', () => {
        expect(ctx.getRuntimeProcedure('common.nonexistent' as ProcedureId)).toFail();
      });
    });

    describe('getRuntimeMold', () => {
      test('returns RuntimeMold for valid ID', () => {
        expect(ctx.getRuntimeMold('cw.chocolate-world-cw-2227' as MoldId)).toSucceedAndSatisfy(
          (runtimeMold) => {
            expect(runtimeMold.id).toBe('cw.chocolate-world-cw-2227');
            expect(runtimeMold.manufacturer).toBe('Chocolate World');
          }
        );
      });

      test('caches runtime molds', () => {
        const result1 = ctx.getRuntimeMold('cw.chocolate-world-cw-2227' as MoldId).orThrow();
        const result2 = ctx.getRuntimeMold('cw.chocolate-world-cw-2227' as MoldId).orThrow();
        expect(result1).toBe(result2); // Same instance
      });

      test('fails for non-existent ID', () => {
        expect(ctx.getRuntimeMold('common.nonexistent' as MoldId)).toFail();
      });
    });

    describe('getRuntimeConfection', () => {
      test('returns RuntimeConfection for valid ID', () => {
        expect(ctx.getRuntimeConfection('common.dark-dome-bonbon' as ConfectionId)).toSucceedAndSatisfy(
          (runtimeConfection) => {
            expect(runtimeConfection.id).toBe('common.dark-dome-bonbon');
            expect(runtimeConfection.name).toBe('Classic Dark Dome Bonbon');
          }
        );
      });

      test('caches runtime confections', () => {
        const result1 = ctx.getRuntimeConfection('common.dark-dome-bonbon' as ConfectionId).orThrow();
        const result2 = ctx.getRuntimeConfection('common.dark-dome-bonbon' as ConfectionId).orThrow();
        expect(result1).toBe(result2); // Same instance
      });

      test('fails for non-existent ID', () => {
        expect(ctx.getRuntimeConfection('common.nonexistent' as ConfectionId)).toFail();
      });
    });

    describe('runtimeConfections property', () => {
      test('returns map of all confections', () => {
        const confections = ctx.runtimeConfections;
        expect(confections.size).toBeGreaterThan(0);
        expect(confections.has('common.dark-dome-bonbon' as ConfectionId)).toBe(true);
      });

      test('returns same map on multiple accesses (cached)', () => {
        const confections1 = ctx.runtimeConfections;
        const confections2 = ctx.runtimeConfections;
        expect(confections1).toBe(confections2);
      });

      test('confections in map are fully resolved RuntimeConfection instances', () => {
        const confections = ctx.runtimeConfections;
        const confection = confections.get('common.dark-dome-bonbon' as ConfectionId);
        expect(confection).toBeDefined();
        expect(confection?.id).toBe('common.dark-dome-bonbon');
        expect(confection?.name).toBe('Classic Dark Dome Bonbon');
      });
    });

    describe('getAllConfectionTags', () => {
      test('returns array of unique tags from confections', () => {
        const tags = ctx.getAllConfectionTags();
        expect(Array.isArray(tags)).toBe(true);
        // Tags should be sorted
        const sorted = [...tags].sort();
        expect(tags).toEqual(sorted);
      });

      test('returns empty array when no confections have tags', () => {
        // Create a context with a confection that has no tags
        const emptyTagsConfection = ConfectionsLibrary.create({
          builtin: false,
          collections: [
            {
              id: 'test' as CollectionId,
              isMutable: true,
              items: {
                /* eslint-disable @typescript-eslint/naming-convention */
                'no-tags-confection': {
                  baseId: 'no-tags-confection' as BaseConfectionId,
                  name: 'No Tags Confection',
                  confectionType: 'molded-bonbon',
                  goldenVersionSpec: '2026-01-01-01',
                  versions: [
                    {
                      versionSpec: '2026-01-01-01',
                      createdDate: '2026-01-01',
                      yield: { count: 24 },
                      molds: {
                        options: [{ id: 'common.dome-25mm' }]
                      },
                      shellChocolate: {
                        ids: ['common.chocolate-dark-64']
                      }
                    }
                  ],
                  filling: {
                    options: [{ id: 'test.dark-ganache' as FillingId }],
                    preferredId: 'test.dark-ganache' as FillingId
                  }
                }
                /* eslint-enable @typescript-eslint/naming-convention */
              }
            }
          ]
        }).orThrow();

        const testLibrary = ChocolateLibrary.create({
          builtin: false,
          libraries: {
            confections: emptyTagsConfection,
            fillings: library.fillings,
            ingredients: library.ingredients
          }
        }).orThrow();

        const testCtx = RuntimeContext.fromLibrary(testLibrary).orThrow();
        const tags = testCtx.getAllConfectionTags();
        expect(tags).toEqual([]);
      });
    });

    describe('cachedConfectionCount', () => {
      test('returns 0 before confections are accessed', () => {
        const freshCtx = RuntimeContext.create({ libraryParams: { builtin: true } }).orThrow();
        expect(freshCtx.cachedConfectionCount).toBe(0);
      });

      test('returns count after confections are accessed', () => {
        // Access a single confection
        ctx.getRuntimeConfection('common.dark-dome-bonbon' as ConfectionId).orThrow();
        expect(ctx.cachedConfectionCount).toBeGreaterThan(0);
      });

      test('returns full count after runtimeConfections property accessed', () => {
        const confections = ctx.runtimeConfections;
        expect(ctx.cachedConfectionCount).toBe(confections.size);
      });

      test('returns 0 after clearCache', () => {
        const _confections = ctx.runtimeConfections; // Populate cache
        expect(_confections.size).toBeGreaterThan(0);
        expect(ctx.cachedConfectionCount).toBeGreaterThan(0);

        ctx.clearCache();
        expect(ctx.cachedConfectionCount).toBe(0);
      });
    });

    describe('getRuntimeIngredient', () => {
      let testCtx: RuntimeContext;

      beforeEach(() => {
        // Use custom test data library that has 'test.' prefixed ingredients
        testCtx = RuntimeContext.fromLibrary(library).orThrow();
      });

      test('returns RuntimeIngredient for valid ID', () => {
        expect(testCtx.getRuntimeIngredient('test.dark-chocolate' as IngredientId)).toSucceedAndSatisfy(
          (runtimeIngredient) => {
            expect(runtimeIngredient.id).toBe('test.dark-chocolate');
            expect(runtimeIngredient.category).toBe('chocolate');
          }
        );
      });

      test('fails for non-existent ID', () => {
        expect(testCtx.getRuntimeIngredient('test.nonexistent' as IngredientId)).toFail();
      });
    });

    describe('getRuntimeFilling', () => {
      let testCtx: RuntimeContext;

      beforeEach(() => {
        // Use custom test data library that has 'test.' prefixed fillings
        testCtx = RuntimeContext.fromLibrary(library).orThrow();
      });

      test('returns RuntimeFillingRecipe for valid ID', () => {
        expect(testCtx.getRuntimeFilling('test.dark-ganache' as FillingId)).toSucceedAndSatisfy(
          (runtimeRecipe) => {
            expect(runtimeRecipe.id).toBe('test.dark-ganache');
            expect(runtimeRecipe.name).toBe('Dark Ganache');
          }
        );
      });

      test('fails for non-existent ID', () => {
        expect(testCtx.getRuntimeFilling('test.nonexistent' as FillingId)).toFail();
      });
    });

    // ============================================================================
    // Resolution Helpers
    // ============================================================================

    describe('resolveChocolateSpec', () => {
      test('resolves chocolate specification with primary and alternates', () => {
        const ctx = RuntimeContext.create().orThrow();
        const spec = {
          ids: ['common.chocolate-dark-64' as IngredientId, 'common.chocolate-milk-38' as IngredientId],
          preferredId: 'common.chocolate-dark-64' as IngredientId
        };

        const resolved = ctx.resolveChocolateSpec(spec, 'test.confection' as ConfectionId);

        expect(resolved.chocolate).toBeDefined();
        expect(resolved.chocolate.id).toBe('common.chocolate-dark-64');
        expect(resolved.alternates).toHaveLength(1);
        expect(resolved.alternates[0].id).toBe('common.chocolate-milk-38');
        expect(resolved.entity).toBe(spec);
      });

      test('uses first id as primary when preferredId not set', () => {
        const ctx = RuntimeContext.create().orThrow();
        const spec = {
          ids: ['common.chocolate-dark-64' as IngredientId]
        };

        const resolved = ctx.resolveChocolateSpec(spec, 'test.confection' as ConfectionId);

        expect(resolved.chocolate.id).toBe('common.chocolate-dark-64');
        expect(resolved.alternates).toHaveLength(0);
      });
    });

    describe('resolveCoatings', () => {
      test('resolves coating options with preferred', () => {
        const ctx = RuntimeContext.create().orThrow();
        const coatings = {
          ids: ['common.cocoa-powder' as IngredientId],
          preferredId: 'common.cocoa-powder' as IngredientId
        };

        const resolved = ctx.resolveCoatings(coatings);

        expect(resolved.options).toHaveLength(1);
        expect(resolved.options[0].id).toBe('common.cocoa-powder');
        expect(resolved.preferred).toBeDefined();
        expect(resolved.preferred?.id).toBe('common.cocoa-powder');
        expect(resolved.entity).toBe(coatings);
      });

      test('uses first option as preferred when preferredId not set', () => {
        const ctx = RuntimeContext.create().orThrow();
        const coatings = {
          ids: ['common.cocoa-powder' as IngredientId]
        };

        const resolved = ctx.resolveCoatings(coatings);

        expect(resolved.preferred?.id).toBe('common.cocoa-powder');
      });
    });

    describe('resolveMoldRefs', () => {
      test('resolves mold references', () => {
        const ctx = RuntimeContext.create().orThrow();
        const molds = {
          options: [
            {
              id: 'common.dome-25mm' as MoldId,
              notes: [{ category: 'user', note: 'Primary mold' }] as CommonModel.ICategorizedNote[]
            },
            { id: 'common.hemisphere-20mm' as MoldId }
          ],
          preferredId: 'common.dome-25mm' as MoldId
        };

        const resolved = ctx.resolveMoldRefs(molds);

        expect(resolved.options.length).toBeGreaterThanOrEqual(1);
        expect(resolved.preferredId).toBe('common.dome-25mm');
        if (resolved.options.length > 0) {
          expect(resolved.options[0].mold).toBeDefined();
          expect(resolved.options[0].entity).toBeDefined();
        }
      });
    });

    describe('resolveAdditionalChocolates', () => {
      test('returns undefined for empty array', () => {
        const ctx = RuntimeContext.create().orThrow();

        expect(ctx.resolveAdditionalChocolates([], 'test.confection' as ConfectionId)).toBeUndefined();
      });

      test('returns undefined for undefined input', () => {
        const ctx = RuntimeContext.create().orThrow();

        expect(ctx.resolveAdditionalChocolates(undefined, 'test.confection' as ConfectionId)).toBeUndefined();
      });

      test('resolves additional chocolates with purpose', () => {
        const ctx = RuntimeContext.create().orThrow();
        const additional = [
          {
            chocolate: {
              ids: ['common.chocolate-dark-64' as IngredientId]
            },
            purpose: 'decoration' as AdditionalChocolatePurpose
          }
        ];

        const resolved = ctx.resolveAdditionalChocolates(additional, 'test.confection' as ConfectionId);

        expect(resolved).toBeDefined();
        expect(resolved).toHaveLength(1);
        expect(resolved![0].chocolate.chocolate.id).toBe('common.chocolate-dark-64');
        expect(resolved![0].purpose).toBe('decoration');
        expect(resolved![0].entity).toBe(additional[0]);
      });
    });

    describe('resolveFillingSlots', () => {
      test('returns undefined for empty array', () => {
        const ctx = RuntimeContext.create().orThrow();

        expect(ctx.resolveFillingSlots([])).toBeUndefined();
      });

      test('returns undefined for undefined input', () => {
        const ctx = RuntimeContext.create().orThrow();

        expect(ctx.resolveFillingSlots(undefined)).toBeUndefined();
      });

      test('resolves filling slots with recipe options', () => {
        const ctx = RuntimeContext.create().orThrow();
        const slots = [
          {
            slotId: 'center' as import('../../../packlets/common').SlotId,
            name: 'Center Filling',
            filling: {
              options: [{ type: 'recipe' as const, id: 'common.dark-ganache-classic' as FillingId }],
              preferredId: 'common.dark-ganache-classic' as ConfectionsEntities.FillingOptionId
            }
          }
        ];

        const resolved = ctx.resolveFillingSlots(slots);

        expect(resolved).toBeDefined();
        expect(resolved).toHaveLength(1);
        expect(resolved![0].slotId).toBe('center');
        expect(resolved![0].filling.options).toHaveLength(1);
        expect(resolved![0].filling.options[0].type).toBe('recipe');
      });

      test('resolves filling slots with ingredient options', () => {
        const ctx = RuntimeContext.create().orThrow();
        const slots = [
          {
            slotId: 'center' as import('../../../packlets/common').SlotId,
            name: 'Center Filling',
            filling: {
              options: [{ type: 'ingredient' as const, id: 'common.chocolate-dark-64' as IngredientId }]
            }
          }
        ];

        const resolved = ctx.resolveFillingSlots(slots);

        expect(resolved).toBeDefined();
        expect(resolved![0].filling.options[0].type).toBe('ingredient');
      });
    });

    describe('resolveProcedures', () => {
      test('returns undefined for empty options', () => {
        const ctx = RuntimeContext.create().orThrow();

        expect(ctx.resolveProcedures({ options: [] })).toBeUndefined();
      });

      test('returns undefined for undefined input', () => {
        const ctx = RuntimeContext.create().orThrow();

        expect(ctx.resolveProcedures(undefined)).toBeUndefined();
      });

      test('resolves procedure references', () => {
        const ctx = RuntimeContext.create().orThrow();
        const procedures = {
          options: [
            {
              id: 'common.ganache-cold-method' as ProcedureId,
              notes: [{ category: 'user', note: 'Preferred method' }] as CommonModel.ICategorizedNote[]
            }
          ],
          preferredId: 'common.ganache-cold-method' as ProcedureId
        };

        const resolved = ctx.resolveProcedures(procedures);

        expect(resolved).toBeDefined();
        expect(resolved!.options.length).toBe(1);
        expect(resolved!.preferredId).toBe('common.ganache-cold-method');
        expect(resolved!.options[0].procedure).toBeDefined();
        expect(resolved!.options[0].procedure.name).toBe('Ganache (Cold Method)');
        expect(resolved!.options[0].notes).toEqual([{ category: 'user', note: 'Preferred method' }]);
      });
    });
  });

  // ============================================================================
  // Weight Context Tests
  // ============================================================================

  describe('createWeightContext', () => {
    test('returns context that returns 1.0 for ingredients without density', () => {
      const ctx = RuntimeContext.fromLibrary(library).orThrow();
      const weightCtx = ctx.createWeightContext();

      // cream has no density specified, should return 1.0
      const density = weightCtx.getIngredientDensity('test.cream' as IngredientId);
      expect(density).toBe(1.0);
    });

    test('returns context that returns 1.0 for unknown ingredients', () => {
      const ctx = RuntimeContext.fromLibrary(library).orThrow();
      const weightCtx = ctx.createWeightContext();

      // Non-existent ingredient should return 1.0
      const density = weightCtx.getIngredientDensity('test.unknown' as IngredientId);
      expect(density).toBe(1.0);
    });

    test('returns context that returns ingredient density when specified', () => {
      // Create ingredient with density
      const creamWithDensity: Ingredients.IIngredientEntity = {
        baseId: 'cream-with-density' as BaseIngredientId,
        name: 'Heavy Cream with Density',
        category: 'dairy',
        ganacheCharacteristics: creamChars,
        density: 1.032 // g/mL for heavy cream
      };

      const ingredientsWithDensity = IngredientsLibrary.create({
        builtin: false,
        collections: [
          {
            id: 'test' as CollectionId,
            isMutable: false,
            items: {
              /* eslint-disable @typescript-eslint/naming-convention */
              'cream-with-density': creamWithDensity
              /* eslint-enable @typescript-eslint/naming-convention */
            }
          }
        ]
      }).orThrow();

      const libraryWithDensity = ChocolateLibrary.create({
        builtin: false,
        libraries: {
          ingredients: ingredientsWithDensity
        }
      }).orThrow();

      const ctx = RuntimeContext.fromLibrary(libraryWithDensity).orThrow();
      const weightCtx = ctx.createWeightContext();

      const density = weightCtx.getIngredientDensity('test.cream-with-density' as IngredientId);
      expect(density).toBe(1.032);
    });
  });
});
