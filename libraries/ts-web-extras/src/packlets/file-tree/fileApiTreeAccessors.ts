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

import { Result, succeed, fail } from '@fgv/ts-utils';
import { FileTree } from '@fgv/ts-json-base';

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
 * Helper class to create FileTree instances from File API files.
 * Uses async static methods to pre-load all file contents and create
 * synchronous InMemoryTreeAccessors.
 * @public
 */
export class FileApiTreeAccessors {
  /**
   * Create FileTree from File API files by pre-loading all content.
   * @param files - Array of files with their paths
   * @param prefix - Optional prefix to add to all paths
   * @returns Promise resolving to a FileTree with all content pre-loaded
   */
  public static async create(files: IFileApiFile[], prefix?: string): Promise<Result<FileTree.FileTree>> {
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
            `Failed to read file ${fileInfo.path}: ${error instanceof Error ? error.message : String(error)}`
          );
        }
      }

      return FileTree.inMemory(inMemoryFiles, prefix);
    } catch (error) {
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
    const files: IFileApiFile[] = Array.from(fileList).map((file) => ({
      file,
      path: file.name
    }));
    return FileApiTreeAccessors.create(files, prefix);
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
    const files: IFileApiFile[] = Array.from(fileList).map((file) => ({
      file,
      path: getFileRelativePath(file)
    }));
    return FileApiTreeAccessors.create(files, prefix);
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

  private static _normalizePath(prefix: string, path: string): string {
    // Remove leading slash from prefix if it exists to avoid double slashes
    const cleanPrefix = prefix ? prefix.replace(/^\/+/, '') : '';
    const combined = cleanPrefix ? `${cleanPrefix}/${path}` : path;
    // Normalize multiple slashes and ensure it starts with / for FileTree compatibility
    const normalized = combined.replace(/\/+/g, '/').replace(/\/$/, '');
    return normalized.startsWith('/') ? normalized : `/${normalized}`;
  }
}
