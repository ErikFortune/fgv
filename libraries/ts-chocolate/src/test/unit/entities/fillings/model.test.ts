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
import { createBlankFillingRecipeEntity } from '../../../../packlets/entities/fillings/model';
import { BaseFillingId, Measurement } from '../../../../packlets/common';

describe('Filling Recipe Model', () => {
  describe('createBlankFillingRecipeEntity', () => {
    test('should create a minimal filling recipe with required fields', () => {
      const baseId = 'test-ganache' as unknown as BaseFillingId;
      const name = 'Test Ganache';

      const entity = createBlankFillingRecipeEntity(baseId, name);

      expect(entity.baseId).toBe(baseId);
      expect(entity.name).toBe(name);
      expect(entity.category).toBe('ganache');
    });

    test("should create one blank variation with today's date", () => {
      const baseId = 'dark-chocolate-ganache' as unknown as BaseFillingId;
      const name = 'Dark Chocolate Ganache';

      const entity = createBlankFillingRecipeEntity(baseId, name);

      expect(entity.variations).toHaveLength(1);
      const variation = entity.variations[0];

      const today = new Date().toISOString().split('T')[0];
      expect(variation.createdDate).toBe(today);
      expect(variation.ingredients).toEqual([]);
      expect(variation.baseWeight).toBe(0 as Measurement);
    });

    test('should set golden variation to the initial variation', () => {
      const baseId = 'caramel' as unknown as BaseFillingId;
      const name = 'Caramel';

      const entity = createBlankFillingRecipeEntity(baseId, name);

      expect(entity.goldenVariationSpec).toBe(entity.variations[0].variationSpec);
    });

    test('should create variation spec with date-01 format when no label provided', () => {
      const baseId = 'simple-filling' as unknown as BaseFillingId;
      const name = 'Simple Filling';

      const entity = createBlankFillingRecipeEntity(baseId, name);

      const today = new Date().toISOString().split('T')[0];
      const expectedSpec = `${today}-01`;
      expect(entity.variations[0].variationSpec).toBe(expectedSpec);
      expect(entity.variations[0].name).toBeUndefined();
    });

    test('should include kebab-cased label in variation spec when provided', () => {
      const baseId = 'custom-filling' as unknown as BaseFillingId;
      const name = 'Custom Filling';
      const variationLabel = 'Extra Dark Version';

      const entity = createBlankFillingRecipeEntity(baseId, name, variationLabel);

      const today = new Date().toISOString().split('T')[0];
      const expectedSpec = `${today}-01-extra-dark-version`;
      expect(entity.variations[0].variationSpec).toBe(expectedSpec);
    });

    test('should store original label as variation name', () => {
      const baseId = 'labeled-filling' as unknown as BaseFillingId;
      const name = 'Labeled Filling';
      const variationLabel = 'Special Edition';

      const entity = createBlankFillingRecipeEntity(baseId, name, variationLabel);

      expect(entity.variations[0].name).toBe('Special Edition');
    });

    test('should trim variation label', () => {
      const baseId = 'trimmed-filling' as unknown as BaseFillingId;
      const name = 'Trimmed Filling';
      const variationLabel = '  Spaced Label  ';

      const entity = createBlankFillingRecipeEntity(baseId, name, variationLabel);

      expect(entity.variations[0].name).toBe('Spaced Label');
    });

    test('should not include optional fields on entity', () => {
      const baseId = 'minimal-filling' as unknown as BaseFillingId;
      const name = 'Minimal Filling';

      const entity = createBlankFillingRecipeEntity(baseId, name);

      expect(entity.description).toBeUndefined();
      expect(entity.tags).toBeUndefined();
      expect(entity.derivedFrom).toBeUndefined();
      expect(entity.urls).toBeUndefined();
    });

    test('should not include optional fields on variation', () => {
      const baseId = 'minimal-variation' as unknown as BaseFillingId;
      const name = 'Minimal Variation';

      const entity = createBlankFillingRecipeEntity(baseId, name);
      const variation = entity.variations[0];

      expect(variation.yield).toBeUndefined();
      expect(variation.notes).toBeUndefined();
      expect(variation.ratings).toBeUndefined();
      expect(variation.procedures).toBeUndefined();
    });

    test('should handle label with special characters in kebab conversion', () => {
      const baseId = 'special-chars' as unknown as BaseFillingId;
      const name = 'Special Characters';
      const variationLabel = "Chef's Premium 70%";

      const entity = createBlankFillingRecipeEntity(baseId, name, variationLabel);

      const today = new Date().toISOString().split('T')[0];
      // Helpers.toKebabCase should convert this properly
      expect(entity.variations[0].variationSpec).toContain(`${today}-01-`);
      expect(entity.variations[0].name).toBe("Chef's Premium 70%");
    });
  });
});
