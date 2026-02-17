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
 * Tests for filling recipe validators.
 * @packageDocumentation
 */

import '@fgv/ts-utils-jest';

// eslint-disable-next-line @rushstack/packlets/mechanics
import {
  validateFillingCategory,
  validateFillingIngredients,
  validateFillingName,
  validateFillingRatings,
  validateFillingRecipeEntity,
  validateFillingVariations
} from '../../../../packlets/editing/fillings/validators';

import {
  BaseFillingId,
  FillingName,
  FillingRecipeVariationSpec,
  IngredientId,
  Measurement,
  RatingScore
} from '../../../../packlets/common';
import { Fillings } from '../../../../packlets/entities';
// eslint-disable-next-line @rushstack/packlets/mechanics
import { RatingCategory } from '../../../../packlets/entities/fillings/model';

/**
 * Helper to create a filling recipe entity with optional overrides.
 */
function makeEntity(overrides?: Partial<Fillings.IFillingRecipeEntity>): Fillings.IFillingRecipeEntity {
  return {
    baseId: 'test-filling' as unknown as BaseFillingId,
    name: 'Test Filling' as unknown as FillingName,
    category: 'ganache',
    variations: [
      {
        variationSpec: 'v1' as unknown as FillingRecipeVariationSpec,
        createdDate: '2026-01-01',
        ingredients: [],
        baseWeight: 100 as unknown as Measurement
      }
    ],
    goldenVariationSpec: 'v1' as unknown as FillingRecipeVariationSpec,
    ...overrides
  };
}

/**
 * Helper to create a variation with optional overrides.
 */
function makeVariation(
  overrides?: Partial<Fillings.IFillingRecipeVariationEntity>
): Fillings.IFillingRecipeVariationEntity {
  return {
    variationSpec: 'v1' as unknown as FillingRecipeVariationSpec,
    createdDate: '2026-01-01',
    ingredients: [],
    baseWeight: 100 as unknown as Measurement,
    ...overrides
  };
}

describe('validateFillingName', () => {
  test('should succeed for non-empty name', () => {
    const entity = makeEntity({ name: 'Dark Chocolate Ganache' as unknown as FillingName });
    expect(validateFillingName(entity)).toSucceedWith(true);
  });

  test('should succeed for name with whitespace around non-empty content', () => {
    const entity = makeEntity({ name: '  Caramel  ' as unknown as FillingName });
    expect(validateFillingName(entity)).toSucceedWith(true);
  });

  test('should fail for empty name', () => {
    const entity = makeEntity({ name: '' as unknown as FillingName });
    expect(validateFillingName(entity)).toFailWith(/name must not be empty/i);
  });

  test('should fail for whitespace-only name', () => {
    const entity = makeEntity({ name: '   ' as unknown as FillingName });
    expect(validateFillingName(entity)).toFailWith(/name must not be empty/i);
  });

  test('should fail for tab-only name', () => {
    const entity = makeEntity({ name: '\t\t' as unknown as FillingName });
    expect(validateFillingName(entity)).toFailWith(/name must not be empty/i);
  });
});

describe('validateFillingCategory', () => {
  test('should succeed for ganache category', () => {
    const entity = makeEntity({ category: 'ganache' });
    expect(validateFillingCategory(entity)).toSucceedWith(true);
  });

  test('should succeed for caramel category', () => {
    const entity = makeEntity({ category: 'caramel' });
    expect(validateFillingCategory(entity)).toSucceedWith(true);
  });

  test('should succeed for gianduja category', () => {
    const entity = makeEntity({ category: 'gianduja' });
    expect(validateFillingCategory(entity)).toSucceedWith(true);
  });

  test('should fail for invalid category', () => {
    const entity = makeEntity({ category: 'invalid-category' as Fillings.FillingCategory });
    expect(validateFillingCategory(entity)).toFailWith(/not valid.*must be one of/i);
  });

  test('should fail and include valid categories in error message', () => {
    const entity = makeEntity({ category: 'truffle' as Fillings.FillingCategory });
    expect(validateFillingCategory(entity)).toFailWith(/ganache.*caramel.*gianduja/i);
  });
});

describe('validateFillingVariations', () => {
  test('should succeed with one variation matching golden spec', () => {
    const entity = makeEntity({
      variations: [makeVariation({ variationSpec: 'v1' as unknown as FillingRecipeVariationSpec })],
      goldenVariationSpec: 'v1' as unknown as FillingRecipeVariationSpec
    });
    expect(validateFillingVariations(entity)).toSucceedWith(true);
  });

  test('should succeed with multiple variations including golden spec', () => {
    const entity = makeEntity({
      variations: [
        makeVariation({ variationSpec: 'v1' as unknown as FillingRecipeVariationSpec }),
        makeVariation({ variationSpec: 'v2' as unknown as FillingRecipeVariationSpec }),
        makeVariation({ variationSpec: 'v3' as unknown as FillingRecipeVariationSpec })
      ],
      goldenVariationSpec: 'v2' as unknown as FillingRecipeVariationSpec
    });
    expect(validateFillingVariations(entity)).toSucceedWith(true);
  });

  test('should succeed when golden spec is the first variation', () => {
    const entity = makeEntity({
      variations: [
        makeVariation({
          variationSpec: '2026-01-01-01' as unknown as FillingRecipeVariationSpec
        }),
        makeVariation({ variationSpec: '2026-01-02-01' as unknown as FillingRecipeVariationSpec })
      ],
      goldenVariationSpec: '2026-01-01-01' as unknown as FillingRecipeVariationSpec
    });
    expect(validateFillingVariations(entity)).toSucceedWith(true);
  });

  test('should succeed when golden spec is the last variation', () => {
    const entity = makeEntity({
      variations: [
        makeVariation({ variationSpec: '2026-01-01-01' as unknown as FillingRecipeVariationSpec }),
        makeVariation({ variationSpec: '2026-01-02-01' as unknown as FillingRecipeVariationSpec })
      ],
      goldenVariationSpec: '2026-01-02-01' as unknown as FillingRecipeVariationSpec
    });
    expect(validateFillingVariations(entity)).toSucceedWith(true);
  });

  test('should fail when variations array is empty', () => {
    const entity = makeEntity({
      variations: [],
      goldenVariationSpec: 'v1' as unknown as FillingRecipeVariationSpec
    });
    expect(validateFillingVariations(entity)).toFailWith(/at least one variation/i);
  });

  test('should fail when golden spec does not match any variation', () => {
    const entity = makeEntity({
      variations: [
        makeVariation({ variationSpec: 'v1' as unknown as FillingRecipeVariationSpec }),
        makeVariation({ variationSpec: 'v2' as unknown as FillingRecipeVariationSpec })
      ],
      goldenVariationSpec: 'v3' as unknown as FillingRecipeVariationSpec
    });
    expect(validateFillingVariations(entity)).toFailWith(/golden variation.*does not match/i);
  });

  test('should include golden spec in error message when not found', () => {
    const entity = makeEntity({
      variations: [makeVariation({ variationSpec: 'v1' as unknown as FillingRecipeVariationSpec })],
      goldenVariationSpec: 'missing-spec' as unknown as FillingRecipeVariationSpec
    });
    expect(validateFillingVariations(entity)).toFailWith(/missing-spec/i);
  });
});

describe('validateFillingIngredients', () => {
  test('should succeed when all variations have empty ingredients arrays', () => {
    const entity = makeEntity({
      variations: [
        makeVariation({ ingredients: [] }),
        makeVariation({ variationSpec: 'v2' as unknown as FillingRecipeVariationSpec, ingredients: [] })
      ]
    });
    expect(validateFillingIngredients(entity)).toSucceedWith(true);
  });

  test('should succeed for single ingredient with valid data', () => {
    const entity = makeEntity({
      variations: [
        makeVariation({
          ingredients: [
            {
              ingredient: { ids: ['chocolate' as unknown as IngredientId] },
              amount: 100 as unknown as Measurement
            }
          ]
        })
      ]
    });
    expect(validateFillingIngredients(entity)).toSucceedWith(true);
  });

  test('should succeed for multiple ingredients with valid data', () => {
    const entity = makeEntity({
      variations: [
        makeVariation({
          ingredients: [
            {
              ingredient: { ids: ['chocolate' as unknown as IngredientId] },
              amount: 200 as unknown as Measurement
            },
            {
              ingredient: {
                ids: ['cream' as unknown as IngredientId, 'milk' as unknown as IngredientId]
              },
              amount: 100 as unknown as Measurement
            }
          ]
        })
      ]
    });
    expect(validateFillingIngredients(entity)).toSucceedWith(true);
  });

  test('should succeed for ingredient with zero amount', () => {
    const entity = makeEntity({
      variations: [
        makeVariation({
          ingredients: [
            {
              ingredient: { ids: ['chocolate' as unknown as IngredientId] },
              amount: 0 as unknown as Measurement
            }
          ]
        })
      ]
    });
    expect(validateFillingIngredients(entity)).toSucceedWith(true);
  });

  test('should succeed across multiple variations', () => {
    const entity = makeEntity({
      variations: [
        makeVariation({
          variationSpec: 'v1' as unknown as FillingRecipeVariationSpec,
          ingredients: [
            {
              ingredient: { ids: ['chocolate' as unknown as IngredientId] },
              amount: 100 as unknown as Measurement
            }
          ]
        }),
        makeVariation({
          variationSpec: 'v2' as unknown as FillingRecipeVariationSpec,
          ingredients: [
            {
              ingredient: { ids: ['caramel' as unknown as IngredientId] },
              amount: 50 as unknown as Measurement
            }
          ]
        })
      ]
    });
    expect(validateFillingIngredients(entity)).toSucceedWith(true);
  });

  test('should fail when ingredient has empty ids array', () => {
    const entity = makeEntity({
      variations: [
        makeVariation({
          ingredients: [
            {
              ingredient: { ids: [] },
              amount: 100 as unknown as Measurement
            }
          ]
        })
      ]
    });
    expect(validateFillingIngredients(entity)).toFailWith(/at least one ID/i);
  });

  test('should fail when ingredient has negative amount', () => {
    const entity = makeEntity({
      variations: [
        makeVariation({
          ingredients: [
            {
              ingredient: { ids: ['chocolate' as unknown as IngredientId] },
              amount: -50 as unknown as Measurement
            }
          ]
        })
      ]
    });
    expect(validateFillingIngredients(entity)).toFailWith(/amount must not be negative/i);
  });

  test('should include variation spec in error message for empty ids', () => {
    const entity = makeEntity({
      variations: [
        makeVariation({
          variationSpec: 'v2' as unknown as FillingRecipeVariationSpec,
          ingredients: [
            {
              ingredient: { ids: [] },
              amount: 100 as unknown as Measurement
            }
          ]
        })
      ]
    });
    expect(validateFillingIngredients(entity)).toFailWith(/v2/i);
  });

  test('should include variation spec in error message for negative amount', () => {
    const entity = makeEntity({
      variations: [
        makeVariation({
          variationSpec: '2026-01-01-01' as unknown as FillingRecipeVariationSpec,
          ingredients: [
            {
              ingredient: { ids: ['chocolate' as unknown as IngredientId] },
              amount: -10 as unknown as Measurement
            }
          ]
        })
      ]
    });
    expect(validateFillingIngredients(entity)).toFailWith(/2026-01-01-01/i);
  });

  test('should fail on first invalid ingredient when multiple are invalid', () => {
    const entity = makeEntity({
      variations: [
        makeVariation({
          ingredients: [
            {
              ingredient: { ids: [] },
              amount: 100 as unknown as Measurement
            },
            {
              ingredient: { ids: ['valid' as unknown as IngredientId] },
              amount: -50 as unknown as Measurement
            }
          ]
        })
      ]
    });
    expect(validateFillingIngredients(entity)).toFailWith(/at least one ID/i);
  });

  test('should fail on first invalid variation when multiple variations are invalid', () => {
    const entity = makeEntity({
      variations: [
        makeVariation({
          variationSpec: 'v1' as unknown as FillingRecipeVariationSpec,
          ingredients: [
            {
              ingredient: { ids: [] },
              amount: 100 as unknown as Measurement
            }
          ]
        }),
        makeVariation({
          variationSpec: 'v2' as unknown as FillingRecipeVariationSpec,
          ingredients: [
            {
              ingredient: { ids: ['chocolate' as unknown as IngredientId] },
              amount: -50 as unknown as Measurement
            }
          ]
        })
      ]
    });
    expect(validateFillingIngredients(entity)).toFailWith(/v1/i);
  });
});

describe('validateFillingRatings', () => {
  test('should succeed when ratings is undefined', () => {
    const entity = makeEntity({
      variations: [makeVariation({ ratings: undefined })]
    });
    expect(validateFillingRatings(entity)).toSucceedWith(true);
  });

  test('should succeed for empty ratings array', () => {
    const entity = makeEntity({
      variations: [makeVariation({ ratings: [] })]
    });
    expect(validateFillingRatings(entity)).toSucceedWith(true);
  });

  test('should succeed for valid single rating', () => {
    const entity = makeEntity({
      variations: [
        makeVariation({
          ratings: [
            {
              category: 'taste' as RatingCategory,
              score: 4 as unknown as RatingScore
            }
          ]
        })
      ]
    });
    expect(validateFillingRatings(entity)).toSucceedWith(true);
  });

  test('should succeed for multiple valid ratings with different categories', () => {
    const entity = makeEntity({
      variations: [
        makeVariation({
          ratings: [
            {
              category: 'taste' as RatingCategory,
              score: 5 as unknown as RatingScore
            },
            {
              category: 'texture' as RatingCategory,
              score: 4 as unknown as RatingScore
            },
            {
              category: 'appearance' as RatingCategory,
              score: 3 as unknown as RatingScore
            }
          ]
        })
      ]
    });
    expect(validateFillingRatings(entity)).toSucceedWith(true);
  });

  test('should succeed for all valid rating categories', () => {
    const entity = makeEntity({
      variations: [
        makeVariation({
          ratings: [
            {
              category: 'overall' as RatingCategory,
              score: 5 as unknown as RatingScore
            },
            {
              category: 'taste' as RatingCategory,
              score: 4 as unknown as RatingScore
            },
            {
              category: 'texture' as RatingCategory,
              score: 3 as unknown as RatingScore
            },
            {
              category: 'shelf-life' as RatingCategory,
              score: 2 as unknown as RatingScore
            },
            {
              category: 'appearance' as RatingCategory,
              score: 1 as unknown as RatingScore
            },
            {
              category: 'workability' as RatingCategory,
              score: 5 as unknown as RatingScore
            },
            {
              category: 'difficulty' as RatingCategory,
              score: 4 as unknown as RatingScore
            },
            {
              category: 'durability' as RatingCategory,
              score: 3 as unknown as RatingScore
            }
          ]
        })
      ]
    });
    expect(validateFillingRatings(entity)).toSucceedWith(true);
  });

  test('should succeed for score of 1', () => {
    const entity = makeEntity({
      variations: [
        makeVariation({
          ratings: [
            {
              category: 'taste' as RatingCategory,
              score: 1 as unknown as RatingScore
            }
          ]
        })
      ]
    });
    expect(validateFillingRatings(entity)).toSucceedWith(true);
  });

  test('should succeed for score of 5', () => {
    const entity = makeEntity({
      variations: [
        makeVariation({
          ratings: [
            {
              category: 'taste' as RatingCategory,
              score: 5 as unknown as RatingScore
            }
          ]
        })
      ]
    });
    expect(validateFillingRatings(entity)).toSucceedWith(true);
  });

  test('should succeed across multiple variations with different ratings', () => {
    const entity = makeEntity({
      variations: [
        makeVariation({
          variationSpec: 'v1' as unknown as FillingRecipeVariationSpec,
          ratings: [
            {
              category: 'taste' as RatingCategory,
              score: 4 as unknown as RatingScore
            }
          ]
        }),
        makeVariation({
          variationSpec: 'v2' as unknown as FillingRecipeVariationSpec,
          ratings: [
            {
              category: 'texture' as RatingCategory,
              score: 3 as unknown as RatingScore
            }
          ]
        })
      ]
    });
    expect(validateFillingRatings(entity)).toSucceedWith(true);
  });

  test('should fail for score less than 1', () => {
    const entity = makeEntity({
      variations: [
        makeVariation({
          ratings: [
            {
              category: 'taste' as RatingCategory,
              score: 0 as unknown as RatingScore
            }
          ]
        })
      ]
    });
    expect(validateFillingRatings(entity)).toFailWith(/between 1 and 5.*got 0/i);
  });

  test('should fail for negative score', () => {
    const entity = makeEntity({
      variations: [
        makeVariation({
          ratings: [
            {
              category: 'taste' as RatingCategory,
              score: -2 as unknown as RatingScore
            }
          ]
        })
      ]
    });
    expect(validateFillingRatings(entity)).toFailWith(/between 1 and 5.*got -2/i);
  });

  test('should fail for score greater than 5', () => {
    const entity = makeEntity({
      variations: [
        makeVariation({
          ratings: [
            {
              category: 'taste' as RatingCategory,
              score: 6 as unknown as RatingScore
            }
          ]
        })
      ]
    });
    expect(validateFillingRatings(entity)).toFailWith(/between 1 and 5.*got 6/i);
  });

  test('should fail for invalid category', () => {
    const entity = makeEntity({
      variations: [
        makeVariation({
          ratings: [
            {
              category: 'invalid-category' as unknown as RatingCategory,
              score: 3 as unknown as RatingScore
            }
          ]
        })
      ]
    });
    expect(validateFillingRatings(entity)).toFailWith(/not valid/i);
  });

  test('should include valid categories in error message for invalid category', () => {
    const entity = makeEntity({
      variations: [
        makeVariation({
          ratings: [
            {
              category: 'flavor' as unknown as RatingCategory,
              score: 3 as unknown as RatingScore
            }
          ]
        })
      ]
    });
    expect(validateFillingRatings(entity)).toFailWith(/must be one of/i);
  });

  test('should fail for duplicate category in same variation', () => {
    const entity = makeEntity({
      variations: [
        makeVariation({
          ratings: [
            {
              category: 'taste' as RatingCategory,
              score: 4 as unknown as RatingScore
            },
            {
              category: 'taste' as RatingCategory,
              score: 5 as unknown as RatingScore
            }
          ]
        })
      ]
    });
    expect(validateFillingRatings(entity)).toFailWith(/duplicate.*taste/i);
  });

  test('should allow same category in different variations', () => {
    const entity = makeEntity({
      variations: [
        makeVariation({
          variationSpec: 'v1' as unknown as FillingRecipeVariationSpec,
          ratings: [
            {
              category: 'taste' as RatingCategory,
              score: 4 as unknown as RatingScore
            }
          ]
        }),
        makeVariation({
          variationSpec: 'v2' as unknown as FillingRecipeVariationSpec,
          ratings: [
            {
              category: 'taste' as RatingCategory,
              score: 5 as unknown as RatingScore
            }
          ]
        })
      ]
    });
    expect(validateFillingRatings(entity)).toSucceedWith(true);
  });

  test('should include variation spec in error message for score out of range', () => {
    const entity = makeEntity({
      variations: [
        makeVariation({
          variationSpec: 'v2' as unknown as FillingRecipeVariationSpec,
          ratings: [
            {
              category: 'taste' as RatingCategory,
              score: 10 as unknown as RatingScore
            }
          ]
        })
      ]
    });
    expect(validateFillingRatings(entity)).toFailWith(/v2/i);
  });

  test('should include variation spec in error message for invalid category', () => {
    const entity = makeEntity({
      variations: [
        makeVariation({
          variationSpec: '2026-01-01-01' as unknown as FillingRecipeVariationSpec,
          ratings: [
            {
              category: 'invalid' as unknown as RatingCategory,
              score: 3 as unknown as RatingScore
            }
          ]
        })
      ]
    });
    expect(validateFillingRatings(entity)).toFailWith(/2026-01-01-01/i);
  });

  test('should include variation spec in error message for duplicate category', () => {
    const entity = makeEntity({
      variations: [
        makeVariation({
          variationSpec: 'v3' as unknown as FillingRecipeVariationSpec,
          ratings: [
            {
              category: 'texture' as RatingCategory,
              score: 4 as unknown as RatingScore
            },
            {
              category: 'texture' as RatingCategory,
              score: 3 as unknown as RatingScore
            }
          ]
        })
      ]
    });
    expect(validateFillingRatings(entity)).toFailWith(/v3/i);
  });

  test('should fail on first error when multiple ratings are invalid', () => {
    const entity = makeEntity({
      variations: [
        makeVariation({
          ratings: [
            {
              category: 'taste' as RatingCategory,
              score: 0 as unknown as RatingScore
            },
            {
              category: 'invalid' as unknown as RatingCategory,
              score: 3 as unknown as RatingScore
            }
          ]
        })
      ]
    });
    expect(validateFillingRatings(entity)).toFailWith(/between 1 and 5/i);
  });
});

describe('validateFillingRecipeEntity', () => {
  test('should succeed for valid minimal entity', () => {
    const entity = makeEntity();
    expect(validateFillingRecipeEntity(entity)).toSucceedWith(entity);
  });

  test('should succeed for valid complete entity', () => {
    const entity = makeEntity({
      name: 'Complete Filling' as unknown as FillingName,
      category: 'ganache',
      description: 'A complete test filling',
      tags: ['dark', 'chocolate'],
      variations: [
        {
          variationSpec: 'v1' as unknown as FillingRecipeVariationSpec,
          createdDate: '2026-01-01',
          ingredients: [
            {
              ingredient: { ids: ['chocolate' as unknown as IngredientId] },
              amount: 200 as unknown as Measurement
            },
            {
              ingredient: { ids: ['cream' as unknown as IngredientId] },
              amount: 100 as unknown as Measurement
            }
          ],
          baseWeight: 300 as unknown as Measurement,
          ratings: [
            {
              category: 'taste' as RatingCategory,
              score: 5 as unknown as RatingScore
            },
            {
              category: 'texture' as RatingCategory,
              score: 4 as unknown as RatingScore
            }
          ]
        }
      ],
      goldenVariationSpec: 'v1' as unknown as FillingRecipeVariationSpec
    });
    expect(validateFillingRecipeEntity(entity)).toSucceedWith(entity);
  });

  test('should return the same entity reference on success', () => {
    const entity = makeEntity();
    expect(validateFillingRecipeEntity(entity)).toSucceedAndSatisfy((result) => {
      expect(result).toBe(entity);
    });
  });

  test('should fail for invalid name', () => {
    const entity = makeEntity({ name: '' as unknown as FillingName });
    expect(validateFillingRecipeEntity(entity)).toFailWith(/name must not be empty/i);
  });

  test('should fail for invalid category', () => {
    const entity = makeEntity({ category: 'invalid' as Fillings.FillingCategory });
    expect(validateFillingRecipeEntity(entity)).toFailWith(/category.*not valid/i);
  });

  test('should fail for empty variations array', () => {
    const entity = makeEntity({ variations: [] });
    expect(validateFillingRecipeEntity(entity)).toFailWith(/at least one variation/i);
  });

  test('should fail for missing golden variation spec', () => {
    const entity = makeEntity({
      variations: [makeVariation({ variationSpec: 'v1' as unknown as FillingRecipeVariationSpec })],
      goldenVariationSpec: 'v2' as unknown as FillingRecipeVariationSpec
    });
    expect(validateFillingRecipeEntity(entity)).toFailWith(/golden variation.*does not match/i);
  });

  test('should fail for ingredient with empty ids', () => {
    const entity = makeEntity({
      variations: [
        makeVariation({
          ingredients: [
            {
              ingredient: { ids: [] },
              amount: 100 as unknown as Measurement
            }
          ]
        })
      ]
    });
    expect(validateFillingRecipeEntity(entity)).toFailWith(/at least one ID/i);
  });

  test('should fail for ingredient with negative amount', () => {
    const entity = makeEntity({
      variations: [
        makeVariation({
          ingredients: [
            {
              ingredient: { ids: ['chocolate' as unknown as IngredientId] },
              amount: -50 as unknown as Measurement
            }
          ]
        })
      ]
    });
    expect(validateFillingRecipeEntity(entity)).toFailWith(/amount must not be negative/i);
  });

  test('should fail for rating score out of range', () => {
    const entity = makeEntity({
      variations: [
        makeVariation({
          ratings: [
            {
              category: 'taste' as RatingCategory,
              score: 6 as unknown as RatingScore
            }
          ]
        })
      ]
    });
    expect(validateFillingRecipeEntity(entity)).toFailWith(/between 1 and 5/i);
  });

  test('should fail for invalid rating category', () => {
    const entity = makeEntity({
      variations: [
        makeVariation({
          ratings: [
            {
              category: 'invalid' as unknown as RatingCategory,
              score: 3 as unknown as RatingScore
            }
          ]
        })
      ]
    });
    expect(validateFillingRecipeEntity(entity)).toFailWith(/not valid/i);
  });

  test('should fail for duplicate rating category', () => {
    const entity = makeEntity({
      variations: [
        makeVariation({
          ratings: [
            {
              category: 'taste' as RatingCategory,
              score: 4 as unknown as RatingScore
            },
            {
              category: 'taste' as RatingCategory,
              score: 5 as unknown as RatingScore
            }
          ]
        })
      ]
    });
    expect(validateFillingRecipeEntity(entity)).toFailWith(/duplicate/i);
  });

  test('should fail on first validation error in chain', () => {
    const entity = makeEntity({
      name: '' as unknown as FillingName,
      category: 'invalid' as Fillings.FillingCategory,
      variations: [],
      goldenVariationSpec: 'missing' as unknown as FillingRecipeVariationSpec
    });
    expect(validateFillingRecipeEntity(entity)).toFailWith(/name must not be empty/i);
  });

  test('should validate category after name', () => {
    const entity = makeEntity({
      name: 'Valid Name' as unknown as FillingName,
      category: 'invalid' as Fillings.FillingCategory,
      variations: [],
      goldenVariationSpec: 'missing' as unknown as FillingRecipeVariationSpec
    });
    expect(validateFillingRecipeEntity(entity)).toFailWith(/category.*not valid/i);
  });

  test('should validate variations after category', () => {
    const entity = makeEntity({
      name: 'Valid Name' as unknown as FillingName,
      category: 'ganache',
      variations: [],
      goldenVariationSpec: 'missing' as unknown as FillingRecipeVariationSpec
    });
    expect(validateFillingRecipeEntity(entity)).toFailWith(/at least one variation/i);
  });

  test('should validate ingredients after variations', () => {
    const entity = makeEntity({
      name: 'Valid Name' as unknown as FillingName,
      category: 'ganache',
      variations: [
        makeVariation({
          ingredients: [
            {
              ingredient: { ids: [] },
              amount: 100 as unknown as Measurement
            }
          ]
        })
      ],
      goldenVariationSpec: 'v1' as unknown as FillingRecipeVariationSpec
    });
    expect(validateFillingRecipeEntity(entity)).toFailWith(/at least one ID/i);
  });

  test('should validate ratings after ingredients', () => {
    const entity = makeEntity({
      name: 'Valid Name' as unknown as FillingName,
      category: 'ganache',
      variations: [
        makeVariation({
          ingredients: [],
          ratings: [
            {
              category: 'taste' as RatingCategory,
              score: 10 as unknown as RatingScore
            }
          ]
        })
      ],
      goldenVariationSpec: 'v1' as unknown as FillingRecipeVariationSpec
    });
    expect(validateFillingRecipeEntity(entity)).toFailWith(/between 1 and 5/i);
  });
});
