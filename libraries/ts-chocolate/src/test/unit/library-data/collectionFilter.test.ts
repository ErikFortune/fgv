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

import { Converters, Result, succeed, fail } from '@fgv/ts-utils';
import { FileTree } from '@fgv/ts-json-base';

import { CollectionFilter, ICollectionFilterInitParams } from '../../../packlets/library-data';

// Branded string type for testing
type TestId = string & { readonly __testId: unique symbol };

const testIdConverter = Converters.generic<TestId>((from: unknown) => {
  if (typeof from !== 'string') {
    return fail('Expected string');
  }
  if (from.length === 0) {
    return fail('TestId cannot be empty');
  }
  // Allow lowercase letters, numbers, hyphens, dots, and forward slashes (for recursive paths)
  if (!/^[a-z][a-z0-9./-]*$/.test(from)) {
    return fail(`Invalid TestId format: ${from}`);
  }
  return succeed(from as TestId);
});

describe('CollectionFilter', () => {
  // ============================================================================
  // Constructor Tests
  // ============================================================================

  describe('constructor', () => {
    test('creates filter with required params only', () => {
      const params: ICollectionFilterInitParams<TestId> = {
        nameConverter: testIdConverter
      };
      const filter = new CollectionFilter(params);

      expect(filter.included).toBeUndefined();
      expect(filter.excluded).toEqual([]);
      expect(filter.errorOnInvalidName).toBe(false);
    });

    test('creates filter with all optional params', () => {
      const params: ICollectionFilterInitParams<TestId> = {
        included: ['item1', 'item2'],
        excluded: ['item3'],
        nameConverter: testIdConverter,
        errorOnInvalidName: true
      };
      const filter = new CollectionFilter(params);

      expect(filter.included).toEqual(['item1', 'item2']);
      expect(filter.excluded).toEqual(['item3']);
      expect(filter.errorOnInvalidName).toBe(true);
    });
  });

  // ============================================================================
  // filterItems Tests
  // ============================================================================

  describe('filterItems', () => {
    let filter: CollectionFilter<TestId>;

    beforeEach(() => {
      filter = new CollectionFilter({
        nameConverter: testIdConverter
      });
    });

    test('filters empty array', () => {
      const result = filter.filterItems([], () => succeed('test'));
      expect(result).toSucceedWith([]);
    });

    test('filters items with valid names', () => {
      const items = [{ value: 'a' }, { value: 'b' }, { value: 'c' }];
      const extractName = (item: { value: string }): Result<string> => succeed(`item-${item.value}`);

      expect(filter.filterItems(items, extractName)).toSucceedAndSatisfy((filtered) => {
        expect(filtered).toHaveLength(3);
        expect(filtered[0].name).toBe('item-a');
        expect(filtered[0].item).toEqual({ value: 'a' });
        expect(filtered[1].name).toBe('item-b');
        expect(filtered[2].name).toBe('item-c');
      });
    });

    test('skips items with invalid names when errorOnInvalidName is false', () => {
      const items = [{ value: 'valid-name' }, { value: 'INVALID' }, { value: 'another-valid' }];
      const extractName = (item: { value: string }): Result<string> => succeed(item.value);

      expect(filter.filterItems(items, extractName)).toSucceedAndSatisfy((filtered) => {
        expect(filtered).toHaveLength(2);
        expect(filtered[0].name).toBe('valid-name');
        expect(filtered[1].name).toBe('another-valid');
      });
    });

    test('fails when errorOnInvalidName is true and name is invalid', () => {
      const errorFilter = new CollectionFilter<TestId>({
        nameConverter: testIdConverter,
        errorOnInvalidName: true
      });

      const items = [{ value: 'valid-name' }, { value: 'INVALID' }];
      const extractName = (item: { value: string }): Result<string> => succeed(item.value);

      expect(errorFilter.filterItems(items, extractName)).toFailWith(/Invalid item name/i);
    });

    test('skips items when name extraction fails', () => {
      const items = [{ value: 'good' }, { value: 'bad' }, { value: 'also-good' }];
      const extractName = (item: { value: string }): Result<string> => {
        if (item.value === 'bad') {
          return fail('Cannot extract name');
        }
        return succeed(`item-${item.value}`);
      };

      expect(filter.filterItems(items, extractName)).toSucceedAndSatisfy((filtered) => {
        expect(filtered).toHaveLength(2);
        expect(filtered[0].name).toBe('item-good');
        expect(filtered[1].name).toBe('item-also-good');
      });
    });

    test('fails when name extraction fails and errorOnInvalidName is true', () => {
      const errorFilter = new CollectionFilter<TestId>({
        nameConverter: testIdConverter,
        errorOnInvalidName: true
      });

      const items = [{ value: 'good' }, { value: 'bad' }];
      const extractName = (item: { value: string }): Result<string> => {
        if (item.value === 'bad') {
          return fail('Cannot extract name');
        }
        return succeed(`item-${item.value}`);
      };

      expect(errorFilter.filterItems(items, extractName)).toFailWith(
        /Invalid item name.*Cannot extract name/i
      );
    });
  });

  // ============================================================================
  // filterDirectory Tests
  // ============================================================================

  describe('filterDirectory', () => {
    let filter: CollectionFilter<TestId>;

    beforeEach(() => {
      filter = new CollectionFilter({
        nameConverter: testIdConverter
      });
    });

    test('fails when item is not a directory', () => {
      const files: FileTree.IInMemoryFile[] = [{ path: '/test.json', contents: '{}' }];

      expect(FileTree.inMemory(files)).toSucceedAndSatisfy((tree) => {
        expect(tree.getItem('/test.json')).toSucceedAndSatisfy((file) => {
          expect(filter.filterDirectory(file)).toFailWith(/Not a directory/i);
        });
      });
    });

    test('filters files in a directory', () => {
      const files: FileTree.IInMemoryFile[] = [
        { path: '/items/item-a.json', contents: '{}' },
        { path: '/items/item-b.json', contents: '{}' },
        { path: '/items/item-c.json', contents: '{}' }
      ];

      expect(FileTree.inMemory(files)).toSucceedAndSatisfy((tree) => {
        expect(tree.getItem('/items')).toSucceedAndSatisfy((dir) => {
          expect(filter.filterDirectory(dir)).toSucceedAndSatisfy((filtered) => {
            expect(filtered).toHaveLength(3);
            const names = filtered.map((f) => f.name).sort();
            expect(names).toEqual(['item-a.json', 'item-b.json', 'item-c.json']);
          });
        });
      });
    });

    test('filters files with prefix', () => {
      const files: FileTree.IInMemoryFile[] = [
        { path: '/items/item-a.json', contents: '{}' },
        { path: '/items/item-b.json', contents: '{}' }
      ];

      expect(FileTree.inMemory(files)).toSucceedAndSatisfy((tree) => {
        expect(tree.getItem('/items')).toSucceedAndSatisfy((dir) => {
          expect(filter.filterDirectory(dir, { prefix: 'prefix-' })).toSucceedAndSatisfy((filtered) => {
            expect(filtered).toHaveLength(2);
            const names = filtered.map((f) => f.name).sort();
            expect(names).toEqual(['prefix-item-a.json', 'prefix-item-b.json']);
          });
        });
      });
    });

    test('ignores subdirectories when recurseWithDelimiter is not set', () => {
      const files: FileTree.IInMemoryFile[] = [
        { path: '/items/item-a.json', contents: '{}' },
        { path: '/items/subdir/item-b.json', contents: '{}' }
      ];

      expect(FileTree.inMemory(files)).toSucceedAndSatisfy((tree) => {
        expect(tree.getItem('/items')).toSucceedAndSatisfy((dir) => {
          expect(filter.filterDirectory(dir)).toSucceedAndSatisfy((filtered) => {
            expect(filtered).toHaveLength(1);
            expect(filtered[0].name).toBe('item-a.json');
          });
        });
      });
    });

    test('recurses into subdirectories when recurseWithDelimiter is set', () => {
      const files: FileTree.IInMemoryFile[] = [
        { path: '/items/item-a.json', contents: '{}' },
        { path: '/items/subdir/item-b.json', contents: '{}' },
        { path: '/items/subdir/nested/item-c.json', contents: '{}' }
      ];

      expect(FileTree.inMemory(files)).toSucceedAndSatisfy((tree) => {
        expect(tree.getItem('/items')).toSucceedAndSatisfy((dir) => {
          expect(filter.filterDirectory(dir, { recurseWithDelimiter: '/' })).toSucceedAndSatisfy(
            (filtered) => {
              expect(filtered).toHaveLength(3);
              const names = filtered.map((f) => f.name).sort();
              expect(names).toEqual(['item-a.json', 'subdir/item-b.json', 'subdir/nested/item-c.json']);
            }
          );
        });
      });
    });

    test('recurses with custom delimiter', () => {
      const files: FileTree.IInMemoryFile[] = [
        { path: '/items/item-a.json', contents: '{}' },
        { path: '/items/subdir/item-b.json', contents: '{}' }
      ];

      expect(FileTree.inMemory(files)).toSucceedAndSatisfy((tree) => {
        expect(tree.getItem('/items')).toSucceedAndSatisfy((dir) => {
          expect(filter.filterDirectory(dir, { recurseWithDelimiter: '.' })).toSucceedAndSatisfy(
            (filtered) => {
              expect(filtered).toHaveLength(2);
              const names = filtered.map((f) => f.name).sort();
              expect(names).toEqual(['item-a.json', 'subdir.item-b.json']);
            }
          );
        });
      });
    });

    test('combines prefix and recurse options', () => {
      const files: FileTree.IInMemoryFile[] = [
        { path: '/items/item-a.json', contents: '{}' },
        { path: '/items/subdir/item-b.json', contents: '{}' }
      ];

      expect(FileTree.inMemory(files)).toSucceedAndSatisfy((tree) => {
        expect(tree.getItem('/items')).toSucceedAndSatisfy((dir) => {
          expect(
            filter.filterDirectory(dir, { prefix: 'root-', recurseWithDelimiter: '/' })
          ).toSucceedAndSatisfy((filtered) => {
            expect(filtered).toHaveLength(2);
            const names = filtered.map((f) => f.name).sort();
            expect(names).toEqual(['root-item-a.json', 'root-subdir/item-b.json']);
          });
        });
      });
    });

    test('filters out items with invalid names', () => {
      const files: FileTree.IInMemoryFile[] = [
        { path: '/items/valid-item.json', contents: '{}' },
        { path: '/items/INVALID.json', contents: '{}' },
        { path: '/items/another-valid.json', contents: '{}' }
      ];

      expect(FileTree.inMemory(files)).toSucceedAndSatisfy((tree) => {
        expect(tree.getItem('/items')).toSucceedAndSatisfy((dir) => {
          expect(filter.filterDirectory(dir)).toSucceedAndSatisfy((filtered) => {
            expect(filtered).toHaveLength(2);
            const names = filtered.map((f) => f.name).sort();
            expect(names).toEqual(['another-valid.json', 'valid-item.json']);
          });
        });
      });
    });

    test('handles empty directory', () => {
      // Create a directory structure with at least one file so the directory exists
      const files: FileTree.IInMemoryFile[] = [{ path: '/items/subdir/file.json', contents: '{}' }];

      expect(FileTree.inMemory(files)).toSucceedAndSatisfy((tree) => {
        // The /items directory only contains the subdir, no files directly
        expect(tree.getItem('/items')).toSucceedAndSatisfy((dir) => {
          expect(filter.filterDirectory(dir)).toSucceedAndSatisfy((filtered) => {
            // No files directly in /items (only a subdirectory)
            expect(filtered).toHaveLength(0);
          });
        });
      });
    });
  });

  // ============================================================================
  // getFileTreeItemName Tests
  // ============================================================================

  describe('getFileTreeItemName', () => {
    test('returns item name without prefix', () => {
      const files: FileTree.IInMemoryFile[] = [{ path: '/test.json', contents: '{}' }];

      expect(FileTree.inMemory(files)).toSucceedAndSatisfy((tree) => {
        expect(tree.getItem('/test.json')).toSucceedAndSatisfy((item) => {
          expect(CollectionFilter.getFileTreeItemName(item)).toSucceedWith('test.json');
        });
      });
    });

    test('returns item name with prefix', () => {
      const files: FileTree.IInMemoryFile[] = [{ path: '/test.json', contents: '{}' }];

      expect(FileTree.inMemory(files)).toSucceedAndSatisfy((tree) => {
        expect(tree.getItem('/test.json')).toSucceedAndSatisfy((item) => {
          expect(CollectionFilter.getFileTreeItemName(item, 'prefix-')).toSucceedWith('prefix-test.json');
        });
      });
    });

    test('works with directory items', () => {
      const files: FileTree.IInMemoryFile[] = [{ path: '/dir/file.json', contents: '{}' }];

      expect(FileTree.inMemory(files)).toSucceedAndSatisfy((tree) => {
        expect(tree.getItem('/dir')).toSucceedAndSatisfy((item) => {
          expect(CollectionFilter.getFileTreeItemName(item)).toSucceedWith('dir');
          expect(CollectionFilter.getFileTreeItemName(item, 'my-')).toSucceedWith('my-dir');
        });
      });
    });
  });
});
