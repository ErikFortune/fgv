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
import { journalEventType, journalEntry } from '../../../packlets/entities/journal/converters';

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
});
