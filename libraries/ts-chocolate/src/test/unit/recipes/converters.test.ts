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

// eslint-disable-next-line @rushstack/packlets/mechanics
import {
  recipeIngredient,
  recipeVersion,
  recipe,
  scaledRecipeIngredient,
  scalingRef,
  scaledRecipeVersion,
  recipeProcedureRef,
  recipeProcedures
} from '../../../packlets/recipes/converters';

describe('Recipe Converters', () => {
  // ============================================================================
  // recipeIngredient Converter
  // ============================================================================

  describe('recipeIngredient', () => {
    test('converts valid recipe ingredient', () => {
      const input = {
        ingredientId: 'source.ingredient',
        amount: 100
      };
      expect(recipeIngredient.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.ingredientId).toBe('source.ingredient');
        expect(result.amount).toBe(100);
      });
    });

    test('converts recipe ingredient with notes', () => {
      const input = {
        ingredientId: 'source.ingredient',
        amount: 50,
        notes: 'Melted first'
      };
      expect(recipeIngredient.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.notes).toBe('Melted first');
      });
    });

    test('fails for invalid ingredient ID', () => {
      const input = {
        ingredientId: 'invalid',
        amount: 100
      };
      expect(recipeIngredient.convert(input)).toFail();
    });

    test('fails for negative amount', () => {
      const input = {
        ingredientId: 'source.ingredient',
        amount: -10
      };
      expect(recipeIngredient.convert(input)).toFail();
    });
  });

  // ============================================================================
  // recipeVersion Converter
  // ============================================================================

  describe('recipeVersion', () => {
    test('converts valid recipe version', () => {
      const input = {
        versionSpec: '2026-01-01-01',
        createdDate: '2026-01-01',
        ingredients: [
          { ingredientId: 'source.chocolate', amount: 100 },
          { ingredientId: 'source.cream', amount: 50 }
        ],
        baseWeight: 150
      };
      expect(recipeVersion.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.versionSpec).toBe('2026-01-01-01');
        expect(result.createdDate).toBe('2026-01-01');
        expect(result.ingredients.length).toBe(2);
        expect(result.baseWeight).toBe(150);
      });
    });

    test('converts recipe version with optional fields', () => {
      const input = {
        versionSpec: '2026-01-01-01',
        createdDate: '2026-01-01',
        ingredients: [{ ingredientId: 'source.chocolate', amount: 100 }],
        baseWeight: 100,
        yield: '20 bonbons',
        notes: 'First version'
      };
      expect(recipeVersion.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.yield).toBe('20 bonbons');
        expect(result.notes).toBe('First version');
      });
    });
  });

  // ============================================================================
  // recipe Converter
  // ============================================================================

  describe('recipe', () => {
    const validVersion = {
      versionSpec: '2026-01-01-01',
      createdDate: '2026-01-01',
      ingredients: [{ ingredientId: 'source.chocolate', amount: 100 }],
      baseWeight: 100
    };

    test('converts valid recipe', () => {
      const input = {
        baseId: 'test-recipe',
        name: 'Test Recipe',
        category: 'ganache',
        versions: [validVersion],
        goldenVersionSpec: '2026-01-01-01'
      };
      expect(recipe.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.baseId).toBe('test-recipe');
        expect(result.name).toBe('Test Recipe');
        expect(result.goldenVersionSpec).toBe('2026-01-01-01');
        expect(result.goldenVersion).toBe(result.versions[0]);
      });
    });

    test('converts recipe with optional fields', () => {
      const input = {
        baseId: 'test-recipe',
        name: 'Test Recipe',
        category: 'ganache',
        description: 'A test recipe',
        tags: ['dark', 'ganache'],
        versions: [validVersion],
        goldenVersionSpec: '2026-01-01-01'
      };
      expect(recipe.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.description).toBe('A test recipe');
        expect(result.tags).toEqual(['dark', 'ganache']);
      });
    });

    test('converts recipe with procedures', () => {
      const input = {
        baseId: 'test-recipe',
        name: 'Test Recipe',
        category: 'ganache',
        versions: [validVersion],
        goldenVersionSpec: '2026-01-01-01',
        recipeProcedures: {
          procedures: [
            { procedureId: 'common.ganache-cold-method', notes: 'Preferred' },
            { procedureId: 'common.ganache-hot-method' }
          ],
          recommendedProcedureId: 'common.ganache-cold-method'
        }
      };
      expect(recipe.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.recipeProcedures).toBeDefined();
        expect(result.recipeProcedures!.procedures.length).toBe(2);
        expect(result.recipeProcedures!.procedures[0].procedureId).toBe('common.ganache-cold-method');
        expect(result.recipeProcedures!.procedures[0].notes).toBe('Preferred');
        expect(result.recipeProcedures!.recommendedProcedureId).toBe('common.ganache-cold-method');
      });
    });

    test('converts recipe without procedures', () => {
      const input = {
        baseId: 'test-recipe',
        name: 'Test Recipe',
        category: 'ganache',
        versions: [validVersion],
        goldenVersionSpec: '2026-01-01-01'
      };
      expect(recipe.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.recipeProcedures).toBeUndefined();
      });
    });

    test('fails for recipe with empty versions array', () => {
      const input = {
        baseId: 'test-recipe',
        name: 'Test Recipe',
        category: 'ganache',
        versions: [],
        goldenVersionSpec: '2026-01-01-01'
      };
      expect(recipe.convert(input)).toFailWith(/Recipe must have at least one version/);
    });

    test('fails for recipe with invalid goldenVersionSpec', () => {
      const input = {
        baseId: 'test-recipe',
        name: 'Test Recipe',
        category: 'ganache',
        versions: [validVersion],
        goldenVersionSpec: '2026-12-31-99'
      };
      expect(recipe.convert(input)).toFailWith(/Golden version.*not found/);
    });

    test('fails for invalid base ID', () => {
      const input = {
        baseId: 'invalid.id',
        name: 'Test Recipe',
        category: 'ganache',
        versions: [validVersion],
        goldenVersionSpec: '2026-01-01-01'
      };
      expect(recipe.convert(input)).toFail();
    });

    test('fails for empty name', () => {
      const input = {
        baseId: 'test-recipe',
        name: '',
        category: 'ganache',
        versions: [validVersion],
        goldenVersionSpec: '2026-01-01-01'
      };
      expect(recipe.convert(input)).toFail();
    });
  });

  // ============================================================================
  // recipeProcedureRef Converter
  // ============================================================================

  describe('recipeProcedureRef', () => {
    test('converts valid procedure reference', () => {
      const input = {
        procedureId: 'common.ganache-cold-method'
      };
      expect(recipeProcedureRef.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.procedureId).toBe('common.ganache-cold-method');
        expect(result.notes).toBeUndefined();
      });
    });

    test('converts procedure reference with notes', () => {
      const input = {
        procedureId: 'common.ganache-hot-method',
        notes: 'Use for this specific chocolate'
      };
      expect(recipeProcedureRef.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.procedureId).toBe('common.ganache-hot-method');
        expect(result.notes).toBe('Use for this specific chocolate');
      });
    });

    test('fails for invalid procedure ID format', () => {
      const input = {
        procedureId: 'invalid'
      };
      expect(recipeProcedureRef.convert(input)).toFail();
    });

    test('fails for missing procedure ID', () => {
      const input = {
        notes: 'Some notes'
      };
      expect(recipeProcedureRef.convert(input)).toFail();
    });
  });

  // ============================================================================
  // recipeProcedures Converter
  // ============================================================================

  describe('recipeProcedures', () => {
    test('converts valid procedures collection', () => {
      const input = {
        procedures: [
          { procedureId: 'common.ganache-cold-method' },
          { procedureId: 'common.ganache-hot-method' }
        ]
      };
      expect(recipeProcedures.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.procedures.length).toBe(2);
        expect(result.procedures[0].procedureId).toBe('common.ganache-cold-method');
        expect(result.procedures[1].procedureId).toBe('common.ganache-hot-method');
        expect(result.recommendedProcedureId).toBeUndefined();
      });
    });

    test('converts procedures with recommended ID', () => {
      const input = {
        procedures: [
          { procedureId: 'common.ganache-cold-method' },
          { procedureId: 'common.ganache-hot-method' }
        ],
        recommendedProcedureId: 'common.ganache-cold-method'
      };
      expect(recipeProcedures.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.procedures.length).toBe(2);
        expect(result.recommendedProcedureId).toBe('common.ganache-cold-method');
      });
    });

    test('converts procedures with notes on individual refs', () => {
      const input = {
        procedures: [
          { procedureId: 'common.ganache-cold-method', notes: 'Preferred for dark chocolate' },
          { procedureId: 'common.ganache-hot-method', notes: 'Alternative method' }
        ],
        recommendedProcedureId: 'common.ganache-cold-method'
      };
      expect(recipeProcedures.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.procedures[0].notes).toBe('Preferred for dark chocolate');
        expect(result.procedures[1].notes).toBe('Alternative method');
      });
    });

    test('fails for empty procedures array', () => {
      const input = {
        procedures: []
      };
      // Empty array is valid - no minimum requirement
      expect(recipeProcedures.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.procedures.length).toBe(0);
      });
    });

    test('fails for invalid procedure ID in array', () => {
      const input = {
        procedures: [{ procedureId: 'common.ganache-cold-method' }, { procedureId: 'invalid' }]
      };
      expect(recipeProcedures.convert(input)).toFail();
    });

    test('fails for invalid recommended procedure ID', () => {
      const input = {
        procedures: [{ procedureId: 'common.ganache-cold-method' }],
        recommendedProcedureId: 'invalid'
      };
      expect(recipeProcedures.convert(input)).toFail();
    });

    test('fails for missing procedures field', () => {
      const input = {
        recommendedProcedureId: 'common.ganache-cold-method'
      };
      expect(recipeProcedures.convert(input)).toFail();
    });
  });

  // ============================================================================
  // scaledRecipeIngredient Converter
  // ============================================================================

  describe('scaledRecipeIngredient', () => {
    test('converts valid scaled recipe ingredient', () => {
      const input = {
        ingredientId: 'source.chocolate',
        amount: 200,
        originalAmount: 100,
        scaleFactor: 2
      };
      expect(scaledRecipeIngredient.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.ingredientId).toBe('source.chocolate');
        expect(result.amount).toBe(200);
        expect(result.originalAmount).toBe(100);
        expect(result.scaleFactor).toBe(2);
      });
    });

    test('converts with optional notes', () => {
      const input = {
        ingredientId: 'source.chocolate',
        amount: 200,
        originalAmount: 100,
        scaleFactor: 2,
        notes: 'Tempered'
      };
      expect(scaledRecipeIngredient.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.notes).toBe('Tempered');
      });
    });
  });

  // ============================================================================
  // scalingRef Converter
  // ============================================================================

  describe('scalingRef', () => {
    test('converts valid scaling ref', () => {
      const input = {
        sourceVersionId: 'source.test-recipe@2026-01-01-01',
        scaleFactor: 2,
        targetWeight: 300,
        createdDate: '2026-01-15'
      };
      expect(scalingRef.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.sourceVersionId).toBe('source.test-recipe@2026-01-01-01');
        expect(result.scaleFactor).toBe(2);
        expect(result.targetWeight).toBe(300);
        expect(result.createdDate).toBe('2026-01-15');
      });
    });

    test('fails for invalid recipe version ID', () => {
      const input = {
        sourceVersionId: 'invalid',
        scaleFactor: 2,
        targetWeight: 300,
        createdDate: '2026-01-15'
      };
      expect(scalingRef.convert(input)).toFail();
    });

    test('fails for invalid version spec in ID', () => {
      const input = {
        sourceVersionId: 'source.test-recipe@invalid',
        scaleFactor: 2,
        targetWeight: 300,
        createdDate: '2026-01-15'
      };
      expect(scalingRef.convert(input)).toFail();
    });
  });

  // ============================================================================
  // scaledRecipeVersion Converter (reference-based format)
  // ============================================================================

  describe('scaledRecipeVersion', () => {
    const validScalingRef = {
      sourceVersionId: 'source.test-recipe@2026-01-01-01',
      scaleFactor: 2,
      targetWeight: 300,
      createdDate: '2026-01-15'
    };

    test('converts valid scaled recipe version', () => {
      const input = {
        scalingRef: validScalingRef
      };
      expect(scaledRecipeVersion.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.scalingRef.sourceVersionId).toBe('source.test-recipe@2026-01-01-01');
        expect(result.scalingRef.scaleFactor).toBe(2);
        expect(result.scalingRef.targetWeight).toBe(300);
      });
    });

    test('converts with optional notes', () => {
      const input = {
        scalingRef: validScalingRef,
        notes: 'Scaled from original'
      };
      expect(scaledRecipeVersion.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.notes).toBe('Scaled from original');
      });
    });

    test('converts with optional snapshot ingredients', () => {
      const input = {
        scalingRef: validScalingRef,
        snapshotIngredients: [
          {
            ingredientId: 'source.chocolate',
            originalAmount: 100,
            scaledAmount: 200
          }
        ]
      };
      expect(scaledRecipeVersion.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.snapshotIngredients).toBeDefined();
        expect(result.snapshotIngredients!.length).toBe(1);
        expect(result.snapshotIngredients![0].ingredientId).toBe('source.chocolate');
        expect(result.snapshotIngredients![0].originalAmount).toBe(100);
        expect(result.snapshotIngredients![0].scaledAmount).toBe(200);
      });
    });

    test('fails for invalid scaling ref', () => {
      const input = {
        scalingRef: {
          ...validScalingRef,
          sourceVersionId: 'invalid'
        }
      };
      expect(scaledRecipeVersion.convert(input)).toFail();
    });
  });

  // ============================================================================
  // Recipe Class Tests
  // ============================================================================

  describe('Recipe class', () => {
    const version1 = {
      versionSpec: '2026-01-01-01',
      createdDate: '2026-01-01',
      ingredients: [{ ingredientId: 'source.chocolate', amount: 100 }],
      baseWeight: 100
    };

    const version2 = {
      versionSpec: '2026-01-02-01',
      createdDate: '2026-01-02',
      ingredients: [{ ingredientId: 'source.chocolate', amount: 150 }],
      baseWeight: 150
    };

    test('getVersion returns requested version', () => {
      const recipeData = {
        baseId: 'test-recipe',
        name: 'Test Recipe',
        category: 'ganache',
        versions: [version1, version2],
        goldenVersionSpec: '2026-01-01-01'
      };

      expect(recipe.convert(recipeData)).toSucceedAndSatisfy((result) => {
        expect(
          result.getVersion(
            '2026-01-02-01' as unknown as import('../../../packlets/common').RecipeVersionSpec
          )
        ).toSucceedAndSatisfy((v) => {
          expect(v.versionSpec).toBe('2026-01-02-01');
          expect(v.baseWeight).toBe(150);
        });
      });
    });

    test('getVersion fails for non-existent version', () => {
      const recipeData = {
        baseId: 'test-recipe',
        name: 'Test Recipe',
        category: 'ganache',
        versions: [version1],
        goldenVersionSpec: '2026-01-01-01'
      };

      expect(recipe.convert(recipeData)).toSucceedAndSatisfy((result) => {
        expect(
          result.getVersion(
            '2026-12-31-99' as unknown as import('../../../packlets/common').RecipeVersionSpec
          )
        ).toFailWith(/not found/);
      });
    });
  });
});
