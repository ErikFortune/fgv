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

import { Converters, fail, Failure, Logging, succeed, succeedWithDetail, Success } from '@fgv/ts-utils';
import { FileTree, JsonObject, JsonValue } from '@fgv/ts-json-base';

import { CollectionLoader } from '../../../packlets/library-data';
import { CryptoUtils } from '@fgv/ts-extras';

/**
 * Creates a mock logger that captures log messages for testing.
 */
function createMockLogger(): {
  reporter: Logging.LogReporter<unknown>;
  messages: { level: string; message: string }[];
} {
  const messages: { level: string; message: string }[] = [];
  const logger: Logging.ILogger = {
    logLevel: 'all',
    log: (_level, message) => {
      messages.push({ level: 'log', message: String(message) });
      return succeed(String(message));
    },
    detail: (message) => {
      messages.push({ level: 'detail', message: String(message) });
      return succeed(String(message));
    },
    info: (message) => {
      messages.push({ level: 'info', message: String(message) });
      return succeed(String(message));
    },
    warn: (message) => {
      messages.push({ level: 'warn', message: String(message) });
      return succeed(String(message));
    },
    error: (message) => {
      messages.push({ level: 'error', message: String(message) });
      return succeed(String(message));
    }
  };
  const reporter = new Logging.LogReporter<unknown>({ logger });
  return { reporter, messages };
}

// Branded string types for testing
type TestCollectionId = string & { readonly __testCollectionId: unique symbol };
type TestItemId = string & { readonly __testItemId: unique symbol };

interface ITestItem {
  name: string;
  value: number;
}

// Collection ID converter validates/converts the ID after .json extension is already removed
const testCollectionIdConverter = Converters.string.map((s) => Success.with(s as TestCollectionId));

const testItemIdConverter = Converters.string.map((s) => Success.with(s as TestItemId));
const testItemConverter = Converters.strictObject<ITestItem>({
  name: Converters.string,
  value: Converters.number
});

describe('CollectionLoader', () => {
  // ============================================================================
  // Constructor Tests
  // ============================================================================

  describe('constructor', () => {
    test('creates loader with required params', () => {
      const loader = new CollectionLoader({
        itemConverter: testItemConverter,
        collectionIdConverter: testCollectionIdConverter,
        itemIdConverter: testItemIdConverter
      });

      expect(loader).toBeInstanceOf(CollectionLoader);
    });

    test('creates loader with mutable option (boolean)', () => {
      const loader = new CollectionLoader({
        itemConverter: testItemConverter,
        collectionIdConverter: testCollectionIdConverter,
        itemIdConverter: testItemIdConverter,
        mutable: true
      });

      expect(loader).toBeInstanceOf(CollectionLoader);
    });

    test('creates loader with mutable option (array)', () => {
      const loader = new CollectionLoader({
        itemConverter: testItemConverter,
        collectionIdConverter: testCollectionIdConverter,
        itemIdConverter: testItemIdConverter,
        mutable: ['collection1', 'collection2']
      });

      expect(loader).toBeInstanceOf(CollectionLoader);
    });

    test('creates loader with mutable option (immutable object)', () => {
      const loader = new CollectionLoader({
        itemConverter: testItemConverter,
        collectionIdConverter: testCollectionIdConverter,
        itemIdConverter: testItemIdConverter,
        mutable: { immutable: ['collection1'] }
      });

      expect(loader).toBeInstanceOf(CollectionLoader);
    });

    test('creates loader with custom fileNameConverter', () => {
      // Custom converter that removes .yaml extension instead of .json
      const removeYamlExtension = Converters.generic<string>((from: unknown) => {
        if (typeof from !== 'string') {
          return Failure.with('Expected string');
        }
        if (from.endsWith('.yaml')) {
          return Success.with(from.slice(0, -5));
        }
        return Failure.with('Expected .yaml extension');
      });

      const loader = new CollectionLoader({
        itemConverter: testItemConverter,
        collectionIdConverter: testCollectionIdConverter,
        itemIdConverter: testItemIdConverter,
        fileNameConverter: removeYamlExtension
      });

      expect(loader).toBeInstanceOf(CollectionLoader);
    });
  });

  // ============================================================================
  // loadFromFileTree Tests
  // ============================================================================

  describe('loadFromFileTree', () => {
    let loader: CollectionLoader<ITestItem, TestCollectionId, TestItemId>;

    beforeEach(() => {
      loader = new CollectionLoader({
        itemConverter: testItemConverter,
        collectionIdConverter: testCollectionIdConverter,
        itemIdConverter: testItemIdConverter
      });
    });

    test('loads single collection from directory', () => {
      const collectionData = {
        items: {
          /* eslint-disable @typescript-eslint/naming-convention */
          'item-1': { name: 'Item One', value: 1 },
          'item-2': { name: 'Item Two', value: 2 }
          /* eslint-enable @typescript-eslint/naming-convention */
        }
      };

      const files: FileTree.IInMemoryFile[] = [
        { path: '/collections/test-collection.json', contents: collectionData }
      ];

      expect(FileTree.inMemory(files)).toSucceedAndSatisfy((tree) => {
        expect(tree.getItem('/collections')).toSucceedAndSatisfy((dir) => {
          expect(loader.loadFromFileTree(dir)).toSucceedAndSatisfy((result) => {
            expect(result.collections).toHaveLength(1);
            expect(result.collections[0].id).toBe('test-collection');
            expect(result.collections[0].isMutable).toBe(false); // default
            expect(Object.keys(result.collections[0].items)).toHaveLength(2);
          });
        });
      });
    });

    test('sets sourceName to "unknown" when not provided', () => {
      const collectionData = {
        items: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          'item-1': { name: 'Item', value: 1 }
        }
      };

      const files: FileTree.IInMemoryFile[] = [{ path: '/collections/test.json', contents: collectionData }];

      expect(FileTree.inMemory(files)).toSucceedAndSatisfy((tree) => {
        expect(tree.getItem('/collections')).toSucceedAndSatisfy((dir) => {
          expect(loader.loadFromFileTree(dir)).toSucceedAndSatisfy((result) => {
            expect(result.collections[0].metadata?.sourceName).toBe('unknown');
          });
        });
      });
    });

    test('uses provided sourceName in metadata', () => {
      const collectionData = {
        items: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          'item-1': { name: 'Item', value: 1 }
        }
      };

      const files: FileTree.IInMemoryFile[] = [{ path: '/collections/test.json', contents: collectionData }];

      expect(FileTree.inMemory(files)).toSucceedAndSatisfy((tree) => {
        expect(tree.getItem('/collections')).toSucceedAndSatisfy((dir) => {
          expect(loader.loadFromFileTree(dir, { sourceName: 'my-source' })).toSucceedAndSatisfy((result) => {
            expect(result.collections[0].metadata?.sourceName).toBe('my-source');
          });
        });
      });
    });

    test('loads multiple collections from directory', () => {
      const collection1 = {
        items: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          'item-a': { name: 'Item A', value: 10 }
        }
      };
      const collection2 = {
        items: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          'item-b': { name: 'Item B', value: 20 }
        }
      };

      const files: FileTree.IInMemoryFile[] = [
        { path: '/collections/first.json', contents: collection1 },
        { path: '/collections/second.json', contents: collection2 }
      ];

      expect(FileTree.inMemory(files)).toSucceedAndSatisfy((tree) => {
        expect(tree.getItem('/collections')).toSucceedAndSatisfy((dir) => {
          expect(loader.loadFromFileTree(dir)).toSucceedAndSatisfy((result) => {
            expect(result.collections).toHaveLength(2);
            const ids = result.collections.map((c) => c.id).sort();
            expect(ids).toEqual(['first', 'second']);
          });
        });
      });
    });

    test('respects mutable: true option (all mutable)', () => {
      const mutableLoader = new CollectionLoader({
        itemConverter: testItemConverter,
        collectionIdConverter: testCollectionIdConverter,
        itemIdConverter: testItemIdConverter,
        mutable: true
      });

      const files: FileTree.IInMemoryFile[] = [
        { path: '/collections/test.json', contents: { items: { item: { name: 'Test', value: 1 } } } }
      ];

      expect(FileTree.inMemory(files)).toSucceedAndSatisfy((tree) => {
        expect(tree.getItem('/collections')).toSucceedAndSatisfy((dir) => {
          expect(mutableLoader.loadFromFileTree(dir)).toSucceedAndSatisfy((result) => {
            expect(result.collections).toHaveLength(1);
            expect(result.collections[0].isMutable).toBe(true);
          });
        });
      });
    });

    test('respects mutable: false option (all immutable)', () => {
      const immutableLoader = new CollectionLoader({
        itemConverter: testItemConverter,
        collectionIdConverter: testCollectionIdConverter,
        itemIdConverter: testItemIdConverter,
        mutable: false
      });

      const files: FileTree.IInMemoryFile[] = [
        { path: '/collections/test.json', contents: { items: { item: { name: 'Test', value: 1 } } } }
      ];

      expect(FileTree.inMemory(files)).toSucceedAndSatisfy((tree) => {
        expect(tree.getItem('/collections')).toSucceedAndSatisfy((dir) => {
          expect(immutableLoader.loadFromFileTree(dir)).toSucceedAndSatisfy((result) => {
            expect(result.collections).toHaveLength(1);
            expect(result.collections[0].isMutable).toBe(false);
          });
        });
      });
    });

    test('marks specific collections as mutable with array spec', () => {
      const files: FileTree.IInMemoryFile[] = [
        {
          path: '/collections/immutable.json',
          contents: { items: { item: { name: 'Immutable', value: 1 } } }
        },
        { path: '/collections/mutable.json', contents: { items: { item: { name: 'Mutable', value: 2 } } } }
      ];

      expect(FileTree.inMemory(files)).toSucceedAndSatisfy((tree) => {
        expect(tree.getItem('/collections')).toSucceedAndSatisfy((dir) => {
          expect(loader.loadFromFileTree(dir, { mutable: ['mutable'] })).toSucceedAndSatisfy((result) => {
            expect(result.collections).toHaveLength(2);
            const mutableCollection = result.collections.find((c) => c.id === 'mutable');
            const immutableCollection = result.collections.find((c) => c.id === 'immutable');
            expect(mutableCollection?.isMutable).toBe(true);
            expect(immutableCollection?.isMutable).toBe(false);
          });
        });
      });
    });

    test('marks specific collections as immutable with immutable object spec', () => {
      const files: FileTree.IInMemoryFile[] = [
        {
          path: '/collections/immutable.json',
          contents: { items: { item: { name: 'Immutable', value: 1 } } }
        },
        { path: '/collections/mutable.json', contents: { items: { item: { name: 'Mutable', value: 2 } } } }
      ];

      expect(FileTree.inMemory(files)).toSucceedAndSatisfy((tree) => {
        expect(tree.getItem('/collections')).toSucceedAndSatisfy((dir) => {
          expect(loader.loadFromFileTree(dir, { mutable: { immutable: ['immutable'] } })).toSucceedAndSatisfy(
            (result) => {
              expect(result.collections).toHaveLength(2);
              const mutableCollection = result.collections.find((c) => c.id === 'mutable');
              const immutableCollection = result.collections.find((c) => c.id === 'immutable');
              expect(mutableCollection?.isMutable).toBe(true);
              expect(immutableCollection?.isMutable).toBe(false);
            }
          );
        });
      });
    });

    test('load params override init default mutability', () => {
      // Loader defaults to all mutable
      const mutableLoader = new CollectionLoader({
        itemConverter: testItemConverter,
        collectionIdConverter: testCollectionIdConverter,
        itemIdConverter: testItemIdConverter,
        mutable: true
      });

      const files: FileTree.IInMemoryFile[] = [
        { path: '/collections/test.json', contents: { items: { item: { name: 'Test', value: 1 } } } }
      ];

      expect(FileTree.inMemory(files)).toSucceedAndSatisfy((tree) => {
        expect(tree.getItem('/collections')).toSucceedAndSatisfy((dir) => {
          // Override with false to make all immutable
          expect(mutableLoader.loadFromFileTree(dir, { mutable: false })).toSucceedAndSatisfy((result) => {
            expect(result.collections).toHaveLength(1);
            expect(result.collections[0].isMutable).toBe(false);
          });
        });
      });
    });

    test('loads with recurseWithDelimiter option', () => {
      const files: FileTree.IInMemoryFile[] = [
        { path: '/collections/root.json', contents: { items: { item: { name: 'Root', value: 1 } } } },
        {
          path: '/collections/subdir/nested.json',
          contents: { items: { item: { name: 'Nested', value: 2 } } }
        }
      ];

      expect(FileTree.inMemory(files)).toSucceedAndSatisfy((tree) => {
        expect(tree.getItem('/collections')).toSucceedAndSatisfy((dir) => {
          expect(loader.loadFromFileTree(dir, { recurseWithDelimiter: '/' })).toSucceedAndSatisfy(
            (result) => {
              expect(result.collections).toHaveLength(2);
              const ids = result.collections.map((c) => c.id).sort();
              expect(ids).toEqual(['root', 'subdir/nested']);
            }
          );
        });
      });
    });

    test('handles empty directory', () => {
      const files: FileTree.IInMemoryFile[] = [
        { path: '/collections/subdir/file.json', contents: { items: {} } }
      ];

      expect(FileTree.inMemory(files)).toSucceedAndSatisfy((tree) => {
        expect(tree.getItem('/collections')).toSucceedAndSatisfy((dir) => {
          expect(loader.loadFromFileTree(dir)).toSucceedAndSatisfy((result) => {
            expect(result.collections).toHaveLength(0);
          });
        });
      });
    });

    test('fails when file contains invalid item structure', () => {
      const invalidCollection = {
        items: {
          /* eslint-disable @typescript-eslint/naming-convention */
          'valid-item': { name: 'Valid', value: 1 },
          'invalid-item': { name: 'Missing Value' } // missing 'value' field
          /* eslint-enable @typescript-eslint/naming-convention */
        }
      };

      const files: FileTree.IInMemoryFile[] = [
        { path: '/collections/test.json', contents: invalidCollection }
      ];

      expect(FileTree.inMemory(files)).toSucceedAndSatisfy((tree) => {
        expect(tree.getItem('/collections')).toSucceedAndSatisfy((dir) => {
          expect(loader.loadFromFileTree(dir)).toFail();
        });
      });
    });

    test('fails when directory contains non-directory item', () => {
      const files: FileTree.IInMemoryFile[] = [{ path: '/file.json', contents: {} }];

      expect(FileTree.inMemory(files)).toSucceedAndSatisfy((tree) => {
        expect(tree.getItem('/file.json')).toSucceedAndSatisfy((file) => {
          expect(loader.loadFromFileTree(file)).toFailWith(/Not a directory/i);
        });
      });
    });

    test('filters out files with invalid collection id format', () => {
      // Using a stricter collection ID converter that only accepts lowercase letters.
      // The loader composes removeJsonExtension with this converter, so it receives
      // the name without .json extension.
      const strictCollectionIdConverter = Converters.generic<TestCollectionId>((from: unknown) => {
        if (typeof from !== 'string') {
          return Failure.with('Expected string');
        }
        if (!/^[a-z]+$/.test(from)) {
          return Failure.with(`Invalid collection ID: ${from}`);
        }
        return Success.with(from as TestCollectionId);
      });

      const strictLoader = new CollectionLoader({
        itemConverter: testItemConverter,
        collectionIdConverter: strictCollectionIdConverter,
        itemIdConverter: testItemIdConverter
      });

      const files: FileTree.IInMemoryFile[] = [
        { path: '/collections/valid.json', contents: { items: { item: { name: 'Valid', value: 1 } } } },
        { path: '/collections/INVALID.json', contents: { items: { item: { name: 'Invalid', value: 2 } } } },
        {
          path: '/collections/also-invalid.json',
          contents: { items: { item: { name: 'Also Invalid', value: 3 } } }
        }
      ];

      expect(FileTree.inMemory(files)).toSucceedAndSatisfy((tree) => {
        expect(tree.getItem('/collections')).toSucceedAndSatisfy((dir) => {
          expect(strictLoader.loadFromFileTree(dir)).toSucceedAndSatisfy((result) => {
            expect(result.collections).toHaveLength(1);
            expect(result.collections[0].id).toBe('valid');
          });
        });
      });
    });

    test('loads collections with complex nested data', () => {
      const complexCollection = {
        items: {
          /* eslint-disable @typescript-eslint/naming-convention */
          'item-1': { name: 'Complex Item', value: 42 },
          'item-2': { name: 'Another Item', value: 100 }
          /* eslint-enable @typescript-eslint/naming-convention */
        }
      };

      const files: FileTree.IInMemoryFile[] = [
        { path: '/data/my-collection.json', contents: complexCollection }
      ];

      expect(FileTree.inMemory(files)).toSucceedAndSatisfy((tree) => {
        expect(tree.getItem('/data')).toSucceedAndSatisfy((dir) => {
          expect(loader.loadFromFileTree(dir)).toSucceedAndSatisfy((result) => {
            expect(result.collections).toHaveLength(1);
            expect(result.collections[0].id).toBe('my-collection');
            expect(result.collections[0].items['item-1' as TestItemId]).toEqual({
              name: 'Complex Item',
              value: 42
            });
            expect(result.collections[0].items['item-2' as TestItemId]).toEqual({
              name: 'Another Item',
              value: 100
            });
          });
        });
      });
    });

    test('uses custom fileNameConverter for non-json files', () => {
      // Custom converter that removes .yaml extension
      const removeYamlExtension = Converters.generic<string>((from: unknown) => {
        if (typeof from !== 'string') {
          return Failure.with('Expected string');
        }
        if (from.endsWith('.yaml')) {
          return Success.with(from.slice(0, -5));
        }
        return Failure.with('Expected .yaml extension');
      });

      const yamlLoader = new CollectionLoader({
        itemConverter: testItemConverter,
        collectionIdConverter: testCollectionIdConverter,
        itemIdConverter: testItemIdConverter,
        fileNameConverter: removeYamlExtension
      });

      const files: FileTree.IInMemoryFile[] = [
        { path: '/collections/test.yaml', contents: { items: { item: { name: 'YAML Item', value: 42 } } } },
        { path: '/collections/ignored.json', contents: { items: { item: { name: 'JSON Item', value: 1 } } } }
      ];

      expect(FileTree.inMemory(files)).toSucceedAndSatisfy((tree) => {
        expect(tree.getItem('/collections')).toSucceedAndSatisfy((dir) => {
          expect(yamlLoader.loadFromFileTree(dir)).toSucceedAndSatisfy((result) => {
            // Only .yaml file should be loaded, .json should be filtered out
            expect(result.collections).toHaveLength(1);
            expect(result.collections[0].id).toBe('test');
          });
        });
      });
    });

    test('fails when encountering encrypted collection file with onEncryptedFile: fail', async () => {
      const collectionData = {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        'item-1': { name: 'Secret Item', value: 42 }
      };
      const key = (await CryptoUtils.nodeCryptoProvider.generateKey()).orThrow();
      const encrypted = (
        await CryptoUtils.createEncryptedFile({
          content: collectionData,
          secretName: 'test-secret',
          key,
          cryptoProvider: CryptoUtils.nodeCryptoProvider
        })
      ).orThrow();

      const files: FileTree.IInMemoryFile[] = [
        { path: '/collections/encrypted.json', contents: encrypted as unknown as JsonObject }
      ];

      expect(FileTree.inMemory(files)).toSucceedAndSatisfy((tree) => {
        expect(tree.getItem('/collections')).toSucceedAndSatisfy((dir) => {
          expect(loader.loadFromFileTree(dir, { onEncryptedFile: 'fail' })).toFailWith(
            /use loadFromFileTreeAsync instead/i
          );
        });
      });
    });

    test('skips encrypted collection file with default behavior (warn)', async () => {
      const collectionData = {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        'item-1': { name: 'Secret Item', value: 42 }
      };
      const key = (await CryptoUtils.nodeCryptoProvider.generateKey()).orThrow();
      const encrypted = (
        await CryptoUtils.createEncryptedFile({
          content: collectionData,
          secretName: 'test-secret',
          key,
          cryptoProvider: CryptoUtils.nodeCryptoProvider
        })
      ).orThrow();

      const files: FileTree.IInMemoryFile[] = [
        { path: '/collections/encrypted.json', contents: encrypted as unknown as JsonObject }
      ];

      // Create a mock logger to capture warnings
      const { reporter, messages } = createMockLogger();
      const loaderWithLogger = new CollectionLoader({
        itemConverter: testItemConverter,
        collectionIdConverter: testCollectionIdConverter,
        itemIdConverter: testItemIdConverter,
        logger: reporter
      });

      expect(FileTree.inMemory(files)).toSucceedAndSatisfy((tree) => {
        expect(tree.getItem('/collections')).toSucceedAndSatisfy((dir) => {
          // Using 'warn' mode should warn and skip, returning empty collections but capturing protected
          expect(loaderWithLogger.loadFromFileTree(dir, { onEncryptedFile: 'warn' })).toSucceedAndSatisfy(
            (result) => {
              expect(result.collections).toHaveLength(0);
            }
          );
        });
      });

      const warnMessages = messages.filter((m) => m.level === 'warn');
      expect(warnMessages.length).toBeGreaterThan(0);
      expect(warnMessages.some((m) => m.message.includes('Skipping encrypted collection'))).toBe(true);
    });

    test('silently skips encrypted collection file with onEncryptedFile: skip', async () => {
      const collectionData = {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        'item-1': { name: 'Secret Item', value: 42 }
      };
      const key = (await CryptoUtils.nodeCryptoProvider.generateKey()).orThrow();
      const encrypted = (
        await CryptoUtils.createEncryptedFile({
          content: collectionData,
          secretName: 'test-secret',
          key,
          cryptoProvider: CryptoUtils.nodeCryptoProvider
        })
      ).orThrow();

      const files: FileTree.IInMemoryFile[] = [
        { path: '/collections/encrypted.json', contents: encrypted as unknown as JsonObject }
      ];

      // Use jest.spyOn to verify no warning is logged
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      expect(FileTree.inMemory(files)).toSucceedAndSatisfy((tree) => {
        expect(tree.getItem('/collections')).toSucceedAndSatisfy((dir) => {
          // Skip mode should silently skip, returning empty array
          expect(loader.loadFromFileTree(dir, { onEncryptedFile: 'skip' })).toSucceedAndSatisfy((result) => {
            expect(result.collections).toHaveLength(0);
          });
        });
      });

      expect(warnSpy).not.toHaveBeenCalled();
      warnSpy.mockRestore();
    });

    test('captures encrypted collection file with onEncryptedFile: capture (default)', async () => {
      const collectionData = {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        'item-1': { name: 'Secret Item', value: 42 }
      };
      const key = (await CryptoUtils.nodeCryptoProvider.generateKey()).orThrow();
      const encrypted = (
        await CryptoUtils.createEncryptedFile({
          content: collectionData,
          secretName: 'test-secret',
          key,
          cryptoProvider: CryptoUtils.nodeCryptoProvider,
          metadata: { description: 'Test encrypted', itemCount: 1 }
        })
      ).orThrow();

      const files: FileTree.IInMemoryFile[] = [
        { path: '/collections/encrypted.json', contents: encrypted as unknown as JsonObject }
      ];

      expect(FileTree.inMemory(files)).toSucceedAndSatisfy((tree) => {
        expect(tree.getItem('/collections')).toSucceedAndSatisfy((dir) => {
          // Default (capture) mode should capture protected collections
          expect(loader.loadFromFileTree(dir)).toSucceedAndSatisfy((result) => {
            expect(result.collections).toHaveLength(0);
            expect(result.protectedCollections).toHaveLength(1);
            expect(result.protectedCollections[0].ref.collectionId).toBe('encrypted');
            expect(result.protectedCollections[0].ref.secretName).toBe('test-secret');
            expect(result.protectedCollections[0].ref.description).toBe('Test encrypted');
            expect(result.protectedCollections[0].ref.itemCount).toBe(1);
          });
        });
      });
    });

    test('captures encrypted collection with array mutability spec', async () => {
      const collectionData = {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        'item-1': { name: 'Secret Item', value: 42 }
      };
      const key = (await CryptoUtils.nodeCryptoProvider.generateKey()).orThrow();
      const encrypted = (
        await CryptoUtils.createEncryptedFile({
          content: collectionData,
          secretName: 'test-secret',
          key,
          cryptoProvider: CryptoUtils.nodeCryptoProvider
        })
      ).orThrow();

      const files: FileTree.IInMemoryFile[] = [
        { path: '/collections/encrypted.json', contents: encrypted as unknown as JsonObject }
      ];

      expect(FileTree.inMemory(files)).toSucceedAndSatisfy((tree) => {
        expect(tree.getItem('/collections')).toSucceedAndSatisfy((dir) => {
          // Collection is in mutable array
          expect(loader.loadFromFileTree(dir, { mutable: ['encrypted'] })).toSucceedAndSatisfy((result) => {
            expect(result.protectedCollections).toHaveLength(1);
            expect(result.protectedCollections[0].ref.isMutable).toBe(true);
          });

          // Collection is NOT in mutable array
          expect(loader.loadFromFileTree(dir, { mutable: ['other'] })).toSucceedAndSatisfy((result) => {
            expect(result.protectedCollections).toHaveLength(1);
            expect(result.protectedCollections[0].ref.isMutable).toBe(false);
          });
        });
      });
    });

    test('captures encrypted collection with immutable object spec', async () => {
      const collectionData = {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        'item-1': { name: 'Secret Item', value: 42 }
      };
      const key = (await CryptoUtils.nodeCryptoProvider.generateKey()).orThrow();
      const encrypted = (
        await CryptoUtils.createEncryptedFile({
          content: collectionData,
          secretName: 'test-secret',
          key,
          cryptoProvider: CryptoUtils.nodeCryptoProvider
        })
      ).orThrow();

      const files: FileTree.IInMemoryFile[] = [
        { path: '/collections/encrypted.json', contents: encrypted as unknown as JsonObject }
      ];

      expect(FileTree.inMemory(files)).toSucceedAndSatisfy((tree) => {
        expect(tree.getItem('/collections')).toSucceedAndSatisfy((dir) => {
          // Collection is in immutable list
          expect(loader.loadFromFileTree(dir, { mutable: { immutable: ['encrypted'] } })).toSucceedAndSatisfy(
            (result) => {
              expect(result.protectedCollections).toHaveLength(1);
              expect(result.protectedCollections[0].ref.isMutable).toBe(false);
            }
          );

          // Collection is NOT in immutable list
          expect(loader.loadFromFileTree(dir, { mutable: { immutable: ['other'] } })).toSucceedAndSatisfy(
            (result) => {
              expect(result.protectedCollections).toHaveLength(1);
              expect(result.protectedCollections[0].ref.isMutable).toBe(true);
            }
          );
        });
      });
    });

    // ============================================================================
    // Parse Fallback Tests
    // ============================================================================

    describe('parse fallback behavior', () => {
      test('parses JSON-like content that is valid YAML flow mapping but invalid JSON', () => {
        // Content starts with '{' (JSON-like) but uses YAML flow syntax without quotes
        // This tests the fallback from JSON.parse to yaml.load (lines 203-206)
        // YAML allows unquoted keys in flow mappings
        const yamlFlowMapping = '{items: {item-1: {name: First Item, value: 42}}}';

        const files: FileTree.IInMemoryFile[] = [
          { path: '/collections/test.yaml', contents: yamlFlowMapping }
        ];

        const tree = FileTree.inMemory(files).orThrow();
        const dir = tree.getItem('/collections').orThrow();
        const result = loader.loadFromFileTree(dir);

        expect(result).toSucceedAndSatisfy((loadResult) => {
          expect(loadResult.collections.length).toBe(1);
          expect(loadResult.collections[0].id).toBe('test');
          expect(Object.keys(loadResult.collections[0].items).length).toBe(1);
          expect(loadResult.collections[0].items['item-1' as TestItemId].name).toBe('First Item');
        });
      });

      test('parses array-starting content that is valid YAML but invalid JSON', () => {
        // Content starts with '[' but uses YAML flow syntax
        // This tests the '[' prefix check in line 202
        const yamlArrayLike = `[{items: {item-1: {name: Test, value: 1}}}]`;

        const files: FileTree.IInMemoryFile[] = [{ path: '/collections/test.yaml', contents: yamlArrayLike }];

        const tree = FileTree.inMemory(files).orThrow();
        const dir = tree.getItem('/collections').orThrow();
        const result = loader.loadFromFileTree(dir);

        // Will fail because arrays aren't valid collections, but parsing should work
        // The fallback path from JSON to YAML will be triggered
        expect(result).toFail();
      });

      test('parses YAML content (non-JSON-like) successfully', () => {
        // Standard YAML file that doesn't start with { or [
        // This tests the YAML-first path (lines 209-213)
        const yamlContent = `items:
  item-1:
    name: "First Item"
    value: 100
`;

        const files: FileTree.IInMemoryFile[] = [{ path: '/collections/test.yaml', contents: yamlContent }];

        const tree = FileTree.inMemory(files).orThrow();
        const dir = tree.getItem('/collections').orThrow();
        const result = loader.loadFromFileTree(dir);

        expect(result).toSucceedAndSatisfy((loadResult) => {
          expect(loadResult.collections.length).toBe(1);
          expect(loadResult.collections[0].id).toBe('test');
        });
      });

      test('fails with meaningful error when both JSON and YAML parsing fail (JSON-like content)', () => {
        // Content starts with '{' but has unclosed brackets - invalid for both
        // Note: YAML is more permissive than JSON, so we need truly broken content
        const brokenContent = '{ "unclosed';

        const files: FileTree.IInMemoryFile[] = [{ path: '/collections/test.json', contents: brokenContent }];

        const tree = FileTree.inMemory(files).orThrow();
        const dir = tree.getItem('/collections').orThrow();
        const result = loader.loadFromFileTree(dir);

        expect(result).toFailWith(/parse|unexpected/i);
      });

      test('fails with meaningful error when both YAML and JSON parsing fail (non-JSON-like content)', () => {
        // Content doesn't start with '{' or '[' and is invalid YAML
        // Use a tab character at the start which is invalid YAML indentation
        const invalidYaml = '\t\titems: broken';

        const files: FileTree.IInMemoryFile[] = [{ path: '/collections/test.yaml', contents: invalidYaml }];

        const tree = FileTree.inMemory(files).orThrow();
        const dir = tree.getItem('/collections').orThrow();
        const result = loader.loadFromFileTree(dir);

        // Should fail with parse error
        expect(result).toFail();
      });
    });
  });

  // ============================================================================
  // loadFromFileTreeAsync Tests (Encrypted Collections)
  // ============================================================================

  describe('loadFromFileTreeAsync', () => {
    let loader: CollectionLoader<ITestItem, TestCollectionId, TestItemId>;
    let testKey: Uint8Array;

    beforeEach(async () => {
      loader = new CollectionLoader({
        itemConverter: testItemConverter,
        collectionIdConverter: testCollectionIdConverter,
        itemIdConverter: testItemIdConverter
      });
      testKey = (await CryptoUtils.nodeCryptoProvider.generateKey()).orThrow();
    });

    test('loads plain (non-encrypted) collections', async () => {
      const collectionData = {
        items: {
          /* eslint-disable @typescript-eslint/naming-convention */
          'item-1': { name: 'Item One', value: 1 },
          'item-2': { name: 'Item Two', value: 2 }
          /* eslint-enable @typescript-eslint/naming-convention */
        }
      };

      const files: FileTree.IInMemoryFile[] = [
        { path: '/collections/test-collection.json', contents: collectionData }
      ];

      const tree = FileTree.inMemory(files).orThrow();
      const dir = tree.getItem('/collections').orThrow();
      const result = await loader.loadFromFileTreeAsync(dir);

      expect(result).toSucceedAndSatisfy((r) => {
        expect(r.collections).toHaveLength(1);
        expect(r.collections[0].id).toBe('test-collection');
        expect(Object.keys(r.collections[0].items)).toHaveLength(2);
      });
    });

    test('sets sourceName to "unknown" when not provided (async)', async () => {
      const collectionData = {
        items: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          'item-1': { name: 'Item', value: 1 }
        }
      };

      const files: FileTree.IInMemoryFile[] = [{ path: '/collections/test.json', contents: collectionData }];

      const tree = FileTree.inMemory(files).orThrow();
      const dir = tree.getItem('/collections').orThrow();
      const result = await loader.loadFromFileTreeAsync(dir);

      expect(result).toSucceedAndSatisfy((r) => {
        expect(r.collections[0].metadata?.sourceName).toBe('unknown');
      });
    });

    test('uses provided sourceName in metadata (async)', async () => {
      const collectionData = {
        items: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          'item-1': { name: 'Item', value: 1 }
        }
      };

      const files: FileTree.IInMemoryFile[] = [{ path: '/collections/test.json', contents: collectionData }];

      const tree = FileTree.inMemory(files).orThrow();
      const dir = tree.getItem('/collections').orThrow();
      const result = await loader.loadFromFileTreeAsync(dir, { sourceName: 'async-source' });

      expect(result).toSucceedAndSatisfy((r) => {
        expect(r.collections[0].metadata?.sourceName).toBe('async-source');
      });
    });

    test('loads encrypted collection with matching secret', async () => {
      const collectionData = {
        /* eslint-disable @typescript-eslint/naming-convention */
        'item-1': { name: 'Secret Item', value: 42 },
        'item-2': { name: 'Another Secret', value: 100 }
        /* eslint-enable @typescript-eslint/naming-convention */
      };

      const encrypted = (
        await CryptoUtils.createEncryptedFile({
          content: collectionData,
          secretName: 'my-secret',
          key: testKey,
          cryptoProvider: CryptoUtils.nodeCryptoProvider
        })
      ).orThrow();

      const files: FileTree.IInMemoryFile[] = [
        { path: '/collections/encrypted.json', contents: encrypted as unknown as JsonObject }
      ];

      const tree = FileTree.inMemory(files).orThrow();
      const dir = tree.getItem('/collections').orThrow();
      const result = await loader.loadFromFileTreeAsync(dir, {
        encryption: {
          secrets: [{ name: 'my-secret', key: testKey }],
          cryptoProvider: CryptoUtils.nodeCryptoProvider
        }
      });

      expect(result).toSucceedAndSatisfy((r) => {
        expect(r.collections).toHaveLength(1);
        expect(r.collections[0].id).toBe('encrypted');
        expect(r.collections[0].items['item-1' as TestItemId]).toEqual({ name: 'Secret Item', value: 42 });
        expect(r.collections[0].items['item-2' as TestItemId]).toEqual({
          name: 'Another Secret',
          value: 100
        });
      });
    });

    test('loads mixed encrypted and plain collections', async () => {
      const plainData = {
        items: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          'plain-item': { name: 'Plain', value: 1 }
        }
      };

      const encryptedData = {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        'secret-item': { name: 'Secret', value: 2 }
      };

      const encrypted = (
        await CryptoUtils.createEncryptedFile({
          content: encryptedData,
          secretName: 'test-secret',
          key: testKey,
          cryptoProvider: CryptoUtils.nodeCryptoProvider
        })
      ).orThrow();

      const files: FileTree.IInMemoryFile[] = [
        { path: '/collections/plain.json', contents: plainData },
        { path: '/collections/encrypted.json', contents: encrypted as unknown as JsonObject }
      ];

      const tree = FileTree.inMemory(files).orThrow();
      const dir = tree.getItem('/collections').orThrow();
      const result = await loader.loadFromFileTreeAsync(dir, {
        encryption: {
          secrets: [{ name: 'test-secret', key: testKey }],
          cryptoProvider: CryptoUtils.nodeCryptoProvider
        }
      });

      expect(result).toSucceedAndSatisfy((r) => {
        expect(r.collections).toHaveLength(2);
        const plain = r.collections.find((c) => c.id === 'plain');
        const enc = r.collections.find((c) => c.id === 'encrypted');
        expect(plain?.items['plain-item' as TestItemId]).toEqual({ name: 'Plain', value: 1 });
        expect(enc?.items['secret-item' as TestItemId]).toEqual({ name: 'Secret', value: 2 });
      });
    });

    test('fails when encrypted file found but no encryption config provided', async () => {
      const collectionData = {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        'item-1': { name: 'Secret', value: 42 }
      };

      const encrypted = (
        await CryptoUtils.createEncryptedFile({
          content: collectionData,
          secretName: 'my-secret',
          key: testKey,
          cryptoProvider: CryptoUtils.nodeCryptoProvider
        })
      ).orThrow();

      const files: FileTree.IInMemoryFile[] = [
        { path: '/collections/encrypted.json', contents: encrypted as unknown as JsonObject }
      ];

      const tree = FileTree.inMemory(files).orThrow();
      const dir = tree.getItem('/collections').orThrow();
      // With default 'capture' mode, missing encryption config captures the file
      const result = await loader.loadFromFileTreeAsync(dir);

      expect(result).toSucceedAndSatisfy((r) => {
        expect(r.collections).toHaveLength(0);
        expect(r.protectedCollections).toHaveLength(1);
        expect(r.protectedCollections[0].ref.secretName).toBe('my-secret');
      });
    });

    test('fails when encrypted file found with onEncryptedFile: fail and no encryption config', async () => {
      const collectionData = {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        'item-1': { name: 'Secret', value: 42 }
      };

      const encrypted = (
        await CryptoUtils.createEncryptedFile({
          content: collectionData,
          secretName: 'my-secret',
          key: testKey,
          cryptoProvider: CryptoUtils.nodeCryptoProvider
        })
      ).orThrow();

      const files: FileTree.IInMemoryFile[] = [
        { path: '/collections/encrypted.json', contents: encrypted as unknown as JsonObject }
      ];

      const tree = FileTree.inMemory(files).orThrow();
      const dir = tree.getItem('/collections').orThrow();
      const result = await loader.loadFromFileTreeAsync(dir, { onEncryptedFile: 'fail' });

      expect(result).toFailWith(/no encryption config provided/i);
    });

    // ============================================================================
    // Async Parse Fallback Behavior Tests
    // ============================================================================

    describe('async parse fallback behavior', () => {
      test('parses JSON-like content that is valid YAML flow mapping but invalid JSON', async () => {
        // Content starts with '{' (JSON-like) but uses YAML flow syntax without quotes
        // This tests the fallback from JSON.parse to yaml.load (lines 321-324)
        const yamlFlowMapping = '{items: {item-1: {name: First Item, value: 42}}}';

        const files: FileTree.IInMemoryFile[] = [
          { path: '/collections/test.yaml', contents: yamlFlowMapping }
        ];

        const tree = FileTree.inMemory(files).orThrow();
        const dir = tree.getItem('/collections').orThrow();
        const result = await loader.loadFromFileTreeAsync(dir);

        expect(result).toSucceedAndSatisfy((loadResult) => {
          expect(loadResult.collections.length).toBe(1);
          expect(loadResult.collections[0].id).toBe('test');
          expect(Object.keys(loadResult.collections[0].items).length).toBe(1);
          expect(loadResult.collections[0].items['item-1' as TestItemId].name).toBe('First Item');
        });
      });

      test('parses array-starting content that is valid YAML but invalid JSON', async () => {
        // Content starts with '[' but uses YAML flow syntax
        // This tests the '[' prefix check in line 320
        const yamlArrayLike = `[{items: {item-1: {name: Test, value: 1}}}]`;

        const files: FileTree.IInMemoryFile[] = [{ path: '/collections/test.yaml', contents: yamlArrayLike }];

        const tree = FileTree.inMemory(files).orThrow();
        const dir = tree.getItem('/collections').orThrow();
        const result = await loader.loadFromFileTreeAsync(dir);

        // Will fail because arrays aren't valid collections, but parsing should work
        // The fallback path from JSON to YAML will be triggered
        expect(result).toFail();
      });

      test('parses YAML content (non-JSON-like) successfully', async () => {
        // Standard YAML file that doesn't start with { or [
        // This tests the YAML-first path (lines 327-331)
        const yamlContent = `items:
  item-1:
    name: "First Item"
    value: 100
`;

        const files: FileTree.IInMemoryFile[] = [{ path: '/collections/test.yaml', contents: yamlContent }];

        const tree = FileTree.inMemory(files).orThrow();
        const dir = tree.getItem('/collections').orThrow();
        const result = await loader.loadFromFileTreeAsync(dir);

        expect(result).toSucceedAndSatisfy((loadResult) => {
          expect(loadResult.collections.length).toBe(1);
          expect(loadResult.collections[0].id).toBe('test');
        });
      });

      test('fails with meaningful error when both JSON and YAML parsing fail (JSON-like content)', async () => {
        // Content starts with '{' but has unclosed brackets - invalid for both
        // Tests line 336-337 - parse failure propagation
        const brokenContent = '{ "unclosed';

        const files: FileTree.IInMemoryFile[] = [{ path: '/collections/test.json', contents: brokenContent }];

        const tree = FileTree.inMemory(files).orThrow();
        const dir = tree.getItem('/collections').orThrow();
        const result = await loader.loadFromFileTreeAsync(dir);

        expect(result).toFailWith(/parse|unexpected/i);
      });

      test('fails with meaningful error when both YAML and JSON parsing fail (non-JSON-like content)', async () => {
        // Content doesn't start with '{' or '[' and is invalid YAML
        // Use a tab character at the start which is invalid YAML indentation
        const invalidYaml = '\t\titems: broken';

        const files: FileTree.IInMemoryFile[] = [{ path: '/collections/test.yaml', contents: invalidYaml }];

        const tree = FileTree.inMemory(files).orThrow();
        const dir = tree.getItem('/collections').orThrow();
        const result = await loader.loadFromFileTreeAsync(dir);

        // Should fail with parse error
        expect(result).toFail();
      });
    });

    // ============================================================================
    // onMissingKey Error Mode Tests
    // ============================================================================

    describe('onMissingKey error modes', () => {
      test('captures by default when secret is not found', async () => {
        const collectionData = {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          'item-1': { name: 'Secret', value: 42 }
        };

        const encrypted = (
          await CryptoUtils.createEncryptedFile({
            content: collectionData,
            secretName: 'unknown-secret',
            key: testKey,
            cryptoProvider: CryptoUtils.nodeCryptoProvider
          })
        ).orThrow();

        const files: FileTree.IInMemoryFile[] = [
          { path: '/collections/encrypted.json', contents: encrypted as unknown as JsonObject }
        ];

        const tree = FileTree.inMemory(files).orThrow();
        const dir = tree.getItem('/collections').orThrow();
        const result = await loader.loadFromFileTreeAsync(dir, {
          encryption: {
            secrets: [{ name: 'different-secret', key: testKey }],
            cryptoProvider: CryptoUtils.nodeCryptoProvider
          }
        });

        // Default mode is 'capture', so missing key should capture
        expect(result).toSucceedAndSatisfy((r) => {
          expect(r.collections).toHaveLength(0);
          expect(r.protectedCollections).toHaveLength(1);
          expect(r.protectedCollections[0].ref.secretName).toBe('unknown-secret');
        });
      });

      test('fails when secret is not found with onEncryptedFile: fail', async () => {
        const collectionData = {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          'item-1': { name: 'Secret', value: 42 }
        };

        const encrypted = (
          await CryptoUtils.createEncryptedFile({
            content: collectionData,
            secretName: 'unknown-secret',
            key: testKey,
            cryptoProvider: CryptoUtils.nodeCryptoProvider
          })
        ).orThrow();

        const files: FileTree.IInMemoryFile[] = [
          { path: '/collections/encrypted.json', contents: encrypted as unknown as JsonObject }
        ];

        const tree = FileTree.inMemory(files).orThrow();
        const dir = tree.getItem('/collections').orThrow();
        const result = await loader.loadFromFileTreeAsync(dir, {
          onEncryptedFile: 'fail',
          encryption: {
            secrets: [{ name: 'different-secret', key: testKey }],
            cryptoProvider: CryptoUtils.nodeCryptoProvider
          }
        });

        expect(result).toFailWith(/missing key.*unknown-secret/i);
      });

      test('skips encrypted file when onMissingKey is "skip"', async () => {
        const plainData = {
          items: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            'plain-item': { name: 'Plain', value: 1 }
          }
        };

        const encryptedData = {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          'secret-item': { name: 'Secret', value: 2 }
        };

        const encrypted = (
          await CryptoUtils.createEncryptedFile({
            content: encryptedData,
            secretName: 'unknown-secret',
            key: testKey,
            cryptoProvider: CryptoUtils.nodeCryptoProvider
          })
        ).orThrow();

        const files: FileTree.IInMemoryFile[] = [
          { path: '/collections/plain.json', contents: plainData },
          { path: '/collections/encrypted.json', contents: encrypted as unknown as JsonObject }
        ];

        const tree = FileTree.inMemory(files).orThrow();
        const dir = tree.getItem('/collections').orThrow();
        const result = await loader.loadFromFileTreeAsync(dir, {
          onEncryptedFile: 'skip',
          encryption: {
            secrets: [], // No secrets provided
            cryptoProvider: CryptoUtils.nodeCryptoProvider,
            onMissingKey: 'skip'
          }
        });

        expect(result).toSucceedAndSatisfy((r) => {
          // Only plain collection should be loaded, encrypted should be skipped
          expect(r.collections).toHaveLength(1);
          expect(r.collections[0].id).toBe('plain');
        });
      });

      test('warns and skips when onMissingKey is "warn"', async () => {
        const plainData = {
          items: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            'plain-item': { name: 'Plain', value: 1 }
          }
        };

        const encryptedData = {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          'secret-item': { name: 'Secret', value: 2 }
        };

        const encrypted = (
          await CryptoUtils.createEncryptedFile({
            content: encryptedData,
            secretName: 'unknown-secret',
            key: testKey,
            cryptoProvider: CryptoUtils.nodeCryptoProvider
          })
        ).orThrow();

        const files: FileTree.IInMemoryFile[] = [
          { path: '/collections/plain.json', contents: plainData },
          { path: '/collections/encrypted.json', contents: encrypted as unknown as JsonObject }
        ];

        const tree = FileTree.inMemory(files).orThrow();
        const dir = tree.getItem('/collections').orThrow();

        // Create a mock logger to capture warnings
        const { reporter, messages } = createMockLogger();
        const loaderWithLogger = new CollectionLoader({
          itemConverter: testItemConverter,
          collectionIdConverter: testCollectionIdConverter,
          itemIdConverter: testItemIdConverter,
          logger: reporter
        });

        const result = await loaderWithLogger.loadFromFileTreeAsync(dir, {
          onEncryptedFile: 'warn',
          encryption: {
            secrets: [],
            cryptoProvider: CryptoUtils.nodeCryptoProvider,
            onMissingKey: 'warn'
          }
        });

        expect(result).toSucceedAndSatisfy((r) => {
          expect(r.collections).toHaveLength(1);
          expect(r.collections[0].id).toBe('plain');
        });

        const warnMessages = messages.filter((m) => m.level === 'warn');
        expect(warnMessages.length).toBeGreaterThan(0);
        expect(warnMessages.some((m) => /missing key.*unknown-secret/i.test(m.message))).toBe(true);
      });
    });

    // ============================================================================
    // onDecryptionError Error Mode Tests
    // ============================================================================

    describe('onDecryptionError error modes', () => {
      test('fails by default when decryption fails (wrong key)', async () => {
        const collectionData = {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          'item-1': { name: 'Secret', value: 42 }
        };

        const encrypted = (
          await CryptoUtils.createEncryptedFile({
            content: collectionData,
            secretName: 'my-secret',
            key: testKey,
            cryptoProvider: CryptoUtils.nodeCryptoProvider
          })
        ).orThrow();

        const wrongKey = (await CryptoUtils.nodeCryptoProvider.generateKey()).orThrow();

        const files: FileTree.IInMemoryFile[] = [
          { path: '/collections/encrypted.json', contents: encrypted as unknown as JsonObject }
        ];

        const tree = FileTree.inMemory(files).orThrow();
        const dir = tree.getItem('/collections').orThrow();
        const result = await loader.loadFromFileTreeAsync(dir, {
          encryption: {
            secrets: [{ name: 'my-secret', key: wrongKey }],
            cryptoProvider: CryptoUtils.nodeCryptoProvider
          }
        });

        expect(result).toFailWith(/decryption failed/i);
      });

      test('skips file when onDecryptionError is "skip"', async () => {
        const plainData = {
          items: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            'plain-item': { name: 'Plain', value: 1 }
          }
        };

        const encryptedData = {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          'secret-item': { name: 'Secret', value: 2 }
        };

        const encrypted = (
          await CryptoUtils.createEncryptedFile({
            content: encryptedData,
            secretName: 'my-secret',
            key: testKey,
            cryptoProvider: CryptoUtils.nodeCryptoProvider
          })
        ).orThrow();

        const wrongKey = (await CryptoUtils.nodeCryptoProvider.generateKey()).orThrow();

        const files: FileTree.IInMemoryFile[] = [
          { path: '/collections/plain.json', contents: plainData },
          { path: '/collections/encrypted.json', contents: encrypted as unknown as JsonObject }
        ];

        const tree = FileTree.inMemory(files).orThrow();
        const dir = tree.getItem('/collections').orThrow();
        const result = await loader.loadFromFileTreeAsync(dir, {
          encryption: {
            secrets: [{ name: 'my-secret', key: wrongKey }],
            cryptoProvider: CryptoUtils.nodeCryptoProvider,
            onDecryptionError: 'skip'
          }
        });

        expect(result).toSucceedAndSatisfy((r) => {
          expect(r.collections).toHaveLength(1);
          expect(r.collections[0].id).toBe('plain');
        });
      });

      test('warns and skips when onDecryptionError is "warn"', async () => {
        const plainData = {
          items: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            'plain-item': { name: 'Plain', value: 1 }
          }
        };

        const encryptedData = {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          'secret-item': { name: 'Secret', value: 2 }
        };

        const encrypted = (
          await CryptoUtils.createEncryptedFile({
            content: encryptedData,
            secretName: 'my-secret',
            key: testKey,
            cryptoProvider: CryptoUtils.nodeCryptoProvider
          })
        ).orThrow();

        const wrongKey = (await CryptoUtils.nodeCryptoProvider.generateKey()).orThrow();

        const files: FileTree.IInMemoryFile[] = [
          { path: '/collections/plain.json', contents: plainData },
          { path: '/collections/encrypted.json', contents: encrypted as unknown as JsonObject }
        ];

        const tree = FileTree.inMemory(files).orThrow();
        const dir = tree.getItem('/collections').orThrow();

        // Create a mock logger to capture warnings
        const { reporter, messages } = createMockLogger();
        const loaderWithLogger = new CollectionLoader({
          itemConverter: testItemConverter,
          collectionIdConverter: testCollectionIdConverter,
          itemIdConverter: testItemIdConverter,
          logger: reporter
        });

        const result = await loaderWithLogger.loadFromFileTreeAsync(dir, {
          encryption: {
            secrets: [{ name: 'my-secret', key: wrongKey }],
            cryptoProvider: CryptoUtils.nodeCryptoProvider,
            onDecryptionError: 'warn'
          }
        });

        expect(result).toSucceedAndSatisfy((r) => {
          expect(r.collections).toHaveLength(1);
          expect(r.collections[0].id).toBe('plain');
        });

        const warnMessages = messages.filter((m) => m.level === 'warn');
        expect(warnMessages.length).toBeGreaterThan(0);
        expect(warnMessages.some((m) => /decryption failed/i.test(m.message))).toBe(true);
      });

      test('handles invalid encrypted file format with onDecryptionError', async () => {
        // Create a malformed encrypted file (has format field but missing other required fields)
        const malformed = {
          format: CryptoUtils.Constants.ENCRYPTED_FILE_FORMAT,
          secretName: 'test-secret'
          // Missing: algorithm, iv, authTag, encryptedData
        };

        const files: FileTree.IInMemoryFile[] = [
          { path: '/collections/malformed.json', contents: malformed }
        ];

        const tree = FileTree.inMemory(files).orThrow();
        const dir = tree.getItem('/collections').orThrow();
        const result = await loader.loadFromFileTreeAsync(dir, {
          encryption: {
            secrets: [{ name: 'test-secret', key: testKey }],
            cryptoProvider: CryptoUtils.nodeCryptoProvider,
            onDecryptionError: 'skip'
          }
        });

        expect(result).toSucceedAndSatisfy((r) => {
          // Malformed file should be skipped
          expect(r.collections).toHaveLength(0);
        });
      });
    });

    // ============================================================================
    // secretProvider Tests
    // ============================================================================

    describe('secretProvider', () => {
      test('uses secretProvider when secret not in secrets array', async () => {
        const collectionData = {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          'item-1': { name: 'Secret', value: 42 }
        };

        const encrypted = (
          await CryptoUtils.createEncryptedFile({
            content: collectionData,
            secretName: 'dynamic-secret',
            key: testKey,
            cryptoProvider: CryptoUtils.nodeCryptoProvider
          })
        ).orThrow();

        const files: FileTree.IInMemoryFile[] = [
          { path: '/collections/encrypted.json', contents: encrypted as unknown as JsonObject }
        ];

        const tree = FileTree.inMemory(files).orThrow();
        const dir = tree.getItem('/collections').orThrow();

        const secretProvider = jest.fn().mockResolvedValue(succeed(testKey));

        const result = await loader.loadFromFileTreeAsync(dir, {
          encryption: {
            secretProvider,
            cryptoProvider: CryptoUtils.nodeCryptoProvider
          }
        });

        expect(result).toSucceedAndSatisfy((r) => {
          expect(r.collections).toHaveLength(1);
          expect(r.collections[0].items['item-1' as TestItemId]).toEqual({ name: 'Secret', value: 42 });
        });

        expect(secretProvider).toHaveBeenCalledWith('dynamic-secret');
      });

      test('prefers secrets array over secretProvider', async () => {
        const collectionData = {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          'item-1': { name: 'Secret', value: 42 }
        };

        const encrypted = (
          await CryptoUtils.createEncryptedFile({
            content: collectionData,
            secretName: 'known-secret',
            key: testKey,
            cryptoProvider: CryptoUtils.nodeCryptoProvider
          })
        ).orThrow();

        const files: FileTree.IInMemoryFile[] = [
          { path: '/collections/encrypted.json', contents: encrypted as unknown as JsonObject }
        ];

        const tree = FileTree.inMemory(files).orThrow();
        const dir = tree.getItem('/collections').orThrow();

        const secretProvider = jest.fn().mockResolvedValue(fail('Should not be called'));

        const result = await loader.loadFromFileTreeAsync(dir, {
          encryption: {
            secrets: [{ name: 'known-secret', key: testKey }],
            secretProvider,
            cryptoProvider: CryptoUtils.nodeCryptoProvider
          }
        });

        expect(result).toSucceed();
        expect(secretProvider).not.toHaveBeenCalled();
      });

      test('handles secretProvider failure with fail mode', async () => {
        const collectionData = {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          'item-1': { name: 'Secret', value: 42 }
        };

        const encrypted = (
          await CryptoUtils.createEncryptedFile({
            content: collectionData,
            secretName: 'unknown-secret',
            key: testKey,
            cryptoProvider: CryptoUtils.nodeCryptoProvider
          })
        ).orThrow();

        const files: FileTree.IInMemoryFile[] = [
          { path: '/collections/encrypted.json', contents: encrypted as unknown as JsonObject }
        ];

        const tree = FileTree.inMemory(files).orThrow();
        const dir = tree.getItem('/collections').orThrow();

        const secretProvider = jest.fn().mockResolvedValue(fail('Secret not found in vault'));

        const result = await loader.loadFromFileTreeAsync(dir, {
          onEncryptedFile: 'fail',
          encryption: {
            secretProvider,
            cryptoProvider: CryptoUtils.nodeCryptoProvider
          }
        });

        expect(result).toFailWith(/missing key.*unknown-secret/i);
      });

      test('captures when secretProvider fails with default capture mode', async () => {
        const collectionData = {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          'item-1': { name: 'Secret', value: 42 }
        };

        const encrypted = (
          await CryptoUtils.createEncryptedFile({
            content: collectionData,
            secretName: 'unknown-secret',
            key: testKey,
            cryptoProvider: CryptoUtils.nodeCryptoProvider
          })
        ).orThrow();

        const files: FileTree.IInMemoryFile[] = [
          { path: '/collections/encrypted.json', contents: encrypted as unknown as JsonObject }
        ];

        const tree = FileTree.inMemory(files).orThrow();
        const dir = tree.getItem('/collections').orThrow();

        const secretProvider = jest.fn().mockResolvedValue(fail('Secret not found in vault'));

        const result = await loader.loadFromFileTreeAsync(dir, {
          encryption: {
            secretProvider,
            cryptoProvider: CryptoUtils.nodeCryptoProvider
          }
        });

        expect(result).toSucceedAndSatisfy((r) => {
          expect(r.collections).toHaveLength(0);
          expect(r.protectedCollections).toHaveLength(1);
          expect(r.protectedCollections[0].ref.secretName).toBe('unknown-secret');
        });
      });
    });

    // ============================================================================
    // Mutability Tests with Encrypted Collections
    // ============================================================================

    describe('mutability with encrypted collections', () => {
      test('respects mutable option for encrypted collections (boolean true)', async () => {
        const collectionData = {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          'item-1': { name: 'Secret', value: 42 }
        };

        const encrypted = (
          await CryptoUtils.createEncryptedFile({
            content: collectionData,
            secretName: 'my-secret',
            key: testKey,
            cryptoProvider: CryptoUtils.nodeCryptoProvider
          })
        ).orThrow();

        const files: FileTree.IInMemoryFile[] = [
          { path: '/collections/encrypted.json', contents: encrypted as unknown as JsonObject }
        ];

        const tree = FileTree.inMemory(files).orThrow();
        const dir = tree.getItem('/collections').orThrow();
        const result = await loader.loadFromFileTreeAsync(dir, {
          mutable: true,
          encryption: {
            secrets: [{ name: 'my-secret', key: testKey }],
            cryptoProvider: CryptoUtils.nodeCryptoProvider
          }
        });

        expect(result).toSucceedAndSatisfy((r) => {
          expect(r.collections).toHaveLength(1);
          expect(r.collections[0].isMutable).toBe(true);
        });
      });

      test('respects mutable option for encrypted collections (array form)', async () => {
        const collectionData = {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          'item-1': { name: 'Secret', value: 42 }
        };

        const encrypted = (
          await CryptoUtils.createEncryptedFile({
            content: collectionData,
            secretName: 'my-secret',
            key: testKey,
            cryptoProvider: CryptoUtils.nodeCryptoProvider
          })
        ).orThrow();

        const files: FileTree.IInMemoryFile[] = [
          { path: '/collections/encrypted.json', contents: encrypted as unknown as JsonObject }
        ];

        const tree = FileTree.inMemory(files).orThrow();
        const dir = tree.getItem('/collections').orThrow();

        // Test when collection is in mutable list
        const resultMutable = await loader.loadFromFileTreeAsync(dir, {
          mutable: ['encrypted'],
          encryption: {
            secrets: [{ name: 'my-secret', key: testKey }],
            cryptoProvider: CryptoUtils.nodeCryptoProvider
          }
        });

        expect(resultMutable).toSucceedAndSatisfy((r) => {
          expect(r.collections).toHaveLength(1);
          expect(r.collections[0].isMutable).toBe(true);
        });

        // Test when collection is NOT in mutable list
        const resultImmutable = await loader.loadFromFileTreeAsync(dir, {
          mutable: ['other-collection'],
          encryption: {
            secrets: [{ name: 'my-secret', key: testKey }],
            cryptoProvider: CryptoUtils.nodeCryptoProvider
          }
        });

        expect(resultImmutable).toSucceedAndSatisfy((r) => {
          expect(r.collections).toHaveLength(1);
          expect(r.collections[0].isMutable).toBe(false);
        });
      });

      test('respects mutable option for encrypted collections (immutable object form)', async () => {
        const collectionData = {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          'item-1': { name: 'Secret', value: 42 }
        };

        const encrypted = (
          await CryptoUtils.createEncryptedFile({
            content: collectionData,
            secretName: 'my-secret',
            key: testKey,
            cryptoProvider: CryptoUtils.nodeCryptoProvider
          })
        ).orThrow();

        const files: FileTree.IInMemoryFile[] = [
          { path: '/collections/encrypted.json', contents: encrypted as unknown as JsonObject }
        ];

        const tree = FileTree.inMemory(files).orThrow();
        const dir = tree.getItem('/collections').orThrow();

        // Test when collection is in immutable list (should be immutable)
        const resultImmutable = await loader.loadFromFileTreeAsync(dir, {
          mutable: { immutable: ['encrypted'] },
          encryption: {
            secrets: [{ name: 'my-secret', key: testKey }],
            cryptoProvider: CryptoUtils.nodeCryptoProvider
          }
        });

        expect(resultImmutable).toSucceedAndSatisfy((r) => {
          expect(r.collections).toHaveLength(1);
          expect(r.collections[0].isMutable).toBe(false);
        });

        // Test when collection is NOT in immutable list (should be mutable)
        const resultMutable = await loader.loadFromFileTreeAsync(dir, {
          mutable: { immutable: ['other-collection'] },
          encryption: {
            secrets: [{ name: 'my-secret', key: testKey }],
            cryptoProvider: CryptoUtils.nodeCryptoProvider
          }
        });

        expect(resultMutable).toSucceedAndSatisfy((r) => {
          expect(r.collections).toHaveLength(1);
          expect(r.collections[0].isMutable).toBe(true);
        });
      });
    });

    // ============================================================================
    // Error Handling Tests
    // ============================================================================

    describe('error handling', () => {
      test('fails when filterDirectory fails', async () => {
        const files: FileTree.IInMemoryFile[] = [{ path: '/file.json', contents: {} }];

        const tree = FileTree.inMemory(files).orThrow();
        const file = tree.getItem('/file.json').orThrow();
        const result = await loader.loadFromFileTreeAsync(file);

        expect(result).toFailWith(/not a directory/i);
      });

      test('fails when getContents fails', async () => {
        // Create a mock file tree item that fails on getContents
        const mockFileItem: FileTree.IFileTreeFileItem = {
          name: 'failing.json',
          type: 'file',
          absolutePath: '/collections/failing.json',
          baseName: 'failing',
          extension: '.json',
          contentType: undefined,
          getIsMutable: () => succeedWithDetail(false, 'not-supported'),
          setContents: () => fail('File write error'),
          setRawContents: () => fail('File write error'),
          getContents: () => fail<JsonValue>('File read error'),
          getRawContents: () => fail<string>('File read error')
        };
        const mockDir: FileTree.IFileTreeDirectoryItem = {
          name: 'collections',
          type: 'directory',
          absolutePath: '/collections',
          getChildren: () => succeed([mockFileItem])
        };

        const result = await loader.loadFromFileTreeAsync(mockDir);
        expect(result).toFailWith(/file read error/i);
      });

      test('fails when item conversion fails', async () => {
        const invalidCollection = {
          items: {
            /* eslint-disable @typescript-eslint/naming-convention */
            'valid-item': { name: 'Valid', value: 1 },
            'invalid-item': { name: 'Missing Value' } // missing 'value' field
            /* eslint-enable @typescript-eslint/naming-convention */
          }
        };

        const files: FileTree.IInMemoryFile[] = [
          { path: '/collections/test.json', contents: invalidCollection }
        ];

        const tree = FileTree.inMemory(files).orThrow();
        const dir = tree.getItem('/collections').orThrow();
        const result = await loader.loadFromFileTreeAsync(dir);

        expect(result).toFail();
      });
    });
  });
});
