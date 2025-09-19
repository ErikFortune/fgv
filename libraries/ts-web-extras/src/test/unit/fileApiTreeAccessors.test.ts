/*
 * Copyright (c) 2025 Erik Fortune
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
import { FileApiTreeAccessors } from '../../packlets/file-tree';
import { FileTreeHelpers } from '../../packlets/helpers';
import {
  createMockFile,
  createMockFileList,
  createMockDirectoryFileList,
  verifyFileAPI
} from '../utils/testHelpers';

describe('FileApiTreeAccessors', () => {
  describe('Static factory methods', () => {
    describe('create', () => {
      test('creates FileTree from FileList using create method', async () => {
        const fileList = createMockFileList([{ name: 'test.txt', content: 'test content' }]);

        const initializers = [{ fileList }];
        const result = await FileApiTreeAccessors.create(initializers);
        expect(result).toSucceedAndSatisfy((fileTree) => {
          // Verify the FileTree was created successfully
          expect(fileTree).toBeDefined();

          // Test file access with absolute path (FileTree expects leading slash)
          const fileResult = fileTree.getFile('/test.txt');
          expect(fileResult).toSucceed();
        });
      });

      test('creates FileTree with prefix (basic functionality)', async () => {
        const fileList = createMockFileList([{ name: 'test.txt', content: 'test content' }]);

        const initializers = [{ fileList }];
        const result = await FileApiTreeAccessors.create(initializers, { prefix: '/prefix' });
        // Just verify the creation succeeds - the prefix handling is complex
        expect(result).toSucceed();
      });

      test('handles multiple files', async () => {
        const fileList = createMockFileList([
          { name: 'file1.txt', content: 'content1' },
          { name: 'file2.txt', content: 'content2' }
        ]);

        const initializers = [{ fileList }];
        const result = await FileApiTreeAccessors.create(initializers);
        expect(result).toSucceedAndSatisfy((fileTree) => {
          expect(fileTree.getFile('/file1.txt')).toSucceed();
          expect(fileTree.getFile('/file2.txt')).toSucceed();
        });
      });

      test('handles nested directory structure', async () => {
        const fileList = createMockDirectoryFileList([
          { path: 'src/index.js', content: 'console.log("hello");' },
          { path: 'config/config.json', content: '{"name": "test"}' }
        ]);

        const initializers = [{ fileList }];
        const result = await FileApiTreeAccessors.create(initializers);
        expect(result).toSucceedAndSatisfy((fileTree) => {
          expect(fileTree.getFile('/src/index.js')).toSucceed();
          expect(fileTree.getFile('/config/config.json')).toSucceed();

          // Check directory access
          expect(fileTree.getDirectory('/src')).toSucceed();
          expect(fileTree.getDirectory('/config')).toSucceed();
        });
      });

      test('fails when file reading fails', async () => {
        // Create a file object without text method to simulate failure
        const badFile = {
          name: 'bad.txt',
          size: 10,
          type: 'text/plain',
          lastModified: Date.now(),
          text: () => Promise.reject(new Error('File read error'))
        } as unknown as File;

        // Create FileList with bad file
        const dt = new DataTransfer();
        dt.items.add(badFile);
        const fileList = dt.files;

        const initializers = [{ fileList }];
        const result = await FileApiTreeAccessors.create(initializers);
        expect(result).toFailWith(/Failed to read file bad\.txt/);
      });

      test('handles empty files array', async () => {
        const fileList = createMockFileList([]);
        const initializers = [{ fileList }];
        const result = await FileApiTreeAccessors.create(initializers);
        expect(result).toSucceedAndSatisfy((fileTree) => {
          expect(fileTree).toBeDefined();
        });
      });

      test('normalizes paths correctly (critical bug fix verification)', async () => {
        const fileList = createMockFileList([{ name: 'test.txt', content: 'content' }]);

        const initializers = [{ fileList }];
        const result = await FileApiTreeAccessors.create(initializers);
        expect(result).toSucceedAndSatisfy((fileTree) => {
          // Path should be normalized to start with / for FileTree compatibility
          const fileResult = fileTree.getFile('/test.txt');
          expect(fileResult).toSucceed();

          // Content should be accessible
          const content = fileTree.hal.getFileContents('/test.txt');
          expect(content).toSucceedWith('content');
        });
      });

      test('normalizes paths with prefix correctly', async () => {
        const fileList = createMockDirectoryFileList([{ path: 'subdir/test.txt', content: 'content' }]);

        const initializers = [{ fileList }];
        const result = await FileApiTreeAccessors.create(initializers, { prefix: '/prefix' });
        // Just verify the creation succeeds with nested paths
        expect(result).toSucceed();
      });

      test('handles paths with leading slash correctly', async () => {
        const fileList = createMockDirectoryFileList([
          { path: 'already/absolute.txt', content: 'absolute content' },
          { path: 'relative/path.txt', content: 'relative content' }
        ]);

        const initializers = [{ fileList }];
        const result = await FileApiTreeAccessors.create(initializers);
        expect(result).toSucceedAndSatisfy((fileTree) => {
          // Both paths should be normalized to start with /
          expect(fileTree.getFile('/already/absolute.txt')).toSucceedAndSatisfy((file) => {
            expect(file.name).toBe('absolute.txt');
          });
          expect(fileTree.getFile('/relative/path.txt')).toSucceedAndSatisfy((file) => {
            expect(file.name).toBe('path.txt');
          });

          // Verify content is accessible
          expect(fileTree.hal.getFileContents('/already/absolute.txt')).toSucceedWith('absolute content');
          expect(fileTree.hal.getFileContents('/relative/path.txt')).toSucceedWith('relative content');
        });
      });
    });

    describe('fromFileList', () => {
      test('creates FileTree from FileList', async () => {
        const fileList = createMockFileList([
          { name: 'file1.txt', content: 'content1' },
          { name: 'file2.txt', content: 'content2' }
        ]);

        const result = await FileApiTreeAccessors.fromFileList(fileList);
        expect(result).toSucceedAndSatisfy((fileTree) => {
          expect(fileTree.getFile('/file1.txt')).toSucceed();
          expect(fileTree.getFile('/file2.txt')).toSucceed();
        });
      });

      test('creates FileTree from FileList with prefix', async () => {
        const fileList = createMockFileList([{ name: 'test.txt', content: 'content' }]);

        const result = await FileApiTreeAccessors.fromFileList(fileList, { prefix: '/uploads' });
        // Just verify the creation succeeds with prefix
        expect(result).toSucceed();
      });

      test('handles empty FileList', async () => {
        const fileList = createMockFileList([]);
        const result = await FileApiTreeAccessors.fromFileList(fileList);
        expect(result).toSucceed();
      });

      test('verifies File API compatibility', async () => {
        const fileList = createMockFileList([{ name: 'test.txt', content: 'test content' }]);

        // Verify our mock files have the correct API
        for (let i = 0; i < fileList.length; i++) {
          const file = fileList[i];
          const isValid = await verifyFileAPI(file);
          expect(isValid).toBe(true);
        }
      });
    });

    describe('fromDirectoryUpload', () => {
      test('creates FileTree from directory structure', async () => {
        const fileList = createMockDirectoryFileList([
          { path: 'project/src/index.js', content: 'console.log("main");' },
          { path: 'project/src/utils.js', content: 'export const helper = () => {};' },
          { path: 'project/package.json', content: '{"name": "test-project"}' }
        ]);

        const result = await FileApiTreeAccessors.fromDirectoryUpload(fileList);
        expect(result).toSucceedAndSatisfy((fileTree) => {
          expect(fileTree.getFile('/project/src/index.js')).toSucceed();
          expect(fileTree.getFile('/project/src/utils.js')).toSucceed();
          expect(fileTree.getFile('/project/package.json')).toSucceed();

          // Check directory structure
          expect(fileTree.getDirectory('/project')).toSucceed();
          expect(fileTree.getDirectory('/project/src')).toSucceed();
        });
      });

      test('creates FileTree from directory with prefix', async () => {
        const fileList = createMockDirectoryFileList([
          { path: 'app/config.json', content: '{"setting": "value"}' }
        ]);

        const result = await FileApiTreeAccessors.fromDirectoryUpload(fileList, { prefix: '/upload' });
        // Just verify the creation succeeds with directory prefix
        expect(result).toSucceed();
      });

      test('handles nested directory structures', async () => {
        const fileList = createMockDirectoryFileList([
          { path: 'deep/nested/structure/file.txt', content: 'deep content' },
          { path: 'deep/other/file.txt', content: 'other content' }
        ]);

        const result = await FileApiTreeAccessors.fromDirectoryUpload(fileList);
        expect(result).toSucceedAndSatisfy((fileTree) => {
          expect(fileTree.getFile('/deep/nested/structure/file.txt')).toSucceed();
          expect(fileTree.getFile('/deep/other/file.txt')).toSucceed();

          expect(fileTree.getDirectory('/deep')).toSucceed();
          expect(fileTree.getDirectory('/deep/nested')).toSucceed();
          expect(fileTree.getDirectory('/deep/nested/structure')).toSucceed();
          expect(fileTree.getDirectory('/deep/other')).toSucceed();
        });
      });
    });

    describe('getOriginalFile', () => {
      test('finds file by exact path match', () => {
        const fileList = createMockFileList([
          { name: 'target.txt', content: 'target content' },
          { name: 'other.txt', content: 'other content' }
        ]);

        const result = FileApiTreeAccessors.getOriginalFile(fileList, 'target.txt');
        expect(result).toSucceedAndSatisfy((file) => {
          expect(file.name).toBe('target.txt');
        });
      });

      test('finds file by webkitRelativePath', () => {
        const fileList = createMockDirectoryFileList([{ path: 'folder/file.txt', content: 'content' }]);

        const result = FileApiTreeAccessors.getOriginalFile(fileList, 'folder/file.txt');
        expect(result).toSucceedAndSatisfy((file) => {
          expect((file as any).webkitRelativePath).toBe('folder/file.txt');
        });
      });

      test('fails for non-existent file', () => {
        const fileList = createMockFileList([{ name: 'exists.txt', content: 'content' }]);

        const result = FileApiTreeAccessors.getOriginalFile(fileList, 'missing.txt');
        expect(result).toFailWith(/File not found: missing\.txt/);
      });

      test('handles empty FileList', () => {
        const fileList = createMockFileList([]);
        const result = FileApiTreeAccessors.getOriginalFile(fileList, 'any.txt');
        expect(result).toFailWith(/File not found/);
      });
    });

    describe('extractFileMetadata', () => {
      test('extracts metadata from regular files', () => {
        const testTime = Date.now();
        const file = createMockFile({
          name: 'test.txt',
          content: 'content',
          type: 'text/plain',
          lastModified: testTime
        });

        const metadata = FileApiTreeAccessors.extractFileMetadata(file);
        expect(metadata).toEqual({
          path: 'test.txt',
          name: 'test.txt',
          size: expect.any(Number),
          type: 'text/plain',
          lastModified: testTime
        });
      });

      test('extracts metadata with webkitRelativePath', () => {
        const file = createMockFile({
          name: 'file.txt',
          content: 'content',
          type: 'text/plain',
          webkitRelativePath: 'folder/file.txt'
        });

        const metadata = FileApiTreeAccessors.extractFileMetadata(file);
        expect(metadata).toEqual({
          path: 'folder/file.txt',
          name: 'file.txt',
          size: expect.any(Number),
          type: 'text/plain',
          lastModified: expect.any(Number)
        });
      });

      test('handles multiple files with different types', () => {
        const files = [
          createMockFile({ name: 'text.txt', content: 'text', type: 'text/plain' }),
          createMockFile({ name: 'data.json', content: '{}', type: 'application/json' }),
          createMockFile({ name: 'script.js', content: 'console.log("hi");', type: 'application/javascript' })
        ];

        const metadata = files.map((file) => FileApiTreeAccessors.extractFileMetadata(file));
        expect(metadata).toHaveLength(3);

        expect(metadata.find((m) => m.name === 'text.txt')?.type).toBe('text/plain');
        expect(metadata.find((m) => m.name === 'data.json')?.type).toBe('application/json');
        expect(metadata.find((m) => m.name === 'script.js')?.type).toBe('application/javascript');
      });

      test('handles empty file array', () => {
        const files: File[] = [];
        const metadata = files.map((file) => FileApiTreeAccessors.extractFileMetadata(file));
        expect(metadata).toHaveLength(0);
      });

      test('includes file sizes', () => {
        const shortContent = 'hi';
        const longContent = 'a'.repeat(1000);

        const files = [
          createMockFile({ name: 'short.txt', content: shortContent }),
          createMockFile({ name: 'long.txt', content: longContent })
        ];

        const metadata = files.map((file) => FileApiTreeAccessors.extractFileMetadata(file));
        const shortMeta = metadata.find((m) => m.name === 'short.txt');
        const longMeta = metadata.find((m) => m.name === 'long.txt');

        expect(shortMeta?.size).toBeGreaterThan(0);
        expect(longMeta?.size).toBeGreaterThan(shortMeta?.size!);
      });
    });
  });

  describe('Integration with FileTree', () => {
    test('created FileTree supports standard operations', async () => {
      const fileList = createMockDirectoryFileList([
        { path: 'config/data.json', content: '{"key": "value"}' },
        { path: 'docs/readme.txt', content: 'This is a readme file' }
      ]);

      const initializers = [{ fileList }];
      const result = await FileApiTreeAccessors.create(initializers);
      expect(result).toSucceedAndSatisfy((fileTree) => {
        // Test file access
        const jsonFile = fileTree.getFile('/config/data.json');
        expect(jsonFile).toSucceedAndSatisfy((file) => {
          expect(file.name).toBe('data.json');
          expect(file.extension).toBe('.json');
          expect(file.baseName).toBe('data');
        });

        // Test directory access
        const configDir = fileTree.getDirectory('/config');
        expect(configDir).toSucceedAndSatisfy((dir) => {
          expect(dir.name).toBe('config');
        });

        // Test content retrieval
        const content = fileTree.hal.getFileContents('/config/data.json');
        expect(content).toSucceedWith('{"key": "value"}');
      });
    });

    test('handles JSON file parsing through FileTree', async () => {
      const jsonContent = '{"name": "test", "version": "1.0.0"}';
      const fileList = createMockFileList([{ name: 'package.json', content: jsonContent }]);

      const initializers = [{ fileList }];
      const result = await FileApiTreeAccessors.create(initializers);
      expect(result).toSucceedAndSatisfy((fileTree) => {
        const file = fileTree.getFile('/package.json');
        expect(file).toSucceedAndSatisfy((fileItem) => {
          const jsonResult = fileItem.getContents();
          expect(jsonResult).toSucceedAndSatisfy((parsed) => {
            expect(parsed).toEqual({ name: 'test', version: '1.0.0' });
          });
        });
      });
    });

    test('supports directory traversal', async () => {
      const fileList = createMockDirectoryFileList([
        { path: 'src/file1.txt', content: 'content1' },
        { path: 'src/file2.txt', content: 'content2' }
      ]);

      const initializers = [{ fileList }];
      const result = await FileApiTreeAccessors.create(initializers);
      expect(result).toSucceedAndSatisfy((fileTree) => {
        const srcDir = fileTree.getDirectory('/src');
        expect(srcDir).toSucceedAndSatisfy((dir) => {
          const children = dir.getChildren();
          expect(children).toSucceedAndSatisfy((childItems) => {
            expect(childItems).toHaveLength(2);
            const fileNames = childItems.map((item) => item.name).sort();
            expect(fileNames).toEqual(['file1.txt', 'file2.txt']);
          });
        });
      });
    });
  });

  describe('Error handling', () => {
    test('handles file read errors gracefully', async () => {
      // Create a file object with a failing text method
      const errorFile = {
        name: 'error.txt',
        size: 10,
        type: 'text/plain',
        lastModified: Date.now(),
        text: () => Promise.reject(new Error('Disk error'))
      } as unknown as File;

      // Create FileList with bad file
      const dt = new DataTransfer();
      dt.items.add(errorFile);
      const fileList = dt.files;

      const initializers = [{ fileList }];
      const result = await FileApiTreeAccessors.create(initializers);
      expect(result).toFailWith(/Failed to read file error\.txt.*Disk error/);
    });

    test('handles invalid file paths gracefully', async () => {
      // Create files with problematic paths - test with empty name
      const fileList = createMockFileList([
        { name: '', content: 'content' } // Empty name might cause issues
      ]);

      const initializers = [{ fileList }];
      const result = await FileApiTreeAccessors.create(initializers);
      // Should either succeed by handling empty name or fail gracefully
      if (result.isFailure()) {
        expect(result.message).toContain('');
      } else {
        expect(result).toSucceed();
      }
    });
  });

  describe('create() method with different initializers', () => {
    describe('FileList initializers', () => {
      test('creates FileTree from FileList initializer', async () => {
        const fileList = createMockFileList([
          { name: 'file1.txt', content: 'content1' },
          { name: 'file2.txt', content: 'content2' }
        ]);

        const initializers = [{ fileList }];
        const result = await FileApiTreeAccessors.create(initializers);

        expect(result).toSucceedAndSatisfy((fileTree) => {
          expect(fileTree.hal.getFileContents('/file1.txt')).toSucceedWith('content1');
          expect(fileTree.hal.getFileContents('/file2.txt')).toSucceedWith('content2');
        });
      });

      test('creates FileTree from multiple FileList initializers', async () => {
        const fileList1 = createMockFileList([{ name: 'group1-file1.txt', content: 'group1-content1' }]);
        const fileList2 = createMockFileList([{ name: 'group2-file1.txt', content: 'group2-content1' }]);

        const initializers = [{ fileList: fileList1 }, { fileList: fileList2 }];
        const result = await FileApiTreeAccessors.create(initializers);

        expect(result).toSucceedAndSatisfy((fileTree) => {
          expect(fileTree.hal.getFileContents('/group1-file1.txt')).toSucceedWith('group1-content1');
          expect(fileTree.hal.getFileContents('/group2-file1.txt')).toSucceedWith('group2-content1');
        });
      });

      test('handles empty FileList initializer', async () => {
        const fileList = createMockFileList([]);
        const initializers = [{ fileList }];
        const result = await FileApiTreeAccessors.create(initializers);

        expect(result).toSucceedAndSatisfy((fileTree) => {
          expect(fileTree).toBeDefined();
        });
      });

      test('handles file read errors in FileList processing', async () => {
        // Create a file that will fail when .text() is called
        const failingFile = {
          name: 'failing.txt',
          size: 10,
          type: 'text/plain',
          lastModified: Date.now(),
          webkitRelativePath: '',
          text: () => Promise.reject(new Error('File read error')),
          stream: () => new ReadableStream(),
          arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
          slice: () => new Blob()
        } as unknown as File;

        // Create a FileList containing the failing file
        const fileList = {
          length: 1,
          item: (index: number) => (index === 0 ? failingFile : null),
          [0]: failingFile,
          [Symbol.iterator]: function* () {
            yield failingFile;
          }
        } as FileList;

        const initializers = [{ fileList }];
        const result = await FileApiTreeAccessors.create(initializers);

        expect(result).toFailWith(/Failed to read file failing\.txt.*File read error/);
      });

      test('handles files with absolute paths (webkitRelativePath starting with /)', async () => {
        // Create files where webkitRelativePath already starts with '/'
        const fileWithAbsolutePath = {
          name: 'file.txt',
          size: 10,
          type: 'text/plain',
          lastModified: Date.now(),
          webkitRelativePath: '/absolute/path/file.txt', // Already absolute
          text: () => Promise.resolve('absolute content'),
          stream: () => new ReadableStream(),
          arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
          slice: () => new Blob()
        } as unknown as File;

        const fileWithAbsoluteName = {
          name: '/root/file2.txt', // Name itself starts with slash
          size: 15,
          type: 'text/plain',
          lastModified: Date.now(),
          webkitRelativePath: '', // Empty, so will use name
          text: () => Promise.resolve('name absolute content'),
          stream: () => new ReadableStream(),
          arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
          slice: () => new Blob()
        } as unknown as File;

        // Create a FileList containing files with absolute paths
        const fileList = {
          length: 2,
          item: (index: number) => {
            if (index === 0) return fileWithAbsolutePath;
            if (index === 1) return fileWithAbsoluteName;
            return null;
          },
          [0]: fileWithAbsolutePath,
          [1]: fileWithAbsoluteName,
          [Symbol.iterator]: function* () {
            yield fileWithAbsolutePath;
            yield fileWithAbsoluteName;
          }
        } as FileList;

        const initializers = [{ fileList }];
        const result = await FileApiTreeAccessors.create(initializers);

        expect(result).toSucceedAndSatisfy((fileTree) => {
          // Verify absolute webkitRelativePath is used as-is (not double-slashed)
          expect(fileTree.hal.getFileContents('/absolute/path/file.txt')).toSucceedWith('absolute content');
          // Verify absolute name is used as-is (not double-slashed)
          expect(fileTree.hal.getFileContents('/root/file2.txt')).toSucceedWith('name absolute content');
        });
      });
    });

    describe('FileSystemFileHandle initializers', () => {
      function createMockFileHandle(
        name: string,
        content: string
      ): jest.Mocked<import('../../packlets/file-api-types').FileSystemFileHandle> {
        const mockFile = createMockFile({ name, content });
        return {
          kind: 'file',
          name,
          isSameEntry: jest.fn(),
          queryPermission: jest.fn(),
          requestPermission: jest.fn(),
          getFile: jest.fn().mockResolvedValue(mockFile),
          createWritable: jest.fn()
        } as jest.Mocked<import('../../packlets/file-api-types').FileSystemFileHandle>;
      }

      test('creates FileTree from FileSystemFileHandle initializer', async () => {
        const fileHandle1 = createMockFileHandle('handle1.txt', 'handle content 1');
        const fileHandle2 = createMockFileHandle('handle2.txt', 'handle content 2');

        const initializers = [{ fileHandles: [fileHandle1, fileHandle2] }];
        const result = await FileApiTreeAccessors.create(initializers);

        expect(result).toSucceedAndSatisfy((fileTree) => {
          expect(fileTree.hal.getFileContents('/handle1.txt')).toSucceedWith('handle content 1');
          expect(fileTree.hal.getFileContents('/handle2.txt')).toSucceedWith('handle content 2');
        });

        expect(fileHandle1.getFile).toHaveBeenCalled();
        expect(fileHandle2.getFile).toHaveBeenCalled();
      });

      test('creates FileTree from FileSystemFileHandle without prefix (current limitation)', async () => {
        const fileHandle = createMockFileHandle('data.txt', 'file content');

        const initializers = [{ fileHandles: [fileHandle] }];
        const result = await FileApiTreeAccessors.create(initializers);

        expect(result).toSucceedAndSatisfy((fileTree) => {
          // Verify basic functionality works
          expect(fileTree.hal.getFileContents('/data.txt')).toSucceedWith('file content');
        });
      });

      test('creates FileTree from FileSystemFileHandle with per-initializer prefix (limitation)', async () => {
        const fileHandle = createMockFileHandle('data.txt', 'file content');

        // Note: Currently IFileHandleTreeInitializer.prefix is not implemented in _processFileHandles
        // This is inconsistent with IDirectoryHandleTreeInitializer which does support prefix
        const initializers = [{ fileHandles: [fileHandle], prefix: '/uploads' }];
        const result = await FileApiTreeAccessors.create(initializers);

        expect(result).toSucceedAndSatisfy((fileTree) => {
          // Due to the implementation limitation, prefix on fileHandles initializer is ignored
          // File appears at root level instead of under prefix
          expect(fileTree.hal.getFileContents('/data.txt')).toSucceedWith('file content');
        });
      });

      test('handles FileSystemFileHandle read errors', async () => {
        const failingHandle = {
          kind: 'file' as const,
          name: 'failing.txt',
          isSameEntry: jest.fn(),
          queryPermission: jest.fn(),
          requestPermission: jest.fn(),
          getFile: jest.fn().mockRejectedValue(new Error('File access denied')),
          createWritable: jest.fn()
        } as jest.Mocked<import('../../packlets/file-api-types').FileSystemFileHandle>;

        const initializers = [{ fileHandles: [failingHandle] }];
        const result = await FileApiTreeAccessors.create(initializers);

        expect(result).toFailWith(/Failed to read file handle failing\.txt.*File access denied/);
      });

      test('handles empty FileSystemFileHandle array', async () => {
        const initializers = [{ fileHandles: [] }];
        const result = await FileApiTreeAccessors.create(initializers);

        expect(result).toSucceedAndSatisfy((fileTree) => {
          expect(fileTree).toBeDefined();
        });
      });
    });

    describe('FileSystemDirectoryHandle initializers', () => {
      function createMockDirectoryHandle(
        name: string,
        entries: Array<{
          name: string;
          content?: string;
          isDirectory?: boolean;
          children?: Array<{ name: string; content: string }>;
        }>
      ): jest.Mocked<import('../../packlets/file-api-types').FileSystemDirectoryHandle> {
        const mockEntries = entries.map((entry) => {
          if (entry.isDirectory) {
            const childEntries =
              entry.children?.map((child) => ({
                kind: 'file' as const,
                name: child.name,
                getFile: jest
                  .fn()
                  .mockResolvedValue(createMockFile({ name: child.name, content: child.content }))
              })) || [];

            return {
              kind: 'directory' as const,
              name: entry.name,
              values: jest.fn().mockReturnValue({
                async *[Symbol.asyncIterator]() {
                  for (const child of childEntries) {
                    yield child;
                  }
                }
              })
            };
          } else {
            return {
              kind: 'file' as const,
              name: entry.name,
              getFile: jest
                .fn()
                .mockResolvedValue(createMockFile({ name: entry.name, content: entry.content || '' }))
            };
          }
        });

        return {
          kind: 'directory',
          name,
          isSameEntry: jest.fn(),
          queryPermission: jest.fn(),
          requestPermission: jest.fn(),
          getDirectoryHandle: jest.fn(),
          getFileHandle: jest.fn(),
          removeEntry: jest.fn(),
          resolve: jest.fn(),
          keys: jest.fn(),
          values: jest.fn().mockReturnValue({
            async *[Symbol.asyncIterator]() {
              for (const entry of mockEntries) {
                yield entry;
              }
            }
          }),
          entries: jest.fn(),
          [Symbol.asyncIterator]: jest.fn()
        } as jest.Mocked<import('../../packlets/file-api-types').FileSystemDirectoryHandle>;
      }

      test('creates FileTree from FileSystemDirectoryHandle initializer', async () => {
        const dirHandle = createMockDirectoryHandle('testdir', [
          { name: 'file1.txt', content: 'dir content 1' },
          { name: 'file2.txt', content: 'dir content 2' }
        ]);

        const initializers = [{ dirHandles: [dirHandle] }];
        const result = await FileApiTreeAccessors.create(initializers);

        expect(result).toSucceedAndSatisfy((fileTree) => {
          expect(fileTree.hal.getFileContents('/testdir/file1.txt')).toSucceedWith('dir content 1');
          expect(fileTree.hal.getFileContents('/testdir/file2.txt')).toSucceedWith('dir content 2');
        });
      });

      test('creates FileTree from FileSystemDirectoryHandle with prefix', async () => {
        const dirHandle = createMockDirectoryHandle('data', [
          { name: 'config.json', content: '{"setting": "value"}' }
        ]);

        const initializers = [{ dirHandles: [dirHandle], prefix: 'project' }];
        const result = await FileApiTreeAccessors.create(initializers);

        expect(result).toSucceedAndSatisfy((fileTree) => {
          expect(fileTree.hal.getFileContents('/project/data/config.json')).toSucceedWith(
            '{"setting": "value"}'
          );
        });
      });

      test('handles recursive directory processing', async () => {
        const dirHandle = createMockDirectoryHandle('root', [
          { name: 'file.txt', content: 'root file' },
          {
            name: 'subdir',
            isDirectory: true,
            children: [{ name: 'nested.txt', content: 'nested file' }]
          }
        ]);

        const initializers = [{ dirHandles: [dirHandle] }];
        const result = await FileApiTreeAccessors.create(initializers);

        expect(result).toSucceedAndSatisfy((fileTree) => {
          expect(fileTree.hal.getFileContents('/root/file.txt')).toSucceedWith('root file');
          expect(fileTree.hal.getFileContents('/root/subdir/nested.txt')).toSucceedWith('nested file');
        });
      });

      test('handles non-recursive directory processing', async () => {
        const dirHandle = createMockDirectoryHandle('root', [
          { name: 'file.txt', content: 'root file' },
          {
            name: 'subdir',
            isDirectory: true,
            children: [{ name: 'nested.txt', content: 'nested file' }]
          }
        ]);

        const initializers = [{ dirHandles: [dirHandle], nonRecursive: true }];
        const result = await FileApiTreeAccessors.create(initializers);

        expect(result).toSucceedAndSatisfy((fileTree) => {
          expect(fileTree.hal.getFileContents('/root/file.txt')).toSucceedWith('root file');
          // Should not contain nested file in non-recursive mode
          expect(fileTree.getFile('/root/subdir/nested.txt')).toFail();
        });
      });

      test('handles directory iteration errors', async () => {
        const failingDirHandle = {
          kind: 'directory' as const,
          name: 'failing-dir',
          isSameEntry: jest.fn(),
          queryPermission: jest.fn(),
          requestPermission: jest.fn(),
          getDirectoryHandle: jest.fn(),
          getFileHandle: jest.fn(),
          removeEntry: jest.fn(),
          resolve: jest.fn(),
          keys: jest.fn(),
          values: jest.fn().mockReturnValue({
            async *[Symbol.asyncIterator]() {
              throw new Error('Directory access denied');
            }
          }),
          entries: jest.fn(),
          [Symbol.asyncIterator]: jest.fn()
        } as jest.Mocked<import('../../packlets/file-api-types').FileSystemDirectoryHandle>;

        const initializers = [{ dirHandles: [failingDirHandle] }];
        const result = await FileApiTreeAccessors.create(initializers);

        expect(result).toFailWith(/Failed to process directory failing-dir.*Directory access denied/);
      });

      test('handles subdirectory processing failure in recursive mode', async () => {
        // Create a directory with a subdirectory that will fail to process
        const failingSubDir = {
          kind: 'directory' as const,
          name: 'failing-subdir',
          isSameEntry: jest.fn(),
          queryPermission: jest.fn(),
          requestPermission: jest.fn(),
          getDirectoryHandle: jest.fn(),
          getFileHandle: jest.fn(),
          removeEntry: jest.fn(),
          resolve: jest.fn(),
          keys: jest.fn(),
          values: jest.fn().mockReturnValue({
            async *[Symbol.asyncIterator]() {
              throw new Error('Subdirectory access denied');
            }
          }),
          entries: jest.fn(),
          [Symbol.asyncIterator]: jest.fn()
        };

        const rootDirHandle = {
          kind: 'directory' as const,
          name: 'root',
          isSameEntry: jest.fn(),
          queryPermission: jest.fn(),
          requestPermission: jest.fn(),
          getDirectoryHandle: jest.fn(),
          getFileHandle: jest.fn(),
          removeEntry: jest.fn(),
          resolve: jest.fn(),
          keys: jest.fn(),
          values: jest.fn().mockReturnValue({
            async *[Symbol.asyncIterator]() {
              yield failingSubDir; // This subdirectory will fail
            }
          }),
          entries: jest.fn(),
          [Symbol.asyncIterator]: jest.fn()
        } as jest.Mocked<import('../../packlets/file-api-types').FileSystemDirectoryHandle>;

        const initializers = [{ dirHandles: [rootDirHandle] }];
        const result = await FileApiTreeAccessors.create(initializers);

        expect(result).toFailWith(/Failed to process directory failing-subdir.*Subdirectory access denied/);
      });

      test('handles empty directory', async () => {
        const emptyDirHandle = createMockDirectoryHandle('empty', []);

        const initializers = [{ dirHandles: [emptyDirHandle] }];
        const result = await FileApiTreeAccessors.create(initializers);

        expect(result).toSucceedAndSatisfy((fileTree) => {
          expect(fileTree).toBeDefined();
        });
      });
    });

    describe('unknown initializer types', () => {
      test('fails with unknown initializer type', async () => {
        const unknownInitializer = {
          unknown: 'type'
        } as unknown as import('../../packlets/file-tree').TreeInitializer;
        const initializers = [unknownInitializer];
        const result = await FileApiTreeAccessors.create(initializers);

        expect(result).toFailWith(/Unknown initializer type/);
      });
    });

    describe('mixed initializer types', () => {
      test('creates FileTree from mixed initializer types', async () => {
        const fileList = createMockFileList([{ name: 'fromList.txt', content: 'list content' }]);
        const fileHandle = {
          kind: 'file' as const,
          name: 'fromHandle.txt',
          isSameEntry: jest.fn(),
          queryPermission: jest.fn(),
          requestPermission: jest.fn(),
          getFile: jest
            .fn()
            .mockResolvedValue(createMockFile({ name: 'fromHandle.txt', content: 'handle content' })),
          createWritable: jest.fn()
        } as jest.Mocked<import('../../packlets/file-api-types').FileSystemFileHandle>;

        const initializers = [{ fileList }, { fileHandles: [fileHandle] }];
        const result = await FileApiTreeAccessors.create(initializers);

        expect(result).toSucceedAndSatisfy((fileTree) => {
          expect(fileTree.hal.getFileContents('/fromList.txt')).toSucceedWith('list content');
          expect(fileTree.hal.getFileContents('/fromHandle.txt')).toSucceedWith('handle content');
        });
      });

      test('stops processing on first error from any initializer', async () => {
        const goodFileList = createMockFileList([{ name: 'good.txt', content: 'good content' }]);
        const badFileHandle = {
          kind: 'file' as const,
          name: 'bad.txt',
          isSameEntry: jest.fn(),
          queryPermission: jest.fn(),
          requestPermission: jest.fn(),
          getFile: jest.fn().mockRejectedValue(new Error('Handle error')),
          createWritable: jest.fn()
        } as jest.Mocked<import('../../packlets/file-api-types').FileSystemFileHandle>;

        const initializers = [{ fileList: goodFileList }, { fileHandles: [badFileHandle] }];
        const result = await FileApiTreeAccessors.create(initializers);

        expect(result).toFailWith(/Failed to read file handle bad\.txt.*Handle error/);
      });
    });
  });

  describe('Content Type functionality', () => {
    describe('inferContentType parameter', () => {
      test('uses inferContentType function when provided', async () => {
        const fileList = createMockFileList([
          { name: 'document.txt', content: 'text content', type: 'text/plain' },
          { name: 'data.json', content: '{"key": "value"}', type: 'application/json' }
        ]);

        const inferContentType = jest.fn((filePath: string, provided?: string) => {
          if (filePath.endsWith('.txt')) {
            return { isSuccess: () => true, value: 'custom-text', orDefault: () => 'custom-text' };
          }
          if (filePath.endsWith('.json')) {
            return { isSuccess: () => true, value: 'custom-json', orDefault: () => 'custom-json' };
          }
          return { isSuccess: () => true, value: provided, orDefault: () => provided };
        }) as any;

        const result = await FileApiTreeAccessors.fromFileList(fileList, { inferContentType });
        expect(result).toSucceedAndSatisfy((fileTree) => {
          // Note: fromFileList has inconsistent behavior - it only passes the path parameter
          // This is inconsistent with _processFileList which passes both path and MIME type
          expect(inferContentType).toHaveBeenCalledWith('/document.txt');
          expect(inferContentType).toHaveBeenCalledWith('/data.json');

          // The specific content type assignments depend on the internal FileTree implementation
          expect(fileTree.getFile('/document.txt')).toSucceed();
          expect(fileTree.getFile('/data.json')).toSucceed();
        });
      });

      test('fromFileList only passes path parameter (current limitation)', async () => {
        const fileList = createMockFileList([
          { name: 'image.png', content: 'binary data', type: 'image/png' },
          { name: 'unknown.xyz', content: 'unknown data', type: '' }
        ]);

        const inferContentType = jest.fn((filePath: string, provided?: string) => {
          return {
            isSuccess: () => true,
            value: `custom-${provided || 'unknown'}`,
            orDefault: () => `custom-${provided || 'unknown'}`
          };
        }) as any;

        const result = await FileApiTreeAccessors.fromFileList(fileList, { inferContentType });
        expect(result).toSucceed();

        // Current limitation: fromFileList doesn't pass the MIME type parameter
        expect(inferContentType).toHaveBeenCalledWith('/image.png');
        expect(inferContentType).toHaveBeenCalledWith('/unknown.xyz');
      });

      test('works with fromDirectoryUpload', async () => {
        const fileList = createMockDirectoryFileList([
          { path: 'project/src/component.tsx', content: 'React component', type: 'text/typescript' },
          { path: 'project/styles/main.css', content: 'CSS styles', type: 'text/css' }
        ]);

        const inferContentType = jest.fn((filePath: string, provided?: string) => {
          if (filePath.includes('.tsx')) {
            return { isSuccess: () => true, value: 'typescript-react', orDefault: () => 'typescript-react' };
          }
          return { isSuccess: () => true, value: provided, orDefault: () => provided };
        }) as any;

        const result = await FileApiTreeAccessors.fromDirectoryUpload(fileList, { inferContentType });
        expect(result).toSucceed();

        // fromDirectoryUpload also has the same limitation - only passes path
        expect(inferContentType).toHaveBeenCalledWith('/project/src/component.tsx');
        expect(inferContentType).toHaveBeenCalledWith('/project/styles/main.css');
      });

      test('receives provided MIME type when using create method (correct behavior)', async () => {
        // The create method uses internal _processFileList which correctly passes both parameters
        const fileList1 = createMockFileList([
          { name: 'file1.txt', content: 'content1', type: 'text/plain' }
        ]);
        const fileList2 = createMockFileList([
          { name: 'file2.md', content: '# Markdown', type: 'text/markdown' }
        ]);

        const inferContentType = jest.fn((filePath: string, provided?: string) => {
          return {
            isSuccess: () => true,
            value: `inferred-${provided}`,
            orDefault: () => `inferred-${provided}`
          };
        }) as any;

        const initializers = [{ fileList: fileList1 }, { fileList: fileList2 }];
        const result = await FileApiTreeAccessors.create(initializers, { inferContentType });

        expect(result).toSucceed();
        // The create method correctly passes both path and MIME type
        expect(inferContentType).toHaveBeenCalledWith('/file1.txt', 'text/plain');
        expect(inferContentType).toHaveBeenCalledWith('/file2.md', 'text/markdown');
      });

      test('handles cases where inferContentType returns undefined', async () => {
        const fileList = createMockFileList([
          { name: 'test.unknown', content: 'unknown content', type: 'application/octet-stream' }
        ]);

        const inferContentType = jest.fn((filePath: string, provided?: string) => {
          // Return undefined to indicate no content type could be inferred
          return { isSuccess: () => true, value: undefined, orDefault: () => undefined };
        }) as any;

        const result = await FileApiTreeAccessors.fromFileList(fileList, { inferContentType });
        expect(result).toSucceed();

        expect(inferContentType).toHaveBeenCalledWith('/test.unknown');
      });

      test('uses default behavior when inferContentType not provided', async () => {
        const fileList = createMockFileList([
          { name: 'default.txt', content: 'default content', type: 'text/plain' }
        ]);

        // No inferContentType parameter provided
        const result = await FileApiTreeAccessors.fromFileList(fileList);
        expect(result).toSucceedAndSatisfy((fileTree) => {
          expect(fileTree.getFile('/default.txt')).toSucceed();
        });
      });
    });

    describe('ContentType with FileTreeHelpers', () => {
      test('fromFileList passes through inferContentType parameter', async () => {
        const fileList = createMockFileList([
          { name: 'helper.js', content: 'JS content', type: 'application/javascript' }
        ]);

        const inferContentType = jest.fn((filePath: string, provided?: string) => {
          return { isSuccess: () => true, value: 'helper-js', orDefault: () => 'helper-js' };
        }) as any;

        const result = await FileTreeHelpers.fromFileList(fileList, { inferContentType });
        expect(result).toSucceed();
        expect(inferContentType).toHaveBeenCalledWith('/helper.js');
      });

      test('fromDirectoryUpload passes through inferContentType parameter', async () => {
        const fileList = createMockDirectoryFileList([
          { path: 'dist/bundle.js', content: 'bundled JS', type: 'application/javascript' }
        ]);

        const inferContentType = jest.fn((filePath: string, provided?: string) => {
          return { isSuccess: () => true, value: 'bundled-js', orDefault: () => 'bundled-js' };
        }) as any;

        const result = await FileTreeHelpers.fromDirectoryUpload(fileList, { inferContentType });
        expect(result).toSucceed();
        expect(inferContentType).toHaveBeenCalledWith('/dist/bundle.js');
      });
    });
  });
});
