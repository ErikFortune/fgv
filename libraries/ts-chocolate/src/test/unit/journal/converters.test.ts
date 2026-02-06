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
import { journalEntryType, anyJournalEntryEntity } from '../../../packlets/entities/journal/converters';

describe('Journal Converters', () => {
  // ============================================================================
  // journalEntryType Converter
  // ============================================================================

  describe('journalEntryType', () => {
    test('converts valid entry types', () => {
      expect(journalEntryType.convert('filling-edit')).toSucceedWith('filling-edit');
      expect(journalEntryType.convert('confection-edit')).toSucceedWith('confection-edit');
      expect(journalEntryType.convert('filling-production')).toSucceedWith('filling-production');
      expect(journalEntryType.convert('confection-production')).toSucceedWith('confection-production');
    });

    test('fails for invalid entry type', () => {
      expect(journalEntryType.convert('invalid-type')).toFail();
      expect(journalEntryType.convert('')).toFail();
      expect(journalEntryType.convert(123)).toFail();
    });
  });

  // ============================================================================
  // anyJournalEntry Converter
  // ============================================================================

  describe('anyJournalEntry', () => {
    test('converts filling-edit entry', () => {
      const entry = {
        type: 'filling-edit',
        baseId: '2024-01-01-100000-00000001',
        timestamp: '2024-01-01T00:00:00Z',
        variationId: 'source.filling@2024-01-01-01',
        recipe: {
          variationSpec: '2024-01-01-01',
          createdDate: '2024-01-01',
          ingredients: [],
          baseWeight: 100
        }
      };

      expect(anyJournalEntryEntity.convert(entry)).toSucceedAndSatisfy((result) => {
        expect(result.type).toBe('filling-edit');
        expect(result.baseId).toBe('2024-01-01-100000-00000001');
      });
    });

    test('converts confection-edit entry', () => {
      const entry = {
        type: 'confection-edit',
        baseId: '2024-01-01-100000-00000002',
        timestamp: '2024-01-01T00:00:00Z',
        variationId: 'source.confection@2024-01-01-01',
        recipe: {
          variationSpec: '2024-01-01-01',
          createdDate: '2024-01-01',
          yield: { count: 10 },
          molds: { preferredId: 'mold-1', options: [] },
          shellChocolate: { ids: ['choc-1'] }
        }
      };

      expect(anyJournalEntryEntity.convert(entry)).toSucceedAndSatisfy((result) => {
        expect(result.type).toBe('confection-edit');
        expect(result.baseId).toBe('2024-01-01-100000-00000002');
      });
    });

    test('fails for invalid entry', () => {
      expect(anyJournalEntryEntity.convert({})).toFail();
      expect(anyJournalEntryEntity.convert({ type: 'invalid' })).toFail();
      expect(anyJournalEntryEntity.convert(null)).toFail();
    });
  });
});
