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
  BaseProcedureId,
  Minutes,
  Model as CommonModel,
  ProcedureId,
  SourceId
} from '../../../packlets/common';

import { ProceduresLibrary, IProcedure, IProcedureFileTreeSource } from '../../../packlets/entities';

import { Crypto } from '@fgv/ts-extras';
import { ITaskInvocation } from '../../../packlets/entities';
import { BaseTaskId } from '../../../packlets/common';

/**
 * Helper to create an inline task from a description string.
 * Creates a synthetic baseId from the template for testing purposes.
 */
function inlineTask(template: string): ITaskInvocation {
  const baseId = `test-inline-${template.slice(0, 20).replace(/\s+/g, '-').toLowerCase()}` as BaseTaskId;
  return {
    task: {
      baseId,
      name: template.slice(0, 30),
      template
    },
    params: {}
  };
}

describe('ProceduresLibrary', () => {
  // ============================================================================
  // Test Data
  // ============================================================================

  const testProcedureData: IProcedure = {
    baseId: 'test-procedure' as BaseProcedureId,
    name: 'Test Procedure',
    description: 'A test procedure',
    steps: [
      { order: 1, task: inlineTask('Step 1'), activeTime: 5 as Minutes },
      { order: 2, task: inlineTask('Step 2'), waitTime: 10 as Minutes }
    ],
    tags: ['test', 'sample'],
    notes: [{ category: 'user', note: 'Test notes' }] as CommonModel.ICategorizedNote[]
  };

  // Create a procedure for mutation tests
  const createTestProcedure = (): IProcedure => testProcedureData;

  // ============================================================================
  // Creation Tests
  // ============================================================================

  describe('create', () => {
    test('creates empty library with builtin: false', () => {
      expect(ProceduresLibrary.create({ builtin: false })).toSucceedAndSatisfy((lib) => {
        expect(lib.size).toBe(0);
        expect(lib.collectionCount).toBe(0);
      });
    });

    test('creates library with built-ins by default', () => {
      expect(ProceduresLibrary.create()).toSucceedAndSatisfy((lib) => {
        expect(lib.size).toBeGreaterThan(0);
        expect(lib.collectionCount).toBe(1); // common.yaml
      });
    });

    test('creates library with additional collections', () => {
      const result = ProceduresLibrary.create({
        builtin: false,
        collections: [
          {
            id: 'test' as SourceId,
            isMutable: true,
            items: {
              testProcedure: createTestProcedure()
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
      const result = ProceduresLibrary.create({
        collections: [
          {
            id: 'test' as SourceId,
            isMutable: true,
            items: {
              testProcedure: createTestProcedure()
            }
          }
        ]
      });

      expect(result).toSucceedAndSatisfy((lib) => {
        expect(lib.collectionCount).toBe(2); // 1 built-in + 1 custom
        expect(lib.validating.has('test.testProcedure')).toBe(true);
        expect(lib.validating.has('common.ganache-cold-method')).toBe(true);
      });
    });
  });

  // ============================================================================
  // Lookup Tests
  // ============================================================================

  describe('get and has', () => {
    let library: ProceduresLibrary;

    beforeEach(() => {
      library = ProceduresLibrary.create().orThrow();
    });

    test('gets existing procedure', () => {
      const id = 'common.ganache-cold-method';
      expect(library.validating.get(id)).toSucceedAndSatisfy((procedure) => {
        expect(procedure.name).toBe('Ganache (Cold Method)');
      });
    });

    test('fails for non-existent procedure', () => {
      const id = 'common.nonexistent' as ProcedureId;
      expect(library.get(id)).toFail();
    });

    test('has returns true for existing procedure', () => {
      expect(library.has('common.ganache-cold-method' as ProcedureId)).toBe(true);
    });

    test('has returns false for non-existent procedure', () => {
      expect(library.has('common.nonexistent' as ProcedureId)).toBe(false);
    });
  });

  // ============================================================================
  // Iteration Tests
  // ============================================================================

  describe('iteration', () => {
    let library: ProceduresLibrary;

    beforeEach(() => {
      library = ProceduresLibrary.create().orThrow();
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
      expect(values.every((v) => typeof v.name === 'string')).toBe(true);
    });
  });

  // ============================================================================
  // Mutation Tests
  // ============================================================================

  describe('mutation', () => {
    let library: ProceduresLibrary;

    beforeEach(() => {
      library = ProceduresLibrary.create({
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

    test('add succeeds for new procedure', () => {
      const id = 'test.new-procedure' as ProcedureId;
      expect(library.add(id, createTestProcedure())).toSucceed();
      expect(library.has(id)).toBe(true);
    });

    test('add fails for duplicate procedure', () => {
      const id = 'test.new-procedure' as ProcedureId;
      library.add(id, createTestProcedure()).orThrow();
      expect(library.add(id, createTestProcedure())).toFail();
    });

    test('set adds or updates procedure', () => {
      const id = 'test.set-procedure' as ProcedureId;
      expect(library.set(id, createTestProcedure())).toSucceed();
      expect(library.has(id)).toBe(true);

      const updatedData: IProcedure = { ...testProcedureData, description: 'Updated Description' };
      expect(library.set(id, updatedData)).toSucceed();
      expect(library.get(id)).toSucceedAndSatisfy((procedure) => {
        expect(procedure.description).toBe('Updated Description');
      });
    });

    test('delete removes procedure', () => {
      const id = 'test.delete-procedure' as ProcedureId;
      library.add(id, createTestProcedure()).orThrow();
      expect(library.delete(id)).toSucceed();
      expect(library.has(id)).toBe(false);
    });
  });
});

// ============================================================================
// createAsync Tests (with encryption support)
// ============================================================================

describe('ProceduresLibrary.createAsync', () => {
  const TEST_SECRET_NAME = 'test-secret';
  let testKey: Uint8Array;

  beforeAll(async () => {
    testKey = (await Crypto.nodeCryptoProvider.generateKey()).orThrow();
  });

  test('creates library with built-ins by default', async () => {
    const result = await ProceduresLibrary.createAsync();
    expect(result).toSucceedAndSatisfy((lib) => {
      expect(lib.collections.has('common' as SourceId)).toBe(true);
    });
  });

  test('creates library without built-ins when builtin: false', async () => {
    const result = await ProceduresLibrary.createAsync({ builtin: false });
    expect(result).toSucceedAndSatisfy((lib) => {
      expect(lib.collections.size).toBe(0);
    });
  });

  test('creates library with file sources', async () => {
    const files: FileTree.IInMemoryFile[] = [
      {
        path: '/data/procedures/external.json',
        contents: {
          items: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            'external-procedure': {
              baseId: 'external-procedure',
              name: 'External Procedure',
              steps: [
                {
                  order: 1,
                  task: {
                    task: {
                      baseId: 'external-procedure-step-1',
                      name: 'Do Something',
                      template: 'Do something'
                    },
                    params: {}
                  }
                }
              ]
            }
          }
        } as unknown as JsonObject
      }
    ];

    const tree = FileTree.inMemory(files).orThrow();
    const rootDir = tree.getItem('/').orThrow();
    const fileSource: IProcedureFileTreeSource = {
      directory: rootDir as FileTree.IFileTreeDirectoryItem,
      mutable: true
    };

    const result = await ProceduresLibrary.createAsync({
      builtin: false,
      fileSources: fileSource
    });

    expect(result).toSucceedAndSatisfy((lib) => {
      expect(lib.collections.has('external' as SourceId)).toBe(true);
      expect(lib.get('external.external-procedure' as ProcedureId)).toSucceed();
    });
  });

  test('decrypts encrypted file sources with encryption config', async () => {
    const secretProcedureData = {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      'secret-procedure': {
        baseId: 'secret-procedure',
        name: 'Secret Procedure',
        steps: [
          {
            order: 1,
            task: {
              task: { baseId: 'secret-procedure-step-1', name: 'Secret Step', template: 'Secret step' },
              params: {}
            }
          }
        ]
      }
    };

    const encryptedFile = (
      await Crypto.createEncryptedFile({
        content: secretProcedureData,
        secretName: TEST_SECRET_NAME,
        key: testKey,
        cryptoProvider: Crypto.nodeCryptoProvider
      })
    ).orThrow();

    const files: FileTree.IInMemoryFile[] = [
      {
        path: '/data/procedures/secret.json',
        contents: encryptedFile as unknown as JsonObject
      }
    ];

    const tree = FileTree.inMemory(files).orThrow();
    const rootDir = tree.getItem('/').orThrow();
    const fileSource: IProcedureFileTreeSource = {
      directory: rootDir as FileTree.IFileTreeDirectoryItem,
      mutable: false
    };

    const result = await ProceduresLibrary.createAsync({
      builtin: false,
      fileSources: fileSource,
      encryption: {
        secrets: [{ name: TEST_SECRET_NAME, key: testKey }],
        cryptoProvider: Crypto.nodeCryptoProvider
      }
    });

    expect(result).toSucceedAndSatisfy((lib) => {
      expect(lib.collections.has('secret' as SourceId)).toBe(true);
      expect(lib.get('secret.secret-procedure' as ProcedureId)).toSucceedAndSatisfy((procedure) => {
        expect(procedure.name).toBe('Secret Procedure');
      });
    });
  });

  test('captures encrypted files when no encryption config provided', async () => {
    const secretProcedureData = {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      'secret-procedure': {
        baseId: 'secret-procedure',
        name: 'Secret Procedure',
        steps: [
          {
            order: 1,
            task: {
              task: { baseId: 'secret-procedure-step-1', name: 'Secret Step', template: 'Secret step' },
              params: {}
            }
          }
        ]
      }
    };

    const encryptedFile = (
      await Crypto.createEncryptedFile({
        content: secretProcedureData,
        secretName: TEST_SECRET_NAME,
        key: testKey,
        cryptoProvider: Crypto.nodeCryptoProvider
      })
    ).orThrow();

    const files: FileTree.IInMemoryFile[] = [
      {
        path: '/data/procedures/secret.json',
        contents: encryptedFile as unknown as JsonObject
      }
    ];

    const tree = FileTree.inMemory(files).orThrow();
    const rootDir = tree.getItem('/').orThrow();
    const fileSource: IProcedureFileTreeSource = {
      directory: rootDir as FileTree.IFileTreeDirectoryItem,
      mutable: false
    };

    const result = await ProceduresLibrary.createAsync({
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
