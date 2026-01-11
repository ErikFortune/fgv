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
  BaseConfectionId,
  BaseIngredientId,
  BaseFillingId,
  ConfectionId,
  ConfectionName,
  ConfectionVersionId,
  ConfectionVersionSpec,
  Measurement,
  Helpers,
  IngredientId,
  JournalId,
  Percentage,
  RatingScore,
  FillingId,
  FillingVersionId,
  FillingVersionSpec,
  SessionId,
  SlotId,
  SourceId,
  UrlCategory,
  Validation
} from '../../../packlets/common';

const {
  isValidSourceId,
  isValidBaseIngredientId,
  isValidBaseMoldId,
  isValidBaseProcedureId,
  isValidBaseFillingId,
  isValidIngredientId,
  isValidMoldId,
  isValidProcedureId,
  isValidFillingId,
  isValidFillingName,
  isValidFillingVersionSpec,
  isValidFillingVersionId,
  isValidSessionId,
  isValidJournalId,
  isValidRatingScore,
  isValidMeasurement,
  isValidPercentage,
  isValidCelsius,
  isValidDegreesMacMichael,
  toSourceId,
  toBaseIngredientId,
  toBaseMoldId,
  toBaseProcedureId,
  toBaseFillingId,
  toIngredientId,
  toMoldId,
  toProcedureId,
  toFillingId,
  toFillingName,
  toFillingVersionSpec,
  toFillingVersionId,
  toSessionId,
  toJournalId,
  isValidSlotId,
  toSlotId,
  toRatingScore,
  toMeasurement,
  toPercentage,
  toCelsius,
  toDegreesMacMichael,
  toBaseConfectionId,
  toConfectionId,
  toConfectionName,
  toConfectionVersionSpec,
  isValidConfectionVersionId,
  toConfectionVersionId,
  isValidUrlCategory,
  toUrlCategory
} = Validation;

const {
  createIngredientId,
  createFillingId,
  createFillingVersionId,
  parseIngredientId,
  parseFillingId,
  parseFillingVersionId,
  getIngredientSourceId,
  getIngredientBaseId,
  getFillingSourceId,
  getFillingBaseId,
  getFillingVersionFillingId,
  getFillingVersionSpec
} = Helpers;

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
      ['isValidBaseMoldId', isValidBaseMoldId],
      ['isValidBaseProcedureId', isValidBaseProcedureId],
      ['isValidBaseFillingId', isValidBaseFillingId]
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
      ['isValidMoldId', isValidMoldId],
      ['isValidProcedureId', isValidProcedureId],
      ['isValidFillingId', isValidFillingId]
    ])('%s', (_name, fn) => {
      test.each(validCompositeIds)('returns true for %s', (_desc, input) => {
        expect(fn(input)).toBe(true);
      });

      test.each(invalidCompositeIds)('returns false for %s', (_desc, input) => {
        expect(fn(input)).toBe(false);
      });
    });
  });

  describe('isValidFillingName', () => {
    test.each([
      ['valid name', 'Classic Dark Chocolate Ganache', true],
      ['short name', 'Test', true],
      ['empty string', '', false],
      ['number', 123, false],
      ['null', null, false]
    ])('%s: isValidFillingName(%p) returns %p', (_desc, input, expected) => {
      expect(isValidFillingName(input)).toBe(expected);
    });
  });

  describe('isValidFillingVersionSpec', () => {
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
    ])('%s: isValidFillingVersionSpec(%p) returns %p', (_desc, input, expected) => {
      expect(isValidFillingVersionSpec(input)).toBe(expected);
    });
  });

  // ============================================================================
  // Numeric Type Guards
  // ============================================================================

  describe('Numeric type guards', () => {
    describe('isValidMeasurement', () => {
      test.each([
        ['positive integer', 100, true],
        ['zero', 0, true],
        ['positive decimal', 0.5, true],
        ['large decimal', 1000.5, true],
        ['negative', -1, false],
        ['infinity', Infinity, false],
        ['NaN', NaN, false],
        ['string', '100', false]
      ])('%s: isValidMeasurement(%p) returns %p', (_desc, input, expected) => {
        expect(isValidMeasurement(input)).toBe(expected);
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
      ['toBaseMoldId', toBaseMoldId, 'cw-2227', 'mold.id', /Invalid BaseMoldId/],
      ['toBaseProcedureId', toBaseProcedureId, 'ganache-cold', 'proc.id', /Invalid BaseProcedureId/],
      ['toBaseFillingId', toBaseFillingId, 'classic-ganache', 'recipe.id', /Invalid BaseFillingId/]
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
      ['toMoldId', toMoldId, 'common.cw-2227', 'cw-2227', /Invalid MoldId/],
      ['toProcedureId', toProcedureId, 'common.ganache-cold', 'ganache-cold', /Invalid ProcedureId/],
      ['toFillingId', toFillingId, 'user.classic-ganache', 'classic-ganache', /Invalid FillingId/]
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

  describe('toFillingName', () => {
    test('succeeds with valid recipe name', () => {
      expect(toFillingName('My Recipe')).toSucceedAndSatisfy((result) => {
        expect(result).toBe('My Recipe');
      });
    });

    test('fails with empty string', () => {
      expect(toFillingName('')).toFailWith(/Invalid FillingName/);
    });
  });

  describe('toFillingVersionSpec', () => {
    test('succeeds with valid basic version ID', () => {
      expect(toFillingVersionSpec('2026-01-03-01')).toSucceedWith('2026-01-03-01' as FillingVersionSpec);
    });

    test('succeeds with version ID with label', () => {
      expect(toFillingVersionSpec('2026-01-03-02-tweaked')).toSucceedWith(
        '2026-01-03-02-tweaked' as FillingVersionSpec
      );
    });

    test('fails with missing counter', () => {
      expect(toFillingVersionSpec('2026-01-03')).toFailWith(/Invalid FillingVersionSpec/);
    });

    test('fails with invalid format', () => {
      expect(toFillingVersionSpec('invalid')).toFailWith(/Invalid FillingVersionSpec/);
    });

    test('fails with uppercase label', () => {
      expect(toFillingVersionSpec('2026-01-03-01-WRONG')).toFailWith(/Invalid FillingVersionSpec/);
    });

    test('fails with empty string', () => {
      expect(toFillingVersionSpec('')).toFailWith(/Invalid FillingVersionSpec/);
    });

    test('fails with non-string', () => {
      expect(toFillingVersionSpec(123)).toFailWith(/Invalid FillingVersionSpec/);
    });
  });

  // ============================================================================
  // SessionId Validation
  // ============================================================================

  describe('SessionId validation', () => {
    const validSessionIds: [string, string][] = [
      ['basic format', '2026-01-15-143025-a1b2c3d4'],
      ['midnight', '2026-01-01-000000-00000000'],
      ['end of day', '2026-12-31-235959-ffffffff'],
      ['hex digits', '2026-06-15-120030-abcdef12']
    ];

    const invalidSessionIds: [string, unknown][] = [
      ['empty string', ''],
      ['missing random part', '2026-01-15-143025'],
      ['wrong date format', '26-01-15-143025-a1b2c3d4'],
      ['uppercase hex', '2026-01-15-143025-A1B2C3D4'],
      ['too short random', '2026-01-15-143025-a1b2c3'],
      ['too long random', '2026-01-15-143025-a1b2c3d4e5'],
      ['non-hex characters', '2026-01-15-143025-ghijklmn'],
      ['too short time (4 digits)', '2026-01-15-1430-a1b2c3d4'],
      ['number', 123],
      ['null', null],
      ['undefined', undefined],
      ['old format', 'l1234567-abc12345']
    ];

    describe('isValidSessionId', () => {
      test.each(validSessionIds)('returns true for %s', (_desc, value) => {
        expect(isValidSessionId(value)).toBe(true);
      });

      test.each(invalidSessionIds)('returns false for %s', (_desc, value) => {
        expect(isValidSessionId(value)).toBe(false);
      });
    });

    describe('toSessionId', () => {
      test.each(validSessionIds)('succeeds with %s', (_desc, value) => {
        expect(toSessionId(value)).toSucceedWith(value as SessionId);
      });

      test.each(invalidSessionIds)('fails with %s', (_desc, value) => {
        expect(toSessionId(value)).toFailWith(/Invalid SessionId/);
      });
    });
  });

  // ============================================================================
  // JournalId Validation
  // ============================================================================

  describe('JournalId validation', () => {
    const validJournalIds: [string, string][] = [
      ['basic format', '2026-01-15-143025-a1b2c3d4'],
      ['midnight', '2026-01-01-000000-00000000'],
      ['end of day', '2026-12-31-235959-ffffffff'],
      ['hex digits', '2026-06-15-120030-abcdef12']
    ];

    const invalidJournalIds: [string, unknown][] = [
      ['empty string', ''],
      ['missing random part', '2026-01-15-143025'],
      ['wrong date format', '26-01-15-143025-a1b2c3d4'],
      ['uppercase hex', '2026-01-15-143025-A1B2C3D4'],
      ['too short random', '2026-01-15-143025-a1b2c3'],
      ['too long random', '2026-01-15-143025-a1b2c3d4e5'],
      ['non-hex characters', '2026-01-15-143025-ghijklmn'],
      ['too short time (4 digits)', '2026-01-15-1430-a1b2c3d4'],
      ['number', 123],
      ['null', null],
      ['undefined', undefined],
      ['old format', 'journal-l1234567-abc12345']
    ];

    describe('isValidJournalId', () => {
      test.each(validJournalIds)('returns true for %s', (_desc, value) => {
        expect(isValidJournalId(value)).toBe(true);
      });

      test.each(invalidJournalIds)('returns false for %s', (_desc, value) => {
        expect(isValidJournalId(value)).toBe(false);
      });
    });

    describe('toJournalId', () => {
      test.each(validJournalIds)('succeeds with %s', (_desc, value) => {
        expect(toJournalId(value)).toSucceedWith(value as JournalId);
      });

      test.each(invalidJournalIds)('fails with %s', (_desc, value) => {
        expect(toJournalId(value)).toFailWith(/Invalid JournalId/);
      });
    });
  });

  // ============================================================================
  // SlotId Validation
  // ============================================================================

  describe('SlotId validation', () => {
    const validSlotIds: [string, string][] = [
      ['simple id', 'center'],
      ['with dash', 'outer-layer'],
      ['with underscore', 'layer_1'],
      ['mixed', 'inner-layer_2'],
      ['numbers only', '123'],
      ['alphanumeric', 'slot1abc']
    ];

    const invalidSlotIds: [string, unknown][] = [
      ['empty string', ''],
      ['with dot', 'center.layer'],
      ['with space', 'center layer'],
      ['number', 123],
      ['null', null],
      ['undefined', undefined]
    ];

    describe('isValidSlotId', () => {
      test.each(validSlotIds)('returns true for %s', (_desc, value) => {
        expect(isValidSlotId(value)).toBe(true);
      });

      test.each(invalidSlotIds)('returns false for %s', (_desc, value) => {
        expect(isValidSlotId(value)).toBe(false);
      });
    });

    describe('toSlotId', () => {
      test.each(validSlotIds)('succeeds with %s', (_desc, value) => {
        expect(toSlotId(value)).toSucceedWith(value as SlotId);
      });

      test.each(invalidSlotIds)('fails with %s', (_desc, value) => {
        expect(toSlotId(value)).toFailWith(/Invalid SlotId/);
      });
    });
  });

  // ============================================================================
  // Numeric Converters
  // ============================================================================

  describe('Numeric converters', () => {
    describe('toMeasurement', () => {
      test.each([
        ['valid measurement', 100, 100],
        ['zero', 0, 0],
        ['decimal', 50.5, 50.5]
      ])('succeeds with %s', (_desc, input, expected) => {
        expect(toMeasurement(input)).toSucceedWith(expected as Measurement);
      });

      test('fails with negative value', () => {
        expect(toMeasurement(-1)).toFailWith(/Invalid Measurement/);
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

      test('createFillingId creates composite ID', () => {
        const sourceId = 'user' as SourceId;
        const baseId = 'classic-ganache' as BaseFillingId;
        expect(createFillingId(sourceId, baseId)).toBe('user.classic-ganache');
      });
    });

    describe('parse helpers', () => {
      test('parseIngredientId parses composite ID', () => {
        const id = 'felchlin.maracaibo-65' as IngredientId;
        expect(parseIngredientId(id)).toSucceedAndSatisfy((parsed) => {
          expect(parsed.collectionId).toBe('felchlin');
          expect(parsed.itemId).toBe('maracaibo-65');
          expect(parsed.separator).toBe('.');
        });
      });

      test('parseIngredientId fails with invalid format', () => {
        expect(parseIngredientId('invalid' as IngredientId)).toFailWith(/separator.*not found/i);
      });

      test('parseFillingId parses composite ID', () => {
        const id = 'user.classic-ganache' as FillingId;
        expect(parseFillingId(id)).toSucceedAndSatisfy((parsed) => {
          expect(parsed.collectionId).toBe('user');
          expect(parsed.itemId).toBe('classic-ganache');
          expect(parsed.separator).toBe('.');
        });
      });

      test('parseFillingId fails with invalid format', () => {
        expect(parseFillingId('invalid' as unknown as FillingId)).toFailWith(/separator.*not found/i);
      });
    });

    describe('get helpers', () => {
      test.each([
        ['getIngredientSourceId', getIngredientSourceId, 'felchlin.maracaibo-65', 'felchlin'],
        ['getIngredientBaseId', getIngredientBaseId, 'felchlin.maracaibo-65', 'maracaibo-65'],
        ['getFillingSourceId', getFillingSourceId, 'user.classic-ganache', 'user'],
        ['getFillingBaseId', getFillingBaseId, 'user.classic-ganache', 'classic-ganache']
      ])('%s extracts correct part', (_name, fn, input, expected) => {
        expect(fn(input as IngredientId & FillingId)).toBe(expected);
      });
    });
  });

  // ============================================================================
  // FillingVersionId Tests
  // ============================================================================

  describe('FillingVersionId validation', () => {
    const validVersionIds: [string, string][] = [
      ['simple', 'user.ganache@2026-01-03-01'],
      ['with label', 'felchlin.truffle@2026-01-03-02-less-sugar'],
      ['complex recipe id', 'my-source.my_recipe@2026-12-31-99']
    ];

    const invalidVersionIds: [string, unknown][] = [
      ['missing @', 'user.ganache2026-01-03-01'],
      ['missing recipe id', '@2026-01-03-01'],
      ['missing version spec', 'user.ganache@'],
      ['invalid recipe id', 'invalid@2026-01-03-01'],
      ['invalid version spec', 'user.ganache@invalid'],
      ['multiple @', 'user.ganache@2026-01-03-01@extra'],
      ['empty string', ''],
      ['number', 123],
      ['null', null]
    ];

    describe('isValidFillingVersionId', () => {
      test.each(validVersionIds)('%s: returns true for valid FillingVersionId', (_name, value) => {
        expect(isValidFillingVersionId(value)).toBe(true);
      });

      test.each(invalidVersionIds)('%s: returns false for invalid FillingVersionId', (_name, value) => {
        expect(isValidFillingVersionId(value)).toBe(false);
      });
    });

    describe('toFillingVersionId', () => {
      test.each(validVersionIds)('%s: succeeds for valid FillingVersionId', (_name, value) => {
        expect(toFillingVersionId(value)).toSucceedWith(value as FillingVersionId);
      });

      test.each(invalidVersionIds)('%s: fails for invalid FillingVersionId', (_name, value) => {
        expect(toFillingVersionId(value)).toFailWith(/Invalid FillingVersionId/i);
      });
    });
  });

  describe('FillingVersionId helpers', () => {
    describe('createFillingVersionId', () => {
      test('creates composite ID', () => {
        const recipeId = 'user.ganache' as FillingId;
        const versionSpec = '2026-01-03-01' as FillingVersionSpec;
        expect(createFillingVersionId(recipeId, versionSpec)).toBe('user.ganache@2026-01-03-01');
      });

      test('creates composite ID with label', () => {
        const recipeId = 'felchlin.truffle' as FillingId;
        const versionSpec = '2026-01-03-02-less-sugar' as FillingVersionSpec;
        expect(createFillingVersionId(recipeId, versionSpec)).toBe(
          'felchlin.truffle@2026-01-03-02-less-sugar'
        );
      });
    });

    describe('parseFillingVersionId', () => {
      test('parses composite ID', () => {
        const id = 'user.ganache@2026-01-03-01' as FillingVersionId;
        expect(parseFillingVersionId(id)).toSucceedAndSatisfy((parsed) => {
          expect(parsed.collectionId).toBe('user.ganache');
          expect(parsed.itemId).toBe('2026-01-03-01');
          expect(parsed.separator).toBe('@');
        });
      });

      test('parses composite ID with label', () => {
        const id = 'felchlin.truffle@2026-01-03-02-less-sugar' as FillingVersionId;
        expect(parseFillingVersionId(id)).toSucceedAndSatisfy((parsed) => {
          expect(parsed.collectionId).toBe('felchlin.truffle');
          expect(parsed.itemId).toBe('2026-01-03-02-less-sugar');
          expect(parsed.separator).toBe('@');
        });
      });

      test('fails with invalid format', () => {
        expect(parseFillingVersionId('invalid' as FillingVersionId)).toFailWith(/separator.*not found/i);
      });
    });

    describe('get helpers', () => {
      test('getFillingVersionFillingId extracts recipe ID', () => {
        const id = 'user.ganache@2026-01-03-01' as FillingVersionId;
        expect(getFillingVersionFillingId(id)).toBe('user.ganache');
      });

      test('getFillingVersionSpec extracts version spec', () => {
        const id = 'user.ganache@2026-01-03-01' as FillingVersionId;
        expect(getFillingVersionSpec(id)).toBe('2026-01-03-01');
      });

      test('getFillingVersionSpec extracts version spec with label', () => {
        const id = 'felchlin.truffle@2026-01-03-02-less-sugar' as FillingVersionId;
        expect(getFillingVersionSpec(id)).toBe('2026-01-03-02-less-sugar');
      });
    });
  });

  // ============================================================================
  // Confection ID Validators
  // ============================================================================

  describe('Confection ID validators', () => {
    describe('toBaseConfectionId', () => {
      test('succeeds with valid ID', () => {
        expect(toBaseConfectionId('dark-dome-bonbon')).toSucceedWith('dark-dome-bonbon' as BaseConfectionId);
      });

      test('fails with empty string', () => {
        expect(toBaseConfectionId('')).toFailWith(/Invalid BaseConfectionId/);
      });

      test('fails with dots', () => {
        expect(toBaseConfectionId('bad.id')).toFailWith(/Invalid BaseConfectionId/);
      });
    });

    describe('toConfectionId', () => {
      test('succeeds with valid composite ID', () => {
        expect(toConfectionId('common.dark-dome-bonbon')).toSucceedWith(
          'common.dark-dome-bonbon' as ConfectionId
        );
      });

      test('fails with missing dot', () => {
        expect(toConfectionId('nobonbondot')).toFailWith(/Invalid ConfectionId/);
      });
    });

    describe('toConfectionName', () => {
      test('succeeds with valid name', () => {
        expect(toConfectionName('Classic Dark Dome Bonbon')).toSucceedWith(
          'Classic Dark Dome Bonbon' as ConfectionName
        );
      });

      test('fails with empty string', () => {
        expect(toConfectionName('')).toFailWith(/Invalid ConfectionName/);
      });
    });

    describe('toConfectionVersionSpec', () => {
      test('succeeds with valid spec', () => {
        expect(toConfectionVersionSpec('2026-01-01-01')).toSucceedWith(
          '2026-01-01-01' as ConfectionVersionSpec
        );
      });

      test('fails with invalid format', () => {
        expect(toConfectionVersionSpec('invalid')).toFailWith(/Invalid ConfectionVersionSpec/);
      });
    });

    describe('isValidConfectionVersionId', () => {
      test('returns true for valid ID', () => {
        expect(isValidConfectionVersionId('common.bonbon@2026-01-01-01')).toBe(true);
      });

      test('returns false for non-string', () => {
        expect(isValidConfectionVersionId(123)).toBe(false);
      });

      test('returns false for missing separator', () => {
        expect(isValidConfectionVersionId('common.bonbon')).toBe(false);
      });

      test('returns false for invalid confection ID part', () => {
        expect(isValidConfectionVersionId('nobonbondot@2026-01-01-01')).toBe(false);
      });
    });

    describe('toConfectionVersionId', () => {
      test('succeeds with valid ID', () => {
        expect(toConfectionVersionId('common.bonbon@2026-01-01-01')).toSucceedWith(
          'common.bonbon@2026-01-01-01' as ConfectionVersionId
        );
      });

      test('fails with invalid format', () => {
        expect(toConfectionVersionId('invalid')).toFailWith(/Invalid ConfectionVersionId/);
      });
    });
  });

  describe('URL Category validators', () => {
    describe('isValidUrlCategory', () => {
      test('returns true for valid categories', () => {
        expect(isValidUrlCategory('manufacturer')).toBe(true);
        expect(isValidUrlCategory('product-page')).toBe(true);
        expect(isValidUrlCategory('video_tutorial')).toBe(true);
        expect(isValidUrlCategory('documentation123')).toBe(true);
      });

      test('returns false for non-string', () => {
        expect(isValidUrlCategory(123)).toBe(false);
        expect(isValidUrlCategory(null)).toBe(false);
        expect(isValidUrlCategory(undefined)).toBe(false);
      });

      test('returns false for empty string', () => {
        expect(isValidUrlCategory('')).toBe(false);
      });

      test('returns false for strings with dots', () => {
        expect(isValidUrlCategory('bad.category')).toBe(false);
      });

      test('returns false for strings with invalid characters', () => {
        expect(isValidUrlCategory('bad category')).toBe(false);
        expect(isValidUrlCategory('bad@category')).toBe(false);
      });
    });

    describe('toUrlCategory', () => {
      test('succeeds with valid category', () => {
        expect(toUrlCategory('manufacturer')).toSucceedWith('manufacturer' as UrlCategory);
        expect(toUrlCategory('product-page')).toSucceedWith('product-page' as UrlCategory);
        expect(toUrlCategory('video_tutorial')).toSucceedWith('video_tutorial' as UrlCategory);
      });

      test('fails with empty string', () => {
        expect(toUrlCategory('')).toFailWith(/Invalid UrlCategory/);
      });

      test('fails with dots', () => {
        expect(toUrlCategory('bad.category')).toFailWith(/Invalid UrlCategory/);
      });

      test('fails with non-string', () => {
        expect(toUrlCategory(123)).toFailWith(/Invalid UrlCategory/);
      });
    });
  });
});
