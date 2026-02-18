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
import { createBlankIngredientEntity } from '../../../../packlets/entities/ingredients/model';
import { BaseIngredientId, Percentage } from '../../../../packlets/common';

describe('Ingredient Model', () => {
  describe('createBlankIngredientEntity', () => {
    test('should create a minimal ingredient entity with required fields', () => {
      const baseId = 'test-ingredient' as unknown as BaseIngredientId;
      const name = 'Test Ingredient';

      const entity = createBlankIngredientEntity(baseId, name);

      expect(entity.baseId).toBe(baseId);
      expect(entity.name).toBe(name);
      expect(entity.category).toBe('other');
    });

    test('should create ingredient with zero ganache characteristics', () => {
      const baseId = 'vanilla-extract' as unknown as BaseIngredientId;
      const name = 'Vanilla Extract';

      const entity = createBlankIngredientEntity(baseId, name);

      expect(entity.ganacheCharacteristics).toEqual({
        cacaoFat: 0 as Percentage,
        sugar: 0 as Percentage,
        milkFat: 0 as Percentage,
        water: 0 as Percentage,
        solids: 0 as Percentage,
        otherFats: 0 as Percentage
      });
    });

    test('should have defined ganacheCharacteristics object', () => {
      const baseId = 'salt' as unknown as BaseIngredientId;
      const name = 'Sea Salt';

      const entity = createBlankIngredientEntity(baseId, name);

      expect(entity.ganacheCharacteristics).toBeDefined();
      expect(typeof entity.ganacheCharacteristics).toBe('object');
    });

    test('should not include optional fields', () => {
      const baseId = 'minimal-ingredient' as unknown as BaseIngredientId;
      const name = 'Minimal Ingredient';

      const entity = createBlankIngredientEntity(baseId, name);

      expect(entity.description).toBeUndefined();
      expect(entity.manufacturer).toBeUndefined();
      expect(entity.allergens).toBeUndefined();
      expect(entity.traceAllergens).toBeUndefined();
      expect(entity.certifications).toBeUndefined();
      expect(entity.vegan).toBeUndefined();
      expect(entity.tags).toBeUndefined();
      expect(entity.density).toBeUndefined();
      expect(entity.phase).toBeUndefined();
      expect(entity.measurementUnits).toBeUndefined();
      expect(entity.urls).toBeUndefined();
      expect(entity.notes).toBeUndefined();
    });

    test('should handle ingredient names with special characters', () => {
      const baseId = 'special-name' as unknown as BaseIngredientId;
      const name = "Maître d'Or 70% Chocolate";

      const entity = createBlankIngredientEntity(baseId, name);

      expect(entity.name).toBe(name);
    });

    test('should create valid entity for different ingredient types', () => {
      const testCases = [
        { baseId: 'cocoa-butter', name: 'Cocoa Butter' },
        { baseId: 'heavy-cream', name: 'Heavy Cream' },
        { baseId: 'sugar', name: 'Granulated Sugar' },
        { baseId: 'rum', name: 'Dark Rum' }
      ];

      testCases.forEach(({ baseId, name }) => {
        const entity = createBlankIngredientEntity(baseId as unknown as BaseIngredientId, name);

        expect(entity.baseId).toBe(baseId);
        expect(entity.name).toBe(name);
        expect(entity.category).toBe('other');
      });
    });
  });
});
