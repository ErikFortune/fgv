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

import { JournalLibrary, IJournalRecord } from '../../../packlets/journal';
import { Grams, JournalId, RecipeVersionId } from '../../../packlets/common';

describe('JournalLibrary', () => {
  // ============================================================================
  // Test Data
  // ============================================================================

  const makeJournal = (
    id: string,
    versionId: string,
    date: string,
    targetWeight: number = 300,
    scaleFactor: number = 2
  ): IJournalRecord => ({
    journalId: id as JournalId,
    recipeVersionId: versionId as RecipeVersionId,
    date,
    targetWeight: targetWeight as Grams,
    scaleFactor
  });

  const journal1 = makeJournal('2026-01-15-100000-00000001', 'source.recipe-a@2026-01-01-01', '2026-01-15');
  const journal2 = makeJournal('2026-01-15-100000-00000002', 'source.recipe-a@2026-01-01-01', '2026-01-16');
  const journal3 = makeJournal('2026-01-15-100000-00000003', 'source.recipe-a@2026-01-02-01', '2026-01-17');
  const journal4 = makeJournal('journal-004', 'source.recipe-b@2026-01-01-01', '2026-01-18');

  // ============================================================================
  // Factory Method Tests
  // ============================================================================

  describe('create', () => {
    test('creates empty library with no params', () => {
      expect(JournalLibrary.create()).toSucceedAndSatisfy((lib) => {
        expect(lib.size).toBe(0);
        expect(lib.getAllJournals()).toHaveLength(0);
      });
    });

    test('creates library with initial journals', () => {
      expect(JournalLibrary.create({ journals: [journal1, journal2] })).toSucceedAndSatisfy((lib) => {
        expect(lib.size).toBe(2);
        expect(lib.getAllJournals()).toHaveLength(2);
      });
    });

    test('creates library with empty journals array', () => {
      expect(JournalLibrary.create({ journals: [] })).toSucceedAndSatisfy((lib) => {
        expect(lib.size).toBe(0);
      });
    });
  });

  // ============================================================================
  // getJournal Tests
  // ============================================================================

  describe('getJournal', () => {
    test('returns journal when found', () => {
      const lib = JournalLibrary.create({ journals: [journal1, journal2] }).orThrow();
      expect(lib.getJournal('2026-01-15-100000-00000001' as JournalId)).toSucceedAndSatisfy((result) => {
        expect(result.journalId).toBe('2026-01-15-100000-00000001');
        expect(result.recipeVersionId).toBe('source.recipe-a@2026-01-01-01');
      });
    });

    test('fails when journal not found', () => {
      const lib = JournalLibrary.create({ journals: [journal1] }).orThrow();
      expect(lib.getJournal('non-existent' as JournalId)).toFailWith(/not found/);
    });
  });

  // ============================================================================
  // getJournalsForRecipe Tests
  // ============================================================================

  describe('getJournalsForRecipe', () => {
    test('returns all journals for a recipe', () => {
      const lib = JournalLibrary.create({
        journals: [journal1, journal2, journal3, journal4]
      }).orThrow();

      const result = lib.getJournalsForRecipe(
        'source.recipe-a' as import('../../../packlets/common').RecipeId
      );
      expect(result).toHaveLength(3);
      expect(result.map((j) => j.journalId)).toEqual(
        expect.arrayContaining([
          '2026-01-15-100000-00000001',
          '2026-01-15-100000-00000002',
          '2026-01-15-100000-00000003'
        ])
      );
    });

    test('returns empty array when no journals for recipe', () => {
      const lib = JournalLibrary.create({ journals: [journal1] }).orThrow();
      const result = lib.getJournalsForRecipe(
        'source.non-existent' as import('../../../packlets/common').RecipeId
      );
      expect(result).toHaveLength(0);
    });
  });

  // ============================================================================
  // getJournalsForVersion Tests
  // ============================================================================

  describe('getJournalsForVersion', () => {
    test('returns journals for specific version', () => {
      const lib = JournalLibrary.create({
        journals: [journal1, journal2, journal3, journal4]
      }).orThrow();

      const result = lib.getJournalsForVersion('source.recipe-a@2026-01-01-01' as RecipeVersionId);
      expect(result).toHaveLength(2);
      expect(result.map((j) => j.journalId)).toEqual(
        expect.arrayContaining(['2026-01-15-100000-00000001', '2026-01-15-100000-00000002'])
      );
    });

    test('returns empty array when no journals for version', () => {
      const lib = JournalLibrary.create({ journals: [journal1] }).orThrow();
      const result = lib.getJournalsForVersion('source.recipe-a@2026-12-31-99' as RecipeVersionId);
      expect(result).toHaveLength(0);
    });
  });

  // ============================================================================
  // getAllJournals Tests
  // ============================================================================

  describe('getAllJournals', () => {
    test('returns all journals', () => {
      const lib = JournalLibrary.create({
        journals: [journal1, journal2, journal3]
      }).orThrow();

      const result = lib.getAllJournals();
      expect(result).toHaveLength(3);
    });

    test('returns empty array for empty library', () => {
      const lib = JournalLibrary.create().orThrow();
      expect(lib.getAllJournals()).toHaveLength(0);
    });
  });

  // ============================================================================
  // addJournal Tests
  // ============================================================================

  describe('addJournal', () => {
    test('adds valid journal', () => {
      const lib = JournalLibrary.create().orThrow();
      expect(lib.addJournal(journal1)).toSucceedWith('2026-01-15-100000-00000001' as JournalId);
      expect(lib.size).toBe(1);
      expect(lib.getJournal('2026-01-15-100000-00000001' as JournalId)).toSucceed();
    });

    test('indexes journal by recipe ID', () => {
      const lib = JournalLibrary.create().orThrow();
      lib.addJournal(journal1).orThrow();
      lib.addJournal(journal3).orThrow();

      const result = lib.getJournalsForRecipe(
        'source.recipe-a' as import('../../../packlets/common').RecipeId
      );
      expect(result).toHaveLength(2);
    });

    test('indexes journal by version ID', () => {
      const lib = JournalLibrary.create().orThrow();
      lib.addJournal(journal1).orThrow();
      lib.addJournal(journal2).orThrow();

      const result = lib.getJournalsForVersion('source.recipe-a@2026-01-01-01' as RecipeVersionId);
      expect(result).toHaveLength(2);
    });

    test('fails when journal already exists', () => {
      const lib = JournalLibrary.create({ journals: [journal1] }).orThrow();
      expect(lib.addJournal(journal1)).toFailWith(/already exists/);
    });

    test('fails for invalid journal (empty ID)', () => {
      const lib = JournalLibrary.create().orThrow();
      const invalidJournal = {
        ...journal1,
        journalId: '' as JournalId
      };
      expect(lib.addJournal(invalidJournal)).toFail();
    });

    test('fails for invalid journal (bad version ID)', () => {
      const lib = JournalLibrary.create().orThrow();
      const invalidJournal = {
        ...journal1,
        recipeVersionId: 'invalid' as RecipeVersionId
      };
      expect(lib.addJournal(invalidJournal)).toFail();
    });
  });

  // ============================================================================
  // removeJournal Tests
  // ============================================================================

  describe('removeJournal', () => {
    test('removes existing journal', () => {
      const lib = JournalLibrary.create({ journals: [journal1, journal2] }).orThrow();
      expect(lib.removeJournal('2026-01-15-100000-00000001' as JournalId)).toSucceedAndSatisfy((removed) => {
        expect(removed.journalId).toBe('2026-01-15-100000-00000001');
      });
      expect(lib.size).toBe(1);
      expect(lib.getJournal('2026-01-15-100000-00000001' as JournalId)).toFail();
    });

    test('removes journal from recipe index', () => {
      const lib = JournalLibrary.create({ journals: [journal1, journal2] }).orThrow();
      lib.removeJournal('2026-01-15-100000-00000001' as JournalId).orThrow();

      const result = lib.getJournalsForRecipe(
        'source.recipe-a' as import('../../../packlets/common').RecipeId
      );
      expect(result).toHaveLength(1);
      expect(result[0].journalId).toBe('2026-01-15-100000-00000002');
    });

    test('removes journal from version index', () => {
      const lib = JournalLibrary.create({ journals: [journal1, journal2] }).orThrow();
      lib.removeJournal('2026-01-15-100000-00000001' as JournalId).orThrow();

      const result = lib.getJournalsForVersion('source.recipe-a@2026-01-01-01' as RecipeVersionId);
      expect(result).toHaveLength(1);
      expect(result[0].journalId).toBe('2026-01-15-100000-00000002');
    });

    test('cleans up empty recipe index entry', () => {
      const lib = JournalLibrary.create({ journals: [journal4] }).orThrow();
      lib.removeJournal('journal-004' as JournalId).orThrow();

      // Verify no journals for that recipe
      const result = lib.getJournalsForRecipe(
        'source.recipe-b' as import('../../../packlets/common').RecipeId
      );
      expect(result).toHaveLength(0);
    });

    test('cleans up empty version index entry', () => {
      const lib = JournalLibrary.create({ journals: [journal4] }).orThrow();
      lib.removeJournal('journal-004' as JournalId).orThrow();

      // Verify no journals for that version
      const result = lib.getJournalsForVersion('source.recipe-b@2026-01-01-01' as RecipeVersionId);
      expect(result).toHaveLength(0);
    });

    test('fails when journal not found', () => {
      const lib = JournalLibrary.create().orThrow();
      expect(lib.removeJournal('non-existent' as JournalId)).toFailWith(/not found/);
    });
  });

  // ============================================================================
  // Import/Export Tests
  // ============================================================================

  describe('importJournals', () => {
    test('imports valid journals', () => {
      const lib = JournalLibrary.create().orThrow();
      expect(lib.importJournals([journal1, journal2])).toSucceedAndSatisfy((result) => {
        expect(result.imported).toBe(2);
        expect(result.skipped).toBe(0);
        expect(result.skippedIds).toHaveLength(0);
      });
      expect(lib.size).toBe(2);
    });

    test('skips existing journals', () => {
      const lib = JournalLibrary.create({ journals: [journal1] }).orThrow();
      expect(lib.importJournals([journal1, journal2])).toSucceedAndSatisfy((result) => {
        expect(result.imported).toBe(1);
        expect(result.skipped).toBe(1);
        expect(result.skippedIds).toContain(journal1.journalId);
      });
      expect(lib.size).toBe(2);
    });

    test('fails for invalid journal data', () => {
      const lib = JournalLibrary.create().orThrow();
      const invalidData = [{ invalid: 'data' }];
      expect(lib.importJournals(invalidData)).toFail();
    });

    test('imports empty array successfully', () => {
      const lib = JournalLibrary.create().orThrow();
      expect(lib.importJournals([])).toSucceedAndSatisfy((result) => {
        expect(result.imported).toBe(0);
        expect(result.skipped).toBe(0);
      });
    });
  });

  describe('exportJournals', () => {
    test('exports all journals', () => {
      const lib = JournalLibrary.create({ journals: [journal1, journal2, journal3] }).orThrow();
      const exported = lib.exportJournals();
      expect(exported).toHaveLength(3);
      expect(exported.map((j) => j.journalId)).toContain(journal1.journalId);
      expect(exported.map((j) => j.journalId)).toContain(journal2.journalId);
      expect(exported.map((j) => j.journalId)).toContain(journal3.journalId);
    });

    test('exports empty array for empty library', () => {
      const lib = JournalLibrary.create().orThrow();
      const exported = lib.exportJournals();
      expect(exported).toHaveLength(0);
    });
  });

  describe('hasJournal', () => {
    test('returns true for existing journal', () => {
      const lib = JournalLibrary.create({ journals: [journal1] }).orThrow();
      expect(lib.hasJournal(journal1.journalId)).toBe(true);
    });

    test('returns false for non-existing journal', () => {
      const lib = JournalLibrary.create().orThrow();
      expect(lib.hasJournal('non-existent' as JournalId)).toBe(false);
    });
  });

  describe('clear', () => {
    test('removes all journals', () => {
      const lib = JournalLibrary.create({ journals: [journal1, journal2, journal3] }).orThrow();
      expect(lib.size).toBe(3);
      lib.clear();
      expect(lib.size).toBe(0);
      expect(lib.getAllJournals()).toHaveLength(0);
    });

    test('clears recipe index', () => {
      const lib = JournalLibrary.create({ journals: [journal1, journal2] }).orThrow();
      lib.clear();
      const result = lib.getJournalsForRecipe(
        'source.recipe-a' as import('../../../packlets/common').RecipeId
      );
      expect(result).toHaveLength(0);
    });

    test('clears version index', () => {
      const lib = JournalLibrary.create({ journals: [journal1, journal2] }).orThrow();
      lib.clear();
      const result = lib.getJournalsForVersion('source.recipe-a@2026-01-01-01' as RecipeVersionId);
      expect(result).toHaveLength(0);
    });

    test('allows adding journals after clear', () => {
      const lib = JournalLibrary.create({ journals: [journal1] }).orThrow();
      lib.clear();
      expect(lib.addJournal(journal1)).toSucceed();
      expect(lib.size).toBe(1);
    });
  });

  // ============================================================================
  // Edge Cases
  // ============================================================================

  describe('edge cases', () => {
    test('handles journal with notes and entries', () => {
      const journalWithDetails: IJournalRecord = {
        journalId: '2026-01-15-100000-0000000a' as JournalId,
        recipeVersionId: 'source.recipe@2026-01-01-01' as RecipeVersionId,
        date: '2026-01-20',
        targetWeight: 500 as Grams,
        scaleFactor: 2.5,
        notes: 'Test notes',
        modifiedVersionId: 'source.recipe@2026-01-20-01' as RecipeVersionId,
        entries: [
          {
            timestamp: '2026-01-20T10:00:00Z',
            eventType: 'note',
            text: 'Starting session'
          }
        ]
      };

      const lib = JournalLibrary.create().orThrow();
      expect(lib.addJournal(journalWithDetails)).toSucceed();
      expect(lib.getJournal('2026-01-15-100000-0000000a' as JournalId)).toSucceedAndSatisfy((result) => {
        expect(result.notes).toBe('Test notes');
        expect(result.modifiedVersionId).toBe('source.recipe@2026-01-20-01');
        expect(result.entries).toHaveLength(1);
      });
    });

    test('handles multiple recipes and versions', () => {
      const journals = [
        makeJournal('j1', 'source.recipe-a@2026-01-01-01', '2026-01-01'),
        makeJournal('j2', 'source.recipe-a@2026-01-01-02', '2026-01-02'),
        makeJournal('j3', 'source.recipe-b@2026-01-01-01', '2026-01-03'),
        makeJournal('j4', 'other.recipe-c@2026-01-01-01', '2026-01-04')
      ];

      const lib = JournalLibrary.create({ journals }).orThrow();

      // Recipe A has 2 journals
      expect(
        lib.getJournalsForRecipe('source.recipe-a' as import('../../../packlets/common').RecipeId)
      ).toHaveLength(2);

      // Recipe B has 1 journal
      expect(
        lib.getJournalsForRecipe('source.recipe-b' as import('../../../packlets/common').RecipeId)
      ).toHaveLength(1);

      // Other source recipe has 1 journal
      expect(
        lib.getJournalsForRecipe('other.recipe-c' as import('../../../packlets/common').RecipeId)
      ).toHaveLength(1);
    });
  });
});
