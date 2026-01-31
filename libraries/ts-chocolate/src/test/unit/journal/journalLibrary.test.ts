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
  JournalLibrary,
  IFillingEditJournalEntry,
  IFillingProductionJournalEntry,
  IConfectionEditJournalEntry,
  IConfectionProductionJournalEntry,
  isFillingJournalEntry,
  isConfectionJournalEntry,
  IFillingRecipeVersion,
  IMoldedBonBonVersion,
  IProducedFilling,
  IProducedMoldedBonBon
} from '../../../packlets/entities';
import {
  ConfectionId,
  ConfectionVersionId,
  Measurement,
  JournalId,
  FillingVersionId,
  FillingVersionSpec,
  FillingId,
  ConfectionVersionSpec,
  IngredientId,
  MoldId,
  SlotId,
  NoteCategory
} from '../../../packlets/common';

describe('JournalLibrary', () => {
  // ============================================================================
  // Test Data - Filling Recipes
  // ============================================================================

  const makeFillingRecipe = (versionSpec: string, baseWeight: number = 300): IFillingRecipeVersion => ({
    versionSpec: versionSpec as FillingVersionSpec,
    createdDate: '2026-01-01',
    ingredients: [
      {
        ingredient: {
          ids: ['chocolate.dark' as IngredientId],
          preferredId: 'chocolate.dark' as IngredientId
        },
        amount: 200 as Measurement
      },
      {
        ingredient: {
          ids: ['cream.heavy' as IngredientId],
          preferredId: 'cream.heavy' as IngredientId
        },
        amount: 100 as Measurement
      }
    ],
    baseWeight: baseWeight as Measurement
  });

  const makeProducedFilling = (versionId: string, scaleFactor: number = 2): IProducedFilling => ({
    versionId: versionId as FillingVersionId,
    scaleFactor,
    targetWeight: 600 as Measurement,
    ingredients: [
      {
        ingredientId: 'chocolate.dark' as IngredientId,
        amount: (200 * scaleFactor) as Measurement
      },
      {
        ingredientId: 'cream.heavy' as IngredientId,
        amount: (100 * scaleFactor) as Measurement
      }
    ]
  });

  const makeFillingEditJournal = (
    id: string,
    versionId: string,
    timestamp: string = '2026-01-15T10:00:00Z'
  ): IFillingEditJournalEntry => ({
    type: 'filling-edit',
    id: id as JournalId,
    timestamp,
    versionId: versionId as FillingVersionId,
    recipe: makeFillingRecipe('2026-01-01-01')
  });

  const makeFillingProductionJournal = (
    id: string,
    versionId: string,
    timestamp: string = '2026-01-15T10:00:00Z',
    yieldWeight: number = 600
  ): IFillingProductionJournalEntry => ({
    type: 'filling-production',
    id: id as JournalId,
    timestamp,
    versionId: versionId as FillingVersionId,
    recipe: makeFillingRecipe('2026-01-01-01'),
    yield: yieldWeight as Measurement,
    produced: makeProducedFilling(versionId, 2)
  });

  const journal1 = makeFillingProductionJournal(
    '2026-01-15-100000-00000001',
    'source.recipe-a@2026-01-01-01',
    '2026-01-15T10:00:00Z'
  );
  const journal2 = makeFillingProductionJournal(
    '2026-01-15-100000-00000002',
    'source.recipe-a@2026-01-01-01',
    '2026-01-16T10:00:00Z'
  );
  const journal3 = makeFillingProductionJournal(
    '2026-01-15-100000-00000003',
    'source.recipe-a@2026-01-02-01',
    '2026-01-17T10:00:00Z'
  );
  const journal4 = makeFillingProductionJournal(
    '2026-01-15-100000-00000004',
    'source.recipe-b@2026-01-01-01',
    '2026-01-18T10:00:00Z'
  );

  // ============================================================================
  // Test Data - Confection Recipes
  // ============================================================================

  const makeConfectionRecipe = (versionSpec: string): IMoldedBonBonVersion => ({
    versionSpec: versionSpec as ConfectionVersionSpec,
    createdDate: '2026-01-01',
    yield: { count: 24 },
    molds: {
      options: [
        {
          id: 'mold.standard-24' as MoldId
        }
      ],
      preferredId: 'mold.standard-24' as MoldId
    },
    shellChocolate: {
      ids: ['chocolate.dark' as IngredientId],
      preferredId: 'chocolate.dark' as IngredientId
    },
    fillings: [
      {
        slotId: 'slot-1' as SlotId,
        filling: {
          options: [
            {
              type: 'recipe',
              id: 'source.recipe-a' as FillingId
            }
          ],
          preferredId: 'source.recipe-a' as FillingId
        }
      }
    ]
  });

  const makeProducedConfection = (versionId: string, yieldCount: number = 24): IProducedMoldedBonBon => ({
    confectionType: 'molded-bonbon',
    versionId: versionId as ConfectionVersionId,
    yield: { count: yieldCount },
    moldId: 'mold.standard-24' as MoldId,
    shellChocolateId: 'chocolate.dark' as IngredientId,
    fillings: [
      {
        slotType: 'recipe',
        slotId: 'slot-1' as SlotId,
        fillingId: 'source.recipe-a' as FillingId
      }
    ]
  });

  const makeConfectionEditJournal = (
    id: string,
    versionId: string,
    timestamp: string = '2026-01-20T10:00:00Z'
  ): IConfectionEditJournalEntry => ({
    type: 'confection-edit',
    id: id as JournalId,
    timestamp,
    versionId: versionId as ConfectionVersionId,
    recipe: makeConfectionRecipe('2026-01-01-01')
  });

  const makeConfectionProductionJournal = (
    id: string,
    versionId: string,
    timestamp: string = '2026-01-20T10:00:00Z',
    yieldCount: number = 24
  ): IConfectionProductionJournalEntry => ({
    type: 'confection-production',
    id: id as JournalId,
    timestamp,
    versionId: versionId as ConfectionVersionId,
    recipe: makeConfectionRecipe('2026-01-01-01'),
    yield: { count: yieldCount },
    produced: makeProducedConfection(versionId, yieldCount)
  });

  const confectionJournal1 = makeConfectionProductionJournal(
    '2026-01-20-100000-c0000001',
    'source.bonbon-a@2026-01-01-01',
    '2026-01-20T10:00:00Z'
  );
  const confectionJournal2 = makeConfectionProductionJournal(
    '2026-01-21-100000-c0000002',
    'source.bonbon-a@2026-01-01-01',
    '2026-01-21T10:00:00Z'
  );
  const confectionJournal3 = makeConfectionProductionJournal(
    '2026-01-22-100000-c0000003',
    'source.bonbon-a@2026-01-02-01',
    '2026-01-22T10:00:00Z'
  );
  const confectionJournal4 = makeConfectionProductionJournal(
    '2026-01-23-100000-c0000004',
    'source.bonbon-b@2026-01-01-01',
    '2026-01-23T10:00:00Z'
  );

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
        expect(result.id).toBe('2026-01-15-100000-00000001');
        expect(isFillingJournalEntry(result)).toBe(true);
        if (isFillingJournalEntry(result)) {
          expect(result.versionId).toBe('source.recipe-a@2026-01-01-01');
        }
      });
    });

    test('fails when journal not found', () => {
      const lib = JournalLibrary.create({ journals: [journal1] }).orThrow();
      expect(lib.getJournal('non-existent' as JournalId)).toFailWith(/not found/);
    });
  });

  // ============================================================================
  // getJournalsForFilling Tests
  // ============================================================================

  describe('getJournalsForFilling', () => {
    test('returns all journals for a filling', () => {
      const lib = JournalLibrary.create({
        journals: [journal1, journal2, journal3, journal4]
      }).orThrow();

      const result = lib.getJournalsForFilling('source.recipe-a' as FillingId);
      expect(result).toHaveLength(3);
      expect(result.map((j) => j.id)).toEqual(
        expect.arrayContaining([
          '2026-01-15-100000-00000001',
          '2026-01-15-100000-00000002',
          '2026-01-15-100000-00000003'
        ])
      );
    });

    test('returns empty array when no journals for filling', () => {
      const lib = JournalLibrary.create({ journals: [journal1] }).orThrow();
      const result = lib.getJournalsForFilling('source.non-existent' as FillingId);
      expect(result).toHaveLength(0);
    });
  });

  // ============================================================================
  // getJournalsForFillingVersion Tests
  // ============================================================================

  describe('getJournalsForFillingVersion', () => {
    test('returns journals for specific version', () => {
      const lib = JournalLibrary.create({
        journals: [journal1, journal2, journal3, journal4]
      }).orThrow();

      const result = lib.getJournalsForFillingVersion('source.recipe-a@2026-01-01-01' as FillingVersionId);
      expect(result).toHaveLength(2);
      expect(result.map((j) => j.id)).toEqual(
        expect.arrayContaining(['2026-01-15-100000-00000001', '2026-01-15-100000-00000002'])
      );
    });

    test('returns empty array when no journals for version', () => {
      const lib = JournalLibrary.create({ journals: [journal1] }).orThrow();
      const result = lib.getJournalsForFillingVersion('source.recipe-a@2026-12-31-99' as FillingVersionId);
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

    test('indexes journal by filling ID', () => {
      const lib = JournalLibrary.create().orThrow();
      lib.addJournal(journal1).orThrow();
      lib.addJournal(journal3).orThrow();

      const result = lib.getJournalsForFilling('source.recipe-a' as FillingId);
      expect(result).toHaveLength(2);
    });

    test('indexes journal by version ID', () => {
      const lib = JournalLibrary.create().orThrow();
      lib.addJournal(journal1).orThrow();
      lib.addJournal(journal2).orThrow();

      const result = lib.getJournalsForFillingVersion('source.recipe-a@2026-01-01-01' as FillingVersionId);
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
        id: '' as JournalId
      };
      expect(lib.addJournal(invalidJournal)).toFail();
    });

    test('fails for invalid journal (bad version ID)', () => {
      const lib = JournalLibrary.create().orThrow();
      const invalidJournal = {
        ...journal1,
        versionId: 'invalid' as FillingVersionId
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
        expect(removed.id).toBe('2026-01-15-100000-00000001');
      });
      expect(lib.size).toBe(1);
      expect(lib.getJournal('2026-01-15-100000-00000001' as JournalId)).toFail();
    });

    test('removes journal from filling index', () => {
      const lib = JournalLibrary.create({ journals: [journal1, journal2] }).orThrow();
      lib.removeJournal('2026-01-15-100000-00000001' as JournalId).orThrow();

      const result = lib.getJournalsForFilling('source.recipe-a' as FillingId);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('2026-01-15-100000-00000002');
    });

    test('removes journal from version index', () => {
      const lib = JournalLibrary.create({ journals: [journal1, journal2] }).orThrow();
      lib.removeJournal('2026-01-15-100000-00000001' as JournalId).orThrow();

      const result = lib.getJournalsForFillingVersion('source.recipe-a@2026-01-01-01' as FillingVersionId);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('2026-01-15-100000-00000002');
    });

    test('cleans up empty filling index entry', () => {
      const lib = JournalLibrary.create({ journals: [journal4] }).orThrow();
      lib.removeJournal('2026-01-15-100000-00000004' as JournalId).orThrow();

      const result = lib.getJournalsForFilling('source.recipe-b' as FillingId);
      expect(result).toHaveLength(0);
    });

    test('cleans up empty version index entry', () => {
      const lib = JournalLibrary.create({ journals: [journal4] }).orThrow();
      lib.removeJournal('2026-01-15-100000-00000004' as JournalId).orThrow();

      const result = lib.getJournalsForFillingVersion('source.recipe-b@2026-01-01-01' as FillingVersionId);
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
        expect(result.skippedIds).toContain(journal1.id);
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
      expect(exported.map((j) => j.id)).toContain(journal1.id);
      expect(exported.map((j) => j.id)).toContain(journal2.id);
      expect(exported.map((j) => j.id)).toContain(journal3.id);
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
      expect(lib.hasJournal(journal1.id)).toBe(true);
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

    test('clears filling index', () => {
      const lib = JournalLibrary.create({ journals: [journal1, journal2] }).orThrow();
      lib.clear();
      const result = lib.getJournalsForFilling('source.recipe-a' as FillingId);
      expect(result).toHaveLength(0);
    });

    test('clears version index', () => {
      const lib = JournalLibrary.create({ journals: [journal1, journal2] }).orThrow();
      lib.clear();
      const result = lib.getJournalsForFillingVersion('source.recipe-a@2026-01-01-01' as FillingVersionId);
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
    test('handles journal with optional fields', () => {
      const journalWithDetails: IFillingProductionJournalEntry = {
        type: 'filling-production',
        id: '2026-01-15-100000-0000000a' as JournalId,
        timestamp: '2026-01-20T10:00:00Z',
        versionId: 'source.recipe@2026-01-01-01' as FillingVersionId,
        recipe: makeFillingRecipe('2026-01-01-01'),
        yield: 500 as Measurement,
        produced: makeProducedFilling('source.recipe@2026-01-01-01', 2.5),
        notes: [
          {
            category: 'general' as NoteCategory,
            note: 'Test notes'
          }
        ],
        updatedId: 'source.recipe@2026-01-20-01' as FillingVersionId,
        updated: makeFillingRecipe('2026-01-20-01', 350)
      };

      const lib = JournalLibrary.create().orThrow();
      expect(lib.addJournal(journalWithDetails)).toSucceed();
      expect(lib.getJournal('2026-01-15-100000-0000000a' as JournalId)).toSucceedAndSatisfy((result) => {
        expect(result.notes).toHaveLength(1);
        expect(result.updatedId).toBe('source.recipe@2026-01-20-01');
        if (result.type === 'filling-production') {
          expect(result.yield).toBe(500);
          expect(result.produced.scaleFactor).toBe(2.5);
        }
      });
    });

    test('handles multiple fillings and versions', () => {
      const journals = [
        makeFillingProductionJournal('j1', 'source.recipe-a@2026-01-01-01', '2026-01-01T10:00:00Z'),
        makeFillingProductionJournal('j2', 'source.recipe-a@2026-01-01-02', '2026-01-02T10:00:00Z'),
        makeFillingProductionJournal('j3', 'source.recipe-b@2026-01-01-01', '2026-01-03T10:00:00Z'),
        makeFillingProductionJournal('j4', 'other.recipe-c@2026-01-01-01', '2026-01-04T10:00:00Z')
      ];

      const lib = JournalLibrary.create({ journals }).orThrow();

      expect(lib.getJournalsForFilling('source.recipe-a' as FillingId)).toHaveLength(2);
      expect(lib.getJournalsForFilling('source.recipe-b' as FillingId)).toHaveLength(1);
      expect(lib.getJournalsForFilling('other.recipe-c' as FillingId)).toHaveLength(1);
    });
  });

  // ============================================================================
  // Confection Journal Tests
  // ============================================================================

  describe('confection journals', () => {
    describe('create with confection journals', () => {
      test('creates library with initial confection journals', () => {
        expect(
          JournalLibrary.create({ journals: [confectionJournal1, confectionJournal2] })
        ).toSucceedAndSatisfy((lib) => {
          expect(lib.size).toBe(2);
          expect(lib.getAllJournals()).toHaveLength(2);
        });
      });

      test('creates library with mixed journal types', () => {
        expect(JournalLibrary.create({ journals: [journal1, confectionJournal1] })).toSucceedAndSatisfy(
          (lib) => {
            expect(lib.size).toBe(2);
          }
        );
      });
    });

    describe('getJournal with confection journals', () => {
      test('returns confection journal when found', () => {
        const lib = JournalLibrary.create({ journals: [confectionJournal1] }).orThrow();
        expect(lib.getJournal('2026-01-20-100000-c0000001' as JournalId)).toSucceedAndSatisfy((result) => {
          expect(result.id).toBe('2026-01-20-100000-c0000001');
          expect(isConfectionJournalEntry(result)).toBe(true);
          if (isConfectionJournalEntry(result)) {
            expect(result.versionId).toBe('source.bonbon-a@2026-01-01-01');
          }
        });
      });
    });

    describe('getJournalsForConfection', () => {
      test('returns all journals for a confection', () => {
        const lib = JournalLibrary.create({
          journals: [confectionJournal1, confectionJournal2, confectionJournal3, confectionJournal4]
        }).orThrow();

        const result = lib.getJournalsForConfection('source.bonbon-a' as ConfectionId);
        expect(result).toHaveLength(3);
        expect(result.map((j) => j.id)).toEqual(
          expect.arrayContaining([
            '2026-01-20-100000-c0000001',
            '2026-01-21-100000-c0000002',
            '2026-01-22-100000-c0000003'
          ])
        );
      });

      test('returns empty array when no journals for confection', () => {
        const lib = JournalLibrary.create({ journals: [confectionJournal1] }).orThrow();
        const result = lib.getJournalsForConfection('source.non-existent' as ConfectionId);
        expect(result).toHaveLength(0);
      });

      test('does not return filling journals for confection lookup', () => {
        const lib = JournalLibrary.create({ journals: [journal1, confectionJournal1] }).orThrow();
        const result = lib.getJournalsForConfection('source.bonbon-a' as ConfectionId);
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('2026-01-20-100000-c0000001');
      });
    });

    describe('getJournalsForConfectionVersion', () => {
      test('returns journals for specific confection version', () => {
        const lib = JournalLibrary.create({
          journals: [confectionJournal1, confectionJournal2, confectionJournal3, confectionJournal4]
        }).orThrow();

        const result = lib.getJournalsForConfectionVersion(
          'source.bonbon-a@2026-01-01-01' as ConfectionVersionId
        );
        expect(result).toHaveLength(2);
        expect(result.map((j) => j.id)).toEqual(
          expect.arrayContaining(['2026-01-20-100000-c0000001', '2026-01-21-100000-c0000002'])
        );
      });

      test('returns empty array when no journals for version', () => {
        const lib = JournalLibrary.create({ journals: [confectionJournal1] }).orThrow();
        const result = lib.getJournalsForConfectionVersion(
          'source.bonbon-a@2026-12-31-99' as ConfectionVersionId
        );
        expect(result).toHaveLength(0);
      });
    });

    describe('addJournal with confection journals', () => {
      test('adds valid confection journal', () => {
        const lib = JournalLibrary.create().orThrow();
        expect(lib.addJournal(confectionJournal1)).toSucceedWith('2026-01-20-100000-c0000001' as JournalId);
        expect(lib.size).toBe(1);
        expect(lib.getJournal('2026-01-20-100000-c0000001' as JournalId)).toSucceed();
      });

      test('indexes confection journal by confection ID', () => {
        const lib = JournalLibrary.create().orThrow();
        lib.addJournal(confectionJournal1).orThrow();
        lib.addJournal(confectionJournal3).orThrow();

        const result = lib.getJournalsForConfection('source.bonbon-a' as ConfectionId);
        expect(result).toHaveLength(2);
      });

      test('indexes confection journal by version ID', () => {
        const lib = JournalLibrary.create().orThrow();
        lib.addJournal(confectionJournal1).orThrow();
        lib.addJournal(confectionJournal2).orThrow();

        const result = lib.getJournalsForConfectionVersion(
          'source.bonbon-a@2026-01-01-01' as ConfectionVersionId
        );
        expect(result).toHaveLength(2);
      });

      test('fails when confection journal already exists', () => {
        const lib = JournalLibrary.create({ journals: [confectionJournal1] }).orThrow();
        expect(lib.addJournal(confectionJournal1)).toFailWith(/already exists/);
      });
    });

    describe('removeJournal with confection journals', () => {
      test('removes existing confection journal', () => {
        const lib = JournalLibrary.create({
          journals: [confectionJournal1, confectionJournal2]
        }).orThrow();
        expect(lib.removeJournal('2026-01-20-100000-c0000001' as JournalId)).toSucceedAndSatisfy(
          (removed) => {
            expect(removed.id).toBe('2026-01-20-100000-c0000001');
          }
        );
        expect(lib.size).toBe(1);
        expect(lib.getJournal('2026-01-20-100000-c0000001' as JournalId)).toFail();
      });

      test('removes confection journal from confection index', () => {
        const lib = JournalLibrary.create({
          journals: [confectionJournal1, confectionJournal2]
        }).orThrow();
        lib.removeJournal('2026-01-20-100000-c0000001' as JournalId).orThrow();

        const result = lib.getJournalsForConfection('source.bonbon-a' as ConfectionId);
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('2026-01-21-100000-c0000002');
      });

      test('removes confection journal from version index', () => {
        const lib = JournalLibrary.create({
          journals: [confectionJournal1, confectionJournal2]
        }).orThrow();
        lib.removeJournal('2026-01-20-100000-c0000001' as JournalId).orThrow();

        const result = lib.getJournalsForConfectionVersion(
          'source.bonbon-a@2026-01-01-01' as ConfectionVersionId
        );
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('2026-01-21-100000-c0000002');
      });

      test('cleans up empty confection index entry', () => {
        const lib = JournalLibrary.create({ journals: [confectionJournal4] }).orThrow();
        lib.removeJournal('2026-01-23-100000-c0000004' as JournalId).orThrow();

        const result = lib.getJournalsForConfection('source.bonbon-b' as ConfectionId);
        expect(result).toHaveLength(0);
      });

      test('cleans up empty confection version index entry', () => {
        const lib = JournalLibrary.create({ journals: [confectionJournal4] }).orThrow();
        lib.removeJournal('2026-01-23-100000-c0000004' as JournalId).orThrow();

        const result = lib.getJournalsForConfectionVersion(
          'source.bonbon-b@2026-01-01-01' as ConfectionVersionId
        );
        expect(result).toHaveLength(0);
      });
    });

    describe('importJournals with confection journals', () => {
      test('imports confection journals', () => {
        const lib = JournalLibrary.create().orThrow();
        expect(lib.importJournals([confectionJournal1, confectionJournal2])).toSucceedAndSatisfy((result) => {
          expect(result.imported).toBe(2);
          expect(result.skipped).toBe(0);
        });
        expect(lib.size).toBe(2);
      });

      test('imports mixed journal types', () => {
        const lib = JournalLibrary.create().orThrow();
        expect(lib.importJournals([journal1, confectionJournal1])).toSucceedAndSatisfy((result) => {
          expect(result.imported).toBe(2);
        });
        expect(lib.size).toBe(2);
      });

      test('skips existing confection journals', () => {
        const lib = JournalLibrary.create({ journals: [confectionJournal1] }).orThrow();
        expect(lib.importJournals([confectionJournal1, confectionJournal2])).toSucceedAndSatisfy((result) => {
          expect(result.imported).toBe(1);
          expect(result.skipped).toBe(1);
          expect(result.skippedIds).toContain(confectionJournal1.id);
        });
      });
    });

    describe('clear with confection journals', () => {
      test('clears confection indices', () => {
        const lib = JournalLibrary.create({
          journals: [confectionJournal1, confectionJournal2]
        }).orThrow();
        lib.clear();
        expect(lib.getJournalsForConfection('source.bonbon-a' as ConfectionId)).toHaveLength(0);
        expect(
          lib.getJournalsForConfectionVersion('source.bonbon-a@2026-01-01-01' as ConfectionVersionId)
        ).toHaveLength(0);
      });
    });

    describe('confection journal with all optional fields', () => {
      test('handles confection journal with all optional fields', () => {
        const fullJournal: IConfectionProductionJournalEntry = {
          type: 'confection-production',
          id: '2026-01-25-100000-cf000001' as JournalId,
          timestamp: '2026-01-25T10:00:00Z',
          versionId: 'source.bonbon-a@2026-01-01-01' as ConfectionVersionId,
          recipe: makeConfectionRecipe('2026-01-01-01'),
          yield: { count: 48 },
          produced: makeProducedConfection('source.bonbon-a@2026-01-01-01', 48),
          notes: [
            {
              category: 'general' as NoteCategory,
              note: 'Test notes for confection'
            }
          ],
          updatedId: 'source.bonbon-a@2026-01-02-01' as ConfectionVersionId,
          updated: makeConfectionRecipe('2026-01-02-01')
        };

        const lib = JournalLibrary.create().orThrow();
        expect(lib.addJournal(fullJournal)).toSucceed();
        expect(lib.getJournal('2026-01-25-100000-cf000001' as JournalId)).toSucceedAndSatisfy((result) => {
          expect(isConfectionJournalEntry(result)).toBe(true);
          if (result.type === 'confection-production') {
            expect(result.yield.count).toBe(48);
            expect(result.produced.yield.count).toBe(48);
            expect(result.notes).toHaveLength(1);
            expect(result.updatedId).toBe('source.bonbon-a@2026-01-02-01');
          }
        });
      });
    });
  });

  // ============================================================================
  // Edit Journal Tests
  // ============================================================================

  describe('edit journals', () => {
    test('adds filling edit journal', () => {
      const editJournal = makeFillingEditJournal(
        '2026-01-25-100000-e0000001',
        'source.recipe-a@2026-01-01-01',
        '2026-01-25T10:00:00Z'
      );
      const lib = JournalLibrary.create().orThrow();
      expect(lib.addJournal(editJournal)).toSucceed();
      expect(lib.size).toBe(1);
    });

    test('adds confection edit journal', () => {
      const editJournal = makeConfectionEditJournal(
        '2026-01-25-100000-e0000002',
        'source.bonbon-a@2026-01-01-01',
        '2026-01-25T10:00:00Z'
      );
      const lib = JournalLibrary.create().orThrow();
      expect(lib.addJournal(editJournal)).toSucceed();
      expect(lib.size).toBe(1);
    });

    test('indexes edit journals by filling ID', () => {
      const editJournal = makeFillingEditJournal(
        '2026-01-25-100000-e0000003',
        'source.recipe-a@2026-01-01-01',
        '2026-01-25T10:00:00Z'
      );
      const lib = JournalLibrary.create().orThrow();
      lib.addJournal(editJournal).orThrow();

      const result = lib.getJournalsForFilling('source.recipe-a' as FillingId);
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('filling-edit');
    });

    test('indexes edit journals by confection ID', () => {
      const editJournal = makeConfectionEditJournal(
        '2026-01-25-100000-e0000004',
        'source.bonbon-a@2026-01-01-01',
        '2026-01-25T10:00:00Z'
      );
      const lib = JournalLibrary.create().orThrow();
      lib.addJournal(editJournal).orThrow();

      const result = lib.getJournalsForConfection('source.bonbon-a' as ConfectionId);
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('confection-edit');
    });
  });
});
