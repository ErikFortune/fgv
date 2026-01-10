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

import { FileTree } from '@fgv/ts-json-base';

import {
  BaseMoldId,
  BaseProcedureId,
  BaseRecipeId,
  Measurement,
  IngredientId,
  JournalId,
  Millimeters,
  MoldId,
  Percentage,
  ProcedureId,
  RecipeId,
  RecipeName,
  RecipeVersionId,
  SourceId
} from '../../../packlets/common';

import { IRecipeJournalRecord, JournalLibrary } from '../../../packlets/journal';

import { IGanacheCharacteristics, IIngredient, IngredientsLibrary } from '../../../packlets/ingredients';

import { IRecipe, IRecipeVersion, RecipesLibrary } from '../../../packlets/recipes';

import { IMold, Mold, MoldsLibrary } from '../../../packlets/molds';

import { IProcedure, Procedure, ProceduresLibrary } from '../../../packlets/procedures';

import { ILibraryFileTreeSource } from '../../../packlets/library-data';

import { ChocolateLibrary } from '../../../packlets/runtime';

describe('ChocolateLibrary', () => {
  // ============================================================================
  // Test Data
  // ============================================================================

  const testChars: IGanacheCharacteristics = {
    cacaoFat: 36 as Percentage,
    sugar: 34 as Percentage,
    milkFat: 0 as Percentage,
    water: 1 as Percentage,
    solids: 29 as Percentage,
    otherFats: 0 as Percentage
  };

  const testIngredient: IIngredient = {
    baseId: 'testChoco' as unknown as import('../../../packlets/common').BaseIngredientId,
    name: 'Test Chocolate',
    category: 'chocolate',
    ganacheCharacteristics: testChars
  };

  const testRecipeVersion: IRecipeVersion = {
    versionSpec: '2026-01-01-01' as unknown as import('../../../packlets/common').RecipeVersionSpec,
    createdDate: '2026-01-01',
    ingredients: [{ ingredient: { ids: ['test.testChoco' as IngredientId] }, amount: 100 as Measurement }],
    baseWeight: 100 as Measurement
  };

  const testRecipe: IRecipe = {
    baseId: 'testRecipe' as BaseRecipeId,
    name: 'Test Recipe' as RecipeName,
    category: 'ganache',
    versions: [testRecipeVersion],
    goldenVersionSpec: '2026-01-01-01' as unknown as import('../../../packlets/common').RecipeVersionSpec
  };

  // ============================================================================
  // Creation Tests
  // ============================================================================

  describe('create', () => {
    test('creates with built-in ingredients and recipes by default', () => {
      expect(ChocolateLibrary.create()).toSucceedAndSatisfy((lib) => {
        expect(lib.ingredients.size).toBeGreaterThan(0);
        expect(lib.recipes.size).toBeGreaterThan(0);
      });
    });

    test('creates without built-in ingredients when specified', () => {
      expect(
        ChocolateLibrary.create({ builtin: { ingredients: false, recipes: false } })
      ).toSucceedAndSatisfy((lib) => {
        expect(lib.ingredients.size).toBe(0);
      });
    });

    test('creates with provided ingredients library only (no builtins)', () => {
      const ingredients = IngredientsLibrary.create({
        builtin: false,
        collections: [{ id: 'test' as SourceId, isMutable: true, items: { testChoco: testIngredient } }]
      }).orThrow();

      expect(ChocolateLibrary.create({ builtin: false, libraries: { ingredients } })).toSucceedAndSatisfy(
        (lib) => {
          expect(lib.ingredients.size).toBe(1);
        }
      );
    });

    test('creates with provided recipes library only (no builtins)', () => {
      const recipes = RecipesLibrary.create({
        builtin: false,
        collections: [{ id: 'test' as SourceId, isMutable: true, items: { testRecipe } }]
      }).orThrow();

      expect(ChocolateLibrary.create({ builtin: false, libraries: { recipes } })).toSucceedAndSatisfy(
        (lib) => {
          expect(lib.recipes.size).toBe(1);
        }
      );
    });

    test('merges provided ingredients library with builtins', () => {
      const ingredients = IngredientsLibrary.create({
        builtin: false,
        collections: [{ id: 'test' as SourceId, isMutable: true, items: { testChoco: testIngredient } }]
      }).orThrow();

      expect(ChocolateLibrary.create({ libraries: { ingredients } })).toSucceedAndSatisfy((lib) => {
        // Should have both builtin and provided ingredients
        expect(lib.ingredients.size).toBeGreaterThan(1);
        expect(lib.hasIngredient('test.testChoco' as IngredientId)).toBe(true);
        expect(lib.hasIngredient('felchlin.maracaibo-65' as IngredientId)).toBe(true);
      });
    });
  });

  // ============================================================================
  // Accessor Tests
  // ============================================================================

  describe('accessors', () => {
    let library: ChocolateLibrary;

    beforeEach(() => {
      const ingredients = IngredientsLibrary.create({
        builtin: false,
        collections: [{ id: 'test' as SourceId, isMutable: true, items: { testChoco: testIngredient } }]
      }).orThrow();

      const recipes = RecipesLibrary.create({
        builtin: false,
        collections: [{ id: 'test' as SourceId, isMutable: true, items: { testRecipe } }]
      }).orThrow();

      library = ChocolateLibrary.create({
        builtin: false,
        libraries: { ingredients, recipes }
      }).orThrow();
    });

    test('ingredients returns IngredientsLibrary', () => {
      expect(library.ingredients).toBeInstanceOf(IngredientsLibrary);
    });

    test('recipes returns RecipesLibrary', () => {
      expect(library.recipes).toBeInstanceOf(RecipesLibrary);
    });
  });

  // ============================================================================
  // Ingredient Lookup Tests
  // ============================================================================

  describe('ingredient lookup', () => {
    let library: ChocolateLibrary;

    beforeEach(() => {
      library = ChocolateLibrary.create().orThrow();
    });

    test('getIngredient returns existing ingredient', () => {
      expect(library.getIngredient('felchlin.maracaibo-65' as IngredientId)).toSucceedAndSatisfy((ing) => {
        expect(ing.name).toContain('Maracaibo');
      });
    });

    test('getIngredient fails for non-existent', () => {
      expect(library.getIngredient('test.nonexistent' as IngredientId)).toFail();
    });

    test('hasIngredient returns true for existing', () => {
      expect(library.hasIngredient('felchlin.maracaibo-65' as IngredientId)).toBe(true);
    });

    test('hasIngredient returns false for non-existent', () => {
      expect(library.hasIngredient('test.nonexistent' as IngredientId)).toBe(false);
    });
  });

  // ============================================================================
  // Recipe Lookup Tests
  // ============================================================================

  describe('recipe lookup', () => {
    let library: ChocolateLibrary;

    beforeEach(() => {
      const recipes = RecipesLibrary.create({
        builtin: false,
        collections: [{ id: 'test' as SourceId, isMutable: true, items: { testRecipe } }]
      }).orThrow();

      library = ChocolateLibrary.create({ builtin: false, libraries: { recipes } }).orThrow();
    });

    test('getRecipe returns existing recipe', () => {
      expect(library.getRecipe('test.testRecipe' as RecipeId)).toSucceedAndSatisfy((recipe) => {
        expect(recipe.name).toBe('Test Recipe');
      });
    });

    test('getRecipe fails for non-existent', () => {
      expect(library.getRecipe('test.nonexistent' as RecipeId)).toFail();
    });

    test('hasRecipe returns true for existing', () => {
      expect(library.hasRecipe('test.testRecipe' as RecipeId)).toBe(true);
    });

    test('hasRecipe returns false for non-existent', () => {
      expect(library.hasRecipe('test.nonexistent' as RecipeId)).toBe(false);
    });
  });

  // ============================================================================
  // Mold Lookup Tests
  // ============================================================================

  describe('mold lookup', () => {
    const testMoldData: IMold = {
      baseId: 'test-mold' as BaseMoldId,
      manufacturer: 'Test Manufacturer',
      productNumber: 'TM-001',
      description: 'Test Mold',
      cavityCount: 24,
      cavityWeight: 10 as Measurement,
      cavityDimensions: {
        width: 30 as Millimeters,
        length: 30 as Millimeters,
        depth: 15 as Millimeters
      },
      format: 'series-2000',
      tags: ['test'],
      notes: 'Test notes'
    };

    let library: ChocolateLibrary;

    beforeEach(() => {
      const testMold = Mold.create(testMoldData).orThrow();
      const molds = MoldsLibrary.create({
        builtin: false,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        collections: [{ id: 'test' as SourceId, isMutable: true, items: { 'test-mold': testMold } }]
      }).orThrow();

      library = ChocolateLibrary.create({ builtin: false, libraries: { molds } }).orThrow();
    });

    test('molds getter returns molds library', () => {
      expect(library.molds).toBeDefined();
      expect(library.molds.size).toBe(1);
    });

    test('getMold returns existing mold', () => {
      expect(library.getMold('test.test-mold' as MoldId)).toSucceedAndSatisfy((mold) => {
        expect(mold.manufacturer).toBe('Test Manufacturer');
      });
    });

    test('getMold fails for non-existent', () => {
      expect(library.getMold('test.nonexistent' as MoldId)).toFail();
    });

    test('hasMold returns true for existing', () => {
      expect(library.hasMold('test.test-mold' as MoldId)).toBe(true);
    });

    test('hasMold returns false for non-existent', () => {
      expect(library.hasMold('test.nonexistent' as MoldId)).toBe(false);
    });
  });

  // ============================================================================
  // Procedure Lookup Tests
  // ============================================================================

  describe('procedure lookup', () => {
    const testProcedureData: IProcedure = {
      baseId: 'test-procedure' as BaseProcedureId,
      name: 'Test Procedure',
      description: 'A test procedure',
      steps: [
        { order: 1, description: 'Step 1' },
        { order: 2, description: 'Step 2' }
      ],
      tags: ['test']
    };

    let library: ChocolateLibrary;

    beforeEach(() => {
      const testProcedure = Procedure.create(testProcedureData).orThrow();
      const procedures = ProceduresLibrary.create({
        builtin: false,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        collections: [{ id: 'test' as SourceId, isMutable: true, items: { 'test-procedure': testProcedure } }]
      }).orThrow();

      library = ChocolateLibrary.create({ builtin: false, libraries: { procedures } }).orThrow();
    });

    test('procedures getter returns procedures library', () => {
      expect(library.procedures).toBeDefined();
      expect(library.procedures.size).toBe(1);
    });

    test('getProcedure returns existing procedure', () => {
      expect(library.getProcedure('test.test-procedure' as ProcedureId)).toSucceedAndSatisfy((procedure) => {
        expect(procedure.name).toBe('Test Procedure');
      });
    });

    test('getProcedure fails for non-existent', () => {
      expect(library.getProcedure('test.nonexistent' as ProcedureId)).toFail();
    });

    test('hasProcedure returns true for existing', () => {
      expect(library.hasProcedure('test.test-procedure' as ProcedureId)).toBe(true);
    });

    test('hasProcedure returns false for non-existent', () => {
      expect(library.hasProcedure('test.nonexistent' as ProcedureId)).toBe(false);
    });
  });

  // ============================================================================
  // Ganache Calculation Tests
  // ============================================================================

  describe('ganache calculations', () => {
    let library: ChocolateLibrary;

    beforeEach(() => {
      const ingredients = IngredientsLibrary.create({
        builtin: false,
        collections: [{ id: 'test' as SourceId, isMutable: true, items: { testChoco: testIngredient } }]
      }).orThrow();

      const recipes = RecipesLibrary.create({
        builtin: false,
        collections: [{ id: 'test' as SourceId, isMutable: true, items: { testRecipe } }]
      }).orThrow();

      library = ChocolateLibrary.create({
        builtin: false,
        libraries: { ingredients, recipes }
      }).orThrow();
    });

    test('createIngredientResolver returns working resolver', () => {
      const resolver = library.createIngredientResolver();
      expect(resolver('test.testChoco' as IngredientId)).toSucceed();
    });

    test('calculateGanache returns analysis for valid recipe', () => {
      expect(library.calculateGanache('test.testRecipe' as RecipeId)).toSucceedAndSatisfy((calc) => {
        expect(calc.analysis).toBeDefined();
        expect(calc.validation).toBeDefined();
      });
    });

    test('calculateGanache fails for non-existent recipe', () => {
      expect(library.calculateGanache('test.nonexistent' as RecipeId)).toFail();
    });

    test('calculateGanacheForRecipe calculates for recipe object', () => {
      expect(library.calculateGanacheForRecipe(testRecipe)).toSucceedAndSatisfy((calc) => {
        expect(calc.analysis.totalWeight).toBe(100);
      });
    });
  });

  // ============================================================================
  // File Source Loading Tests
  // ============================================================================

  describe('file source loading', () => {
    // ========================================================================
    // Minimal valid data for all sub-libraries (used to create well-formed file trees)
    // ========================================================================

    /* eslint-disable @typescript-eslint/naming-convention */
    const minimalIngredientData = {
      items: {
        'file-chocolate': {
          baseId: 'file-chocolate',
          name: 'File Source Chocolate',
          category: 'chocolate',
          chocolateType: 'dark',
          cacaoPercentage: 70,
          ganacheCharacteristics: {
            cacaoFat: 38,
            sugar: 28,
            milkFat: 0,
            water: 1,
            solids: 33,
            otherFats: 0
          }
        }
      }
    };

    const minimalRecipeData = {
      items: {
        'file-recipe': {
          baseId: 'file-recipe',
          name: 'File Source Recipe',
          category: 'ganache',
          goldenVersionSpec: '2026-01-01-01',
          versions: [
            {
              versionSpec: '2026-01-01-01',
              createdDate: '2026-01-01',
              ingredients: [{ ingredient: { ids: ['file-source.file-chocolate'] }, amount: 100 }],
              baseWeight: 100
            }
          ]
        }
      }
    };

    const minimalMoldData = {
      items: {
        'file-mold': {
          baseId: 'file-mold',
          manufacturer: 'Test',
          productNumber: 'T-001',
          cavityCount: 24,
          format: 'series-2000'
        }
      }
    };

    const minimalProcedureData = {
      items: {
        'file-procedure': {
          baseId: 'file-procedure',
          name: 'File Procedure',
          steps: [{ order: 1, description: 'Do something' }]
        }
      }
    };

    const minimalConfectionData = {
      items: {
        'file-confection': {
          baseId: 'file-confection',
          confectionType: 'rolled-truffle',
          name: 'File Confection',
          goldenVersionSpec: '2026-01-01-01',
          yield: { count: 24 },
          versions: [{ versionSpec: '2026-01-01-01', createdDate: '2026-01-01' }]
        }
      }
    };
    /* eslint-enable @typescript-eslint/naming-convention */

    /**
     * Creates a well-formed file tree source with all required sub-library directories.
     * Uses the minimal data sets by default, but allows overriding ingredients and recipes.
     */
    const createFileTreeSource = (
      ingredientData: object = minimalIngredientData,
      recipeData: object = minimalRecipeData
    ): ILibraryFileTreeSource => {
      const files: FileTree.IInMemoryFile[] = [
        { path: '/data/ingredients/file-source.json', contents: ingredientData },
        { path: '/data/recipes/file-source.json', contents: recipeData },
        { path: '/data/molds/file-source.json', contents: minimalMoldData },
        { path: '/data/procedures/file-source.json', contents: minimalProcedureData },
        { path: '/data/confections/file-source.json', contents: minimalConfectionData }
      ];
      const tree = FileTree.inMemory(files).orThrow();
      const root = tree.getItem('/').orThrow() as FileTree.IFileTreeDirectoryItem;
      return { directory: root };
    };

    test('creates with single file source', () => {
      const fileSource = createFileTreeSource();

      expect(
        ChocolateLibrary.create({
          builtin: false,
          fileSources: fileSource
        })
      ).toSucceedAndSatisfy((lib) => {
        expect(lib.ingredients.size).toBe(1);
        expect(lib.hasIngredient('file-source.file-chocolate' as IngredientId)).toBe(true);
        expect(lib.recipes.size).toBe(1);
        expect(lib.hasRecipe('file-source.file-recipe' as RecipeId)).toBe(true);
      });
    });

    test('creates with array of file sources', () => {
      // Create two well-formed file sources
      const source1 = createFileTreeSource();

      /* eslint-disable @typescript-eslint/naming-convention */
      const secondIngredientData = {
        items: {
          'second-chocolate': {
            baseId: 'second-chocolate',
            name: 'Second Source Chocolate',
            category: 'chocolate',
            ganacheCharacteristics: {
              cacaoFat: 35,
              sugar: 35,
              milkFat: 0,
              water: 1,
              solids: 29,
              otherFats: 0
            }
          }
        }
      };
      /* eslint-enable @typescript-eslint/naming-convention */

      // Second source with different ingredient data
      const files2: FileTree.IInMemoryFile[] = [
        { path: '/data/ingredients/source2.json', contents: secondIngredientData },
        { path: '/data/recipes/source2.json', contents: minimalRecipeData },
        { path: '/data/molds/source2.json', contents: minimalMoldData },
        { path: '/data/procedures/source2.json', contents: minimalProcedureData },
        { path: '/data/confections/source2.json', contents: minimalConfectionData }
      ];
      const tree2 = FileTree.inMemory(files2).orThrow();
      const root2 = tree2.getItem('/').orThrow() as FileTree.IFileTreeDirectoryItem;

      expect(
        ChocolateLibrary.create({
          builtin: false,
          fileSources: [source1, { directory: root2 }]
        })
      ).toSucceedAndSatisfy((lib) => {
        expect(lib.ingredients.size).toBe(2);
        expect(lib.hasIngredient('file-source.file-chocolate' as IngredientId)).toBe(true);
        expect(lib.hasIngredient('source2.second-chocolate' as IngredientId)).toBe(true);
      });
    });

    test('merges file source with builtin collections', () => {
      const fileSource = createFileTreeSource();

      expect(
        ChocolateLibrary.create({
          builtin: true,
          fileSources: fileSource
        })
      ).toSucceedAndSatisfy((lib) => {
        // Should have both builtin and file source ingredients
        expect(lib.hasIngredient('felchlin.maracaibo-65' as IngredientId)).toBe(true);
        expect(lib.hasIngredient('file-source.file-chocolate' as IngredientId)).toBe(true);
      });
    });

    test('fails on collection ID collision between builtin and file source', () => {
      // Create a file source with 'felchlin' collection ID (same as builtin)
      /* eslint-disable @typescript-eslint/naming-convention */
      const conflictingData = {
        items: {
          'conflict-chocolate': {
            baseId: 'conflict-chocolate',
            name: 'Conflicting Chocolate',
            category: 'chocolate',
            ganacheCharacteristics: {
              cacaoFat: 35,
              sugar: 35,
              milkFat: 0,
              water: 1,
              solids: 29,
              otherFats: 0
            }
          }
        }
      };
      /* eslint-enable @typescript-eslint/naming-convention */

      const files: FileTree.IInMemoryFile[] = [
        { path: '/data/ingredients/felchlin.json', contents: conflictingData },
        { path: '/data/recipes/felchlin.json', contents: minimalRecipeData },
        { path: '/data/molds/felchlin.json', contents: minimalMoldData },
        { path: '/data/procedures/felchlin.json', contents: minimalProcedureData },
        { path: '/data/confections/felchlin.json', contents: minimalConfectionData }
      ];
      const tree = FileTree.inMemory(files).orThrow();
      const root = tree.getItem('/').orThrow() as FileTree.IFileTreeDirectoryItem;

      expect(
        ChocolateLibrary.create({
          builtin: { ingredients: true },
          fileSources: { directory: root }
        })
      ).toFailWith(/felchlin.*conflict/);
    });

    test('handles file source with empty collections gracefully', () => {
      // Create file source with directories but no matching .json files
      const files: FileTree.IInMemoryFile[] = [
        { path: '/data/ingredients/readme.txt', contents: 'empty' },
        { path: '/data/recipes/readme.txt', contents: 'empty' },
        { path: '/data/molds/readme.txt', contents: 'empty' },
        { path: '/data/procedures/readme.txt', contents: 'empty' },
        { path: '/data/confections/readme.txt', contents: 'empty' }
      ];
      const tree = FileTree.inMemory(files).orThrow();
      const root = tree.getItem('/').orThrow() as FileTree.IFileTreeDirectoryItem;

      expect(
        ChocolateLibrary.create({
          builtin: true,
          fileSources: { directory: root }
        })
      ).toSucceedAndSatisfy((lib) => {
        // Should still have builtin collections
        expect(lib.hasIngredient('felchlin.maracaibo-65' as IngredientId)).toBe(true);
      });
    });
  });

  // ============================================================================
  // Journal Integration Tests
  // ============================================================================

  describe('journals', () => {
    const testJournal: IRecipeJournalRecord = {
      journalType: 'recipe',
      journalId: '2026-01-01-120000-abcd1234' as JournalId,
      recipeVersionId: 'test.testRecipe@2026-01-01-01' as RecipeVersionId,
      date: '2026-01-01',
      targetWeight: 200 as Measurement,
      scaleFactor: 2.0
    };

    const testJournal2: IRecipeJournalRecord = {
      journalType: 'recipe',
      journalId: '2026-01-02-120000-efgh5678' as JournalId,
      recipeVersionId: 'test.testRecipe@2026-01-01-01' as RecipeVersionId,
      date: '2026-01-02',
      targetWeight: 300 as Measurement,
      scaleFactor: 3.0
    };

    test('journals accessor returns JournalLibrary', () => {
      expect(ChocolateLibrary.create({ builtin: false })).toSucceedAndSatisfy((lib) => {
        expect(lib.journals).toBeInstanceOf(JournalLibrary);
      });
    });

    test('creates with empty journals by default', () => {
      expect(ChocolateLibrary.create({ builtin: false })).toSucceedAndSatisfy((lib) => {
        expect(lib.journals.size).toBe(0);
      });
    });

    test('creates with provided journals library', () => {
      const journals = JournalLibrary.create({ journals: [testJournal] }).orThrow();

      expect(ChocolateLibrary.create({ builtin: false, libraries: { journals } })).toSucceedAndSatisfy(
        (lib) => {
          expect(lib.journals.size).toBe(1);
        }
      );
    });

    test('addJournal adds a journal record', () => {
      expect(ChocolateLibrary.create({ builtin: false })).toSucceedAndSatisfy((lib) => {
        expect(lib.addJournal(testJournal)).toSucceedWith(testJournal.journalId);
        expect(lib.journals.size).toBe(1);
      });
    });

    test('getJournalsForRecipe returns journals for a recipe', () => {
      const journals = JournalLibrary.create({ journals: [testJournal, testJournal2] }).orThrow();

      expect(ChocolateLibrary.create({ builtin: false, libraries: { journals } })).toSucceedAndSatisfy(
        (lib) => {
          const recipeJournals = lib.getJournalsForRecipe('test.testRecipe' as RecipeId);
          expect(recipeJournals.length).toBe(2);
        }
      );
    });

    test('getJournalsForRecipe returns empty array for non-existent recipe', () => {
      expect(ChocolateLibrary.create({ builtin: false })).toSucceedAndSatisfy((lib) => {
        const recipeJournals = lib.getJournalsForRecipe('test.nonexistent' as RecipeId);
        expect(recipeJournals.length).toBe(0);
      });
    });

    test('getJournalsForVersion returns journals for a specific version', () => {
      const journals = JournalLibrary.create({ journals: [testJournal, testJournal2] }).orThrow();

      expect(ChocolateLibrary.create({ builtin: false, libraries: { journals } })).toSucceedAndSatisfy(
        (lib) => {
          const versionJournals = lib.getJournalsForVersion(
            'test.testRecipe@2026-01-01-01' as RecipeVersionId
          );
          expect(versionJournals.length).toBe(2);
        }
      );
    });

    test('getJournalsForVersion returns empty array for non-existent version', () => {
      expect(ChocolateLibrary.create({ builtin: false })).toSucceedAndSatisfy((lib) => {
        const versionJournals = lib.getJournalsForVersion(
          'test.nonexistent@2026-01-01-01' as RecipeVersionId
        );
        expect(versionJournals.length).toBe(0);
      });
    });
  });

  // ============================================================================
  // Confection Convenience Methods
  // ============================================================================

  describe('confection convenience methods', () => {
    test('confections getter returns confections library', () => {
      expect(ChocolateLibrary.create({ builtin: true })).toSucceedAndSatisfy((lib) => {
        expect(lib.confections).toBeDefined();
        expect(lib.confections.size).toBeGreaterThan(0);
      });
    });

    test('getConfection returns confection for valid ID', () => {
      expect(ChocolateLibrary.create({ builtin: true })).toSucceedAndSatisfy((lib) => {
        expect(
          lib.getConfection('common.dark-dome-bonbon' as import('../../../packlets/common').ConfectionId)
        ).toSucceedAndSatisfy((confection) => {
          expect(confection.name).toBe('Classic Dark Dome Bonbon');
          expect(confection.confectionType).toBe('molded-bonbon');
        });
      });
    });

    test('getConfection fails for non-existent ID', () => {
      expect(ChocolateLibrary.create({ builtin: true })).toSucceedAndSatisfy((lib) => {
        expect(
          lib.getConfection('common.nonexistent' as import('../../../packlets/common').ConfectionId)
        ).toFail();
      });
    });

    test('hasConfection returns true for existing ID', () => {
      expect(ChocolateLibrary.create({ builtin: true })).toSucceedAndSatisfy((lib) => {
        expect(
          lib.hasConfection('common.dark-dome-bonbon' as import('../../../packlets/common').ConfectionId)
        ).toBe(true);
      });
    });

    test('hasConfection returns false for non-existent ID', () => {
      expect(ChocolateLibrary.create({ builtin: true })).toSucceedAndSatisfy((lib) => {
        expect(
          lib.hasConfection('common.nonexistent' as import('../../../packlets/common').ConfectionId)
        ).toBe(false);
      });
    });
  });
});
