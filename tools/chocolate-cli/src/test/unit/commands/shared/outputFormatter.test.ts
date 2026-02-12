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

import { CollectionId, Model as CommonModel, NoteCategory, UrlCategory } from '@fgv/ts-chocolate';

import {
  formatNumber,
  formatCategorizedNotes,
  padRight,
  getCollectionIdFromCompositeId,
  formatUrls,
  formatTags,
  getPreferredId,
  formatOptionsWithPreferred,
  formatGenericListHuman,
  formatGenericListTable,
  formatList,
  formatEntityData,
  IGenericListItem,
  IColumnConfig
} from '../../../../commands/shared/outputFormatter';

describe('outputFormatter', () => {
  // ============================================================================
  // formatNumber
  // ============================================================================

  describe('formatNumber', () => {
    test('formats with default precision of 1', () => {
      expect(formatNumber(3.14159)).toBe('3.1');
    });

    test('formats with specified precision', () => {
      expect(formatNumber(3.14159, 2)).toBe('3.14');
    });

    test('formats integer with trailing zero', () => {
      expect(formatNumber(5, 1)).toBe('5.0');
    });

    test('formats with precision 0', () => {
      expect(formatNumber(3.7, 0)).toBe('4');
    });
  });

  // ============================================================================
  // formatCategorizedNotes
  // ============================================================================

  describe('formatCategorizedNotes', () => {
    test('returns undefined for undefined input', () => {
      expect(formatCategorizedNotes(undefined)).toBeUndefined();
    });

    test('returns undefined for empty array', () => {
      expect(formatCategorizedNotes([])).toBeUndefined();
    });

    test('joins notes with default separator', () => {
      const notes: CommonModel.ICategorizedNote[] = [
        { category: 'general' as NoteCategory, note: 'First note' },
        { category: 'tasting' as NoteCategory, note: 'Second note' }
      ];
      expect(formatCategorizedNotes(notes)).toBe('First note; Second note');
    });

    test('joins notes with custom separator', () => {
      const notes: CommonModel.ICategorizedNote[] = [
        { category: 'general' as NoteCategory, note: 'A' },
        { category: 'general' as NoteCategory, note: 'B' }
      ];
      expect(formatCategorizedNotes(notes, ' | ')).toBe('A | B');
    });

    test('returns single note without separator', () => {
      const notes: CommonModel.ICategorizedNote[] = [
        { category: 'general' as NoteCategory, note: 'Only note' }
      ];
      expect(formatCategorizedNotes(notes)).toBe('Only note');
    });
  });

  // ============================================================================
  // padRight
  // ============================================================================

  describe('padRight', () => {
    test('pads shorter string', () => {
      expect(padRight('abc', 6)).toBe('abc   ');
    });

    test('returns string unchanged when already at length', () => {
      expect(padRight('abc', 3)).toBe('abc');
    });

    test('returns string unchanged when longer than length', () => {
      expect(padRight('abcdef', 3)).toBe('abcdef');
    });
  });

  // ============================================================================
  // getCollectionIdFromCompositeId
  // ============================================================================

  describe('getCollectionIdFromCompositeId', () => {
    test('extracts collection from composite ID', () => {
      expect(getCollectionIdFromCompositeId('test.dark-chocolate')).toBe('test');
    });

    test('returns full string when no separator found', () => {
      expect(getCollectionIdFromCompositeId('no-dot-here')).toBe('no-dot-here');
    });

    test('handles multiple dots by taking first segment', () => {
      expect(getCollectionIdFromCompositeId('a.b.c')).toBe('a');
    });
  });

  // ============================================================================
  // formatUrls
  // ============================================================================

  describe('formatUrls', () => {
    test('appends URLs section to lines', () => {
      const urls: CommonModel.ICategorizedUrl[] = [
        { category: 'manufacturer' as UrlCategory, url: 'https://example.com' },
        { category: 'video' as UrlCategory, url: 'https://video.example.com' }
      ];
      const lines: string[] = ['existing'];
      formatUrls(urls, lines);
      expect(lines).toEqual([
        'existing',
        '',
        'URLs:',
        '  [manufacturer] https://example.com',
        '  [video] https://video.example.com'
      ]);
    });
  });

  // ============================================================================
  // formatTags
  // ============================================================================

  describe('formatTags', () => {
    test('joins tags with comma separator', () => {
      expect(formatTags(['dark', 'ganache', 'premium'])).toBe('dark, ganache, premium');
    });

    test('returns empty string for undefined', () => {
      expect(formatTags(undefined)).toBe('');
    });

    test('returns single tag without separator', () => {
      expect(formatTags(['solo'])).toBe('solo');
    });
  });

  // ============================================================================
  // getPreferredId
  // ============================================================================

  describe('getPreferredId', () => {
    test('returns preferredId when set', () => {
      const options = {
        options: [{ id: 'a' }, { id: 'b' }],
        preferredId: 'b'
      };
      expect(getPreferredId(options)).toBe('b');
    });

    test('returns first option ID when no preferredId', () => {
      const options = {
        options: [{ id: 'first' }, { id: 'second' }]
      };
      expect(getPreferredId(options)).toBe('first');
    });

    test('returns undefined when no options and no preferredId', () => {
      const options = {
        options: [] as Array<{ id: string }>
      };
      expect(getPreferredId(options)).toBeUndefined();
    });
  });

  // ============================================================================
  // formatOptionsWithPreferred
  // ============================================================================

  describe('formatOptionsWithPreferred', () => {
    test('formats options with preferred marker', () => {
      const options: CommonModel.IOptionsWithPreferred<CommonModel.IRefWithNotes<string>, string> = {
        options: [{ id: 'proc-1' }, { id: 'proc-2' }],
        preferredId: 'proc-1'
      };
      const lines: string[] = [];
      formatOptionsWithPreferred(options, lines, 'Procedures');
      expect(lines).toEqual(['', 'Procedures:', '  proc-1 (preferred)', '  proc-2']);
    });

    test('formats options with notes', () => {
      const options: CommonModel.IOptionsWithPreferred<CommonModel.IRefWithNotes<string>, string> = {
        options: [
          {
            id: 'proc-1',
            notes: [{ category: 'general' as NoteCategory, note: 'some note' }]
          }
        ]
      };
      const lines: string[] = [];
      formatOptionsWithPreferred(options, lines, 'Steps');
      // First option becomes preferred when preferredId not set
      // Notes array is coerced to string via template literal
      expect(lines[2]).toContain('proc-1');
      expect(lines[2]).toContain('(preferred)');
    });
  });

  // ============================================================================
  // formatGenericListHuman
  // ============================================================================

  describe('formatGenericListHuman', () => {
    const columns: IColumnConfig[] = [
      { header: 'ID', getValue: (item) => item.id },
      { header: 'Name', getValue: (item) => item.name, minWidth: 10 }
    ];

    test('returns "not found" message for empty list', () => {
      expect(formatGenericListHuman([], 'ingredient', columns)).toBe('No ingredients found.');
    });

    test('formats items with aligned columns', () => {
      const items: IGenericListItem[] = [
        { id: 'a.one', name: 'One', collectionId: 'a' as CollectionId },
        { id: 'b.two-long', name: 'Two', collectionId: 'b' as CollectionId }
      ];
      const result = formatGenericListHuman(items, 'item', columns);
      expect(result).toContain('Found 2 item(s):');
      expect(result).toContain('ID');
      expect(result).toContain('Name');
      expect(result).toContain('a.one');
      expect(result).toContain('b.two-long');
    });
  });

  // ============================================================================
  // formatGenericListTable
  // ============================================================================

  describe('formatGenericListTable', () => {
    const columns: IColumnConfig[] = [
      { header: 'ID', getValue: (item) => item.id },
      { header: 'Name', getValue: (item) => item.name }
    ];

    test('returns "not found" message for empty list', () => {
      expect(formatGenericListTable([], 'mold', columns)).toBe('No molds found.');
    });

    test('formats items with pipe separators', () => {
      const items: IGenericListItem[] = [{ id: 'x', name: 'ExItem', collectionId: 'c' as CollectionId }];
      const result = formatGenericListTable(items, 'item', columns);
      expect(result).toContain(' | ');
      expect(result).toContain('-+-');
      expect(result).toContain('x');
      expect(result).toContain('ExItem');
    });
  });

  // ============================================================================
  // formatList
  // ============================================================================

  describe('formatList', () => {
    const columns: IColumnConfig[] = [
      { header: 'ID', getValue: (item) => item.id },
      { header: 'Name', getValue: (item) => item.name }
    ];
    const items: IGenericListItem[] = [{ id: 'test.a', name: 'Alpha', collectionId: 'test' as CollectionId }];

    test('formats as JSON', () => {
      const result = formatList(items, 'json', 'item', columns);
      expect(JSON.parse(result)).toEqual(items);
    });

    test('formats as YAML', () => {
      const result = formatList(items, 'yaml', 'item', columns);
      expect(result).toContain('test.a');
      expect(result).toContain('Alpha');
    });

    test('formats as table', () => {
      const result = formatList(items, 'table', 'item', columns);
      expect(result).toContain(' | ');
    });

    test('formats as human (default)', () => {
      const result = formatList(items, 'human', 'item', columns);
      expect(result).toContain('Found 1 item(s):');
    });
  });

  // ============================================================================
  // formatEntityData
  // ============================================================================

  describe('formatEntityData', () => {
    const entity = { name: 'test', value: 42 };

    test('formats as JSON', () => {
      const result = formatEntityData(entity, 'json');
      expect(JSON.parse(result)).toEqual(entity);
    });

    test('formats as YAML', () => {
      const result = formatEntityData(entity, 'yaml');
      expect(result).toContain('name: test');
      expect(result).toContain('value: 42');
    });
  });
});
