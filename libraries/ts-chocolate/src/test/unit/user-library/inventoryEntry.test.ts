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
  BaseMoldId,
  CollectionId,
  IngredientId,
  Measurement,
  Millimeters,
  MoldId,
  Model as CommonModel,
  NoteCategory,
  Percentage
} from '../../../packlets/common';
import {
  IGanacheCharacteristics,
  IIngredientEntity,
  IIngredientInventoryEntryEntity,
  IMoldEntity,
  IMoldInventoryEntryEntity,
  IngredientsLibrary,
  Inventory as InventoryEntities,
  MoldsLibrary
} from '../../../packlets/entities';
import { ChocolateEntityLibrary, ChocolateLibrary } from '../../../packlets/library-runtime';
import { ISessionContext } from '../../../packlets/user-library';
// eslint-disable-next-line @rushstack/packlets/mechanics
import { IngredientInventoryEntry, MoldInventoryEntry } from '../../../packlets/user-library/inventoryEntry';

describe('InventoryEntry', () => {
  // ============================================================================
  // Test Data
  // ============================================================================

  const testGanacheChars: IGanacheCharacteristics = {
    cacaoFat: 36 as Percentage,
    sugar: 34 as Percentage,
    milkFat: 0 as Percentage,
    water: 1 as Percentage,
    solids: 29 as Percentage,
    otherFats: 0 as Percentage
  };

  const testIngredient: IIngredientEntity = {
    baseId: 'dark-chocolate' as BaseIngredientId,
    name: 'Dark Chocolate 70%',
    category: 'other',
    ganacheCharacteristics: testGanacheChars
  };

  const testMold: IMoldEntity = {
    baseId: 'hemisphere-25' as BaseMoldId,
    manufacturer: 'Test Mfg',
    productNumber: 'TM-1000',
    cavities: {
      kind: 'count',
      count: 15,
      info: {
        dimensions: {
          width: 25 as Millimeters,
          length: 25 as Millimeters,
          depth: 12 as Millimeters
        }
      }
    },
    format: 'series-1000'
  };

  let sessionContext: ISessionContext;

  beforeEach(() => {
    const ingredients = IngredientsLibrary.create({
      builtin: false,
      collections: [
        {
          id: 'test' as CollectionId,
          isMutable: false,
          items: {
            /* eslint-disable @typescript-eslint/naming-convention */
            'dark-chocolate': testIngredient
            /* eslint-enable @typescript-eslint/naming-convention */
          }
        }
      ]
    }).orThrow();

    const molds = MoldsLibrary.create({
      builtin: false,
      collections: [
        {
          id: 'test' as CollectionId,
          isMutable: false,
          items: {
            /* eslint-disable @typescript-eslint/naming-convention */
            'hemisphere-25': testMold
            /* eslint-enable @typescript-eslint/naming-convention */
          }
        }
      ]
    }).orThrow();

    const library = ChocolateEntityLibrary.create({
      libraries: { ingredients, molds }
    }).orThrow();

    const ctx = ChocolateLibrary.fromChocolateEntityLibrary(library).orThrow();
    sessionContext = ctx as unknown as ISessionContext;
  });

  // ============================================================================
  // MoldInventoryEntry Tests
  // ============================================================================

  describe('MoldInventoryEntry', () => {
    describe('create', () => {
      test('creates entry with valid mold reference', () => {
        const entity: IMoldInventoryEntryEntity = {
          inventoryType: 'mold',
          moldId: 'test.hemisphere-25' as MoldId,
          count: 3
        };

        expect(
          MoldInventoryEntry.create(
            sessionContext,
            'test.mold-001' as InventoryEntities.MoldInventoryEntryId,
            entity
          )
        ).toSucceedAndSatisfy((entry) => {
          expect(entry.id).toBe('test.mold-001');
          expect(entry.mold).toBeDefined();
          expect(entry.mold.baseId).toBe('hemisphere-25');
          expect(entry.item).toBe(entry.mold);
          expect(entry.entity).toBe(entity);
        });
      });

      test('fails for unknown mold ID', () => {
        const entity: IMoldInventoryEntryEntity = {
          inventoryType: 'mold',
          moldId: 'test.unknown-mold' as MoldId,
          count: 1
        };

        expect(
          MoldInventoryEntry.create(
            sessionContext,
            'test.mold-002' as InventoryEntities.MoldInventoryEntryId,
            entity
          )
        ).toFailWith(/inventory test\.mold-002.*mold.*not found/i);
      });
    });

    describe('property accessors', () => {
      test('provides access to basic properties', () => {
        const entity: IMoldInventoryEntryEntity = {
          inventoryType: 'mold',
          moldId: 'test.hemisphere-25' as MoldId,
          count: 5,
          location: 'workshop shelf 2'
        };

        const entry = MoldInventoryEntry.create(
          sessionContext,
          'test.mold-003' as InventoryEntities.MoldInventoryEntryId,
          entity
        ).orThrow();

        expect(entry.id).toBe('test.mold-003');
        expect(entry.quantity).toBe(5);
        expect(entry.location).toBe('workshop shelf 2');
        expect(entry.notes).toBeUndefined();
      });

      test('provides access to notes when present', () => {
        const notes: ReadonlyArray<CommonModel.ICategorizedNote> = [
          { category: 'general' as NoteCategory, note: 'In good condition' },
          { category: 'user' as NoteCategory, note: 'Purchased 2025-12-01' }
        ];

        const entity: IMoldInventoryEntryEntity = {
          inventoryType: 'mold',
          moldId: 'test.hemisphere-25' as MoldId,
          count: 2,
          notes
        };

        const entry = MoldInventoryEntry.create(
          sessionContext,
          'test.mold-004' as InventoryEntities.MoldInventoryEntryId,
          entity
        ).orThrow();

        expect(entry.notes).toEqual(notes);
      });

      test('handles undefined location', () => {
        const entity: IMoldInventoryEntryEntity = {
          inventoryType: 'mold',
          moldId: 'test.hemisphere-25' as MoldId,
          count: 1
        };

        const entry = MoldInventoryEntry.create(
          sessionContext,
          'test.mold-005' as InventoryEntities.MoldInventoryEntryId,
          entity
        ).orThrow();

        expect(entry.location).toBeUndefined();
      });
    });
  });

  // ============================================================================
  // IngredientInventoryEntry Tests
  // ============================================================================

  describe('IngredientInventoryEntry', () => {
    describe('create', () => {
      test('creates entry with valid ingredient reference', () => {
        const entity: IIngredientInventoryEntryEntity = {
          inventoryType: 'ingredient',
          ingredientId: 'test.dark-chocolate' as IngredientId,
          quantity: 500 as Measurement
        };

        expect(
          IngredientInventoryEntry.create(
            sessionContext,
            'test.ingredient-001' as InventoryEntities.IngredientInventoryEntryId,
            entity
          )
        ).toSucceedAndSatisfy((entry) => {
          expect(entry.id).toBe('test.ingredient-001');
          expect(entry.ingredient).toBeDefined();
          expect(entry.ingredient.baseId).toBe('dark-chocolate');
          expect(entry.item).toBe(entry.ingredient);
          expect(entry.entity).toBe(entity);
        });
      });

      test('fails for unknown ingredient ID', () => {
        const entity: IIngredientInventoryEntryEntity = {
          inventoryType: 'ingredient',
          ingredientId: 'test.unknown-ingredient' as IngredientId,
          quantity: 100 as Measurement
        };

        expect(
          IngredientInventoryEntry.create(
            sessionContext,
            'test.ingredient-002' as InventoryEntities.IngredientInventoryEntryId,
            entity
          )
        ).toFailWith(/inventory test\.ingredient-002.*ingredient.*not found/i);
      });
    });

    describe('property accessors', () => {
      test('provides access to basic properties', () => {
        const entity: IIngredientInventoryEntryEntity = {
          inventoryType: 'ingredient',
          ingredientId: 'test.dark-chocolate' as IngredientId,
          quantity: 1000 as Measurement,
          location: 'pantry shelf 3'
        };

        const entry = IngredientInventoryEntry.create(
          sessionContext,
          'test.ingredient-003' as InventoryEntities.IngredientInventoryEntryId,
          entity
        ).orThrow();

        expect(entry.id).toBe('test.ingredient-003');
        expect(entry.quantity).toBe(1000);
        expect(entry.location).toBe('pantry shelf 3');
        expect(entry.notes).toBeUndefined();
      });

      test('provides access to notes when present', () => {
        const notes: ReadonlyArray<CommonModel.ICategorizedNote> = [
          { category: 'general' as NoteCategory, note: 'Store in cool place' },
          { category: 'user' as NoteCategory, note: 'Expires 2026-06-30' }
        ];

        const entity: IIngredientInventoryEntryEntity = {
          inventoryType: 'ingredient',
          ingredientId: 'test.dark-chocolate' as IngredientId,
          quantity: 250 as Measurement,
          notes
        };

        const entry = IngredientInventoryEntry.create(
          sessionContext,
          'test.ingredient-004' as InventoryEntities.IngredientInventoryEntryId,
          entity
        ).orThrow();

        expect(entry.notes).toEqual(notes);
      });

      test('handles undefined location', () => {
        const entity: IIngredientInventoryEntryEntity = {
          inventoryType: 'ingredient',
          ingredientId: 'test.dark-chocolate' as IngredientId,
          quantity: 500 as Measurement
        };

        const entry = IngredientInventoryEntry.create(
          sessionContext,
          'test.ingredient-005' as InventoryEntities.IngredientInventoryEntryId,
          entity
        ).orThrow();

        expect(entry.location).toBeUndefined();
      });
    });
  });
});
