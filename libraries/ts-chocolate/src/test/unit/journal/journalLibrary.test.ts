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
import { Logging } from '@fgv/ts-utils';
import { FileTree } from '@fgv/ts-json-base';

// eslint-disable-next-line @rushstack/packlets/mechanics
import {
  isConfectionJournalEntry,
  isFillingJournalEntry,
  JournalLibrary
} from '../../../packlets/entities/journal/library';
import {
  ConfectionId,
  ConfectionRecipeVariationId,
  ConfectionRecipeVariationSpec,
  FillingId,
  FillingRecipeVariationId,
  FillingRecipeVariationSpec,
  IngredientId,
  Measurement,
  MoldId,
  Converters as CommonConverters,
  Helpers as CommonHelpers
} from '../../../packlets/common';
import type {
  AnyJournalEntryEntity,
  IConfectionProductionJournalEntryEntity,
  IFillingProductionJournalEntryEntity
} from '../../../packlets/entities';

describe('JournalLibrary (Collection-Based)', () => {
  // ============================================================================
  // Test Data Helpers
  // ============================================================================

  const makeFillingJournal = (
    baseId: string,
    variationId: string,
    timestamp: string = '2026-01-15T10:00:00Z'
  ): IFillingProductionJournalEntryEntity => ({
    type: 'filling-production',
    baseId: CommonConverters.baseJournalId.convert(baseId).orThrow(),
    timestamp,
    variationId: CommonConverters.fillingRecipeVariationId.convert(variationId).orThrow(),
    recipe: {
      variationSpec: '2026-01-01-01' as FillingRecipeVariationSpec,
      createdDate: '2026-01-01',
      ingredients: [],
      baseWeight: 300 as Measurement
    },
    yield: 600 as Measurement,
    produced: {
      variationId: variationId as FillingRecipeVariationId,
      scaleFactor: 2,
      targetWeight: 600 as Measurement,
      ingredients: []
    }
  });

  const makeConfectionJournal = (
    baseId: string,
    variationId: string,
    timestamp: string = '2026-01-15T10:00:00Z'
  ): IConfectionProductionJournalEntryEntity => ({
    type: 'confection-production',
    baseId: CommonConverters.baseJournalId.convert(baseId).orThrow(),
    timestamp,
    variationId: CommonConverters.confectionRecipeVariationId.convert(variationId).orThrow(),
    recipe: {
      variationSpec: '2026-01-01-01' as ConfectionRecipeVariationSpec,
      createdDate: '2026-01-01',
      yield: {
        count: 24
      },
      fillings: [],
      molds: {
        options: []
      },
      shellChocolate: undefined
    },
    yield: {
      count: 24
    },
    produced: {
      confectionType: 'molded-bonbon',
      variationId: variationId as ConfectionRecipeVariationId,
      yield: {
        count: 24
      },
      fillings: [],
      moldId: 'test.mold-a' as MoldId,
      shellChocolateId: 'test.dark-chocolate' as IngredientId
    }
  });

  const createLibraryWithJournals = (journals: AnyJournalEntryEntity[]): JournalLibrary => {
    // Create in-memory file tree with journal collection
    const items: Record<string, unknown> = {};
    for (const journal of journals) {
      // Use baseId as map key, just like other collection-based entities
      items[journal.baseId] = journal;
    }

    // Wrap in collection format with items field
    const collectionData = { items };

    // Create in-memory file tree accessors with mutable flag
    // Note: JournalLibrary expects data/journals subdirectory structure
    const accessors = FileTree.InMemoryTreeAccessors.create(
      [
        {
          path: '/data/journals/test-collection.json',
          contents: collectionData
        }
      ],
      { mutable: true }
    ).orThrow();

    const fileTree = FileTree.FileTree.create(accessors).orThrow();

    return JournalLibrary.create({
      builtin: false,
      fileSources: [
        {
          directory: fileTree.getDirectory('/').orThrow(),
          mutable: true
        }
      ]
    }).orThrow();
  };

  const createLibraryWithCollections = (
    collections: Array<{ id: string; journals: AnyJournalEntryEntity[] }>
  ): JournalLibrary => {
    // Create in-memory file tree with multiple journal collections
    const files: Array<{ path: string; contents: unknown }> = [];

    for (const collection of collections) {
      const items: Record<string, unknown> = {};
      for (const journal of collection.journals) {
        // Use baseId as map key, just like other collection-based entities
        items[journal.baseId] = journal;
      }

      files.push({
        path: `/data/journals/${collection.id}.json`,
        contents: { items }
      });
    }

    // Create in-memory file tree accessors with mutable flag
    const accessors = FileTree.InMemoryTreeAccessors.create(files, { mutable: true }).orThrow();
    const fileTree = FileTree.FileTree.create(accessors).orThrow();

    return JournalLibrary.create({
      builtin: false,
      fileSources: [
        {
          directory: fileTree.getDirectory('/').orThrow(),
          mutable: true
        }
      ]
    }).orThrow();
  };

  // ============================================================================
  // Type Guard Tests
  // ============================================================================

  describe('type guards', () => {
    test('isFillingJournalEntry identifies filling journals', () => {
      const fillingJournal = makeFillingJournal(
        '2026-01-15-100000-00000001',
        'source.recipe-a@2026-01-01-01'
      );
      expect(isFillingJournalEntry(fillingJournal)).toBe(true);
    });

    test('isConfectionJournalEntry identifies confection journals', () => {
      const confectionJournal = makeConfectionJournal(
        '2026-01-15-100000-00000001',
        'source.recipe-a@2026-01-01-01'
      );
      expect(isConfectionJournalEntry(confectionJournal)).toBe(true);
    });

    test('isFillingJournalEntry rejects confection journals', () => {
      const confectionJournal = makeConfectionJournal(
        '2026-01-15-100000-00000001',
        'source.recipe-a@2026-01-01-01'
      );
      expect(isFillingJournalEntry(confectionJournal)).toBe(false);
    });

    test('isConfectionJournalEntry rejects filling journals', () => {
      const fillingJournal = makeFillingJournal(
        '2026-01-15-100000-00000001',
        'source.recipe-a@2026-01-01-01'
      );
      expect(isConfectionJournalEntry(fillingJournal)).toBe(false);
    });
  });

  // ============================================================================
  // Factory Tests
  // ============================================================================

  describe('create', () => {
    test('creates empty library', () => {
      expect(JournalLibrary.create({ builtin: false })).toSucceedAndSatisfy((lib) => {
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

      const lib = createLibraryWithCollections([
        { id: 'collection-1', journals: [journal1] },
        { id: 'collection-2', journals: [journal2] }
      ]);

      expect(lib.size).toBe(2);
      expect(lib.getAllJournals()).toHaveLength(2);
    });
  });

  describe('createAsync', () => {
    test('creates empty library with builtin: false', async () => {
      const result = await JournalLibrary.createAsync({ builtin: false });
      expect(result).toSucceedAndSatisfy((lib) => {
        expect(lib.size).toBe(0);
        expect(lib.getAllJournals()).toHaveLength(0);
      });
    });

    test('creates library with file sources', async () => {
      const journal1 = makeFillingJournal('2026-01-15-100000-00000001', 'source.recipe-a@2026-01-01-01');
      const journal2 = makeConfectionJournal('2026-01-16-100000-00000002', 'source.recipe-b@2026-01-01-01');

      const items: Record<string, unknown> = {
        [journal1.baseId]: journal1,
        [journal2.baseId]: journal2
      };

      const files: Array<{ path: string; contents: unknown }> = [
        {
          path: '/data/journals/async-test.json',
          contents: { items }
        }
      ];

      const accessors = FileTree.InMemoryTreeAccessors.create(files, { mutable: true }).orThrow();
      const fileTree = FileTree.FileTree.create(accessors).orThrow();

      const result = await JournalLibrary.createAsync({
        builtin: false,
        fileSources: [
          {
            directory: fileTree.getDirectory('/').orThrow(),
            mutable: true
          }
        ]
      });

      expect(result).toSucceedAndSatisfy((lib) => {
        expect(lib.size).toBe(2);
        expect(lib.getAllJournals()).toHaveLength(2);
      });
    });

    test('fails when collection loading fails', async () => {
      // Create a file tree with invalid journal data
      const files: Array<{ path: string; contents: unknown }> = [
        {
          path: '/data/journals/invalid.json',
          contents: {
            items: {
              // eslint-disable-next-line @typescript-eslint/naming-convention
              'invalid-id': {
                type: 'invalid-type',
                baseId: 'not-a-valid-base-id',
                timestamp: 'invalid-timestamp'
              }
            }
          }
        }
      ];

      const accessors = FileTree.InMemoryTreeAccessors.create(files, { mutable: true }).orThrow();
      const fileTree = FileTree.FileTree.create(accessors).orThrow();

      const result = await JournalLibrary.createAsync({
        builtin: false,
        fileSources: [
          {
            directory: fileTree.getDirectory('/').orThrow(),
            mutable: true
          }
        ]
      });

      expect(result).toFail();
    });

    test('uses provided logger', async () => {
      const logger = new Logging.LogReporter<unknown>();
      const result = await JournalLibrary.createAsync({ builtin: false, logger });
      expect(result).toSucceedAndSatisfy((lib) => {
        expect(lib.size).toBe(0);
      });
    });
  });

  // ============================================================================
  // Query Tests - Filling Journals
  // ============================================================================

  describe('getJournalsForFilling', () => {
    test('returns journals for a filling across all variations', () => {
      const journal1 = makeFillingJournal('2026-01-15-100000-00000001', 'source.recipe-a@2026-01-01-01');
      const journal2 = makeFillingJournal('2026-01-16-100000-00000002', 'source.recipe-a@2026-01-02-01');
      const journal3 = makeFillingJournal('2026-01-17-100000-00000003', 'source.recipe-b@2026-01-01-01');

      const lib = createLibraryWithJournals([journal1, journal2, journal3]);

      const results = lib.getJournalsForFilling('source.recipe-a' as FillingId);
      expect(results).toHaveLength(2);
      expect(results.map((j) => j.baseId)).toContain(journal1.baseId);
      expect(results.map((j) => j.baseId)).toContain(journal2.baseId);
    });

    test('returns empty array for unknown filling', () => {
      const journal = makeFillingJournal('2026-01-15-100000-00000001', 'source.recipe-a@2026-01-01-01');
      const lib = createLibraryWithJournals([journal]);

      const results = lib.getJournalsForFilling('source.unknown' as FillingId);
      expect(results).toHaveLength(0);
    });

    test('works across multiple collections', () => {
      const journal1 = makeFillingJournal(
        '2026-01-15-100000-00000001',
        'source.recipe-a@2026-01-01-01',
        'collection-1'
      );
      const journal2 = makeFillingJournal(
        '2026-01-16-100000-00000002',
        'source.recipe-a@2026-01-02-01',
        'collection-2'
      );

      const lib = createLibraryWithCollections([
        { id: 'collection-1', journals: [journal1] },
        { id: 'collection-2', journals: [journal2] }
      ]);

      const results = lib.getJournalsForFilling('source.recipe-a' as FillingId);
      expect(results).toHaveLength(2);
    });
  });

  describe('getJournalsForFillingVariation', () => {
    test('returns journals for specific filling variation', () => {
      const journal1 = makeFillingJournal('2026-01-15-100000-00000001', 'source.recipe-a@2026-01-01-01');
      const journal2 = makeFillingJournal('2026-01-16-100000-00000002', 'source.recipe-a@2026-01-01-01');
      const journal3 = makeFillingJournal('2026-01-17-100000-00000003', 'source.recipe-a@2026-01-02-01');

      const lib = createLibraryWithJournals([journal1, journal2, journal3]);

      const results = lib.getJournalsForFillingVariation(
        'source.recipe-a@2026-01-01-01' as FillingRecipeVariationId
      );
      expect(results).toHaveLength(2);
      expect(results.map((j) => j.baseId)).toContain(journal1.baseId);
      expect(results.map((j) => j.baseId)).toContain(journal2.baseId);
    });

    test('returns empty array for unknown variation', () => {
      const journal = makeFillingJournal('2026-01-15-100000-00000001', 'source.recipe-a@2026-01-01-01');
      const lib = createLibraryWithJournals([journal]);

      const results = lib.getJournalsForFillingVariation(
        'source.recipe-a@2026-99-99-99' as FillingRecipeVariationId
      );
      expect(results).toHaveLength(0);
    });
  });

  // ============================================================================
  // Query Tests - Confection Journals
  // ============================================================================

  describe('getJournalsForConfection', () => {
    test('returns journals for a confection across all variations', () => {
      const journal1 = makeConfectionJournal('2026-01-15-100000-00000001', 'source.recipe-a@2026-01-01-01');
      const journal2 = makeConfectionJournal('2026-01-16-100000-00000002', 'source.recipe-a@2026-01-02-01');
      const journal3 = makeConfectionJournal('2026-01-17-100000-00000003', 'source.recipe-b@2026-01-01-01');

      const lib = createLibraryWithJournals([journal1, journal2, journal3]);

      const results = lib.getJournalsForConfection('source.recipe-a' as ConfectionId);
      expect(results).toHaveLength(2);
      expect(results.map((j) => j.baseId)).toContain(journal1.baseId);
      expect(results.map((j) => j.baseId)).toContain(journal2.baseId);
    });

    test('returns empty array for unknown confection', () => {
      const journal = makeConfectionJournal('2026-01-15-100000-00000001', 'source.recipe-a@2026-01-01-01');
      const lib = createLibraryWithJournals([journal]);

      const results = lib.getJournalsForConfection('source.unknown' as ConfectionId);
      expect(results).toHaveLength(0);
    });

    test('works across multiple collections', () => {
      const journal1 = makeConfectionJournal('2026-01-15-100000-00000001', 'source.recipe-a@2026-01-01-01');
      const journal2 = makeConfectionJournal('2026-01-16-100000-00000002', 'source.recipe-a@2026-01-02-01');

      const lib = createLibraryWithCollections([
        { id: 'collection-1', journals: [journal1] },
        { id: 'collection-2', journals: [journal2] }
      ]);

      const results = lib.getJournalsForConfection('source.recipe-a' as ConfectionId);
      expect(results).toHaveLength(2);
    });
  });

  describe('getJournalsForConfectionVariation', () => {
    test('returns journals for specific confection variation', () => {
      const journal1 = makeConfectionJournal('2026-01-15-100000-00000001', 'source.recipe-a@2026-01-01-01');
      const journal2 = makeConfectionJournal('2026-01-16-100000-00000002', 'source.recipe-a@2026-01-01-01');
      const journal3 = makeConfectionJournal('2026-01-17-100000-00000003', 'source.recipe-a@2026-01-02-01');

      const lib = createLibraryWithJournals([journal1, journal2, journal3]);

      const results = lib.getJournalsForConfectionVariation(
        'source.recipe-a@2026-01-01-01' as ConfectionRecipeVariationId
      );
      expect(results).toHaveLength(2);
      expect(results.map((j) => j.baseId)).toContain(journal1.baseId);
      expect(results.map((j) => j.baseId)).toContain(journal2.baseId);
    });

    test('returns empty array for unknown variation', () => {
      const journal = makeConfectionJournal('2026-01-15-100000-00000001', 'source.recipe-a@2026-01-01-01');
      const lib = createLibraryWithJournals([journal]);

      const results = lib.getJournalsForConfectionVariation(
        'source.recipe-a@2026-99-99-99' as ConfectionRecipeVariationId
      );
      expect(results).toHaveLength(0);
    });
  });

  // ============================================================================
  // Individual Journal Access
  // ============================================================================

  describe('getJournal', () => {
    test('retrieves journal by ID', () => {
      const journal = makeFillingJournal('2026-01-15-100000-00000001', 'source.recipe-a@2026-01-01-01');
      const lib = createLibraryWithJournals([journal]);

      const journalId = CommonHelpers.createJournalId(
        CommonConverters.collectionId.convert('test-collection').orThrow(),
        journal.baseId
      );
      const result = lib.getJournal(journalId);
      expect(result).toSucceedAndSatisfy((j) => {
        expect(j.baseId).toBe(journal.baseId);
      });
    });

    test('fails for unknown ID', () => {
      const lib = JournalLibrary.create({ builtin: false }).orThrow();
      const unknownId = CommonHelpers.createJournalId(
        CommonConverters.collectionId.convert('test-collection').orThrow(),
        CommonConverters.baseJournalId.convert('2099-12-31-999999-99999999').orThrow()
      );
      expect(lib.getJournal(unknownId)).toFail();
    });
  });

  describe('hasJournal', () => {
    test('returns true for existing journal', () => {
      const journal = makeFillingJournal('2026-01-15-100000-00000001', 'source.recipe-a@2026-01-01-01');
      const lib = createLibraryWithJournals([journal]);

      const journalId = CommonHelpers.createJournalId(
        CommonConverters.collectionId.convert('test-collection').orThrow(),
        journal.baseId
      );
      expect(lib.hasJournal(journalId)).toBe(true);
    });

    test('returns false for unknown journal', () => {
      const lib = JournalLibrary.create({ builtin: false }).orThrow();
      const unknownId = CommonHelpers.createJournalId(
        CommonConverters.collectionId.convert('unknown').orThrow(),
        CommonConverters.baseJournalId.convert('2099-12-31-999999-99999999').orThrow()
      );
      expect(lib.hasJournal(unknownId)).toBe(false);
    });
  });

  describe('getAllJournals', () => {
    test('returns all journals across collections', () => {
      const journal1 = makeFillingJournal('2026-01-15-100000-00000001', 'source.recipe-a@2026-01-01-01');
      const journal2 = makeFillingJournal('2026-01-16-100000-00000002', 'source.recipe-b@2026-01-01-01');

      const lib = createLibraryWithJournals([journal1, journal2]);

      const results = lib.getAllJournals();
      expect(results).toHaveLength(2);
      expect(results.map((j) => j.baseId)).toContain(journal1.baseId);
      expect(results.map((j) => j.baseId)).toContain(journal2.baseId);
    });

    test('returns empty array for empty library', () => {
      const lib = JournalLibrary.create({ builtin: false }).orThrow();
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

      const lib = createLibraryWithCollections([
        { id: 'collection-1', journals: [journal1] },
        { id: 'collection-2', journals: [journal2, journal3] }
      ]);

      expect(lib.size).toBe(3);

      const results = lib.getJournalsForFilling('source.recipe-a' as FillingId);
      expect(results).toHaveLength(3);
    });

    test('size reflects total across all collections', () => {
      const journal1 = makeFillingJournal('2026-01-15-100000-00000001', 'source.recipe-a@2026-01-01-01');
      const journal2 = makeFillingJournal('2026-01-16-100000-00000002', 'source.recipe-b@2026-01-01-01');

      const lib = createLibraryWithCollections([
        { id: 'collection-1', journals: [journal1] },
        { id: 'collection-2', journals: [journal2] }
      ]);

      expect(lib.size).toBe(2);
    });
  });
});

// ============================================================================
// createAsync Tests (with encryption support)
// ============================================================================

describe('JournalLibrary.createAsync', () => {
  test('creates empty library with builtin: false', async () => {
    const result = await JournalLibrary.createAsync({ builtin: false });
    expect(result).toSucceedAndSatisfy((lib) => {
      expect(lib.collections.size).toBe(0);
      expect(lib.size).toBe(0);
    });
  });
});
