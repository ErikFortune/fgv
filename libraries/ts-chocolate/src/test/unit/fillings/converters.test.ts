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
  fillingIngredient,
  fillingRecipeVersion,
  fillingRecipe,
  scaledFillingIngredient,
  scalingRef,
  scaledFillingRecipeVersion,
  procedureRef,
  procedures
} from '../../../packlets/fillings/converters';

describe('Recipe Converters', () => {
  // ============================================================================
  // fillingIngredient Converter
  // ============================================================================

  describe('fillingIngredient', () => {
    test('converts valid recipe ingredient', () => {
      const input = {
        ingredient: { ids: ['source.ingredient'] },
        amount: 100
      };
      expect(fillingIngredient.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.ingredient.ids[0]).toBe('source.ingredient');
        expect(result.amount).toBe(100);
      });
    });

    test('converts recipe ingredient with notes', () => {
      const input = {
        ingredient: { ids: ['source.ingredient'] },
        amount: 50,
        notes: 'Melted first'
      };
      expect(fillingIngredient.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.notes).toBe('Melted first');
      });
    });

    test('fails for invalid ingredient ID', () => {
      const input = {
        ingredient: { ids: ['invalid'] },
        amount: 100
      };
      expect(fillingIngredient.convert(input)).toFail();
    });

    test('fails for negative amount', () => {
      const input = {
        ingredient: { ids: ['source.ingredient'] },
        amount: -10
      };
      expect(fillingIngredient.convert(input)).toFail();
    });
  });

  // ============================================================================
  // fillingRecipeVersion Converter
  // ============================================================================

  describe('fillingRecipeVersion', () => {
    test('converts valid recipe version', () => {
      const input = {
        versionSpec: '2026-01-01-01',
        createdDate: '2026-01-01',
        ingredients: [
          { ingredient: { ids: ['source.chocolate'] }, amount: 100 },
          { ingredient: { ids: ['source.cream'] }, amount: 50 }
        ],
        baseWeight: 150
      };
      expect(fillingRecipeVersion.convert(input)).toSucceedAndSatisfy((result) => {
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
        ingredients: [{ ingredient: { ids: ['source.chocolate'] }, amount: 100 }],
        baseWeight: 100,
        yield: '20 bonbons',
        notes: 'First version'
      };
      expect(fillingRecipeVersion.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.yield).toBe('20 bonbons');
        expect(result.notes).toBe('First version');
      });
    });
  });

  // ============================================================================
  // fillingRecipe Converter
  // ============================================================================

  describe('fillingRecipe', () => {
    const validVersion = {
      versionSpec: '2026-01-01-01',
      createdDate: '2026-01-01',
      ingredients: [{ ingredient: { ids: ['source.chocolate'] }, amount: 100 }],
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
      expect(fillingRecipe.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.baseId).toBe('test-recipe');
        expect(result.name).toBe('Test Recipe');
        expect(result.goldenVersionSpec).toBe('2026-01-01-01');
        // Golden version can be found in versions array
        const goldenVersion = result.versions.find((v) => v.versionSpec === result.goldenVersionSpec);
        expect(goldenVersion).toBe(result.versions[0]);
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
      expect(fillingRecipe.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.description).toBe('A test recipe');
        expect(result.tags).toEqual(['dark', 'ganache']);
      });
    });

    test('converts recipe version with procedures', () => {
      const versionWithProcedures = {
        ...validVersion,
        procedures: {
          options: [
            { id: 'common.ganache-cold-method', notes: 'Preferred' },
            { id: 'common.ganache-hot-method' }
          ],
          preferredId: 'common.ganache-cold-method'
        }
      };
      const input = {
        baseId: 'test-recipe',
        name: 'Test Recipe',
        category: 'ganache',
        versions: [versionWithProcedures],
        goldenVersionSpec: '2026-01-01-01'
      };
      expect(fillingRecipe.convert(input)).toSucceedAndSatisfy((result) => {
        const goldenVersion = result.versions.find((v) => v.versionSpec === result.goldenVersionSpec);
        expect(goldenVersion?.procedures).toBeDefined();
        expect(goldenVersion?.procedures!.options.length).toBe(2);
        expect(goldenVersion?.procedures!.options[0].id).toBe('common.ganache-cold-method');
        expect(goldenVersion?.procedures!.options[0].notes).toBe('Preferred');
        expect(goldenVersion?.procedures!.preferredId).toBe('common.ganache-cold-method');
      });
    });

    test('converts recipe version without procedures', () => {
      const input = {
        baseId: 'test-recipe',
        name: 'Test Recipe',
        category: 'ganache',
        versions: [validVersion],
        goldenVersionSpec: '2026-01-01-01'
      };
      expect(fillingRecipe.convert(input)).toSucceedAndSatisfy((result) => {
        const goldenVersion = result.versions.find((v) => v.versionSpec === result.goldenVersionSpec);
        expect(goldenVersion?.procedures).toBeUndefined();
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
      expect(fillingRecipe.convert(input)).toFailWith(/Filling recipe must have at least one version/);
    });

    test('fails for recipe with invalid goldenVersionSpec', () => {
      const input = {
        baseId: 'test-recipe',
        name: 'Test Recipe',
        category: 'ganache',
        versions: [validVersion],
        goldenVersionSpec: '2026-12-31-99'
      };
      expect(fillingRecipe.convert(input)).toFailWith(/Golden version.*not found/);
    });

    test('fails for invalid base ID', () => {
      const input = {
        baseId: 'invalid.id',
        name: 'Test Recipe',
        category: 'ganache',
        versions: [validVersion],
        goldenVersionSpec: '2026-01-01-01'
      };
      expect(fillingRecipe.convert(input)).toFail();
    });

    test('fails for empty name', () => {
      const input = {
        baseId: 'test-recipe',
        name: '',
        category: 'ganache',
        versions: [validVersion],
        goldenVersionSpec: '2026-01-01-01'
      };
      expect(fillingRecipe.convert(input)).toFail();
    });
  });

  // ============================================================================
  // recipeProcedureRef Converter
  // ============================================================================

  describe('recipeProcedureRef', () => {
    test('converts valid procedure reference', () => {
      const input = {
        id: 'common.ganache-cold-method'
      };
      expect(procedureRef.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.id).toBe('common.ganache-cold-method');
        expect(result.notes).toBeUndefined();
      });
    });

    test('converts procedure reference with notes', () => {
      const input = {
        id: 'common.ganache-hot-method',
        notes: 'Use for this specific chocolate'
      };
      expect(procedureRef.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.id).toBe('common.ganache-hot-method');
        expect(result.notes).toBe('Use for this specific chocolate');
      });
    });

    test('fails for invalid procedure ID format', () => {
      const input = {
        id: 'invalid'
      };
      expect(procedureRef.convert(input)).toFail();
    });

    test('fails for missing procedure ID', () => {
      const input = {
        notes: 'Some notes'
      };
      expect(procedureRef.convert(input)).toFail();
    });
  });

  // ============================================================================
  // Procedures Converter
  // ============================================================================

  describe('procedures', () => {
    test('converts valid procedures collection', () => {
      const input = {
        options: [{ id: 'common.ganache-cold-method' }, { id: 'common.ganache-hot-method' }]
      };
      expect(procedures.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.options.length).toBe(2);
        expect(result.options[0].id).toBe('common.ganache-cold-method');
        expect(result.options[1].id).toBe('common.ganache-hot-method');
        expect(result.preferredId).toBeUndefined();
      });
    });

    test('converts procedures with preferred ID', () => {
      const input = {
        options: [{ id: 'common.ganache-cold-method' }, { id: 'common.ganache-hot-method' }],
        preferredId: 'common.ganache-cold-method'
      };
      expect(procedures.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.options.length).toBe(2);
        expect(result.preferredId).toBe('common.ganache-cold-method');
      });
    });

    test('converts procedures with notes on individual refs', () => {
      const input = {
        options: [
          { id: 'common.ganache-cold-method', notes: 'Preferred for dark chocolate' },
          { id: 'common.ganache-hot-method', notes: 'Alternative method' }
        ],
        preferredId: 'common.ganache-cold-method'
      };
      expect(procedures.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.options[0].notes).toBe('Preferred for dark chocolate');
        expect(result.options[1].notes).toBe('Alternative method');
      });
    });

    test('succeeds for empty options array', () => {
      const input = {
        options: []
      };
      // Empty array is valid - no minimum requirement
      expect(procedures.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.options.length).toBe(0);
      });
    });

    test('fails for invalid procedure ID in array', () => {
      const input = {
        options: [{ id: 'common.ganache-cold-method' }, { id: 'invalid' }]
      };
      expect(procedures.convert(input)).toFail();
    });

    test('fails for invalid preferred procedure ID', () => {
      const input = {
        options: [{ id: 'common.ganache-cold-method' }],
        preferredId: 'invalid'
      };
      expect(procedures.convert(input)).toFail();
    });

    test('fails for missing options field', () => {
      const input = {
        preferredId: 'common.ganache-cold-method'
      };
      expect(procedures.convert(input)).toFail();
    });

    test('fails when preferredId is not in options', () => {
      const input = {
        options: [{ id: 'common.ganache-cold-method' }],
        preferredId: 'common.ganache-hot-method'
      };
      expect(procedures.convert(input)).toFailWith(/preferredId.*not found/i);
    });
  });

  // ============================================================================
  // scaledFillingIngredient Converter
  // ============================================================================

  describe('scaledFillingIngredient', () => {
    test('converts valid scaled recipe ingredient', () => {
      const input = {
        ingredient: { ids: ['source.chocolate'] },
        amount: 200,
        originalAmount: 100,
        scaleFactor: 2
      };
      expect(scaledFillingIngredient.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.ingredient.ids[0]).toBe('source.chocolate');
        expect(result.amount).toBe(200);
        expect(result.originalAmount).toBe(100);
        expect(result.scaleFactor).toBe(2);
      });
    });

    test('converts with optional notes', () => {
      const input = {
        ingredient: { ids: ['source.chocolate'] },
        amount: 200,
        originalAmount: 100,
        scaleFactor: 2,
        notes: 'Tempered'
      };
      expect(scaledFillingIngredient.convert(input)).toSucceedAndSatisfy((result) => {
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
  // scaledFillingRecipeVersion Converter (reference-based format)
  // ============================================================================

  describe('scaledFillingRecipeVersion', () => {
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
      expect(scaledFillingRecipeVersion.convert(input)).toSucceedAndSatisfy((result) => {
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
      expect(scaledFillingRecipeVersion.convert(input)).toSucceedAndSatisfy((result) => {
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
      expect(scaledFillingRecipeVersion.convert(input)).toSucceedAndSatisfy((result) => {
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
      expect(scaledFillingRecipeVersion.convert(input)).toFail();
    });
  });

  // ============================================================================
  // Recipe Version Access Tests
  // ============================================================================

  describe('Recipe versions access', () => {
    const version1 = {
      versionSpec: '2026-01-01-01',
      createdDate: '2026-01-01',
      ingredients: [{ ingredient: { ids: ['source.chocolate'] }, amount: 100 }],
      baseWeight: 100
    };

    const version2 = {
      versionSpec: '2026-01-02-01',
      createdDate: '2026-01-02',
      ingredients: [{ ingredient: { ids: ['source.chocolate'] }, amount: 150 }],
      baseWeight: 150
    };

    test('can find version by versionSpec', () => {
      const recipeData = {
        baseId: 'test-recipe',
        name: 'Test Recipe',
        category: 'ganache',
        versions: [version1, version2],
        goldenVersionSpec: '2026-01-01-01'
      };

      expect(fillingRecipe.convert(recipeData)).toSucceedAndSatisfy((result) => {
        const foundVersion = result.versions.find((v) => v.versionSpec === '2026-01-02-01');
        expect(foundVersion).toBeDefined();
        expect(foundVersion?.versionSpec).toBe('2026-01-02-01');
        expect(foundVersion?.baseWeight).toBe(150);
      });
    });

    test('versions array contains all versions', () => {
      const recipeData = {
        baseId: 'test-recipe',
        name: 'Test Recipe',
        category: 'ganache',
        versions: [version1, version2],
        goldenVersionSpec: '2026-01-01-01'
      };

      expect(fillingRecipe.convert(recipeData)).toSucceedAndSatisfy((result) => {
        expect(result.versions.length).toBe(2);
        expect(result.versions[0].versionSpec).toBe('2026-01-01-01');
        expect(result.versions[1].versionSpec).toBe('2026-01-02-01');
      });
    });
  });
});
