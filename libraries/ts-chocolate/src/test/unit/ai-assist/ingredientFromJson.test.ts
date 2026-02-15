// Copyright (c) 2024 Erik Fortune
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

import { parseIngredientJson } from '../../../packlets/ai-assist';

const validSugarEntity = {
  baseId: 'granulated-sugar',
  name: 'Granulated Sugar',
  category: 'sugar',
  ganacheCharacteristics: {
    cacaoFat: 0,
    sugar: 100,
    milkFat: 0,
    water: 0,
    solids: 0,
    otherFats: 0
  },
  hydrationNumber: 0,
  sweetnessPotency: 1.0
};

const validChocolateEntity = {
  baseId: 'valrhona-guanaja-70',
  name: 'Valrhona Guanaja 70%',
  category: 'chocolate',
  chocolateType: 'dark',
  cacaoPercentage: 70,
  ganacheCharacteristics: {
    cacaoFat: 42,
    sugar: 28,
    milkFat: 0,
    water: 1,
    solids: 28,
    otherFats: 0
  }
};

describe('parseIngredientJson', () => {
  describe('with valid input', () => {
    test('parses a valid sugar entity without notes', () => {
      expect(parseIngredientJson(validSugarEntity)).toSucceedAndSatisfy((result) => {
        expect(result.entity.baseId).toBe('granulated-sugar');
        expect(result.entity.name).toBe('Granulated Sugar');
        expect(result.entity.category).toBe('sugar');
        expect(result.notes).toBeUndefined();
      });
    });

    test('parses a valid chocolate entity without notes', () => {
      expect(parseIngredientJson(validChocolateEntity)).toSucceedAndSatisfy((result) => {
        expect(result.entity.baseId).toBe('valrhona-guanaja-70');
        expect(result.entity.name).toBe('Valrhona Guanaja 70%');
        expect(result.entity.category).toBe('chocolate');
        expect(result.notes).toBeUndefined();
      });
    });

    test('strips notes field and preserves it in result', () => {
      const withNotes = {
        ...validSugarEntity,
        notes: 'Assumed standard granulated white sugar'
      };
      expect(parseIngredientJson(withNotes)).toSucceedAndSatisfy((result) => {
        expect(result.entity.baseId).toBe('granulated-sugar');
        expect(result.notes).toBe('Assumed standard granulated white sugar');
      });
    });

    test('returns undefined notes when notes field is not a string', () => {
      const withNumericNotes = {
        ...validSugarEntity,
        notes: 42
      };
      expect(parseIngredientJson(withNumericNotes)).toSucceedAndSatisfy((result) => {
        expect(result.notes).toBeUndefined();
      });
    });

    test('parses entity with optional fields', () => {
      const withOptional = {
        ...validSugarEntity,
        description: 'Standard white granulated sugar',
        manufacturer: 'C&H',
        vegan: true,
        tags: ['sweetener', 'baking'],
        density: 1.55
      };
      expect(parseIngredientJson(withOptional)).toSucceedAndSatisfy((result) => {
        expect(result.entity.description).toBe('Standard white granulated sugar');
        expect(result.entity.manufacturer).toBe('C&H');
        expect(result.entity.vegan).toBe(true);
        expect(result.entity.tags).toEqual(['sweetener', 'baking']);
        expect(result.entity.density).toBe(1.55);
      });
    });
  });

  describe('with invalid input', () => {
    test('fails for null', () => {
      expect(parseIngredientJson(null)).toFailWith(/expected a JSON object/);
    });

    test('fails for undefined', () => {
      expect(parseIngredientJson(undefined)).toFailWith(/expected a JSON object/);
    });

    test('fails for a string', () => {
      expect(parseIngredientJson('not an object')).toFailWith(/expected a JSON object/);
    });

    test('fails for a number', () => {
      expect(parseIngredientJson(42)).toFailWith(/expected a JSON object/);
    });

    test('fails for an array', () => {
      expect(parseIngredientJson([1, 2, 3])).toFailWith(/expected a JSON object/);
    });

    test('fails for an empty object', () => {
      expect(parseIngredientJson({})).toFail();
    });

    test('fails for object missing required fields', () => {
      expect(parseIngredientJson({ baseId: 'test' })).toFail();
    });

    test('fails for object with invalid category', () => {
      const invalid = {
        ...validSugarEntity,
        category: 'invalid-category'
      };
      expect(parseIngredientJson(invalid)).toFail();
    });

    test('fails for object with invalid ganacheCharacteristics', () => {
      const invalid = {
        ...validSugarEntity,
        ganacheCharacteristics: { cacaoFat: 'not a number' }
      };
      expect(parseIngredientJson(invalid)).toFail();
    });
  });
});
