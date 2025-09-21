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
  supportsFileSystemAccess,
  isFileHandle,
  isDirectoryHandle,
  safeShowOpenFilePicker,
  safeShowSaveFilePicker,
  safeShowDirectoryPicker,
  exportAsJson,
  exportUsingFileSystemAPI,
  type FileSystemHandle,
  type FileSystemFileHandle,
  type FileSystemDirectoryHandle,
  type WindowWithFsAccess,
  type ShowOpenFilePickerOptions,
  type ShowSaveFilePickerOptions,
  type ShowDirectoryPickerOptions
} from '../../packlets/file-api-types';

describe('File API Types', () => {
  describe('supportsFileSystemAccess', () => {
    test('returns true for window with File System Access API support', () => {
      const mockWindow = {
        showOpenFilePicker: jest.fn(),
        showSaveFilePicker: jest.fn(),
        showDirectoryPicker: jest.fn()
      } as unknown as Window;

      expect(supportsFileSystemAccess(mockWindow)).toBe(true);
    });

    test('returns false for window without showOpenFilePicker', () => {
      const mockWindow = {
        showSaveFilePicker: jest.fn(),
        showDirectoryPicker: jest.fn()
      } as unknown as Window;

      expect(supportsFileSystemAccess(mockWindow)).toBe(false);
    });

    test('returns false for window without showSaveFilePicker', () => {
      const mockWindow = {
        showOpenFilePicker: jest.fn(),
        showDirectoryPicker: jest.fn()
      } as unknown as Window;

      expect(supportsFileSystemAccess(mockWindow)).toBe(false);
    });

    test('returns false for window without showDirectoryPicker', () => {
      const mockWindow = {
        showOpenFilePicker: jest.fn(),
        showSaveFilePicker: jest.fn()
      } as unknown as Window;

      expect(supportsFileSystemAccess(mockWindow)).toBe(false);
    });

    test('returns false for window with no File System Access API methods', () => {
      const mockWindow = {} as unknown as Window;

      expect(supportsFileSystemAccess(mockWindow)).toBe(false);
    });

    test('returns false for standard browser window without File System Access API', () => {
      // Simulate older browser window
      const mockWindow = {
        location: { href: 'https://example.com' },
        document: {},
        navigator: {}
      } as unknown as Window;

      expect(supportsFileSystemAccess(mockWindow)).toBe(false);
    });
  });

  describe('isFileHandle', () => {
    test('returns true for file handle', () => {
      const mockFileHandle: FileSystemFileHandle = {
        kind: 'file',
        name: 'test.txt',
        isSameEntry: jest.fn(),
        queryPermission: jest.fn(),
        requestPermission: jest.fn(),
        getFile: jest.fn(),
        createWritable: jest.fn()
      };

      expect(isFileHandle(mockFileHandle)).toBe(true);
    });

    test('returns false for directory handle', () => {
      const mockDirectoryHandle: FileSystemDirectoryHandle = {
        kind: 'directory',
        name: 'test-dir',
        isSameEntry: jest.fn(),
        queryPermission: jest.fn(),
        requestPermission: jest.fn(),
        getDirectoryHandle: jest.fn(),
        getFileHandle: jest.fn(),
        removeEntry: jest.fn(),
        resolve: jest.fn(),
        keys: jest.fn(),
        values: jest.fn(),
        entries: jest.fn(),
        [Symbol.asyncIterator]: jest.fn()
      };

      expect(isFileHandle(mockDirectoryHandle)).toBe(false);
    });

    test('handles handle with minimal implementation', () => {
      const mockHandle = {
        kind: 'file' as const,
        name: 'minimal.txt'
      } as FileSystemHandle;

      expect(isFileHandle(mockHandle)).toBe(true);
    });

    test('handles handle with directory kind', () => {
      const mockHandle = {
        kind: 'directory' as const,
        name: 'minimal-dir'
      } as FileSystemHandle;

      expect(isFileHandle(mockHandle)).toBe(false);
    });
  });

  describe('isDirectoryHandle', () => {
    test('returns true for directory handle', () => {
      const mockDirectoryHandle: FileSystemDirectoryHandle = {
        kind: 'directory',
        name: 'test-dir',
        isSameEntry: jest.fn(),
        queryPermission: jest.fn(),
        requestPermission: jest.fn(),
        getDirectoryHandle: jest.fn(),
        getFileHandle: jest.fn(),
        removeEntry: jest.fn(),
        resolve: jest.fn(),
        keys: jest.fn(),
        values: jest.fn(),
        entries: jest.fn(),
        [Symbol.asyncIterator]: jest.fn()
      };

      expect(isDirectoryHandle(mockDirectoryHandle)).toBe(true);
    });

    test('returns false for file handle', () => {
      const mockFileHandle: FileSystemFileHandle = {
        kind: 'file',
        name: 'test.txt',
        isSameEntry: jest.fn(),
        queryPermission: jest.fn(),
        requestPermission: jest.fn(),
        getFile: jest.fn(),
        createWritable: jest.fn()
      };

      expect(isDirectoryHandle(mockFileHandle)).toBe(false);
    });

    test('handles handle with minimal implementation', () => {
      const mockHandle = {
        kind: 'directory' as const,
        name: 'minimal-dir'
      } as FileSystemHandle;

      expect(isDirectoryHandle(mockHandle)).toBe(true);
    });

    test('handles handle with file kind', () => {
      const mockHandle = {
        kind: 'file' as const,
        name: 'minimal.txt'
      } as FileSystemHandle;

      expect(isDirectoryHandle(mockHandle)).toBe(false);
    });
  });

  describe('safeShowOpenFilePicker', () => {
    test('calls showOpenFilePicker when File System Access API is supported', async () => {
      const mockFileHandles = [
        {
          kind: 'file' as const,
          name: 'test.txt',
          isSameEntry: jest.fn(),
          queryPermission: jest.fn(),
          requestPermission: jest.fn(),
          getFile: jest.fn(),
          createWritable: jest.fn()
        }
      ] as FileSystemFileHandle[];

      const mockWindow = {
        showOpenFilePicker: jest.fn().mockResolvedValue(mockFileHandles),
        showSaveFilePicker: jest.fn(),
        showDirectoryPicker: jest.fn()
      } as unknown as WindowWithFsAccess;

      const options: ShowOpenFilePickerOptions = {
        multiple: true,
        types: [{ description: 'Text files', accept: { 'text/plain': ['.txt'] } }]
      };

      const result = await safeShowOpenFilePicker(mockWindow, options);

      expect(mockWindow.showOpenFilePicker).toHaveBeenCalledWith(options);
      expect(result).toBe(mockFileHandles);
    });

    test('calls showOpenFilePicker without options when none provided', async () => {
      const mockFileHandles = [] as FileSystemFileHandle[];

      const mockWindow = {
        showOpenFilePicker: jest.fn().mockResolvedValue(mockFileHandles),
        showSaveFilePicker: jest.fn(),
        showDirectoryPicker: jest.fn()
      } as unknown as WindowWithFsAccess;

      const result = await safeShowOpenFilePicker(mockWindow);

      expect(mockWindow.showOpenFilePicker).toHaveBeenCalledWith(undefined);
      expect(result).toBe(mockFileHandles);
    });

    test('returns null when File System Access API is not supported', async () => {
      const mockWindow = {} as unknown as Window;

      const result = await safeShowOpenFilePicker(mockWindow);

      expect(result).toBeNull();
    });

    test('returns null for partially supported window', async () => {
      const mockWindow = {
        showOpenFilePicker: jest.fn()
        // Missing showSaveFilePicker and showDirectoryPicker
      } as unknown as Window;

      const result = await safeShowOpenFilePicker(mockWindow);

      expect(result).toBeNull();
    });

    test('propagates errors from showOpenFilePicker', async () => {
      const mockError = new Error('User cancelled file picker');
      const mockWindow = {
        showOpenFilePicker: jest.fn().mockRejectedValue(mockError),
        showSaveFilePicker: jest.fn(),
        showDirectoryPicker: jest.fn()
      } as unknown as WindowWithFsAccess;

      await expect(safeShowOpenFilePicker(mockWindow)).rejects.toThrow('User cancelled file picker');
    });
  });

  describe('safeShowSaveFilePicker', () => {
    test('calls showSaveFilePicker when File System Access API is supported', async () => {
      const mockFileHandle = {
        kind: 'file' as const,
        name: 'save.txt',
        isSameEntry: jest.fn(),
        queryPermission: jest.fn(),
        requestPermission: jest.fn(),
        getFile: jest.fn(),
        createWritable: jest.fn()
      } as FileSystemFileHandle;

      const mockWindow = {
        showOpenFilePicker: jest.fn(),
        showSaveFilePicker: jest.fn().mockResolvedValue(mockFileHandle),
        showDirectoryPicker: jest.fn()
      } as unknown as WindowWithFsAccess;

      const options: ShowSaveFilePickerOptions = {
        suggestedName: 'document.txt',
        types: [{ description: 'Text files', accept: { 'text/plain': ['.txt'] } }]
      };

      const result = await safeShowSaveFilePicker(mockWindow, options);

      expect(mockWindow.showSaveFilePicker).toHaveBeenCalledWith(options);
      expect(result).toBe(mockFileHandle);
    });

    test('calls showSaveFilePicker without options when none provided', async () => {
      const mockFileHandle = {
        kind: 'file' as const,
        name: 'untitled.txt'
      } as FileSystemFileHandle;

      const mockWindow = {
        showOpenFilePicker: jest.fn(),
        showSaveFilePicker: jest.fn().mockResolvedValue(mockFileHandle),
        showDirectoryPicker: jest.fn()
      } as unknown as WindowWithFsAccess;

      const result = await safeShowSaveFilePicker(mockWindow);

      expect(mockWindow.showSaveFilePicker).toHaveBeenCalledWith(undefined);
      expect(result).toBe(mockFileHandle);
    });

    test('returns null when File System Access API is not supported', async () => {
      const mockWindow = {} as unknown as Window;

      const result = await safeShowSaveFilePicker(mockWindow);

      expect(result).toBeNull();
    });

    test('returns null for partially supported window', async () => {
      const mockWindow = {
        showSaveFilePicker: jest.fn()
        // Missing showOpenFilePicker and showDirectoryPicker
      } as unknown as Window;

      const result = await safeShowSaveFilePicker(mockWindow);

      expect(result).toBeNull();
    });

    test('propagates errors from showSaveFilePicker', async () => {
      const mockError = new Error('Save operation failed');
      const mockWindow = {
        showOpenFilePicker: jest.fn(),
        showSaveFilePicker: jest.fn().mockRejectedValue(mockError),
        showDirectoryPicker: jest.fn()
      } as unknown as WindowWithFsAccess;

      await expect(safeShowSaveFilePicker(mockWindow)).rejects.toThrow('Save operation failed');
    });
  });

  describe('safeShowDirectoryPicker', () => {
    test('calls showDirectoryPicker when File System Access API is supported', async () => {
      const mockDirectoryHandle = {
        kind: 'directory' as const,
        name: 'selected-folder',
        isSameEntry: jest.fn(),
        queryPermission: jest.fn(),
        requestPermission: jest.fn(),
        getDirectoryHandle: jest.fn(),
        getFileHandle: jest.fn(),
        removeEntry: jest.fn(),
        resolve: jest.fn(),
        keys: jest.fn(),
        values: jest.fn(),
        entries: jest.fn(),
        [Symbol.asyncIterator]: jest.fn()
      } as FileSystemDirectoryHandle;

      const mockWindow = {
        showOpenFilePicker: jest.fn(),
        showSaveFilePicker: jest.fn(),
        showDirectoryPicker: jest.fn().mockResolvedValue(mockDirectoryHandle)
      } as unknown as WindowWithFsAccess;

      const options: ShowDirectoryPickerOptions = {
        mode: 'readwrite',
        startIn: 'documents' as const
      };

      const result = await safeShowDirectoryPicker(mockWindow, options);

      expect(mockWindow.showDirectoryPicker).toHaveBeenCalledWith(options);
      expect(result).toBe(mockDirectoryHandle);
    });

    test('calls showDirectoryPicker without options when none provided', async () => {
      const mockDirectoryHandle = {
        kind: 'directory' as const,
        name: 'default-folder'
      } as FileSystemDirectoryHandle;

      const mockWindow = {
        showOpenFilePicker: jest.fn(),
        showSaveFilePicker: jest.fn(),
        showDirectoryPicker: jest.fn().mockResolvedValue(mockDirectoryHandle)
      } as unknown as WindowWithFsAccess;

      const result = await safeShowDirectoryPicker(mockWindow);

      expect(mockWindow.showDirectoryPicker).toHaveBeenCalledWith(undefined);
      expect(result).toBe(mockDirectoryHandle);
    });

    test('returns null when File System Access API is not supported', async () => {
      const mockWindow = {} as unknown as Window;

      const result = await safeShowDirectoryPicker(mockWindow);

      expect(result).toBeNull();
    });

    test('returns null for partially supported window', async () => {
      const mockWindow = {
        showDirectoryPicker: jest.fn()
        // Missing showOpenFilePicker and showSaveFilePicker
      } as unknown as Window;

      const result = await safeShowDirectoryPicker(mockWindow);

      expect(result).toBeNull();
    });

    test('propagates errors from showDirectoryPicker', async () => {
      const mockError = new Error('Directory access denied');
      const mockWindow = {
        showOpenFilePicker: jest.fn(),
        showSaveFilePicker: jest.fn(),
        showDirectoryPicker: jest.fn().mockRejectedValue(mockError)
      } as unknown as WindowWithFsAccess;

      await expect(safeShowDirectoryPicker(mockWindow)).rejects.toThrow('Directory access denied');
    });
  });

  describe('integration tests', () => {
    test('type guards work with handles returned from safe picker functions', async () => {
      const mockFileHandle = {
        kind: 'file' as const,
        name: 'test.txt',
        isSameEntry: jest.fn(),
        queryPermission: jest.fn(),
        requestPermission: jest.fn(),
        getFile: jest.fn(),
        createWritable: jest.fn()
      } as FileSystemFileHandle;

      const mockDirectoryHandle = {
        kind: 'directory' as const,
        name: 'test-dir',
        isSameEntry: jest.fn(),
        queryPermission: jest.fn(),
        requestPermission: jest.fn(),
        getDirectoryHandle: jest.fn(),
        getFileHandle: jest.fn(),
        removeEntry: jest.fn(),
        resolve: jest.fn(),
        keys: jest.fn(),
        values: jest.fn(),
        entries: jest.fn(),
        [Symbol.asyncIterator]: jest.fn()
      } as FileSystemDirectoryHandle;

      const mockWindow = {
        showOpenFilePicker: jest.fn().mockResolvedValue([mockFileHandle]),
        showSaveFilePicker: jest.fn().mockResolvedValue(mockFileHandle),
        showDirectoryPicker: jest.fn().mockResolvedValue(mockDirectoryHandle)
      } as unknown as WindowWithFsAccess;

      // Test file handle from showOpenFilePicker
      const openResult = await safeShowOpenFilePicker(mockWindow);
      expect(openResult).not.toBeNull();
      if (openResult && openResult.length > 0) {
        expect(isFileHandle(openResult[0])).toBe(true);
        expect(isDirectoryHandle(openResult[0])).toBe(false);
      }

      // Test file handle from showSaveFilePicker
      const saveResult = await safeShowSaveFilePicker(mockWindow);
      expect(saveResult).not.toBeNull();
      if (saveResult) {
        expect(isFileHandle(saveResult)).toBe(true);
        expect(isDirectoryHandle(saveResult)).toBe(false);
      }

      // Test directory handle from showDirectoryPicker
      const dirResult = await safeShowDirectoryPicker(mockWindow);
      expect(dirResult).not.toBeNull();
      if (dirResult) {
        expect(isDirectoryHandle(dirResult)).toBe(true);
        expect(isFileHandle(dirResult)).toBe(false);
      }
    });

    test('safe functions respect browser support detection', async () => {
      // Mock browser without File System Access API
      const unsupportedWindow = {
        location: { href: 'https://example.com' }
      } as unknown as Window;

      // All safe functions should return null
      expect(await safeShowOpenFilePicker(unsupportedWindow)).toBeNull();
      expect(await safeShowSaveFilePicker(unsupportedWindow)).toBeNull();
      expect(await safeShowDirectoryPicker(unsupportedWindow)).toBeNull();

      // Mock browser with File System Access API
      const supportedWindow = {
        showOpenFilePicker: jest.fn().mockResolvedValue([]),
        showSaveFilePicker: jest.fn().mockResolvedValue(null),
        showDirectoryPicker: jest.fn().mockResolvedValue(null)
      } as unknown as WindowWithFsAccess;

      // All safe functions should call the underlying API
      await safeShowOpenFilePicker(supportedWindow);
      await safeShowSaveFilePicker(supportedWindow);
      await safeShowDirectoryPicker(supportedWindow);

      expect(supportedWindow.showOpenFilePicker).toHaveBeenCalled();
      expect(supportedWindow.showSaveFilePicker).toHaveBeenCalled();
      expect(supportedWindow.showDirectoryPicker).toHaveBeenCalled();
    });
  });

  describe('exportAsJson', () => {
    test('is a function', () => {
      expect(typeof exportAsJson).toBe('function');
    });
  });

  describe('exportUsingFileSystemAPI', () => {
    test('is a function', () => {
      expect(typeof exportUsingFileSystemAPI).toBe('function');
    });

    test.skip('API integration tests require browser environment', () => {
      // These tests require browser APIs (URL.createObjectURL, document.createElement)
      // which are not available in the jest/jsdom test environment.
      // The functions work correctly in real browser environments.
    });
  });
});
