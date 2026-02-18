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
import {
  isMoldInventoryEntryEntity,
  isIngredientInventoryEntryEntity,
  IMoldInventoryEntryEntity,
  IIngredientInventoryEntryEntity,
  AnyInventoryEntryEntity
} from '../../../../packlets/entities/inventory/model';
import { MoldId, IngredientId, Measurement, NoteCategory, Model } from '../../../../packlets/common';

type ICategorizedNote = Model.ICategorizedNote;

describe('Inventory Model', () => {
  describe('type guards', () => {
    const moldEntry: IMoldInventoryEntryEntity = {
      inventoryType: 'mold',
      moldId: 'builtin.silicone-round' as unknown as MoldId,
      count: 2
    };

    const ingredientEntry: IIngredientInventoryEntryEntity = {
      inventoryType: 'ingredient',
      ingredientId: 'builtin.cocoa-butter' as unknown as IngredientId,
      quantity: 500 as Measurement
    };

    describe('isMoldInventoryEntryEntity', () => {
      test('should return true for mold inventory entries', () => {
        expect(isMoldInventoryEntryEntity(moldEntry)).toBe(true);
      });

      test('should return false for ingredient inventory entries', () => {
        expect(isMoldInventoryEntryEntity(ingredientEntry)).toBe(false);
      });

      test('should narrow type correctly', () => {
        const entry: AnyInventoryEntryEntity = moldEntry;
        if (isMoldInventoryEntryEntity(entry)) {
          expect(entry.inventoryType).toBe('mold');
          expect(entry.moldId).toBe('builtin.silicone-round');
          expect(entry.count).toBe(2);
        }
      });

      test('should work with entry containing optional fields', () => {
        const entryWithOptionals: IMoldInventoryEntryEntity = {
          inventoryType: 'mold',
          moldId: 'user.custom-mold' as unknown as MoldId,
          count: 5,
          location: 'Workshop cabinet 3',
          notes: [
            { category: 'general' as unknown as NoteCategory, note: 'New purchase' }
          ] as ReadonlyArray<ICategorizedNote>
        };

        expect(isMoldInventoryEntryEntity(entryWithOptionals)).toBe(true);
      });
    });

    describe('isIngredientInventoryEntryEntity', () => {
      test('should return true for ingredient inventory entries', () => {
        expect(isIngredientInventoryEntryEntity(ingredientEntry)).toBe(true);
      });

      test('should return false for mold inventory entries', () => {
        expect(isIngredientInventoryEntryEntity(moldEntry)).toBe(false);
      });

      test('should narrow type correctly', () => {
        const entry: AnyInventoryEntryEntity = ingredientEntry;
        if (isIngredientInventoryEntryEntity(entry)) {
          expect(entry.inventoryType).toBe('ingredient');
          expect(entry.ingredientId).toBe('builtin.cocoa-butter');
          expect(entry.quantity).toBe(500);
        }
      });

      test('should work with entry containing unit field', () => {
        const entryWithUnit: IIngredientInventoryEntryEntity = {
          inventoryType: 'ingredient',
          ingredientId: 'user.vanilla-extract' as unknown as IngredientId,
          quantity: 250 as Measurement,
          unit: 'mL'
        };

        expect(isIngredientInventoryEntryEntity(entryWithUnit)).toBe(true);
        if (isIngredientInventoryEntryEntity(entryWithUnit)) {
          expect(entryWithUnit.unit).toBe('mL');
        }
      });

      test('should work with entry containing optional fields', () => {
        const entryWithOptionals: IIngredientInventoryEntryEntity = {
          inventoryType: 'ingredient',
          ingredientId: 'builtin.dark-chocolate' as unknown as IngredientId,
          quantity: 1000 as Measurement,
          unit: 'g',
          location: 'Pantry shelf 2',
          notes: [
            { category: 'general' as unknown as NoteCategory, note: 'Opened last week' }
          ] as ReadonlyArray<ICategorizedNote>
        };

        expect(isIngredientInventoryEntryEntity(entryWithOptionals)).toBe(true);
      });
    });

    describe('type guard mutual exclusivity', () => {
      test('mold entry should not be ingredient entry', () => {
        expect(isMoldInventoryEntryEntity(moldEntry)).toBe(true);
        expect(isIngredientInventoryEntryEntity(moldEntry)).toBe(false);
      });

      test('ingredient entry should not be mold entry', () => {
        expect(isIngredientInventoryEntryEntity(ingredientEntry)).toBe(true);
        expect(isMoldInventoryEntryEntity(ingredientEntry)).toBe(false);
      });
    });
  });
});
