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
 * Interface for file metadata.
 * @public
 */
export interface IFileMetadata {
  path: string;
  name: string;
  size: number;
  type: string;
  lastModified: number;
}

/**
 * Helper class to create FileTree instances from various file sources.
 * Supports File API (FileList) and File System Access API handles.
 * @public
 */
export class FileApiTreeAccessors<TCT extends string = string> {
  /**
   * Create FileTree from various file sources using TreeInitializer array.
   * @param initializers - Array of TreeInitializer objects specifying file sources
   * @param params - Optional `IFileTreeInitParams` for the file tree.
   * @returns Promise resolving to a FileTree with all content pre-loaded
   */
  public static async create<TCT extends string = string>(
    initializers: TreeInitializer[],
    params?: FileTree.IFileTreeInitParams<TCT>
  ): Promise<Result<FileTree.FileTree<TCT>>> {
    try {
      const allFiles: FileTree.IInMemoryFile<TCT>[] = [];

      for (const initializer of initializers) {
        const filesResult = await this._processInitializer<TCT>(initializer, params);
        if (filesResult.isFailure()) {
          return fail(filesResult.message);
        }
        allFiles.push(...filesResult.value);
      }

      return FileTree.inMemory<TCT>(allFiles, params);
    } catch (error) {
      /* c8 ignore next 5 - defense in depth */
      const message = error instanceof Error ? error.message : String(error);
      return fail(`Failed to process initializers: ${message}`);
    }
  }

  /**
   * Create FileTree from FileList (e.g., from input[type="file"]).
   * @param fileList - FileList from a file input element
   * @param params - Optional `IFileTreeInitParams` for the file tree.
   * @returns Promise resolving to a FileTree with all content pre-loaded
   */
  public static async fromFileList<TCT extends string = string>(
    fileList: FileList,
    params?: FileTree.IFileTreeInitParams<TCT>
  ): Promise<Result<FileTree.FileTree<TCT>>> {
    const files: FileTree.IInMemoryFile<TCT>[] = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const path = this._normalizePath(params?.prefix || '', file.name);

      try {
        const contents = await file.text();
        const contentType = params?.inferContentType?.(path, file.type).orDefault();
        files.push({
          path,
          contents,
          contentType
        });
      } catch (error) {
        /* c8 ignore next 1 - defense in depth */
        const message = error instanceof Error ? error.message : String(error);
        return fail(`Failed to read file ${file.name}: ${message}`);
      }
    }

    return FileTree.inMemory<TCT>(files, params);
  }

  /**
   * Create FileTree from directory upload with webkitRelativePath.
   * @param fileList - FileList from a directory upload (input with webkitdirectory)
   * @param params - Optional `IFileTreeInitParams` for the file tree.
   * @returns Promise resolving to a FileTree with all content pre-loaded
   */
  public static async fromDirectoryUpload<TCT extends string = string>(
    fileList: FileList,
    params?: FileTree.IFileTreeInitParams<TCT>
  ): Promise<Result<FileTree.FileTree<TCT>>> {
    const files: FileTree.IInMemoryFile<TCT>[] = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const relativePath = getFileRelativePath(file);
      const path = this._normalizePath(params?.prefix || '', relativePath);

      try {
        const contents = await file.text();
        const contentType = params?.inferContentType?.(path, file.type).orDefault();
        files.push({
          path,
          contents,
          contentType
        });
      } catch (error) {
        /* c8 ignore next 1 - defense in depth */
        const message = error instanceof Error ? error.message : String(error);
        return fail(`Failed to read file ${relativePath}: ${message}`);
      }
    }

    return FileTree.inMemory<TCT>(files, params);
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
   * Extract file metadata from a File.
   * @param fileList - The File to extract metadata from
   * @returns The {@link IFileMetadata | file metadata}
   */
  public static extractFileMetadata(file: File): IFileMetadata {
    return {
      path: getFileRelativePath(file),
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified
    };
  }

  /**
   * Process a single TreeInitializer and return the resulting files.
   * @param initializer - The TreeInitializer to process
   * @param params - Optional `IFileTreeInitParams` for the file tree.
   * @returns Promise resolving to an array of `IInMemoryFile` objects
   * @internal
   */
  private static async _processInitializer<TCT extends string = string>(
    initializer: TreeInitializer,
    params?: FileTree.IFileTreeInitParams<TCT>
  ): Promise<Result<FileTree.IInMemoryFile<TCT>[]>> {
    if ('fileList' in initializer) {
      return this._processFileList<TCT>(initializer.fileList, params);
    } else if ('fileHandles' in initializer) {
      return this._processFileHandles<TCT>(initializer.fileHandles, params);
    } else if ('dirHandles' in initializer) {
      return this._processDirectoryHandles<TCT>(
        initializer.dirHandles,
        initializer.prefix ?? params?.prefix,
        !initializer.nonRecursive,
        params
      );
    } else {
      return fail('Unknown initializer type');
    }
  }

  /**
   * Process a FileList and return IInMemoryFile array.
   * @param fileList - The FileList to process
   * @param params - Optional `IFileTreeInitParams` for the file tree.
   * @returns Promise resolving to an array of `IInMemoryFile` objects
   * @internal
   */
  private static async _processFileList<TCT extends string = string>(
    fileList: FileList,
    params?: FileTree.IFileTreeInitParams<TCT>
  ): Promise<Result<FileTree.IInMemoryFile<TCT>[]>> {
    const files: FileTree.IInMemoryFile<TCT>[] = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const metadata = this.extractFileMetadata(file);
      const relativePath = metadata.path;
      const path = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;

      try {
        const contents = await file.text();
        const contentType = params?.inferContentType?.(path, metadata.type).orDefault();
        files.push({
          path,
          contents,
          contentType
        });
      } catch (error) {
        /* c8 ignore next 1 - defense in depth */
        const message = error instanceof Error ? error.message : String(error);
        return fail(`Failed to read file ${relativePath}: ${message}`);
      }
    }

    return succeed(files);
  }

  /**
   * Process FileSystemFileHandles and return IInMemoryFile array.
   * @internal
   */
  private static async _processFileHandles<TCT extends string = string>(
    handles: FileSystemFileHandle[],
    params?: FileTree.IFileTreeInitParams<TCT>
  ): Promise<Result<FileTree.IInMemoryFile<TCT>[]>> {
    const files: FileTree.IInMemoryFile<TCT>[] = [];

    for (const handle of handles) {
      try {
        const file = await handle.getFile();
        const contents = await file.text();
        const metadata = this.extractFileMetadata(file);
        /* c8 ignore next 1 - defense in depth */
        const path = this._normalizePath(params?.prefix ?? '', handle.name);
        const contentType = params?.inferContentType?.(path, metadata.type).orDefault();

        files.push({
          path,
          contents,
          contentType
        });
      } catch (error) {
        /* c8 ignore next 1 - defense in depth */
        const message = error instanceof Error ? error.message : String(error);
        return fail(`Failed to read file handle ${handle.name}: ${message}`);
      }
    }

    return succeed(files);
  }

  /**
   * Process FileSystemDirectoryHandles and return IInMemoryFile array.
   * @param handles - The FileSystemDirectoryHandle[] to process
   * @param prefix - The prefix to use for the file paths
   * @param recursive - Whether to process the directory recursively
   * @param params - Optional `IFileTreeInitParams` for the file tree.
   * @returns Promise resolving to an array of `IInMemoryFile` objects
   * @internal
   */
  private static async _processDirectoryHandles<TCT extends string = string>(
    handles: FileSystemDirectoryHandle[],
    prefix?: string,
    recursive: boolean = true,
    params?: FileTree.IFileTreeInitParams<TCT>
  ): Promise<Result<FileTree.IInMemoryFile<TCT>[]>> {
    const allFiles: FileTree.IInMemoryFile<TCT>[] = [];
    prefix = prefix ?? params?.prefix;

    for (const handle of handles) {
      const dirPrefix = this._normalizePath(prefix ?? '', handle.name);
      const filesResult = await this._processDirectoryHandle<TCT>(handle, dirPrefix, recursive, params);
      if (filesResult.isFailure()) {
        return filesResult;
      }
      allFiles.push(...filesResult.value);
    }

    return succeed(allFiles);
  }

  /**
   * Process a single FileSystemDirectoryHandle recursively.
   * @param handle - The FileSystemDirectoryHandle to process
   * @param basePath - The base path to use for the file paths
   * @param recursive - Whether to process the directory recursively
   * @param params - Optional `IFileTreeInitParams` for the file tree.
   * @returns Promise resolving to an array of `IInMemoryFile` objects
   * @internal
   */
  private static async _processDirectoryHandle<TCT extends string = string>(
    handle: FileSystemDirectoryHandle,
    basePath: string,
    recursive: boolean,
    params?: FileTree.IFileTreeInitParams<TCT>
  ): Promise<Result<FileTree.IInMemoryFile<TCT>[]>> {
    const files: FileTree.IInMemoryFile<TCT>[] = [];

    try {
      for await (const entry of handle.values()) {
        if (isFileHandle(entry)) {
          const file = await entry.getFile();
          const contents = await file.text();
          const path = this._normalizePath(basePath, entry.name);
          const contentType = params?.inferContentType?.(path).orDefault();

          files.push({
            path,
            contents,
            contentType
          });
        } else if (isDirectoryHandle(entry) && recursive) {
          const subDirPath = this._normalizePath(basePath, entry.name);
          const subdirResult = await this._processDirectoryHandle<TCT>(entry, subDirPath, recursive, params);
          if (subdirResult.isFailure()) {
            return subdirResult;
          }
          files.push(...subdirResult.value);
        }
      }

      return succeed(files);
    } catch (error) {
      /* c8 ignore next 1 - defense in depth */
      const message = error instanceof Error ? error.message : String(error);
      return fail(`Failed to process directory ${handle.name}: ${message}`);
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
