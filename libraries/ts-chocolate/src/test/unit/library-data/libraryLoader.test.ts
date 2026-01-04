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
  specToLoadParams,
  getSubLibraryPath,
  navigateToSubLibrary,
  resolveFileTreeSourceForSubLibrary,
  resolveFileTreeSource,
  resolveBuiltInSpec,
  checkForCollisionIds,
  normalizeFileSources,
  isMergeLibrarySource,
  normalizeMergeSource,
  ILibraryFileTreeSource,
  IFileTreeSource,
  ICollectionSet,
  IMergeLibrarySource,
  LibraryPaths
} from '../../../packlets/library-data';
import { SourceId } from '../../../packlets/common';

describe('libraryLoader', () => {
  // ============================================================================
  // Test Data - use FileTree.inMemory for valid tree structures
  // ============================================================================

  // Full library with both ingredients and recipes
  const fullLibraryFiles: FileTree.IInMemoryFile[] = [
    { path: '/library/data/ingredients/felchlin.yaml', contents: 'test: data' },
    { path: '/library/data/recipes/common.yaml', contents: 'test: data' }
  ];

  // Partial library with only ingredients
  const ingredientsOnlyFiles: FileTree.IInMemoryFile[] = [
    { path: '/library/data/ingredients/felchlin.yaml', contents: 'test: data' }
  ];

  // Empty library (no sub-library directories)
  const emptyLibraryFiles: FileTree.IInMemoryFile[] = [{ path: '/library/readme.txt', contents: 'empty' }];

  const getLibraryDir = (files: FileTree.IInMemoryFile[]): FileTree.IFileTreeDirectoryItem => {
    const tree = FileTree.inMemory(files).orThrow();
    const libraryItem = tree.getItem('/library').orThrow();
    return libraryItem as FileTree.IFileTreeDirectoryItem;
  };

  // ============================================================================
  // specToLoadParams Tests
  // ============================================================================

  describe('specToLoadParams', () => {
    test('returns undefined for false spec', () => {
      expect(specToLoadParams(false)).toBeUndefined();
    });

    test('returns params with mutable for true spec', () => {
      const result = specToLoadParams(true);
      expect(result).toEqual({ mutable: false });
    });

    test('returns params with custom mutable for true spec', () => {
      const result = specToLoadParams(true, true);
      expect(result).toEqual({ mutable: true });
    });

    test('returns params with included array for array spec', () => {
      const result = specToLoadParams(['felchlin', 'valrhona']);
      expect(result).toEqual({
        included: ['felchlin', 'valrhona'],
        mutable: false
      });
    });

    test('returns params from ILibraryLoadParams spec', () => {
      const result = specToLoadParams({
        included: ['felchlin'],
        excluded: ['deprecated'],
        recurseWithDelimiter: '/'
      });
      expect(result).toEqual({
        included: ['felchlin'],
        excluded: ['deprecated'],
        recurseWithDelimiter: '/',
        mutable: false
      });
    });

    test('respects mutable parameter with ILibraryLoadParams spec', () => {
      const result = specToLoadParams(
        {
          included: ['felchlin']
        },
        true
      );
      expect(result).toEqual({
        included: ['felchlin'],
        excluded: undefined,
        recurseWithDelimiter: undefined,
        mutable: true
      });
    });
  });

  // ============================================================================
  // getSubLibraryPath Tests
  // ============================================================================

  describe('getSubLibraryPath', () => {
    test('returns correct path for ingredients', () => {
      expect(getSubLibraryPath('ingredients')).toBe(LibraryPaths.ingredients);
    });

    test('returns correct path for recipes', () => {
      expect(getSubLibraryPath('recipes')).toBe(LibraryPaths.recipes);
    });
  });

  // ============================================================================
  // navigateToSubLibrary Tests
  // ============================================================================

  describe('navigateToSubLibrary', () => {
    test('navigates to ingredients directory', () => {
      const tree = getLibraryDir(fullLibraryFiles);
      expect(navigateToSubLibrary(tree, 'ingredients')).toSucceedAndSatisfy((dir) => {
        expect(dir.name).toBe('ingredients');
      });
    });

    test('navigates to recipes directory', () => {
      const tree = getLibraryDir(fullLibraryFiles);
      expect(navigateToSubLibrary(tree, 'recipes')).toSucceedAndSatisfy((dir) => {
        expect(dir.name).toBe('recipes');
      });
    });

    test('fails for missing directory', () => {
      const tree = getLibraryDir(emptyLibraryFiles);
      expect(navigateToSubLibrary(tree, 'ingredients')).toFail();
    });
  });

  // ============================================================================
  // resolveFileTreeSourceForSubLibrary Tests
  // ============================================================================

  describe('resolveFileTreeSourceForSubLibrary', () => {
    test('resolves enabled sub-library with default load spec', () => {
      const tree = getLibraryDir(fullLibraryFiles);
      const source: ILibraryFileTreeSource = { directory: tree };

      expect(resolveFileTreeSourceForSubLibrary(source, 'ingredients')).toSucceedAndSatisfy((result) => {
        expect(result).toBeDefined();
        expect(result!.subLibraryId).toBe('ingredients');
        expect(result!.directory.name).toBe('ingredients');
        expect(result!.loadParams.mutable).toBe(false);
      });
    });

    test('returns undefined for disabled sub-library', () => {
      const tree = getLibraryDir(fullLibraryFiles);
      const source: ILibraryFileTreeSource = {
        directory: tree,
        load: { ingredients: false }
      };

      expect(resolveFileTreeSourceForSubLibrary(source, 'ingredients')).toSucceedWith(undefined);
    });

    test('respects mutable setting', () => {
      const tree = getLibraryDir(fullLibraryFiles);
      const source: ILibraryFileTreeSource = {
        directory: tree,
        mutable: true
      };

      expect(resolveFileTreeSourceForSubLibrary(source, 'ingredients')).toSucceedAndSatisfy((result) => {
        expect(result!.loadParams.mutable).toBe(true);
      });
    });

    test('fails when directory does not exist', () => {
      const tree = getLibraryDir(emptyLibraryFiles);
      const source: ILibraryFileTreeSource = { directory: tree };

      expect(resolveFileTreeSourceForSubLibrary(source, 'ingredients')).toFail();
    });
  });

  // ============================================================================
  // resolveFileTreeSource Tests
  // ============================================================================

  describe('resolveFileTreeSource', () => {
    test('resolves all sub-libraries from complete tree', () => {
      const tree = getLibraryDir(fullLibraryFiles);
      const source: ILibraryFileTreeSource = { directory: tree };

      expect(resolveFileTreeSource(source)).toSucceedAndSatisfy((results) => {
        expect(results.length).toBe(2);
        expect(results.map((r) => r.subLibraryId)).toContain('ingredients');
        expect(results.map((r) => r.subLibraryId)).toContain('recipes');
      });
    });

    test('skips missing directories gracefully', () => {
      const tree = getLibraryDir(ingredientsOnlyFiles);
      const source: ILibraryFileTreeSource = { directory: tree };

      expect(resolveFileTreeSource(source)).toSucceedAndSatisfy((results) => {
        expect(results.length).toBe(1);
        expect(results[0].subLibraryId).toBe('ingredients');
      });
    });

    test('returns empty array when all directories missing', () => {
      const tree = getLibraryDir(emptyLibraryFiles);
      const source: ILibraryFileTreeSource = { directory: tree };

      expect(resolveFileTreeSource(source)).toSucceedWith([]);
    });

    test('respects per-sub-library load specs', () => {
      const tree = getLibraryDir(fullLibraryFiles);
      const source: ILibraryFileTreeSource = {
        directory: tree,
        load: { ingredients: true, recipes: false }
      };

      expect(resolveFileTreeSource(source)).toSucceedAndSatisfy((results) => {
        expect(results.length).toBe(1);
        expect(results[0].subLibraryId).toBe('ingredients');
      });
    });
  });

  // ============================================================================
  // resolveBuiltInSpec Tests
  // ============================================================================

  describe('resolveBuiltInSpec', () => {
    test('returns true for undefined spec', () => {
      expect(resolveBuiltInSpec(undefined, 'ingredients')).toBe(true);
    });

    test('returns spec value for boolean spec', () => {
      expect(resolveBuiltInSpec(true, 'ingredients')).toBe(true);
      expect(resolveBuiltInSpec(false, 'recipes')).toBe(false);
    });

    test('returns specific sub-library spec when defined', () => {
      const spec = { ingredients: ['felchlin'], recipes: false };
      expect(resolveBuiltInSpec(spec, 'ingredients')).toEqual(['felchlin']);
      expect(resolveBuiltInSpec(spec, 'recipes')).toBe(false);
    });

    test('returns default when sub-library not specified', () => {
      const spec = { default: true };
      expect(resolveBuiltInSpec(spec, 'ingredients')).toBe(true);
      expect(resolveBuiltInSpec(spec, 'recipes')).toBe(true);
    });

    test('returns false when no default and sub-library not specified', () => {
      const spec = { ingredients: true };
      expect(resolveBuiltInSpec(spec, 'recipes')).toBe(false);
    });
  });

  // ============================================================================
  // checkForCollisionIds Tests
  // ============================================================================

  describe('checkForCollisionIds', () => {
    test('succeeds with no collections', () => {
      expect(checkForCollisionIds([])).toSucceedWith(true);
    });

    test('succeeds with single source', () => {
      const sets: ICollectionSet<SourceId>[] = [
        {
          source: 'builtin',
          collections: [{ id: 'felchlin' as SourceId }, { id: 'valrhona' as SourceId }]
        }
      ];
      expect(checkForCollisionIds(sets)).toSucceedWith(true);
    });

    test('succeeds with multiple sources and unique IDs', () => {
      const sets: ICollectionSet<SourceId>[] = [
        {
          source: 'builtin',
          collections: [{ id: 'felchlin' as SourceId }]
        },
        {
          source: 'fileSource[0]',
          collections: [{ id: 'custom' as SourceId }]
        }
      ];
      expect(checkForCollisionIds(sets)).toSucceedWith(true);
    });

    test('fails when same ID appears in different sources', () => {
      const sets: ICollectionSet<SourceId>[] = [
        {
          source: 'builtin',
          collections: [{ id: 'felchlin' as SourceId }]
        },
        {
          source: 'fileSource[0]',
          collections: [{ id: 'felchlin' as SourceId }]
        }
      ];
      expect(checkForCollisionIds(sets)).toFailWith(/felchlin.*conflict.*builtin.*fileSource/);
    });

    test('fails with collision within same source', () => {
      const sets: ICollectionSet<SourceId>[] = [
        {
          source: 'source1',
          collections: [{ id: 'duplicate' as SourceId }, { id: 'duplicate' as SourceId }]
        }
      ];
      expect(checkForCollisionIds(sets)).toFailWith(/duplicate.*conflict.*source1.*source1/);
    });
  });

  // ============================================================================
  // normalizeFileSources Tests
  // ============================================================================

  describe('normalizeFileSources', () => {
    const mockDirectory = FileTree.inMemory([{ path: '/test/file.json', contents: {} }])
      .orThrow()
      .getItem('/test')
      .orThrow() as FileTree.IFileTreeDirectoryItem;

    test('returns empty array for undefined', () => {
      const result = normalizeFileSources<IFileTreeSource>(undefined);
      expect(result).toEqual([]);
    });

    test('wraps single source in array', () => {
      const source: IFileTreeSource = { directory: mockDirectory };
      const result = normalizeFileSources(source);
      expect(result).toEqual([source]);
      expect(result.length).toBe(1);
    });

    test('returns array unchanged', () => {
      const sources: IFileTreeSource[] = [
        { directory: mockDirectory },
        { directory: mockDirectory, load: false }
      ];
      const result = normalizeFileSources(sources);
      expect(result).toBe(sources);
      expect(result.length).toBe(2);
    });

    test('works with ILibraryFileTreeSource', () => {
      const source: ILibraryFileTreeSource = {
        directory: mockDirectory,
        load: { ingredients: true, recipes: false },
        mutable: true
      };
      const result = normalizeFileSources(source);
      expect(result).toEqual([source]);
    });

    test('works with array of ILibraryFileTreeSource', () => {
      const sources: ILibraryFileTreeSource[] = [
        { directory: mockDirectory, load: true },
        { directory: mockDirectory, mutable: true }
      ];
      const result = normalizeFileSources(sources);
      expect(result).toBe(sources);
    });
  });

  // ============================================================================
  // isMergeLibrarySource Tests
  // ============================================================================

  describe('isMergeLibrarySource', () => {
    // Mock library type for testing
    interface IMockLibrary {
      name: string;
    }

    test('returns true for IMergeLibrarySource with library property', () => {
      const mockLibrary: IMockLibrary = { name: 'test' };
      const mergeSource: IMergeLibrarySource<IMockLibrary, SourceId> = {
        library: mockLibrary,
        filter: true
      };
      expect(isMergeLibrarySource(mergeSource)).toBe(true);
    });

    test('returns true for IMergeLibrarySource without filter', () => {
      const mockLibrary: IMockLibrary = { name: 'test' };
      const mergeSource: IMergeLibrarySource<IMockLibrary, SourceId> = {
        library: mockLibrary
      };
      expect(isMergeLibrarySource(mergeSource)).toBe(true);
    });

    test('returns false for library directly', () => {
      const mockLibrary: IMockLibrary = { name: 'test' };
      expect(isMergeLibrarySource(mockLibrary)).toBe(false);
    });

    test('returns false for null', () => {
      expect(isMergeLibrarySource(null as unknown as IMockLibrary)).toBe(false);
    });

    test('returns false for primitives', () => {
      expect(isMergeLibrarySource('string' as unknown as IMockLibrary)).toBe(false);
      expect(isMergeLibrarySource(123 as unknown as IMockLibrary)).toBe(false);
    });
  });

  // ============================================================================
  // normalizeMergeSource Tests
  // ============================================================================

  describe('normalizeMergeSource', () => {
    // Mock library type for testing
    interface IMockLibrary {
      name: string;
    }

    test('normalizes library directly to object with filter: true', () => {
      const mockLibrary: IMockLibrary = { name: 'test' };
      const result = normalizeMergeSource<IMockLibrary, SourceId>(mockLibrary);
      expect(result).toEqual({
        library: mockLibrary,
        filter: true
      });
    });

    test('normalizes IMergeLibrarySource with explicit filter', () => {
      const mockLibrary: IMockLibrary = { name: 'test' };
      const mergeSource: IMergeLibrarySource<IMockLibrary, SourceId> = {
        library: mockLibrary,
        filter: ['felchlin' as SourceId]
      };
      const result = normalizeMergeSource(mergeSource);
      expect(result).toEqual({
        library: mockLibrary,
        filter: ['felchlin' as SourceId]
      });
    });

    test('normalizes IMergeLibrarySource with filter: false', () => {
      const mockLibrary: IMockLibrary = { name: 'test' };
      const mergeSource: IMergeLibrarySource<IMockLibrary, SourceId> = {
        library: mockLibrary,
        filter: false
      };
      const result = normalizeMergeSource(mergeSource);
      expect(result).toEqual({
        library: mockLibrary,
        filter: false
      });
    });

    test('normalizes IMergeLibrarySource without filter to filter: true', () => {
      const mockLibrary: IMockLibrary = { name: 'test' };
      const mergeSource: IMergeLibrarySource<IMockLibrary, SourceId> = {
        library: mockLibrary
      };
      const result = normalizeMergeSource(mergeSource);
      expect(result).toEqual({
        library: mockLibrary,
        filter: true
      });
    });

    test('normalizes IMergeLibrarySource with ILibraryLoadParams filter', () => {
      const mockLibrary: IMockLibrary = { name: 'test' };
      const mergeSource: IMergeLibrarySource<IMockLibrary, SourceId> = {
        library: mockLibrary,
        filter: { included: ['felchlin' as SourceId], excluded: ['deprecated' as SourceId] }
      };
      const result = normalizeMergeSource(mergeSource);
      expect(result).toEqual({
        library: mockLibrary,
        filter: { included: ['felchlin' as SourceId], excluded: ['deprecated' as SourceId] }
      });
    });
  });
});
