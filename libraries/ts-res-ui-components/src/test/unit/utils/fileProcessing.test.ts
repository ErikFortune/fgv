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
import {
  readFilesFromInput,
  readDirectoryFromInput,
  createFileTreeFromFiles
} from '../../../utils/fileProcessing';
import { exportAsJson, exportUsingFileSystemAPI } from '@fgv/ts-web-extras';
import { supportsFileSystemAccess, WindowWithFsAccess } from '@fgv/ts-web-extras';

describe('fileProcessing utilities', () => {
  describe('readFilesFromInput', () => {
    test('reads single file from FileList and returns FileTree', async () => {
      const mockFile = new File(['test content'], 'test.json', { type: 'application/json' });
      const fileList = [mockFile] as unknown as FileList;

      const result = await readFilesFromInput(fileList);

      expect(result).toSucceedAndSatisfy((fileTree) => {
        // Verify it's a FileTree
        expect(fileTree).toHaveProperty('getFile');
        expect(fileTree).toHaveProperty('getDirectory');

        // Check that we can get the file
        expect(fileTree.getFile('/test.json')).toSucceedAndSatisfy((file) => {
          expect(file.name).toBe('test.json');
          expect(file.getRawContents()).toSucceedWith('test content');
          expect(file.contentType).toBe('application/json');
        });
      });
    });

    test('reads multiple files from FileList and returns FileTree', async () => {
      const mockFile1 = new File(['content 1'], 'file1.json', { type: 'application/json' });
      const mockFile2 = new File(['content 2'], 'file2.json', { type: 'application/json' });
      const fileList = [mockFile1, mockFile2] as unknown as FileList;

      const result = await readFilesFromInput(fileList);

      expect(result).toSucceedAndSatisfy((fileTree) => {
        // Check first file
        expect(fileTree.getFile('/file1.json')).toSucceedAndSatisfy((file) => {
          expect(file.name).toBe('file1.json');
          expect(file.getRawContents()).toSucceedWith('content 1');
          expect(file.contentType).toBe('application/json');
        });

        // Check second file
        expect(fileTree.getFile('/file2.json')).toSucceedAndSatisfy((file) => {
          expect(file.name).toBe('file2.json');
          expect(file.getRawContents()).toSucceedWith('content 2');
          expect(file.contentType).toBe('application/json');
        });
      });
    });

    test('handles file with webkitRelativePath', async () => {
      const mockFile = new File(['test content'], 'test.json', {
        type: 'application/json'
      });
      // Simulate webkitRelativePath
      Object.defineProperty(mockFile, 'webkitRelativePath', {
        value: 'folder/test.json',
        writable: false
      });
      const fileList = [mockFile] as unknown as FileList;

      const result = await readFilesFromInput(fileList);

      expect(result).toSucceedAndSatisfy((fileTree) => {
        // Check that file is at the webkitRelativePath location
        expect(fileTree.getFile('/folder/test.json')).toSucceedAndSatisfy((file) => {
          expect(file.name).toBe('test.json');
          expect(file.getRawContents()).toSucceedWith('test content');
          expect(file.contentType).toBe('application/json');
        });
      });
    });

    test('handles empty FileList', async () => {
      const fileList = [] as unknown as FileList;

      const result = await readFilesFromInput(fileList);

      expect(result).toSucceedAndSatisfy((fileTree) => {
        // Should be a valid but empty FileTree
        const rootDir = fileTree.getDirectory('/');
        expect(rootDir).toSucceedAndSatisfy((dir) => {
          expect(dir.getChildren()).toSucceedWith([]);
        });
      });
    });

    test('handles FileReader error with graceful fallback', async () => {
      const mockFile = new File(['test content'], 'test.json', { type: 'application/json' });

      // Mock File.text to throw an error to trigger fallback
      const originalText = mockFile.text;
      mockFile.text = jest.fn().mockRejectedValue(new Error('Read error'));

      const fileList = [mockFile] as unknown as FileList;

      const result = await readFilesFromInput(fileList);

      // Should still succeed with fallback FileReader
      expect(result).toSucceed();

      // Restore original method
      mockFile.text = originalText;
    });
  });

  describe('createFileTreeFromFiles', () => {
    test('creates FileTree from file array with root files', () => {
      const files = [
        { name: 'file1.json', content: 'content1', type: 'application/json' },
        { name: 'file2.json', content: 'content2', type: 'application/json' }
      ];

      const result = createFileTreeFromFiles(files);

      expect(result).toSucceedAndSatisfy((fileTree) => {
        expect(fileTree.getFile('/file1.json')).toSucceedAndSatisfy((file) => {
          expect(file.name).toBe('file1.json');
          expect(file.getRawContents()).toSucceedWith('content1');
          expect(file.contentType).toBe('application/json');
        });

        expect(fileTree.getFile('/file2.json')).toSucceedAndSatisfy((file) => {
          expect(file.name).toBe('file2.json');
          expect(file.getRawContents()).toSucceedWith('content2');
          expect(file.contentType).toBe('application/json');
        });
      });
    });

    test('creates FileTree with directory structure from files with paths', () => {
      const files = [
        { name: 'root.json', path: 'root.json', content: 'root content' },
        { name: 'sub1.json', path: 'folder1/sub1.json', content: 'sub1 content' },
        { name: 'sub2.json', path: 'folder1/sub2.json', content: 'sub2 content' },
        { name: 'nested.json', path: 'folder1/subfolder/nested.json', content: 'nested content' }
      ];

      const result = createFileTreeFromFiles(files);

      expect(result).toSucceedAndSatisfy((fileTree) => {
        // Check root file
        expect(fileTree.getFile('/root.json')).toSucceedAndSatisfy((file) => {
          expect(file.getRawContents()).toSucceedWith('root content');
        });

        // Check folder1 files
        expect(fileTree.getFile('/folder1/sub1.json')).toSucceedAndSatisfy((file) => {
          expect(file.getRawContents()).toSucceedWith('sub1 content');
        });

        expect(fileTree.getFile('/folder1/sub2.json')).toSucceedAndSatisfy((file) => {
          expect(file.getRawContents()).toSucceedWith('sub2 content');
        });

        // Check nested file
        expect(fileTree.getFile('/folder1/subfolder/nested.json')).toSucceedAndSatisfy((file) => {
          expect(file.getRawContents()).toSucceedWith('nested content');
        });

        // Check directory structure
        expect(fileTree.getDirectory('/folder1')).toSucceedAndSatisfy((dir) => {
          expect(dir.name).toBe('folder1');
        });

        expect(fileTree.getDirectory('/folder1/subfolder')).toSucceedAndSatisfy((subdir) => {
          expect(subdir.name).toBe('subfolder');
        });
      });
    });

    test('handles empty file list', () => {
      const result = createFileTreeFromFiles([]);

      expect(result).toSucceedAndSatisfy((fileTree) => {
        const rootDir = fileTree.getDirectory('/');
        expect(rootDir).toSucceedAndSatisfy((dir) => {
          expect(dir.getChildren()).toSucceedWith([]);
        });
      });
    });
  });

  describe('readDirectoryFromInput', () => {
    test('reads directory upload with webkitRelativePath', async () => {
      const mockFile1 = new File(['content1'], 'file1.json', { type: 'application/json' });
      const mockFile2 = new File(['content2'], 'file2.json', { type: 'application/json' });

      // Simulate webkitRelativePath for directory upload
      Object.defineProperty(mockFile1, 'webkitRelativePath', {
        value: 'mydir/file1.json',
        writable: false
      });
      Object.defineProperty(mockFile2, 'webkitRelativePath', {
        value: 'mydir/file2.json',
        writable: false
      });

      const fileList = [mockFile1, mockFile2] as unknown as FileList;

      const result = await readDirectoryFromInput(fileList);

      expect(result).toSucceedAndSatisfy((fileTree) => {
        expect(fileTree.getFile('/mydir/file1.json')).toSucceedAndSatisfy((file) => {
          expect(file.getRawContents()).toSucceedWith('content1');
        });

        expect(fileTree.getFile('/mydir/file2.json')).toSucceedAndSatisfy((file) => {
          expect(file.getRawContents()).toSucceedWith('content2');
        });

        expect(fileTree.getDirectory('/mydir')).toSucceedAndSatisfy((dir) => {
          expect(dir.name).toBe('mydir');
        });
      });
    });
  });

  describe('exportAsJson', () => {
    beforeEach(() => {
      // Reset mocks before each test
      jest.clearAllMocks();
    });

    test('creates blob and triggers download', () => {
      const testData = { test: 'data' };
      const filename = 'test.json';

      // Test completes without errors
      expect(() => exportAsJson(testData, filename)).not.toThrow();

      // Verify that URL methods were called (functional behavior)
      expect(URL.createObjectURL).toHaveBeenCalled();
      expect(URL.revokeObjectURL).toHaveBeenCalled();

      // Verify blob was created with correct type
      const blobArg = (URL.createObjectURL as jest.Mock).mock.calls[0][0];
      expect(blobArg).toBeInstanceOf(Blob);
      expect(blobArg.type).toBe('application/json');
    });

    test('handles complex data structures', () => {
      const complexData = {
        array: [1, 2, 3],
        nested: { inner: 'value' },
        nullValue: null,
        boolValue: true
      };

      exportAsJson(complexData, 'complex.json');

      expect(URL.createObjectURL).toHaveBeenCalled();
      const blobArg = (URL.createObjectURL as jest.Mock).mock.calls[0][0];
      expect(blobArg).toBeInstanceOf(Blob);
    });
  });

  describe('exportUsingFileSystemAPI', () => {
    test('returns false when File System Access API is not available', async () => {
      if (!supportsFileSystemAccess(window)) {
        return;
      }

      const originalShowSaveFilePicker = window.showSaveFilePicker;
      window.showSaveFilePicker = undefined as unknown as typeof window.showSaveFilePicker;

      const result = await exportUsingFileSystemAPI({ test: 'data' }, 'test.json');

      expect(result).toBe(false);

      window.showSaveFilePicker = originalShowSaveFilePicker;
    });

    test('successfully exports when File System Access API is available', async () => {
      const mockWritable = {
        write: jest.fn().mockResolvedValue(undefined),
        close: jest.fn().mockResolvedValue(undefined)
      };

      const mockFileHandle = {
        createWritable: jest.fn().mockResolvedValue(mockWritable)
      };

      const mockShowSaveFilePicker = jest.fn().mockResolvedValue(mockFileHandle);

      if (!supportsFileSystemAccess(window)) {
        return;
      }

      (window as WindowWithFsAccess).showSaveFilePicker = mockShowSaveFilePicker;

      const testData = { test: 'data' };
      const result = await exportUsingFileSystemAPI(testData, 'test.json', 'Test files');

      expect(result).toBe(true);
      expect(mockShowSaveFilePicker).toHaveBeenCalledWith({
        suggestedName: 'test.json',
        types: [
          {
            description: 'Test files',
            accept: {
              'application/json': ['.json']
            }
          }
        ]
      });
      expect(mockFileHandle.createWritable).toHaveBeenCalledTimes(1);
      expect(mockWritable.write).toHaveBeenCalledWith(JSON.stringify(testData, null, 2));
      expect(mockWritable.close).toHaveBeenCalledTimes(1);
    });

    test('returns false when user cancels (AbortError)', async () => {
      const mockShowSaveFilePicker = jest
        .fn()
        .mockRejectedValue(Object.assign(new Error('User cancelled'), { name: 'AbortError' }));

      if (!supportsFileSystemAccess(window)) {
        return;
      }

      (window as WindowWithFsAccess).showSaveFilePicker = mockShowSaveFilePicker;

      const result = await exportUsingFileSystemAPI({ test: 'data' }, 'test.json');

      expect(result).toBe(false);
    });

    test('throws error for non-AbortError exceptions', async () => {
      const mockShowSaveFilePicker = jest.fn().mockRejectedValue(new Error('Permission denied'));

      if (!supportsFileSystemAccess(window)) {
        return;
      }

      (window as WindowWithFsAccess).showSaveFilePicker = mockShowSaveFilePicker;

      await expect(exportUsingFileSystemAPI({ test: 'data' }, 'test.json')).rejects.toThrow(
        'Permission denied'
      );
    });

    test('uses default description when none provided', async () => {
      const mockWritable = {
        write: jest.fn().mockResolvedValue(undefined),
        close: jest.fn().mockResolvedValue(undefined)
      };

      const mockFileHandle = {
        createWritable: jest.fn().mockResolvedValue(mockWritable)
      };

      const mockShowSaveFilePicker = jest.fn().mockResolvedValue(mockFileHandle);

      if (!supportsFileSystemAccess(window)) {
        return;
      }

      (window as WindowWithFsAccess).showSaveFilePicker = mockShowSaveFilePicker;

      await exportUsingFileSystemAPI({ test: 'data' }, 'test.json');

      expect(mockShowSaveFilePicker).toHaveBeenCalledWith({
        suggestedName: 'test.json',
        types: [
          {
            description: 'JSON files',
            accept: {
              'application/json': ['.json']
            }
          }
        ]
      });
    });
  });
});
