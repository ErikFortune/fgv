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
  fillingIngredientEntity,
  fillingRecipeVariationEntity,
  fillingRecipeEntity,
  scalingRefEntity,
  procedureRefEntity,
  procedureEntities
} from '../../../packlets/entities/fillings/converters';

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
      expect(fillingIngredientEntity.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.ingredient.ids[0]).toBe('source.ingredient');
        expect(result.amount).toBe(100);
      });
    });

    test('converts recipe ingredient with notes', () => {
      const input = {
        ingredient: { ids: ['source.ingredient'] },
        amount: 50,
        notes: [{ category: 'user', note: 'Melted first' }]
      };
      expect(fillingIngredientEntity.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.notes).toEqual([{ category: 'user', note: 'Melted first' }]);
      });
    });

    test('fails for invalid ingredient ID', () => {
      const input = {
        ingredient: { ids: ['invalid'] },
        amount: 100
      };
      expect(fillingIngredientEntity.convert(input)).toFail();
    });

    test('fails for negative amount', () => {
      const input = {
        ingredient: { ids: ['source.ingredient'] },
        amount: -10
      };
      expect(fillingIngredientEntity.convert(input)).toFail();
    });
  });

  describe('fillingRecipeVariation', () => {
    test('converts valid recipe variation', () => {
      const input = {
        variationSpec: '2026-01-01-01',
        createdDate: '2026-01-01',
        ingredients: [
          { ingredient: { ids: ['source.chocolate'] }, amount: 100 },
          { ingredient: { ids: ['source.cream'] }, amount: 50 }
        ],
        baseWeight: 150
      };
      expect(fillingRecipeVariationEntity.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.variationSpec).toBe('2026-01-01-01');
        expect(result.createdDate).toBe('2026-01-01');
        expect(result.ingredients.length).toBe(2);
        expect(result.baseWeight).toBe(150);
      });
    });

    test('converts recipe variation with optional fields', () => {
      const input = {
        variationSpec: '2026-01-01-01',
        createdDate: '2026-01-01',
        ingredients: [{ ingredient: { ids: ['source.chocolate'] }, amount: 100 }],
        baseWeight: 100,
        yield: '20 bonbons',
        notes: [{ category: 'user', note: 'First variation' }]
      };
      expect(fillingRecipeVariationEntity.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.yield).toBe('20 bonbons');
        expect(result.notes).toEqual([{ category: 'user', note: 'First variation' }]);
      });
    });
  });

  // ============================================================================
  // fillingRecipe Converter
  // ============================================================================

  describe('fillingRecipe', () => {
    const validVariation = {
      variationSpec: '2026-01-01-01',
      createdDate: '2026-01-01',
      ingredients: [{ ingredient: { ids: ['source.chocolate'] }, amount: 100 }],
      baseWeight: 100
    };

    test('converts valid recipe', () => {
      const input = {
        baseId: 'test-recipe',
        name: 'Test Recipe',
        category: 'ganache',
        variations: [validVariation],
        goldenVariationSpec: '2026-01-01-01'
      };
      expect(fillingRecipeEntity.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.baseId).toBe('test-recipe');
        expect(result.name).toBe('Test Recipe');
        expect(result.goldenVariationSpec).toBe('2026-01-01-01');
        // Golden variation can be found in variations array
        const goldenVariation = result.variations.find((v) => v.variationSpec === result.goldenVariationSpec);
        expect(goldenVariation).toBe(result.variations[0]);
      });
    });

    test('converts recipe with optional fields', () => {
      const input = {
        baseId: 'test-recipe',
        name: 'Test Recipe',
        category: 'ganache',
        description: 'A test recipe',
        tags: ['dark', 'ganache'],
        variations: [validVariation],
        goldenVariationSpec: '2026-01-01-01'
      };
      expect(fillingRecipeEntity.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.description).toBe('A test recipe');
        expect(result.tags).toEqual(['dark', 'ganache']);
      });
    });

    test('converts recipe variation with procedures', () => {
      const variationWithProcedures = {
        ...validVariation,
        procedures: {
          options: [
            { id: 'common.ganache-cold-method', notes: [{ category: 'user', note: 'Preferred' }] },
            { id: 'common.ganache-hot-method' }
          ],
          preferredId: 'common.ganache-cold-method'
        }
      };
      const input = {
        baseId: 'test-recipe',
        name: 'Test Recipe',
        category: 'ganache',
        variations: [variationWithProcedures],
        goldenVariationSpec: '2026-01-01-01'
      };
      expect(fillingRecipeEntity.convert(input)).toSucceedAndSatisfy((result) => {
        const goldenVariation = result.variations.find((v) => v.variationSpec === result.goldenVariationSpec);
        expect(goldenVariation?.procedures).toBeDefined();
        expect(goldenVariation?.procedures!.options.length).toBe(2);
        expect(goldenVariation?.procedures!.options[0].id).toBe('common.ganache-cold-method');
        expect(goldenVariation?.procedures!.options[0].notes).toEqual([
          { category: 'user', note: 'Preferred' }
        ]);
        expect(goldenVariation?.procedures!.preferredId).toBe('common.ganache-cold-method');
      });
    });

    test('converts recipe variation without procedures', () => {
      const input = {
        baseId: 'test-recipe',
        name: 'Test Recipe',
        category: 'ganache',
        variations: [validVariation],
        goldenVariationSpec: '2026-01-01-01'
      };
      expect(fillingRecipeEntity.convert(input)).toSucceedAndSatisfy((result) => {
        const goldenVariation = result.variations.find((v) => v.variationSpec === result.goldenVariationSpec);
        expect(goldenVariation?.procedures).toBeUndefined();
      });
    });

    test('fails for recipe with empty variations array', () => {
      const input = {
        baseId: 'test-recipe',
        name: 'Test Recipe',
        category: 'ganache',
        variations: [],
        goldenVariationSpec: '2026-01-01-01'
      };
      expect(fillingRecipeEntity.convert(input)).toFailWith(
        /Filling recipe must have at least one variation/
      );
    });

    test('fails for recipe with invalid goldenVariationSpec', () => {
      const input = {
        baseId: 'test-recipe',
        name: 'Test Recipe',
        category: 'ganache',
        variations: [validVariation],
        goldenVariationSpec: '2026-12-31-99'
      };
      expect(fillingRecipeEntity.convert(input)).toFailWith(/Golden variation.*not found/);
    });

    test('fails for invalid base ID', () => {
      const input = {
        baseId: 'invalid.id',
        name: 'Test Recipe',
        category: 'ganache',
        variations: [validVariation],
        goldenVariationSpec: '2026-01-01-01'
      };
      expect(fillingRecipeEntity.convert(input)).toFail();
    });

    test('fails for empty name', () => {
      const input = {
        baseId: 'test-recipe',
        name: '',
        category: 'ganache',
        variations: [validVariation],
        goldenVariationSpec: '2026-01-01-01'
      };
      expect(fillingRecipeEntity.convert(input)).toFail();
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
      expect(procedureRefEntity.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.id).toBe('common.ganache-cold-method');
        expect(result.notes).toBeUndefined();
      });
    });

    test('converts procedure reference with notes', () => {
      const input = {
        id: 'common.ganache-hot-method',
        notes: [{ category: 'user', note: 'Use for this specific chocolate' }]
      };
      expect(procedureRefEntity.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.id).toBe('common.ganache-hot-method');
        expect(result.notes).toEqual([{ category: 'user', note: 'Use for this specific chocolate' }]);
      });
    });

    test('fails for invalid procedure ID format', () => {
      const input = {
        id: 'invalid'
      };
      expect(procedureRefEntity.convert(input)).toFail();
    });

    test('fails for missing procedure ID', () => {
      const input = {
        notes: [{ category: 'user', note: 'Some notes' }]
      };
      expect(procedureRefEntity.convert(input)).toFail();
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
      expect(procedureEntities.convert(input)).toSucceedAndSatisfy((result) => {
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
      expect(procedureEntities.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.options.length).toBe(2);
        expect(result.preferredId).toBe('common.ganache-cold-method');
      });
    });

    test('converts procedures with notes on individual refs', () => {
      const input = {
        options: [
          {
            id: 'common.ganache-cold-method',
            notes: [{ category: 'user', note: 'Preferred for dark chocolate' }]
          },
          { id: 'common.ganache-hot-method', notes: [{ category: 'user', note: 'Alternative method' }] }
        ],
        preferredId: 'common.ganache-cold-method'
      };
      expect(procedureEntities.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.options[0].notes).toEqual([{ category: 'user', note: 'Preferred for dark chocolate' }]);
        expect(result.options[1].notes).toEqual([{ category: 'user', note: 'Alternative method' }]);
      });
    });

    test('succeeds for empty options array', () => {
      const input = {
        options: []
      };
      // Empty array is valid - no minimum requirement
      expect(procedureEntities.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.options.length).toBe(0);
      });
    });

    test('fails for invalid procedure ID in array', () => {
      const input = {
        options: [{ id: 'common.ganache-cold-method' }, { id: 'invalid' }]
      };
      expect(procedureEntities.convert(input)).toFail();
    });

    test('fails for invalid preferred procedure ID', () => {
      const input = {
        options: [{ id: 'common.ganache-cold-method' }],
        preferredId: 'invalid'
      };
      expect(procedureEntities.convert(input)).toFail();
    });

    test('fails for missing options field', () => {
      const input = {
        preferredId: 'common.ganache-cold-method'
      };
      expect(procedureEntities.convert(input)).toFail();
    });

    test('fails when preferredId is not in options', () => {
      const input = {
        options: [{ id: 'common.ganache-cold-method' }],
        preferredId: 'common.ganache-hot-method'
      };
      expect(procedureEntities.convert(input)).toFailWith(/preferredId.*not found/i);
    });
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
    expect(procedureEntities.convert(input)).toSucceedAndSatisfy((result) => {
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
    expect(procedureEntities.convert(input)).toSucceedAndSatisfy((result) => {
      expect(result.options.length).toBe(2);
      expect(result.preferredId).toBe('common.ganache-cold-method');
    });
  });

  test('converts procedures with notes on individual refs', () => {
    const input = {
      options: [
        {
          id: 'common.ganache-cold-method',
          notes: [{ category: 'user', note: 'Preferred for dark chocolate' }]
        },
        { id: 'common.ganache-hot-method', notes: [{ category: 'user', note: 'Alternative method' }] }
      ],
      preferredId: 'common.ganache-cold-method'
    };
    expect(procedureEntities.convert(input)).toSucceedAndSatisfy((result) => {
      expect(result.options[0].notes).toEqual([{ category: 'user', note: 'Preferred for dark chocolate' }]);
      expect(result.options[1].notes).toEqual([{ category: 'user', note: 'Alternative method' }]);
    });
  });

  test('succeeds for empty options array', () => {
    const input = {
      options: []
    };
    // Empty array is valid - no minimum requirement
    expect(procedureEntities.convert(input)).toSucceedAndSatisfy((result) => {
      expect(result.options.length).toBe(0);
    });
  });

  test('fails for invalid procedure ID in array', () => {
    const input = {
      options: [{ id: 'common.ganache-cold-method' }, { id: 'invalid' }]
    };
    expect(procedureEntities.convert(input)).toFail();
  });

  test('fails for invalid preferred procedure ID', () => {
    const input = {
      options: [{ id: 'common.ganache-cold-method' }],
      preferredId: 'invalid'
    };
    expect(procedureEntities.convert(input)).toFail();
  });

  test('fails for missing options field', () => {
    const input = {
      preferredId: 'common.ganache-cold-method'
    };
    expect(procedureEntities.convert(input)).toFail();
  });

  test('fails when preferredId is not in options', () => {
    const input = {
      options: [{ id: 'common.ganache-cold-method' }],
      preferredId: 'common.ganache-hot-method'
    };
    expect(procedureEntities.convert(input)).toFailWith(/preferredId.*not found/i);
  });
});

// ============================================================================
// scalingRef Converter
// ============================================================================

describe('scalingRef', () => {
  test('converts valid scaling ref', () => {
    const input = {
      sourceVariationId: 'source.test-recipe@2026-01-01-01',
      scaleFactor: 2,
      targetWeight: 300,
      createdDate: '2026-01-15'
    };
    expect(scalingRefEntity.convert(input)).toSucceedAndSatisfy((result) => {
      expect(result.sourceVariationId).toBe('source.test-recipe@2026-01-01-01');
      expect(result.scaleFactor).toBe(2);
      expect(result.targetWeight).toBe(300);
      expect(result.createdDate).toBe('2026-01-15');
    });
  });

  test('fails for invalid recipe variation ID', () => {
    const input = {
      sourceVariationId: 'invalid',
      scaleFactor: 2,
      targetWeight: 300,
      createdDate: '2026-01-15'
    };
    expect(scalingRefEntity.convert(input)).toFail();
  });
});
