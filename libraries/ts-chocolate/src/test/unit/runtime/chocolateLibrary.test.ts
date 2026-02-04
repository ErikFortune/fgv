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
  BaseIngredientId,
  BaseMoldId,
  BaseProcedureId,
  BaseFillingId,
  ConfectionId,
  FillingVersionSpec,
  Measurement,
  IngredientId,
  Millimeters,
  Model as CommonModel,
  MoldId,
  Percentage,
  ProcedureId,
  FillingId,
  FillingName,
  CollectionId,
  TaskId
} from '../../../packlets/common';

import { Ingredients, IGanacheCharacteristics, IngredientsLibrary } from '../../../packlets/entities';

import {
  IFillingRecipeEntity,
  IFillingRecipeVersionEntity,
  FillingsLibrary
} from '../../../packlets/entities';

import { IMoldEntity, MoldsLibrary } from '../../../packlets/entities';

import { IProcedureEntity, ProceduresLibrary } from '../../../packlets/entities';

import { ILibraryFileTreeSource } from '../../../packlets/library-data';

import { ChocolateLibrary } from '../../../packlets/library-runtime';

import { ITaskEntityInvocation } from '../../../packlets/entities';
import { BaseTaskId } from '../../../packlets/common';

/**
 * Helper to create an inline task from a description string.
 * Creates a synthetic baseId from the template for testing purposes.
 */
function inlineTask(template: string): ITaskEntityInvocation {
  const baseId = `test-inline-${template.slice(0, 20).replace(/\s+/g, '-').toLowerCase()}` as BaseTaskId;
  return {
    task: {
      baseId,
      name: template.slice(0, 30),
      template
    },
    params: {}
  };
}

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

  const testIngredient: Ingredients.IngredientEntity = {
    baseId: 'testChoco' as unknown as BaseIngredientId,
    name: 'Test Chocolate',
    category: 'chocolate',
    ganacheCharacteristics: testChars
  };

  const testRecipeVersion: IFillingRecipeVersionEntity = {
    versionSpec: '2026-01-01-01' as unknown as FillingVersionSpec,
    createdDate: '2026-01-01',
    ingredients: [{ ingredient: { ids: ['test.testChoco' as IngredientId] }, amount: 100 as Measurement }],
    baseWeight: 100 as Measurement
  };

  const testRecipe: IFillingRecipeEntity = {
    baseId: 'testRecipe' as BaseFillingId,
    name: 'Test Recipe' as FillingName,
    category: 'ganache',
    versions: [testRecipeVersion],
    goldenVersionSpec: '2026-01-01-01' as unknown as FillingVersionSpec
  };

  // ============================================================================
  // Creation Tests
  // ============================================================================

  describe('create', () => {
    test('creates with built-in ingredients and recipes by default', () => {
      expect(ChocolateLibrary.create()).toSucceedAndSatisfy((lib) => {
        expect(lib.ingredients.size).toBeGreaterThan(0);
        expect(lib.fillings.size).toBeGreaterThan(0);
      });
    });

    test('creates without built-in ingredients when specified', () => {
      expect(
        ChocolateLibrary.create({ builtin: { ingredients: false, fillings: false } })
      ).toSucceedAndSatisfy((lib) => {
        expect(lib.ingredients.size).toBe(0);
      });
    });

    test('creates with provided ingredients library only (no builtins)', () => {
      const ingredients = IngredientsLibrary.create({
        builtin: false,
        collections: [{ id: 'test' as CollectionId, isMutable: true, items: { testChoco: testIngredient } }]
      }).orThrow();

      expect(ChocolateLibrary.create({ builtin: false, libraries: { ingredients } })).toSucceedAndSatisfy(
        (lib) => {
          expect(lib.ingredients.size).toBe(1);
        }
      );
    });

    test('creates with provided recipes library only (no builtins)', () => {
      const recipes = FillingsLibrary.create({
        builtin: false,
        collections: [{ id: 'test' as CollectionId, isMutable: true, items: { testRecipe } }]
      }).orThrow();

      expect(
        ChocolateLibrary.create({ builtin: false, libraries: { fillings: recipes } })
      ).toSucceedAndSatisfy((lib) => {
        expect(lib.fillings.size).toBe(1);
      });
    });

    test('merges provided ingredients library with builtins', () => {
      const ingredients = IngredientsLibrary.create({
        builtin: false,
        collections: [{ id: 'test' as CollectionId, isMutable: true, items: { testChoco: testIngredient } }]
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
        collections: [{ id: 'test' as CollectionId, isMutable: true, items: { testChoco: testIngredient } }]
      }).orThrow();

      const recipes = FillingsLibrary.create({
        builtin: false,
        collections: [{ id: 'test' as CollectionId, isMutable: true, items: { testRecipe } }]
      }).orThrow();

      library = ChocolateLibrary.create({
        builtin: false,
        libraries: { ingredients, fillings: recipes }
      }).orThrow();
    });

    test('ingredients returns IngredientsLibrary', () => {
      expect(library.ingredients).toBeInstanceOf(IngredientsLibrary);
    });

    test('recipes returns FillingsLibrary', () => {
      expect(library.fillings).toBeInstanceOf(FillingsLibrary);
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
      const recipes = FillingsLibrary.create({
        builtin: false,
        collections: [{ id: 'test' as CollectionId, isMutable: true, items: { testRecipe } }]
      }).orThrow();

      library = ChocolateLibrary.create({ builtin: false, libraries: { fillings: recipes } }).orThrow();
    });

    test('getRecipe returns existing recipe', () => {
      expect(library.getRecipe('test.testRecipe' as FillingId)).toSucceedAndSatisfy((recipe) => {
        expect(recipe.name).toBe('Test Recipe');
      });
    });

    test('getRecipe fails for non-existent', () => {
      expect(library.getRecipe('test.nonexistent' as FillingId)).toFail();
    });

    test('hasRecipe returns true for existing', () => {
      expect(library.hasRecipe('test.testRecipe' as FillingId)).toBe(true);
    });

    test('hasRecipe returns false for non-existent', () => {
      expect(library.hasRecipe('test.nonexistent' as FillingId)).toBe(false);
    });
  });

  // ============================================================================
  // Mold Lookup Tests
  // ============================================================================

  describe('mold lookup', () => {
    const testMoldData: IMoldEntity = {
      baseId: 'test-mold' as BaseMoldId,
      manufacturer: 'Test Manufacturer',
      productNumber: 'TM-001',
      description: 'Test Mold',
      cavities: {
        kind: 'count',
        count: 24,
        info: {
          weight: 10 as Measurement,
          dimensions: {
            width: 30 as Millimeters,
            length: 30 as Millimeters,
            depth: 15 as Millimeters
          }
        }
      },
      format: 'series-2000',
      tags: ['test'],
      notes: [{ category: 'user', note: 'Test notes' }] as CommonModel.ICategorizedNote[]
    };

    let library: ChocolateLibrary;

    beforeEach(() => {
      const molds = MoldsLibrary.create({
        builtin: false,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        collections: [{ id: 'test' as CollectionId, isMutable: true, items: { 'test-mold': testMoldData } }]
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
    const testProcedureData: IProcedureEntity = {
      baseId: 'test-procedure' as BaseProcedureId,
      name: 'Test Procedure',
      description: 'A test procedure',
      steps: [
        { order: 1, task: inlineTask('Step 1') },
        { order: 2, task: inlineTask('Step 2') }
      ],
      tags: ['test']
    };

    let library: ChocolateLibrary;

    beforeEach(() => {
      const procedures = ProceduresLibrary.create({
        builtin: false,
        collections: [
          // eslint-disable-next-line @typescript-eslint/naming-convention
          { id: 'test' as CollectionId, isMutable: true, items: { 'test-procedure': testProcedureData } }
        ]
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
        collections: [{ id: 'test' as CollectionId, isMutable: true, items: { testChoco: testIngredient } }]
      }).orThrow();

      const recipes = FillingsLibrary.create({
        builtin: false,
        collections: [{ id: 'test' as CollectionId, isMutable: true, items: { testRecipe } }]
      }).orThrow();

      library = ChocolateLibrary.create({
        builtin: false,
        libraries: { ingredients, fillings: recipes }
      }).orThrow();
    });

    test('createIngredientResolver returns working resolver', () => {
      const resolver = library.createIngredientResolver();
      expect(resolver('test.testChoco' as IngredientId)).toSucceed();
    });

    test('calculateGanache returns analysis for valid recipe', () => {
      expect(library.calculateGanache('test.testRecipe' as FillingId)).toSucceedAndSatisfy((calc) => {
        expect(calc.analysis).toBeDefined();
        expect(calc.validation).toBeDefined();
      });
    });

    test('calculateGanache fails for non-existent recipe', () => {
      expect(library.calculateGanache('test.nonexistent' as FillingId)).toFail();
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
          cavities: { kind: 'count', count: 24 },
          format: 'series-2000'
        }
      }
    };

    const minimalProcedureData = {
      items: {
        'file-procedure': {
          baseId: 'file-procedure',
          name: 'File Procedure',
          steps: [
            {
              order: 1,
              task: {
                task: { baseId: 'file-procedure-step-1', name: 'Do Something', template: 'Do something' },
                params: {}
              }
            }
          ]
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
          versions: [{ versionSpec: '2026-01-01-01', createdDate: '2026-01-01', yield: { count: 24 } }]
        }
      }
    };

    const minimalTaskData = {
      items: {
        'file-task': {
          baseId: 'file-task',
          name: 'File Task',
          template: 'Do something with {{item}}'
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
        { path: '/data/fillings/file-source.json', contents: recipeData },
        { path: '/data/molds/file-source.json', contents: minimalMoldData },
        { path: '/data/procedures/file-source.json', contents: minimalProcedureData },
        { path: '/data/confections/file-source.json', contents: minimalConfectionData },
        { path: '/data/tasks/file-source.json', contents: minimalTaskData }
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
        expect(lib.fillings.size).toBe(1);
        expect(lib.hasRecipe('file-source.file-recipe' as FillingId)).toBe(true);
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
        { path: '/data/fillings/source2.json', contents: minimalRecipeData },
        { path: '/data/molds/source2.json', contents: minimalMoldData },
        { path: '/data/procedures/source2.json', contents: minimalProcedureData },
        { path: '/data/confections/source2.json', contents: minimalConfectionData },
        { path: '/data/tasks/source2.json', contents: minimalTaskData }
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
        { path: '/data/fillings/felchlin.json', contents: minimalRecipeData },
        { path: '/data/molds/felchlin.json', contents: minimalMoldData },
        { path: '/data/procedures/felchlin.json', contents: minimalProcedureData },
        { path: '/data/confections/felchlin.json', contents: minimalConfectionData },
        { path: '/data/tasks/felchlin.json', contents: minimalTaskData }
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
        { path: '/data/fillings/readme.txt', contents: 'empty' },
        { path: '/data/molds/readme.txt', contents: 'empty' },
        { path: '/data/procedures/readme.txt', contents: 'empty' },
        { path: '/data/confections/readme.txt', contents: 'empty' },
        { path: '/data/tasks/readme.txt', contents: 'empty' }
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
        expect(lib.getConfection('common.dark-dome-bonbon' as ConfectionId)).toSucceedAndSatisfy(
          (confection) => {
            expect(confection.name).toBe('Classic Dark Dome Bonbon');
            expect(confection.confectionType).toBe('molded-bonbon');
          }
        );
      });
    });

    test('getConfection fails for non-existent ID', () => {
      expect(ChocolateLibrary.create({ builtin: true })).toSucceedAndSatisfy((lib) => {
        expect(lib.getConfection('common.nonexistent' as ConfectionId)).toFail();
      });
    });

    test('hasConfection returns true for existing ID', () => {
      expect(ChocolateLibrary.create({ builtin: true })).toSucceedAndSatisfy((lib) => {
        expect(lib.hasConfection('common.dark-dome-bonbon' as ConfectionId)).toBe(true);
      });
    });

    test('hasConfection returns false for non-existent ID', () => {
      expect(ChocolateLibrary.create({ builtin: true })).toSucceedAndSatisfy((lib) => {
        expect(lib.hasConfection('common.nonexistent' as ConfectionId)).toBe(false);
      });
    });
  });

  // ============================================================================
  // Task Convenience Methods
  // ============================================================================

  describe('task convenience methods', () => {
    test('tasks getter returns tasks library', () => {
      expect(ChocolateLibrary.create({ builtin: true })).toSucceedAndSatisfy((lib) => {
        expect(lib.tasks).toBeDefined();
        expect(lib.tasks.size).toBeGreaterThan(0);
      });
    });

    test('getTask returns task for valid ID', () => {
      expect(ChocolateLibrary.create({ builtin: true })).toSucceedAndSatisfy((lib) => {
        expect(lib.getTask('common.melt-chocolate' as TaskId)).toSucceedAndSatisfy((task) => {
          expect(task.name).toBe('Melt Chocolate');
        });
      });
    });

    test('getTask fails for non-existent ID', () => {
      expect(ChocolateLibrary.create({ builtin: true })).toSucceedAndSatisfy((lib) => {
        expect(lib.getTask('common.nonexistent' as TaskId)).toFail();
      });
    });

    test('hasTask returns true for existing ID', () => {
      expect(ChocolateLibrary.create({ builtin: true })).toSucceedAndSatisfy((lib) => {
        expect(lib.hasTask('common.melt-chocolate' as TaskId)).toBe(true);
      });
    });

    test('hasTask returns false for non-existent ID', () => {
      expect(ChocolateLibrary.create({ builtin: true })).toSucceedAndSatisfy((lib) => {
        expect(lib.hasTask('common.nonexistent' as TaskId)).toBe(false);
      });
    });
  });
});
