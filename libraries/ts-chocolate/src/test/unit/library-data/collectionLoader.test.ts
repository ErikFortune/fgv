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

import { Converters, fail, Failure, succeed, Success } from '@fgv/ts-utils';
import { FileTree, JsonObject, JsonValue } from '@fgv/ts-json-base';

import { CollectionLoader } from '../../../packlets/library-data';
import {
  createEncryptedCollectionFile,
  ENCRYPTED_COLLECTION_FORMAT,
  nodeCryptoProvider
} from '../../../packlets/crypto';

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
        /* eslint-disable @typescript-eslint/naming-convention */
        'item-1': { name: 'Item One', value: 1 },
        'item-2': { name: 'Item Two', value: 2 }
        /* eslint-enable @typescript-eslint/naming-convention */
      };

      const files: FileTree.IInMemoryFile[] = [
        { path: '/collections/test-collection.json', contents: collectionData }
      ];

      expect(FileTree.inMemory(files)).toSucceedAndSatisfy((tree) => {
        expect(tree.getItem('/collections')).toSucceedAndSatisfy((dir) => {
          expect(loader.loadFromFileTree(dir)).toSucceedAndSatisfy((collections) => {
            expect(collections).toHaveLength(1);
            expect(collections[0].id).toBe('test-collection');
            expect(collections[0].isMutable).toBe(false); // default
            expect(Object.keys(collections[0].items)).toHaveLength(2);
          });
        });
      });
    });

    test('loads multiple collections from directory', () => {
      const collection1 = {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        'item-a': { name: 'Item A', value: 10 }
      };
      const collection2 = {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        'item-b': { name: 'Item B', value: 20 }
      };

      const files: FileTree.IInMemoryFile[] = [
        { path: '/collections/first.json', contents: collection1 },
        { path: '/collections/second.json', contents: collection2 }
      ];

      expect(FileTree.inMemory(files)).toSucceedAndSatisfy((tree) => {
        expect(tree.getItem('/collections')).toSucceedAndSatisfy((dir) => {
          expect(loader.loadFromFileTree(dir)).toSucceedAndSatisfy((collections) => {
            expect(collections).toHaveLength(2);
            const ids = collections.map((c) => c.id).sort();
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
        { path: '/collections/test.json', contents: { item: { name: 'Test', value: 1 } } }
      ];

      expect(FileTree.inMemory(files)).toSucceedAndSatisfy((tree) => {
        expect(tree.getItem('/collections')).toSucceedAndSatisfy((dir) => {
          expect(mutableLoader.loadFromFileTree(dir)).toSucceedAndSatisfy((collections) => {
            expect(collections).toHaveLength(1);
            expect(collections[0].isMutable).toBe(true);
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
        { path: '/collections/test.json', contents: { item: { name: 'Test', value: 1 } } }
      ];

      expect(FileTree.inMemory(files)).toSucceedAndSatisfy((tree) => {
        expect(tree.getItem('/collections')).toSucceedAndSatisfy((dir) => {
          expect(immutableLoader.loadFromFileTree(dir)).toSucceedAndSatisfy((collections) => {
            expect(collections).toHaveLength(1);
            expect(collections[0].isMutable).toBe(false);
          });
        });
      });
    });

    test('marks specific collections as mutable with array spec', () => {
      const files: FileTree.IInMemoryFile[] = [
        { path: '/collections/immutable.json', contents: { item: { name: 'Immutable', value: 1 } } },
        { path: '/collections/mutable.json', contents: { item: { name: 'Mutable', value: 2 } } }
      ];

      expect(FileTree.inMemory(files)).toSucceedAndSatisfy((tree) => {
        expect(tree.getItem('/collections')).toSucceedAndSatisfy((dir) => {
          expect(loader.loadFromFileTree(dir, { mutable: ['mutable'] })).toSucceedAndSatisfy(
            (collections) => {
              expect(collections).toHaveLength(2);
              const mutableCollection = collections.find((c) => c.id === 'mutable');
              const immutableCollection = collections.find((c) => c.id === 'immutable');
              expect(mutableCollection?.isMutable).toBe(true);
              expect(immutableCollection?.isMutable).toBe(false);
            }
          );
        });
      });
    });

    test('marks specific collections as immutable with immutable object spec', () => {
      const files: FileTree.IInMemoryFile[] = [
        { path: '/collections/immutable.json', contents: { item: { name: 'Immutable', value: 1 } } },
        { path: '/collections/mutable.json', contents: { item: { name: 'Mutable', value: 2 } } }
      ];

      expect(FileTree.inMemory(files)).toSucceedAndSatisfy((tree) => {
        expect(tree.getItem('/collections')).toSucceedAndSatisfy((dir) => {
          expect(loader.loadFromFileTree(dir, { mutable: { immutable: ['immutable'] } })).toSucceedAndSatisfy(
            (collections) => {
              expect(collections).toHaveLength(2);
              const mutableCollection = collections.find((c) => c.id === 'mutable');
              const immutableCollection = collections.find((c) => c.id === 'immutable');
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
        { path: '/collections/test.json', contents: { item: { name: 'Test', value: 1 } } }
      ];

      expect(FileTree.inMemory(files)).toSucceedAndSatisfy((tree) => {
        expect(tree.getItem('/collections')).toSucceedAndSatisfy((dir) => {
          // Override with false to make all immutable
          expect(mutableLoader.loadFromFileTree(dir, { mutable: false })).toSucceedAndSatisfy(
            (collections) => {
              expect(collections).toHaveLength(1);
              expect(collections[0].isMutable).toBe(false);
            }
          );
        });
      });
    });

    test('loads with recurseWithDelimiter option', () => {
      const files: FileTree.IInMemoryFile[] = [
        { path: '/collections/root.json', contents: { item: { name: 'Root', value: 1 } } },
        { path: '/collections/subdir/nested.json', contents: { item: { name: 'Nested', value: 2 } } }
      ];

      expect(FileTree.inMemory(files)).toSucceedAndSatisfy((tree) => {
        expect(tree.getItem('/collections')).toSucceedAndSatisfy((dir) => {
          expect(loader.loadFromFileTree(dir, { recurseWithDelimiter: '/' })).toSucceedAndSatisfy(
            (collections) => {
              expect(collections).toHaveLength(2);
              const ids = collections.map((c) => c.id).sort();
              expect(ids).toEqual(['root', 'subdir/nested']);
            }
          );
        });
      });
    });

    test('handles empty directory', () => {
      const files: FileTree.IInMemoryFile[] = [{ path: '/collections/subdir/file.json', contents: {} }];

      expect(FileTree.inMemory(files)).toSucceedAndSatisfy((tree) => {
        expect(tree.getItem('/collections')).toSucceedAndSatisfy((dir) => {
          expect(loader.loadFromFileTree(dir)).toSucceedAndSatisfy((collections) => {
            expect(collections).toHaveLength(0);
          });
        });
      });
    });

    test('fails when file contains invalid item structure', () => {
      const invalidCollection = {
        /* eslint-disable @typescript-eslint/naming-convention */
        'valid-item': { name: 'Valid', value: 1 },
        'invalid-item': { name: 'Missing Value' } // missing 'value' field
        /* eslint-enable @typescript-eslint/naming-convention */
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
        { path: '/collections/valid.json', contents: { item: { name: 'Valid', value: 1 } } },
        { path: '/collections/INVALID.json', contents: { item: { name: 'Invalid', value: 2 } } },
        { path: '/collections/also-invalid.json', contents: { item: { name: 'Also Invalid', value: 3 } } }
      ];

      expect(FileTree.inMemory(files)).toSucceedAndSatisfy((tree) => {
        expect(tree.getItem('/collections')).toSucceedAndSatisfy((dir) => {
          expect(strictLoader.loadFromFileTree(dir)).toSucceedAndSatisfy((collections) => {
            expect(collections).toHaveLength(1);
            expect(collections[0].id).toBe('valid');
          });
        });
      });
    });

    test('loads collections with complex nested data', () => {
      const complexCollection = {
        /* eslint-disable @typescript-eslint/naming-convention */
        'item-1': { name: 'Complex Item', value: 42 },
        'item-2': { name: 'Another Item', value: 100 }
        /* eslint-enable @typescript-eslint/naming-convention */
      };

      const files: FileTree.IInMemoryFile[] = [
        { path: '/data/my-collection.json', contents: complexCollection }
      ];

      expect(FileTree.inMemory(files)).toSucceedAndSatisfy((tree) => {
        expect(tree.getItem('/data')).toSucceedAndSatisfy((dir) => {
          expect(loader.loadFromFileTree(dir)).toSucceedAndSatisfy((collections) => {
            expect(collections).toHaveLength(1);
            expect(collections[0].id).toBe('my-collection');
            expect(collections[0].items['item-1' as TestItemId]).toEqual({ name: 'Complex Item', value: 42 });
            expect(collections[0].items['item-2' as TestItemId]).toEqual({
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
        { path: '/collections/test.yaml', contents: { item: { name: 'YAML Item', value: 42 } } },
        { path: '/collections/ignored.json', contents: { item: { name: 'JSON Item', value: 1 } } }
      ];

      expect(FileTree.inMemory(files)).toSucceedAndSatisfy((tree) => {
        expect(tree.getItem('/collections')).toSucceedAndSatisfy((dir) => {
          expect(yamlLoader.loadFromFileTree(dir)).toSucceedAndSatisfy((collections) => {
            // Only .yaml file should be loaded, .json should be filtered out
            expect(collections).toHaveLength(1);
            expect(collections[0].id).toBe('test');
          });
        });
      });
    });

    test('fails when encountering encrypted collection file', async () => {
      const collectionData = {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        'item-1': { name: 'Secret Item', value: 42 }
      };
      const key = (await nodeCryptoProvider.generateKey()).orThrow();
      const encrypted = (
        await createEncryptedCollectionFile({
          content: collectionData,
          secretName: 'test-secret',
          key,
          cryptoProvider: nodeCryptoProvider
        })
      ).orThrow();

      const files: FileTree.IInMemoryFile[] = [
        { path: '/collections/encrypted.json', contents: encrypted as unknown as JsonObject }
      ];

      expect(FileTree.inMemory(files)).toSucceedAndSatisfy((tree) => {
        expect(tree.getItem('/collections')).toSucceedAndSatisfy((dir) => {
          expect(loader.loadFromFileTree(dir)).toFailWith(/use loadFromFileTreeAsync instead/i);
        });
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
      testKey = (await nodeCryptoProvider.generateKey()).orThrow();
    });

    test('loads plain (non-encrypted) collections', async () => {
      const collectionData = {
        /* eslint-disable @typescript-eslint/naming-convention */
        'item-1': { name: 'Item One', value: 1 },
        'item-2': { name: 'Item Two', value: 2 }
        /* eslint-enable @typescript-eslint/naming-convention */
      };

      const files: FileTree.IInMemoryFile[] = [
        { path: '/collections/test-collection.json', contents: collectionData }
      ];

      const tree = FileTree.inMemory(files).orThrow();
      const dir = tree.getItem('/collections').orThrow();
      const result = await loader.loadFromFileTreeAsync(dir);

      expect(result).toSucceedAndSatisfy((collections) => {
        expect(collections).toHaveLength(1);
        expect(collections[0].id).toBe('test-collection');
        expect(Object.keys(collections[0].items)).toHaveLength(2);
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
        await createEncryptedCollectionFile({
          content: collectionData,
          secretName: 'my-secret',
          key: testKey,
          cryptoProvider: nodeCryptoProvider
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
          cryptoProvider: nodeCryptoProvider
        }
      });

      expect(result).toSucceedAndSatisfy((collections) => {
        expect(collections).toHaveLength(1);
        expect(collections[0].id).toBe('encrypted');
        expect(collections[0].items['item-1' as TestItemId]).toEqual({ name: 'Secret Item', value: 42 });
        expect(collections[0].items['item-2' as TestItemId]).toEqual({ name: 'Another Secret', value: 100 });
      });
    });

    test('loads mixed encrypted and plain collections', async () => {
      const plainData = {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        'plain-item': { name: 'Plain', value: 1 }
      };

      const encryptedData = {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        'secret-item': { name: 'Secret', value: 2 }
      };

      const encrypted = (
        await createEncryptedCollectionFile({
          content: encryptedData,
          secretName: 'test-secret',
          key: testKey,
          cryptoProvider: nodeCryptoProvider
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
          cryptoProvider: nodeCryptoProvider
        }
      });

      expect(result).toSucceedAndSatisfy((collections) => {
        expect(collections).toHaveLength(2);
        const plain = collections.find((c) => c.id === 'plain');
        const enc = collections.find((c) => c.id === 'encrypted');
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
        await createEncryptedCollectionFile({
          content: collectionData,
          secretName: 'my-secret',
          key: testKey,
          cryptoProvider: nodeCryptoProvider
        })
      ).orThrow();

      const files: FileTree.IInMemoryFile[] = [
        { path: '/collections/encrypted.json', contents: encrypted as unknown as JsonObject }
      ];

      const tree = FileTree.inMemory(files).orThrow();
      const dir = tree.getItem('/collections').orThrow();
      const result = await loader.loadFromFileTreeAsync(dir);

      expect(result).toFailWith(/no encryption config provided/i);
    });

    // ============================================================================
    // onMissingKey Error Mode Tests
    // ============================================================================

    describe('onMissingKey error modes', () => {
      test('fails by default when secret is not found', async () => {
        const collectionData = {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          'item-1': { name: 'Secret', value: 42 }
        };

        const encrypted = (
          await createEncryptedCollectionFile({
            content: collectionData,
            secretName: 'unknown-secret',
            key: testKey,
            cryptoProvider: nodeCryptoProvider
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
            cryptoProvider: nodeCryptoProvider
          }
        });

        expect(result).toFailWith(/missing key.*unknown-secret/i);
      });

      test('skips encrypted file when onMissingKey is "skip"', async () => {
        const plainData = {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          'plain-item': { name: 'Plain', value: 1 }
        };

        const encryptedData = {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          'secret-item': { name: 'Secret', value: 2 }
        };

        const encrypted = (
          await createEncryptedCollectionFile({
            content: encryptedData,
            secretName: 'unknown-secret',
            key: testKey,
            cryptoProvider: nodeCryptoProvider
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
            secrets: [], // No secrets provided
            cryptoProvider: nodeCryptoProvider,
            onMissingKey: 'skip'
          }
        });

        expect(result).toSucceedAndSatisfy((collections) => {
          // Only plain collection should be loaded, encrypted should be skipped
          expect(collections).toHaveLength(1);
          expect(collections[0].id).toBe('plain');
        });
      });

      test('warns and skips when onMissingKey is "warn"', async () => {
        const plainData = {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          'plain-item': { name: 'Plain', value: 1 }
        };

        const encryptedData = {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          'secret-item': { name: 'Secret', value: 2 }
        };

        const encrypted = (
          await createEncryptedCollectionFile({
            content: encryptedData,
            secretName: 'unknown-secret',
            key: testKey,
            cryptoProvider: nodeCryptoProvider
          })
        ).orThrow();

        const files: FileTree.IInMemoryFile[] = [
          { path: '/collections/plain.json', contents: plainData },
          { path: '/collections/encrypted.json', contents: encrypted as unknown as JsonObject }
        ];

        const tree = FileTree.inMemory(files).orThrow();
        const dir = tree.getItem('/collections').orThrow();

        // Spy on console.warn
        const warnSpy = jest.spyOn(console, 'warn').mockImplementation();

        const result = await loader.loadFromFileTreeAsync(dir, {
          encryption: {
            secrets: [],
            cryptoProvider: nodeCryptoProvider,
            onMissingKey: 'warn'
          }
        });

        expect(result).toSucceedAndSatisfy((collections) => {
          expect(collections).toHaveLength(1);
          expect(collections[0].id).toBe('plain');
        });

        expect(warnSpy).toHaveBeenCalledWith(expect.stringMatching(/missing key.*unknown-secret/i));
        warnSpy.mockRestore();
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
          await createEncryptedCollectionFile({
            content: collectionData,
            secretName: 'my-secret',
            key: testKey,
            cryptoProvider: nodeCryptoProvider
          })
        ).orThrow();

        const wrongKey = (await nodeCryptoProvider.generateKey()).orThrow();

        const files: FileTree.IInMemoryFile[] = [
          { path: '/collections/encrypted.json', contents: encrypted as unknown as JsonObject }
        ];

        const tree = FileTree.inMemory(files).orThrow();
        const dir = tree.getItem('/collections').orThrow();
        const result = await loader.loadFromFileTreeAsync(dir, {
          encryption: {
            secrets: [{ name: 'my-secret', key: wrongKey }],
            cryptoProvider: nodeCryptoProvider
          }
        });

        expect(result).toFailWith(/decryption failed/i);
      });

      test('skips file when onDecryptionError is "skip"', async () => {
        const plainData = {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          'plain-item': { name: 'Plain', value: 1 }
        };

        const encryptedData = {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          'secret-item': { name: 'Secret', value: 2 }
        };

        const encrypted = (
          await createEncryptedCollectionFile({
            content: encryptedData,
            secretName: 'my-secret',
            key: testKey,
            cryptoProvider: nodeCryptoProvider
          })
        ).orThrow();

        const wrongKey = (await nodeCryptoProvider.generateKey()).orThrow();

        const files: FileTree.IInMemoryFile[] = [
          { path: '/collections/plain.json', contents: plainData },
          { path: '/collections/encrypted.json', contents: encrypted as unknown as JsonObject }
        ];

        const tree = FileTree.inMemory(files).orThrow();
        const dir = tree.getItem('/collections').orThrow();
        const result = await loader.loadFromFileTreeAsync(dir, {
          encryption: {
            secrets: [{ name: 'my-secret', key: wrongKey }],
            cryptoProvider: nodeCryptoProvider,
            onDecryptionError: 'skip'
          }
        });

        expect(result).toSucceedAndSatisfy((collections) => {
          expect(collections).toHaveLength(1);
          expect(collections[0].id).toBe('plain');
        });
      });

      test('warns and skips when onDecryptionError is "warn"', async () => {
        const plainData = {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          'plain-item': { name: 'Plain', value: 1 }
        };

        const encryptedData = {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          'secret-item': { name: 'Secret', value: 2 }
        };

        const encrypted = (
          await createEncryptedCollectionFile({
            content: encryptedData,
            secretName: 'my-secret',
            key: testKey,
            cryptoProvider: nodeCryptoProvider
          })
        ).orThrow();

        const wrongKey = (await nodeCryptoProvider.generateKey()).orThrow();

        const files: FileTree.IInMemoryFile[] = [
          { path: '/collections/plain.json', contents: plainData },
          { path: '/collections/encrypted.json', contents: encrypted as unknown as JsonObject }
        ];

        const tree = FileTree.inMemory(files).orThrow();
        const dir = tree.getItem('/collections').orThrow();

        const warnSpy = jest.spyOn(console, 'warn').mockImplementation();

        const result = await loader.loadFromFileTreeAsync(dir, {
          encryption: {
            secrets: [{ name: 'my-secret', key: wrongKey }],
            cryptoProvider: nodeCryptoProvider,
            onDecryptionError: 'warn'
          }
        });

        expect(result).toSucceedAndSatisfy((collections) => {
          expect(collections).toHaveLength(1);
          expect(collections[0].id).toBe('plain');
        });

        expect(warnSpy).toHaveBeenCalledWith(expect.stringMatching(/decryption failed/i));
        warnSpy.mockRestore();
      });

      test('handles invalid encrypted file format with onDecryptionError', async () => {
        // Create a malformed encrypted file (has format field but missing other required fields)
        const malformed = {
          format: ENCRYPTED_COLLECTION_FORMAT,
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
            cryptoProvider: nodeCryptoProvider,
            onDecryptionError: 'skip'
          }
        });

        expect(result).toSucceedAndSatisfy((collections) => {
          // Malformed file should be skipped
          expect(collections).toHaveLength(0);
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
          await createEncryptedCollectionFile({
            content: collectionData,
            secretName: 'dynamic-secret',
            key: testKey,
            cryptoProvider: nodeCryptoProvider
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
            cryptoProvider: nodeCryptoProvider
          }
        });

        expect(result).toSucceedAndSatisfy((collections) => {
          expect(collections).toHaveLength(1);
          expect(collections[0].items['item-1' as TestItemId]).toEqual({ name: 'Secret', value: 42 });
        });

        expect(secretProvider).toHaveBeenCalledWith('dynamic-secret');
      });

      test('prefers secrets array over secretProvider', async () => {
        const collectionData = {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          'item-1': { name: 'Secret', value: 42 }
        };

        const encrypted = (
          await createEncryptedCollectionFile({
            content: collectionData,
            secretName: 'known-secret',
            key: testKey,
            cryptoProvider: nodeCryptoProvider
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
            cryptoProvider: nodeCryptoProvider
          }
        });

        expect(result).toSucceed();
        expect(secretProvider).not.toHaveBeenCalled();
      });

      test('handles secretProvider failure', async () => {
        const collectionData = {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          'item-1': { name: 'Secret', value: 42 }
        };

        const encrypted = (
          await createEncryptedCollectionFile({
            content: collectionData,
            secretName: 'unknown-secret',
            key: testKey,
            cryptoProvider: nodeCryptoProvider
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
            cryptoProvider: nodeCryptoProvider
          }
        });

        expect(result).toFailWith(/missing key.*unknown-secret/i);
      });
    });

    // ============================================================================
    // Mutability Tests with Encrypted Collections
    // ============================================================================

    describe('mutability with encrypted collections', () => {
      test('respects mutable option for encrypted collections', async () => {
        const collectionData = {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          'item-1': { name: 'Secret', value: 42 }
        };

        const encrypted = (
          await createEncryptedCollectionFile({
            content: collectionData,
            secretName: 'my-secret',
            key: testKey,
            cryptoProvider: nodeCryptoProvider
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
            cryptoProvider: nodeCryptoProvider
          }
        });

        expect(result).toSucceedAndSatisfy((collections) => {
          expect(collections).toHaveLength(1);
          expect(collections[0].isMutable).toBe(true);
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
          /* eslint-disable @typescript-eslint/naming-convention */
          'valid-item': { name: 'Valid', value: 1 },
          'invalid-item': { name: 'Missing Value' } // missing 'value' field
          /* eslint-enable @typescript-eslint/naming-convention */
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
