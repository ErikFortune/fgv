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

import { FileTree, Result, succeed, fail } from '@fgv/ts-utils';
import { ImportedDirectory, ImportedFile } from './fileImport';

/**
 * Converts a FileTree item (directory or file) to ImportedDirectory/ImportedFile format
 * for compatibility with existing resource processing pipeline.
 */
export class FileTreeConverter {
  /**
   * Converts a FileTree directory to ImportedDirectory format.
   */
  public static convertDirectory(
    fileTree: FileTree.FileTree,
    directoryPath: string
  ): Result<ImportedDirectory> {
    try {
      const itemResult = fileTree.getItem(directoryPath);
      if (itemResult.isFailure()) {
        return fail(`Directory not found: ${directoryPath}`);
      }

      const item = itemResult.value;
      if (item.type !== 'directory') {
        return fail(`Path is not a directory: ${directoryPath}`);
      }

      const childrenResult = item.getChildren();
      if (childrenResult.isFailure()) {
        return fail(`Failed to get directory children: ${childrenResult.message}`);
      }

      const files: ImportedFile[] = [];
      const directories: ImportedDirectory[] = [];

      for (const child of childrenResult.value) {
        if (child.type === 'file') {
          const fileResult = this.convertFile(child);
          if (fileResult.isSuccess()) {
            files.push(fileResult.value);
          }
        } else if (child.type === 'directory') {
          const dirResult = this.convertDirectory(fileTree, child.absolutePath);
          if (dirResult.isSuccess()) {
            directories.push(dirResult.value);
          }
        }
      }

      const importedDirectory: ImportedDirectory = {
        name: item.name,
        path: item.absolutePath,
        files,
        directories
      };

      return succeed(importedDirectory);
    } catch (error) {
      return fail(`Failed to convert directory: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Converts a FileTree file item to ImportedFile format.
   */
  public static convertFile(fileItem: FileTree.IFileTreeFileItem): Result<ImportedFile> {
    try {
      const contentsResult = fileItem.getRawContents();
      if (contentsResult.isFailure()) {
        return fail(`Failed to read file contents: ${contentsResult.message}`);
      }

      const importedFile: ImportedFile = {
        name: fileItem.name,
        path: fileItem.absolutePath,
        content: contentsResult.value
      };

      return succeed(importedFile);
    } catch (error) {
      return fail(`Failed to convert file: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Converts multiple FileTree files to ImportedFile format.
   */
  public static convertFiles(fileItems: FileTree.IFileTreeFileItem[]): Result<ImportedFile[]> {
    try {
      const importedFiles: ImportedFile[] = [];

      for (const fileItem of fileItems) {
        const fileResult = this.convertFile(fileItem);
        if (fileResult.isSuccess()) {
          importedFiles.push(fileResult.value);
        } else {
          return fail(`Failed to convert file ${fileItem.name}: ${fileResult.message}`);
        }
      }

      return succeed(importedFiles);
    } catch (error) {
      return fail(`Failed to convert files: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Converts a FileTree path to ImportedDirectory or ImportedFile format,
   * automatically detecting the type.
   */
  public static convertPath(
    fileTree: FileTree.FileTree,
    path: string
  ): Result<ImportedDirectory | ImportedFile[]> {
    try {
      const itemResult = fileTree.getItem(path);
      if (itemResult.isFailure()) {
        return fail(`Path not found: ${path}`);
      }

      const item = itemResult.value;

      if (item.type === 'directory') {
        return this.convertDirectory(fileTree, path);
      } else if (item.type === 'file') {
        const fileResult = this.convertFile(item);
        if (fileResult.isSuccess()) {
          return succeed([fileResult.value]);
        } else {
          return fileResult;
        }
      } else {
        return fail(`Unknown item type: ${path}`);
      }
    } catch (error) {
      return fail(`Failed to convert path: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
