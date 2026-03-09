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

import { FileSystemDirectoryHandle, FileSystemFileHandle } from '../../packlets/file-api-types';
import { createMockFile } from './testHelpers';

/**
 * Mock file data for File System Access API
 */
export interface MockFileData {
  content: string;
  type: string;
  failOnRead?: boolean;
  failOnWrite?: boolean;
}

/**
 * Options for mock directory handle
 */
export interface MockDirectoryOptions {
  hasWritePermission?: boolean;
  permissionError?: boolean;
  permissionStatus?: PermissionState;
  requestGranted?: boolean;
}

/**
 * Mock implementation of FileSystemWritableFileStream
 */
export class MockFileSystemWritableFileStream {
  private _content: string = '';
  private _closed: boolean = false;
  private readonly _onWrite: (content: string) => void;
  private readonly _failOnWrite: boolean;

  constructor(onWrite: (content: string) => void, failOnWrite: boolean = false) {
    this._onWrite = onWrite;
    this._failOnWrite = failOnWrite;
  }

  get locked(): boolean {
    return false;
  }

  async write(data: string | BufferSource | Blob): Promise<void> {
    if (this._closed) {
      throw new Error('Stream is closed');
    }
    if (this._failOnWrite) {
      throw new Error('Write operation failed');
    }

    if (typeof data === 'string') {
      this._content = data;
    } else if (data instanceof Blob) {
      this._content = await data.text();
    } else {
      const decoder = new TextDecoder();
      this._content = decoder.decode(data as BufferSource);
    }
  }

  async seek(position: number): Promise<void> {
    // Mock implementation - not used in our tests
  }

  async truncate(size: number): Promise<void> {
    // Mock implementation - not used in our tests
  }

  async close(): Promise<void> {
    if (!this._closed) {
      this._closed = true;
      this._onWrite(this._content);
    }
  }

  async abort(): Promise<void> {
    this._closed = true;
  }

  getWriter(): WritableStreamDefaultWriter {
    throw new Error('getWriter not implemented in mock');
  }
}

/**
 * Options for mock file handle
 */
export interface MockFileHandleOptions {
  hasWritePermission?: boolean;
  permissionStatus?: PermissionState;
  requestGranted?: boolean;
}

/**
 * Mock implementation of FileSystemFileHandle
 */
export function createMockFileHandle(
  name: string,
  data: MockFileData,
  onWrite?: (content: string) => void,
  options: MockFileHandleOptions = {}
): FileSystemFileHandle {
  let currentContent = data.content;
  const { hasWritePermission = true, permissionStatus, requestGranted = true } = options;

  const handle = {
    kind: 'file' as const,
    name,

    async getFile(): Promise<File> {
      if (data.failOnRead) {
        throw new Error('Failed to read file');
      }
      return createMockFile({
        name,
        content: currentContent,
        type: data.type
      });
    },

    async createWritable(): Promise<MockFileSystemWritableFileStream> {
      return new MockFileSystemWritableFileStream((content) => {
        currentContent = content;
        if (onWrite) {
          onWrite(content);
        }
      }, data.failOnWrite);
    },

    async queryPermission(descriptor?: { mode?: 'read' | 'readwrite' }): Promise<PermissionState> {
      if (permissionStatus) {
        return permissionStatus;
      }
      if (descriptor?.mode === 'readwrite' && !hasWritePermission) {
        return 'denied';
      }
      return 'granted';
    },

    async requestPermission(descriptor?: { mode?: 'read' | 'readwrite' }): Promise<PermissionState> {
      if (permissionStatus === 'prompt') {
        return requestGranted ? 'granted' : 'denied';
      }
      if (descriptor?.mode === 'readwrite' && !hasWritePermission) {
        return 'denied';
      }
      return 'granted';
    },

    isSameEntry: async (other: FileSystemFileHandle): Promise<boolean> => {
      return other === handle;
    }
  };

  return handle as FileSystemFileHandle;
}

/**
 * Parse file structure into nested map
 */
function parseFileStructure(
  files: Record<string, MockFileData>
): Map<string, Map<string, MockFileData> | MockFileData> {
  const root = new Map<string, Map<string, MockFileData> | MockFileData>();

  for (const [path, data] of Object.entries(files)) {
    const parts = path.split('/').filter((p) => p.length > 0);
    let current = root;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!current.has(part)) {
        current.set(part, new Map<string, MockFileData>());
      }
      current = current.get(part) as Map<string, MockFileData>;
    }

    const filename = parts[parts.length - 1];
    current.set(filename, data);
  }

  return root;
}

/**
 * Mock implementation of FileSystemDirectoryHandle
 */
export function createMockDirectoryHandle(
  name: string,
  files: Record<string, MockFileData>,
  options: MockDirectoryOptions = {}
): FileSystemDirectoryHandle {
  const {
    hasWritePermission = true,
    permissionError = false,
    permissionStatus,
    requestGranted = true
  } = options;
  const structure = parseFileStructure(files);
  const fileHandles = new Map<string, FileSystemFileHandle>();
  const dirHandles = new Map<string, FileSystemDirectoryHandle>();

  // Create file handles for all files
  for (const [path, data] of Object.entries(files)) {
    const handle = createMockFileHandle(path.split('/').pop() || '', data, (content) => {
      // Update the file content when written
      files[path] = { ...data, content };
    });
    fileHandles.set(path, handle);
  }

  function createSubDirectoryHandle(
    dirName: string,
    subStructure: Map<string, Map<string, MockFileData> | MockFileData>,
    parentPath: string
  ): FileSystemDirectoryHandle {
    // For root directory, currentPath should be empty string
    const currentPath = dirName === '/' ? '' : parentPath ? `${parentPath}/${dirName}` : dirName;

    const handle = {
      kind: 'directory' as const,
      name: dirName,

      async *entries(): AsyncIterableIterator<[string, FileSystemFileHandle | FileSystemDirectoryHandle]> {
        for (const [itemName, item] of subStructure.entries()) {
          if (item instanceof Map) {
            const subDirHandle = createSubDirectoryHandle(itemName, item, currentPath);
            yield [itemName, subDirHandle];
          } else {
            const filePath = currentPath ? `${currentPath}/${itemName}` : itemName;
            const fileHandle = fileHandles.get(filePath);
            if (fileHandle) {
              yield [itemName, fileHandle];
            }
          }
        }
      },

      async getFileHandle(fileName: string, options?: { create?: boolean }): Promise<FileSystemFileHandle> {
        const filePath = currentPath ? `${currentPath}/${fileName}` : fileName;
        let handle = fileHandles.get(filePath);

        if (!handle && options?.create) {
          const newData: MockFileData = { content: '', type: 'text/plain' };
          files[filePath] = newData;
          handle = createMockFileHandle(fileName, newData, (content) => {
            files[filePath] = { ...newData, content };
          });
          fileHandles.set(filePath, handle);

          // Add to structure
          subStructure.set(fileName, newData);
        }

        if (!handle) {
          throw new Error(`File not found: ${fileName}`);
        }

        return handle;
      },

      async getDirectoryHandle(
        dirName: string,
        options?: { create?: boolean }
      ): Promise<FileSystemDirectoryHandle> {
        const dirPath = currentPath ? `${currentPath}/${dirName}` : dirName;
        let dirHandle = dirHandles.get(dirPath);

        if (!dirHandle) {
          let subDir = subStructure.get(dirName);
          if (!subDir && options?.create) {
            subDir = new Map<string, MockFileData>();
            subStructure.set(dirName, subDir);
          }

          if (subDir instanceof Map) {
            dirHandle = createSubDirectoryHandle(dirName, subDir, currentPath);
            dirHandles.set(dirPath, dirHandle);
          }
        }

        if (!dirHandle) {
          throw new Error(`Directory not found: ${dirName}`);
        }

        return dirHandle;
      },

      async removeEntry(name: string, options?: { recursive?: boolean }): Promise<void> {
        subStructure.delete(name);
      },

      async queryPermission(descriptor?: { mode?: 'read' | 'readwrite' }): Promise<PermissionState> {
        if (permissionError) {
          throw new Error('Permission query failed');
        }
        if (permissionStatus) {
          return permissionStatus;
        }
        if (descriptor?.mode === 'readwrite' && !hasWritePermission) {
          return 'denied';
        }
        return 'granted';
      },

      async requestPermission(descriptor?: { mode?: 'read' | 'readwrite' }): Promise<PermissionState> {
        if (permissionError) {
          throw new Error('Permission request failed');
        }
        if (permissionStatus === 'prompt') {
          return requestGranted ? 'granted' : 'denied';
        }
        if (descriptor?.mode === 'readwrite' && !hasWritePermission) {
          return 'denied';
        }
        return 'granted';
      },

      async resolve(possibleDescendant: FileSystemHandle): Promise<string[] | null> {
        return null;
      },

      isSameEntry: async (other: FileSystemDirectoryHandle): Promise<boolean> => {
        return other === handle;
      }
    };

    return handle as FileSystemDirectoryHandle;
  }

  return createSubDirectoryHandle(name, structure, '');
}
