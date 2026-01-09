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
  allJournalEventTypes,
  JournalEventType,
  allConfectionJournalEventTypes,
  ConfectionJournalEventType,
  allChocolateRoles,
  ChocolateRole,
  allJournalTypes,
  JournalType,
  isRecipeJournalRecord,
  isConfectionJournalRecord,
  AnyJournalRecord,
  IRecipeJournalRecord,
  IConfectionJournalRecord
} from '../../../packlets/journal';

describe('Journal Model', () => {
  describe('allJournalEventTypes', () => {
    test('contains all expected event types', () => {
      expect(allJournalEventTypes).toContain('ingredient-add');
      expect(allJournalEventTypes).toContain('ingredient-remove');
      expect(allJournalEventTypes).toContain('ingredient-modify');
      expect(allJournalEventTypes).toContain('ingredient-substitute');
      expect(allJournalEventTypes).toContain('scale-adjust');
      expect(allJournalEventTypes).toContain('note');
    });

    test('has correct number of event types', () => {
      expect(allJournalEventTypes.length).toBe(6);
    });

    test('type assertion for JournalEventType', () => {
      // Verify each element is a valid JournalEventType
      allJournalEventTypes.forEach((eventType) => {
        const typed: JournalEventType = eventType;
        expect(typeof typed).toBe('string');
      });
    });
  });

  describe('allConfectionJournalEventTypes', () => {
    test('contains all expected event types', () => {
      expect(allConfectionJournalEventTypes).toContain('filling-select');
      expect(allConfectionJournalEventTypes).toContain('mold-select');
      expect(allConfectionJournalEventTypes).toContain('chocolate-select');
      expect(allConfectionJournalEventTypes).toContain('yield-modify');
      expect(allConfectionJournalEventTypes).toContain('procedure-select');
      expect(allConfectionJournalEventTypes).toContain('coating-select');
      expect(allConfectionJournalEventTypes).toContain('note');
    });

    test('has correct number of event types', () => {
      expect(allConfectionJournalEventTypes.length).toBe(7);
    });

    test('type assertion for ConfectionJournalEventType', () => {
      allConfectionJournalEventTypes.forEach((eventType) => {
        const typed: ConfectionJournalEventType = eventType;
        expect(typeof typed).toBe('string');
      });
    });
  });

  describe('allChocolateRoles', () => {
    test('contains all expected roles', () => {
      expect(allChocolateRoles).toContain('shell');
      expect(allChocolateRoles).toContain('enrobing');
      expect(allChocolateRoles).toContain('seal');
      expect(allChocolateRoles).toContain('decoration');
    });

    test('has correct number of roles', () => {
      expect(allChocolateRoles.length).toBe(4);
    });

    test('type assertion for ChocolateRole', () => {
      allChocolateRoles.forEach((role) => {
        const typed: ChocolateRole = role;
        expect(typeof typed).toBe('string');
      });
    });
  });

  describe('allJournalTypes', () => {
    test('contains all expected types', () => {
      expect(allJournalTypes).toContain('recipe');
      expect(allJournalTypes).toContain('confection');
    });

    test('has correct number of types', () => {
      expect(allJournalTypes.length).toBe(2);
    });

    test('type assertion for JournalType', () => {
      allJournalTypes.forEach((journalType) => {
        const typed: JournalType = journalType;
        expect(typeof typed).toBe('string');
      });
    });
  });

  describe('type guards', () => {
    const recipeJournal: IRecipeJournalRecord = {
      journalType: 'recipe',
      journalId: '2026-01-15-100000-00000001' as IRecipeJournalRecord['journalId'],
      recipeVersionId: 'source.recipe@2026-01-01-01' as IRecipeJournalRecord['recipeVersionId'],
      date: '2026-01-15',
      targetWeight: 300 as IRecipeJournalRecord['targetWeight'],
      scaleFactor: 2
    };

    const confectionJournal: IConfectionJournalRecord = {
      journalType: 'confection',
      journalId: '2026-01-15-100000-00000002' as IConfectionJournalRecord['journalId'],
      confectionVersionId: 'source.truffle@2026-01-01-01' as IConfectionJournalRecord['confectionVersionId'],
      date: '2026-01-15',
      yieldCount: 24
    };

    describe('isRecipeJournalRecord', () => {
      test('returns true for recipe journal records', () => {
        expect(isRecipeJournalRecord(recipeJournal)).toBe(true);
      });

      test('returns false for confection journal records', () => {
        expect(isRecipeJournalRecord(confectionJournal)).toBe(false);
      });

      test('narrows type correctly', () => {
        const record: AnyJournalRecord = recipeJournal;
        if (isRecipeJournalRecord(record)) {
          // TypeScript should know this is IRecipeJournalRecord
          expect(record.recipeVersionId).toBe('source.recipe@2026-01-01-01');
        }
      });
    });

    describe('isConfectionJournalRecord', () => {
      test('returns true for confection journal records', () => {
        expect(isConfectionJournalRecord(confectionJournal)).toBe(true);
      });

      test('returns false for recipe journal records', () => {
        expect(isConfectionJournalRecord(recipeJournal)).toBe(false);
      });

      test('narrows type correctly', () => {
        const record: AnyJournalRecord = confectionJournal;
        if (isConfectionJournalRecord(record)) {
          // TypeScript should know this is IConfectionJournalRecord
          expect(record.confectionVersionId).toBe('source.truffle@2026-01-01-01');
        }
      });
    });
  });
});
