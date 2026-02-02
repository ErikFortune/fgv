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

import { JournalLibrary } from '../../../packlets/entities';
import {
  FillingId,
  FillingVersionId,
  FillingVersionSpec,
  JournalId,
  Measurement,
  SourceId
} from '../../../packlets/common';
import type { AnyJournalEntry, IFillingProductionJournalEntry } from '../../../packlets/entities';

describe('JournalLibrary (Collection-Based)', () => {
  // ============================================================================
  // Test Data Helpers
  // ============================================================================

  const makeFillingJournal = (
    id: string,
    versionId: string,
    timestamp: string = '2026-01-15T10:00:00Z'
  ): IFillingProductionJournalEntry => ({
    type: 'filling-production',
    id: id as JournalId,
    timestamp,
    versionId: versionId as FillingVersionId,
    recipe: {
      versionSpec: versionId as FillingVersionSpec,
      createdDate: '2026-01-01',
      ingredients: [],
      baseWeight: 300 as Measurement
    },
    yield: 600 as Measurement,
    produced: {
      versionId: versionId as FillingVersionId,
      scaleFactor: 2,
      targetWeight: 600 as Measurement,
      ingredients: []
    }
  });

  // Note: Confection journal tests omitted for brevity - filling journals
  // are sufficient to test the collection-based library functionality

  const createLibraryWithJournals = (journals: AnyJournalEntry[]): JournalLibrary => {
    const items: Record<string, unknown> = {};
    for (const journal of journals) {
      items[journal.id] = journal;
    }
    return JournalLibrary.create({
      collections: [
        {
          id: 'test-collection' as SourceId,
          items,
          isMutable: true
        }
      ]
    }).orThrow();
  };

  // ============================================================================
  // Factory Tests
  // ============================================================================

  describe('create', () => {
    test('creates empty library', () => {
      expect(JournalLibrary.create()).toSucceedAndSatisfy((lib) => {
        expect(lib.size).toBe(0);
        expect(lib.getAllJournals()).toHaveLength(0);
      });
    });

    test('creates library with single collection', () => {
      const journal = makeFillingJournal('2026-01-15-100000-00000001', 'source.recipe-a@2026-01-01-01');
      const lib = createLibraryWithJournals([journal]);

      expect(lib.size).toBe(1);
      expect(lib.getAllJournals()).toHaveLength(1);
    });

    test('creates library with multiple collections', () => {
      const journal1 = makeFillingJournal('2026-01-15-100000-00000001', 'source.recipe-a@2026-01-01-01');
      const journal2 = makeFillingJournal('2026-01-16-100000-00000002', 'source.recipe-a@2026-01-01-01');

      const items1: Record<string, unknown> = { [journal1.id]: journal1 };
      const items2: Record<string, unknown> = { [journal2.id]: journal2 };

      const lib = JournalLibrary.create({
        collections: [
          { id: 'collection-1' as SourceId, items: items1, isMutable: true },
          { id: 'collection-2' as SourceId, items: items2, isMutable: true }
        ]
      }).orThrow();

      expect(lib.size).toBe(2);
      expect(lib.getAllJournals()).toHaveLength(2);
    });
  });

  // ============================================================================
  // Query Tests - Filling Journals
  // ============================================================================

  describe('getJournalsForFilling', () => {
    test('returns journals for a filling across all versions', () => {
      const journal1 = makeFillingJournal('2026-01-15-100000-00000001', 'source.recipe-a@2026-01-01-01');
      const journal2 = makeFillingJournal('2026-01-16-100000-00000002', 'source.recipe-a@2026-01-02-01');
      const journal3 = makeFillingJournal('2026-01-17-100000-00000003', 'source.recipe-b@2026-01-01-01');

      const lib = createLibraryWithJournals([journal1, journal2, journal3]);

      const results = lib.getJournalsForFilling('source.recipe-a' as FillingId);
      expect(results).toHaveLength(2);
      expect(results.map((j) => j.id)).toContain(journal1.id);
      expect(results.map((j) => j.id)).toContain(journal2.id);
    });

    test('returns empty array for unknown filling', () => {
      const journal = makeFillingJournal('2026-01-15-100000-00000001', 'source.recipe-a@2026-01-01-01');
      const lib = createLibraryWithJournals([journal]);

      const results = lib.getJournalsForFilling('source.unknown' as FillingId);
      expect(results).toHaveLength(0);
    });

    test('works across multiple collections', () => {
      const journal1 = makeFillingJournal('2026-01-15-100000-00000001', 'source.recipe-a@2026-01-01-01');
      const journal2 = makeFillingJournal('2026-01-16-100000-00000002', 'source.recipe-a@2026-01-02-01');

      const items1: Record<string, unknown> = { [journal1.id]: journal1 };
      const items2: Record<string, unknown> = { [journal2.id]: journal2 };

      const lib = JournalLibrary.create({
        collections: [
          { id: 'collection-1' as SourceId, items: items1, isMutable: true },
          { id: 'collection-2' as SourceId, items: items2, isMutable: true }
        ]
      }).orThrow();

      const results = lib.getJournalsForFilling('source.recipe-a' as FillingId);
      expect(results).toHaveLength(2);
    });
  });

  describe('getJournalsForFillingVersion', () => {
    test('returns journals for specific filling version', () => {
      const journal1 = makeFillingJournal('2026-01-15-100000-00000001', 'source.recipe-a@2026-01-01-01');
      const journal2 = makeFillingJournal('2026-01-16-100000-00000002', 'source.recipe-a@2026-01-01-01');
      const journal3 = makeFillingJournal('2026-01-17-100000-00000003', 'source.recipe-a@2026-01-02-01');

      const lib = createLibraryWithJournals([journal1, journal2, journal3]);

      const results = lib.getJournalsForFillingVersion('source.recipe-a@2026-01-01-01' as FillingVersionId);
      expect(results).toHaveLength(2);
      expect(results.map((j) => j.id)).toContain(journal1.id);
      expect(results.map((j) => j.id)).toContain(journal2.id);
    });

    test('returns empty array for unknown version', () => {
      const journal = makeFillingJournal('2026-01-15-100000-00000001', 'source.recipe-a@2026-01-01-01');
      const lib = createLibraryWithJournals([journal]);

      const results = lib.getJournalsForFillingVersion('source.recipe-a@2026-99-99-99' as FillingVersionId);
      expect(results).toHaveLength(0);
    });
  });

  // Note: Confection journal query tests omitted - same patterns as filling tests

  // ============================================================================
  // Individual Journal Access
  // ============================================================================

  describe('getJournal', () => {
    test('retrieves journal by ID', () => {
      const journal = makeFillingJournal('2026-01-15-100000-00000001', 'source.recipe-a@2026-01-01-01');
      const lib = createLibraryWithJournals([journal]);

      expect(lib.getJournal(journal.id)).toSucceedWith(journal);
    });

    test('fails for unknown ID', () => {
      const lib = JournalLibrary.create().orThrow();
      expect(lib.getJournal('unknown' as JournalId)).toFail();
    });
  });

  describe('hasJournal', () => {
    test('returns true for existing journal', () => {
      const journal = makeFillingJournal('2026-01-15-100000-00000001', 'source.recipe-a@2026-01-01-01');
      const lib = createLibraryWithJournals([journal]);

      expect(lib.hasJournal(journal.id)).toBe(true);
    });

    test('returns false for unknown journal', () => {
      const lib = JournalLibrary.create().orThrow();
      expect(lib.hasJournal('unknown' as JournalId)).toBe(false);
    });
  });

  describe('getAllJournals', () => {
    test('returns all journals across collections', () => {
      const journal1 = makeFillingJournal('2026-01-15-100000-00000001', 'source.recipe-a@2026-01-01-01');
      const journal2 = makeFillingJournal('2026-01-16-100000-00000002', 'source.recipe-b@2026-01-01-01');

      const lib = createLibraryWithJournals([journal1, journal2]);

      const results = lib.getAllJournals();
      expect(results).toHaveLength(2);
      expect(results.map((j) => j.id)).toContain(journal1.id);
      expect(results.map((j) => j.id)).toContain(journal2.id);
    });

    test('returns empty array for empty library', () => {
      const lib = JournalLibrary.create().orThrow();
      expect(lib.getAllJournals()).toHaveLength(0);
    });
  });

  // ============================================================================
  // Lazy Index Rebuilding Tests
  // ============================================================================

  describe('lazy index rebuilding', () => {
    test('indices work after library creation', () => {
      const journal1 = makeFillingJournal('2026-01-15-100000-00000001', 'source.recipe-a@2026-01-01-01');
      const journal2 = makeFillingJournal('2026-01-16-100000-00000002', 'source.recipe-a@2026-01-01-01');

      const lib = createLibraryWithJournals([journal1, journal2]);

      // First query should trigger index rebuild
      const results = lib.getJournalsForFilling('source.recipe-a' as FillingId);
      expect(results).toHaveLength(2);

      // Subsequent queries should use cached indices
      const results2 = lib.getJournalsForFilling('source.recipe-a' as FillingId);
      expect(results2).toHaveLength(2);
    });

    test('handles multiple filling journals efficiently', () => {
      const journal1 = makeFillingJournal('2026-01-15-100000-00000001', 'source.recipe-a@2026-01-01-01');
      const journal2 = makeFillingJournal('2026-01-16-100000-00000002', 'source.recipe-b@2026-01-01-01');
      const journal3 = makeFillingJournal('2026-01-17-100000-00000003', 'source.recipe-a@2026-01-02-01');

      const lib = createLibraryWithJournals([journal1, journal2, journal3]);

      // Queries should work efficiently after index rebuild
      const resultsA = lib.getJournalsForFilling('source.recipe-a' as FillingId);
      expect(resultsA).toHaveLength(2);

      const resultsB = lib.getJournalsForFilling('source.recipe-b' as FillingId);
      expect(resultsB).toHaveLength(1);
    });
  });

  // ============================================================================
  // Multi-Collection Tests
  // ============================================================================

  describe('multi-collection support', () => {
    test('queries span multiple collections', () => {
      const journal1 = makeFillingJournal('2026-01-15-100000-00000001', 'source.recipe-a@2026-01-01-01');
      const journal2 = makeFillingJournal('2026-01-16-100000-00000002', 'source.recipe-a@2026-01-01-01');
      const journal3 = makeFillingJournal('2026-01-17-100000-00000003', 'source.recipe-a@2026-01-01-01');

      const items1: Record<string, unknown> = { [journal1.id]: journal1 };
      const items2: Record<string, unknown> = {
        [journal2.id]: journal2,
        [journal3.id]: journal3
      };

      const lib = JournalLibrary.create({
        collections: [
          { id: 'erik-journals' as SourceId, items: items1, isMutable: true },
          { id: 'lab-journals' as SourceId, items: items2, isMutable: true }
        ]
      }).orThrow();

      expect(lib.size).toBe(3);

      const results = lib.getJournalsForFilling('source.recipe-a' as FillingId);
      expect(results).toHaveLength(3);
    });

    test('size reflects total across all collections', () => {
      const journal1 = makeFillingJournal('2026-01-15-100000-00000001', 'source.recipe-a@2026-01-01-01');
      const journal2 = makeFillingJournal('2026-01-16-100000-00000002', 'source.recipe-b@2026-01-01-01');

      const items1: Record<string, unknown> = { [journal1.id]: journal1 };
      const items2: Record<string, unknown> = { [journal2.id]: journal2 };

      const lib = JournalLibrary.create({
        collections: [
          { id: 'collection-1' as SourceId, items: items1, isMutable: true },
          { id: 'collection-2' as SourceId, items: items2, isMutable: true }
        ]
      }).orThrow();

      expect(lib.size).toBe(2);
    });
  });
});
