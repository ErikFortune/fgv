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
  recipeUsage,
  recipeVersion,
  recipe,
  scaledRecipeIngredient,
  scalingSource,
  scaledRecipeVersion
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
  // recipeUsage Converter
  // ============================================================================

  describe('recipeUsage', () => {
    test('converts valid recipe usage', () => {
      const input = {
        date: '2026-01-01',
        versionId: '2026-01-01-01',
        scaledWeight: 500
      };
      expect(recipeUsage.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.date).toBe('2026-01-01');
        expect(result.versionId).toBe('2026-01-01-01');
        expect(result.scaledWeight).toBe(500);
      });
    });

    test('converts recipe usage with notes', () => {
      const input = {
        date: '2026-01-01',
        versionId: '2026-01-01-01',
        scaledWeight: 500,
        notes: 'Made for Valentine batch'
      };
      expect(recipeUsage.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.notes).toBe('Made for Valentine batch');
      });
    });
  });

  // ============================================================================
  // recipeVersion Converter
  // ============================================================================

  describe('recipeVersion', () => {
    test('converts valid recipe version', () => {
      const input = {
        versionId: '2026-01-01-01',
        createdDate: '2026-01-01',
        ingredients: [
          { ingredientId: 'source.chocolate', amount: 100 },
          { ingredientId: 'source.cream', amount: 50 }
        ],
        baseWeight: 150
      };
      expect(recipeVersion.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.versionId).toBe('2026-01-01-01');
        expect(result.createdDate).toBe('2026-01-01');
        expect(result.ingredients.length).toBe(2);
        expect(result.baseWeight).toBe(150);
      });
    });

    test('converts recipe version with optional fields', () => {
      const input = {
        versionId: '2026-01-01-01',
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
      versionId: '2026-01-01-01',
      createdDate: '2026-01-01',
      ingredients: [{ ingredientId: 'source.chocolate', amount: 100 }],
      baseWeight: 100
    };

    test('converts valid recipe', () => {
      const input = {
        baseId: 'test-recipe',
        name: 'Test Recipe',
        versions: [validVersion],
        goldenVersionId: '2026-01-01-01',
        usage: []
      };
      expect(recipe.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.baseId).toBe('test-recipe');
        expect(result.name).toBe('Test Recipe');
        expect(result.goldenVersionId).toBe('2026-01-01-01');
        expect(result.goldenVersion).toBe(result.versions[0]);
      });
    });

    test('converts recipe with optional fields', () => {
      const input = {
        baseId: 'test-recipe',
        name: 'Test Recipe',
        description: 'A test recipe',
        tags: ['dark', 'ganache'],
        versions: [validVersion],
        goldenVersionId: '2026-01-01-01',
        usage: []
      };
      expect(recipe.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.description).toBe('A test recipe');
        expect(result.tags).toEqual(['dark', 'ganache']);
      });
    });

    test('fails for recipe with empty versions array', () => {
      const input = {
        baseId: 'test-recipe',
        name: 'Test Recipe',
        versions: [],
        goldenVersionId: '2026-01-01-01',
        usage: []
      };
      expect(recipe.convert(input)).toFailWith(/Recipe must have at least one version/);
    });

    test('fails for recipe with invalid goldenVersionId', () => {
      const input = {
        baseId: 'test-recipe',
        name: 'Test Recipe',
        versions: [validVersion],
        goldenVersionId: '2026-12-31-99',
        usage: []
      };
      expect(recipe.convert(input)).toFailWith(/Golden version.*not found/);
    });

    test('fails for invalid base ID', () => {
      const input = {
        baseId: 'invalid.id',
        name: 'Test Recipe',
        versions: [validVersion],
        goldenVersionId: '2026-01-01-01',
        usage: []
      };
      expect(recipe.convert(input)).toFail();
    });

    test('fails for empty name', () => {
      const input = {
        baseId: 'test-recipe',
        name: '',
        versions: [validVersion],
        goldenVersionId: '2026-01-01-01',
        usage: []
      };
      expect(recipe.convert(input)).toFail();
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
  // scalingSource Converter
  // ============================================================================

  describe('scalingSource', () => {
    test('converts valid scaling source', () => {
      const input = {
        recipeId: 'test-recipe',
        versionId: '2026-01-01-01',
        scaleFactor: 2,
        targetWeight: 300
      };
      expect(scalingSource.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.recipeId).toBe('test-recipe');
        expect(result.versionId).toBe('2026-01-01-01');
        expect(result.scaleFactor).toBe(2);
        expect(result.targetWeight).toBe(300);
      });
    });

    test('fails for invalid recipe ID', () => {
      const input = {
        recipeId: 'invalid.id',
        versionId: '2026-01-01-01',
        scaleFactor: 2,
        targetWeight: 300
      };
      expect(scalingSource.convert(input)).toFail();
    });

    test('fails for invalid version ID', () => {
      const input = {
        recipeId: 'test-recipe',
        versionId: 'invalid',
        scaleFactor: 2,
        targetWeight: 300
      };
      expect(scalingSource.convert(input)).toFail();
    });
  });

  // ============================================================================
  // scaledRecipeVersion Converter
  // ============================================================================

  describe('scaledRecipeVersion', () => {
    const validScalingSource = {
      recipeId: 'test-recipe',
      versionId: '2026-01-01-01',
      scaleFactor: 2,
      targetWeight: 300
    };

    const validScaledIngredient = {
      ingredientId: 'source.chocolate',
      amount: 200,
      originalAmount: 100,
      scaleFactor: 2
    };

    test('converts valid scaled recipe version', () => {
      const input = {
        scaledFrom: validScalingSource,
        createdDate: '2026-01-15',
        ingredients: [validScaledIngredient],
        baseWeight: 300
      };
      expect(scaledRecipeVersion.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.scaledFrom.recipeId).toBe('test-recipe');
        expect(result.scaledFrom.versionId).toBe('2026-01-01-01');
        expect(result.createdDate).toBe('2026-01-15');
        expect(result.ingredients.length).toBe(1);
        expect(result.baseWeight).toBe(300);
      });
    });

    test('converts with optional fields', () => {
      const input = {
        scaledFrom: validScalingSource,
        createdDate: '2026-01-15',
        ingredients: [validScaledIngredient],
        baseWeight: 300,
        yield: '40 bonbons',
        notes: 'Scaled from original'
      };
      expect(scaledRecipeVersion.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.yield).toBe('40 bonbons');
        expect(result.notes).toBe('Scaled from original');
      });
    });

    test('fails for invalid scaling source', () => {
      const input = {
        scaledFrom: { ...validScalingSource, recipeId: 'invalid.id' },
        createdDate: '2026-01-15',
        ingredients: [validScaledIngredient],
        baseWeight: 300
      };
      expect(scaledRecipeVersion.convert(input)).toFail();
    });
  });

  // ============================================================================
  // Recipe Class Tests
  // ============================================================================

  describe('Recipe class', () => {
    const version1 = {
      versionId: '2026-01-01-01',
      createdDate: '2026-01-01',
      ingredients: [{ ingredientId: 'source.chocolate', amount: 100 }],
      baseWeight: 100
    };

    const version2 = {
      versionId: '2026-01-02-01',
      createdDate: '2026-01-02',
      ingredients: [{ ingredientId: 'source.chocolate', amount: 150 }],
      baseWeight: 150
    };

    test('getVersion returns requested version', () => {
      const recipeData = {
        baseId: 'test-recipe',
        name: 'Test Recipe',
        versions: [version1, version2],
        goldenVersionId: '2026-01-01-01',
        usage: []
      };

      expect(recipe.convert(recipeData)).toSucceedAndSatisfy((result) => {
        expect(
          result.getVersion('2026-01-02-01' as unknown as import('../../../packlets/common').RecipeVersionId)
        ).toSucceedAndSatisfy((v) => {
          expect(v.versionId).toBe('2026-01-02-01');
          expect(v.baseWeight).toBe(150);
        });
      });
    });

    test('getVersion fails for non-existent version', () => {
      const recipeData = {
        baseId: 'test-recipe',
        name: 'Test Recipe',
        versions: [version1],
        goldenVersionId: '2026-01-01-01',
        usage: []
      };

      expect(recipe.convert(recipeData)).toSucceedAndSatisfy((result) => {
        expect(
          result.getVersion('2026-12-31-99' as unknown as import('../../../packlets/common').RecipeVersionId)
        ).toFailWith(/not found/);
      });
    });
  });
});
