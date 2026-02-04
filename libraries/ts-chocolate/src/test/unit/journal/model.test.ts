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
  Confections,
  Journal,
  JournalEntryType,
  AnyJournalEntry,
  IFillingEditJournalEntry,
  IFillingProductionJournalEntry,
  IConfectionEditJournalEntry,
  IConfectionProductionJournalEntry,
  IFillingRecipeVersionEntity,
  IProducedFillingEntity,
  IProducedMoldedBonBonEntity
} from '../../../packlets/entities';

describe('Journal Model', () => {
  describe('allJournalEntryTypes', () => {
    test('contains all expected entry types', () => {
      expect(Journal.allJournalEntryTypes).toContain('filling-edit');
      expect(Journal.allJournalEntryTypes).toContain('confection-edit');
      expect(Journal.allJournalEntryTypes).toContain('filling-production');
      expect(Journal.allJournalEntryTypes).toContain('confection-production');
    });

    test('has correct number of entry types', () => {
      expect(Journal.allJournalEntryTypes.length).toBe(4);
    });

    test('type assertion for JournalEntryType', () => {
      Journal.allJournalEntryTypes.forEach((entryType) => {
        const typed: JournalEntryType = entryType;
        expect(typeof typed).toBe('string');
      });
    });
  });

  describe('allResolvedSlotTypes', () => {
    test('contains all expected slot types', () => {
      expect(Confections.allResolvedSlotTypes).toContain('recipe');
      expect(Confections.allResolvedSlotTypes).toContain('ingredient');
    });

    test('has correct number of slot types', () => {
      expect(Confections.allResolvedSlotTypes.length).toBe(2);
    });

    test('type assertion for ResolvedSlotType', () => {
      Confections.allResolvedSlotTypes.forEach((slotType) => {
        const typed: Confections.ResolvedSlotType = slotType;
        expect(typeof typed).toBe('string');
      });
    });
  });

  describe('type guards for journal entries', () => {
    const fillingRecipe: IFillingRecipeVersionEntity = {
      versionSpec: 'v1' as IFillingRecipeVersionEntity['versionSpec'],
      createdDate: '2026-01-15',
      ingredients: [],
      baseWeight: 300 as IFillingRecipeVersionEntity['baseWeight']
    };

    const producedFilling: IProducedFillingEntity = {
      versionId: 'source.recipe@2026-01-01-01' as IProducedFillingEntity['versionId'],
      scaleFactor: 1.0,
      targetWeight: 300 as IProducedFillingEntity['targetWeight'],
      ingredients: []
    };

    const fillingEditEntry: IFillingEditJournalEntry = {
      type: 'filling-edit',
      baseId: '2026-01-15-100000-00000001' as IFillingEditJournalEntry['baseId'],
      versionId: 'source.recipe@2026-01-01-01' as IFillingEditJournalEntry['versionId'],
      timestamp: '2026-01-15T10:00:00Z',
      recipe: fillingRecipe
    };

    const fillingProductionEntry: IFillingProductionJournalEntry = {
      type: 'filling-production',
      baseId: '2026-01-15-100000-00000002' as IFillingProductionJournalEntry['baseId'],
      versionId: 'source.recipe@2026-01-01-01' as IFillingProductionJournalEntry['versionId'],
      timestamp: '2026-01-15T10:00:00Z',
      recipe: fillingRecipe,
      yield: 300 as IFillingProductionJournalEntry['yield'],
      produced: producedFilling
    };

    const confectionRecipe: Confections.IMoldedBonBonVersionEntity = {
      versionSpec: 'v1' as Confections.IMoldedBonBonVersionEntity['versionSpec'],
      createdDate: '2026-01-15',
      yield: { count: 24 },
      molds: {
        preferredId: 'mold-1' as Confections.IMoldedBonBonVersionEntity['molds']['preferredId'],
        options: []
      },
      shellChocolate: {
        ids: ['choc-1' as Confections.IMoldedBonBonVersionEntity['shellChocolate']['ids'][number]]
      }
    };

    const producedConfection: IProducedMoldedBonBonEntity = {
      confectionType: 'molded-bonbon',
      versionId: 'source.truffle@2026-01-01-01' as IProducedMoldedBonBonEntity['versionId'],
      yield: { count: 24 },
      moldId: 'mold-1' as IProducedMoldedBonBonEntity['moldId'],
      shellChocolateId: 'choc-1' as IProducedMoldedBonBonEntity['shellChocolateId']
    };

    const confectionEditEntry: IConfectionEditJournalEntry = {
      type: 'confection-edit',
      baseId: '2026-01-15-100000-00000003' as IConfectionEditJournalEntry['baseId'],
      versionId: 'source.truffle@2026-01-01-01' as IConfectionEditJournalEntry['versionId'],
      timestamp: '2026-01-15T10:00:00Z',
      recipe: confectionRecipe
    };

    const confectionProductionEntry: IConfectionProductionJournalEntry = {
      type: 'confection-production',
      baseId: '2026-01-15-100000-00000004' as IConfectionProductionJournalEntry['baseId'],
      versionId: 'source.truffle@2026-01-01-01' as IConfectionProductionJournalEntry['versionId'],
      timestamp: '2026-01-15T10:00:00Z',
      recipe: confectionRecipe,
      yield: { count: 24 },
      produced: producedConfection
    };

    describe('isFillingEditJournalEntry', () => {
      test('returns true for filling edit entries', () => {
        expect(Journal.isFillingEditJournalEntry(fillingEditEntry)).toBe(true);
      });

      test('returns false for other entry types', () => {
        expect(Journal.isFillingEditJournalEntry(fillingProductionEntry)).toBe(false);
        expect(Journal.isFillingEditJournalEntry(confectionEditEntry)).toBe(false);
        expect(Journal.isFillingEditJournalEntry(confectionProductionEntry)).toBe(false);
      });

      test('narrows type correctly', () => {
        const entry: AnyJournalEntry = fillingEditEntry;
        if (Journal.isFillingEditJournalEntry(entry)) {
          expect(entry.type).toBe('filling-edit');
          expect(entry.versionId).toBe('source.recipe@2026-01-01-01');
        }
      });
    });

    describe('isFillingProductionJournalEntry', () => {
      test('returns true for filling production entries', () => {
        expect(Journal.isFillingProductionJournalEntry(fillingProductionEntry)).toBe(true);
      });

      test('returns false for other entry types', () => {
        expect(Journal.isFillingProductionJournalEntry(fillingEditEntry)).toBe(false);
        expect(Journal.isFillingProductionJournalEntry(confectionEditEntry)).toBe(false);
        expect(Journal.isFillingProductionJournalEntry(confectionProductionEntry)).toBe(false);
      });

      test('narrows type correctly', () => {
        const entry: AnyJournalEntry = fillingProductionEntry;
        if (Journal.isFillingProductionJournalEntry(entry)) {
          expect(entry.type).toBe('filling-production');
          expect(entry.yield).toBe(300);
        }
      });
    });

    describe('isConfectionEditJournalEntry', () => {
      test('returns true for confection edit entries', () => {
        expect(Journal.isConfectionEditJournalEntry(confectionEditEntry)).toBe(true);
      });

      test('returns false for other entry types', () => {
        expect(Journal.isConfectionEditJournalEntry(fillingEditEntry)).toBe(false);
        expect(Journal.isConfectionEditJournalEntry(fillingProductionEntry)).toBe(false);
        expect(Journal.isConfectionEditJournalEntry(confectionProductionEntry)).toBe(false);
      });

      test('narrows type correctly', () => {
        const entry: AnyJournalEntry = confectionEditEntry;
        if (Journal.isConfectionEditJournalEntry(entry)) {
          expect(entry.type).toBe('confection-edit');
          expect(entry.versionId).toBe('source.truffle@2026-01-01-01');
        }
      });
    });

    describe('isConfectionProductionJournalEntry', () => {
      test('returns true for confection production entries', () => {
        expect(Journal.isConfectionProductionJournalEntry(confectionProductionEntry)).toBe(true);
      });

      test('returns false for other entry types', () => {
        expect(Journal.isConfectionProductionJournalEntry(fillingEditEntry)).toBe(false);
        expect(Journal.isConfectionProductionJournalEntry(fillingProductionEntry)).toBe(false);
        expect(Journal.isConfectionProductionJournalEntry(confectionEditEntry)).toBe(false);
      });

      test('narrows type correctly', () => {
        const entry: AnyJournalEntry = confectionProductionEntry;
        if (Journal.isConfectionProductionJournalEntry(entry)) {
          expect(entry.type).toBe('confection-production');
          expect(entry.yield.count).toBe(24);
        }
      });
    });
  });

  describe('type guards for resolved slots', () => {
    const fillingSlot: Confections.IResolvedFillingSlotEntity = {
      slotType: 'recipe',
      slotId: 'slot-1' as Confections.IResolvedFillingSlotEntity['slotId'],
      fillingId: 'filling-1' as Confections.IResolvedFillingSlotEntity['fillingId']
    };

    const ingredientSlot: Confections.IResolvedIngredientSlotEntity = {
      slotType: 'ingredient',
      slotId: 'slot-2' as Confections.IResolvedIngredientSlotEntity['slotId'],
      ingredientId: 'ingredient-1' as Confections.IResolvedIngredientSlotEntity['ingredientId']
    };

    describe('isResolvedFillingSlot', () => {
      test('returns true for recipe slots', () => {
        expect(Confections.isResolvedFillingSlotEntity(fillingSlot)).toBe(true);
      });

      test('returns false for ingredient slots', () => {
        expect(Confections.isResolvedFillingSlotEntity(ingredientSlot)).toBe(false);
      });

      test('narrows type correctly', () => {
        const slot: Confections.AnyResolvedFillingSlotEntity = fillingSlot;
        if (Confections.isResolvedFillingSlotEntity(slot)) {
          expect(slot.slotType).toBe('recipe');
          expect(slot.fillingId).toBe('filling-1');
        }
      });
    });

    describe('isResolvedIngredientSlot', () => {
      test('returns true for ingredient slots', () => {
        expect(Confections.isResolvedIngredientSlotEntity(ingredientSlot)).toBe(true);
      });

      test('returns false for recipe slots', () => {
        expect(Confections.isResolvedIngredientSlotEntity(fillingSlot)).toBe(false);
      });

      test('narrows type correctly', () => {
        const slot: Confections.AnyResolvedFillingSlotEntity = ingredientSlot;
        if (Confections.isResolvedIngredientSlotEntity(slot)) {
          expect(slot.slotType).toBe('ingredient');
          expect(slot.ingredientId).toBe('ingredient-1');
        }
      });
    });
  });
});
