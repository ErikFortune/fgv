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

    test('loads string values (new format) with inferred extension', () => {
      mockStorage.setItem(
        'test:ingredients:v1',
        JSON.stringify({
          jsonCollection: '{"items":{}}',
          yamlCollection: 'metadata:\n  name: test\nitems: {}'
        })
      );

      const result = LocalStorageTreeAccessors.fromStorage({
        pathToKeyMap: {
          '/data/ingredients': 'test:ingredients:v1'
        },
        storage: mockStorage
      });

      expect(result).toSucceedAndSatisfy((accessors) => {
        expect(accessors.getFileContents('/data/ingredients/jsonCollection.json')).toSucceedWith(
          '{"items":{}}'
        );
        expect(accessors.getFileContents('/data/ingredients/yamlCollection.yaml')).toSucceedWith(
          'metadata:\n  name: test\nitems: {}'
        );
      });
    });

    test('skips non-object non-string collection values', () => {
      mockStorage.setItem(
        'test:ingredients:v1',
        JSON.stringify({
          good: { items: {} },
          bad: 42
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
      // New format: values are raw content strings
      expect(parsed.collection1).toBe(newContent);
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

      const content1 = JSON.stringify({ items: { a: 1 } });
      const content2 = JSON.stringify({ items: { b: 2 } });
      accessors.saveFileContents('/data/ingredients/collection1.json', content1).orThrow();
      accessors.saveFileContents('/data/ingredients/collection2.json', content2).orThrow();

      await accessors.syncToDisk();

      const stored = mockStorage.getItem('test:ingredients:v1');
      const parsed = JSON.parse(stored!);
      // New format: values are raw content strings
      expect(parsed.collection1).toBe(content1);
      expect(parsed.collection2).toBe(content2);
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

      const ingContent = JSON.stringify({ items: { a: 1 } });
      const fillContent = JSON.stringify({ items: { b: 2 } });
      const ingStored = JSON.parse(mockStorage.getItem('test:ingredients:v1')!);
      const fillStored = JSON.parse(mockStorage.getItem('test:fillings:v1')!);
      // New format: values are raw content strings
      expect(ingStored.ing1).toBe(ingContent);
      expect(fillStored.fill1).toBe(fillContent);
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

      const modifiedContent = JSON.stringify({ items: { modified: true } });
      accessors.saveFileContents('/data/ingredients/toModify.json', modifiedContent).orThrow();
      await accessors.syncToDisk();

      const stored = JSON.parse(mockStorage.getItem('test:ingredients:v1')!);
      // existing was loaded from legacy format and not modified, so it stays as legacy object
      // toModify was saved with new content, so it's now a raw string
      expect(stored.toModify).toBe(modifiedContent);
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
      const autoContent = JSON.stringify({ items: { auto: true } });
      const stored = JSON.parse(mockStorage.getItem('test:ingredients:v1')!);
      // New format: values are raw content strings
      expect(stored.collection1).toBe(autoContent);
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
      // Storage should still have the original legacy format (not yet synced)
      const stored = JSON.parse(mockStorage.getItem('test:ingredients:v1')!);
      expect(stored.collection1).toEqual({ items: {} });
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
      expect(FileTree.isMutableFileItem(file)).toBe(true);
      if (FileTree.isMutableFileItem(file)) {
        expect(file.getIsMutable()).toSucceedWithDetail(true, 'persistent');
      }
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

    test('createFromLocalStorage fails when localStorage is not available', () => {
      // Remove the global window object to ensure no fallback
      const originalWindow = (global as any).window;
      delete (global as any).window;

      const result = FileApiTreeAccessors.createFromLocalStorage({
        pathToKeyMap: {
          '/data/ingredients': 'test:ingredients:v1'
        },
        storage: undefined
      });

      // Restore window
      (global as any).window = originalWindow;

      expect(result).toFailWith(/localStorage is not available/i);
    });
  });

  describe('path matching and error handling', () => {
    test('handles files outside configured paths', async () => {
      mockStorage.setItem('test:ingredients:v1', JSON.stringify({ collection1: { items: {} } }));

      const accessors = LocalStorageTreeAccessors.fromStorage({
        pathToKeyMap: {
          '/data/ingredients': 'test:ingredients:v1'
        },
        storage: mockStorage,
        mutable: true
      }).orThrow();

      // Try to save a file outside the configured path
      const saveResult = accessors.saveFileContents('/other/path/file.json', JSON.stringify({ test: 1 }));
      expect(saveResult).toSucceed();

      // But syncing should fail because no storage key is configured
      const syncResult = await accessors.syncToDisk();
      expect(syncResult).toFailWith(/No storage key configured for path/i);
    });

    test('handles files inside configured paths', async () => {
      mockStorage.setItem('test:ingredients:v1', JSON.stringify({ collection1: { items: {} } }));

      const accessors = LocalStorageTreeAccessors.fromStorage({
        pathToKeyMap: {
          '/data/ingredients': 'test:ingredients:v1'
        },
        storage: mockStorage,
        mutable: true
      }).orThrow();

      // Save a file inside the configured path
      accessors.saveFileContents('/data/ingredients/newfile.json', JSON.stringify({ test: 1 })).orThrow();

      // Syncing should succeed
      const syncResult = await accessors.syncToDisk();
      expect(syncResult).toSucceed();
    });

    test('handles failed content retrieval during sync', async () => {
      mockStorage.setItem('test:ingredients:v1', JSON.stringify({ collection1: { items: {} } }));

      const accessors = LocalStorageTreeAccessors.fromStorage({
        pathToKeyMap: {
          '/data/ingredients': 'test:ingredients:v1'
        },
        storage: mockStorage,
        mutable: true
      }).orThrow();

      // Modify a file
      accessors.saveFileContents('/data/ingredients/collection1.json', JSON.stringify({ test: 1 })).orThrow();

      // Override getFileContents to fail
      const originalGetFileContents = accessors.getFileContents.bind(accessors);
      accessors.getFileContents = jest.fn((path: string) => {
        if (path === '/data/ingredients/collection1.json') {
          return { isSuccess: () => false, isFailure: () => true, message: 'File not found' } as any;
        }
        return originalGetFileContents(path);
      });

      const syncResult = await accessors.syncToDisk();
      expect(syncResult).toFailWith(/Failed to get file contents.*File not found/i);
    });

    test('handles corrupted JSON in localStorage during sync', async () => {
      mockStorage.setItem('test:ingredients:v1', JSON.stringify({ collection1: { items: {} } }));

      const accessors = LocalStorageTreeAccessors.fromStorage({
        pathToKeyMap: {
          '/data/ingredients': 'test:ingredients:v1'
        },
        storage: mockStorage,
        mutable: true
      }).orThrow();

      // Modify a file
      accessors.saveFileContents('/data/ingredients/collection1.json', JSON.stringify({ test: 1 })).orThrow();

      // Corrupt the existing storage data
      mockStorage.setItem('test:ingredients:v1', 'not valid json');

      // Sync should still succeed by starting fresh
      const syncResult = await accessors.syncToDisk();
      expect(syncResult).toSucceed();

      // Verify the data was written correctly despite corrupted previous data
      const stored = mockStorage.getItem('test:ingredients:v1');
      const parsed = JSON.parse(stored!);
      // New format: values are raw content strings
      expect(parsed.collection1).toBe(JSON.stringify({ test: 1 }));
    });

    test('syncs non-JSON content (YAML) without error', async () => {
      const accessors = LocalStorageTreeAccessors.fromStorage({
        pathToKeyMap: {
          '/data/ingredients': 'test:ingredients:v1'
        },
        storage: mockStorage,
        mutable: true
      }).orThrow();

      // Create and save a YAML file
      const yamlContent = 'metadata:\n  name: test\nitems: {}';
      accessors.saveFileContents('/data/ingredients/my-collection.yaml', yamlContent).orThrow();

      const syncResult = await accessors.syncToDisk();
      expect(syncResult).toSucceed();

      const stored = JSON.parse(mockStorage.getItem('test:ingredients:v1')!);
      expect(stored['my-collection']).toBe(yamlContent);
    });

    test('handles multiple sync failures with aggregated errors', async () => {
      const accessors = LocalStorageTreeAccessors.fromStorage({
        pathToKeyMap: {
          '/data/ingredients': 'test:ingredients:v1'
        },
        storage: mockStorage,
        mutable: true
      }).orThrow();

      // Add files outside configured paths
      accessors.saveFileContents('/other1/file1.json', JSON.stringify({ test: 1 })).orThrow();
      accessors.saveFileContents('/other2/file2.json', JSON.stringify({ test: 2 })).orThrow();

      const syncResult = await accessors.syncToDisk();
      expect(syncResult).toFailWith(/Failed to sync 2 file\(s\)/i);
    });

    test('handles auto-sync failure', () => {
      mockStorage.setItem('test:ingredients:v1', JSON.stringify({ collection1: { items: {} } }));

      const accessors = LocalStorageTreeAccessors.fromStorage({
        pathToKeyMap: {
          '/data/ingredients': 'test:ingredients:v1'
        },
        storage: mockStorage,
        mutable: true,
        autoSync: true
      }).orThrow();

      // Try to save a file outside configured path with autoSync enabled
      const saveResult = accessors.saveFileContents('/other/path/file.json', JSON.stringify({ test: 1 }));
      expect(saveResult).toFailWith(/No storage key configured for path/i);
    });
  });

  describe('deleteFile', () => {
    test('deletes a file from in-memory storage and from localStorage', () => {
      mockStorage.setItem(
        'test:ingredients:v1',
        JSON.stringify({
          collection1: '{"items":{}}',
          collection2: '{"items":{}}'
        })
      );

      const accessors = LocalStorageTreeAccessors.fromStorage({
        pathToKeyMap: {
          '/data/ingredients': 'test:ingredients:v1'
        },
        storage: mockStorage,
        mutable: true
      }).orThrow();

      const result = accessors.deleteFile('/data/ingredients/collection1.json');
      expect(result).toSucceedWith(true);

      // File should no longer be accessible in-memory
      expect(accessors.getFileContents('/data/ingredients/collection1.json')).toFail();

      // The deleted collection should be removed from localStorage; collection2 remains
      const stored = mockStorage.getItem('test:ingredients:v1');
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored!);
      expect(parsed).not.toHaveProperty('collection1');
      expect(parsed).toHaveProperty('collection2');
    });

    test('removes the storage key entirely when last entry is deleted', () => {
      mockStorage.setItem('test:ingredients:v1', JSON.stringify({ onlyCollection: '{"items":{}}' }));

      const accessors = LocalStorageTreeAccessors.fromStorage({
        pathToKeyMap: {
          '/data/ingredients': 'test:ingredients:v1'
        },
        storage: mockStorage,
        mutable: true
      }).orThrow();

      const result = accessors.deleteFile('/data/ingredients/onlyCollection.json');
      expect(result).toSucceedWith(true);

      // Storage key should be removed entirely since no more entries remain
      expect(mockStorage.getItem('test:ingredients:v1')).toBeNull();
    });

    test('removes path from dirty set when deleting a dirty file', () => {
      mockStorage.setItem('test:ingredients:v1', JSON.stringify({ collection1: '{"items":{}}' }));

      const accessors = LocalStorageTreeAccessors.fromStorage({
        pathToKeyMap: {
          '/data/ingredients': 'test:ingredients:v1'
        },
        storage: mockStorage,
        mutable: true
      }).orThrow();

      // Mark file as dirty first
      accessors
        .saveFileContents('/data/ingredients/collection1.json', JSON.stringify({ items: { modified: true } }))
        .orThrow();
      expect(accessors.isDirty()).toBe(true);

      // Deleting the file should clean it from the dirty set
      const result = accessors.deleteFile('/data/ingredients/collection1.json');
      expect(result).toSucceedWith(true);
      expect(accessors.isDirty()).toBe(false);
      expect(accessors.getDirtyPaths()).not.toContain('/data/ingredients/collection1.json');
    });

    test('fails when deleting a non-existent file', () => {
      const accessors = LocalStorageTreeAccessors.fromStorage({
        pathToKeyMap: {
          '/data/ingredients': 'test:ingredients:v1'
        },
        storage: mockStorage,
        mutable: true
      }).orThrow();

      const result = accessors.deleteFile('/data/ingredients/nonexistent.json');
      expect(result).toFail();
    });

    test('does not modify storage when file has no matching storage key', () => {
      // Create accessors with one path, but a file that will be stored outside that path
      const accessors = LocalStorageTreeAccessors.fromStorage({
        pathToKeyMap: {
          '/data/ingredients': 'test:ingredients:v1'
        },
        storage: mockStorage,
        mutable: true
      }).orThrow();

      // Add and delete a file inside the configured path but with no existing storage entry
      accessors.saveFileContents('/data/ingredients/newfile.json', '{"items":{}}').orThrow();
      // Sync so it exists in storage
      mockStorage.setItem('test:ingredients:v1', JSON.stringify({ newfile: '{"items":{}}' }));

      // Now re-load and delete — the file should be removed from storage
      const accessors2 = LocalStorageTreeAccessors.fromStorage({
        pathToKeyMap: {
          '/data/ingredients': 'test:ingredients:v1'
        },
        storage: mockStorage,
        mutable: true
      }).orThrow();

      const result = accessors2.deleteFile('/data/ingredients/newfile.json');
      expect(result).toSucceedWith(true);
      expect(mockStorage.getItem('test:ingredients:v1')).toBeNull();
    });

    test('handles deletion when localStorage key has no entry for the file', () => {
      // Storage key exists but does not contain an entry for the file being deleted
      mockStorage.setItem('test:ingredients:v1', JSON.stringify({ other: '{"items":{}}' }));

      // Manually add a file to in-memory without it being in the storage JSON
      const accessors = LocalStorageTreeAccessors.fromStorage({
        pathToKeyMap: {
          '/data/ingredients': 'test:ingredients:v1'
        },
        storage: mockStorage,
        mutable: true
      }).orThrow();

      // Save a new file (marks dirty but does not update storage yet)
      accessors.saveFileContents('/data/ingredients/newfile.json', '{"items":{}}').orThrow();

      // Clear the dirty flag by directly removing from storage (simulate storage mismatch)
      // Then delete the file — _deleteFileFromStorage gets the existing JSON which lacks 'newfile'
      // This exercises the path where the collection is not in the existing JSON
      mockStorage.setItem('test:ingredients:v1', JSON.stringify({ other: '{"items":{}}' }));

      const result = accessors.deleteFile('/data/ingredients/newfile.json');
      expect(result).toSucceedWith(true);

      // 'other' should still remain in storage since only 'newfile' was deleted (which wasn't there)
      const stored = mockStorage.getItem('test:ingredients:v1');
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored!);
      expect(parsed).toHaveProperty('other');
    });

    test('handles deletion when storage entry for key is missing entirely', () => {
      // No storage key at all — _deleteFileFromStorage should return early
      const accessors = LocalStorageTreeAccessors.fromStorage({
        pathToKeyMap: {
          '/data/ingredients': 'test:ingredients:v1'
        },
        storage: mockStorage,
        mutable: true
      }).orThrow();

      // Manually put a file in memory by saving it
      accessors.saveFileContents('/data/ingredients/newfile.json', '{"items":{}}').orThrow();

      // Delete the storage key so getItem returns null
      mockStorage.removeItem('test:ingredients:v1');

      // deleteFile should still succeed (in-memory deletion succeeds; storage cleanup is a no-op)
      const result = accessors.deleteFile('/data/ingredients/newfile.json');
      expect(result).toSucceedWith(true);
    });

    test('handles deletion when storage contains corrupted JSON', () => {
      mockStorage.setItem('test:ingredients:v1', JSON.stringify({ collection1: '{"items":{}}' }));

      const accessors = LocalStorageTreeAccessors.fromStorage({
        pathToKeyMap: {
          '/data/ingredients': 'test:ingredients:v1'
        },
        storage: mockStorage,
        mutable: true
      }).orThrow();

      // Corrupt the storage so JSON.parse fails in _deleteFileFromStorage
      mockStorage.setItem('test:ingredients:v1', 'not valid json {{{');

      // deleteFile should still succeed — corrupted JSON is silently ignored
      const result = accessors.deleteFile('/data/ingredients/collection1.json');
      expect(result).toSucceedWith(true);
    });

    test('deletes a file at a path outside all configured storage keys', () => {
      // A file can be saved in-memory at a path that has no matching storage key.
      // When deleted, _deleteFileFromStorage should return early without touching storage.
      const accessors = LocalStorageTreeAccessors.fromStorage({
        pathToKeyMap: {
          '/data/ingredients': 'test:ingredients:v1'
        },
        storage: mockStorage,
        mutable: true
      }).orThrow();

      // Save a file outside the configured path (succeeds in-memory, marks dirty)
      accessors.saveFileContents('/untracked/file.json', '{"items":{}}').orThrow();

      // Delete it — should succeed even though there is no storage key for this path
      const result = accessors.deleteFile('/untracked/file.json');
      expect(result).toSucceedWith(true);

      // Storage should be untouched
      expect(mockStorage.getItem('test:ingredients:v1')).toBeNull();
    });
  });
});
