// Copyright (c) 2024 Erik Fortune
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
  getIngredientsDirectory,
  getJournalsDirectory,
  getRecipesDirectory,
  LibraryPaths,
  navigateToDirectory
} from '../../../packlets/library-data';

describe('LibraryData Navigation', () => {
  // Create a mock library tree structure
  const mockLibraryFiles: FileTree.IInMemoryFile[] = [
    { path: '/library/data/ingredients/common.json', contents: { items: [] } },
    { path: '/library/data/ingredients/custom.json', contents: { items: [] } },
    { path: '/library/data/recipes/ganache.json', contents: { items: [] } },
    { path: '/library/data/journals/session.json', contents: { items: [] } },
    { path: '/library/other/file.txt', contents: 'some content' }
  ];

  let mockLibraryTree: FileTree.IFileTreeDirectoryItem;

  beforeEach(() => {
    const treeResult = FileTree.inMemory(mockLibraryFiles);
    expect(treeResult).toSucceed();
    const tree = treeResult.orThrow();
    const libraryResult = tree.getItem('/library');
    expect(libraryResult).toSucceed();
    const libraryDir = libraryResult.orThrow();
    expect(libraryDir.type).toBe('directory');
    mockLibraryTree = libraryDir as FileTree.IFileTreeDirectoryItem;
  });

  // ============================================================================
  // LibraryPaths Tests
  // ============================================================================

  describe('LibraryPaths', () => {
    test('has correct ingredients path', () => {
      expect(LibraryPaths.ingredients).toBe('data/ingredients');
    });

    test('has correct recipes path', () => {
      expect(LibraryPaths.recipes).toBe('data/recipes');
    });

    test('has correct journals path', () => {
      expect(LibraryPaths.journals).toBe('data/journals');
    });
  });

  // ============================================================================
  // navigateToDirectory Tests
  // ============================================================================

  describe('navigateToDirectory', () => {
    test('navigates to existing directory', () => {
      expect(navigateToDirectory(mockLibraryTree, 'data')).toSucceedAndSatisfy((dir) => {
        expect(dir.name).toBe('data');
        expect(dir.type).toBe('directory');
      });
    });

    test('navigates to nested directory', () => {
      expect(navigateToDirectory(mockLibraryTree, 'data/ingredients')).toSucceedAndSatisfy((dir) => {
        expect(dir.name).toBe('ingredients');
        expect(dir.type).toBe('directory');
      });
    });

    test('returns root directory for empty path', () => {
      expect(navigateToDirectory(mockLibraryTree, '')).toSucceedAndSatisfy((dir) => {
        expect(dir.name).toBe('library');
      });
    });

    test('returns root directory for path with only slashes', () => {
      expect(navigateToDirectory(mockLibraryTree, '/')).toSucceedAndSatisfy((dir) => {
        expect(dir.name).toBe('library');
      });
    });

    test('fails when starting from a file', () => {
      const treeResult = FileTree.inMemory(mockLibraryFiles);
      expect(treeResult).toSucceed();
      const tree = treeResult.orThrow();
      const fileResult = tree.getItem('/library/other/file.txt');
      expect(fileResult).toSucceed();
      const file = fileResult.orThrow();

      expect(navigateToDirectory(file, 'anywhere')).toFailWith(/not a directory/i);
    });

    test('fails when directory not found', () => {
      expect(navigateToDirectory(mockLibraryTree, 'nonexistent')).toFailWith(/directory not found/i);
    });

    test('fails when intermediate path is not a directory', () => {
      expect(navigateToDirectory(mockLibraryTree, 'other/file.txt/deeper')).toFailWith(/not a directory/i);
    });

    test('fails when nested directory not found', () => {
      expect(navigateToDirectory(mockLibraryTree, 'data/nonexistent')).toFailWith(/directory not found/i);
    });
  });

  // ============================================================================
  // getIngredientsDirectory Tests
  // ============================================================================

  describe('getIngredientsDirectory', () => {
    test('returns ingredients directory from library tree', () => {
      expect(getIngredientsDirectory(mockLibraryTree)).toSucceedAndSatisfy((dir) => {
        expect(dir.name).toBe('ingredients');
        expect(dir.type).toBe('directory');
      });
    });

    test('fails when ingredients directory does not exist', () => {
      const noIngredientsFiles: FileTree.IInMemoryFile[] = [
        { path: '/library/data/recipes/test.json', contents: {} }
      ];

      expect(FileTree.inMemory(noIngredientsFiles)).toSucceedAndSatisfy((tree) => {
        expect(tree.getItem('/library')).toSucceedAndSatisfy((libraryDir) => {
          expect(getIngredientsDirectory(libraryDir)).toFailWith(/directory not found/i);
        });
      });
    });

    test('fails when starting from non-directory', () => {
      const treeResult = FileTree.inMemory(mockLibraryFiles);
      expect(treeResult).toSucceed();
      const tree = treeResult.orThrow();
      const fileResult = tree.getItem('/library/other/file.txt');
      expect(fileResult).toSucceed();
      const file = fileResult.orThrow();

      expect(getIngredientsDirectory(file)).toFailWith(/not a directory/i);
    });
  });

  // ============================================================================
  // getRecipesDirectory Tests
  // ============================================================================

  describe('getRecipesDirectory', () => {
    test('returns recipes directory from library tree', () => {
      expect(getRecipesDirectory(mockLibraryTree)).toSucceedAndSatisfy((dir) => {
        expect(dir.name).toBe('recipes');
        expect(dir.type).toBe('directory');
      });
    });

    test('fails when recipes directory does not exist', () => {
      const noRecipesFiles: FileTree.IInMemoryFile[] = [
        { path: '/library/data/ingredients/test.json', contents: {} }
      ];

      expect(FileTree.inMemory(noRecipesFiles)).toSucceedAndSatisfy((tree) => {
        expect(tree.getItem('/library')).toSucceedAndSatisfy((libraryDir) => {
          expect(getRecipesDirectory(libraryDir)).toFailWith(/directory not found/i);
        });
      });
    });

    test('fails when starting from non-directory', () => {
      const treeResult = FileTree.inMemory(mockLibraryFiles);
      expect(treeResult).toSucceed();
      const tree = treeResult.orThrow();
      const fileResult = tree.getItem('/library/other/file.txt');
      expect(fileResult).toSucceed();
      const file = fileResult.orThrow();

      expect(getRecipesDirectory(file)).toFailWith(/not a directory/i);
    });
  });

  // ============================================================================
  // getJournalsDirectory Tests
  // ============================================================================

  describe('getJournalsDirectory', () => {
    test('returns journals directory from library tree', () => {
      expect(getJournalsDirectory(mockLibraryTree)).toSucceedAndSatisfy((dir) => {
        expect(dir.name).toBe('journals');
        expect(dir.type).toBe('directory');
      });
    });

    test('fails when journals directory does not exist', () => {
      const noJournalsFiles: FileTree.IInMemoryFile[] = [
        { path: '/library/data/recipes/test.json', contents: {} }
      ];

      expect(FileTree.inMemory(noJournalsFiles)).toSucceedAndSatisfy((tree) => {
        expect(tree.getItem('/library')).toSucceedAndSatisfy((libraryDir) => {
          expect(getJournalsDirectory(libraryDir)).toFailWith(/directory not found/i);
        });
      });
    });

    test('fails when starting from non-directory', () => {
      const treeResult = FileTree.inMemory(mockLibraryFiles);
      expect(treeResult).toSucceed();
      const tree = treeResult.orThrow();
      const fileResult = tree.getItem('/library/other/file.txt');
      expect(fileResult).toSucceed();
      const file = fileResult.orThrow();

      expect(getJournalsDirectory(file)).toFailWith(/not a directory/i);
    });
  });
});
