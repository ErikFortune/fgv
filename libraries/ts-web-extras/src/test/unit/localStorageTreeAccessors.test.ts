/*
 * Copyright (c) 2026 Erik Fortune
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import '@fgv/ts-utils-jest';
import { FileTree } from '@fgv/ts-json-base';
import { LocalStorageTreeAccessors, FileApiTreeAccessors } from '../../packlets/file-tree';

/**
 * Mock Storage implementation for testing
 */
class MockStorage implements Storage {
  private _data: Map<string, string> = new Map();

  get length(): number {
    return this._data.size;
  }

  clear(): void {
    this._data.clear();
  }

  getItem(key: string): string | null {
    return this._data.get(key) ?? null;
  }

  key(index: number): string | null {
    const keys = Array.from(this._data.keys());
    return keys[index] ?? null;
  }

  removeItem(key: string): void {
    this._data.delete(key);
  }

  setItem(key: string, value: string): void {
    this._data.set(key, value);
  }
}

describe('LocalStorageTreeAccessors', () => {
  let mockStorage: MockStorage;

  beforeEach(() => {
    mockStorage = new MockStorage();
  });

  describe('fromStorage', () => {
    test('creates accessors from empty storage', () => {
      const result = LocalStorageTreeAccessors.fromStorage({
        pathToKeyMap: {
          '/data/ingredients': 'test:ingredients:v1'
        },
        storage: mockStorage
      });

      expect(result).toSucceedAndSatisfy((accessors) => {
        expect(accessors).toBeInstanceOf(LocalStorageTreeAccessors);
        expect(accessors.isDirty()).toBe(false);
      });
    });

    test('loads collections from storage', () => {
      mockStorage.setItem(
        'test:ingredients:v1',
        JSON.stringify({
          collection1: { items: { item1: {} } },
          collection2: { items: { item2: {} } }
        })
      );

      const result = LocalStorageTreeAccessors.fromStorage({
        pathToKeyMap: {
          '/data/ingredients': 'test:ingredients:v1'
        },
        storage: mockStorage
      });

      expect(result).toSucceedAndSatisfy((accessors) => {
        expect(accessors.getFileContents('/data/ingredients/collection1.json')).toSucceed();
        expect(accessors.getFileContents('/data/ingredients/collection2.json')).toSucceed();
      });
    });

    test('loads from multiple storage keys', () => {
      mockStorage.setItem('test:ingredients:v1', JSON.stringify({ ing1: { items: {} } }));
      mockStorage.setItem('test:fillings:v1', JSON.stringify({ fill1: { items: {} } }));

      const result = LocalStorageTreeAccessors.fromStorage({
        pathToKeyMap: {
          '/data/ingredients': 'test:ingredients:v1',
          '/data/fillings': 'test:fillings:v1'
        },
        storage: mockStorage
      });

      expect(result).toSucceedAndSatisfy((accessors) => {
        expect(accessors.getFileContents('/data/ingredients/ing1.json')).toSucceed();
        expect(accessors.getFileContents('/data/fillings/fill1.json')).toSucceed();
      });
    });

    test('skips corrupted JSON data', () => {
      mockStorage.setItem('test:ingredients:v1', 'not valid json');

      const result = LocalStorageTreeAccessors.fromStorage({
        pathToKeyMap: {
          '/data/ingredients': 'test:ingredients:v1'
        },
        storage: mockStorage
      });

      expect(result).toSucceedAndSatisfy((accessors) => {
        expect(accessors).toBeInstanceOf(LocalStorageTreeAccessors);
      });
    });

    test('skips non-object JSON', () => {
      mockStorage.setItem('test:ingredients:v1', '"string value"');

      const result = LocalStorageTreeAccessors.fromStorage({
        pathToKeyMap: {
          '/data/ingredients': 'test:ingredients:v1'
        },
        storage: mockStorage
      });

      expect(result).toSucceedAndSatisfy((accessors) => {
        expect(accessors).toBeInstanceOf(LocalStorageTreeAccessors);
      });
    });

    test('skips non-object collection values', () => {
      mockStorage.setItem(
        'test:ingredients:v1',
        JSON.stringify({
          good: { items: {} },
          bad: 'not an object'
        })
      );

      const result = LocalStorageTreeAccessors.fromStorage({
        pathToKeyMap: {
          '/data/ingredients': 'test:ingredients:v1'
        },
        storage: mockStorage
      });

      expect(result).toSucceedAndSatisfy((accessors) => {
        expect(accessors.getFileContents('/data/ingredients/good.json')).toSucceed();
        expect(accessors.getFileContents('/data/ingredients/bad.json')).toFail();
      });
    });

    test('applies prefix parameter', () => {
      mockStorage.setItem('test:ingredients:v1', JSON.stringify({ collection1: { items: {} } }));

      const result = LocalStorageTreeAccessors.fromStorage({
        pathToKeyMap: {
          '/data/ingredients': 'test:ingredients:v1'
        },
        storage: mockStorage,
        prefix: '/myapp'
      });

      expect(result).toSucceedAndSatisfy((accessors) => {
        expect(accessors.getFileContents('/myapp/data/ingredients/collection1.json')).toSucceed();
      });
    });

    test('succeeds with empty storage when no data present', () => {
      const result = LocalStorageTreeAccessors.fromStorage({
        pathToKeyMap: {
          '/data/ingredients': 'test:ingredients:v1'
        },
        storage: mockStorage
      });

      expect(result).toSucceedAndSatisfy((accessors) => {
        expect(accessors).toBeInstanceOf(LocalStorageTreeAccessors);
      });
    });
  });

  describe('dirty tracking', () => {
    test('starts with no dirty files', () => {
      mockStorage.setItem('test:ingredients:v1', JSON.stringify({ collection1: { items: {} } }));

      const accessors = LocalStorageTreeAccessors.fromStorage({
        pathToKeyMap: {
          '/data/ingredients': 'test:ingredients:v1'
        },
        storage: mockStorage,
        mutable: true
      }).orThrow();

      expect(accessors.isDirty()).toBe(false);
      expect(accessors.getDirtyPaths()).toEqual([]);
    });

    test('marks files as dirty after modification', () => {
      mockStorage.setItem('test:ingredients:v1', JSON.stringify({ collection1: { items: {} } }));

      const accessors = LocalStorageTreeAccessors.fromStorage({
        pathToKeyMap: {
          '/data/ingredients': 'test:ingredients:v1'
        },
        storage: mockStorage,
        mutable: true
      }).orThrow();

      const newContent = JSON.stringify({ items: { modified: true } });
      accessors.saveFileContents('/data/ingredients/collection1.json', newContent).orThrow();

      expect(accessors.isDirty()).toBe(true);
      expect(accessors.getDirtyPaths()).toContain('/data/ingredients/collection1.json');
    });

    test('tracks multiple dirty files', () => {
      mockStorage.setItem(
        'test:ingredients:v1',
        JSON.stringify({
          collection1: { items: {} },
          collection2: { items: {} }
        })
      );

      const accessors = LocalStorageTreeAccessors.fromStorage({
        pathToKeyMap: {
          '/data/ingredients': 'test:ingredients:v1'
        },
        storage: mockStorage,
        mutable: true
      }).orThrow();

      accessors
        .saveFileContents('/data/ingredients/collection1.json', JSON.stringify({ items: { a: 1 } }))
        .orThrow();
      accessors
        .saveFileContents('/data/ingredients/collection2.json', JSON.stringify({ items: { b: 2 } }))
        .orThrow();

      expect(accessors.isDirty()).toBe(true);
      expect(accessors.getDirtyPaths()).toHaveLength(2);
    });
  });

  describe('syncToDisk', () => {
    test('syncs modified files to storage', async () => {
      mockStorage.setItem(
        'test:ingredients:v1',
        JSON.stringify({ collection1: { items: { original: true } } })
      );

      const accessors = LocalStorageTreeAccessors.fromStorage({
        pathToKeyMap: {
          '/data/ingredients': 'test:ingredients:v1'
        },
        storage: mockStorage,
        mutable: true
      }).orThrow();

      const newContent = JSON.stringify({ items: { modified: true } });
      accessors.saveFileContents('/data/ingredients/collection1.json', newContent).orThrow();

      const syncResult = await accessors.syncToDisk();
      expect(syncResult).toSucceed();

      const stored = mockStorage.getItem('test:ingredients:v1');
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored!);
      expect(parsed.collection1.items.modified).toBe(true);
    });

    test('clears dirty state after successful sync', async () => {
      mockStorage.setItem('test:ingredients:v1', JSON.stringify({ collection1: { items: {} } }));

      const accessors = LocalStorageTreeAccessors.fromStorage({
        pathToKeyMap: {
          '/data/ingredients': 'test:ingredients:v1'
        },
        storage: mockStorage,
        mutable: true
      }).orThrow();

      accessors
        .saveFileContents('/data/ingredients/collection1.json', JSON.stringify({ items: { a: 1 } }))
        .orThrow();
      expect(accessors.isDirty()).toBe(true);

      await accessors.syncToDisk();
      expect(accessors.isDirty()).toBe(false);
      expect(accessors.getDirtyPaths()).toEqual([]);
    });

    test('syncs multiple files to same storage key', async () => {
      mockStorage.setItem(
        'test:ingredients:v1',
        JSON.stringify({
          collection1: { items: {} },
          collection2: { items: {} }
        })
      );

      const accessors = LocalStorageTreeAccessors.fromStorage({
        pathToKeyMap: {
          '/data/ingredients': 'test:ingredients:v1'
        },
        storage: mockStorage,
        mutable: true
      }).orThrow();

      accessors
        .saveFileContents('/data/ingredients/collection1.json', JSON.stringify({ items: { a: 1 } }))
        .orThrow();
      accessors
        .saveFileContents('/data/ingredients/collection2.json', JSON.stringify({ items: { b: 2 } }))
        .orThrow();

      await accessors.syncToDisk();

      const stored = mockStorage.getItem('test:ingredients:v1');
      const parsed = JSON.parse(stored!);
      expect(parsed.collection1.items.a).toBe(1);
      expect(parsed.collection2.items.b).toBe(2);
    });

    test('syncs files to different storage keys', async () => {
      mockStorage.setItem('test:ingredients:v1', JSON.stringify({ ing1: { items: {} } }));
      mockStorage.setItem('test:fillings:v1', JSON.stringify({ fill1: { items: {} } }));

      const accessors = LocalStorageTreeAccessors.fromStorage({
        pathToKeyMap: {
          '/data/ingredients': 'test:ingredients:v1',
          '/data/fillings': 'test:fillings:v1'
        },
        storage: mockStorage,
        mutable: true
      }).orThrow();

      accessors
        .saveFileContents('/data/ingredients/ing1.json', JSON.stringify({ items: { a: 1 } }))
        .orThrow();
      accessors.saveFileContents('/data/fillings/fill1.json', JSON.stringify({ items: { b: 2 } })).orThrow();

      await accessors.syncToDisk();

      const ingStored = JSON.parse(mockStorage.getItem('test:ingredients:v1')!);
      const fillStored = JSON.parse(mockStorage.getItem('test:fillings:v1')!);
      expect(ingStored.ing1.items.a).toBe(1);
      expect(fillStored.fill1.items.b).toBe(2);
    });

    test('succeeds with no dirty files', async () => {
      const accessors = LocalStorageTreeAccessors.fromStorage({
        pathToKeyMap: {
          '/data/ingredients': 'test:ingredients:v1'
        },
        storage: mockStorage
      }).orThrow();

      const result = await accessors.syncToDisk();
      expect(result).toSucceed();
    });

    test('preserves existing collections when syncing', async () => {
      mockStorage.setItem(
        'test:ingredients:v1',
        JSON.stringify({
          existing: { items: { keep: true } },
          toModify: { items: { original: true } }
        })
      );

      const accessors = LocalStorageTreeAccessors.fromStorage({
        pathToKeyMap: {
          '/data/ingredients': 'test:ingredients:v1'
        },
        storage: mockStorage,
        mutable: true
      }).orThrow();

      accessors
        .saveFileContents('/data/ingredients/toModify.json', JSON.stringify({ items: { modified: true } }))
        .orThrow();
      await accessors.syncToDisk();

      const stored = JSON.parse(mockStorage.getItem('test:ingredients:v1')!);
      expect(stored.existing.items.keep).toBe(true);
      expect(stored.toModify.items.modified).toBe(true);
    });
  });

  describe('autoSync mode', () => {
    test('automatically syncs on save when enabled', () => {
      mockStorage.setItem('test:ingredients:v1', JSON.stringify({ collection1: { items: {} } }));

      const accessors = LocalStorageTreeAccessors.fromStorage({
        pathToKeyMap: {
          '/data/ingredients': 'test:ingredients:v1'
        },
        storage: mockStorage,
        mutable: true,
        autoSync: true
      }).orThrow();

      accessors
        .saveFileContents('/data/ingredients/collection1.json', JSON.stringify({ items: { auto: true } }))
        .orThrow();

      expect(accessors.isDirty()).toBe(false);
      const stored = JSON.parse(mockStorage.getItem('test:ingredients:v1')!);
      expect(stored.collection1.items.auto).toBe(true);
    });

    test('does not auto-sync when disabled', () => {
      mockStorage.setItem('test:ingredients:v1', JSON.stringify({ collection1: { items: {} } }));

      const accessors = LocalStorageTreeAccessors.fromStorage({
        pathToKeyMap: {
          '/data/ingredients': 'test:ingredients:v1'
        },
        storage: mockStorage,
        mutable: true,
        autoSync: false
      }).orThrow();

      accessors
        .saveFileContents('/data/ingredients/collection1.json', JSON.stringify({ items: { manual: true } }))
        .orThrow();

      expect(accessors.isDirty()).toBe(true);
      const stored = JSON.parse(mockStorage.getItem('test:ingredients:v1')!);
      expect(stored.collection1.items.manual).toBeUndefined();
    });
  });

  describe('fileIsMutable', () => {
    test('returns persistent detail when mutable', () => {
      mockStorage.setItem('test:ingredients:v1', JSON.stringify({ collection1: { items: {} } }));

      const accessors = LocalStorageTreeAccessors.fromStorage({
        pathToKeyMap: {
          '/data/ingredients': 'test:ingredients:v1'
        },
        storage: mockStorage,
        mutable: true
      }).orThrow();

      expect(accessors.fileIsMutable('/data/ingredients/collection1.json')).toSucceedWithDetail(
        true,
        'persistent'
      );
    });

    test('returns not-mutable when not mutable', () => {
      mockStorage.setItem('test:ingredients:v1', JSON.stringify({ collection1: { items: {} } }));

      const accessors = LocalStorageTreeAccessors.fromStorage({
        pathToKeyMap: {
          '/data/ingredients': 'test:ingredients:v1'
        },
        storage: mockStorage,
        mutable: false
      }).orThrow();

      const result = accessors.fileIsMutable('/data/ingredients/collection1.json');
      expect(result.isFailure()).toBe(true);
      if (result.isFailure()) {
        expect(result.detail).toBe('not-mutable');
      }
    });
  });

  describe('integration with FileApiTreeAccessors', () => {
    test('createFromLocalStorage creates FileTree with persistent accessors', () => {
      mockStorage.setItem('test:ingredients:v1', JSON.stringify({ collection1: { items: {} } }));

      const result = FileApiTreeAccessors.createFromLocalStorage({
        pathToKeyMap: {
          '/data/ingredients': 'test:ingredients:v1'
        },
        storage: mockStorage,
        mutable: true
      });

      expect(result).toSucceed();

      const tree = result.orThrow();
      expect(tree).toBeInstanceOf(FileTree.FileTree);
      expect(FileTree.isPersistentAccessors(tree.hal)).toBe(true);

      const file = tree.getFile('/data/ingredients/collection1.json').orThrow();
      expect(file.getIsMutable()).toSucceedWithDetail(true, 'persistent');
    });

    test('createFromLocalStorage with multiple paths', () => {
      mockStorage.setItem('test:ingredients:v1', JSON.stringify({ ing1: { items: {} } }));
      mockStorage.setItem('test:fillings:v1', JSON.stringify({ fill1: { items: {} } }));

      const result = FileApiTreeAccessors.createFromLocalStorage({
        pathToKeyMap: {
          '/data/ingredients': 'test:ingredients:v1',
          '/data/fillings': 'test:fillings:v1'
        },
        storage: mockStorage,
        mutable: true
      });

      expect(result).toSucceedAndSatisfy((tree) => {
        expect(tree.getFile('/data/ingredients/ing1.json')).toSucceed();
        expect(tree.getFile('/data/fillings/fill1.json')).toSucceed();
      });
    });

    test('createFromLocalStorage with empty storage', () => {
      const result = FileApiTreeAccessors.createFromLocalStorage({
        pathToKeyMap: {
          '/data/ingredients': 'test:ingredients:v1'
        },
        storage: mockStorage
      });

      expect(result).toSucceedAndSatisfy((tree) => {
        expect(tree).toBeInstanceOf(FileTree.FileTree);
      });
    });
  });
});
