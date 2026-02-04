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
  BaseMoldId,
  Measurement,
  Millimeters,
  MoldId,
  CollectionId,
  Model as CommonModel
} from '../../../packlets/common';

import { MoldsLibrary, IMoldEntity, Molds } from '../../../packlets/entities';

import { CryptoUtils } from '@fgv/ts-extras';

describe('MoldsLibrary', () => {
  // ============================================================================
  // Test Data
  // ============================================================================

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
    tags: ['test', 'sample'],
    notes: [{ category: 'user', note: 'Test notes' }] as CommonModel.ICategorizedNote[]
  };

  // Create an IMold for mutation tests
  const createTestMold = (): IMoldEntity => testMoldData;

  // ============================================================================
  // Creation Tests
  // ============================================================================

  describe('create', () => {
    test('creates empty library with builtin: false', () => {
      expect(MoldsLibrary.create({ builtin: false })).toSucceedAndSatisfy((lib) => {
        expect(lib.size).toBe(0);
        expect(lib.collectionCount).toBe(0);
      });
    });

    test('creates library with built-ins by default', () => {
      expect(MoldsLibrary.create()).toSucceedAndSatisfy((lib) => {
        expect(lib.size).toBeGreaterThan(0);
        expect(lib.collectionCount).toBe(2); // common.yaml + cw.yaml
      });
    });

    test('creates library with additional collections', () => {
      const result = MoldsLibrary.create({
        builtin: false,
        collections: [
          {
            id: 'test' as CollectionId,
            isMutable: true,
            items: {
              testMold: createTestMold()
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
      const result = MoldsLibrary.create({
        collections: [
          {
            id: 'test' as CollectionId,
            isMutable: true,
            items: {
              testMold: createTestMold()
            }
          }
        ]
      });

      expect(result).toSucceedAndSatisfy((lib) => {
        expect(lib.collectionCount).toBe(3); // 2 built-in + 1 custom
        expect(lib.validating.has('test.testMold')).toBe(true);
        expect(lib.validating.has('cw.chocolate-world-cw-2227')).toBe(true);
      });
    });
  });

  // ============================================================================
  // Lookup Tests
  // ============================================================================

  describe('get and has', () => {
    let library: MoldsLibrary;

    beforeEach(() => {
      library = MoldsLibrary.create().orThrow();
    });

    test('gets existing mold', () => {
      const id = 'cw.chocolate-world-cw-2227';
      expect(library.validating.get(id)).toSucceedAndSatisfy((mold) => {
        expect(mold.manufacturer).toBe('Chocolate World');
      });
    });

    test('fails for non-existent mold', () => {
      const id = 'common.nonexistent' as MoldId;
      expect(library.get(id)).toFail();
    });

    test('has returns true for existing mold', () => {
      expect(library.has('cw.chocolate-world-cw-2227' as MoldId)).toBe(true);
    });

    test('has returns false for non-existent mold', () => {
      expect(library.has('common.nonexistent' as MoldId)).toBe(false);
    });
  });

  // ============================================================================
  // Iteration Tests
  // ============================================================================

  describe('iteration', () => {
    let library: MoldsLibrary;

    beforeEach(() => {
      library = MoldsLibrary.create().orThrow();
    });

    test('entries iterates all items', () => {
      const entries = Array.from(library.entries());
      expect(entries.length).toBe(library.size);
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
      expect(values.every((v) => typeof v.manufacturer === 'string')).toBe(true);
    });
  });

  // ============================================================================
  // Mutation Tests
  // ============================================================================

  describe('mutation', () => {
    let library: MoldsLibrary;

    beforeEach(() => {
      library = MoldsLibrary.create({
        builtin: false,
        collections: [
          {
            id: 'test' as CollectionId,
            isMutable: true,
            items: {}
          }
        ]
      }).orThrow();
    });

    test('add succeeds for new mold', () => {
      const id = 'test.new-mold' as MoldId;
      expect(library.add(id, createTestMold())).toSucceed();
      expect(library.has(id)).toBe(true);
    });

    test('add fails for duplicate mold', () => {
      const id = 'test.new-mold' as MoldId;
      library.add(id, createTestMold()).orThrow();
      expect(library.add(id, createTestMold())).toFail();
    });

    test('set adds or updates mold', () => {
      const id = 'test.set-mold' as MoldId;
      expect(library.set(id, createTestMold())).toSucceed();
      expect(library.has(id)).toBe(true);

      const updatedMold: IMoldEntity = { ...testMoldData, description: 'Updated Description' };
      expect(library.set(id, updatedMold)).toSucceed();
      expect(library.get(id)).toSucceedAndSatisfy((mold) => {
        expect(mold.description).toBe('Updated Description');
      });
    });

    test('delete removes mold', () => {
      const id = 'test.delete-mold' as MoldId;
      library.add(id, createTestMold()).orThrow();
      expect(library.delete(id)).toSucceed();
      expect(library.has(id)).toBe(false);
    });
  });
});

// ============================================================================
// createAsync Tests (with encryption support)
// ============================================================================

describe('MoldsLibrary.createAsync', () => {
  const TEST_SECRET_NAME = 'test-secret';
  let testKey: Uint8Array;

  beforeAll(async () => {
    testKey = (await CryptoUtils.nodeCryptoProvider.generateKey()).orThrow();
  });

  test('creates library with built-ins by default', async () => {
    const result = await MoldsLibrary.createAsync();
    expect(result).toSucceedAndSatisfy((lib) => {
      expect(lib.collections.has('common' as CollectionId)).toBe(true);
    });
  });

  test('creates library without built-ins when builtin: false', async () => {
    const result = await MoldsLibrary.createAsync({ builtin: false });
    expect(result).toSucceedAndSatisfy((lib) => {
      expect(lib.collections.size).toBe(0);
    });
  });

  test('creates library with file sources', async () => {
    const files: FileTree.IInMemoryFile[] = [
      {
        path: '/data/molds/external.json',
        contents: {
          items: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            'external-mold': {
              baseId: 'external-mold',
              manufacturer: 'External Manufacturer',
              productNumber: 'EXT-001',
              cavities: { kind: 'count', count: 20 },
              format: 'series-1000'
            }
          }
        } as unknown as JsonObject
      }
    ];

    const tree = FileTree.inMemory(files).orThrow();
    const rootDir = tree.getItem('/').orThrow();
    const fileSource: Molds.IMoldFileTreeSource = {
      directory: rootDir as FileTree.IFileTreeDirectoryItem,
      mutable: true
    };

    const result = await MoldsLibrary.createAsync({
      builtin: false,
      fileSources: fileSource
    });

    expect(result).toSucceedAndSatisfy((lib) => {
      expect(lib.collections.has('external' as CollectionId)).toBe(true);
      expect(lib.get('external.external-mold' as MoldId)).toSucceed();
    });
  });

  test('decrypts encrypted file sources with encryption config', async () => {
    const secretMoldData = {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      'secret-mold': {
        baseId: 'secret-mold',
        manufacturer: 'Secret Manufacturer',
        productNumber: 'SEC-001',
        cavities: { kind: 'count', count: 16 },
        format: 'series-2000'
      }
    };

    const encryptedFile = (
      await CryptoUtils.createEncryptedFile({
        content: secretMoldData,
        secretName: TEST_SECRET_NAME,
        key: testKey,
        cryptoProvider: CryptoUtils.nodeCryptoProvider
      })
    ).orThrow();

    const files: FileTree.IInMemoryFile[] = [
      {
        path: '/data/molds/secret.json',
        contents: encryptedFile as unknown as JsonObject
      }
    ];

    const tree = FileTree.inMemory(files).orThrow();
    const rootDir = tree.getItem('/').orThrow();
    const fileSource: Molds.IMoldFileTreeSource = {
      directory: rootDir as FileTree.IFileTreeDirectoryItem,
      mutable: false
    };

    const result = await MoldsLibrary.createAsync({
      builtin: false,
      fileSources: fileSource,
      encryption: {
        secrets: [{ name: TEST_SECRET_NAME, key: testKey }],
        cryptoProvider: CryptoUtils.nodeCryptoProvider
      }
    });

    expect(result).toSucceedAndSatisfy((lib) => {
      expect(lib.collections.has('secret' as CollectionId)).toBe(true);
      expect(lib.get('secret.secret-mold' as MoldId)).toSucceedAndSatisfy((mold) => {
        expect(mold.manufacturer).toBe('Secret Manufacturer');
      });
    });
  });

  test('captures encrypted files when no encryption config provided', async () => {
    const secretMoldData = {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      'secret-mold': {
        baseId: 'secret-mold',
        manufacturer: 'Secret Manufacturer',
        productNumber: 'SEC-001',
        cavities: { kind: 'count', count: 16 },
        format: 'series-2000'
      }
    };

    const encryptedFile = (
      await CryptoUtils.createEncryptedFile({
        content: secretMoldData,
        secretName: TEST_SECRET_NAME,
        key: testKey,
        cryptoProvider: CryptoUtils.nodeCryptoProvider
      })
    ).orThrow();

    const files: FileTree.IInMemoryFile[] = [
      {
        path: '/data/molds/secret.json',
        contents: encryptedFile as unknown as JsonObject
      }
    ];

    const tree = FileTree.inMemory(files).orThrow();
    const rootDir = tree.getItem('/').orThrow();
    const fileSource: Molds.IMoldFileTreeSource = {
      directory: rootDir as FileTree.IFileTreeDirectoryItem,
      mutable: false
    };

    const result = await MoldsLibrary.createAsync({
      builtin: false,
      fileSources: fileSource
    });

    // Without encryption config, encrypted files are captured (not decrypted)
    expect(result).toSucceedAndSatisfy((lib) => {
      // No decrypted collections since no encryption config
      expect(lib.collections.size).toBe(0);
    });
  });
});
