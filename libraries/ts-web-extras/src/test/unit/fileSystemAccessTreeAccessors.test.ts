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
import { FileSystemAccessTreeAccessors } from '../../packlets/file-tree';
import { FileApiTreeAccessors } from '../../packlets/file-tree';
import { FileTree } from '@fgv/ts-json-base';
import {
  createMockDirectoryHandle,
  createMockFileHandle,
  MockFileSystemWritableFileStream
} from '../utils/fileSystemAccessMocks';

describe('FileSystemAccessTreeAccessors', () => {
  describe('fromDirectoryHandle', () => {
    test('creates accessors from directory handle with write permission', async () => {
      const dirHandle = createMockDirectoryHandle('/', {
        'test.txt': { content: 'test content', type: 'text/plain' },
        'config.json': { content: '{"name":"test"}', type: 'application/json' }
      });

      const result = await FileSystemAccessTreeAccessors.fromDirectoryHandle(dirHandle);
      expect(result).toSucceedAndSatisfy((accessors) => {
        expect(accessors).toBeInstanceOf(FileSystemAccessTreeAccessors);
        expect(accessors.getFileContents('/test.txt')).toSucceedWith('test content');
        expect(accessors.getFileContents('/config.json')).toSucceedWith('{"name":"test"}');
      });
    });

    test('creates accessors with nested directory structure', async () => {
      const dirHandle = createMockDirectoryHandle('/', {
        'src/index.js': { content: 'console.log("hello");', type: 'text/javascript' },
        'src/utils/helper.js': { content: 'export const help = () => {};', type: 'text/javascript' },
        'config/app.json': { content: '{"version":"1.0"}', type: 'application/json' }
      });

      const result = await FileSystemAccessTreeAccessors.fromDirectoryHandle(dirHandle);
      expect(result).toSucceed();

      const accessors = result.orThrow();
      expect(accessors.getFileContents('/src/index.js')).toSucceed();
      expect(accessors.getFileContents('/src/utils/helper.js')).toSucceed();
      expect(accessors.getFileContents('/config/app.json')).toSucceed();
    });

    test('fails when write permission required but not granted', async () => {
      const dirHandle = createMockDirectoryHandle(
        '/',
        { 'test.txt': { content: 'test', type: 'text/plain' } },
        { hasWritePermission: false }
      );

      const result = await FileSystemAccessTreeAccessors.fromDirectoryHandle(dirHandle, {
        requireWritePermission: true
      });
      expect(result).toFailWith(/write permission required/i);
    });

    test('succeeds with read-only when write permission not required', async () => {
      const dirHandle = createMockDirectoryHandle(
        '/',
        { 'test.txt': { content: 'test', type: 'text/plain' } },
        { hasWritePermission: false }
      );

      const result = await FileSystemAccessTreeAccessors.fromDirectoryHandle(dirHandle, {
        requireWritePermission: false
      });
      expect(result).toSucceedAndSatisfy((accessors) => {
        expect(accessors.getFileContents('/test.txt')).toSucceedWith('test');
      });
    });

    test('applies custom prefix to file paths', async () => {
      const dirHandle = createMockDirectoryHandle('/', {
        'test.txt': { content: 'test', type: 'text/plain' }
      });

      const result = await FileSystemAccessTreeAccessors.fromDirectoryHandle(dirHandle, {
        prefix: '/myapp'
      });
      expect(result).toSucceed();

      const accessors = result.orThrow();
      // With prefix, files are accessed with the prefix prepended
      expect(accessors.getFileContents('/myapp/test.txt')).toSucceed();
    });
  });

  describe('persistence operations', () => {
    describe('isDirty and getDirtyPaths', () => {
      test('returns false when no changes made', async () => {
        const dirHandle = createMockDirectoryHandle('/', {
          'test.txt': { content: 'original', type: 'text/plain' }
        });

        const accessors = (await FileSystemAccessTreeAccessors.fromDirectoryHandle(dirHandle)).orThrow();
        expect(accessors.isDirty()).toBe(false);
        expect(accessors.getDirtyPaths()).toEqual([]);
      });

      test('returns true after saving file contents', async () => {
        const dirHandle = createMockDirectoryHandle('/', {
          'test.txt': { content: 'original', type: 'text/plain' }
        });

        const accessors = (
          await FileSystemAccessTreeAccessors.fromDirectoryHandle(dirHandle, { mutable: true })
        ).orThrow();

        accessors.saveFileContents('/test.txt', 'modified').orThrow();

        expect(accessors.isDirty()).toBe(true);
        expect(accessors.getDirtyPaths()).toEqual(['/test.txt']);
      });

      test('tracks multiple dirty files', async () => {
        const dirHandle = createMockDirectoryHandle('/', {
          'file1.txt': { content: 'content1', type: 'text/plain' },
          'file2.txt': { content: 'content2', type: 'text/plain' }
        });

        const accessors = (
          await FileSystemAccessTreeAccessors.fromDirectoryHandle(dirHandle, { mutable: true })
        ).orThrow();

        accessors.saveFileContents('/file1.txt', 'modified1').orThrow();
        accessors.saveFileContents('/file2.txt', 'modified2').orThrow();

        expect(accessors.isDirty()).toBe(true);
        expect(accessors.getDirtyPaths()).toContain('/file1.txt');
        expect(accessors.getDirtyPaths()).toContain('/file2.txt');
      });
    });

    describe('syncToDisk', () => {
      test('syncs modified files to disk', async () => {
        const dirHandle = createMockDirectoryHandle('/', {
          'test.txt': { content: 'original', type: 'text/plain' }
        });

        const accessors = (
          await FileSystemAccessTreeAccessors.fromDirectoryHandle(dirHandle, { mutable: true })
        ).orThrow();

        accessors.saveFileContents('/test.txt', 'modified').orThrow();
        expect(accessors.isDirty()).toBe(true);

        const syncResult = await accessors.syncToDisk();
        expect(syncResult).toSucceed();
        expect(accessors.isDirty()).toBe(false);

        // Verify the file was actually written
        const fileHandle = await dirHandle.getFileHandle('test.txt');
        const file = await fileHandle.getFile();
        const content = await file.text();
        expect(content).toBe('modified');
      });

      test('syncs multiple files in one operation', async () => {
        const dirHandle = createMockDirectoryHandle('/', {
          'file1.txt': { content: 'content1', type: 'text/plain' },
          'file2.txt': { content: 'content2', type: 'text/plain' }
        });

        const accessors = (
          await FileSystemAccessTreeAccessors.fromDirectoryHandle(dirHandle, { mutable: true })
        ).orThrow();

        accessors.saveFileContents('/file1.txt', 'modified1').orThrow();
        accessors.saveFileContents('/file2.txt', 'modified2').orThrow();

        const syncResult = await accessors.syncToDisk();
        expect(syncResult).toSucceed();
        expect(accessors.isDirty()).toBe(false);
      });

      test('creates new files when syncing', async () => {
        const dirHandle = createMockDirectoryHandle('/', {
          'existing.txt': { content: 'existing', type: 'text/plain' }
        });

        const accessors = (
          await FileSystemAccessTreeAccessors.fromDirectoryHandle(dirHandle, { mutable: true })
        ).orThrow();

        // Add a new file to the in-memory tree
        accessors.saveFileContents('/newfile.txt', 'new content').orThrow();

        const syncResult = await accessors.syncToDisk();
        expect(syncResult).toSucceed();

        // Verify the new file was created
        const fileHandle = await dirHandle.getFileHandle('newfile.txt');
        expect(fileHandle).toBeDefined();
        const file = await fileHandle.getFile();
        const content = await file.text();
        expect(content).toBe('new content');
      });

      test('creates nested directories when syncing new files', async () => {
        const dirHandle = createMockDirectoryHandle('/', {
          'existing.txt': { content: 'existing', type: 'text/plain' }
        });

        const accessors = (
          await FileSystemAccessTreeAccessors.fromDirectoryHandle(dirHandle, { mutable: true })
        ).orThrow();

        accessors.saveFileContents('/src/utils/helper.js', 'export const help = () => {};').orThrow();

        const syncResult = await accessors.syncToDisk();
        expect(syncResult).toSucceed();

        // Verify nested directories were created
        const srcDir = await dirHandle.getDirectoryHandle('src');
        const utilsDir = await srcDir.getDirectoryHandle('utils');
        const fileHandle = await utilsDir.getFileHandle('helper.js');
        expect(fileHandle).toBeDefined();
      });

      test('fails when write permission not granted', async () => {
        const dirHandle = createMockDirectoryHandle(
          '/',
          { 'test.txt': { content: 'original', type: 'text/plain' } },
          { hasWritePermission: false }
        );

        const accessors = (
          await FileSystemAccessTreeAccessors.fromDirectoryHandle(dirHandle, {
            mutable: true,
            requireWritePermission: false
          })
        ).orThrow();

        accessors.saveFileContents('/test.txt', 'modified').orThrow();

        const syncResult = await accessors.syncToDisk();
        expect(syncResult).toFailWith(/write permission not granted/i);
      });

      test('clears dirty state after successful sync', async () => {
        const dirHandle = createMockDirectoryHandle('/', {
          'file1.txt': { content: 'content1', type: 'text/plain' },
          'file2.txt': { content: 'content2', type: 'text/plain' }
        });

        const accessors = (
          await FileSystemAccessTreeAccessors.fromDirectoryHandle(dirHandle, { mutable: true })
        ).orThrow();

        accessors.saveFileContents('/file1.txt', 'modified1').orThrow();
        accessors.saveFileContents('/file2.txt', 'modified2').orThrow();
        expect(accessors.isDirty()).toBe(true);

        const syncResult = await accessors.syncToDisk();
        expect(syncResult).toSucceed();
        expect(accessors.isDirty()).toBe(false);
        expect(accessors.getDirtyPaths()).toEqual([]);
      });
    });

    describe('autoSync mode', () => {
      test('automatically syncs changes when autoSync is enabled', async () => {
        const dirHandle = createMockDirectoryHandle('/', {
          'test.txt': { content: 'original', type: 'text/plain' }
        });

        const accessors = (
          await FileSystemAccessTreeAccessors.fromDirectoryHandle(dirHandle, {
            mutable: true,
            autoSync: true
          })
        ).orThrow();

        accessors.saveFileContents('/test.txt', 'modified').orThrow();

        // Give auto-sync a moment to complete (it's fire-and-forget)
        await new Promise((resolve) => setTimeout(resolve, 10));

        // Verify the file was written
        const fileHandle = await dirHandle.getFileHandle('test.txt');
        const file = await fileHandle.getFile();
        const content = await file.text();
        expect(content).toBe('modified');
      });

      test('does not auto-sync when autoSync is disabled', async () => {
        const dirHandle = createMockDirectoryHandle('/', {
          'test.txt': { content: 'original', type: 'text/plain' }
        });

        const accessors = (
          await FileSystemAccessTreeAccessors.fromDirectoryHandle(dirHandle, {
            mutable: true,
            autoSync: false
          })
        ).orThrow();

        accessors.saveFileContents('/test.txt', 'modified').orThrow();

        // Verify file is marked dirty but not synced
        expect(accessors.isDirty()).toBe(true);
        expect(accessors.getDirtyPaths()).toContain('/test.txt');

        // In-memory content should be modified
        expect(accessors.getFileContents('/test.txt')).toSucceedWith('modified');
      });
    });
  });

  describe('fileIsMutable', () => {
    test('returns persistent detail when write permission granted', async () => {
      const dirHandle = createMockDirectoryHandle('/', {
        'test.txt': { content: 'test', type: 'text/plain' }
      });

      const accessors = (
        await FileSystemAccessTreeAccessors.fromDirectoryHandle(dirHandle, { mutable: true })
      ).orThrow();

      const result = accessors.fileIsMutable('/test.txt');
      expect(result).toSucceedWithDetail(true, 'persistent');
    });

    test('returns transient detail when write permission not granted', async () => {
      const dirHandle = createMockDirectoryHandle(
        '/',
        { 'test.txt': { content: 'test', type: 'text/plain' } },
        { hasWritePermission: false }
      );

      const accessors = (
        await FileSystemAccessTreeAccessors.fromDirectoryHandle(dirHandle, {
          mutable: true,
          requireWritePermission: false
        })
      ).orThrow();

      const result = accessors.fileIsMutable('/test.txt');
      expect(result).toSucceedWithDetail(true, 'transient');
    });

    test('returns not-mutable when mutability disabled', async () => {
      const dirHandle = createMockDirectoryHandle('/', {
        'test.txt': { content: 'test', type: 'text/plain' }
      });

      const accessors = (
        await FileSystemAccessTreeAccessors.fromDirectoryHandle(dirHandle, { mutable: false })
      ).orThrow();

      const result = accessors.fileIsMutable('/test.txt');
      expect(result).toFailWithDetail(/mutability is disabled/i, 'not-mutable');
    });
  });

  describe('integration with FileApiTreeAccessors', () => {
    test('createPersistent creates FileTree with persistent accessors', async () => {
      const dirHandle = createMockDirectoryHandle('/', {
        'test.txt': { content: 'test content', type: 'text/plain' }
      });

      const result = await FileApiTreeAccessors.createPersistent(dirHandle, { mutable: true });
      expect(result).toSucceed();

      const tree = result.orThrow();
      expect(tree).toBeInstanceOf(FileTree.FileTree);
      expect(FileTree.isPersistentAccessors(tree.hal)).toBe(true);

      const file = tree.getFile('/test.txt').orThrow();
      expect(file.getIsMutable()).toSucceedWithDetail(true, 'persistent');
    });

    test('createPersistent with autoSync option', async () => {
      const dirHandle = createMockDirectoryHandle('/', {
        'test.txt': { content: 'original', type: 'text/plain' }
      });

      const result = await FileApiTreeAccessors.createPersistent(dirHandle, {
        mutable: true,
        autoSync: true
      });

      expect(result).toSucceedAndSatisfy((tree) => {
        expect(tree).toBeInstanceOf(FileTree.FileTree);
      });

      const tree = result.orThrow();
      const file = tree.getFile('/test.txt').orThrow();
      file.setRawContents('modified').orThrow();

      // Give auto-sync time to complete
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Verify file was written
      const fileHandle = await dirHandle.getFileHandle('test.txt');
      const diskFile = await fileHandle.getFile();
      const content = await diskFile.text();
      expect(content).toBe('modified');
    });

    test('createPersistent fails with appropriate error', async () => {
      const dirHandle = createMockDirectoryHandle(
        '/',
        { 'test.txt': { content: 'test', type: 'text/plain' } },
        { hasWritePermission: false }
      );

      const result = await FileApiTreeAccessors.createPersistent(dirHandle, {
        requireWritePermission: true
      });
      expect(result).toFailWith(/write permission required/i);
    });
  });

  describe('error handling', () => {
    test('handles permission query errors gracefully', async () => {
      const dirHandle = createMockDirectoryHandle(
        '/',
        { 'test.txt': { content: 'test', type: 'text/plain' } },
        { permissionError: true }
      );

      const result = await FileSystemAccessTreeAccessors.fromDirectoryHandle(dirHandle, {
        requireWritePermission: false
      });
      // Should succeed but without write permission due to error
      expect(result).toSucceed();
    });
  });
});
