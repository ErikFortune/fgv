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
  BaseIngredientId,
  BaseRecipeId,
  Grams,
  IngredientId,
  Percentage,
  RatingScore,
  RecipeId,
  RecipeVersionId,
  SourceId,
  Validation
} from '../../../packlets/common';

const {
  isValidSourceId,
  isValidBaseIngredientId,
  isValidBaseRecipeId,
  isValidIngredientId,
  isValidRecipeId,
  isValidRecipeName,
  isValidRecipeVersionId,
  isValidRatingScore,
  isValidGrams,
  isValidPercentage,
  isValidCelsius,
  isValidDegreesMacMichael,
  toSourceId,
  toBaseIngredientId,
  toBaseRecipeId,
  toIngredientId,
  toRecipeId,
  toRecipeName,
  toRecipeVersionId,
  toRatingScore,
  toGrams,
  toPercentage,
  toCelsius,
  toDegreesMacMichael,
  createIngredientId,
  createRecipeId,
  parseIngredientId,
  parseRecipeId,
  getIngredientSourceId,
  getIngredientBaseId,
  getRecipeSourceId,
  getRecipeBaseId
} = Validation;

describe('Common validation', () => {
  // ============================================================================
  // Base ID Type Guards - All use same pattern
  // ============================================================================

  describe('Base ID type guards', () => {
    const validBaseIds: [string, unknown][] = [
      ['simple', 'common'],
      ['with-dashes', 'my-source'],
      ['with_underscores', 'my_source'],
      ['alphanumeric', 'Source123']
    ];

    const invalidBaseIds: [string, unknown][] = [
      ['empty string', ''],
      ['with dot', 'source.id'],
      ['with slash', 'source/id'],
      ['number', 123],
      ['null', null],
      ['undefined', undefined]
    ];

    describe.each([
      ['isValidSourceId', isValidSourceId],
      ['isValidBaseIngredientId', isValidBaseIngredientId],
      ['isValidBaseRecipeId', isValidBaseRecipeId]
    ])('%s', (_name, fn) => {
      test.each(validBaseIds)('returns true for %s', (_desc, input) => {
        expect(fn(input)).toBe(true);
      });

      test.each(invalidBaseIds)('returns false for %s', (_desc, input) => {
        expect(fn(input)).toBe(false);
      });
    });
  });

  // ============================================================================
  // Composite ID Type Guards
  // ============================================================================

  describe('Composite ID type guards', () => {
    const validCompositeIds: [string, unknown][] = [
      ['simple', 'source.ingredient'],
      ['with dashes', 'felchlin.maracaibo-65'],
      ['with underscores', 'common.butter_82']
    ];

    const invalidCompositeIds: [string, unknown][] = [
      ['no dot', 'maracaibo-65'],
      ['multiple dots', 'source.ingredient.extra'],
      ['empty string', ''],
      ['trailing dot', 'source.'],
      ['leading dot', '.ingredient'],
      ['number', 123]
    ];

    describe.each([
      ['isValidIngredientId', isValidIngredientId],
      ['isValidRecipeId', isValidRecipeId]
    ])('%s', (_name, fn) => {
      test.each(validCompositeIds)('returns true for %s', (_desc, input) => {
        expect(fn(input)).toBe(true);
      });

      test.each(invalidCompositeIds)('returns false for %s', (_desc, input) => {
        expect(fn(input)).toBe(false);
      });
    });
  });

  describe('isValidRecipeName', () => {
    test.each([
      ['valid name', 'Classic Dark Chocolate Ganache', true],
      ['short name', 'Test', true],
      ['empty string', '', false],
      ['number', 123, false],
      ['null', null, false]
    ])('%s: isValidRecipeName(%p) returns %p', (_desc, input, expected) => {
      expect(isValidRecipeName(input)).toBe(expected);
    });
  });

  describe('isValidRecipeVersionId', () => {
    test.each([
      ['basic version', '2026-01-03-01', true],
      ['with label', '2026-01-03-02-tweaked', true],
      ['with longer label', '2026-01-03-05-less-sugar', true],
      ['with numbers in label', '2026-12-31-99-v2', true],
      ['missing counter', '2026-01-03', false],
      ['invalid date format', '26-01-03-01', false],
      ['uppercase label', '2026-01-03-01-TWEAKED', false],
      ['spaces in label', '2026-01-03-01-less sugar', false],
      ['empty string', '', false],
      ['number', 123, false],
      ['null', null, false]
    ])('%s: isValidRecipeVersionId(%p) returns %p', (_desc, input, expected) => {
      expect(isValidRecipeVersionId(input)).toBe(expected);
    });
  });

  // ============================================================================
  // Numeric Type Guards
  // ============================================================================

  describe('Numeric type guards', () => {
    describe('isValidGrams', () => {
      test.each([
        ['positive integer', 100, true],
        ['zero', 0, true],
        ['positive decimal', 0.5, true],
        ['large decimal', 1000.5, true],
        ['negative', -1, false],
        ['infinity', Infinity, false],
        ['NaN', NaN, false],
        ['string', '100', false]
      ])('%s: isValidGrams(%p) returns %p', (_desc, input, expected) => {
        expect(isValidGrams(input)).toBe(expected);
      });
    });

    describe('isValidPercentage', () => {
      test.each([
        ['middle value', 50, true],
        ['zero', 0, true],
        ['hundred', 100, true],
        ['decimal', 0.5, true],
        ['negative', -1, false],
        ['over 100', 101, false],
        ['infinity', Infinity, false],
        ['string', '50', false]
      ])('%s: isValidPercentage(%p) returns %p', (_desc, input, expected) => {
        expect(isValidPercentage(input)).toBe(expected);
      });
    });

    describe('isValidCelsius', () => {
      test.each([
        ['positive', 25, true],
        ['negative', -40, true],
        ['zero', 0, true],
        ['decimal', 100.5, true],
        ['infinity', Infinity, false],
        ['NaN', NaN, false],
        ['string', '25', false]
      ])('%s: isValidCelsius(%p) returns %p', (_desc, input, expected) => {
        expect(isValidCelsius(input)).toBe(expected);
      });
    });

    describe('isValidDegreesMacMichael', () => {
      test.each([
        ['positive', 100, true],
        ['zero', 0, true],
        ['decimal', 500.5, true],
        ['negative', -1, false],
        ['infinity', Infinity, false],
        ['string', '100', false]
      ])('%s: isValidDegreesMacMichael(%p) returns %p', (_desc, input, expected) => {
        expect(isValidDegreesMacMichael(input)).toBe(expected);
      });
    });

    describe('isValidRatingScore', () => {
      test.each([
        ['minimum (1)', 1, true],
        ['middle (3)', 3, true],
        ['maximum (5)', 5, true],
        ['zero', 0, false],
        ['negative', -1, false],
        ['above max (6)', 6, false],
        ['decimal', 3.5, false],
        ['infinity', Infinity, false],
        ['NaN', NaN, false],
        ['string', '3', false],
        ['null', null, false]
      ])('%s: isValidRatingScore(%p) returns %p', (_desc, input, expected) => {
        expect(isValidRatingScore(input)).toBe(expected);
      });
    });
  });

  // ============================================================================
  // Base ID Converters
  // ============================================================================

  describe('Base ID converters', () => {
    describe.each([
      ['toSourceId', toSourceId, 'felchlin', 'source.id', /Invalid SourceId/],
      ['toBaseIngredientId', toBaseIngredientId, 'maracaibo-65', 'base.id', /Invalid BaseIngredientId/],
      ['toBaseRecipeId', toBaseRecipeId, 'classic-ganache', 'recipe.id', /Invalid BaseRecipeId/]
    ])('%s', (_name, fn, validInput, invalidInput, errorPattern) => {
      test(`succeeds with valid input "${validInput}"`, () => {
        expect(fn(validInput)).toSucceedAndSatisfy((result) => {
          expect(result).toBe(validInput);
        });
      });

      test(`fails with invalid input "${invalidInput}"`, () => {
        expect(fn(invalidInput)).toFailWith(errorPattern);
      });

      test('fails with empty string', () => {
        expect(fn('')).toFail();
      });
    });
  });

  // ============================================================================
  // Composite ID Converters
  // ============================================================================

  describe('Composite ID converters', () => {
    describe.each([
      ['toIngredientId', toIngredientId, 'felchlin.maracaibo-65', 'maracaibo-65', /Invalid IngredientId/],
      ['toRecipeId', toRecipeId, 'user.classic-ganache', 'classic-ganache', /Invalid RecipeId/]
    ])('%s', (_name, fn, validInput, invalidInput, errorPattern) => {
      test(`succeeds with valid input "${validInput}"`, () => {
        expect(fn(validInput)).toSucceedAndSatisfy((result) => {
          expect(result).toBe(validInput);
        });
      });

      test(`fails with base ID only "${invalidInput}"`, () => {
        expect(fn(invalidInput)).toFailWith(errorPattern);
      });

      test('fails with too many dots', () => {
        expect(fn('source.item.extra')).toFail();
      });
    });
  });

  describe('toRecipeName', () => {
    test('succeeds with valid recipe name', () => {
      expect(toRecipeName('My Recipe')).toSucceedAndSatisfy((result) => {
        expect(result).toBe('My Recipe');
      });
    });

    test('fails with empty string', () => {
      expect(toRecipeName('')).toFailWith(/Invalid RecipeName/);
    });
  });

  describe('toRecipeVersionId', () => {
    test('succeeds with valid basic version ID', () => {
      expect(toRecipeVersionId('2026-01-03-01')).toSucceedWith('2026-01-03-01' as RecipeVersionId);
    });

    test('succeeds with version ID with label', () => {
      expect(toRecipeVersionId('2026-01-03-02-tweaked')).toSucceedWith(
        '2026-01-03-02-tweaked' as RecipeVersionId
      );
    });

    test('fails with missing counter', () => {
      expect(toRecipeVersionId('2026-01-03')).toFailWith(/Invalid RecipeVersionId/);
    });

    test('fails with invalid format', () => {
      expect(toRecipeVersionId('invalid')).toFailWith(/Invalid RecipeVersionId/);
    });

    test('fails with uppercase label', () => {
      expect(toRecipeVersionId('2026-01-03-01-WRONG')).toFailWith(/Invalid RecipeVersionId/);
    });

    test('fails with empty string', () => {
      expect(toRecipeVersionId('')).toFailWith(/Invalid RecipeVersionId/);
    });

    test('fails with non-string', () => {
      expect(toRecipeVersionId(123)).toFailWith(/Invalid RecipeVersionId/);
    });
  });

  // ============================================================================
  // Numeric Converters
  // ============================================================================

  describe('Numeric converters', () => {
    describe('toGrams', () => {
      test.each([
        ['valid grams', 100, 100],
        ['zero', 0, 0],
        ['decimal', 50.5, 50.5]
      ])('succeeds with %s', (_desc, input, expected) => {
        expect(toGrams(input)).toSucceedWith(expected as Grams);
      });

      test('fails with negative value', () => {
        expect(toGrams(-1)).toFailWith(/Invalid Grams/);
      });
    });

    describe('toPercentage', () => {
      test.each([
        ['middle value', 50, 50],
        ['zero', 0, 0],
        ['hundred', 100, 100]
      ])('succeeds with %s', (_desc, input, expected) => {
        expect(toPercentage(input)).toSucceedWith(expected as Percentage);
      });

      test.each([
        ['negative', -1],
        ['over 100', 101]
      ])('fails with %s', (_desc, input) => {
        expect(toPercentage(input)).toFailWith(/Invalid Percentage/);
      });
    });

    describe('toCelsius', () => {
      test.each([25, -40, 0, 100.5])('succeeds with %p', (input) => {
        expect(toCelsius(input)).toSucceed();
      });

      test('fails with non-finite value', () => {
        expect(toCelsius(Infinity)).toFailWith(/Invalid Celsius/);
      });
    });

    describe('toDegreesMacMichael', () => {
      test('succeeds with valid value', () => {
        expect(toDegreesMacMichael(100)).toSucceed();
      });

      test('fails with negative value', () => {
        expect(toDegreesMacMichael(-1)).toFailWith(/Invalid DegreesMacMichael/);
      });
    });

    describe('toRatingScore', () => {
      test.each([
        ['minimum (1)', 1, 1],
        ['middle (3)', 3, 3],
        ['maximum (5)', 5, 5]
      ])('succeeds with %s', (_desc, input, expected) => {
        expect(toRatingScore(input)).toSucceedWith(expected as RatingScore);
      });

      test.each([
        ['zero', 0],
        ['negative', -1],
        ['above max (6)', 6],
        ['decimal', 3.5]
      ])('fails with %s', (_desc, input) => {
        expect(toRatingScore(input)).toFailWith(/Invalid RatingScore/);
      });

      test('fails with non-number', () => {
        expect(toRatingScore('3')).toFailWith(/Invalid RatingScore/);
      });
    });
  });

  // ============================================================================
  // Composite ID Helpers
  // ============================================================================

  describe('Composite ID helpers', () => {
    describe('create helpers', () => {
      test('createIngredientId creates composite ID', () => {
        const sourceId = 'felchlin' as SourceId;
        const baseId = 'maracaibo-65' as BaseIngredientId;
        expect(createIngredientId(sourceId, baseId)).toBe('felchlin.maracaibo-65');
      });

      test('createRecipeId creates composite ID', () => {
        const sourceId = 'user' as SourceId;
        const baseId = 'classic-ganache' as BaseRecipeId;
        expect(createRecipeId(sourceId, baseId)).toBe('user.classic-ganache');
      });
    });

    describe('parse helpers', () => {
      test('parseIngredientId parses composite ID', () => {
        const id = 'felchlin.maracaibo-65' as IngredientId;
        expect(parseIngredientId(id)).toSucceedAndSatisfy(([sourceId, baseId]) => {
          expect(sourceId).toBe('felchlin');
          expect(baseId).toBe('maracaibo-65');
        });
      });

      test('parseIngredientId fails with invalid format', () => {
        expect(parseIngredientId('invalid' as IngredientId)).toFailWith(/Invalid IngredientId format/);
      });

      test('parseRecipeId parses composite ID', () => {
        const id = 'user.classic-ganache' as RecipeId;
        expect(parseRecipeId(id)).toSucceedAndSatisfy(([sourceId, baseId]) => {
          expect(sourceId).toBe('user');
          expect(baseId).toBe('classic-ganache');
        });
      });

      test('parseRecipeId fails with invalid format', () => {
        expect(parseRecipeId('invalid' as unknown as RecipeId)).toFailWith(/Invalid RecipeId format/);
      });
    });

    describe('get helpers', () => {
      test.each([
        ['getIngredientSourceId', getIngredientSourceId, 'felchlin.maracaibo-65', 'felchlin'],
        ['getIngredientBaseId', getIngredientBaseId, 'felchlin.maracaibo-65', 'maracaibo-65'],
        ['getRecipeSourceId', getRecipeSourceId, 'user.classic-ganache', 'user'],
        ['getRecipeBaseId', getRecipeBaseId, 'user.classic-ganache', 'classic-ganache']
      ])('%s extracts correct part', (_name, fn, input, expected) => {
        expect(fn(input as IngredientId & RecipeId)).toBe(expected);
      });
    });
  });
});
