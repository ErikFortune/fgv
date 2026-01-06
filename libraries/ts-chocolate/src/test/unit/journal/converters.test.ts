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
import { journalEventType, journalEntry, journalRecord } from '../../../packlets/journal/converters';

describe('Journal Converters', () => {
  // ============================================================================
  // journalEventType Converter
  // ============================================================================

  describe('journalEventType', () => {
    test('converts valid event types', () => {
      expect(journalEventType.convert('ingredient-add')).toSucceedWith('ingredient-add');
      expect(journalEventType.convert('ingredient-remove')).toSucceedWith('ingredient-remove');
      expect(journalEventType.convert('ingredient-modify')).toSucceedWith('ingredient-modify');
      expect(journalEventType.convert('ingredient-substitute')).toSucceedWith('ingredient-substitute');
      expect(journalEventType.convert('scale-adjust')).toSucceedWith('scale-adjust');
      expect(journalEventType.convert('note')).toSucceedWith('note');
    });

    test('fails for invalid event type', () => {
      expect(journalEventType.convert('invalid-type')).toFail();
      expect(journalEventType.convert('')).toFail();
      expect(journalEventType.convert(123)).toFail();
    });
  });

  // ============================================================================
  // journalEntry Converter
  // ============================================================================

  describe('journalEntry', () => {
    test('converts minimal note entry', () => {
      const input = {
        timestamp: '2026-01-15T10:30:00Z',
        eventType: 'note',
        text: 'Started cooking session'
      };
      expect(journalEntry.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.timestamp).toBe('2026-01-15T10:30:00Z');
        expect(result.eventType).toBe('note');
        expect(result.text).toBe('Started cooking session');
      });
    });

    test('converts ingredient-add entry', () => {
      const input = {
        timestamp: '2026-01-15T10:35:00Z',
        eventType: 'ingredient-add',
        ingredientId: 'source.chocolate',
        newAmount: 100
      };
      expect(journalEntry.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.eventType).toBe('ingredient-add');
        expect(result.ingredientId).toBe('source.chocolate');
        expect(result.newAmount).toBe(100);
      });
    });

    test('converts ingredient-remove entry', () => {
      const input = {
        timestamp: '2026-01-15T10:40:00Z',
        eventType: 'ingredient-remove',
        ingredientId: 'source.cream',
        originalAmount: 50
      };
      expect(journalEntry.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.eventType).toBe('ingredient-remove');
        expect(result.ingredientId).toBe('source.cream');
        expect(result.originalAmount).toBe(50);
      });
    });

    test('converts ingredient-modify entry', () => {
      const input = {
        timestamp: '2026-01-15T10:45:00Z',
        eventType: 'ingredient-modify',
        ingredientId: 'source.sugar',
        originalAmount: 20,
        newAmount: 25,
        text: 'Added extra for sweetness'
      };
      expect(journalEntry.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.eventType).toBe('ingredient-modify');
        expect(result.ingredientId).toBe('source.sugar');
        expect(result.originalAmount).toBe(20);
        expect(result.newAmount).toBe(25);
        expect(result.text).toBe('Added extra for sweetness');
      });
    });

    test('converts ingredient-substitute entry', () => {
      const input = {
        timestamp: '2026-01-15T10:50:00Z',
        eventType: 'ingredient-substitute',
        ingredientId: 'source.butter',
        substituteIngredientId: 'source.cocoa-butter',
        originalAmount: 30,
        newAmount: 28,
        text: 'Substituted with cocoa butter'
      };
      expect(journalEntry.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.eventType).toBe('ingredient-substitute');
        expect(result.ingredientId).toBe('source.butter');
        expect(result.substituteIngredientId).toBe('source.cocoa-butter');
        expect(result.originalAmount).toBe(30);
        expect(result.newAmount).toBe(28);
      });
    });

    test('converts scale-adjust entry', () => {
      const input = {
        timestamp: '2026-01-15T10:30:00Z',
        eventType: 'scale-adjust',
        text: 'Scaled up by 1.5x'
      };
      expect(journalEntry.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.eventType).toBe('scale-adjust');
        expect(result.text).toBe('Scaled up by 1.5x');
      });
    });

    test('fails for invalid event type', () => {
      const input = {
        timestamp: '2026-01-15T10:30:00Z',
        eventType: 'invalid-type'
      };
      expect(journalEntry.convert(input)).toFail();
    });

    test('fails for invalid ingredient ID', () => {
      const input = {
        timestamp: '2026-01-15T10:30:00Z',
        eventType: 'ingredient-add',
        ingredientId: 'invalid-no-dot',
        newAmount: 100
      };
      expect(journalEntry.convert(input)).toFail();
    });

    test('fails for negative amount', () => {
      const input = {
        timestamp: '2026-01-15T10:30:00Z',
        eventType: 'ingredient-add',
        ingredientId: 'source.chocolate',
        newAmount: -10
      };
      expect(journalEntry.convert(input)).toFail();
    });
  });

  // ============================================================================
  // journalRecord Converter
  // ============================================================================

  describe('journalRecord', () => {
    test('converts minimal journal record', () => {
      const input = {
        journalId: '2026-01-15-100000-00000001',
        recipeVersionId: 'source.recipe@2026-01-01-01',
        date: '2026-01-15',
        targetWeight: 300,
        scaleFactor: 2
      };
      expect(journalRecord.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.journalId).toBe('2026-01-15-100000-00000001');
        expect(result.recipeVersionId).toBe('source.recipe@2026-01-01-01');
        expect(result.date).toBe('2026-01-15');
        expect(result.targetWeight).toBe(300);
        expect(result.scaleFactor).toBe(2);
      });
    });

    test('converts journal record with notes', () => {
      const input = {
        journalId: '2026-01-15-100000-00000002',
        recipeVersionId: 'source.recipe@2026-01-01-01',
        date: '2026-01-16',
        targetWeight: 150,
        scaleFactor: 1,
        notes: 'Made for special occasion'
      };
      expect(journalRecord.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.notes).toBe('Made for special occasion');
      });
    });

    test('converts journal record with modified version', () => {
      const input = {
        journalId: '2026-01-15-100000-00000003',
        recipeVersionId: 'source.recipe@2026-01-01-01',
        date: '2026-01-17',
        targetWeight: 300,
        scaleFactor: 2,
        modifiedVersionId: 'source.recipe@2026-01-17-01-modified'
      };
      expect(journalRecord.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.modifiedVersionId).toBe('source.recipe@2026-01-17-01-modified');
      });
    });

    test('converts journal record with entries', () => {
      const input = {
        journalId: '2026-01-15-100000-00000004',
        recipeVersionId: 'source.recipe@2026-01-01-01',
        date: '2026-01-18',
        targetWeight: 300,
        scaleFactor: 2,
        entries: [
          {
            timestamp: '2026-01-18T10:00:00Z',
            eventType: 'note',
            text: 'Starting session'
          },
          {
            timestamp: '2026-01-18T10:30:00Z',
            eventType: 'ingredient-modify',
            ingredientId: 'source.sugar',
            originalAmount: 40,
            newAmount: 45
          },
          {
            timestamp: '2026-01-18T11:00:00Z',
            eventType: 'note',
            text: 'Completed successfully'
          }
        ]
      };
      expect(journalRecord.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.entries).toBeDefined();
        expect(result.entries!.length).toBe(3);
        expect(result.entries![0].eventType).toBe('note');
        expect(result.entries![1].eventType).toBe('ingredient-modify');
        expect(result.entries![1].ingredientId).toBe('source.sugar');
        expect(result.entries![2].text).toBe('Completed successfully');
      });
    });

    test('converts complete journal record with all fields', () => {
      const input = {
        journalId: '2026-01-15-100000-00000005',
        recipeVersionId: 'source.recipe@2026-01-01-01',
        date: '2026-01-19',
        targetWeight: 450,
        scaleFactor: 3,
        notes: 'Large batch for event',
        modifiedVersionId: 'source.recipe@2026-01-19-01',
        entries: [
          {
            timestamp: '2026-01-19T09:00:00Z',
            eventType: 'scale-adjust',
            text: 'Scaled to 3x'
          }
        ]
      };
      expect(journalRecord.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.journalId).toBe('2026-01-15-100000-00000005');
        expect(result.recipeVersionId).toBe('source.recipe@2026-01-01-01');
        expect(result.date).toBe('2026-01-19');
        expect(result.targetWeight).toBe(450);
        expect(result.scaleFactor).toBe(3);
        expect(result.notes).toBe('Large batch for event');
        expect(result.modifiedVersionId).toBe('source.recipe@2026-01-19-01');
        expect(result.entries).toBeDefined();
        expect(result.entries!.length).toBe(1);
      });
    });

    test('fails for empty journal ID', () => {
      const input = {
        journalId: '',
        recipeVersionId: 'source.recipe@2026-01-01-01',
        date: '2026-01-15',
        targetWeight: 300,
        scaleFactor: 2
      };
      expect(journalRecord.convert(input)).toFail();
    });

    test('fails for invalid recipe version ID', () => {
      const input = {
        journalId: '2026-01-15-100000-00000001',
        recipeVersionId: 'invalid',
        date: '2026-01-15',
        targetWeight: 300,
        scaleFactor: 2
      };
      expect(journalRecord.convert(input)).toFail();
    });

    test('fails for invalid modified version ID', () => {
      const input = {
        journalId: '2026-01-15-100000-00000001',
        recipeVersionId: 'source.recipe@2026-01-01-01',
        date: '2026-01-15',
        targetWeight: 300,
        scaleFactor: 2,
        modifiedVersionId: 'not-a-valid-id'
      };
      expect(journalRecord.convert(input)).toFail();
    });

    test('fails for negative target weight', () => {
      const input = {
        journalId: '2026-01-15-100000-00000001',
        recipeVersionId: 'source.recipe@2026-01-01-01',
        date: '2026-01-15',
        targetWeight: -100,
        scaleFactor: 2
      };
      expect(journalRecord.convert(input)).toFail();
    });

    test('fails for invalid entry in entries array', () => {
      const input = {
        journalId: '2026-01-15-100000-00000001',
        recipeVersionId: 'source.recipe@2026-01-01-01',
        date: '2026-01-15',
        targetWeight: 300,
        scaleFactor: 2,
        entries: [
          {
            timestamp: '2026-01-15T10:00:00Z',
            eventType: 'invalid-event-type'
          }
        ]
      };
      expect(journalRecord.convert(input)).toFail();
    });
  });
});
