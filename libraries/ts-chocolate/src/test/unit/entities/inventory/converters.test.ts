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

import { IngredientId, LocationId, MoldId, Measurement, NoteCategory } from '../../../../packlets/common';
import { Inventory } from '../../../../packlets/entities';

describe('Inventory Converters', () => {
  // ============================================================================
  // MoldInventoryEntryBaseId Converter
  // ============================================================================

  describe('moldInventoryEntryBaseId', () => {
    test('accepts valid base ID', () => {
      expect(Inventory.Converters.moldInventoryEntryBaseId.convert('mold-001')).toSucceedWith(
        'mold-001' as Inventory.MoldInventoryEntryBaseId
      );
      expect(Inventory.Converters.moldInventoryEntryBaseId.convert('test_mold_123')).toSucceedWith(
        'test_mold_123' as Inventory.MoldInventoryEntryBaseId
      );
      expect(Inventory.Converters.moldInventoryEntryBaseId.convert('mold-with-dashes')).toSucceedWith(
        'mold-with-dashes' as Inventory.MoldInventoryEntryBaseId
      );
    });

    test('rejects empty string', () => {
      expect(Inventory.Converters.moldInventoryEntryBaseId.convert('')).toFailWith(
        /Invalid MoldInventoryEntryBaseId.*non-empty/i
      );
    });

    test('rejects string with dots', () => {
      expect(Inventory.Converters.moldInventoryEntryBaseId.convert('mold.001')).toFailWith(
        /Invalid MoldInventoryEntryBaseId.*no dots/i
      );
      expect(Inventory.Converters.moldInventoryEntryBaseId.convert('collection.mold-001')).toFailWith(
        /Invalid MoldInventoryEntryBaseId.*no dots/i
      );
    });

    test('rejects non-string values', () => {
      expect(Inventory.Converters.moldInventoryEntryBaseId.convert(123)).toFailWith(
        /Invalid MoldInventoryEntryBaseId/i
      );
      expect(Inventory.Converters.moldInventoryEntryBaseId.convert(null)).toFailWith(
        /Invalid MoldInventoryEntryBaseId/i
      );
      expect(Inventory.Converters.moldInventoryEntryBaseId.convert(undefined)).toFailWith(
        /Invalid MoldInventoryEntryBaseId/i
      );
    });
  });

  // ============================================================================
  // MoldInventoryEntryId Converter
  // ============================================================================

  describe('moldInventoryEntryId', () => {
    test('accepts valid composite ID', () => {
      expect(Inventory.Converters.moldInventoryEntryId.convert('collection.mold-001')).toSucceedWith(
        'collection.mold-001' as Inventory.MoldInventoryEntryId
      );
      expect(Inventory.Converters.moldInventoryEntryId.convert('test.mold_123')).toSucceedWith(
        'test.mold_123' as Inventory.MoldInventoryEntryId
      );
    });

    test('rejects empty string', () => {
      expect(Inventory.Converters.moldInventoryEntryId.convert('')).toFailWith(
        /Invalid MoldInventoryEntryId.*format collection\.entryId/i
      );
    });

    test('rejects string without dot separator', () => {
      expect(Inventory.Converters.moldInventoryEntryId.convert('mold-001')).toFailWith(
        /Invalid MoldInventoryEntryId.*format collection\.entryId/i
      );
    });

    test('rejects non-string values', () => {
      expect(Inventory.Converters.moldInventoryEntryId.convert(123)).toFailWith(
        /Invalid MoldInventoryEntryId/i
      );
      expect(Inventory.Converters.moldInventoryEntryId.convert(null)).toFailWith(
        /Invalid MoldInventoryEntryId/i
      );
    });
  });

  // ============================================================================
  // IngredientInventoryEntryBaseId Converter
  // ============================================================================

  describe('ingredientInventoryEntryBaseId', () => {
    test('accepts valid base ID', () => {
      expect(Inventory.Converters.ingredientInventoryEntryBaseId.convert('ingredient-001')).toSucceedWith(
        'ingredient-001' as Inventory.IngredientInventoryEntryBaseId
      );
      expect(
        Inventory.Converters.ingredientInventoryEntryBaseId.convert('test_ingredient_123')
      ).toSucceedWith('test_ingredient_123' as Inventory.IngredientInventoryEntryBaseId);
    });

    test('rejects empty string', () => {
      expect(Inventory.Converters.ingredientInventoryEntryBaseId.convert('')).toFailWith(
        /Invalid IngredientInventoryEntryBaseId.*non-empty/i
      );
    });

    test('rejects string with dots', () => {
      expect(Inventory.Converters.ingredientInventoryEntryBaseId.convert('ingredient.001')).toFailWith(
        /Invalid IngredientInventoryEntryBaseId.*no dots/i
      );
      expect(
        Inventory.Converters.ingredientInventoryEntryBaseId.convert('collection.ingredient-001')
      ).toFailWith(/Invalid IngredientInventoryEntryBaseId.*no dots/i);
    });

    test('rejects non-string values', () => {
      expect(Inventory.Converters.ingredientInventoryEntryBaseId.convert(123)).toFailWith(
        /Invalid IngredientInventoryEntryBaseId/i
      );
      expect(Inventory.Converters.ingredientInventoryEntryBaseId.convert(null)).toFailWith(
        /Invalid IngredientInventoryEntryBaseId/i
      );
      expect(Inventory.Converters.ingredientInventoryEntryBaseId.convert(undefined)).toFailWith(
        /Invalid IngredientInventoryEntryBaseId/i
      );
    });
  });

  // ============================================================================
  // IngredientInventoryEntryId Converter
  // ============================================================================

  describe('ingredientInventoryEntryId', () => {
    test('accepts valid composite ID', () => {
      expect(
        Inventory.Converters.ingredientInventoryEntryId.convert('collection.ingredient-001')
      ).toSucceedWith('collection.ingredient-001' as Inventory.IngredientInventoryEntryId);
      expect(Inventory.Converters.ingredientInventoryEntryId.convert('test.ingredient_123')).toSucceedWith(
        'test.ingredient_123' as Inventory.IngredientInventoryEntryId
      );
    });

    test('rejects empty string', () => {
      expect(Inventory.Converters.ingredientInventoryEntryId.convert('')).toFailWith(
        /Invalid IngredientInventoryEntryId.*format collection\.entryId/i
      );
    });

    test('rejects string without dot separator', () => {
      expect(Inventory.Converters.ingredientInventoryEntryId.convert('ingredient-001')).toFailWith(
        /Invalid IngredientInventoryEntryId.*format collection\.entryId/i
      );
    });

    test('rejects non-string values', () => {
      expect(Inventory.Converters.ingredientInventoryEntryId.convert(123)).toFailWith(
        /Invalid IngredientInventoryEntryId/i
      );
      expect(Inventory.Converters.ingredientInventoryEntryId.convert(null)).toFailWith(
        /Invalid IngredientInventoryEntryId/i
      );
    });
  });

  // ============================================================================
  // MoldInventoryEntryEntity Converter
  // ============================================================================

  describe('moldInventoryEntryEntity', () => {
    test('converts valid mold inventory entry', () => {
      const input = {
        inventoryType: 'mold',
        moldId: 'test.mold-123',
        count: 5
      };

      expect(Inventory.Converters.moldInventoryEntryEntity.convert(input)).toSucceedAndSatisfy((entity) => {
        expect(entity.inventoryType).toBe('mold');
        expect(entity.moldId).toBe('test.mold-123' as MoldId);
        expect(entity.count).toBe(5);
        expect(entity.locationId).toBeUndefined();
        expect(entity.notes).toBeUndefined();
      });
    });

    test('converts entry with optional fields', () => {
      const input = {
        inventoryType: 'mold',
        moldId: 'test.mold-456',
        count: 3,
        locationId: 'test.shelf-2',
        notes: [
          { category: 'general', note: 'Good condition' },
          { category: 'user', note: 'Purchased 2025' }
        ]
      };

      expect(Inventory.Converters.moldInventoryEntryEntity.convert(input)).toSucceedAndSatisfy((entity) => {
        expect(entity.inventoryType).toBe('mold');
        expect(entity.moldId).toBe('test.mold-456' as MoldId);
        expect(entity.count).toBe(3);
        expect(entity.locationId).toBe('test.shelf-2' as LocationId);
        expect(entity.notes).toHaveLength(2);
        expect(entity.notes?.[0]?.category).toBe('general' as NoteCategory);
      });
    });

    test('rejects entry with wrong inventoryType', () => {
      const input = {
        inventoryType: 'ingredient',
        moldId: 'test.mold-123',
        count: 5
      };

      expect(Inventory.Converters.moldInventoryEntryEntity.convert(input)).toFailWith(/inventoryType/i);
    });

    test('rejects entry missing required moldId', () => {
      const input = {
        inventoryType: 'mold',
        count: 5
      };

      expect(Inventory.Converters.moldInventoryEntryEntity.convert(input)).toFailWith(/moldId/i);
    });

    test('rejects entry missing required count', () => {
      const input = {
        inventoryType: 'mold',
        moldId: 'test.mold-123'
      };

      expect(Inventory.Converters.moldInventoryEntryEntity.convert(input)).toFailWith(/count/i);
    });

    test('rejects entry with invalid count type', () => {
      const input = {
        inventoryType: 'mold',
        moldId: 'test.mold-123',
        count: 'five'
      };

      expect(Inventory.Converters.moldInventoryEntryEntity.convert(input)).toFailWith(/count/i);
    });
  });

  // ============================================================================
  // IngredientInventoryEntryEntity Converter
  // ============================================================================

  describe('ingredientInventoryEntryEntity', () => {
    test('converts valid ingredient inventory entry', () => {
      const input = {
        inventoryType: 'ingredient',
        ingredientId: 'test.chocolate',
        quantity: 500
      };

      expect(Inventory.Converters.ingredientInventoryEntryEntity.convert(input)).toSucceedAndSatisfy(
        (entity) => {
          expect(entity.inventoryType).toBe('ingredient');
          expect(entity.ingredientId).toBe('test.chocolate' as IngredientId);
          expect(entity.quantity).toBe(500 as Measurement);
          expect(entity.unit).toBeUndefined();
          expect(entity.locationId).toBeUndefined();
          expect(entity.notes).toBeUndefined();
        }
      );
    });

    test('converts entry with optional fields', () => {
      const input = {
        inventoryType: 'ingredient',
        ingredientId: 'test.sugar',
        quantity: 1000,
        unit: 'g',
        locationId: 'test.pantry',
        notes: [
          { category: 'general', note: 'Fresh stock' },
          { category: 'user', note: 'Expires 2026' }
        ]
      };

      expect(Inventory.Converters.ingredientInventoryEntryEntity.convert(input)).toSucceedAndSatisfy(
        (entity) => {
          expect(entity.inventoryType).toBe('ingredient');
          expect(entity.ingredientId).toBe('test.sugar' as IngredientId);
          expect(entity.quantity).toBe(1000 as Measurement);
          expect(entity.unit).toBe('g');
          expect(entity.locationId).toBe('test.pantry' as LocationId);
          expect(entity.notes).toHaveLength(2);
          expect(entity.notes?.[0]?.category).toBe('general' as NoteCategory);
        }
      );
    });

    test('rejects entry with wrong inventoryType', () => {
      const input = {
        inventoryType: 'mold',
        ingredientId: 'test.chocolate',
        quantity: 500
      };

      expect(Inventory.Converters.ingredientInventoryEntryEntity.convert(input)).toFailWith(/inventoryType/i);
    });

    test('rejects entry missing required ingredientId', () => {
      const input = {
        inventoryType: 'ingredient',
        quantity: 500
      };

      expect(Inventory.Converters.ingredientInventoryEntryEntity.convert(input)).toFailWith(/ingredientId/i);
    });

    test('rejects entry missing required quantity', () => {
      const input = {
        inventoryType: 'ingredient',
        ingredientId: 'test.chocolate'
      };

      expect(Inventory.Converters.ingredientInventoryEntryEntity.convert(input)).toFailWith(/quantity/i);
    });

    test('rejects entry with invalid quantity type', () => {
      const input = {
        inventoryType: 'ingredient',
        ingredientId: 'test.chocolate',
        quantity: 'lots'
      };

      expect(Inventory.Converters.ingredientInventoryEntryEntity.convert(input)).toFailWith(/quantity/i);
    });
  });

  // ============================================================================
  // AnyInventoryEntryEntity Converter (Discriminated Union)
  // ============================================================================

  describe('anyInventoryEntryEntity', () => {
    test('converts mold inventory entry', () => {
      const input = {
        inventoryType: 'mold',
        moldId: 'test.mold-123',
        count: 5
      };

      expect(Inventory.Converters.anyInventoryEntryEntity.convert(input)).toSucceedAndSatisfy((entity) => {
        expect(entity.inventoryType).toBe('mold');
        if (entity.inventoryType === 'mold') {
          expect(entity.moldId).toBe('test.mold-123' as MoldId);
          expect(entity.count).toBe(5);
        }
      });
    });

    test('converts ingredient inventory entry', () => {
      const input = {
        inventoryType: 'ingredient',
        ingredientId: 'test.chocolate',
        quantity: 500
      };

      expect(Inventory.Converters.anyInventoryEntryEntity.convert(input)).toSucceedAndSatisfy((entity) => {
        expect(entity.inventoryType).toBe('ingredient');
        if (entity.inventoryType === 'ingredient') {
          expect(entity.ingredientId).toBe('test.chocolate' as IngredientId);
          expect(entity.quantity).toBe(500 as Measurement);
        }
      });
    });

    test('rejects entry without inventoryType field', () => {
      const input = {
        moldId: 'test.mold-123',
        count: 5
      };

      expect(Inventory.Converters.anyInventoryEntryEntity.convert(input)).toFailWith(
        /Invalid inventory entry.*inventoryType/i
      );
    });

    test('rejects entry with invalid inventoryType value', () => {
      const input = {
        inventoryType: 'unknown-type',
        someId: 'test.item',
        count: 1
      };

      expect(Inventory.Converters.anyInventoryEntryEntity.convert(input)).toFailWith(
        /Invalid inventory entry/i
      );
    });

    test('rejects non-object input', () => {
      expect(Inventory.Converters.anyInventoryEntryEntity.convert('not an object')).toFailWith(
        /Invalid inventory entry/i
      );
      expect(Inventory.Converters.anyInventoryEntryEntity.convert(123)).toFailWith(
        /Invalid inventory entry/i
      );
      expect(Inventory.Converters.anyInventoryEntryEntity.convert(null)).toFailWith(
        /Invalid inventory entry/i
      );
    });

    test('rejects mold entry with missing required fields', () => {
      const input = {
        inventoryType: 'mold',
        moldId: 'test.mold-123'
        // missing count
      };

      expect(Inventory.Converters.anyInventoryEntryEntity.convert(input)).toFailWith(/count/i);
    });

    test('rejects ingredient entry with missing required fields', () => {
      const input = {
        inventoryType: 'ingredient',
        ingredientId: 'test.chocolate'
        // missing quantity
      };

      expect(Inventory.Converters.anyInventoryEntryEntity.convert(input)).toFailWith(/quantity/i);
    });
  });

  // ============================================================================
  // Parsed ID Converters
  // ============================================================================

  describe('parsedMoldInventoryEntryId', () => {
    test('parses valid composite ID', () => {
      expect(
        Inventory.Converters.parsedMoldInventoryEntryId.convert('collection.mold-001')
      ).toSucceedAndSatisfy((parsed) => {
        expect(parsed.collectionId).toBe('collection');
        expect(parsed.itemId).toBe('mold-001');
      });
    });

    test('rejects ID without separator', () => {
      expect(Inventory.Converters.parsedMoldInventoryEntryId.convert('mold-001')).toFailWith(
        /separator.*not found/i
      );
    });

    test('rejects ID with invalid base ID part', () => {
      expect(Inventory.Converters.parsedMoldInventoryEntryId.convert('collection.invalid.id')).toFailWith(
        /multiple separators/i
      );
    });
  });

  describe('parsedIngredientInventoryEntryId', () => {
    test('parses valid composite ID', () => {
      expect(
        Inventory.Converters.parsedIngredientInventoryEntryId.convert('collection.ingredient-001')
      ).toSucceedAndSatisfy((parsed) => {
        expect(parsed.collectionId).toBe('collection');
        expect(parsed.itemId).toBe('ingredient-001');
      });
    });

    test('rejects ID without separator', () => {
      expect(Inventory.Converters.parsedIngredientInventoryEntryId.convert('ingredient-001')).toFailWith(
        /separator.*not found/i
      );
    });

    test('rejects ID with invalid base ID part', () => {
      expect(
        Inventory.Converters.parsedIngredientInventoryEntryId.convert('collection.invalid.id')
      ).toFailWith(/multiple separators/i);
    });
  });
});
