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
  AnyJournalEntryEntity,
  IFillingEditJournalEntryEntity,
  IFillingProductionJournalEntryEntity,
  IConfectionEditJournalEntryEntity,
  IConfectionProductionJournalEntryEntity,
  IGroupNotesJournalEntryEntity,
  IFillingRecipeVariationEntity,
  IProducedFillingEntity,
  IProducedMoldedBonBonEntity
} from '../../../packlets/entities';
import { GroupName, NoteCategory } from '../../../packlets/common';

describe('Journal Model', () => {
  describe('allJournalEntryTypes', () => {
    test('contains all expected entry types', () => {
      expect(Journal.allJournalEntryTypes).toContain('filling-edit');
      expect(Journal.allJournalEntryTypes).toContain('confection-edit');
      expect(Journal.allJournalEntryTypes).toContain('filling-production');
      expect(Journal.allJournalEntryTypes).toContain('confection-production');
      expect(Journal.allJournalEntryTypes).toContain('group-notes');
    });

    test('has correct number of entry types', () => {
      expect(Journal.allJournalEntryTypes.length).toBe(5);
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
    const fillingRecipe: IFillingRecipeVariationEntity = {
      variationSpec: 'v1' as IFillingRecipeVariationEntity['variationSpec'],
      createdDate: '2026-01-15',
      ingredients: [],
      baseWeight: 300 as IFillingRecipeVariationEntity['baseWeight']
    };

    const producedFilling: IProducedFillingEntity = {
      variationId: 'source.recipe@2026-01-01-01' as IProducedFillingEntity['variationId'],
      scaleFactor: 1.0,
      targetWeight: 300 as IProducedFillingEntity['targetWeight'],
      ingredients: []
    };

    const fillingEditEntry: IFillingEditJournalEntryEntity = {
      type: 'filling-edit',
      baseId: '2026-01-15-100000-00000001' as IFillingEditJournalEntryEntity['baseId'],
      variationId: 'source.recipe@2026-01-01-01' as IFillingEditJournalEntryEntity['variationId'],
      timestamp: '2026-01-15T10:00:00Z',
      recipe: fillingRecipe
    };

    const fillingProductionEntry: IFillingProductionJournalEntryEntity = {
      type: 'filling-production',
      baseId: '2026-01-15-100000-00000002' as IFillingProductionJournalEntryEntity['baseId'],
      variationId: 'source.recipe@2026-01-01-01' as IFillingProductionJournalEntryEntity['variationId'],
      timestamp: '2026-01-15T10:00:00Z',
      recipe: fillingRecipe,
      yield: 300 as IFillingProductionJournalEntryEntity['yield'],
      produced: producedFilling
    };

    const confectionRecipe: Confections.IMoldedBonBonRecipeVariationEntity = {
      variationSpec: 'v1' as Confections.IMoldedBonBonRecipeVariationEntity['variationSpec'],
      createdDate: '2026-01-15',
      yield: { count: 24 },
      molds: {
        preferredId: 'mold-1' as Confections.IMoldedBonBonRecipeVariationEntity['molds']['preferredId'],
        options: []
      },
      shellChocolate: {
        ids: ['choc-1' as Confections.IMoldedBonBonRecipeVariationEntity['shellChocolate']['ids'][number]]
      }
    };

    const producedConfection: IProducedMoldedBonBonEntity = {
      confectionType: 'molded-bonbon',
      variationId: 'source.truffle@2026-01-01-01' as IProducedMoldedBonBonEntity['variationId'],
      yield: { count: 24 },
      moldId: 'mold-1' as IProducedMoldedBonBonEntity['moldId'],
      shellChocolateId: 'choc-1' as IProducedMoldedBonBonEntity['shellChocolateId']
    };

    const confectionEditEntry: IConfectionEditJournalEntryEntity = {
      type: 'confection-edit',
      baseId: '2026-01-15-100000-00000003' as IConfectionEditJournalEntryEntity['baseId'],
      variationId: 'source.truffle@2026-01-01-01' as IConfectionEditJournalEntryEntity['variationId'],
      timestamp: '2026-01-15T10:00:00Z',
      recipe: confectionRecipe
    };

    const confectionProductionEntry: IConfectionProductionJournalEntryEntity = {
      type: 'confection-production',
      baseId: '2026-01-15-100000-00000004' as IConfectionProductionJournalEntryEntity['baseId'],
      variationId: 'source.truffle@2026-01-01-01' as IConfectionProductionJournalEntryEntity['variationId'],
      timestamp: '2026-01-15T10:00:00Z',
      recipe: confectionRecipe,
      yield: { count: 24 },
      produced: producedConfection
    };

    describe('isFillingEditJournalEntry', () => {
      test('returns true for filling edit entries', () => {
        expect(Journal.isFillingEditJournalEntryEntity(fillingEditEntry)).toBe(true);
      });

      test('returns false for other entry types', () => {
        expect(Journal.isFillingEditJournalEntryEntity(fillingProductionEntry)).toBe(false);
        expect(Journal.isFillingEditJournalEntryEntity(confectionEditEntry)).toBe(false);
        expect(Journal.isFillingEditJournalEntryEntity(confectionProductionEntry)).toBe(false);
      });

      test('narrows type correctly', () => {
        const entry: AnyJournalEntryEntity = fillingEditEntry;
        if (Journal.isFillingEditJournalEntryEntity(entry)) {
          expect(entry.type).toBe('filling-edit');
          expect(entry.variationId).toBe('source.recipe@2026-01-01-01');
        }
      });
    });

    describe('isFillingProductionJournalEntry', () => {
      test('returns true for filling production entries', () => {
        expect(Journal.isFillingProductionJournalEntryEntity(fillingProductionEntry)).toBe(true);
      });

      test('returns false for other entry types', () => {
        expect(Journal.isFillingProductionJournalEntryEntity(fillingEditEntry)).toBe(false);
        expect(Journal.isFillingProductionJournalEntryEntity(confectionEditEntry)).toBe(false);
        expect(Journal.isFillingProductionJournalEntryEntity(confectionProductionEntry)).toBe(false);
      });

      test('narrows type correctly', () => {
        const entry: AnyJournalEntryEntity = fillingProductionEntry;
        if (Journal.isFillingProductionJournalEntryEntity(entry)) {
          expect(entry.type).toBe('filling-production');
          expect(entry.yield).toBe(300);
        }
      });
    });

    describe('isConfectionEditJournalEntry', () => {
      test('returns true for confection edit entries', () => {
        expect(Journal.isConfectionEditJournalEntryEntity(confectionEditEntry)).toBe(true);
      });

      test('returns false for other entry types', () => {
        expect(Journal.isConfectionEditJournalEntryEntity(fillingEditEntry)).toBe(false);
        expect(Journal.isConfectionEditJournalEntryEntity(fillingProductionEntry)).toBe(false);
        expect(Journal.isConfectionEditJournalEntryEntity(confectionProductionEntry)).toBe(false);
      });

      test('narrows type correctly', () => {
        const entry: AnyJournalEntryEntity = confectionEditEntry;
        if (Journal.isConfectionEditJournalEntryEntity(entry)) {
          expect(entry.type).toBe('confection-edit');
          expect(entry.variationId).toBe('source.truffle@2026-01-01-01');
        }
      });
    });

    describe('isConfectionProductionJournalEntry', () => {
      test('returns true for confection production entries', () => {
        expect(Journal.isConfectionProductionJournalEntryEntity(confectionProductionEntry)).toBe(true);
      });

      test('returns false for other entry types', () => {
        expect(Journal.isConfectionProductionJournalEntryEntity(fillingEditEntry)).toBe(false);
        expect(Journal.isConfectionProductionJournalEntryEntity(fillingProductionEntry)).toBe(false);
        expect(Journal.isConfectionProductionJournalEntryEntity(confectionEditEntry)).toBe(false);
      });

      test('narrows type correctly', () => {
        const entry: AnyJournalEntryEntity = confectionProductionEntry;
        if (Journal.isConfectionProductionJournalEntryEntity(entry)) {
          expect(entry.type).toBe('confection-production');
          expect(entry.yield.count).toBe(24);
        }
      });
    });

    describe('isGroupNotesJournalEntryEntity', () => {
      const groupNotesEntry: IGroupNotesJournalEntryEntity = {
        type: 'group-notes',
        baseId: '2026-01-15-100000-00000005' as IGroupNotesJournalEntryEntity['baseId'],
        timestamp: '2026-01-15T10:00:00Z',
        group: '2026-01-15-batch' as GroupName,
        label: 'January batch',
        notes: [{ category: 'general' as NoteCategory, note: 'First batch of the year' }]
      };

      test('returns true for group notes entries', () => {
        expect(Journal.isGroupNotesJournalEntryEntity(groupNotesEntry)).toBe(true);
      });

      test('returns false for other entry types', () => {
        expect(Journal.isGroupNotesJournalEntryEntity(fillingEditEntry)).toBe(false);
        expect(Journal.isGroupNotesJournalEntryEntity(confectionProductionEntry)).toBe(false);
      });

      test('narrows type correctly', () => {
        const entry: AnyJournalEntryEntity = groupNotesEntry;
        if (Journal.isGroupNotesJournalEntryEntity(entry)) {
          expect(entry.type).toBe('group-notes');
          expect(entry.group).toBe('2026-01-15-batch');
          expect(entry.label).toBe('January batch');
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
