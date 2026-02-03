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

import { BaseTaskId, Minutes, SourceId, TaskId } from '../../../packlets/common';
import { TasksLibrary, ITaskData, ITaskFileTreeSource } from '../../../packlets/entities';
import { CryptoUtils } from '@fgv/ts-extras';

describe('TasksLibrary', () => {
  // ============================================================================
  // Test Data
  // ============================================================================

  // ITaskData is the persisted format - requiredVariables is extracted from template at runtime
  const testTaskData: ITaskData = {
    baseId: 'test-task' as BaseTaskId,
    name: 'Test Task',
    template: 'Do {{action}}',
    defaultActiveTime: 5 as Minutes
  };

  const createTestTask = (): ITaskData => testTaskData;

  // ============================================================================
  // Creation Tests
  // ============================================================================

  describe('create', () => {
    test('creates empty library with builtin: false', () => {
      expect(TasksLibrary.create({ builtin: false })).toSucceedAndSatisfy((lib) => {
        expect(lib.size).toBe(0);
        expect(lib.collectionCount).toBe(0);
      });
    });

    test('creates library with built-in tasks', () => {
      expect(TasksLibrary.create()).toSucceedAndSatisfy((lib) => {
        // Should have the common collection with built-in tasks
        expect(lib.collectionCount).toBeGreaterThan(0);
        expect(lib.collections.has('common' as SourceId)).toBe(true);
        // Verify a few known tasks exist
        expect(lib.has('common.melt-chocolate' as TaskId)).toBe(true);
        expect(lib.has('common.heat-ingredient' as TaskId)).toBe(true);
        expect(lib.has('common.combine-and-emulsify' as TaskId)).toBe(true);
      });
    });

    test('creates library with additional collections', () => {
      const result = TasksLibrary.create({
        builtin: false,
        collections: [
          {
            id: 'test' as SourceId,
            isMutable: true,
            items: {
              testTask: createTestTask()
            }
          }
        ]
      });

      expect(result).toSucceedAndSatisfy((lib) => {
        expect(lib.size).toBe(1);
        expect(lib.collectionCount).toBe(1);
      });
    });

    test('creates library with additional collections (no built-ins)', () => {
      // Note: Since there are no built-in tasks yet, we use builtin: false
      // Once built-in tasks are added, update this test to verify combination
      const result = TasksLibrary.create({
        builtin: false,
        collections: [
          {
            id: 'test' as SourceId,
            isMutable: true,
            items: {
              testTask: createTestTask()
            }
          }
        ]
      });

      expect(result).toSucceedAndSatisfy((lib) => {
        expect(lib.validating.has('test.testTask' as TaskId)).toBe(true);
      });
    });
  });

  // ============================================================================
  // Lookup Tests
  // ============================================================================

  describe('get and has', () => {
    let library: TasksLibrary;

    beforeEach(() => {
      library = TasksLibrary.create({
        builtin: false,
        collections: [
          {
            id: 'common' as SourceId,
            isMutable: false,
            items: {
              // eslint-disable-next-line @typescript-eslint/naming-convention
              'melt-chocolate': {
                baseId: 'melt-chocolate' as BaseTaskId,
                name: 'Melt Chocolate',
                template: 'Melt {{ingredient}} to {{temp}}C'
              }
            }
          }
        ]
      }).orThrow();
    });

    test('gets existing task', () => {
      const id = 'common.melt-chocolate' as TaskId;
      expect(library.validating.get(id)).toSucceedAndSatisfy((task) => {
        expect(task.name).toBe('Melt Chocolate');
      });
    });

    test('fails for non-existent task', () => {
      const id = 'common.nonexistent' as TaskId;
      expect(library.get(id)).toFail();
    });

    test('has returns true for existing task', () => {
      expect(library.has('common.melt-chocolate' as TaskId)).toBe(true);
    });

    test('has returns false for non-existent task', () => {
      expect(library.has('common.nonexistent' as TaskId)).toBe(false);
    });
  });

  // ============================================================================
  // Iteration Tests
  // ============================================================================

  describe('iteration', () => {
    let library: TasksLibrary;

    beforeEach(() => {
      library = TasksLibrary.create({
        builtin: false,
        collections: [
          {
            id: 'common' as SourceId,
            isMutable: false,
            items: {
              /* eslint-disable @typescript-eslint/naming-convention */
              'task-1': createTestTask(),
              'task-2': {
                baseId: 'task-2' as BaseTaskId,
                name: 'Task 2',
                template: 'Second task'
              }
              /* eslint-enable @typescript-eslint/naming-convention */
            }
          }
        ]
      }).orThrow();
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
    let library: TasksLibrary;

    beforeEach(() => {
      library = TasksLibrary.create({
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

    test('add succeeds for new task', () => {
      const id = 'test.new-task' as TaskId;
      expect(library.add(id, createTestTask())).toSucceed();
      expect(library.has(id)).toBe(true);
    });

    test('add fails for duplicate task', () => {
      const id = 'test.new-task' as TaskId;
      library.add(id, createTestTask()).orThrow();
      expect(library.add(id, createTestTask())).toFail();
    });

    test('set adds or updates task', () => {
      const id = 'test.set-task' as TaskId;
      expect(library.set(id, createTestTask())).toSucceed();
      expect(library.has(id)).toBe(true);

      const updatedTask: ITaskData = {
        ...testTaskData,
        name: 'Updated Task'
      };
      expect(library.set(id, updatedTask)).toSucceed();
      expect(library.get(id)).toSucceedAndSatisfy((task) => {
        expect(task.name).toBe('Updated Task');
      });
    });

    test('delete removes task', () => {
      const id = 'test.delete-task' as TaskId;
      library.add(id, createTestTask()).orThrow();
      expect(library.delete(id)).toSucceed();
      expect(library.has(id)).toBe(false);
    });
  });
});

// ============================================================================
// createAsync Tests (with encryption support)
// ============================================================================

describe('TasksLibrary.createAsync', () => {
  const TEST_SECRET_NAME = 'test-secret';
  let testKey: Uint8Array;

  beforeAll(async () => {
    testKey = (await CryptoUtils.nodeCryptoProvider.generateKey()).orThrow();
  });

  test('creates library with built-in tasks by default', async () => {
    const result = await TasksLibrary.createAsync();
    expect(result).toSucceedAndSatisfy((lib) => {
      // Should have the common collection with built-in tasks
      expect(lib.collectionCount).toBeGreaterThan(0);
      expect(lib.collections.has('common' as SourceId)).toBe(true);
      // Verify a few known tasks exist
      expect(lib.has('common.melt-chocolate' as TaskId)).toBe(true);
      expect(lib.has('common.heat-ingredient' as TaskId)).toBe(true);
    });
  });

  test('creates library without built-ins when builtin: false', async () => {
    const result = await TasksLibrary.createAsync({ builtin: false });
    expect(result).toSucceedAndSatisfy((lib) => {
      expect(lib.collections.size).toBe(0);
    });
  });

  test('creates library with file sources', async () => {
    const files = [
      {
        path: '/data/tasks/external.json',
        contents: {
          items: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            'external-task': {
              baseId: 'external-task',
              name: 'External Task',
              template: 'Do external {{action}}',
              requiredVariables: ['action']
            }
          }
        }
      }
    ];

    const tree = FileTree.inMemory(files).orThrow();
    const rootDir = tree.getItem('/').orThrow() as FileTree.IFileTreeDirectoryItem;

    const fileSource: ITaskFileTreeSource = {
      directory: rootDir,
      mutable: true
    };

    const result = await TasksLibrary.createAsync({
      builtin: false,
      fileSources: fileSource
    });

    expect(result).toSucceedAndSatisfy((lib) => {
      expect(lib.collections.has('external' as SourceId)).toBe(true);
      expect(lib.get('external.external-task' as TaskId)).toSucceed();
    });
  });

  test('decrypts encrypted file sources with encryption config', async () => {
    const secretTaskData = {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      'secret-task': {
        baseId: 'secret-task',
        name: 'Secret Task',
        template: 'Secret {{action}}',
        requiredVariables: ['action']
      }
    };

    const encryptedFile = (
      await CryptoUtils.createEncryptedFile({
        content: secretTaskData,
        secretName: TEST_SECRET_NAME,
        key: testKey,
        cryptoProvider: CryptoUtils.nodeCryptoProvider
      })
    ).orThrow();

    const files = [
      {
        path: '/data/tasks/secret.json',
        contents: encryptedFile
      }
    ];

    const tree = FileTree.inMemory(files).orThrow();
    const rootDir = tree.getItem('/').orThrow() as FileTree.IFileTreeDirectoryItem;

    const fileSource: ITaskFileTreeSource = {
      directory: rootDir,
      mutable: false
    };

    const result = await TasksLibrary.createAsync({
      builtin: false,
      fileSources: fileSource,
      encryption: {
        secrets: [{ name: TEST_SECRET_NAME, key: testKey }],
        cryptoProvider: CryptoUtils.nodeCryptoProvider
      }
    });

    expect(result).toSucceedAndSatisfy((lib) => {
      expect(lib.collections.has('secret' as SourceId)).toBe(true);
      expect(lib.get('secret.secret-task' as TaskId)).toSucceedAndSatisfy((task) => {
        expect(task.name).toBe('Secret Task');
      });
    });
  });

  test('captures encrypted files when no encryption config provided', async () => {
    const secretTaskData = {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      'secret-task': {
        baseId: 'secret-task',
        name: 'Secret Task',
        template: 'Secret action',
        requiredVariables: []
      }
    };

    const encryptedFile = (
      await CryptoUtils.createEncryptedFile({
        content: secretTaskData,
        secretName: TEST_SECRET_NAME,
        key: testKey,
        cryptoProvider: CryptoUtils.nodeCryptoProvider
      })
    ).orThrow();

    const files = [
      {
        path: '/data/tasks/secret.json',
        contents: encryptedFile
      }
    ];

    const tree = FileTree.inMemory(files).orThrow();
    const rootDir = tree.getItem('/').orThrow() as FileTree.IFileTreeDirectoryItem;

    const fileSource: ITaskFileTreeSource = {
      directory: rootDir,
      mutable: false
    };

    const result = await TasksLibrary.createAsync({
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
