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

import {
  UserLibrary as UserLib,
  NoteCategory,
  Model as CommonModel,
  BaseJournalId,
  JournalId,
  FillingId,
  FillingName,
  FillingRecipeVariationId,
  ConfectionId,
  ConfectionName,
  ConfectionRecipeVariationId
} from '@fgv/ts-chocolate';

import {
  renderJournalSummary,
  renderJournalDetail
} from '../../../../../commands/workspace/renderers/journalRenderer';

describe('journalRenderer', () => {
  // ============================================================================
  // renderJournalSummary
  // ============================================================================

  describe('renderJournalSummary', () => {
    test('formats filling-edit entry', () => {
      const entry = {
        timestamp: '2026-02-10T10:30:00Z',
        entity: { type: 'filling-edit' },
        recipe: { name: 'Dark Ganache' }
      } as unknown as UserLib.AnyJournalEntry;

      expect(renderJournalSummary(entry)).toBe('2026-02-10T10:30:00Z [filling-edit] Dark Ganache');
    });

    test('formats filling-production entry', () => {
      const entry = {
        timestamp: '2026-02-09T15:45:00Z',
        entity: { type: 'filling-production' },
        recipe: { name: 'Caramel Filling' }
      } as unknown as UserLib.AnyJournalEntry;

      expect(renderJournalSummary(entry)).toBe('2026-02-09T15:45:00Z [filling-production] Caramel Filling');
    });

    test('formats confection-production entry', () => {
      const entry = {
        timestamp: '2026-02-08T12:00:00Z',
        entity: { type: 'confection-production' },
        recipe: { name: 'Truffle Collection' }
      } as unknown as UserLib.AnyJournalEntry;

      expect(renderJournalSummary(entry)).toBe(
        '2026-02-08T12:00:00Z [confection-production] Truffle Collection'
      );
    });

    test('formats confection-edit entry', () => {
      const entry = {
        timestamp: '2026-02-07T09:15:00Z',
        entity: { type: 'confection-edit' },
        recipe: { name: 'Bar Recipe' }
      } as unknown as UserLib.AnyJournalEntry;

      expect(renderJournalSummary(entry)).toBe('2026-02-07T09:15:00Z [confection-edit] Bar Recipe');
    });
  });

  // ============================================================================
  // renderJournalDetail
  // ============================================================================

  describe('renderJournalDetail', () => {
    test('renders filling-edit entry with basic fields', () => {
      const entry = {
        id: 'journal-001' as JournalId,
        baseId: 'base-001' as BaseJournalId,
        timestamp: '2026-02-10T10:30:00Z',
        variationId: 'variation-001' as unknown as FillingRecipeVariationId,
        recipe: {
          id: 'recipe-dark-ganache' as unknown as FillingId,
          name: 'Dark Ganache' as unknown as FillingName
        },
        entity: { type: 'filling-edit' }
      } as unknown as UserLib.AnyJournalEntry;

      const result = renderJournalDetail(entry);

      expect(result.text).toContain('Journal Entry: Dark Ganache');
      expect(result.text).toContain('ID: journal-001');
      expect(result.text).toContain('Timestamp: 2026-02-10T10:30:00Z');
      expect(result.text).toContain('Type: filling-edit');
      expect(result.text).toContain('Recipe: Dark Ganache (recipe-dark-ganache)');
      expect(result.text).toContain('Variation: variation-001');

      expect(result.actions).toHaveLength(1);
      expect(result.actions[0].key).toBe('view-filling:recipe-dark-ganache');
      expect(result.actions[0].label).toBe('View filling: Dark Ganache');
      expect(result.actions[0].description).toBe('Navigate to filling recipe-dark-ganache');
    });

    test('renders filling-production entry with yield', () => {
      const entry = {
        id: 'journal-002' as JournalId,
        baseId: 'base-002' as BaseJournalId,
        timestamp: '2026-02-09T15:45:00Z',
        variationId: 'variation-002' as unknown as FillingRecipeVariationId,
        recipe: {
          id: 'recipe-caramel' as unknown as FillingId,
          name: 'Caramel Filling' as unknown as FillingName
        },
        entity: {
          type: 'filling-production',
          yield: 500
        }
      } as unknown as UserLib.AnyJournalEntry;

      const result = renderJournalDetail(entry);

      expect(result.text).toContain('Journal Entry: Caramel Filling');
      expect(result.text).toContain('Type: filling-production');
      expect(result.text).toContain('Yield: 500g');

      expect(result.actions).toHaveLength(1);
      expect(result.actions[0].key).toBe('view-filling:recipe-caramel');
    });

    test('renders confection-production entry with default unit', () => {
      const entry = {
        id: 'journal-003' as JournalId,
        baseId: 'base-003' as BaseJournalId,
        timestamp: '2026-02-08T12:00:00Z',
        variationId: 'variation-003' as unknown as ConfectionRecipeVariationId,
        recipe: {
          id: 'recipe-truffle' as unknown as ConfectionId,
          name: 'Truffle Collection' as unknown as ConfectionName
        },
        entity: {
          type: 'confection-production',
          yield: { count: 48 }
        }
      } as unknown as UserLib.AnyJournalEntry;

      const result = renderJournalDetail(entry);

      expect(result.text).toContain('Journal Entry: Truffle Collection');
      expect(result.text).toContain('Type: confection-production');
      expect(result.text).toContain('Yield: 48 pieces');

      expect(result.actions).toHaveLength(1);
      expect(result.actions[0].key).toBe('view-confection:recipe-truffle');
      expect(result.actions[0].label).toBe('View confection: Truffle Collection');
    });

    test('renders confection-production entry with piece-based yield', () => {
      const entry = {
        id: 'journal-004' as JournalId,
        baseId: 'base-004' as BaseJournalId,
        timestamp: '2026-02-07T09:15:00Z',
        variationId: 'variation-004' as unknown as ConfectionRecipeVariationId,
        recipe: {
          id: 'recipe-bar' as unknown as ConfectionId,
          name: 'Bar Recipe' as unknown as ConfectionName
        },
        entity: {
          type: 'confection-production',
          yield: { count: 24 }
        }
      } as unknown as UserLib.AnyJournalEntry;

      const result = renderJournalDetail(entry);

      expect(result.text).toContain('Journal Entry: Bar Recipe');
      expect(result.text).toContain('Type: confection-production');
      expect(result.text).toContain('Yield: 24 pieces');

      expect(result.actions).toHaveLength(1);
      expect(result.actions[0].key).toBe('view-confection:recipe-bar');
    });

    test('renders confection-edit entry', () => {
      const entry = {
        id: 'journal-005' as JournalId,
        baseId: 'base-005' as BaseJournalId,
        timestamp: '2026-02-06T14:20:00Z',
        variationId: 'variation-005' as unknown as ConfectionRecipeVariationId,
        recipe: {
          id: 'recipe-bonbon' as unknown as ConfectionId,
          name: 'BonBon Recipe' as unknown as ConfectionName
        },
        entity: { type: 'confection-edit' }
      } as unknown as UserLib.AnyJournalEntry;

      const result = renderJournalDetail(entry);

      expect(result.text).toContain('Journal Entry: BonBon Recipe');
      expect(result.text).toContain('Type: confection-edit');
      expect(result.text).not.toContain('Yield:');

      expect(result.actions).toHaveLength(1);
      expect(result.actions[0].key).toBe('view-confection:recipe-bonbon');
      expect(result.actions[0].label).toBe('View confection: BonBon Recipe');
    });

    test('renders entry with updated variation', () => {
      const entry = {
        id: 'journal-006' as JournalId,
        baseId: 'base-006' as BaseJournalId,
        timestamp: '2026-02-05T11:30:00Z',
        variationId: 'variation-006' as unknown as FillingRecipeVariationId,
        recipe: {
          id: 'recipe-updated' as unknown as FillingId,
          name: 'Updated Recipe' as unknown as FillingName
        },
        entity: { type: 'filling-edit' },
        updated: {},
        updatedId: 'updated-variation' as unknown as FillingRecipeVariationId
      } as unknown as UserLib.AnyJournalEntry;

      const result = renderJournalDetail(entry);

      expect(result.text).toContain('Updated Variation: updated-variation');
    });

    test('renders entry with updated flag but no updatedId', () => {
      const entry = {
        id: 'journal-007' as JournalId,
        baseId: 'base-007' as BaseJournalId,
        timestamp: '2026-02-04T16:00:00Z',
        variationId: 'variation-007' as unknown as FillingRecipeVariationId,
        recipe: {
          id: 'recipe-mystery' as unknown as FillingId,
          name: 'Mystery Recipe' as unknown as FillingName
        },
        entity: { type: 'filling-edit' },
        updated: {}
      } as unknown as UserLib.AnyJournalEntry;

      const result = renderJournalDetail(entry);

      expect(result.text).toContain('Updated Variation: (unknown)');
    });

    test('renders entry with notes', () => {
      const notes: CommonModel.ICategorizedNote[] = [
        { category: 'general' as NoteCategory, note: 'First batch of the season' },
        { category: 'tasting' as NoteCategory, note: 'Rich and smooth' }
      ];

      const entry = {
        id: 'journal-008' as JournalId,
        baseId: 'base-008' as BaseJournalId,
        timestamp: '2026-02-03T13:45:00Z',
        variationId: 'variation-008' as unknown as FillingRecipeVariationId,
        recipe: {
          id: 'recipe-notes' as unknown as FillingId,
          name: 'Recipe With Notes' as unknown as FillingName
        },
        entity: { type: 'filling-production', yield: 750 },
        notes
      } as unknown as UserLib.AnyJournalEntry;

      const result = renderJournalDetail(entry);

      expect(result.text).toContain('Notes: First batch of the season; Rich and smooth');
    });

    test('renders minimal entry without optional fields', () => {
      const entry = {
        id: 'journal-009' as JournalId,
        baseId: 'base-009' as BaseJournalId,
        timestamp: '2026-02-02T08:00:00Z',
        variationId: 'variation-009' as unknown as ConfectionRecipeVariationId,
        recipe: {
          id: 'recipe-minimal' as unknown as ConfectionId,
          name: 'Minimal Recipe' as unknown as ConfectionName
        },
        entity: { type: 'confection-edit' }
      } as unknown as UserLib.AnyJournalEntry;

      const result = renderJournalDetail(entry);

      expect(result.text).toContain('Journal Entry: Minimal Recipe');
      expect(result.text).toContain('ID: journal-009');
      expect(result.text).toContain('Timestamp: 2026-02-02T08:00:00Z');
      expect(result.text).not.toContain('Yield:');
      expect(result.text).not.toContain('Updated Variation:');
      expect(result.text).not.toContain('Notes:');

      expect(result.actions).toHaveLength(1);
      expect(result.actions[0].key).toBe('view-confection:recipe-minimal');
    });
  });
});
