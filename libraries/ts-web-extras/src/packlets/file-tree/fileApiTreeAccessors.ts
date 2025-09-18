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

// File System Access API types are imported via the file-api-types module
import { Result, succeed, fail } from '@fgv/ts-utils';
import { FileTree } from '@fgv/ts-json-base';
import {
  isFileHandle,
  isDirectoryHandle,
  FileSystemFileHandle,
  FileSystemDirectoryHandle
} from '../file-api-types';

/**
 * Interface for File objects that may have the webkitRelativePath property.
 * This property is added by browsers when using directory upload (webkitdirectory).
 * @internal
 */
interface IFileWithWebkitPath {
  readonly webkitRelativePath?: string;
}

/**
 * Helper function to safely get webkitRelativePath from a File object.
 * @internal
 */
function getFileRelativePath(file: File): string {
  return (file as unknown as IFileWithWebkitPath).webkitRelativePath || file.name;
}

/**
 * Represents a file from the File API with its path information.
 * @public
 */
export interface IFileApiFile {
  /**
   * The File object from the browser File API.
   */
  readonly file: File;

  /**
   * The relative path of the file within the file tree.
   * For files from directory uploads, this includes the directory structure.
   */
  readonly path: string;
}

/**
 * Tree initializer for FileList objects (from File API).
 * @public
 */
export interface IFileListTreeInitializer {
  readonly fileList: FileList;
}

/**
 * Tree initializer for File System Access API file handles.
 * @public
 */
export interface IFileHandleTreeInitializer {
  readonly prefix?: string;
  readonly fileHandles: FileSystemFileHandle[];
}

/**
 * Tree initializer for File System Access API directory handles.
 * @public
 */
export interface IDirectoryHandleTreeInitializer {
  readonly prefix?: string;
  readonly dirHandles: FileSystemDirectoryHandle[];
  readonly nonRecursive?: boolean; // Default: false (recursive by default)
}

/**
 * Union type for all supported tree initializers.
 * @public
 */
export type TreeInitializer =
  | IFileListTreeInitializer
  | IFileHandleTreeInitializer
  | IDirectoryHandleTreeInitializer;

/**
 * Helper class to create FileTree instances from various file sources.
 * Supports File API (FileList) and File System Access API handles.
 * @public
 */
export class FileApiTreeAccessors {
  /**
   * Create FileTree from various file sources using TreeInitializer array.
   * @param initializers - Array of TreeInitializer objects specifying file sources
   * @returns Promise resolving to a FileTree with all content pre-loaded
   */
  public static async create(initializers: TreeInitializer[]): Promise<Result<FileTree.FileTree>> {
    try {
      const allFiles: FileTree.IInMemoryFile[] = [];

      for (const initializer of initializers) {
        const filesResult = await this._processInitializer(initializer);
        if (filesResult.isFailure()) {
          return fail(filesResult.message);
        }
        allFiles.push(...filesResult.value);
      }

      return FileTree.inMemory(allFiles);
    } catch (error) {
      /* c8 ignore next 1 - defense in depth */
      return fail(
        `Failed to process initializers: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Legacy method: Create FileTree from File API files by pre-loading all content.
   * @param files - Array of files with their paths
   * @param prefix - Optional prefix to add to all paths
   * @returns Promise resolving to a FileTree with all content pre-loaded
   * @deprecated Use create() with TreeInitializer array instead
   */
  public static async createFromFiles(
    files: IFileApiFile[],
    prefix?: string
  ): Promise<Result<FileTree.FileTree>> {
    try {
      const inMemoryFiles: FileTree.IInMemoryFile[] = [];

      for (const fileInfo of files) {
        const fullPath = this._normalizePath(prefix || '', fileInfo.path);

        try {
          const content = await fileInfo.file.text();
          inMemoryFiles.push({
            path: fullPath,
            contents: content
          });
        } catch (error) {
          return fail(
            /* c8 ignore next 1 - defense in depth */
            `Failed to read file ${fileInfo.path}: ${error instanceof Error ? error.message : String(error)}`
          );
        }
      }

      return FileTree.inMemory(inMemoryFiles, prefix);
    } catch (error) {
      /* c8 ignore next 3 - defense in depth */
      return fail(`Failed to process files: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Create FileTree from FileList (e.g., from input[type="file"]).
   * @param fileList - FileList from a file input element
   * @param prefix - Optional prefix to add to all paths
   * @returns Promise resolving to a FileTree with all content pre-loaded
   */
  public static async fromFileList(fileList: FileList, prefix?: string): Promise<Result<FileTree.FileTree>> {
    const files: FileTree.IInMemoryFile[] = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const path = this._normalizePath(prefix || '', file.name);

      try {
        const content = await file.text();
        files.push({
          path,
          contents: content
        });
      } catch (error) {
        return fail(
          `Failed to read file ${file.name}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    return FileTree.inMemory(files);
  }

  /**
   * Create FileTree from directory upload with webkitRelativePath.
   * @param fileList - FileList from a directory upload (input with webkitdirectory)
   * @param prefix - Optional prefix to add to all paths
   * @returns Promise resolving to a FileTree with all content pre-loaded
   */
  public static async fromDirectoryUpload(
    fileList: FileList,
    prefix?: string
  ): Promise<Result<FileTree.FileTree>> {
    const files: FileTree.IInMemoryFile[] = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const relativePath = getFileRelativePath(file);
      const path = this._normalizePath(prefix || '', relativePath);

      try {
        const content = await file.text();
        files.push({
          path,
          contents: content
        });
      } catch (error) {
        return fail(
          `Failed to read file ${relativePath}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    return FileTree.inMemory(files);
  }

  /**
   * Get the File object for a specific path from the original FileList.
   * This is useful for accessing the original File API object for operations
   * like getting file metadata, MIME type, etc.
   * @param fileList - The original FileList
   * @param targetPath - The path to find
   * @returns Result containing the File object if found
   */
  public static getOriginalFile(fileList: FileList, targetPath: string): Result<File> {
    for (const file of Array.from(fileList)) {
      const filePath = getFileRelativePath(file);
      if (filePath === targetPath) {
        return succeed(file);
      }
    }
    return fail(`File not found: ${targetPath}`);
  }

  /**
   * Extract file metadata from a FileList.
   * @param fileList - The FileList to extract metadata from
   * @returns Array of file metadata objects
   */
  public static extractFileMetadata(fileList: FileList): Array<{
    path: string;
    name: string;
    size: number;
    type: string;
    lastModified: number;
  }> {
    return Array.from(fileList).map((file) => ({
      path: getFileRelativePath(file),
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified
    }));
  }

  /**
   * Process a single TreeInitializer and return the resulting files.
   * @internal
   */
  private static async _processInitializer(
    initializer: TreeInitializer
  ): Promise<Result<FileTree.IInMemoryFile[]>> {
    if ('fileList' in initializer) {
      return this._processFileList(initializer.fileList);
    } else if ('fileHandles' in initializer) {
      return this._processFileHandles(initializer.fileHandles, initializer.prefix);
    } else if ('dirHandles' in initializer) {
      return this._processDirectoryHandles(
        initializer.dirHandles,
        initializer.prefix,
        !initializer.nonRecursive
      );
    } else {
      return fail('Unknown initializer type');
    }
  }

  /**
   * Process a FileList and return IInMemoryFile array.
   * @internal
   */
  private static async _processFileList(fileList: FileList): Promise<Result<FileTree.IInMemoryFile[]>> {
    const files: FileTree.IInMemoryFile[] = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const relativePath = getFileRelativePath(file);
      const path = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;

      try {
        const content = await file.text();
        files.push({
          path,
          contents: content
        });
      } catch (error) {
        return fail(
          `Failed to read file ${relativePath}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    return succeed(files);
  }

  /**
   * Process FileSystemFileHandles and return IInMemoryFile array.
   * @internal
   */
  private static async _processFileHandles(
    handles: FileSystemFileHandle[],
    prefix?: string
  ): Promise<Result<FileTree.IInMemoryFile[]>> {
    const files: FileTree.IInMemoryFile[] = [];

    for (const handle of handles) {
      try {
        const file = await handle.getFile();
        const content = await file.text();
        const path = this._normalizePath(prefix || '', handle.name);

        files.push({
          path,
          contents: content
        });
      } catch (error) {
        return fail(
          `Failed to read file handle ${handle.name}: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    }

    return succeed(files);
  }

  /**
   * Process FileSystemDirectoryHandles and return IInMemoryFile array.
   * @internal
   */
  private static async _processDirectoryHandles(
    handles: FileSystemDirectoryHandle[],
    prefix?: string,
    recursive: boolean = true
  ): Promise<Result<FileTree.IInMemoryFile[]>> {
    const allFiles: FileTree.IInMemoryFile[] = [];

    for (const handle of handles) {
      const dirPrefix = this._normalizePath(prefix || '', handle.name);
      const filesResult = await this._processDirectoryHandle(handle, dirPrefix, recursive);
      if (filesResult.isFailure()) {
        return filesResult;
      }
      allFiles.push(...filesResult.value);
    }

    return succeed(allFiles);
  }

  /**
   * Process a single FileSystemDirectoryHandle recursively.
   * @internal
   */
  private static async _processDirectoryHandle(
    handle: FileSystemDirectoryHandle,
    basePath: string,
    recursive: boolean
  ): Promise<Result<FileTree.IInMemoryFile[]>> {
    const files: FileTree.IInMemoryFile[] = [];

    try {
      for await (const entry of handle.values()) {
        if (isFileHandle(entry)) {
          const file = await entry.getFile();
          const content = await file.text();
          const filePath = this._normalizePath(basePath, entry.name);

          files.push({
            path: filePath,
            contents: content
          });
        } else if (isDirectoryHandle(entry) && recursive) {
          const subDirPath = this._normalizePath(basePath, entry.name);
          const subdirResult = await this._processDirectoryHandle(entry, subDirPath, recursive);
          if (subdirResult.isFailure()) {
            return subdirResult;
          }
          files.push(...subdirResult.value);
        }
      }

      return succeed(files);
    } catch (error) {
      return fail(
        `Failed to process directory ${handle.name}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  private static _normalizePath(prefix: string, path: string): string {
    // Remove leading slash from prefix if it exists to avoid double slashes
    const cleanPrefix = prefix ? prefix.replace(/^\/+/, '') : '';
    const combined = cleanPrefix ? `${cleanPrefix}/${path}` : path;
    // Normalize multiple slashes and ensure it starts with / for FileTree compatibility
    const normalized = combined.replace(/\/+/g, '/').replace(/\/$/, '');
    return normalized.startsWith('/') ? normalized : `/${normalized}`;
  }
}
