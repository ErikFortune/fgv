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
import { FileTree, JsonObject } from '@fgv/ts-json-base';

import {
  BaseFillingId,
  Measurement,
  IngredientId,
  FillingId,
  FillingName,
  FillingVersionSpec,
  Model as CommonModel,
  NoteCategory,
  SourceId,
  FillingVersionId
} from '../../../packlets/common';

import { Fillings, IFillingRecipe, IFillingRecipeVersion, FillingsLibrary } from '../../../packlets/entities';
import { Internal as RuntimeInternal } from '../../../packlets/library-runtime';

import { CryptoUtils } from '@fgv/ts-extras';

describe('FillingsLibrary', () => {
  // ============================================================================
  // Test Data
  // ============================================================================

  const testRecipeVersion: IFillingRecipeVersion = {
    versionSpec: '2026-01-01-01' as FillingVersionSpec,
    createdDate: '2026-01-01',
    ingredients: [
      { ingredient: { ids: ['felchlin.maracaibo-65' as IngredientId] }, amount: 100 as Measurement },
      { ingredient: { ids: ['common.heavy-cream-36' as IngredientId] }, amount: 50 as Measurement }
    ],
    baseWeight: 150 as Measurement,
    yield: '10 bonbons'
  };

  const testRecipeData: IFillingRecipe = {
    baseId: 'test-ganache' as BaseFillingId,
    name: 'Test Ganache' as FillingName,
    category: 'ganache',
    description: 'A test ganache recipe',
    tags: ['test', 'dark'],
    versions: [testRecipeVersion],
    goldenVersionSpec: '2026-01-01-01' as FillingVersionSpec
  };

  const testRecipe = testRecipeData;

  // ============================================================================
  // Creation Tests
  // ============================================================================

  describe('create', () => {
    test('creates library with built-ins by default', () => {
      expect(FillingsLibrary.create()).toSucceedAndSatisfy((lib) => {
        // Built-in recipes are loaded by default
        expect(lib.size).toBeGreaterThan(0);
        expect(lib.collectionCount).toBe(1); // 'common' collection
        expect(lib.validating.has('common.dark-ganache-classic')).toBe(true);
      });
    });

    test('creates empty library with builtin: false', () => {
      expect(FillingsLibrary.create({ builtin: false })).toSucceedAndSatisfy((lib) => {
        expect(lib.size).toBe(0);
        expect(lib.collectionCount).toBe(0);
      });
    });

    test('creates library with initial collections', () => {
      const result = FillingsLibrary.create({
        builtin: false,
        collections: [
          {
            id: 'user' as SourceId,
            isMutable: true,
            items: {
              testGanache: testRecipe
            }
          }
        ]
      });

      expect(result).toSucceedAndSatisfy((lib) => {
        expect(lib.size).toBe(1);
        expect(lib.collectionCount).toBe(1);
      });
    });

    test('creates library with built-ins and additional collections', () => {
      const result = FillingsLibrary.create({
        builtin: true,
        collections: [
          {
            id: 'user' as SourceId,
            isMutable: true,
            items: { testGanache: testRecipe }
          }
        ]
      });

      expect(result).toSucceedAndSatisfy((lib) => {
        expect(lib.collectionCount).toBe(2); // 'common' + 'user'
        expect(lib.validating.has('common.dark-ganache-classic')).toBe(true);
        expect(lib.validating.has('user.testGanache')).toBe(true);
      });
    });

    test('creates library with specific built-in collections', () => {
      const result = FillingsLibrary.create({
        builtin: ['common' as SourceId]
      });

      expect(result).toSucceedAndSatisfy((lib) => {
        expect(lib.collectionCount).toBe(1);
        expect(lib.validating.has('common.dark-ganache-classic')).toBe(true);
      });
    });

    test('creates library with IBuiltInLoadParams include filter', () => {
      const result = FillingsLibrary.create({
        builtin: { included: ['common' as SourceId] }
      });

      expect(result).toSucceedAndSatisfy((lib) => {
        expect(lib.collectionCount).toBe(1);
        expect(lib.validating.has('common.dark-ganache-classic')).toBe(true);
      });
    });

    test('creates library with IBuiltInLoadParams exclude filter', () => {
      const result = FillingsLibrary.create({
        builtin: { excluded: ['nonexistent' as SourceId] }
      });

      expect(result).toSucceedAndSatisfy((lib) => {
        // Should load all collections since nonexistent isn't present
        expect(lib.collectionCount).toBe(1);
        expect(lib.validating.has('common.dark-ganache-classic')).toBe(true);
      });
    });
  });

  // ============================================================================
  // Lookup and Iteration Tests
  // ============================================================================

  describe('lookup and iteration', () => {
    let library: FillingsLibrary;

    beforeEach(() => {
      library = FillingsLibrary.create({
        builtin: false,
        collections: [
          {
            id: 'user' as SourceId,
            isMutable: true,
            items: { testGanache: testRecipe }
          }
        ]
      }).orThrow();
    });

    test('gets existing recipe', () => {
      expect(library.validating.get('user.testGanache')).toSucceedAndSatisfy((recipe) => {
        expect(recipe.name).toBe('Test Ganache');
      });
    });

    test('has returns true for existing recipe', () => {
      expect(library.validating.has('user.testGanache')).toBe(true);
    });

    test('has returns false for non-existent recipe', () => {
      expect(library.validating.has('user.nonexistent')).toBe(false);
    });

    test('entries, keys, values iterate correctly', () => {
      expect(Array.from(library.entries()).length).toBe(1);
      expect(Array.from(library.keys()).length).toBe(1);
      expect(Array.from(library.values()).length).toBe(1);
    });

    test('Symbol.iterator works', () => {
      expect(Array.from(library).length).toBe(1);
    });
  });

  // ============================================================================
  // Mutation Tests
  // ============================================================================

  describe('mutation', () => {
    let library: FillingsLibrary;

    beforeEach(() => {
      library = FillingsLibrary.create({
        builtin: false,
        collections: [{ id: 'user' as SourceId, isMutable: true, items: {} }]
      }).orThrow();
    });

    test('add adds new recipe', () => {
      const id = 'user.newRecipe' as FillingId;
      expect(library.add(id, testRecipe)).toSucceed();
      expect(library.has(id)).toBe(true);
    });

    test('set adds new recipe', () => {
      const id = 'user.newRecipe' as FillingId;
      expect(library.set(id, testRecipe)).toSucceed();
      expect(library.has(id)).toBe(true);
    });

    test('update succeeds for existing recipe', () => {
      const id = 'user.updateTest' as FillingId;
      library.add(id, testRecipe).orThrow();
      const updatedData: IFillingRecipe = { ...testRecipeData, description: 'Updated' };
      const updated = updatedData;
      expect(library.update(id, updated)).toSucceed();
    });

    test('update fails for non-existent recipe', () => {
      expect(library.update('user.nonexistent' as FillingId, testRecipe)).toFail();
    });

    test('delete removes recipe', () => {
      const id = 'user.deleteTest' as FillingId;
      library.add(id, testRecipe).orThrow();
      expect(library.delete(id)).toSucceed();
      expect(library.has(id)).toBe(false);
    });
  });

  // ============================================================================
  // Collection Management Tests
  // ============================================================================

  describe('collection management', () => {
    let library: FillingsLibrary;

    beforeEach(() => {
      library = FillingsLibrary.create({ builtin: false }).orThrow();
    });

    test('addCollectionEntry adds collection', () => {
      expect(
        library.addCollectionEntry({
          id: 'new' as SourceId,
          isMutable: true,
          items: {}
        })
      ).toSucceed();
      expect(library.collectionCount).toBe(1);
    });

    test('addCollectionWithItems adds collection with items', () => {
      expect(library.addCollectionWithItems('custom', [['recipe1', testRecipe]])).toSucceed();
      expect(library.collectionCount).toBe(1);
    });

    test('composeId creates valid composite ID', () => {
      expect(library.composeId('source' as SourceId, 'base' as BaseFillingId)).toSucceedWith(
        'source.base' as FillingId
      );
    });
  });

  // ============================================================================
  // Validating and Collections Access
  // ============================================================================

  describe('accessors', () => {
    let library: FillingsLibrary;

    beforeEach(() => {
      library = FillingsLibrary.create({
        builtin: false,
        collections: [{ id: 'user' as SourceId, isMutable: true, items: { testGanache: testRecipe } }]
      }).orThrow();
    });

    test('validating.get works with string key', () => {
      expect(library.validating.get('user.testGanache')).toSucceed();
    });

    test('validating.has works with string key', () => {
      expect(library.validating.has('user.testGanache')).toBe(true);
    });

    test('collections returns readonly map', () => {
      expect(library.collections.has('user' as SourceId)).toBe(true);
    });
  });

  // ============================================================================
  // File Source Loading Tests
  // ============================================================================

  describe('fileSources parameter', () => {
    // Valid recipe JSON data for testing
    /* eslint-disable @typescript-eslint/naming-convention */
    const validRecipeData = {
      items: {
        'test-recipe': {
          baseId: 'test-recipe',
          name: 'Test Recipe',
          category: 'ganache',
          description: 'A test recipe',
          tags: ['test'],
          goldenVersionSpec: '2026-01-01-01',
          versions: [
            {
              versionSpec: '2026-01-01-01',
              createdDate: '2026-01-01',
              ingredients: [{ ingredient: { ids: ['test-source.test-chocolate'] }, amount: 100 }],
              baseWeight: 100
            }
          ]
        }
      }
    };

    const secondRecipeData = {
      items: {
        'other-recipe': {
          baseId: 'other-recipe',
          name: 'Other Recipe',
          category: 'ganache',
          goldenVersionSpec: '2026-01-01-01',
          versions: [
            {
              versionSpec: '2026-01-01-01',
              createdDate: '2026-01-01',
              ingredients: [{ ingredient: { ids: ['test-source.test-chocolate'] }, amount: 200 }],
              baseWeight: 200
            }
          ]
        }
      }
    };
    /* eslint-enable @typescript-eslint/naming-convention */

    const getLibraryDir = (files: FileTree.IInMemoryFile[]): FileTree.IFileTreeDirectoryItem => {
      const tree = FileTree.inMemory(files).orThrow();
      const libraryItem = tree.getItem('/library').orThrow();
      return libraryItem as FileTree.IFileTreeDirectoryItem;
    };

    test('creates library with single file source', () => {
      const files: FileTree.IInMemoryFile[] = [
        { path: '/library/data/fillings/test-source.json', contents: validRecipeData }
      ];
      const root = getLibraryDir(files);

      expect(
        FillingsLibrary.create({
          builtin: false,
          fileSources: { directory: root }
        })
      ).toSucceedAndSatisfy((lib) => {
        expect(lib.collectionCount).toBe(1);
        expect(lib.size).toBe(1);
        expect(lib.validating.has('test-source.test-recipe')).toBe(true);
      });
    });

    test('creates library with array of file sources', () => {
      const files1: FileTree.IInMemoryFile[] = [
        { path: '/library/data/fillings/source1.json', contents: validRecipeData }
      ];
      const files2: FileTree.IInMemoryFile[] = [
        { path: '/library/data/fillings/source2.json', contents: secondRecipeData }
      ];
      const root1 = getLibraryDir(files1);
      const root2 = getLibraryDir(files2);

      expect(
        FillingsLibrary.create({
          builtin: false,
          fileSources: [{ directory: root1 }, { directory: root2 }]
        })
      ).toSucceedAndSatisfy((lib) => {
        expect(lib.collectionCount).toBe(2);
        expect(lib.size).toBe(2);
        expect(lib.validating.has('source1.test-recipe')).toBe(true);
        expect(lib.validating.has('source2.other-recipe')).toBe(true);
      });
    });

    test('merges file sources with builtins', () => {
      const files: FileTree.IInMemoryFile[] = [
        { path: '/library/data/fillings/custom-source.json', contents: validRecipeData }
      ];
      const root = getLibraryDir(files);

      expect(
        FillingsLibrary.create({
          builtin: true,
          fileSources: { directory: root }
        })
      ).toSucceedAndSatisfy((lib) => {
        // 1 builtin + 1 custom
        expect(lib.collectionCount).toBe(2);
        expect(lib.validating.has('custom-source.test-recipe')).toBe(true);
        expect(lib.validating.has('common.dark-ganache-classic')).toBe(true);
      });
    });

    test('fails on collection ID collision', () => {
      // Create two file sources with the same collection ID
      const files1: FileTree.IInMemoryFile[] = [
        { path: '/library/data/fillings/duplicate.json', contents: validRecipeData }
      ];
      const files2: FileTree.IInMemoryFile[] = [
        { path: '/library/data/fillings/duplicate.json', contents: secondRecipeData }
      ];
      const root1 = getLibraryDir(files1);
      const root2 = getLibraryDir(files2);

      expect(
        FillingsLibrary.create({
          builtin: false,
          fileSources: [{ directory: root1 }, { directory: root2 }]
        })
      ).toFailWith(/duplicate.*conflict/i);
    });

    test('respects mutable setting from file source', () => {
      const files: FileTree.IInMemoryFile[] = [
        { path: '/library/data/fillings/mutable-source.json', contents: validRecipeData }
      ];
      const root = getLibraryDir(files);
      const source: Fillings.IFillingFileTreeSource = {
        directory: root,
        mutable: true
      };

      expect(
        FillingsLibrary.create({
          builtin: false,
          fileSources: source
        })
      ).toSucceedAndSatisfy((lib) => {
        expect(lib.collectionCount).toBe(1);
        const collection = lib.collections.validating.get('mutable-source');
        expect(collection).toSucceedAndSatisfy((coll) => {
          expect(coll.isMutable).toBe(true);
        });
      });
    });

    test('respects load: false for file source', () => {
      const files: FileTree.IInMemoryFile[] = [
        { path: '/library/data/fillings/skipped.json', contents: validRecipeData }
      ];
      const root = getLibraryDir(files);

      expect(
        FillingsLibrary.create({
          builtin: false,
          fileSources: { directory: root, load: false }
        })
      ).toSucceedAndSatisfy((lib) => {
        expect(lib.collectionCount).toBe(0);
        expect(lib.size).toBe(0);
      });
    });

    test('fails when recipes directory does not exist and source is enabled', () => {
      // Create a file tree without data/fillings directory
      const files: FileTree.IInMemoryFile[] = [{ path: '/library/readme.txt', contents: 'empty' }];
      const root = getLibraryDir(files);

      expect(
        FillingsLibrary.create({
          builtin: false,
          fileSources: { directory: root }
        })
      ).toFail();
    });
  });

  // ============================================================================
  // Instance Method: loadFromFileTreeSource Tests
  // ============================================================================

  describe('loadFromFileTreeSource instance method', () => {
    /* eslint-disable @typescript-eslint/naming-convention */
    const validRecipeData = {
      items: {
        'test-recipe': {
          baseId: 'test-recipe',
          name: 'Test Recipe',
          category: 'ganache',
          description: 'A test recipe',
          tags: ['test'],
          goldenVersionSpec: '2026-01-01-01',
          versions: [
            {
              versionSpec: '2026-01-01-01',
              createdDate: '2026-01-01',
              ingredients: [{ ingredient: { ids: ['test-source.test-chocolate'] }, amount: 100 }],
              baseWeight: 100
            }
          ]
        }
      }
    };

    const secondRecipeData = {
      items: {
        'other-recipe': {
          baseId: 'other-recipe',
          name: 'Other Recipe',
          category: 'ganache',
          goldenVersionSpec: '2026-01-01-01',
          versions: [
            {
              versionSpec: '2026-01-01-01',
              createdDate: '2026-01-01',
              ingredients: [{ ingredient: { ids: ['test-source.test-chocolate'] }, amount: 200 }],
              baseWeight: 200
            }
          ]
        }
      }
    };
    /* eslint-enable @typescript-eslint/naming-convention */

    const getLibraryDir = (files: FileTree.IInMemoryFile[]): FileTree.IFileTreeDirectoryItem => {
      const tree = FileTree.inMemory(files).orThrow();
      const libraryItem = tree.getItem('/library').orThrow();
      return libraryItem as FileTree.IFileTreeDirectoryItem;
    };

    test('loads collections into existing library', () => {
      // Start with an empty library
      const library = FillingsLibrary.create({ builtin: false }).orThrow();
      expect(library.collectionCount).toBe(0);

      // Load from file source
      const files: FileTree.IInMemoryFile[] = [
        { path: '/library/data/fillings/test-source.json', contents: validRecipeData }
      ];
      const root = getLibraryDir(files);

      expect(library.loadFromFileTreeSource({ directory: root })).toSucceedWith(1);
      expect(library.collectionCount).toBe(1);
      expect(library.validating.has('test-source.test-recipe')).toBe(true);
    });

    test('can load multiple file sources incrementally', () => {
      const library = FillingsLibrary.create({ builtin: false }).orThrow();

      // Load first source
      const files1: FileTree.IInMemoryFile[] = [
        { path: '/library/data/fillings/source1.json', contents: validRecipeData }
      ];
      const root1 = getLibraryDir(files1);
      expect(library.loadFromFileTreeSource({ directory: root1 })).toSucceedWith(1);

      // Load second source
      const files2: FileTree.IInMemoryFile[] = [
        { path: '/library/data/fillings/source2.json', contents: secondRecipeData }
      ];
      const root2 = getLibraryDir(files2);
      expect(library.loadFromFileTreeSource({ directory: root2 })).toSucceedWith(1);

      expect(library.collectionCount).toBe(2);
      expect(library.validating.has('source1.test-recipe')).toBe(true);
      expect(library.validating.has('source2.other-recipe')).toBe(true);
    });

    test('fails on collection ID collision with existing collection', () => {
      // Create library with one collection
      const files1: FileTree.IInMemoryFile[] = [
        { path: '/library/data/fillings/duplicate.json', contents: validRecipeData }
      ];
      const root1 = getLibraryDir(files1);
      const library = FillingsLibrary.create({
        builtin: false,
        fileSources: { directory: root1 }
      }).orThrow();

      expect(library.collectionCount).toBe(1);

      // Try to load a source with the same collection ID
      const files2: FileTree.IInMemoryFile[] = [
        { path: '/library/data/fillings/duplicate.json', contents: secondRecipeData }
      ];
      const root2 = getLibraryDir(files2);

      expect(library.loadFromFileTreeSource({ directory: root2 })).toFailWith(/duplicate.*already exists/i);
    });

    test('returns 0 when load: false is specified', () => {
      const library = FillingsLibrary.create({ builtin: false }).orThrow();

      const files: FileTree.IInMemoryFile[] = [
        { path: '/library/data/fillings/test.json', contents: validRecipeData }
      ];
      const root = getLibraryDir(files);

      expect(library.loadFromFileTreeSource({ directory: root, load: false })).toSucceedWith(0);
      expect(library.collectionCount).toBe(0);
    });
  });

  // ============================================================================
  // Merge Libraries Tests
  // ============================================================================

  describe('mergeLibraries parameter', () => {
    test('merges single library into new library', () => {
      // Create a library with custom collections
      const existingLibrary = FillingsLibrary.create({
        builtin: false,
        collections: [
          {
            id: 'custom' as SourceId,
            isMutable: true,
            items: {
              testGanache: testRecipe
            }
          }
        ]
      }).orThrow();

      // Create a new library that merges the existing one
      expect(
        FillingsLibrary.create({
          builtin: false,
          mergeLibraries: existingLibrary
        })
      ).toSucceedAndSatisfy((lib) => {
        expect(lib.collectionCount).toBe(1);
        expect(lib.size).toBe(1);
        expect(lib.validating.has('custom.testGanache')).toBe(true);
      });
    });

    test('merges library with builtins', () => {
      // Create a library with custom collections
      const existingLibrary = FillingsLibrary.create({
        builtin: false,
        collections: [
          {
            id: 'custom' as SourceId,
            isMutable: true,
            items: {
              testGanache: testRecipe
            }
          }
        ]
      }).orThrow();

      // Create a new library that merges builtins + existing
      expect(
        FillingsLibrary.create({
          builtin: true,
          mergeLibraries: existingLibrary
        })
      ).toSucceedAndSatisfy((lib) => {
        // 1 builtin (common) + 1 custom
        expect(lib.collectionCount).toBe(2);
        expect(lib.validating.has('custom.testGanache')).toBe(true);
        expect(lib.validating.has('common.dark-ganache-classic')).toBe(true);
      });
    });

    test('merges multiple libraries', () => {
      // Create two libraries with different collections
      const lib1 = FillingsLibrary.create({
        builtin: false,
        collections: [
          {
            id: 'source1' as SourceId,
            isMutable: true,
            items: { testGanache: testRecipe }
          }
        ]
      }).orThrow();

      const lib2 = FillingsLibrary.create({
        builtin: false,
        collections: [
          {
            id: 'source2' as SourceId,
            isMutable: false,
            items: { testGanache: testRecipe }
          }
        ]
      }).orThrow();

      // Merge both
      expect(
        FillingsLibrary.create({
          builtin: false,
          mergeLibraries: [lib1, lib2]
        })
      ).toSucceedAndSatisfy((lib) => {
        expect(lib.collectionCount).toBe(2);
        expect(lib.validating.has('source1.testGanache')).toBe(true);
        expect(lib.validating.has('source2.testGanache')).toBe(true);
      });
    });

    test('merges library using IMergeLibrarySource without filter (defaults to all)', () => {
      // Create a library with custom collections
      const existingLibrary = FillingsLibrary.create({
        builtin: false,
        collections: [
          {
            id: 'collection1' as SourceId,
            isMutable: true,
            items: { testGanache: testRecipe }
          },
          {
            id: 'collection2' as SourceId,
            isMutable: true,
            items: { testGanache: testRecipe }
          }
        ]
      }).orThrow();

      // Merge using IMergeLibrarySource object but without filter (should default to all)
      expect(
        FillingsLibrary.create({
          builtin: false,
          mergeLibraries: {
            library: existingLibrary
            // filter is undefined, should default to true (include all)
          }
        })
      ).toSucceedAndSatisfy((lib) => {
        expect(lib.collectionCount).toBe(2);
        expect(lib.validating.has('collection1.testGanache')).toBe(true);
        expect(lib.validating.has('collection2.testGanache')).toBe(true);
      });
    });

    test('merges library with filter to include specific collections', () => {
      // Create a library with multiple collections
      const existingLibrary = FillingsLibrary.create({
        builtin: false,
        collections: [
          {
            id: 'include-me' as SourceId,
            isMutable: true,
            items: { testGanache: testRecipe }
          },
          {
            id: 'exclude-me' as SourceId,
            isMutable: true,
            items: { testGanache: testRecipe }
          }
        ]
      }).orThrow();

      // Merge with filter to include only 'include-me'
      expect(
        FillingsLibrary.create({
          builtin: false,
          mergeLibraries: {
            library: existingLibrary,
            filter: ['include-me' as SourceId]
          }
        })
      ).toSucceedAndSatisfy((lib) => {
        expect(lib.collectionCount).toBe(1);
        expect(lib.validating.has('include-me.testGanache')).toBe(true);
        expect(lib.validating.has('exclude-me.testGanache')).toBe(false);
      });
    });

    test('merges library with filter to exclude collections', () => {
      // Create a library with multiple collections
      const existingLibrary = FillingsLibrary.create({
        builtin: false,
        collections: [
          {
            id: 'keep-this' as SourceId,
            isMutable: true,
            items: { testGanache: testRecipe }
          },
          {
            id: 'remove-this' as SourceId,
            isMutable: true,
            items: { testGanache: testRecipe }
          }
        ]
      }).orThrow();

      // Merge with filter to exclude 'remove-this'
      expect(
        FillingsLibrary.create({
          builtin: false,
          mergeLibraries: {
            library: existingLibrary,
            filter: { excluded: ['remove-this'] }
          }
        })
      ).toSucceedAndSatisfy((lib) => {
        expect(lib.collectionCount).toBe(1);
        expect(lib.validating.has('keep-this.testGanache')).toBe(true);
        expect(lib.validating.has('remove-this.testGanache')).toBe(false);
      });
    });

    test('merges library with filter: false skips the library', () => {
      const existingLibrary = FillingsLibrary.create({
        builtin: false,
        collections: [
          {
            id: 'custom' as SourceId,
            isMutable: true,
            items: { testGanache: testRecipe }
          }
        ]
      }).orThrow();

      expect(
        FillingsLibrary.create({
          builtin: false,
          mergeLibraries: {
            library: existingLibrary,
            filter: false
          }
        })
      ).toSucceedAndSatisfy((lib) => {
        expect(lib.collectionCount).toBe(0);
        expect(lib.size).toBe(0);
      });
    });

    test('fails on collection ID collision between merged library and builtins', () => {
      // Create a library that has the same collection ID as a builtin
      const existingLibrary = FillingsLibrary.create({
        builtin: false,
        collections: [
          {
            id: 'common' as SourceId, // Same as builtin
            isMutable: true,
            items: { testGanache: testRecipe }
          }
        ]
      }).orThrow();

      expect(
        FillingsLibrary.create({
          builtin: true,
          mergeLibraries: existingLibrary
        })
      ).toFailWith(/common.*conflict/i);
    });

    test('fails on collection ID collision between merged libraries', () => {
      // Create two libraries with the same collection ID
      const lib1 = FillingsLibrary.create({
        builtin: false,
        collections: [
          {
            id: 'duplicate' as SourceId,
            isMutable: true,
            items: { testGanache: testRecipe }
          }
        ]
      }).orThrow();

      const lib2 = FillingsLibrary.create({
        builtin: false,
        collections: [
          {
            id: 'duplicate' as SourceId,
            isMutable: false,
            items: { testGanache: testRecipe }
          }
        ]
      }).orThrow();

      expect(
        FillingsLibrary.create({
          builtin: false,
          mergeLibraries: [lib1, lib2]
        })
      ).toFailWith(/duplicate.*conflict/i);
    });

    test('preserves mutability from merged collections', () => {
      const mutableLib = FillingsLibrary.create({
        builtin: false,
        collections: [
          {
            id: 'mutable-source' as SourceId,
            isMutable: true,
            items: { testGanache: testRecipe }
          }
        ]
      }).orThrow();

      const immutableLib = FillingsLibrary.create({
        builtin: false,
        collections: [
          {
            id: 'immutable-source' as SourceId,
            isMutable: false,
            items: { testGanache: testRecipe }
          }
        ]
      }).orThrow();

      expect(
        FillingsLibrary.create({
          builtin: false,
          mergeLibraries: [mutableLib, immutableLib]
        })
      ).toSucceedAndSatisfy((lib) => {
        expect(lib.collections.validating.get('mutable-source')).toSucceedAndSatisfy((coll) => {
          expect(coll.isMutable).toBe(true);
        });
        expect(lib.collections.validating.get('immutable-source')).toSucceedAndSatisfy((coll) => {
          expect(coll.isMutable).toBe(false);
        });
      });
    });
  });
});

// ============================================================================
// Recipe Scaling Tests
// ============================================================================

describe('Recipe scaling', () => {
  const testVersion: IFillingRecipeVersion = {
    versionSpec: '2026-01-01-01' as unknown as FillingVersionSpec,
    createdDate: '2026-01-01',
    ingredients: [
      { ingredient: { ids: ['source.choco' as IngredientId] }, amount: 100 as Measurement },
      { ingredient: { ids: ['source.cream' as IngredientId] }, amount: 50 as Measurement }
    ],
    baseWeight: 150 as Measurement
  };

  const testRecipe: IFillingRecipe = {
    baseId: 'test' as BaseFillingId,
    name: 'Test' as FillingName,
    category: 'ganache',
    versions: [testVersion],
    goldenVersionSpec: '2026-01-01-01' as unknown as FillingVersionSpec
  };

  const testFillingId = 'source.test' as FillingId;

  describe('scaleFillingRecipe', () => {
    test('scales ingredients proportionally', () => {
      expect(
        RuntimeInternal.scaleFillingRecipe(testRecipe, testFillingId, 300 as Measurement)
      ).toSucceedAndSatisfy((scaled) => {
        expect(scaled.scaledFrom.scaleFactor).toBe(2);
        expect(scaled.scaledFrom.targetWeight).toBe(300);
        expect(scaled.baseWeight).toBe(300);
        expect(scaled.ingredients[0].amount).toBe(200);
        expect(scaled.ingredients[1].amount).toBe(100);
      });
    });

    test('preserves original amounts', () => {
      expect(
        RuntimeInternal.scaleFillingRecipe(testRecipe, testFillingId, 300 as Measurement)
      ).toSucceedAndSatisfy((scaled) => {
        expect(scaled.ingredients[0].originalAmount).toBe(100);
      });
    });

    test('includes scaling source information', () => {
      expect(
        RuntimeInternal.scaleFillingRecipe(testRecipe, testFillingId, 300 as Measurement)
      ).toSucceedAndSatisfy((scaled) => {
        expect(scaled.scaledFrom.sourceVersionId).toBe('source.test@2026-01-01-01');
        expect(scaled.scaledFrom.scaleFactor).toBe(2);
        expect(scaled.scaledFrom.targetWeight).toBe(300);
      });
    });

    test('includes createdDate', () => {
      expect(
        RuntimeInternal.scaleFillingRecipe(testRecipe, testFillingId, 300 as Measurement)
      ).toSucceedAndSatisfy((scaled) => {
        expect(scaled.createdDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      });
    });

    test('preserves optional fields from source version', () => {
      const testNotes: CommonModel.ICategorizedNote[] = [
        { category: 'user' as NoteCategory, note: 'Test notes' }
      ];
      const versionWithNotes: IFillingRecipeVersion = {
        ...testVersion,
        notes: testNotes,
        yield: '20 bonbons'
      };
      const recipeWithNotes: IFillingRecipe = {
        ...testRecipe,
        versions: [versionWithNotes]
      };
      expect(
        RuntimeInternal.scaleFillingRecipe(recipeWithNotes, testFillingId, 300 as Measurement)
      ).toSucceedAndSatisfy((scaled) => {
        expect(scaled.notes).toEqual(testNotes);
        expect(scaled.yield).toBe('20 bonbons');
      });
    });

    test('fails with zero target weight', () => {
      expect(RuntimeInternal.scaleFillingRecipe(testRecipe, testFillingId, 0 as Measurement)).toFailWith(
        /greater than zero/
      );
    });

    test('fails with negative target weight', () => {
      expect(RuntimeInternal.scaleFillingRecipe(testRecipe, testFillingId, -100 as Measurement)).toFailWith(
        /greater than zero/
      );
    });

    test('fails with invalid version ID', () => {
      expect(
        RuntimeInternal.scaleFillingRecipe(testRecipe, testFillingId, 300 as Measurement, {
          versionSpec: '2026-12-31-99' as unknown as FillingVersionSpec
        })
      ).toFailWith(/not found/);
    });

    test('respects precision option', () => {
      expect(
        RuntimeInternal.scaleFillingRecipe(testRecipe, testFillingId, 333 as Measurement, { precision: 0 })
      ).toSucceedAndSatisfy((scaled) => {
        expect(Number.isInteger(scaled.ingredients[0].amount)).toBe(true);
      });
    });

    test('respects minimumAmount option', () => {
      // Scale to very small amount that would be below minimum
      expect(
        RuntimeInternal.scaleFillingRecipe(testRecipe, testFillingId, 15 as Measurement, {
          minimumAmount: 5 as Measurement
        })
      ).toSucceedAndSatisfy((scaled) => {
        // Scaled amount would be 10 * 0.1 = 1, but minimum is 5
        expect(scaled.ingredients[0].amount).toBeGreaterThanOrEqual(5);
      });
    });

    test('scales ingredients with explicit unit', () => {
      const versionWithUnits: IFillingRecipeVersion = {
        versionSpec: '2026-01-01-01' as unknown as FillingVersionSpec,
        createdDate: '2026-01-01',
        ingredients: [
          { ingredient: { ids: ['source.choco' as IngredientId] }, amount: 100 as Measurement, unit: 'g' },
          { ingredient: { ids: ['source.cream' as IngredientId] }, amount: 50 as Measurement, unit: 'mL' }
        ],
        baseWeight: 150 as Measurement
      };
      const recipeWithUnits: IFillingRecipe = {
        ...testRecipe,
        versions: [versionWithUnits]
      };
      expect(
        RuntimeInternal.scaleFillingRecipe(recipeWithUnits, testFillingId, 300 as Measurement)
      ).toSucceedAndSatisfy((scaled) => {
        expect(scaled.ingredients[0].unit).toBe('g');
        expect(scaled.ingredients[1].unit).toBe('mL');
        expect(scaled.ingredients[0].amount).toBe(200);
        expect(scaled.ingredients[1].amount).toBe(100);
      });
    });
  });

  describe('scaleFillingRecipeByFactor', () => {
    test('scales by factor', () => {
      expect(RuntimeInternal.scaleFillingRecipeByFactor(testRecipe, testFillingId, 0.5)).toSucceedAndSatisfy(
        (scaled) => {
          expect(scaled.scaledFrom.scaleFactor).toBe(0.5);
          expect(scaled.ingredients[0].amount).toBe(50);
        }
      );
    });

    test('fails with zero factor', () => {
      expect(RuntimeInternal.scaleFillingRecipeByFactor(testRecipe, testFillingId, 0)).toFailWith(
        /greater than zero/
      );
    });

    test('fails with negative factor', () => {
      expect(RuntimeInternal.scaleFillingRecipeByFactor(testRecipe, testFillingId, -1)).toFailWith(
        /greater than zero/
      );
    });

    test('fails with invalid version ID', () => {
      expect(
        RuntimeInternal.scaleFillingRecipeByFactor(testRecipe, testFillingId, 0.5, {
          versionSpec: '2026-12-31-99' as unknown as FillingVersionSpec
        })
      ).toFailWith(/not found/);
    });
  });

  // ============================================================================
  // Type Guards Tests
  // ============================================================================

  describe('type guards', () => {
    test('isFillingRecipeVersion returns true for regular versions', () => {
      expect(Fillings.isFillingRecipeVersion(testVersion)).toBe(true);
      expect(Fillings.isScaledFillingRecipeVersion(testVersion)).toBe(false);
    });

    test('isScaledFillingRecipeVersion returns true for persistence-format scaled versions', () => {
      // IScaledFillingRecipeVersion is the reference-based persistence format
      const scaledVersion: Fillings.IScaledFillingRecipeVersion = {
        scalingRef: {
          sourceVersionId: 'source.test@2026-01-01-01' as FillingVersionId,
          scaleFactor: 2,
          targetWeight: 300 as Measurement,
          createdDate: '2026-01-15'
        }
      };
      expect(Fillings.isScaledFillingRecipeVersion(scaledVersion)).toBe(true);
      expect(Fillings.isFillingRecipeVersion(scaledVersion)).toBe(false);
    });
  });

  describe('edge cases', () => {
    test('scaleFillingRecipe fails with zero baseWeight', () => {
      const zeroWeightVersion: IFillingRecipeVersion = {
        versionSpec: '2026-01-01-01' as unknown as FillingVersionSpec,
        createdDate: '2026-01-01',
        ingredients: [],
        baseWeight: 0 as Measurement
      };
      const zeroWeightRecipe: IFillingRecipe = {
        baseId: 'zero' as BaseFillingId,
        name: 'Zero' as FillingName,
        category: 'ganache',
        versions: [zeroWeightVersion],
        goldenVersionSpec: '2026-01-01-01' as unknown as FillingVersionSpec
      };
      const zeroFillingId = 'source.zero' as FillingId;
      expect(
        RuntimeInternal.scaleFillingRecipe(zeroWeightRecipe, zeroFillingId, 100 as Measurement)
      ).toFailWith(/base weight must be greater than zero/);
    });
  });

  describe('calculateBaseWeight', () => {
    test('sums ingredient amounts', () => {
      expect(RuntimeInternal.calculateBaseWeight(testVersion)).toBe(150);
    });
  });

  describe('recalculateFillingRecipeVersion', () => {
    test('updates baseWeight from ingredients', () => {
      const version: IFillingRecipeVersion = {
        ...testVersion,
        baseWeight: 999 as Measurement // Wrong value
      };
      const recalced = RuntimeInternal.recalculateFillingRecipeVersion(version);
      expect(recalced.baseWeight).toBe(150);
    });
  });

  // ============================================================================
  // Async Creation Tests (with encryption support)
  // ============================================================================

  describe('createAsync', () => {
    // Test secret for encryption tests (not a real secret - for testing only)
    const TEST_SECRET_NAME = 'test-secret';
    let testKey: Uint8Array;

    beforeAll(async () => {
      // Generate a test key for encryption tests
      testKey = (await CryptoUtils.nodeCryptoProvider.generateKey()).orThrow();
    });

    test('creates library with built-ins using onMissingKey skip mode', async () => {
      // When loading built-ins with encrypted files but no key, use onMissingKey: 'skip'
      const result = await FillingsLibrary.createAsync({
        encryption: {
          cryptoProvider: CryptoUtils.nodeCryptoProvider,
          onMissingKey: 'skip' // Skip encrypted files that we don't have keys for
        }
      });
      expect(result).toSucceedAndSatisfy((lib) => {
        // Should have at least the common built-in collection (fgv is skipped since no key)
        expect(lib.collections.has('common' as SourceId)).toBe(true);
      });
    });

    test('captures encrypted built-ins when no encryption config provided', async () => {
      // Without any encryption config, encrypted built-ins are captured (not decrypted)
      // The library should succeed with the non-encrypted collections
      const result = await FillingsLibrary.createAsync();
      expect(result).toSucceedAndSatisfy((lib) => {
        // Should have the common built-in collection (fgv is captured as protected)
        expect(lib.collections.has('common' as SourceId)).toBe(true);
      });
    });

    test('creates library without built-ins when builtin: false', async () => {
      const result = await FillingsLibrary.createAsync({ builtin: false });
      expect(result).toSucceedAndSatisfy((lib) => {
        expect(lib.collections.size).toBe(0);
      });
    });

    test('creates library with file sources', async () => {
      const files: FileTree.IInMemoryFile[] = [
        {
          path: '/data/fillings/external.json',
          contents: {
            items: {
              // eslint-disable-next-line @typescript-eslint/naming-convention
              'external-recipe': {
                baseId: 'external-recipe',
                name: 'External Recipe',
                category: 'ganache',
                versions: [
                  {
                    versionSpec: '2026-01-01-01',
                    createdDate: '2026-01-01',
                    ingredients: [{ ingredient: { ids: ['common.butter-82'] }, amount: 100 }],
                    baseWeight: 100
                  }
                ],
                goldenVersionSpec: '2026-01-01-01'
              }
            }
          } as unknown as JsonObject
        }
      ];

      const tree = FileTree.inMemory(files).orThrow();
      const rootDir = tree.getItem('/').orThrow();
      const fileSource: Fillings.IFillingFileTreeSource = {
        directory: rootDir as FileTree.IFileTreeDirectoryItem,
        mutable: true
      };

      const result = await FillingsLibrary.createAsync({
        builtin: false,
        fileSources: fileSource
      });

      expect(result).toSucceedAndSatisfy((lib) => {
        expect(lib.collections.has('external' as SourceId)).toBe(true);
        expect(lib.get('external.external-recipe' as FillingId)).toSucceed();
      });
    });

    test('decrypts encrypted file sources with encryption config', async () => {
      // Create encrypted recipe data
      const secretRecipeData = {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        'secret-recipe': {
          baseId: 'secret-recipe',
          name: 'Secret Recipe',
          category: 'ganache',
          versions: [
            {
              versionSpec: '2026-01-01-01',
              createdDate: '2026-01-01',
              ingredients: [{ ingredient: { ids: ['common.butter-82'] }, amount: 50 }],
              baseWeight: 50
            }
          ],
          goldenVersionSpec: '2026-01-01-01'
        }
      };

      const encryptedFile = (
        await CryptoUtils.createEncryptedFile({
          content: secretRecipeData,
          secretName: TEST_SECRET_NAME,
          key: testKey,
          cryptoProvider: CryptoUtils.nodeCryptoProvider
        })
      ).orThrow();

      const files: FileTree.IInMemoryFile[] = [
        {
          path: '/data/fillings/secret.json',
          contents: encryptedFile as unknown as JsonObject
        }
      ];

      const tree = FileTree.inMemory(files).orThrow();
      const rootDir = tree.getItem('/').orThrow();
      const fileSource: Fillings.IFillingFileTreeSource = {
        directory: rootDir as FileTree.IFileTreeDirectoryItem,
        mutable: false
      };

      const result = await FillingsLibrary.createAsync({
        builtin: false,
        fileSources: fileSource,
        encryption: {
          secrets: [{ name: TEST_SECRET_NAME, key: testKey }],
          cryptoProvider: CryptoUtils.nodeCryptoProvider
        }
      });

      expect(result).toSucceedAndSatisfy((lib) => {
        expect(lib.collections.has('secret' as SourceId)).toBe(true);
        expect(lib.get('secret.secret-recipe' as FillingId)).toSucceedAndSatisfy((recipe) => {
          expect(recipe.name).toBe('Secret Recipe');
        });
      });
    });

    test('captures encrypted files when no encryption config provided', async () => {
      const secretRecipeData = {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        'secret-recipe': {
          baseId: 'secret-recipe',
          name: 'Secret Recipe',
          category: 'ganache',
          versions: [
            {
              versionSpec: '2026-01-01-01',
              createdDate: '2026-01-01',
              ingredients: [{ ingredient: { ids: ['common.butter-82'] }, amount: 50 }],
              baseWeight: 50
            }
          ],
          goldenVersionSpec: '2026-01-01-01'
        }
      };

      const encryptedFile = (
        await CryptoUtils.createEncryptedFile({
          content: secretRecipeData,
          secretName: TEST_SECRET_NAME,
          key: testKey,
          cryptoProvider: CryptoUtils.nodeCryptoProvider
        })
      ).orThrow();

      const files: FileTree.IInMemoryFile[] = [
        {
          path: '/data/fillings/secret.json',
          contents: encryptedFile as unknown as JsonObject
        }
      ];

      const tree = FileTree.inMemory(files).orThrow();
      const rootDir = tree.getItem('/').orThrow();
      const fileSource: Fillings.IFillingFileTreeSource = {
        directory: rootDir as FileTree.IFileTreeDirectoryItem,
        mutable: false
      };

      // Without encryption config, encrypted files are captured (not decrypted)
      const result = await FillingsLibrary.createAsync({
        builtin: false,
        fileSources: fileSource
      });

      // Should succeed with the encrypted file captured as a protected collection
      expect(result).toSucceedAndSatisfy((lib) => {
        // No decrypted collections since no encryption config
        expect(lib.collections.size).toBe(0);
      });
    });

    test('handles mixed encrypted and plain files', async () => {
      const plainRecipeData = {
        items: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          'plain-recipe': {
            baseId: 'plain-recipe',
            name: 'Plain Recipe',
            category: 'ganache',
            versions: [
              {
                versionSpec: '2026-01-01-01',
                createdDate: '2026-01-01',
                ingredients: [{ ingredient: { ids: ['common.butter-82'] }, amount: 25 }],
                baseWeight: 25
              }
            ],
            goldenVersionSpec: '2026-01-01-01'
          }
        }
      };

      const secretRecipeData = {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        'secret-recipe': {
          baseId: 'secret-recipe',
          name: 'Secret Recipe',
          category: 'ganache',
          versions: [
            {
              versionSpec: '2026-01-01-01',
              createdDate: '2026-01-01',
              ingredients: [{ ingredient: { ids: ['common.butter-82'] }, amount: 75 }],
              baseWeight: 75
            }
          ],
          goldenVersionSpec: '2026-01-01-01'
        }
      };

      const encryptedFile = (
        await CryptoUtils.createEncryptedFile({
          content: secretRecipeData,
          secretName: TEST_SECRET_NAME,
          key: testKey,
          cryptoProvider: CryptoUtils.nodeCryptoProvider
        })
      ).orThrow();

      const files: FileTree.IInMemoryFile[] = [
        {
          path: '/data/fillings/plain.json',
          contents: plainRecipeData as unknown as JsonObject
        },
        {
          path: '/data/fillings/secret.json',
          contents: encryptedFile as unknown as JsonObject
        }
      ];

      const tree = FileTree.inMemory(files).orThrow();
      const rootDir = tree.getItem('/').orThrow();
      const fileSource: Fillings.IFillingFileTreeSource = {
        directory: rootDir as FileTree.IFileTreeDirectoryItem,
        mutable: false
      };

      const result = await FillingsLibrary.createAsync({
        builtin: false,
        fileSources: fileSource,
        encryption: {
          secrets: [{ name: TEST_SECRET_NAME, key: testKey }],
          cryptoProvider: CryptoUtils.nodeCryptoProvider
        }
      });

      expect(result).toSucceedAndSatisfy((lib) => {
        // Both collections should be loaded
        expect(lib.collections.has('plain' as SourceId)).toBe(true);
        expect(lib.collections.has('secret' as SourceId)).toBe(true);
        expect(lib.get('plain.plain-recipe' as FillingId)).toSucceed();
        expect(lib.get('secret.secret-recipe' as FillingId)).toSucceed();
      });
    });
  });
});
