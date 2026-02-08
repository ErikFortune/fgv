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

/**
 * Focused functionality tests for MaterializedLibrary-based architecture
 * Tests core access patterns and materialized object resolution
 */

import '@fgv/ts-utils-jest';
import { ChocolateLibrary } from '../../../packlets/library-runtime';
import {
  CollectionId,
  ConfectionId,
  FillingId,
  IngredientId,
  MoldId,
  ProcedureId,
  TaskId
} from '../../../packlets/common';
import type { Model } from '../../../packlets/common';

describe('MaterializedLibrary Functionality Tests', () => {
  let ctx: ChocolateLibrary;

  beforeEach(() => {
    ctx = ChocolateLibrary.create({ entityLibraryParams: { builtin: true } }).orThrow();
  });

  // ============================================================================
  // Ingredients Library
  // ============================================================================

  describe('ingredients library', () => {
    test('get() returns materialized ingredient with references', () => {
      const result = ctx.ingredients.get('common.chocolate-dark-64' as IngredientId);

      expect(result).toSucceedAndSatisfy((ingredient) => {
        expect(ingredient.id).toBe('common.chocolate-dark-64');
        expect(ingredient.name).toBe('Generic Dark Chocolate (64%)');
        expect(ingredient.isChocolate()).toBe(true);
        // Verify it's a materialized class instance, not just JSON
        expect(typeof ingredient.isChocolate).toBe('function');
      });
    });

    test('get() fails for non-existent ingredient', () => {
      const result = ctx.ingredients.get('common.nonexistent' as IngredientId);
      expect(result).toFail();
    });

    test('has() checks ingredient existence', () => {
      expect(ctx.ingredients.has('common.chocolate-dark-64' as IngredientId)).toBe(true);
      expect(ctx.ingredients.has('common.nonexistent' as IngredientId)).toBe(false);
    });

    test('values() returns iterable of materialized ingredients', () => {
      const ingredients = Array.from(ctx.ingredients.values());

      expect(ingredients.length).toBeGreaterThan(0);
      expect(ingredients[0]).toHaveProperty('id');
      expect(ingredients[0]).toHaveProperty('name');
      expect(typeof ingredients[0].isChocolate).toBe('function');
    });

    test('caches materialized ingredients', () => {
      const result1 = ctx.ingredients.get('common.chocolate-dark-64' as IngredientId).orThrow();
      const result2 = ctx.ingredients.get('common.chocolate-dark-64' as IngredientId).orThrow();

      expect(result1).toBe(result2); // Same instance
    });
  });

  // ============================================================================
  // Fillings Library
  // ============================================================================

  describe('fillings library', () => {
    test('get() returns materialized filling with variations', () => {
      const result = ctx.fillings.get('common.dark-ganache-classic' as FillingId);

      expect(result).toSucceedAndSatisfy((filling) => {
        expect(filling.id).toBe('common.dark-ganache-classic');
        expect(filling.name).toBeDefined();
        expect(filling.goldenVariation).toBeDefined();
        // Verify it's a materialized class instance
        expect(typeof filling.getVariation).toBe('function');
      });
    });

    test('filling has materialized ingredients (not just IDs)', () => {
      const result = ctx.fillings.get('common.dark-ganache-classic' as FillingId);

      expect(result).toSucceedAndSatisfy((filling) => {
        const variation = filling.goldenVariation;
        expect(variation).toBeDefined();

        // Ingredients should be materialized objects with methods
        const ingredientsResult = variation.getIngredients();
        expect(ingredientsResult).toSucceedAndSatisfy((ingredients) => {
          const ingredientArray = Array.from(ingredients);
          expect(ingredientArray.length).toBeGreaterThan(0);

          const firstIngredient = ingredientArray[0].ingredient;
          expect(firstIngredient).toHaveProperty('id');
          expect(typeof firstIngredient.isChocolate).toBe('function');
        });
      });
    });

    test('get() fails for non-existent filling', () => {
      const result = ctx.fillings.get('common.nonexistent' as FillingId);
      expect(result).toFail();
    });
  });

  // ============================================================================
  // Molds Library
  // ============================================================================

  describe('molds library', () => {
    test('get() returns materialized mold', () => {
      const result = ctx.molds.get('cw.chocolate-world-cw-2227' as MoldId);

      expect(result).toSucceedAndSatisfy((mold) => {
        expect(mold.id).toBe('cw.chocolate-world-cw-2227');
        expect(mold.manufacturer).toBe('Chocolate World');
        expect(mold.entity).toBeDefined();
      });
    });

    test('get() fails for non-existent mold', () => {
      const result = ctx.molds.get('common.nonexistent' as MoldId);
      expect(result).toFail();
    });
  });

  // ============================================================================
  // Procedures Library
  // ============================================================================

  describe('procedures library', () => {
    test('get() returns materialized procedure', () => {
      const result = ctx.procedures.get('common.ganache-cold-method' as ProcedureId);

      expect(result).toSucceedAndSatisfy((procedure) => {
        expect(procedure.id).toBe('common.ganache-cold-method');
        expect(procedure.name).toBe('Ganache (Cold Method)');
        expect(procedure.entity).toBeDefined();
      });
    });

    test('get() fails for non-existent procedure', () => {
      const result = ctx.procedures.get('common.nonexistent' as ProcedureId);
      expect(result).toFail();
    });
  });

  // ============================================================================
  // Tasks Library
  // ============================================================================

  describe('tasks library', () => {
    test('get() returns materialized task', () => {
      const result = ctx.tasks.get('common.melt-chocolate' as TaskId);

      expect(result).toSucceedAndSatisfy((task) => {
        expect(task.id).toBe('common.melt-chocolate');
        expect(task.name).toBe('Melt Chocolate');
        expect(typeof task.render).toBe('function');
      });
    });

    test('get() fails for non-existent task', () => {
      const result = ctx.tasks.get('common.nonexistent' as TaskId);
      expect(result).toFail();
    });
  });

  // ============================================================================
  // Confections Library
  // ============================================================================

  describe('confections library', () => {
    test('get() returns materialized confection with resolved references', () => {
      const result = ctx.confections.get('common.dark-dome-bonbon' as ConfectionId);

      expect(result).toSucceedAndSatisfy((confection) => {
        expect(confection.id).toBe('common.dark-dome-bonbon');
        expect(confection.name).toBe('Classic Dark Dome Bonbon');
        expect(confection.confectionType).toBe('molded-bonbon');

        // Verify it's a materialized class instance
        expect(typeof confection.getVariation).toBe('function');
      });
    });

    test('confection variation has materialized molds (not just IDs)', () => {
      const result = ctx.confections.get('common.dark-dome-bonbon' as ConfectionId);

      expect(result).toSucceedAndSatisfy((confection) => {
        const variation = confection.goldenVariation;

        // For molded bonbons, molds should be materialized objects
        if ('molds' in variation) {
          const molds = variation.molds;
          expect(molds.options.length).toBeGreaterThan(0);

          const firstMold = molds.options[0].mold;
          expect(firstMold).toHaveProperty('id');
          expect(firstMold).toHaveProperty('manufacturer');
          expect(firstMold.entity).toBeDefined();
        }
      });
    });

    test('confection variation has materialized ingredients in chocolate specs (not just IDs)', () => {
      const result = ctx.confections.get('common.dark-dome-bonbon' as ConfectionId);

      expect(result).toSucceedAndSatisfy((confection) => {
        const variation = confection.goldenVariation;

        // For molded bonbons, shell chocolate should have materialized ingredients
        if ('shellChocolate' in variation) {
          const shellChocolate = variation.shellChocolate;
          expect(shellChocolate.chocolate).toBeDefined();
          expect(typeof shellChocolate.chocolate.isChocolate).toBe('function');
          expect(shellChocolate.chocolate.isChocolate()).toBe(true);
        }
      });
    });

    test('get() fails for non-existent confection', () => {
      const result = ctx.confections.get('common.nonexistent' as ConfectionId);
      expect(result).toFail();
    });

    test('caches materialized confections', () => {
      const result1 = ctx.confections.get('common.dark-dome-bonbon' as ConfectionId).orThrow();
      const result2 = ctx.confections.get('common.dark-dome-bonbon' as ConfectionId).orThrow();

      expect(result1).toBe(result2); // Same instance
    });
  });

  // ============================================================================
  // Cross-Library References
  // ============================================================================

  describe('cross-library materialized references', () => {
    test('filling procedures reference materialized procedure entities', () => {
      const result = ctx.fillings.get('common.dark-ganache-classic' as FillingId);

      expect(result).toSucceedAndSatisfy((filling) => {
        const variation = filling.goldenVariation;
        const procedures = variation.procedures;

        if (procedures) {
          expect(procedures.procedures.length).toBeGreaterThan(0);
          const firstProcedure = procedures.procedures[0];

          // Procedure should be entity (data layer), not materialized
          expect(firstProcedure.procedure).toHaveProperty('name');
          expect(firstProcedure.procedure).toHaveProperty('steps');
        }
      });
    });

    test('confection fillings reference materialized filling recipes', () => {
      const result = ctx.confections.get('common.dark-dome-bonbon' as ConfectionId);

      expect(result).toSucceedAndSatisfy((confection) => {
        const variation = confection.goldenVariation;
        const fillings = variation.fillings;

        if (fillings && fillings.length > 0) {
          const firstSlot = fillings[0];
          const fillingOptions = firstSlot.filling.options;

          expect(fillingOptions.length).toBeGreaterThan(0);
          const firstOption = fillingOptions[0];

          if (firstOption.type === 'recipe') {
            // Filling should be a materialized class instance
            expect(firstOption.filling).toHaveProperty('id');
            expect(typeof firstOption.filling.getVariation).toBe('function');
          }
        }
      });
    });
  });

  // ============================================================================
  // MaterializedLibrary: getPreferred and getWithAlternates
  // ============================================================================

  describe('getPreferred and getWithAlternates', () => {
    test('getPreferred returns preferred item from IIdsWithPreferred', () => {
      // Get some actual ingredient IDs from the library
      const allIds = Array.from(ctx.ingredients.values())
        .slice(0, 3)
        .map((i) => i.id);
      const spec = {
        ids: [allIds[0], allIds[1]],
        preferredId: allIds[1]
      };

      expect(ctx.ingredients.getPreferred(spec)).toSucceedAndSatisfy((ingredient) => {
        expect(ingredient.id).toBe(allIds[1]);
      });
    });

    test('getPreferred uses first ID when no preferredId specified', () => {
      const allIds = Array.from(ctx.ingredients.values())
        .slice(0, 2)
        .map((i) => i.id);
      const spec = {
        ids: [allIds[0], allIds[1]]
      };

      expect(ctx.ingredients.getPreferred(spec)).toSucceedAndSatisfy((ingredient) => {
        expect(ingredient.id).toBe(allIds[0]);
      });
    });

    test('getPreferred fails when no IDs provided', () => {
      const spec = {
        ids: []
      };

      expect(ctx.ingredients.getPreferred(spec)).toFailWith(/no ids provided/i);
    });

    test('getWithAlternates returns primary and alternates from IIdsWithPreferred', () => {
      const allIds = Array.from(ctx.ingredients.values())
        .slice(0, 3)
        .map((i) => i.id);
      const spec = {
        ids: [allIds[0], allIds[1], allIds[2]],
        preferredId: allIds[1]
      };

      expect(ctx.ingredients.getWithAlternates(spec)).toSucceedAndSatisfy((result) => {
        expect(result.primary.id).toBe(allIds[1]);
        expect(result.alternates.length).toBe(2);
        expect(result.alternates.some((i) => i.id === allIds[0])).toBe(true);
        expect(result.alternates.some((i) => i.id === allIds[2])).toBe(true);
        expect(result.entity).toBe(spec);
      });
    });

    test('getWithAlternates handles primary ID not in list', () => {
      const allIds = Array.from(ctx.ingredients.values())
        .slice(0, 3)
        .map((i) => i.id);
      const spec = {
        ids: [allIds[0]],
        preferredId: allIds[1]
      };

      expect(ctx.ingredients.getWithAlternates(spec)).toSucceedAndSatisfy((result) => {
        expect(result.primary.id).toBe(allIds[1]);
        expect(result.alternates.length).toBe(1);
        expect(result.alternates[0].id).toBe(allIds[0]);
      });
    });

    test('getWithAlternates fails when primary ID does not exist', () => {
      const spec = {
        ids: ['common.nonexistent' as IngredientId, 'common.chocolate-dark-64' as IngredientId],
        preferredId: 'common.nonexistent' as IngredientId
      };

      expect(ctx.ingredients.getWithAlternates(spec)).toFailWith(/failed to resolve primary item/i);
    });

    test('getWithAlternates skips invalid alternate IDs', () => {
      const allIds = Array.from(ctx.ingredients.values())
        .slice(0, 2)
        .map((i) => i.id);
      const spec = {
        ids: [allIds[0], 'common.nonexistent' as IngredientId, allIds[1]],
        preferredId: allIds[0]
      };

      expect(ctx.ingredients.getWithAlternates(spec)).toSucceedAndSatisfy((result) => {
        expect(result.primary.id).toBe(allIds[0]);
        expect(result.alternates.length).toBe(1);
        expect(result.alternates[0].id).toBe(allIds[1]);
      });
    });
  });

  // ============================================================================
  // MaterializedLibrary: getPreferredRef and getRefsWithAlternates
  // ============================================================================

  describe('getPreferredRef and getRefsWithAlternates', () => {
    test('getPreferredRef returns preferred item with notes', () => {
      const allIds = Array.from(ctx.ingredients.values())
        .slice(0, 2)
        .map((i) => i.id);
      const spec: Model.IOptionsWithPreferred<Model.IRefWithNotes<IngredientId>, IngredientId> = {
        options: [
          {
            id: allIds[0],
            notes: [
              { category: 'general' as unknown as Model.ICategorizedNote['category'], note: 'First choice' }
            ]
          },
          {
            id: allIds[1],
            notes: [{ category: 'general' as unknown as Model.ICategorizedNote['category'], note: 'Backup' }]
          }
        ],
        preferredId: allIds[0]
      };

      expect(ctx.ingredients.getPreferredRef(spec)).toSucceedAndSatisfy((result) => {
        expect(result.item.id).toBe(allIds[0]);
        expect(result.id).toBe(allIds[0]);
        expect(result.notes).toBeDefined();
        expect(result.notes?.length).toBe(1);
        expect(result.notes?.[0].note).toBe('First choice');
      });
    });

    test('getPreferredRef uses first option when no preferredId specified', () => {
      const spec = {
        options: [
          { id: 'common.chocolate-dark-64' as IngredientId },
          { id: 'common.chocolate-dark-70' as IngredientId }
        ]
      };

      expect(ctx.ingredients.getPreferredRef(spec)).toSucceedAndSatisfy((result) => {
        expect(result.item.id).toBe('common.chocolate-dark-64');
        expect(result.notes).toBeUndefined();
      });
    });

    test('getPreferredRef fails when no options provided', () => {
      const spec = {
        options: []
      };

      expect(ctx.ingredients.getPreferredRef(spec)).toFailWith(/no options provided/i);
    });

    test('getPreferredRef fails when preferred ID not in options', () => {
      const spec = {
        options: [{ id: 'common.chocolate-dark-64' as IngredientId }],
        preferredId: 'common.chocolate-dark-70' as IngredientId
      };

      expect(ctx.ingredients.getPreferredRef(spec)).toFailWith(/preferred id.*not found in options/i);
    });

    test('getRefsWithAlternates returns primary and alternates with notes', () => {
      const allIds = Array.from(ctx.ingredients.values())
        .slice(0, 3)
        .map((i) => i.id);
      const spec: Model.IOptionsWithPreferred<Model.IRefWithNotes<IngredientId>, IngredientId> = {
        options: [
          {
            id: allIds[0],
            notes: [
              { category: 'general' as unknown as Model.ICategorizedNote['category'], note: 'First choice' }
            ]
          },
          {
            id: allIds[1],
            notes: [
              { category: 'general' as unknown as Model.ICategorizedNote['category'], note: 'Good backup' }
            ]
          },
          { id: allIds[2] }
        ],
        preferredId: allIds[1]
      };

      expect(ctx.ingredients.getRefsWithAlternates(spec)).toSucceedAndSatisfy((result) => {
        expect(result.primary.id).toBe(allIds[1]);
        expect(result.primaryId).toBe(allIds[1]);
        expect(result.primaryNotes).toBeDefined();
        expect(result.primaryNotes?.length).toBe(1);
        expect(result.primaryNotes?.[0].note).toBe('Good backup');

        expect(result.alternates.length).toBe(2);
        const alt1 = result.alternates.find((a) => a.id === allIds[0]);
        expect(alt1).toBeDefined();
        expect(alt1?.notes).toBeDefined();
        expect(alt1?.notes?.length).toBe(1);
        expect(alt1?.notes?.[0].note).toBe('First choice');

        const alt2 = result.alternates.find((a) => a.id === allIds[2]);
        expect(alt2).toBeDefined();
        expect(alt2?.notes).toBeUndefined();
      });
    });

    test('getRefsWithAlternates skips invalid alternate IDs', () => {
      const allIds = Array.from(ctx.ingredients.values())
        .slice(0, 2)
        .map((i) => i.id);
      const spec = {
        options: [{ id: allIds[0] }, { id: 'common.nonexistent' as IngredientId }, { id: allIds[1] }],
        preferredId: allIds[0]
      };

      expect(ctx.ingredients.getRefsWithAlternates(spec)).toSucceedAndSatisfy((result) => {
        expect(result.primary.id).toBe(allIds[0]);
        expect(result.alternates.length).toBe(1);
        expect(result.alternates[0].id).toBe(allIds[1]);
      });
    });
  });

  // ============================================================================
  // MaterializedLibrary: hasFindSupport and find
  // ============================================================================

  describe('hasFindSupport and find', () => {
    test('ingredients library has find support', () => {
      expect(ctx.ingredients.hasFindSupport).toBe(true);
    });

    test('fillings library has find support', () => {
      expect(ctx.fillings.hasFindSupport).toBe(true);
    });

    test('molds library does not have find support', () => {
      expect(ctx.molds.hasFindSupport).toBe(false);
    });

    test('procedures library does not have find support', () => {
      expect(ctx.procedures.hasFindSupport).toBe(false);
    });

    test('tasks library does not have find support', () => {
      expect(ctx.tasks.hasFindSupport).toBe(false);
    });

    test('confections library does not have find support', () => {
      expect(ctx.confections.hasFindSupport).toBe(false);
    });

    test('find fails on library without find support', () => {
      expect(ctx.molds.find({} as never)).toFailWith(/find not supported/i);
    });

    test('find succeeds on ingredients library with tag query', () => {
      // Just verify find works and returns an array (may be empty if no items have tags)
      expect(ctx.ingredients.find({ byTag: { tag: 'test-tag' } })).toSucceedAndSatisfy((results) => {
        expect(Array.isArray(results)).toBe(true);
      });
    });

    test('find succeeds on fillings library with tag query', () => {
      // Just verify find works and returns an array (may be empty if no items have tags)
      expect(ctx.fillings.find({ byTag: { tag: 'test-tag' } })).toSucceedAndSatisfy((results) => {
        expect(Array.isArray(results)).toBe(true);
      });
    });
  });

  // ============================================================================
  // ChocolateEntityLibrary: Editable Collections
  // ============================================================================

  describe('editable entity collections', () => {
    test('getEditableIngredientsEntityCollection returns editable collection', () => {
      expect(
        ctx.entities.getEditableIngredientsEntityCollection('common' as unknown as CollectionId)
      ).toSucceed();
    });

    test('getEditableIngredientsEntityCollection fails for non-existent collection', () => {
      expect(
        ctx.entities.getEditableIngredientsEntityCollection('nonexistent' as unknown as CollectionId)
      ).toFail();
    });

    test('getEditableFillingsRecipeEntityCollection returns editable collection', () => {
      expect(
        ctx.entities.getEditableFillingsRecipeEntityCollection('common' as unknown as CollectionId)
      ).toSucceed();
    });

    test('getEditableMoldsEntityCollection returns editable collection', () => {
      expect(ctx.entities.getEditableMoldsEntityCollection('common' as unknown as CollectionId)).toSucceed();
    });

    test('getEditableProceduresEntityCollection returns editable collection', () => {
      expect(
        ctx.entities.getEditableProceduresEntityCollection('common' as unknown as CollectionId)
      ).toSucceed();
    });

    test('getEditableTasksEntityCollection returns editable collection', () => {
      expect(ctx.entities.getEditableTasksEntityCollection('common' as unknown as CollectionId)).toSucceed();
    });

    test('getEditableConfectionsEntityCollection returns editable collection', () => {
      expect(
        ctx.entities.getEditableConfectionsEntityCollection('common' as unknown as CollectionId)
      ).toSucceed();
    });
  });

  // ============================================================================
  // ChocolateLibrary: Utility Methods
  // ============================================================================

  describe('ChocolateLibrary utility methods', () => {
    test('getIngredientUsage returns usage info for valid ingredient', () => {
      expect(ctx.getIngredientUsage('common.chocolate-dark-64' as IngredientId)).toSucceedAndSatisfy(
        (usage) => {
          expect(Array.isArray(usage)).toBe(true);
        }
      );
    });

    test('getIngredientUsage fails for non-existent ingredient', () => {
      expect(ctx.getIngredientUsage('common.nonexistent' as IngredientId)).toFailWith(
        /ingredient not found/i
      );
    });

    test('getAllFillingTags returns array of tags', () => {
      const tags = ctx.getAllFillingTags();
      expect(Array.isArray(tags)).toBe(true);
      expect(tags.length).toBeGreaterThan(0);
    });

    test('getAllIngredientTags returns array of tags', () => {
      const tags = ctx.getAllIngredientTags();
      expect(Array.isArray(tags)).toBe(true);
      expect(tags.length).toBeGreaterThan(0);
    });

    test('getAllConfectionTags returns array of tags', () => {
      const tags = ctx.getAllConfectionTags();
      expect(Array.isArray(tags)).toBe(true);
    });

    test('cachedIngredientCount reflects accessed ingredients', () => {
      const countBefore = ctx.cachedIngredientCount;
      ctx.ingredients.get('common.chocolate-dark-64' as IngredientId).orThrow();
      const countAfter = ctx.cachedIngredientCount;
      expect(countAfter).toBeGreaterThanOrEqual(countBefore);
    });

    test('cachedRecipeCount reflects accessed recipes', () => {
      const countBefore = ctx.cachedRecipeCount;
      ctx.fillings.get('common.dark-ganache-classic' as FillingId).orThrow();
      const countAfter = ctx.cachedRecipeCount;
      expect(countAfter).toBeGreaterThanOrEqual(countBefore);
    });

    test('cachedConfectionCount reflects accessed confections', () => {
      const countBefore = ctx.cachedConfectionCount;
      ctx.confections.get('common.dark-dome-bonbon' as ConfectionId).orThrow();
      const countAfter = ctx.cachedConfectionCount;
      expect(countAfter).toBeGreaterThanOrEqual(countBefore);
    });

    test('warmUp pre-loads indexes', () => {
      ctx.warmUp();
      // Just verify it doesn't throw
      expect(true).toBe(true);
    });

    test('invalidateIndexers clears indexer caches', () => {
      ctx.invalidateIndexers();
      // Just verify it doesn't throw
      expect(true).toBe(true);
    });

    test('createWeightContext returns weight calculation context', () => {
      const weightCtx = ctx.createWeightContext();
      expect(weightCtx).toHaveProperty('getIngredientDensity');
      expect(typeof weightCtx.getIngredientDensity).toBe('function');

      // Test density lookup
      const density = weightCtx.getIngredientDensity('common.chocolate-dark-64' as IngredientId);
      expect(typeof density).toBe('number');
      expect(density).toBeGreaterThan(0);
    });

    test('createWeightContext returns default density for non-existent ingredient', () => {
      const weightCtx = ctx.createWeightContext();
      const density = weightCtx.getIngredientDensity('common.nonexistent' as IngredientId);
      expect(density).toBe(1.0);
    });
  });

  // ============================================================================
  // ChocolateLibrary: preWarm during creation
  // ============================================================================

  describe('ChocolateLibrary creation with preWarm', () => {
    test('create with preWarm=true succeeds', () => {
      expect(ChocolateLibrary.create({ entityLibraryParams: { builtin: true }, preWarm: true })).toSucceed();
    });

    test('create with preWarm=false succeeds', () => {
      expect(ChocolateLibrary.create({ entityLibraryParams: { builtin: true }, preWarm: false })).toSucceed();
    });
  });

  // ============================================================================
  // ChocolateLibrary: Internal accessor methods
  // ============================================================================

  describe('ChocolateLibrary internal accessors', () => {
    test('_getIngredient returns ingredient', () => {
      expect(ctx._getIngredient('common.chocolate-dark-64' as IngredientId)).toSucceed();
    });

    test('_getIngredient fails for non-existent ingredient', () => {
      expect(ctx._getIngredient('common.nonexistent' as IngredientId)).toFail();
    });

    test('_getFillingRecipe returns filling recipe', () => {
      expect(ctx._getFillingRecipe('common.dark-ganache-classic' as FillingId)).toSucceed();
    });

    test('_getFillingRecipe fails for non-existent filling', () => {
      expect(ctx._getFillingRecipe('common.nonexistent' as FillingId)).toFail();
    });
  });

  // ============================================================================
  // Edge Cases
  // ============================================================================

  describe('edge cases', () => {
    test('accessing same entity through different libraries returns same instance', () => {
      const ingredientDirect = ctx.ingredients.get('common.chocolate-dark-64' as IngredientId).orThrow();

      // Access the same ingredient through a filling's ingredients
      const filling = ctx.fillings.get('common.dark-ganache-classic' as FillingId).orThrow();
      const ingredientsResult = filling.goldenVariation.getIngredients();

      expect(ingredientsResult).toSucceedAndSatisfy((ingredients) => {
        const chocolateIngredient = Array.from(ingredients).find(
          (ri) => ri.ingredient.id === 'common.chocolate-dark-64'
        );

        if (chocolateIngredient) {
          // Should be the same cached instance
          expect(chocolateIngredient.ingredient).toBe(ingredientDirect);
        }
      });
    });

    test('library size reflects actual entity count', () => {
      expect(ctx.ingredients.size).toBeGreaterThan(0);
      expect(ctx.fillings.size).toBeGreaterThan(0);
      expect(ctx.molds.size).toBeGreaterThan(0);
      expect(ctx.procedures.size).toBeGreaterThan(0);
      expect(ctx.tasks.size).toBeGreaterThan(0);
      expect(ctx.confections.size).toBeGreaterThan(0);
    });
  });
});
