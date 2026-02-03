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
  allJournalEntryTypes,
  JournalEntryType,
  isFillingEditJournalEntry,
  isFillingProductionJournalEntry,
  isConfectionEditJournalEntry,
  isConfectionProductionJournalEntry,
  AnyJournalEntry,
  IFillingEditJournalEntry,
  IFillingProductionJournalEntry,
  IConfectionEditJournalEntry,
  IConfectionProductionJournalEntry,
  IFillingRecipeVersion,
  IProducedFilling,
  IProducedMoldedBonBon
} from '../../../packlets/entities';

describe('Journal Model', () => {
  describe('allJournalEntryTypes', () => {
    test('contains all expected entry types', () => {
      expect(allJournalEntryTypes).toContain('filling-edit');
      expect(allJournalEntryTypes).toContain('confection-edit');
      expect(allJournalEntryTypes).toContain('filling-production');
      expect(allJournalEntryTypes).toContain('confection-production');
    });

    test('has correct number of entry types', () => {
      expect(allJournalEntryTypes.length).toBe(4);
    });

    test('type assertion for JournalEntryType', () => {
      allJournalEntryTypes.forEach((entryType) => {
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
    const fillingRecipe: IFillingRecipeVersion = {
      versionSpec: 'v1' as IFillingRecipeVersion['versionSpec'],
      createdDate: '2026-01-15',
      ingredients: [],
      baseWeight: 300 as IFillingRecipeVersion['baseWeight']
    };

    const producedFilling: IProducedFilling = {
      versionId: 'source.recipe@2026-01-01-01' as IProducedFilling['versionId'],
      scaleFactor: 1.0,
      targetWeight: 300 as IProducedFilling['targetWeight'],
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

    const confectionRecipe: Confections.IMoldedBonBonVersion = {
      versionSpec: 'v1' as Confections.IMoldedBonBonVersion['versionSpec'],
      createdDate: '2026-01-15',
      yield: { count: 24 },
      molds: {
        preferredId: 'mold-1' as Confections.IMoldedBonBonVersion['molds']['preferredId'],
        options: []
      },
      shellChocolate: {
        ids: ['choc-1' as Confections.IMoldedBonBonVersion['shellChocolate']['ids'][number]]
      }
    };

    const producedConfection: IProducedMoldedBonBon = {
      confectionType: 'molded-bonbon',
      versionId: 'source.truffle@2026-01-01-01' as IProducedMoldedBonBon['versionId'],
      yield: { count: 24 },
      moldId: 'mold-1' as IProducedMoldedBonBon['moldId'],
      shellChocolateId: 'choc-1' as IProducedMoldedBonBon['shellChocolateId']
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
        expect(isFillingEditJournalEntry(fillingEditEntry)).toBe(true);
      });

      test('returns false for other entry types', () => {
        expect(isFillingEditJournalEntry(fillingProductionEntry)).toBe(false);
        expect(isFillingEditJournalEntry(confectionEditEntry)).toBe(false);
        expect(isFillingEditJournalEntry(confectionProductionEntry)).toBe(false);
      });

      test('narrows type correctly', () => {
        const entry: AnyJournalEntry = fillingEditEntry;
        if (isFillingEditJournalEntry(entry)) {
          expect(entry.type).toBe('filling-edit');
          expect(entry.versionId).toBe('source.recipe@2026-01-01-01');
        }
      });
    });

    describe('isFillingProductionJournalEntry', () => {
      test('returns true for filling production entries', () => {
        expect(isFillingProductionJournalEntry(fillingProductionEntry)).toBe(true);
      });

      test('returns false for other entry types', () => {
        expect(isFillingProductionJournalEntry(fillingEditEntry)).toBe(false);
        expect(isFillingProductionJournalEntry(confectionEditEntry)).toBe(false);
        expect(isFillingProductionJournalEntry(confectionProductionEntry)).toBe(false);
      });

      test('narrows type correctly', () => {
        const entry: AnyJournalEntry = fillingProductionEntry;
        if (isFillingProductionJournalEntry(entry)) {
          expect(entry.type).toBe('filling-production');
          expect(entry.yield).toBe(300);
        }
      });
    });

    describe('isConfectionEditJournalEntry', () => {
      test('returns true for confection edit entries', () => {
        expect(isConfectionEditJournalEntry(confectionEditEntry)).toBe(true);
      });

      test('returns false for other entry types', () => {
        expect(isConfectionEditJournalEntry(fillingEditEntry)).toBe(false);
        expect(isConfectionEditJournalEntry(fillingProductionEntry)).toBe(false);
        expect(isConfectionEditJournalEntry(confectionProductionEntry)).toBe(false);
      });

      test('narrows type correctly', () => {
        const entry: AnyJournalEntry = confectionEditEntry;
        if (isConfectionEditJournalEntry(entry)) {
          expect(entry.type).toBe('confection-edit');
          expect(entry.versionId).toBe('source.truffle@2026-01-01-01');
        }
      });
    });

    describe('isConfectionProductionJournalEntry', () => {
      test('returns true for confection production entries', () => {
        expect(isConfectionProductionJournalEntry(confectionProductionEntry)).toBe(true);
      });

      test('returns false for other entry types', () => {
        expect(isConfectionProductionJournalEntry(fillingEditEntry)).toBe(false);
        expect(isConfectionProductionJournalEntry(fillingProductionEntry)).toBe(false);
        expect(isConfectionProductionJournalEntry(confectionEditEntry)).toBe(false);
      });

      test('narrows type correctly', () => {
        const entry: AnyJournalEntry = confectionProductionEntry;
        if (isConfectionProductionJournalEntry(entry)) {
          expect(entry.type).toBe('confection-production');
          expect(entry.yield.count).toBe(24);
        }
      });
    });
  });

  describe('type guards for resolved slots', () => {
    const fillingSlot: Confections.IResolvedFillingSlot = {
      slotType: 'recipe',
      slotId: 'slot-1' as Confections.IResolvedFillingSlot['slotId'],
      fillingId: 'filling-1' as Confections.IResolvedFillingSlot['fillingId']
    };

    const ingredientSlot: Confections.IResolvedIngredientSlot = {
      slotType: 'ingredient',
      slotId: 'slot-2' as Confections.IResolvedIngredientSlot['slotId'],
      ingredientId: 'ingredient-1' as Confections.IResolvedIngredientSlot['ingredientId']
    };

    describe('isResolvedFillingSlot', () => {
      test('returns true for recipe slots', () => {
        expect(Confections.isResolvedFillingSlot(fillingSlot)).toBe(true);
      });

      test('returns false for ingredient slots', () => {
        expect(Confections.isResolvedFillingSlot(ingredientSlot)).toBe(false);
      });

      test('narrows type correctly', () => {
        const slot: Confections.AnyResolvedFillingSlot = fillingSlot;
        if (Confections.isResolvedFillingSlot(slot)) {
          expect(slot.slotType).toBe('recipe');
          expect(slot.fillingId).toBe('filling-1');
        }
      });
    });

    describe('isResolvedIngredientSlot', () => {
      test('returns true for ingredient slots', () => {
        expect(Confections.isResolvedIngredientSlot(ingredientSlot)).toBe(true);
      });

      test('returns false for recipe slots', () => {
        expect(Confections.isResolvedIngredientSlot(fillingSlot)).toBe(false);
      });

      test('narrows type correctly', () => {
        const slot: Confections.AnyResolvedFillingSlot = ingredientSlot;
        if (Confections.isResolvedIngredientSlot(slot)) {
          expect(slot.slotType).toBe('ingredient');
          expect(slot.ingredientId).toBe('ingredient-1');
        }
      });
    });
  });
});
