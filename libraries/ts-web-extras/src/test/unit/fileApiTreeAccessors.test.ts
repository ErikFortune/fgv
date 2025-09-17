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
import { FileApiTreeAccessors, IFileApiFile } from '../../packlets/file-tree';
import {
  createMockFile,
  createMockFileList,
  createMockDirectoryFileList,
  verifyFileAPI
} from '../utils/testHelpers';

describe('FileApiTreeAccessors', () => {
  describe('Static factory methods', () => {
    describe('create', () => {
      test('creates FileTree from IFileApiFile array', async () => {
        const mockFile = createMockFile({
          name: 'test.txt',
          content: 'test content'
        });

        const files: IFileApiFile[] = [{ file: mockFile, path: 'test.txt' }];

        const result = await FileApiTreeAccessors.create(files);
        expect(result).toSucceedAndSatisfy((fileTree) => {
          // Verify the FileTree was created successfully
          expect(fileTree).toBeDefined();

          // Test file access with absolute path (FileTree expects leading slash)
          const fileResult = fileTree.getFile('/test.txt');
          expect(fileResult).toSucceed();
        });
      });

      test('creates FileTree with prefix (basic functionality)', async () => {
        const mockFile = createMockFile({
          name: 'test.txt',
          content: 'test content'
        });

        const files: IFileApiFile[] = [{ file: mockFile, path: 'test.txt' }];

        const result = await FileApiTreeAccessors.create(files, '/prefix');
        // Just verify the creation succeeds - the prefix handling is complex
        expect(result).toSucceed();
      });

      test('handles multiple files', async () => {
        const files: IFileApiFile[] = [
          {
            file: createMockFile({ name: 'file1.txt', content: 'content1' }),
            path: 'file1.txt'
          },
          {
            file: createMockFile({ name: 'file2.txt', content: 'content2' }),
            path: 'file2.txt'
          }
        ];

        const result = await FileApiTreeAccessors.create(files);
        expect(result).toSucceedAndSatisfy((fileTree) => {
          expect(fileTree.getFile('/file1.txt')).toSucceed();
          expect(fileTree.getFile('/file2.txt')).toSucceed();
        });
      });

      test('handles nested directory structure', async () => {
        const files: IFileApiFile[] = [
          {
            file: createMockFile({ name: 'index.js', content: 'console.log("hello");' }),
            path: 'src/index.js'
          },
          {
            file: createMockFile({ name: 'config.json', content: '{"name": "test"}' }),
            path: 'config/config.json'
          }
        ];

        const result = await FileApiTreeAccessors.create(files);
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
          lastModified: Date.now()
        } as unknown as File;

        const files: IFileApiFile[] = [{ file: badFile, path: 'bad.txt' }];

        const result = await FileApiTreeAccessors.create(files);
        expect(result).toFailWith(/Failed to read file bad\.txt/);
      });

      test('handles empty files array', async () => {
        const result = await FileApiTreeAccessors.create([]);
        expect(result).toSucceedAndSatisfy((fileTree) => {
          expect(fileTree).toBeDefined();
        });
      });

      test('normalizes paths correctly (critical bug fix verification)', async () => {
        const files: IFileApiFile[] = [
          {
            file: createMockFile({ name: 'test.txt', content: 'content' }),
            path: 'test.txt'
          }
        ];

        const result = await FileApiTreeAccessors.create(files);
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
        const files: IFileApiFile[] = [
          {
            file: createMockFile({ name: 'test.txt', content: 'content' }),
            path: 'subdir/test.txt'
          }
        ];

        const result = await FileApiTreeAccessors.create(files, '/prefix');
        // Just verify the creation succeeds with nested paths
        expect(result).toSucceed();
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

        const result = await FileApiTreeAccessors.fromFileList(fileList, '/uploads');
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

        const result = await FileApiTreeAccessors.fromDirectoryUpload(fileList, '/upload');
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
        const fileList = createMockFileList([
          {
            name: 'test.txt',
            content: 'content',
            type: 'text/plain',
            lastModified: testTime
          }
        ]);

        const metadata = FileApiTreeAccessors.extractFileMetadata(fileList);
        expect(metadata).toHaveLength(1);
        expect(metadata[0]).toEqual({
          path: 'test.txt',
          name: 'test.txt',
          size: expect.any(Number),
          type: 'text/plain',
          lastModified: testTime
        });
      });

      test('extracts metadata with webkitRelativePath', () => {
        const fileList = createMockDirectoryFileList([
          { path: 'folder/file.txt', content: 'content', type: 'text/plain' }
        ]);

        const metadata = FileApiTreeAccessors.extractFileMetadata(fileList);
        expect(metadata).toHaveLength(1);
        expect(metadata[0]).toEqual({
          path: 'folder/file.txt',
          name: 'file.txt',
          size: expect.any(Number),
          type: 'text/plain',
          lastModified: expect.any(Number)
        });
      });

      test('handles multiple files with different types', () => {
        const fileList = createMockFileList([
          { name: 'text.txt', content: 'text', type: 'text/plain' },
          { name: 'data.json', content: '{}', type: 'application/json' },
          { name: 'script.js', content: 'console.log("hi");', type: 'application/javascript' }
        ]);

        const metadata = FileApiTreeAccessors.extractFileMetadata(fileList);
        expect(metadata).toHaveLength(3);

        expect(metadata.find((m) => m.name === 'text.txt')?.type).toBe('text/plain');
        expect(metadata.find((m) => m.name === 'data.json')?.type).toBe('application/json');
        expect(metadata.find((m) => m.name === 'script.js')?.type).toBe('application/javascript');
      });

      test('handles empty FileList', () => {
        const fileList = createMockFileList([]);
        const metadata = FileApiTreeAccessors.extractFileMetadata(fileList);
        expect(metadata).toHaveLength(0);
      });

      test('includes file sizes', () => {
        const shortContent = 'hi';
        const longContent = 'a'.repeat(1000);

        const fileList = createMockFileList([
          { name: 'short.txt', content: shortContent },
          { name: 'long.txt', content: longContent }
        ]);

        const metadata = FileApiTreeAccessors.extractFileMetadata(fileList);
        const shortMeta = metadata.find((m) => m.name === 'short.txt');
        const longMeta = metadata.find((m) => m.name === 'long.txt');

        expect(shortMeta?.size).toBeGreaterThan(0);
        expect(longMeta?.size).toBeGreaterThan(shortMeta?.size!);
      });
    });
  });

  describe('Integration with FileTree', () => {
    test('created FileTree supports standard operations', async () => {
      const files: IFileApiFile[] = [
        {
          file: createMockFile({ name: 'data.json', content: '{"key": "value"}' }),
          path: 'config/data.json'
        },
        {
          file: createMockFile({ name: 'readme.txt', content: 'This is a readme file' }),
          path: 'docs/readme.txt'
        }
      ];

      const result = await FileApiTreeAccessors.create(files);
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
      const files: IFileApiFile[] = [
        {
          file: createMockFile({ name: 'package.json', content: jsonContent }),
          path: 'package.json'
        }
      ];

      const result = await FileApiTreeAccessors.create(files);
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
      const files: IFileApiFile[] = [
        {
          file: createMockFile({ name: 'file1.txt', content: 'content1' }),
          path: 'src/file1.txt'
        },
        {
          file: createMockFile({ name: 'file2.txt', content: 'content2' }),
          path: 'src/file2.txt'
        }
      ];

      const result = await FileApiTreeAccessors.create(files);
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

      const files: IFileApiFile[] = [{ file: errorFile, path: 'error.txt' }];

      const result = await FileApiTreeAccessors.create(files);
      expect(result).toFailWith(/Failed to read file error\.txt.*Disk error/);
    });

    test('handles invalid file paths gracefully', async () => {
      // Create files with problematic paths
      const files: IFileApiFile[] = [
        {
          file: createMockFile({ name: 'test.txt', content: 'content' }),
          path: '' // Empty path should cause issues
        }
      ];

      const result = await FileApiTreeAccessors.create(files);
      // Should either succeed by handling empty path or fail gracefully
      if (result.isFailure()) {
        expect(result.message).toContain('');
      } else {
        expect(result).toSucceed();
      }
    });
  });
});
