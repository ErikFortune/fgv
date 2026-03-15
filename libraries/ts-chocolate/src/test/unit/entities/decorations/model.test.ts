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
import { createBlankDecorationEntity } from '../../../../packlets/entities/decorations/model';
import { BaseDecorationId } from '../../../../packlets/common';

describe('Decoration Model', () => {
  describe('createBlankDecorationEntity', () => {
    test('should create a minimal decoration entity with required fields', () => {
      const baseId = 'test-decoration' as unknown as BaseDecorationId;
      const name = 'Test Decoration';

      const entity = createBlankDecorationEntity(baseId, name);

      expect(entity.baseId).toBe(baseId);
      expect(entity.name).toBe(name);
      expect(entity.ingredients).toEqual([]);
    });

    test('should create decoration with empty ingredients array', () => {
      const baseId = 'gold-leaf' as unknown as BaseDecorationId;
      const name = 'Gold Leaf';

      const entity = createBlankDecorationEntity(baseId, name);

      expect(Array.isArray(entity.ingredients)).toBe(true);
      expect(entity.ingredients.length).toBe(0);
    });

    test('should not include optional fields', () => {
      const baseId = 'cocoa-butter-paint' as unknown as BaseDecorationId;
      const name = 'Cocoa Butter Paint';

      const entity = createBlankDecorationEntity(baseId, name);

      expect(entity.description).toBeUndefined();
      expect(entity.procedures).toBeUndefined();
      expect(entity.ratings).toBeUndefined();
      expect(entity.tags).toBeUndefined();
      expect(entity.notes).toBeUndefined();
    });

    test('should handle decoration names with special characters', () => {
      const baseId = 'special-decoration' as unknown as BaseDecorationId;
      const name = "Gold & Silver Leaf (Chef's Choice)";

      const entity = createBlankDecorationEntity(baseId, name);

      expect(entity.name).toBe(name);
    });
  });
});
