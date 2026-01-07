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
  BaseRecipeId,
  Grams,
  IngredientId,
  JournalId,
  Percentage,
  RecipeId,
  RecipeName,
  RecipeVersionId,
  SourceId
} from '../../../packlets/common';

import { IJournalRecord, JournalLibrary } from '../../../packlets/journal';

import { IGanacheCharacteristics, IIngredient, IngredientsLibrary } from '../../../packlets/ingredients';

import { IRecipe, IRecipeVersion, RecipesLibrary } from '../../../packlets/recipes';

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
    ingredients: [{ ingredientId: 'test.testChoco' as IngredientId, amount: 100 as Grams }],
    baseWeight: 100 as Grams
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
    // Valid ingredient JSON data for file tree
    /* eslint-disable @typescript-eslint/naming-convention */
    const fileIngredientData = {
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
    };

    // Valid recipe JSON data for file tree
    const fileRecipeData = {
      'file-recipe': {
        baseId: 'file-recipe',
        name: 'File Source Recipe',
        category: 'ganache',
        description: 'A recipe from file source',
        tags: ['file'],
        goldenVersionSpec: '2026-01-01-01',
        versions: [
          {
            versionSpec: '2026-01-01-01',
            createdDate: '2026-01-01',
            ingredients: [{ ingredientId: 'file-source.file-chocolate', amount: 100 }],
            baseWeight: 100
          }
        ]
      }
    };
    /* eslint-enable @typescript-eslint/naming-convention */

    // Helper to create file tree directory
    const createFileTreeSource = (ingredientData: object, recipeData: object): ILibraryFileTreeSource => {
      const files: FileTree.IInMemoryFile[] = [
        { path: '/data/ingredients/file-source.json', contents: ingredientData },
        { path: '/data/recipes/file-source.json', contents: recipeData }
      ];
      const tree = FileTree.inMemory(files).orThrow();
      const root = tree.getItem('/').orThrow() as FileTree.IFileTreeDirectoryItem;
      return { directory: root };
    };

    test('creates with single file source', () => {
      const fileSource = createFileTreeSource(fileIngredientData, fileRecipeData);

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
      // Create two separate file sources
      const files1: FileTree.IInMemoryFile[] = [
        { path: '/data/ingredients/source1.json', contents: fileIngredientData },
        { path: '/data/recipes/source1.json', contents: fileRecipeData }
      ];
      const tree1 = FileTree.inMemory(files1).orThrow();
      const root1 = tree1.getItem('/').orThrow() as FileTree.IFileTreeDirectoryItem;

      /* eslint-disable @typescript-eslint/naming-convention */
      const secondIngredientData = {
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
      };
      /* eslint-enable @typescript-eslint/naming-convention */

      const files2: FileTree.IInMemoryFile[] = [
        { path: '/data/ingredients/source2.json', contents: secondIngredientData }
      ];
      const tree2 = FileTree.inMemory(files2).orThrow();
      const root2 = tree2.getItem('/').orThrow() as FileTree.IFileTreeDirectoryItem;

      expect(
        ChocolateLibrary.create({
          builtin: false,
          fileSources: [
            { directory: root1 },
            { directory: root2, load: { ingredients: true, recipes: false } } // No recipes in second source
          ]
        })
      ).toSucceedAndSatisfy((lib) => {
        expect(lib.ingredients.size).toBe(2);
        expect(lib.hasIngredient('source1.file-chocolate' as IngredientId)).toBe(true);
        expect(lib.hasIngredient('source2.second-chocolate' as IngredientId)).toBe(true);
      });
    });

    test('merges file source with builtin collections', () => {
      const fileSource = createFileTreeSource(fileIngredientData, fileRecipeData);

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
      };
      /* eslint-enable @typescript-eslint/naming-convention */

      const files: FileTree.IInMemoryFile[] = [
        { path: '/data/ingredients/felchlin.json', contents: conflictingData }
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
        { path: '/data/recipes/readme.txt', contents: 'empty' }
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
    const testJournal: IJournalRecord = {
      journalId: '2026-01-01-120000-abcd1234' as JournalId,
      recipeVersionId: 'test.testRecipe@2026-01-01-01' as RecipeVersionId,
      date: '2026-01-01',
      targetWeight: 200 as Grams,
      scaleFactor: 2.0
    };

    const testJournal2: IJournalRecord = {
      journalId: '2026-01-02-120000-efgh5678' as JournalId,
      recipeVersionId: 'test.testRecipe@2026-01-01-01' as RecipeVersionId,
      date: '2026-01-02',
      targetWeight: 300 as Grams,
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
});
