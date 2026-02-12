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

import {
  Entities,
  IngredientCategory,
  IngredientId,
  MoldId,
  NoteCategory,
  UserLibrary as UserLib
} from '@fgv/ts-chocolate';

import {
  renderMoldInventorySummary,
  renderIngredientInventorySummary,
  renderMoldInventoryDetail,
  renderIngredientInventoryDetail
} from '../../../../../commands/workspace/renderers/inventoryRenderer';

describe('inventoryRenderer', () => {
  // ============================================================================
  // renderMoldInventorySummary
  // ============================================================================

  describe('renderMoldInventorySummary', () => {
    test('renders with location', () => {
      const entry = {
        id: 'entry-1' as unknown as Entities.Inventory.MoldInventoryEntryId,
        item: {
          id: 'mold-1' as unknown as MoldId,
          displayName: 'Square Mold 24'
        },
        quantity: 5,
        location: 'Shelf A',
        entity: {}
      } as unknown as UserLib.IMoldInventoryEntry;

      const result = renderMoldInventorySummary(entry);
      expect(result).toBe('Square Mold 24 - qty: 5 @ Shelf A');
    });

    test('renders without location', () => {
      const entry = {
        id: 'entry-2' as unknown as Entities.Inventory.MoldInventoryEntryId,
        item: {
          id: 'mold-2' as unknown as MoldId,
          displayName: 'Round Mold 12'
        },
        quantity: 3,
        entity: {}
      } as unknown as UserLib.IMoldInventoryEntry;

      const result = renderMoldInventorySummary(entry);
      expect(result).toBe('Round Mold 12 - qty: 3');
    });
  });

  // ============================================================================
  // renderIngredientInventorySummary
  // ============================================================================

  describe('renderIngredientInventorySummary', () => {
    test('renders with location and custom unit', () => {
      const entry = {
        id: 'entry-1' as unknown as Entities.Inventory.IngredientInventoryEntryId,
        item: {
          id: 'ing-1' as unknown as IngredientId,
          name: 'Dark Chocolate 70%'
        },
        quantity: 500,
        location: 'Pantry B',
        entity: {
          unit: 'g'
        }
      } as unknown as UserLib.IIngredientInventoryEntry;

      const result = renderIngredientInventorySummary(entry);
      expect(result).toBe('Dark Chocolate 70% - 500g @ Pantry B');
    });

    test('renders without location (defaults to g)', () => {
      const entry = {
        id: 'entry-2' as unknown as Entities.Inventory.IngredientInventoryEntryId,
        item: {
          id: 'ing-2' as unknown as IngredientId,
          name: 'Cocoa Butter'
        },
        quantity: 250,
        entity: {}
      } as unknown as UserLib.IIngredientInventoryEntry;

      const result = renderIngredientInventorySummary(entry);
      expect(result).toBe('Cocoa Butter - 250g');
    });

    test('renders with custom unit (kg)', () => {
      const entry = {
        id: 'entry-3' as unknown as Entities.Inventory.IngredientInventoryEntryId,
        item: {
          id: 'ing-3' as unknown as IngredientId,
          name: 'Sugar'
        },
        quantity: 2.5,
        entity: {
          unit: 'kg'
        }
      } as unknown as UserLib.IIngredientInventoryEntry;

      const result = renderIngredientInventorySummary(entry);
      expect(result).toBe('Sugar - 2.5kg');
    });
  });

  // ============================================================================
  // renderMoldInventoryDetail
  // ============================================================================

  describe('renderMoldInventoryDetail', () => {
    test('renders with location and notes', () => {
      const entry = {
        id: 'entry-1' as unknown as Entities.Inventory.MoldInventoryEntryId,
        item: {
          id: 'mold-1' as unknown as MoldId,
          displayName: 'Square Mold 24'
        },
        quantity: 5,
        location: 'Shelf A',
        notes: [
          { category: 'general' as NoteCategory, note: 'Recently purchased' },
          { category: 'handling' as NoteCategory, note: 'Handle with care' }
        ],
        entity: {}
      } as unknown as UserLib.IMoldInventoryEntry;

      const result = renderMoldInventoryDetail(entry);
      expect(result.text).toContain('Mold Inventory: Square Mold 24');
      expect(result.text).toContain('ID: entry-1');
      expect(result.text).toContain('Mold: Square Mold 24 (mold-1)');
      expect(result.text).toContain('Quantity: 5');
      expect(result.text).toContain('Location: Shelf A');
      expect(result.text).toContain('Notes: Recently purchased; Handle with care');

      expect(result.actions).toHaveLength(1);
      expect(result.actions[0].label).toBe('View mold: Square Mold 24');
      expect(result.actions[0].key).toBe('view-mold:mold-1');
      expect(result.actions[0].description).toBe('Navigate to mold mold-1');
    });

    test('renders without location and without notes (minimal)', () => {
      const entry = {
        id: 'entry-2' as unknown as Entities.Inventory.MoldInventoryEntryId,
        item: {
          id: 'mold-2' as unknown as MoldId,
          displayName: 'Round Mold 12'
        },
        quantity: 3,
        entity: {}
      } as unknown as UserLib.IMoldInventoryEntry;

      const result = renderMoldInventoryDetail(entry);
      expect(result.text).toContain('Mold Inventory: Round Mold 12');
      expect(result.text).toContain('ID: entry-2');
      expect(result.text).toContain('Mold: Round Mold 12 (mold-2)');
      expect(result.text).toContain('Quantity: 3');
      expect(result.text).not.toContain('Location:');
      expect(result.text).not.toContain('Notes:');

      expect(result.actions).toHaveLength(1);
      expect(result.actions[0].key).toBe('view-mold:mold-2');
    });
  });

  // ============================================================================
  // renderIngredientInventoryDetail
  // ============================================================================

  describe('renderIngredientInventoryDetail', () => {
    test('renders with location, notes, and custom unit', () => {
      const entry = {
        id: 'entry-1' as unknown as Entities.Inventory.IngredientInventoryEntryId,
        item: {
          id: 'ing-1' as unknown as IngredientId,
          name: 'Dark Chocolate 70%',
          category: 'chocolate' as IngredientCategory
        },
        quantity: 500,
        location: 'Pantry B',
        notes: [
          { category: 'general' as NoteCategory, note: 'Premium quality' },
          { category: 'storage' as NoteCategory, note: 'Keep cool and dry' }
        ],
        entity: {
          unit: 'g'
        }
      } as unknown as UserLib.IIngredientInventoryEntry;

      const result = renderIngredientInventoryDetail(entry);
      expect(result.text).toContain('Ingredient Inventory: Dark Chocolate 70%');
      expect(result.text).toContain('ID: entry-1');
      expect(result.text).toContain('Ingredient: Dark Chocolate 70% (ing-1)');
      expect(result.text).toContain('Category: chocolate');
      expect(result.text).toContain('Quantity: 500g');
      expect(result.text).toContain('Location: Pantry B');
      expect(result.text).toContain('Notes: Premium quality; Keep cool and dry');

      expect(result.actions).toHaveLength(1);
      expect(result.actions[0].label).toBe('View ingredient: Dark Chocolate 70%');
      expect(result.actions[0].key).toBe('view-ingredient:ing-1');
      expect(result.actions[0].description).toBe('Navigate to ingredient ing-1');
    });

    test('renders without location, without notes (default unit g)', () => {
      const entry = {
        id: 'entry-2' as unknown as Entities.Inventory.IngredientInventoryEntryId,
        item: {
          id: 'ing-2' as unknown as IngredientId,
          name: 'Cocoa Butter',
          category: 'fat' as IngredientCategory
        },
        quantity: 250,
        entity: {}
      } as unknown as UserLib.IIngredientInventoryEntry;

      const result = renderIngredientInventoryDetail(entry);
      expect(result.text).toContain('Ingredient Inventory: Cocoa Butter');
      expect(result.text).toContain('ID: entry-2');
      expect(result.text).toContain('Ingredient: Cocoa Butter (ing-2)');
      expect(result.text).toContain('Category: fat');
      expect(result.text).toContain('Quantity: 250g');
      expect(result.text).not.toContain('Location:');
      expect(result.text).not.toContain('Notes:');

      expect(result.actions).toHaveLength(1);
      expect(result.actions[0].key).toBe('view-ingredient:ing-2');
    });
  });
});
