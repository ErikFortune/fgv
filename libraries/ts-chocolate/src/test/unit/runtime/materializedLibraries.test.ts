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
import { RuntimeContext } from '../../../packlets/runtime';
import { ConfectionId, FillingId, IngredientId, MoldId, ProcedureId, TaskId } from '../../../packlets/common';

describe('MaterializedLibrary Functionality Tests', () => {
  let ctx: RuntimeContext;

  beforeEach(() => {
    ctx = RuntimeContext.create({ libraryParams: { builtin: true } }).orThrow();
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
    test('get() returns materialized filling with versions', () => {
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
        const version = filling.goldenVariation;
        expect(version).toBeDefined();

        // Ingredients should be materialized objects with methods
        const ingredientsResult = version.getIngredients();
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

    test('confection version has materialized molds (not just IDs)', () => {
      const result = ctx.confections.get('common.dark-dome-bonbon' as ConfectionId);

      expect(result).toSucceedAndSatisfy((confection) => {
        const version = confection.goldenVariation;

        // For molded bonbons, molds should be materialized objects
        if ('molds' in version) {
          const molds = version.molds;
          expect(molds.options.length).toBeGreaterThan(0);

          const firstMold = molds.options[0].mold;
          expect(firstMold).toHaveProperty('id');
          expect(firstMold).toHaveProperty('manufacturer');
          expect(firstMold.entity).toBeDefined();
        }
      });
    });

    test('confection version has materialized ingredients in chocolate specs (not just IDs)', () => {
      const result = ctx.confections.get('common.dark-dome-bonbon' as ConfectionId);

      expect(result).toSucceedAndSatisfy((confection) => {
        const version = confection.goldenVariation;

        // For molded bonbons, shell chocolate should have materialized ingredients
        if ('shellChocolate' in version) {
          const shellChocolate = version.shellChocolate;
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
        const version = filling.goldenVariation;
        const procedures = version.procedures;

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
        const version = confection.goldenVariation;
        const fillings = version.fillings;

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
