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
  filesToDirectory,
  exportAsJson,
  exportUsingFileSystemAPI
} from '../../../utils/fileProcessing';
import { IImportedFile } from '../../../types';

describe('fileProcessing utilities', () => {
  describe('readFilesFromInput', () => {
    test('reads single file from FileList', async () => {
      const mockFile = new File(['test content'], 'test.json', { type: 'application/json' });
      const fileList = {
        length: 1,
        0: mockFile,
        item: (index: number) => (index === 0 ? mockFile : null)
      } as FileList;

      const result = await readFilesFromInput(fileList);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        name: 'test.json',
        path: 'test.json',
        content: 'test content',
        type: 'application/json'
      });
    });

    test('reads multiple files from FileList', async () => {
      const mockFile1 = new File(['content 1'], 'file1.json', { type: 'application/json' });
      const mockFile2 = new File(['content 2'], 'file2.json', { type: 'application/json' });
      const fileList = {
        length: 2,
        0: mockFile1,
        1: mockFile2,
        item: (index: number) => (index === 0 ? mockFile1 : index === 1 ? mockFile2 : null)
      } as FileList;

      const result = await readFilesFromInput(fileList);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        name: 'file1.json',
        path: 'file1.json',
        content: 'content 1',
        type: 'application/json'
      });
      expect(result[1]).toEqual({
        name: 'file2.json',
        path: 'file2.json',
        content: 'content 2',
        type: 'application/json'
      });
    });

    test('handles file with webkitRelativePath', async () => {
      const mockFile = new File(['test content'], 'test.json', {
        type: 'application/json',
        webkitRelativePath: 'folder/test.json'
      } as any);

      const fileList = {
        length: 1,
        0: mockFile,
        item: (index: number) => (index === 0 ? mockFile : null)
      } as FileList;

      const result = await readFilesFromInput(fileList);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        name: 'test.json',
        path: 'folder/test.json',
        content: 'test content',
        type: 'application/json'
      });
    });

    test('handles empty FileList', async () => {
      const fileList = {
        length: 0,
        item: () => null
      } as FileList;

      const result = await readFilesFromInput(fileList);

      expect(result).toEqual([]);
    });

    test('handles FileReader error', async () => {
      const mockFile = new File(['test content'], 'test.json', { type: 'application/json' });

      // Override the global FileReader for this test
      const originalFileReader = global.FileReader;
      global.FileReader = class MockErrorFileReader {
        public onload: ((event: any) => void) | null = null;
        public onerror: ((event: any) => void) | null = null;
        public readAsText(): void {
          setTimeout(() => {
            if (this.onerror) {
              this.onerror(new Error('Read error'));
            }
          }, 0);
        }
      } as any;

      const fileList = {
        length: 1,
        0: mockFile,
        item: (index: number) => (index === 0 ? mockFile : null)
      } as FileList;

      await expect(readFilesFromInput(fileList)).rejects.toThrow('Failed to read file test.json');

      // Restore original FileReader
      global.FileReader = originalFileReader;
    });
  });

  describe('filesToDirectory', () => {
    test('creates root directory from files without paths', () => {
      const files: IImportedFile[] = [
        { name: 'file1.json', content: 'content1' },
        { name: 'file2.json', content: 'content2' }
      ];

      const result = filesToDirectory(files);

      expect(result).toEqual({
        name: 'root',
        path: '',
        files: [
          { name: 'file1.json', content: 'content1' },
          { name: 'file2.json', content: 'content2' }
        ],
        subdirectories: []
      });
    });

    test('creates directory structure from files with paths', () => {
      const files: IImportedFile[] = [
        { name: 'root.json', path: 'root.json', content: 'root content' },
        { name: 'sub1.json', path: 'folder1/sub1.json', content: 'sub1 content' },
        { name: 'sub2.json', path: 'folder1/sub2.json', content: 'sub2 content' },
        { name: 'nested.json', path: 'folder1/subfolder/nested.json', content: 'nested content' }
      ];

      const result = filesToDirectory(files);

      expect(result.name).toBe('root');
      expect(result.path).toBe('');
      expect(result.files).toHaveLength(1);
      expect(result.files[0]).toEqual({ name: 'root.json', path: 'root.json', content: 'root content' });
      expect(result.subdirectories).toHaveLength(1);

      const folder1 = result.subdirectories![0];
      expect(folder1.name).toBe('folder1');
      expect(folder1.path).toBe('folder1');
      expect(folder1.files).toHaveLength(2);
      expect(folder1.files[0]).toEqual({
        name: 'sub1.json',
        path: 'folder1/sub1.json',
        content: 'sub1 content'
      });
      expect(folder1.files[1]).toEqual({
        name: 'sub2.json',
        path: 'folder1/sub2.json',
        content: 'sub2 content'
      });
      expect(folder1.subdirectories).toHaveLength(1);

      const subfolder = folder1.subdirectories![0];
      expect(subfolder.name).toBe('subfolder');
      expect(subfolder.path).toBe('folder1/subfolder');
      expect(subfolder.files).toHaveLength(1);
      expect(subfolder.files[0]).toEqual({
        name: 'nested.json',
        path: 'folder1/subfolder/nested.json',
        content: 'nested content'
      });
    });

    test('handles complex nested directory structure', () => {
      const files: IImportedFile[] = [
        { name: 'a.json', path: 'dir1/dir2/a.json', content: 'a' },
        { name: 'b.json', path: 'dir1/b.json', content: 'b' },
        { name: 'c.json', path: 'dir3/c.json', content: 'c' }
      ];

      const result = filesToDirectory(files);

      expect(result.subdirectories).toHaveLength(2);

      const dir1 = result.subdirectories!.find((d: any) => d.name === 'dir1');
      const dir3 = result.subdirectories!.find((d: any) => d.name === 'dir3');

      expect(dir1).toBeDefined();
      expect(dir1!.files).toHaveLength(1);
      expect(dir1!.files[0].name).toBe('b.json');
      expect(dir1!.subdirectories).toHaveLength(1);
      expect(dir1!.subdirectories![0].name).toBe('dir2');

      expect(dir3).toBeDefined();
      expect(dir3!.files).toHaveLength(1);
      expect(dir3!.files[0].name).toBe('c.json');
      expect(dir3!.subdirectories).toHaveLength(0);
    });

    test('handles empty file list', () => {
      const result = filesToDirectory([]);

      expect(result).toEqual({
        name: 'root',
        path: '',
        files: [],
        subdirectories: []
      });
    });

    test('handles files with mixed path and no-path entries', () => {
      const files: IImportedFile[] = [
        { name: 'root.json', content: 'root' },
        { name: 'sub.json', path: 'folder/sub.json', content: 'sub' }
      ];

      const result = filesToDirectory(files);

      expect(result.files).toHaveLength(1);
      expect(result.files[0].name).toBe('root.json');
      expect(result.subdirectories).toHaveLength(1);
      expect(result.subdirectories![0].name).toBe('folder');
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
      const originalShowSaveFilePicker = (window as any).showSaveFilePicker;
      delete (window as any).showSaveFilePicker;

      const result = await exportUsingFileSystemAPI({ test: 'data' }, 'test.json');

      expect(result).toBe(false);

      (window as any).showSaveFilePicker = originalShowSaveFilePicker;
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

      (window as any).showSaveFilePicker = mockShowSaveFilePicker;

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

      (window as any).showSaveFilePicker = mockShowSaveFilePicker;

      const result = await exportUsingFileSystemAPI({ test: 'data' }, 'test.json');

      expect(result).toBe(false);
    });

    test('throws error for non-AbortError exceptions', async () => {
      const mockShowSaveFilePicker = jest.fn().mockRejectedValue(new Error('Permission denied'));

      (window as any).showSaveFilePicker = mockShowSaveFilePicker;

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

      (window as any).showSaveFilePicker = mockShowSaveFilePicker;

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
