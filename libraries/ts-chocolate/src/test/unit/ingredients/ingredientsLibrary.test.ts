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

import { BaseIngredientId, IngredientId, Percentage, SourceId } from '../../../packlets/common';

import {
  IngredientsLibrary,
  Ingredient,
  IIngredient,
  IGanacheCharacteristics,
  IIngredientFileTreeSource,
  isChocolateIngredient,
  isDairyIngredient,
  isFatIngredient,
  isSugarIngredient,
  isAlcoholIngredient
} from '../../../packlets/ingredients';

describe('IngredientsLibrary', () => {
  // ============================================================================
  // Test Data
  // ============================================================================

  const testCharacteristics: IGanacheCharacteristics = {
    cacaoFat: 36 as Percentage,
    sugar: 34 as Percentage,
    milkFat: 0 as Percentage,
    water: 1 as Percentage,
    solids: 29 as Percentage,
    otherFats: 0 as Percentage
  };

  const testIngredient: IIngredient = {
    baseId: 'test-choco' as BaseIngredientId,
    name: 'Test Chocolate',
    category: 'chocolate',
    ganacheCharacteristics: testCharacteristics
  };

  // ============================================================================
  // Creation Tests
  // ============================================================================

  describe('create', () => {
    test('creates empty library with builtin: false', () => {
      expect(IngredientsLibrary.create({ builtin: false })).toSucceedAndSatisfy((lib) => {
        expect(lib.size).toBe(0);
        expect(lib.collectionCount).toBe(0);
      });
    });

    test('creates library with built-ins by default', () => {
      expect(IngredientsLibrary.create()).toSucceedAndSatisfy((lib) => {
        expect(lib.size).toBeGreaterThan(0);
        expect(lib.collectionCount).toBe(4);
      });
    });

    test('creates library with additional collections', () => {
      const result = IngredientsLibrary.create({
        builtin: false,
        collections: [
          {
            id: 'test' as SourceId,
            isMutable: true,
            items: {
              testChoco: testIngredient
            }
          }
        ]
      });

      expect(result).toSucceedAndSatisfy((lib) => {
        expect(lib.size).toBe(1);
        expect(lib.collectionCount).toBe(1);
      });
    });

    test('combines built-ins with additional collections', () => {
      const result = IngredientsLibrary.create({
        collections: [
          {
            id: 'test' as SourceId,
            isMutable: true,
            items: {
              testChoco: testIngredient
            }
          }
        ]
      });

      expect(result).toSucceedAndSatisfy((lib) => {
        expect(lib.collectionCount).toBe(5); // 4 built-in + 1 custom
        expect(lib.validating.has('test.testChoco')).toBe(true);
        expect(lib.validating.has('common.heavy-cream-35')).toBe(true);
      });
    });
  });

  describe('builtin parameter', () => {
    test('includes common ingredients', () => {
      expect(IngredientsLibrary.create()).toSucceedAndSatisfy((lib) => {
        expect(lib.validating.has('common.heavy-cream-35')).toBe(true);
      });
    });

    test('includes felchlin ingredients', () => {
      expect(IngredientsLibrary.create()).toSucceedAndSatisfy((lib) => {
        expect(lib.validating.has('felchlin.maracaibo-65')).toBe(true);
      });
    });

    test('loads specific built-in collections with array', () => {
      expect(
        IngredientsLibrary.create({
          builtin: ['common' as SourceId, 'felchlin' as SourceId]
        })
      ).toSucceedAndSatisfy((lib) => {
        expect(lib.collectionCount).toBe(2);
        expect(lib.validating.has('common.heavy-cream-35')).toBe(true);
        expect(lib.validating.has('felchlin.maracaibo-65')).toBe(true);
      });
    });

    test('loads built-ins with fine-grained params', () => {
      expect(
        IngredientsLibrary.create({
          builtin: {
            excluded: ['guittard', 'cacao-barry']
          }
        })
      ).toSucceedAndSatisfy((lib) => {
        expect(lib.collectionCount).toBe(2);
        expect(lib.validating.has('common.heavy-cream-35')).toBe(true);
        expect(lib.validating.has('felchlin.maracaibo-65')).toBe(true);
      });
    });
  });

  // ============================================================================
  // Lookup Tests
  // ============================================================================

  describe('get and has', () => {
    let library: IngredientsLibrary;

    beforeEach(() => {
      library = IngredientsLibrary.create().orThrow();
    });

    test('gets existing ingredient', () => {
      const id = 'felchlin.maracaibo-65';
      expect(library.validating.get(id)).toSucceedAndSatisfy((ingredient) => {
        expect(ingredient.name).toBe('Felchlin Maracaibo Clasificado 65%');
      });
    });

    test('fails for non-existent ingredient', () => {
      const id = 'felchlin.nonexistent' as IngredientId;
      expect(library.get(id)).toFail();
    });

    test('has returns true for existing ingredient', () => {
      expect(library.has('felchlin.maracaibo-65' as IngredientId)).toBe(true);
    });

    test('has returns false for non-existent ingredient', () => {
      expect(library.has('felchlin.nonexistent' as IngredientId)).toBe(false);
    });
  });

  // ============================================================================
  // Iteration Tests
  // ============================================================================

  describe('iteration', () => {
    let library: IngredientsLibrary;

    beforeEach(() => {
      library = IngredientsLibrary.create().orThrow();
    });

    test('entries iterates all items', () => {
      const entries = Array.from(library.entries());
      expect(entries.length).toBe(library.size);
      // KeyValueEntry is a tuple [key, value]
      expect(entries[0]).toHaveLength(2);
      expect(typeof entries[0][0]).toBe('string');
    });

    test('keys iterates all keys', () => {
      const keys = Array.from(library.keys());
      expect(keys.length).toBe(library.size);
      expect(keys.every((k) => typeof k === 'string')).toBe(true);
    });

    test('values iterates all values', () => {
      const values = Array.from(library.values());
      expect(values.length).toBe(library.size);
      expect(values.every((v) => typeof v.name === 'string')).toBe(true);
    });

    test('Symbol.iterator works', () => {
      const items = Array.from(library);
      expect(items.length).toBe(library.size);
    });
  });

  // ============================================================================
  // Mutation Tests
  // ============================================================================

  describe('mutation', () => {
    let library: IngredientsLibrary;

    beforeEach(() => {
      library = IngredientsLibrary.create({
        builtin: false,
        collections: [
          {
            id: 'test' as SourceId,
            isMutable: true,
            items: {}
          }
        ]
      }).orThrow();
    });

    test('add succeeds for new ingredient', () => {
      const id = 'test.new-choco' as IngredientId;
      expect(library.add(id, testIngredient)).toSucceed();
      expect(library.has(id)).toBe(true);
    });

    test('add fails for duplicate ingredient', () => {
      const id = 'test.new-choco' as IngredientId;
      library.add(id, testIngredient).orThrow();
      expect(library.add(id, testIngredient)).toFail();
    });

    test('set adds or updates ingredient', () => {
      const id = 'test.set-choco' as IngredientId;
      expect(library.set(id, testIngredient)).toSucceed();
      expect(library.has(id)).toBe(true);

      const updated = { ...testIngredient, name: 'Updated Name' };
      expect(library.set(id, updated)).toSucceed();
      expect(library.get(id)).toSucceedAndSatisfy((ing) => {
        expect(ing.name).toBe('Updated Name');
      });
    });

    test('update fails for non-existent ingredient', () => {
      const id = 'test.nonexistent' as IngredientId;
      expect(library.update(id, testIngredient)).toFail();
    });

    test('update succeeds for existing ingredient', () => {
      const id = 'test.update-choco' as IngredientId;
      library.add(id, testIngredient).orThrow();

      const updated = { ...testIngredient, name: 'Updated Name' };
      expect(library.update(id, updated)).toSucceed();
    });

    test('delete removes ingredient', () => {
      const id = 'test.delete-choco' as IngredientId;
      library.add(id, testIngredient).orThrow();
      expect(library.delete(id)).toSucceed();
      expect(library.has(id)).toBe(false);
    });

    test('delete fails for non-existent ingredient', () => {
      expect(library.delete('test.nonexistent' as IngredientId)).toFail();
    });
  });

  describe('mutation of immutable collections', () => {
    let library: IngredientsLibrary;

    beforeEach(() => {
      // Built-in collections are always immutable
      library = IngredientsLibrary.create().orThrow();
    });

    test('add fails for immutable collection', () => {
      const id = 'felchlin.new-choco' as IngredientId;
      expect(library.add(id, testIngredient)).toFail();
    });

    test('set fails for immutable collection', () => {
      const id = 'felchlin.maracaibo-65' as IngredientId;
      expect(library.set(id, testIngredient)).toFail();
    });

    test('delete fails for immutable collection', () => {
      const id = 'felchlin.maracaibo-65' as IngredientId;
      expect(library.delete(id)).toFail();
    });
  });

  // ============================================================================
  // Collection Management Tests
  // ============================================================================

  describe('collection management', () => {
    let library: IngredientsLibrary;

    beforeEach(() => {
      library = IngredientsLibrary.create({ builtin: false }).orThrow();
    });

    test('addCollectionEntry adds a collection', () => {
      expect(
        library.addCollectionEntry({
          id: 'new-source' as SourceId,
          isMutable: true,
          items: { testItem: testIngredient }
        })
      ).toSucceed();
      expect(library.collectionCount).toBe(1);
    });

    test('addCollectionWithItems adds a collection', () => {
      expect(library.addCollectionWithItems('custom', [['item1', testIngredient]])).toSucceed();
      expect(library.collectionCount).toBe(1);
    });

    test('composeId creates valid composite ID', () => {
      expect(library.composeId('source' as SourceId, 'base' as BaseIngredientId)).toSucceedWith(
        'source.base' as IngredientId
      );
    });
  });

  // ============================================================================
  // Validating Access Tests
  // ============================================================================

  describe('validating access', () => {
    let library: IngredientsLibrary;

    beforeEach(() => {
      library = IngredientsLibrary.create().orThrow();
    });

    test('validating.get converts string key', () => {
      expect(library.validating.get('felchlin.maracaibo-65')).toSucceed();
    });

    test('validating.has works with string key', () => {
      expect(library.validating.has('felchlin.maracaibo-65')).toBe(true);
      expect(library.validating.has('nonexistent.id')).toBe(false);
    });
  });

  // ============================================================================
  // Collections Access Tests
  // ============================================================================

  describe('collections access', () => {
    let library: IngredientsLibrary;

    beforeEach(() => {
      library = IngredientsLibrary.create().orThrow();
    });

    test('collections returns readonly map', () => {
      const collections = library.collections;
      expect(collections.validating.has('common')).toBe(true);
      expect(collections.validating.has('felchlin')).toBe(true);
    });
  });

  // ============================================================================
  // File Source Loading Tests
  // ============================================================================

  describe('fileSources parameter', () => {
    // Valid ingredient JSON data for testing
    /* eslint-disable @typescript-eslint/naming-convention */
    const validIngredientData = {
      'test-chocolate': {
        baseId: 'test-chocolate',
        name: 'Test Chocolate',
        category: 'chocolate',
        chocolateType: 'dark',
        cacaoPercentage: 65,
        ganacheCharacteristics: {
          cacaoFat: 36,
          sugar: 34,
          milkFat: 0,
          water: 1,
          solids: 29,
          otherFats: 0
        }
      }
    };

    const secondIngredientData = {
      'other-chocolate': {
        baseId: 'other-chocolate',
        name: 'Other Chocolate',
        category: 'chocolate',
        chocolateType: 'milk',
        cacaoPercentage: 40,
        ganacheCharacteristics: {
          cacaoFat: 30,
          sugar: 40,
          milkFat: 5,
          water: 1,
          solids: 24,
          otherFats: 0
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
        { path: '/library/data/ingredients/test-source.json', contents: validIngredientData }
      ];
      const root = getLibraryDir(files);

      expect(
        IngredientsLibrary.create({
          builtin: false,
          fileSources: { directory: root }
        })
      ).toSucceedAndSatisfy((lib) => {
        expect(lib.collectionCount).toBe(1);
        expect(lib.size).toBe(1);
        expect(lib.validating.has('test-source.test-chocolate')).toBe(true);
      });
    });

    test('creates library with array of file sources', () => {
      const files1: FileTree.IInMemoryFile[] = [
        { path: '/library/data/ingredients/source1.json', contents: validIngredientData }
      ];
      const files2: FileTree.IInMemoryFile[] = [
        { path: '/library/data/ingredients/source2.json', contents: secondIngredientData }
      ];
      const root1 = getLibraryDir(files1);
      const root2 = getLibraryDir(files2);

      expect(
        IngredientsLibrary.create({
          builtin: false,
          fileSources: [{ directory: root1 }, { directory: root2 }]
        })
      ).toSucceedAndSatisfy((lib) => {
        expect(lib.collectionCount).toBe(2);
        expect(lib.size).toBe(2);
        expect(lib.validating.has('source1.test-chocolate')).toBe(true);
        expect(lib.validating.has('source2.other-chocolate')).toBe(true);
      });
    });

    test('merges file sources with builtins', () => {
      const files: FileTree.IInMemoryFile[] = [
        { path: '/library/data/ingredients/custom-source.json', contents: validIngredientData }
      ];
      const root = getLibraryDir(files);

      expect(
        IngredientsLibrary.create({
          builtin: true,
          fileSources: { directory: root }
        })
      ).toSucceedAndSatisfy((lib) => {
        // 4 builtins + 1 custom
        expect(lib.collectionCount).toBe(5);
        expect(lib.validating.has('custom-source.test-chocolate')).toBe(true);
        expect(lib.validating.has('felchlin.maracaibo-65')).toBe(true);
      });
    });

    test('fails on collection ID collision', () => {
      // Create two file sources with the same collection ID
      const files1: FileTree.IInMemoryFile[] = [
        { path: '/library/data/ingredients/duplicate.json', contents: validIngredientData }
      ];
      const files2: FileTree.IInMemoryFile[] = [
        { path: '/library/data/ingredients/duplicate.json', contents: secondIngredientData }
      ];
      const root1 = getLibraryDir(files1);
      const root2 = getLibraryDir(files2);

      expect(
        IngredientsLibrary.create({
          builtin: false,
          fileSources: [{ directory: root1 }, { directory: root2 }]
        })
      ).toFailWith(/duplicate.*conflict/i);
    });

    test('respects mutable setting from file source', () => {
      const files: FileTree.IInMemoryFile[] = [
        { path: '/library/data/ingredients/mutable-source.json', contents: validIngredientData }
      ];
      const root = getLibraryDir(files);
      const source: IIngredientFileTreeSource = {
        directory: root,
        mutable: true
      };

      expect(
        IngredientsLibrary.create({
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
        { path: '/library/data/ingredients/skipped.json', contents: validIngredientData }
      ];
      const root = getLibraryDir(files);

      expect(
        IngredientsLibrary.create({
          builtin: false,
          fileSources: { directory: root, load: false }
        })
      ).toSucceedAndSatisfy((lib) => {
        expect(lib.collectionCount).toBe(0);
        expect(lib.size).toBe(0);
      });
    });

    test('fails when ingredients directory does not exist and source is enabled', () => {
      // Create a file tree without data/ingredients directory
      const files: FileTree.IInMemoryFile[] = [{ path: '/library/readme.txt', contents: 'empty' }];
      const root = getLibraryDir(files);

      expect(
        IngredientsLibrary.create({
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
    const validIngredientData = {
      'test-chocolate': {
        baseId: 'test-chocolate',
        name: 'Test Chocolate',
        category: 'chocolate',
        chocolateType: 'dark',
        cacaoPercentage: 65,
        ganacheCharacteristics: {
          cacaoFat: 36,
          sugar: 34,
          milkFat: 0,
          water: 1,
          solids: 29,
          otherFats: 0
        }
      }
    };

    const secondIngredientData = {
      'other-chocolate': {
        baseId: 'other-chocolate',
        name: 'Other Chocolate',
        category: 'chocolate',
        chocolateType: 'milk',
        cacaoPercentage: 40,
        ganacheCharacteristics: {
          cacaoFat: 30,
          sugar: 40,
          milkFat: 5,
          water: 1,
          solids: 24,
          otherFats: 0
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
      const library = IngredientsLibrary.create({ builtin: false }).orThrow();
      expect(library.collectionCount).toBe(0);

      // Load from file source
      const files: FileTree.IInMemoryFile[] = [
        { path: '/library/data/ingredients/test-source.json', contents: validIngredientData }
      ];
      const root = getLibraryDir(files);

      expect(library.loadFromFileTreeSource({ directory: root })).toSucceedWith(1);
      expect(library.collectionCount).toBe(1);
      expect(library.validating.has('test-source.test-chocolate')).toBe(true);
    });

    test('can load multiple file sources incrementally', () => {
      const library = IngredientsLibrary.create({ builtin: false }).orThrow();

      // Load first source
      const files1: FileTree.IInMemoryFile[] = [
        { path: '/library/data/ingredients/source1.json', contents: validIngredientData }
      ];
      const root1 = getLibraryDir(files1);
      expect(library.loadFromFileTreeSource({ directory: root1 })).toSucceedWith(1);

      // Load second source
      const files2: FileTree.IInMemoryFile[] = [
        { path: '/library/data/ingredients/source2.json', contents: secondIngredientData }
      ];
      const root2 = getLibraryDir(files2);
      expect(library.loadFromFileTreeSource({ directory: root2 })).toSucceedWith(1);

      expect(library.collectionCount).toBe(2);
      expect(library.validating.has('source1.test-chocolate')).toBe(true);
      expect(library.validating.has('source2.other-chocolate')).toBe(true);
    });

    test('fails on collection ID collision with existing collection', () => {
      // Create library with one collection
      const files1: FileTree.IInMemoryFile[] = [
        { path: '/library/data/ingredients/duplicate.json', contents: validIngredientData }
      ];
      const root1 = getLibraryDir(files1);
      const library = IngredientsLibrary.create({
        builtin: false,
        fileSources: { directory: root1 }
      }).orThrow();

      expect(library.collectionCount).toBe(1);

      // Try to load a source with the same collection ID
      const files2: FileTree.IInMemoryFile[] = [
        { path: '/library/data/ingredients/duplicate.json', contents: secondIngredientData }
      ];
      const root2 = getLibraryDir(files2);

      expect(library.loadFromFileTreeSource({ directory: root2 })).toFailWith(/duplicate.*already exists/i);
    });

    test('returns 0 when load: false is specified', () => {
      const library = IngredientsLibrary.create({ builtin: false }).orThrow();

      const files: FileTree.IInMemoryFile[] = [
        { path: '/library/data/ingredients/test.json', contents: validIngredientData }
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
      const existingLibrary = IngredientsLibrary.create({
        builtin: false,
        collections: [
          {
            id: 'custom' as SourceId,
            isMutable: true,
            items: {
              testChoco: testIngredient
            }
          }
        ]
      }).orThrow();

      // Create a new library that merges the existing one
      expect(
        IngredientsLibrary.create({
          builtin: false,
          mergeLibraries: existingLibrary
        })
      ).toSucceedAndSatisfy((lib) => {
        expect(lib.collectionCount).toBe(1);
        expect(lib.size).toBe(1);
        expect(lib.validating.has('custom.testChoco')).toBe(true);
      });
    });

    test('merges library with builtins', () => {
      // Create a library with custom collections
      const existingLibrary = IngredientsLibrary.create({
        builtin: false,
        collections: [
          {
            id: 'custom' as SourceId,
            isMutable: true,
            items: {
              testChoco: testIngredient
            }
          }
        ]
      }).orThrow();

      // Create a new library that merges builtins + existing
      expect(
        IngredientsLibrary.create({
          builtin: true,
          mergeLibraries: existingLibrary
        })
      ).toSucceedAndSatisfy((lib) => {
        // 4 builtins + 1 custom
        expect(lib.collectionCount).toBe(5);
        expect(lib.validating.has('custom.testChoco')).toBe(true);
        expect(lib.validating.has('felchlin.maracaibo-65')).toBe(true);
      });
    });

    test('merges multiple libraries', () => {
      // Create two libraries with different collections
      const lib1 = IngredientsLibrary.create({
        builtin: false,
        collections: [
          {
            id: 'source1' as SourceId,
            isMutable: true,
            items: { testChoco: testIngredient }
          }
        ]
      }).orThrow();

      const lib2 = IngredientsLibrary.create({
        builtin: false,
        collections: [
          {
            id: 'source2' as SourceId,
            isMutable: false,
            items: { testChoco: testIngredient }
          }
        ]
      }).orThrow();

      // Merge both
      expect(
        IngredientsLibrary.create({
          builtin: false,
          mergeLibraries: [lib1, lib2]
        })
      ).toSucceedAndSatisfy((lib) => {
        expect(lib.collectionCount).toBe(2);
        expect(lib.validating.has('source1.testChoco')).toBe(true);
        expect(lib.validating.has('source2.testChoco')).toBe(true);
      });
    });

    test('merges library using IMergeLibrarySource without filter (defaults to all)', () => {
      // Create a library with custom collections
      const existingLibrary = IngredientsLibrary.create({
        builtin: false,
        collections: [
          {
            id: 'collection1' as SourceId,
            isMutable: true,
            items: { testChoco: testIngredient }
          },
          {
            id: 'collection2' as SourceId,
            isMutable: true,
            items: { testChoco: testIngredient }
          }
        ]
      }).orThrow();

      // Merge using IMergeLibrarySource object but without filter (should default to all)
      expect(
        IngredientsLibrary.create({
          builtin: false,
          mergeLibraries: {
            library: existingLibrary
            // filter is undefined, should default to true (include all)
          }
        })
      ).toSucceedAndSatisfy((lib) => {
        expect(lib.collectionCount).toBe(2);
        expect(lib.validating.has('collection1.testChoco')).toBe(true);
        expect(lib.validating.has('collection2.testChoco')).toBe(true);
      });
    });

    test('merges library with filter to include specific collections', () => {
      // Create a library with multiple collections
      const existingLibrary = IngredientsLibrary.create({
        builtin: false,
        collections: [
          {
            id: 'include-me' as SourceId,
            isMutable: true,
            items: { testChoco: testIngredient }
          },
          {
            id: 'exclude-me' as SourceId,
            isMutable: true,
            items: { testChoco: testIngredient }
          }
        ]
      }).orThrow();

      // Merge with filter to include only 'include-me'
      expect(
        IngredientsLibrary.create({
          builtin: false,
          mergeLibraries: {
            library: existingLibrary,
            filter: ['include-me' as SourceId]
          }
        })
      ).toSucceedAndSatisfy((lib) => {
        expect(lib.collectionCount).toBe(1);
        expect(lib.validating.has('include-me.testChoco')).toBe(true);
        expect(lib.validating.has('exclude-me.testChoco')).toBe(false);
      });
    });

    test('merges library with filter to exclude collections', () => {
      // Create a library with multiple collections
      const existingLibrary = IngredientsLibrary.create({
        builtin: false,
        collections: [
          {
            id: 'keep-this' as SourceId,
            isMutable: true,
            items: { testChoco: testIngredient }
          },
          {
            id: 'remove-this' as SourceId,
            isMutable: true,
            items: { testChoco: testIngredient }
          }
        ]
      }).orThrow();

      // Merge with filter to exclude 'remove-this'
      expect(
        IngredientsLibrary.create({
          builtin: false,
          mergeLibraries: {
            library: existingLibrary,
            filter: { excluded: ['remove-this'] }
          }
        })
      ).toSucceedAndSatisfy((lib) => {
        expect(lib.collectionCount).toBe(1);
        expect(lib.validating.has('keep-this.testChoco')).toBe(true);
        expect(lib.validating.has('remove-this.testChoco')).toBe(false);
      });
    });

    test('merges library with filter: false skips the library', () => {
      const existingLibrary = IngredientsLibrary.create({
        builtin: false,
        collections: [
          {
            id: 'custom' as SourceId,
            isMutable: true,
            items: { testChoco: testIngredient }
          }
        ]
      }).orThrow();

      expect(
        IngredientsLibrary.create({
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
      const existingLibrary = IngredientsLibrary.create({
        builtin: false,
        collections: [
          {
            id: 'felchlin' as SourceId, // Same as builtin
            isMutable: true,
            items: { testChoco: testIngredient }
          }
        ]
      }).orThrow();

      expect(
        IngredientsLibrary.create({
          builtin: true,
          mergeLibraries: existingLibrary
        })
      ).toFailWith(/felchlin.*conflict/i);
    });

    test('fails on collection ID collision between merged libraries', () => {
      // Create two libraries with the same collection ID
      const lib1 = IngredientsLibrary.create({
        builtin: false,
        collections: [
          {
            id: 'duplicate' as SourceId,
            isMutable: true,
            items: { testChoco: testIngredient }
          }
        ]
      }).orThrow();

      const lib2 = IngredientsLibrary.create({
        builtin: false,
        collections: [
          {
            id: 'duplicate' as SourceId,
            isMutable: false,
            items: { testChoco: testIngredient }
          }
        ]
      }).orThrow();

      expect(
        IngredientsLibrary.create({
          builtin: false,
          mergeLibraries: [lib1, lib2]
        })
      ).toFailWith(/duplicate.*conflict/i);
    });

    test('preserves mutability from merged collections', () => {
      const mutableLib = IngredientsLibrary.create({
        builtin: false,
        collections: [
          {
            id: 'mutable-source' as SourceId,
            isMutable: true,
            items: { testChoco: testIngredient }
          }
        ]
      }).orThrow();

      const immutableLib = IngredientsLibrary.create({
        builtin: false,
        collections: [
          {
            id: 'immutable-source' as SourceId,
            isMutable: false,
            items: { testChoco: testIngredient }
          }
        ]
      }).orThrow();

      expect(
        IngredientsLibrary.create({
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
// Type Guard Tests
// ============================================================================

describe('Ingredient type guards', () => {
  const baseIngredient: IIngredient = {
    baseId: 'test' as BaseIngredientId,
    name: 'Test',
    category: 'other',
    ganacheCharacteristics: {
      cacaoFat: 0 as Percentage,
      sugar: 0 as Percentage,
      milkFat: 0 as Percentage,
      water: 0 as Percentage,
      solids: 0 as Percentage,
      otherFats: 0 as Percentage
    }
  };

  const chocolateIngredient: Ingredient = {
    ...baseIngredient,
    category: 'chocolate',
    chocolateType: 'dark',
    cacaoPercentage: 70 as Percentage
  };

  const sugarIngredient: Ingredient = { ...baseIngredient, category: 'sugar' };
  const dairyIngredient: Ingredient = { ...baseIngredient, category: 'dairy' };
  const fatIngredient: Ingredient = { ...baseIngredient, category: 'fat' };
  const alcoholIngredient: Ingredient = { ...baseIngredient, category: 'alcohol' };

  test.each([
    ['isChocolateIngredient', isChocolateIngredient, chocolateIngredient, true],
    ['isChocolateIngredient', isChocolateIngredient, sugarIngredient, false],
    ['isSugarIngredient', isSugarIngredient, sugarIngredient, true],
    ['isSugarIngredient', isSugarIngredient, chocolateIngredient, false],
    ['isDairyIngredient', isDairyIngredient, dairyIngredient, true],
    ['isDairyIngredient', isDairyIngredient, chocolateIngredient, false],
    ['isFatIngredient', isFatIngredient, fatIngredient, true],
    ['isFatIngredient', isFatIngredient, chocolateIngredient, false],
    ['isAlcoholIngredient', isAlcoholIngredient, alcoholIngredient, true],
    ['isAlcoholIngredient', isAlcoholIngredient, chocolateIngredient, false]
  ])('%s returns %p for %p', (name, fn, input, expected) => {
    expect(fn(input)).toBe(expected);
  });
});
