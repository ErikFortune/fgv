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
import { Confections, ConfectionsLibrary } from '../../../packlets/entities';
import { ConfectionId, SourceId } from '../../../packlets/common';

describe('ConfectionsLibrary', () => {
  // ============================================================================
  // Test Data
  // ============================================================================

  /* eslint-disable @typescript-eslint/naming-convention */
  const moldedBonBonData = {
    baseId: 'test-molded',
    confectionType: 'molded-bonbon' as const,
    name: 'Test Molded Bonbon',
    goldenVersionSpec: '2026-01-01-01',
    versions: [
      {
        versionSpec: '2026-01-01-01',
        createdDate: '2026-01-01',
        yield: { count: 24 },
        molds: {
          options: [{ id: 'common.dome-25mm' }]
        },
        shellChocolate: {
          ids: ['common.chocolate-dark-64']
        }
      }
    ]
  };

  const barTruffleData = {
    baseId: 'test-bar',
    confectionType: 'bar-truffle' as const,
    name: 'Test Bar Truffle',
    goldenVersionSpec: '2026-01-01-01',
    versions: [
      {
        versionSpec: '2026-01-01-01',
        createdDate: '2026-01-01',
        yield: { count: 48 },
        frameDimensions: { width: 300, height: 200, depth: 8 },
        singleBonBonDimensions: { width: 25, height: 25 }
      }
    ]
  };

  const rolledTruffleData = {
    baseId: 'test-rolled',
    confectionType: 'rolled-truffle' as const,
    name: 'Test Rolled Truffle',
    goldenVersionSpec: '2026-01-01-01',
    versions: [
      {
        versionSpec: '2026-01-01-01',
        createdDate: '2026-01-01',
        yield: { count: 40 }
      }
    ]
  };

  const testCollection: Confections.ConfectionCollectionEntryInit = {
    id: 'test' as SourceId,
    isMutable: false,
    items: {
      'test-molded': moldedBonBonData,
      'test-bar': barTruffleData,
      'test-rolled': rolledTruffleData
    }
  };
  /* eslint-enable @typescript-eslint/naming-convention */

  // ============================================================================
  // Factory Methods
  // ============================================================================

  describe('create', () => {
    test('creates library with built-in data by default', () => {
      expect(ConfectionsLibrary.create()).toSucceedAndSatisfy((lib) => {
        // Default behavior loads built-in data
        expect(lib.size).toBeGreaterThan(0);
      });
    });

    test('creates library with built-in data when explicitly set', () => {
      expect(ConfectionsLibrary.create({ builtin: true })).toSucceedAndSatisfy((lib) => {
        expect(lib.size).toBeGreaterThan(0);
      });
    });

    test('creates library without built-in data', () => {
      expect(ConfectionsLibrary.create({ builtin: false })).toSucceedAndSatisfy((lib) => {
        expect(lib.size).toBe(0);
      });
    });

    test('creates library with collection data', () => {
      expect(
        ConfectionsLibrary.create({
          builtin: false,
          collections: [testCollection]
        })
      ).toSucceedAndSatisfy((lib) => {
        expect(lib.size).toBe(3);
        expect(lib.has('test.test-molded' as ConfectionId)).toBe(true);
        expect(lib.has('test.test-bar' as ConfectionId)).toBe(true);
        expect(lib.has('test.test-rolled' as ConfectionId)).toBe(true);
      });
    });

    test('creates library with both built-in and collection data', () => {
      expect(
        ConfectionsLibrary.create({
          builtin: true,
          collections: [testCollection]
        })
      ).toSucceedAndSatisfy((lib) => {
        // Should have built-in + test collections
        expect(lib.has('test.test-molded' as ConfectionId)).toBe(true);
        expect(lib.size).toBeGreaterThan(3);
      });
    });
  });

  // ============================================================================
  // Library Access
  // ============================================================================

  describe('library access', () => {
    let library: ConfectionsLibrary;

    beforeEach(() => {
      library = ConfectionsLibrary.create({
        builtin: false,
        collections: [testCollection]
      }).orThrow();
    });

    describe('get', () => {
      test('returns confection for valid ID', () => {
        expect(library.get('test.test-molded' as ConfectionId)).toSucceedAndSatisfy((confection) => {
          expect(confection.baseId).toBe('test-molded');
          expect(confection.name).toBe('Test Molded Bonbon');
          expect(Confections.isMoldedBonBon(confection)).toBe(true);
        });
      });

      test('returns bar truffle for valid ID', () => {
        expect(library.get('test.test-bar' as ConfectionId)).toSucceedAndSatisfy((confection) => {
          expect(Confections.isBarTruffle(confection)).toBe(true);
        });
      });

      test('returns rolled truffle for valid ID', () => {
        expect(library.get('test.test-rolled' as ConfectionId)).toSucceedAndSatisfy((confection) => {
          expect(Confections.isRolledTruffle(confection)).toBe(true);
        });
      });

      test('fails for non-existent ID', () => {
        expect(library.get('test.nonexistent' as ConfectionId)).toFailWith(/not found/i);
      });

      test('fails for invalid source ID', () => {
        expect(library.get('invalid.test-molded' as ConfectionId)).toFailWith(/not found/i);
      });
    });

    describe('has', () => {
      test('returns true for existing ID', () => {
        expect(library.has('test.test-molded' as ConfectionId)).toBe(true);
      });

      test('returns false for non-existent ID', () => {
        expect(library.has('test.nonexistent' as ConfectionId)).toBe(false);
      });
    });

    describe('size', () => {
      test('returns correct count', () => {
        expect(library.size).toBe(3);
      });
    });

    describe('entries', () => {
      test('iterates over all confections', () => {
        const entries = Array.from(library.entries());
        expect(entries).toHaveLength(3);

        const ids = entries.map(([id]) => id);
        expect(ids).toContain('test.test-molded');
        expect(ids).toContain('test.test-bar');
        expect(ids).toContain('test.test-rolled');
      });
    });

    describe('keys', () => {
      test('iterates over all IDs', () => {
        const keys = Array.from(library.keys());
        expect(keys).toHaveLength(3);
        expect(keys).toContain('test.test-molded');
      });
    });

    describe('values', () => {
      test('iterates over all confections', () => {
        const values = Array.from(library.values());
        expect(values).toHaveLength(3);

        // Check that we have each type
        const types = values.map((c) => c.confectionType);
        expect(types).toContain('molded-bonbon');
        expect(types).toContain('bar-truffle');
        expect(types).toContain('rolled-truffle');
      });
    });
  });

  // ============================================================================
  // Type-Specific Access
  // ============================================================================

  describe('type-specific access', () => {
    let library: ConfectionsLibrary;

    beforeEach(() => {
      library = ConfectionsLibrary.create({
        builtin: false,
        collections: [testCollection]
      }).orThrow();
    });

    test('molded bonbon has type-specific properties', () => {
      expect(library.get('test.test-molded' as ConfectionId)).toSucceedAndSatisfy((confection) => {
        if (Confections.isMoldedBonBon(confection)) {
          const version = confection.versions[0];
          expect(version.molds).toBeDefined();
          expect(version.shellChocolate).toBeDefined();
          expect(version.molds.options[0].id).toBe('common.dome-25mm');
        } else {
          fail('Expected molded bonbon');
        }
      });
    });

    test('bar truffle has type-specific properties', () => {
      expect(library.get('test.test-bar' as ConfectionId)).toSucceedAndSatisfy((confection) => {
        if (Confections.isBarTruffle(confection)) {
          const version = confection.versions[0];
          expect(version.frameDimensions).toBeDefined();
          expect(version.singleBonBonDimensions).toBeDefined();
          expect(version.frameDimensions.width).toBe(300);
        } else {
          fail('Expected bar truffle');
        }
      });
    });

    test('rolled truffle has type-specific properties', () => {
      expect(library.get('test.test-rolled' as ConfectionId)).toSucceedAndSatisfy((confection) => {
        if (Confections.isRolledTruffle(confection)) {
          const version = confection.versions[0];
          // Rolled truffle optional properties
          expect(version.coatings).toBeUndefined();
          expect(version.enrobingChocolate).toBeUndefined();
        } else {
          fail('Expected rolled truffle');
        }
      });
    });
  });

  // ============================================================================
  // Built-in Data
  // ============================================================================

  describe('built-in data', () => {
    test('loads built-in confections', () => {
      expect(ConfectionsLibrary.create({ builtin: true })).toSucceedAndSatisfy((lib) => {
        // Should have at least the seed confections
        expect(lib.has('common.dark-dome-bonbon' as ConfectionId)).toBe(true);
        expect(lib.has('common.dark-bar-truffle' as ConfectionId)).toBe(true);
        expect(lib.has('common.dark-cocoa-truffle' as ConfectionId)).toBe(true);
      });
    });

    test('built-in confections have correct types', () => {
      expect(ConfectionsLibrary.create({ builtin: true })).toSucceedAndSatisfy((lib) => {
        expect(lib.get('common.dark-dome-bonbon' as ConfectionId)).toSucceedAndSatisfy((c) => {
          expect(Confections.isMoldedBonBon(c)).toBe(true);
        });

        expect(lib.get('common.dark-bar-truffle' as ConfectionId)).toSucceedAndSatisfy((c) => {
          expect(Confections.isBarTruffle(c)).toBe(true);
        });

        expect(lib.get('common.dark-cocoa-truffle' as ConfectionId)).toSucceedAndSatisfy((c) => {
          expect(Confections.isRolledTruffle(c)).toBe(true);
        });
      });
    });
  });

  // ============================================================================
  // Collection Merging
  // ============================================================================

  describe('collection merging', () => {
    test('merges multiple collections', () => {
      /* eslint-disable @typescript-eslint/naming-convention */
      const collection2: Confections.ConfectionCollectionEntryInit = {
        id: 'custom' as SourceId,
        isMutable: true,
        items: {
          'custom-truffle': {
            ...rolledTruffleData,
            baseId: 'custom-truffle',
            name: 'Custom Truffle'
          }
        }
      };
      /* eslint-enable @typescript-eslint/naming-convention */

      expect(
        ConfectionsLibrary.create({
          builtin: false,
          collections: [testCollection, collection2]
        })
      ).toSucceedAndSatisfy((lib) => {
        expect(lib.size).toBe(4);
        expect(lib.has('test.test-molded' as ConfectionId)).toBe(true);
        expect(lib.has('custom.custom-truffle' as ConfectionId)).toBe(true);
      });
    });

    test('second collection overwrites items with same collection ID', () => {
      /* eslint-disable @typescript-eslint/naming-convention */
      const duplicateCollection: Confections.ConfectionCollectionEntryInit = {
        id: 'test' as SourceId, // Same as testCollection
        isMutable: false,
        items: {
          'other-truffle': {
            ...rolledTruffleData,
            baseId: 'other-truffle',
            name: 'Other Truffle'
          }
        }
      };
      /* eslint-enable @typescript-eslint/naming-convention */

      // When same collection ID is used, items are merged/overwritten
      expect(
        ConfectionsLibrary.create({
          builtin: false,
          collections: [testCollection, duplicateCollection]
        })
      ).toSucceedAndSatisfy((lib) => {
        // The second collection overwrites the first with same ID
        expect(lib.has('test.other-truffle' as ConfectionId)).toBe(true);
      });
    });
  });

  // ============================================================================
  // Validation
  // ============================================================================

  describe('validation', () => {
    test('fails for confection with no versions', () => {
      /* eslint-disable @typescript-eslint/naming-convention */
      const invalidCollection: Confections.ConfectionCollectionEntryInit = {
        id: 'invalid' as SourceId,
        isMutable: false,
        items: {
          'no-versions': {
            ...moldedBonBonData,
            baseId: 'no-versions',
            versions: []
          }
        }
      };
      /* eslint-enable @typescript-eslint/naming-convention */

      expect(
        ConfectionsLibrary.create({
          builtin: false,
          collections: [invalidCollection]
        })
      ).toFailWith(/at least one version/i);
    });

    test('fails for confection with missing golden version', () => {
      /* eslint-disable @typescript-eslint/naming-convention */
      const invalidCollection: Confections.ConfectionCollectionEntryInit = {
        id: 'invalid' as SourceId,
        isMutable: false,
        items: {
          'bad-golden': {
            ...moldedBonBonData,
            baseId: 'bad-golden',
            goldenVersionSpec: '9999-99-99-99'
          }
        }
      };
      /* eslint-enable @typescript-eslint/naming-convention */

      expect(
        ConfectionsLibrary.create({
          builtin: false,
          collections: [invalidCollection]
        })
      ).toFailWith(/golden version.*not found/i);
    });
  });
});

// ============================================================================
// createAsync Tests (with encryption support)
// ============================================================================

import { FileTree, JsonObject } from '@fgv/ts-json-base';
import { CryptoUtils } from '@fgv/ts-extras';

describe('ConfectionsLibrary.createAsync', () => {
  const TEST_SECRET_NAME = 'test-secret';
  let testKey: Uint8Array;

  beforeAll(async () => {
    testKey = (await CryptoUtils.nodeCryptoProvider.generateKey()).orThrow();
  });

  test('creates library with built-ins by default', async () => {
    const result = await ConfectionsLibrary.createAsync();
    expect(result).toSucceedAndSatisfy((lib) => {
      expect(lib.collections.has('common' as SourceId)).toBe(true);
    });
  });

  test('creates library without built-ins when builtin: false', async () => {
    const result = await ConfectionsLibrary.createAsync({ builtin: false });
    expect(result).toSucceedAndSatisfy((lib) => {
      expect(lib.collections.size).toBe(0);
    });
  });

  test('creates library with file sources', async () => {
    const files: FileTree.IInMemoryFile[] = [
      {
        path: '/data/confections/external.json',
        contents: {
          items: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            'external-confection': {
              baseId: 'external-confection',
              confectionType: 'rolled-truffle',
              name: 'External Confection',
              goldenVersionSpec: '2026-01-01-01',
              versions: [{ versionSpec: '2026-01-01-01', createdDate: '2026-01-01', yield: { count: 30 } }]
            }
          }
        } as unknown as JsonObject
      }
    ];

    const tree = FileTree.inMemory(files).orThrow();
    const rootDir = tree.getItem('/').orThrow();
    const fileSource: Confections.IConfectionFileTreeSource = {
      directory: rootDir as FileTree.IFileTreeDirectoryItem,
      mutable: true
    };

    const result = await ConfectionsLibrary.createAsync({
      builtin: false,
      fileSources: fileSource
    });

    expect(result).toSucceedAndSatisfy((lib) => {
      expect(lib.collections.has('external' as SourceId)).toBe(true);
      expect(lib.get('external.external-confection' as ConfectionId)).toSucceed();
    });
  });

  test('decrypts encrypted file sources with encryption config', async () => {
    const secretConfectionData = {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      'secret-confection': {
        baseId: 'secret-confection',
        confectionType: 'rolled-truffle',
        name: 'Secret Confection',
        goldenVersionSpec: '2026-01-01-01',
        versions: [{ versionSpec: '2026-01-01-01', createdDate: '2026-01-01', yield: { count: 20 } }]
      }
    };

    const encryptedFile = (
      await CryptoUtils.createEncryptedFile({
        content: secretConfectionData,
        secretName: TEST_SECRET_NAME,
        key: testKey,
        cryptoProvider: CryptoUtils.nodeCryptoProvider
      })
    ).orThrow();

    const files: FileTree.IInMemoryFile[] = [
      {
        path: '/data/confections/secret.json',
        contents: encryptedFile as unknown as JsonObject
      }
    ];

    const tree = FileTree.inMemory(files).orThrow();
    const rootDir = tree.getItem('/').orThrow();
    const fileSource: Confections.IConfectionFileTreeSource = {
      directory: rootDir as FileTree.IFileTreeDirectoryItem,
      mutable: false
    };

    const result = await ConfectionsLibrary.createAsync({
      builtin: false,
      fileSources: fileSource,
      encryption: {
        secrets: [{ name: TEST_SECRET_NAME, key: testKey }],
        cryptoProvider: CryptoUtils.nodeCryptoProvider
      }
    });

    expect(result).toSucceedAndSatisfy((lib) => {
      expect(lib.collections.has('secret' as SourceId)).toBe(true);
      expect(lib.get('secret.secret-confection' as ConfectionId)).toSucceedAndSatisfy((confection) => {
        expect(confection.name).toBe('Secret Confection');
      });
    });
  });

  test('captures encrypted files when no encryption config provided', async () => {
    const secretConfectionData = {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      'secret-confection': {
        baseId: 'secret-confection',
        confectionType: 'rolled-truffle',
        name: 'Secret Confection',
        goldenVersionSpec: '2026-01-01-01',
        yield: { count: 20 },
        versions: [{ versionSpec: '2026-01-01-01', createdDate: '2026-01-01' }]
      }
    };

    const encryptedFile = (
      await CryptoUtils.createEncryptedFile({
        content: secretConfectionData,
        secretName: TEST_SECRET_NAME,
        key: testKey,
        cryptoProvider: CryptoUtils.nodeCryptoProvider
      })
    ).orThrow();

    const files: FileTree.IInMemoryFile[] = [
      {
        path: '/data/confections/secret.json',
        contents: encryptedFile as unknown as JsonObject
      }
    ];

    const tree = FileTree.inMemory(files).orThrow();
    const rootDir = tree.getItem('/').orThrow();
    const fileSource: Confections.IConfectionFileTreeSource = {
      directory: rootDir as FileTree.IFileTreeDirectoryItem,
      mutable: false
    };

    const result = await ConfectionsLibrary.createAsync({
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
