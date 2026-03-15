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
 * Tests for decoration validators.
 * @packageDocumentation
 */

import '@fgv/ts-utils-jest';

// eslint-disable-next-line @rushstack/packlets/mechanics
import {
  validateDecorationEntity,
  validateDecorationIngredients,
  validateDecorationName,
  validateDecorationRatings
} from '../../../../packlets/editing/decorations/validators';

import { BaseDecorationId, IngredientId, Measurement, RatingScore } from '../../../../packlets/common';
import { Decorations } from '../../../../packlets/entities';
// eslint-disable-next-line @rushstack/packlets/mechanics
import { RatingCategory } from '../../../../packlets/entities/fillings/model';

/**
 * Helper to create a decoration entity with optional overrides.
 */
function makeEntity(overrides?: Partial<Decorations.IDecorationEntity>): Decorations.IDecorationEntity {
  return {
    baseId: 'test-decoration' as unknown as BaseDecorationId,
    name: 'Test Decoration',
    ingredients: [],
    ...overrides
  };
}

describe('validateDecorationName', () => {
  test('should succeed for non-empty name', () => {
    const entity = makeEntity({ name: 'Gold Leaf' });
    expect(validateDecorationName(entity)).toSucceedWith(true);
  });

  test('should succeed for name with whitespace around non-empty content', () => {
    const entity = makeEntity({ name: '  Sprinkles  ' });
    expect(validateDecorationName(entity)).toSucceedWith(true);
  });

  test('should fail for empty name', () => {
    const entity = makeEntity({ name: '' });
    expect(validateDecorationName(entity)).toFailWith(/name must not be empty/i);
  });

  test('should fail for whitespace-only name', () => {
    const entity = makeEntity({ name: '   ' });
    expect(validateDecorationName(entity)).toFailWith(/name must not be empty/i);
  });

  test('should fail for tab-only name', () => {
    const entity = makeEntity({ name: '\t\t' });
    expect(validateDecorationName(entity)).toFailWith(/name must not be empty/i);
  });
});

describe('validateDecorationIngredients', () => {
  test('should succeed for empty ingredients array', () => {
    const entity = makeEntity({ ingredients: [] });
    expect(validateDecorationIngredients(entity)).toSucceedWith(true);
  });

  test('should succeed for valid single ingredient', () => {
    const entity = makeEntity({
      ingredients: [
        {
          ingredient: {
            ids: ['gold-leaf' as unknown as IngredientId]
          },
          amount: 10 as unknown as Measurement
        }
      ]
    });
    expect(validateDecorationIngredients(entity)).toSucceedWith(true);
  });

  test('should succeed for valid multiple ingredients', () => {
    const entity = makeEntity({
      ingredients: [
        {
          ingredient: {
            ids: ['gold-leaf' as unknown as IngredientId]
          },
          amount: 10 as unknown as Measurement
        },
        {
          ingredient: {
            ids: ['silver-leaf' as unknown as IngredientId, 'silver-dust' as unknown as IngredientId]
          },
          amount: 5 as unknown as Measurement
        }
      ]
    });
    expect(validateDecorationIngredients(entity)).toSucceedWith(true);
  });

  test('should fail for ingredient with empty ids array', () => {
    const entity = makeEntity({
      ingredients: [
        {
          ingredient: {
            ids: []
          },
          amount: 10 as unknown as Measurement
        }
      ]
    });
    expect(validateDecorationIngredients(entity)).toFailWith(/at least one ID/i);
  });

  test('should fail for ingredient with zero amount', () => {
    const entity = makeEntity({
      ingredients: [
        {
          ingredient: {
            ids: ['gold-leaf' as unknown as IngredientId]
          },
          amount: 0 as unknown as Measurement
        }
      ]
    });
    expect(validateDecorationIngredients(entity)).toFailWith(/amount must be positive/i);
  });

  test('should fail for ingredient with negative amount', () => {
    const entity = makeEntity({
      ingredients: [
        {
          ingredient: {
            ids: ['gold-leaf' as unknown as IngredientId]
          },
          amount: -5 as unknown as Measurement
        }
      ]
    });
    expect(validateDecorationIngredients(entity)).toFailWith(/amount must be positive/i);
  });

  test('should fail on first invalid ingredient when multiple are invalid', () => {
    const entity = makeEntity({
      ingredients: [
        {
          ingredient: {
            ids: []
          },
          amount: 10 as unknown as Measurement
        },
        {
          ingredient: {
            ids: ['valid' as unknown as IngredientId]
          },
          amount: -5 as unknown as Measurement
        }
      ]
    });
    expect(validateDecorationIngredients(entity)).toFailWith(/at least one ID/i);
  });
});

describe('validateDecorationRatings', () => {
  test('should succeed when ratings is undefined', () => {
    const entity = makeEntity({ ratings: undefined });
    expect(validateDecorationRatings(entity)).toSucceedWith(true);
  });

  test('should succeed for empty ratings array', () => {
    const entity = makeEntity({ ratings: [] });
    expect(validateDecorationRatings(entity)).toSucceedWith(true);
  });

  test('should succeed for valid single rating', () => {
    const entity = makeEntity({
      ratings: [
        {
          category: 'difficulty' as RatingCategory,
          score: 3 as unknown as RatingScore
        }
      ]
    });
    expect(validateDecorationRatings(entity)).toSucceedWith(true);
  });

  test('should succeed for multiple valid ratings with different categories', () => {
    const entity = makeEntity({
      ratings: [
        {
          category: 'difficulty' as RatingCategory,
          score: 3 as unknown as RatingScore
        },
        {
          category: 'durability' as RatingCategory,
          score: 4 as unknown as RatingScore
        },
        {
          category: 'appearance' as RatingCategory,
          score: 5 as unknown as RatingScore
        }
      ]
    });
    expect(validateDecorationRatings(entity)).toSucceedWith(true);
  });

  test('should succeed for all valid categories', () => {
    const entity = makeEntity({
      ratings: [
        {
          category: 'difficulty' as RatingCategory,
          score: 1 as unknown as RatingScore
        },
        {
          category: 'durability' as RatingCategory,
          score: 2 as unknown as RatingScore
        },
        {
          category: 'appearance' as RatingCategory,
          score: 3 as unknown as RatingScore
        },
        {
          category: 'workability' as RatingCategory,
          score: 4 as unknown as RatingScore
        }
      ]
    });
    expect(validateDecorationRatings(entity)).toSucceedWith(true);
  });

  test('should succeed for score of 1', () => {
    const entity = makeEntity({
      ratings: [
        {
          category: 'difficulty' as RatingCategory,
          score: 1 as unknown as RatingScore
        }
      ]
    });
    expect(validateDecorationRatings(entity)).toSucceedWith(true);
  });

  test('should succeed for score of 5', () => {
    const entity = makeEntity({
      ratings: [
        {
          category: 'difficulty' as RatingCategory,
          score: 5 as unknown as RatingScore
        }
      ]
    });
    expect(validateDecorationRatings(entity)).toSucceedWith(true);
  });

  test('should fail for score less than 1', () => {
    const entity = makeEntity({
      ratings: [
        {
          category: 'difficulty' as RatingCategory,
          score: 0 as unknown as RatingScore
        }
      ]
    });
    expect(validateDecorationRatings(entity)).toFailWith(/between 1 and 5.*got 0/i);
  });

  test('should fail for negative score', () => {
    const entity = makeEntity({
      ratings: [
        {
          category: 'difficulty' as RatingCategory,
          score: -1 as unknown as RatingScore
        }
      ]
    });
    expect(validateDecorationRatings(entity)).toFailWith(/between 1 and 5.*got -1/i);
  });

  test('should fail for score greater than 5', () => {
    const entity = makeEntity({
      ratings: [
        {
          category: 'difficulty' as RatingCategory,
          score: 6 as unknown as RatingScore
        }
      ]
    });
    expect(validateDecorationRatings(entity)).toFailWith(/between 1 and 5.*got 6/i);
  });

  test('should fail for invalid category', () => {
    const entity = makeEntity({
      ratings: [
        {
          category: 'invalid-category' as unknown as RatingCategory,
          score: 3 as unknown as RatingScore
        }
      ]
    });
    expect(validateDecorationRatings(entity)).toFailWith(/not valid/i);
  });

  test('should fail for duplicate category', () => {
    const entity = makeEntity({
      ratings: [
        {
          category: 'difficulty' as RatingCategory,
          score: 3 as unknown as RatingScore
        },
        {
          category: 'difficulty' as RatingCategory,
          score: 4 as unknown as RatingScore
        }
      ]
    });
    expect(validateDecorationRatings(entity)).toFailWith(/duplicate.*difficulty/i);
  });

  test('should fail on first error when multiple ratings are invalid', () => {
    const entity = makeEntity({
      ratings: [
        {
          category: 'difficulty' as RatingCategory,
          score: 0 as unknown as RatingScore
        },
        {
          category: 'invalid' as unknown as RatingCategory,
          score: 3 as unknown as RatingScore
        }
      ]
    });
    expect(validateDecorationRatings(entity)).toFailWith(/between 1 and 5/i);
  });
});

describe('validateDecorationEntity', () => {
  test('should succeed for valid minimal entity', () => {
    const entity = makeEntity();
    expect(validateDecorationEntity(entity)).toSucceedWith(entity);
  });

  test('should succeed for valid complete entity', () => {
    const entity = makeEntity({
      name: 'Complete Decoration',
      ingredients: [
        {
          ingredient: {
            ids: ['gold-leaf' as unknown as IngredientId]
          },
          amount: 10 as unknown as Measurement
        }
      ],
      ratings: [
        {
          category: 'difficulty' as RatingCategory,
          score: 3 as unknown as RatingScore
        },
        {
          category: 'appearance' as RatingCategory,
          score: 5 as unknown as RatingScore
        }
      ]
    });
    expect(validateDecorationEntity(entity)).toSucceedWith(entity);
  });

  test('should return the same entity reference on success', () => {
    const entity = makeEntity();
    expect(validateDecorationEntity(entity)).toSucceedAndSatisfy((result) => {
      expect(result).toBe(entity);
    });
  });

  test('should fail for invalid name', () => {
    const entity = makeEntity({ name: '' });
    expect(validateDecorationEntity(entity)).toFailWith(/name must not be empty/i);
  });

  test('should fail for invalid ingredients', () => {
    const entity = makeEntity({
      ingredients: [
        {
          ingredient: {
            ids: []
          },
          amount: 10 as unknown as Measurement
        }
      ]
    });
    expect(validateDecorationEntity(entity)).toFailWith(/at least one ID/i);
  });

  test('should fail for invalid ingredient amount', () => {
    const entity = makeEntity({
      ingredients: [
        {
          ingredient: {
            ids: ['gold-leaf' as unknown as IngredientId]
          },
          amount: 0 as unknown as Measurement
        }
      ]
    });
    expect(validateDecorationEntity(entity)).toFailWith(/amount must be positive/i);
  });

  test('should fail for invalid rating score', () => {
    const entity = makeEntity({
      ratings: [
        {
          category: 'difficulty' as RatingCategory,
          score: 6 as unknown as RatingScore
        }
      ]
    });
    expect(validateDecorationEntity(entity)).toFailWith(/between 1 and 5/i);
  });

  test('should fail for invalid rating category', () => {
    const entity = makeEntity({
      ratings: [
        {
          category: 'invalid' as unknown as RatingCategory,
          score: 3 as unknown as RatingScore
        }
      ]
    });
    expect(validateDecorationEntity(entity)).toFailWith(/not valid/i);
  });

  test('should fail for duplicate rating category', () => {
    const entity = makeEntity({
      ratings: [
        {
          category: 'difficulty' as RatingCategory,
          score: 3 as unknown as RatingScore
        },
        {
          category: 'difficulty' as RatingCategory,
          score: 4 as unknown as RatingScore
        }
      ]
    });
    expect(validateDecorationEntity(entity)).toFailWith(/duplicate/i);
  });

  test('should fail on first validation error in chain', () => {
    const entity = makeEntity({
      name: '',
      ingredients: [
        {
          ingredient: {
            ids: []
          },
          amount: 10 as unknown as Measurement
        }
      ],
      ratings: [
        {
          category: 'difficulty' as RatingCategory,
          score: 10 as unknown as RatingScore
        }
      ]
    });
    expect(validateDecorationEntity(entity)).toFailWith(/name must not be empty/i);
  });

  test('should validate ingredients after name', () => {
    const entity = makeEntity({
      name: 'Valid Name',
      ingredients: [
        {
          ingredient: {
            ids: []
          },
          amount: 10 as unknown as Measurement
        }
      ],
      ratings: [
        {
          category: 'difficulty' as RatingCategory,
          score: 10 as unknown as RatingScore
        }
      ]
    });
    expect(validateDecorationEntity(entity)).toFailWith(/at least one ID/i);
  });

  test('should validate ratings after ingredients', () => {
    const entity = makeEntity({
      name: 'Valid Name',
      ingredients: [],
      ratings: [
        {
          category: 'difficulty' as RatingCategory,
          score: 10 as unknown as RatingScore
        }
      ]
    });
    expect(validateDecorationEntity(entity)).toFailWith(/between 1 and 5/i);
  });
});
