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

import { Result } from '@fgv/ts-utils';
import { FileTree } from '@fgv/ts-json-base';
import { FileApiTreeAccessors, IFileApiFile } from '../file-tree/fileApiTreeAccessors';

/**
 * Helper function to create a new FileTree instance
 * from a browser FileList (e.g., from input[type="file"]).
 * @param fileList - FileList from a file input element
 * @param prefix - An optional prefix to add to the paths of all files in the tree
 * @returns Promise resolving to a successful Result with the new FileTree instance
 * if successful, or a failed Result with an error message otherwise
 * @public
 */
export function fromFileList(fileList: FileList, prefix?: string): Promise<Result<FileTree.FileTree>> {
  return FileApiTreeAccessors.fromFileList(fileList, prefix);
}

/**
 * Helper function to create a new FileTree instance
 * from a directory upload with webkitRelativePath support.
 * @param fileList - FileList from a directory upload (input with webkitdirectory)
 * @param prefix - An optional prefix to add to the paths of all files in the tree
 * @returns Promise resolving to a successful Result with the new FileTree instance
 * if successful, or a failed Result with an error message otherwise
 * @public
 */
export function fromDirectoryUpload(fileList: FileList, prefix?: string): Promise<Result<FileTree.FileTree>> {
  return FileApiTreeAccessors.fromDirectoryUpload(fileList, prefix);
}

/**
 * Helper function to create a new FileTree instance
 * from an array of File API files with their paths.
 * @param files - Array of {@link IFileApiFile | File API files} with path information
 * @param prefix - An optional prefix to add to the paths of all files in the tree
 * @returns Promise resolving to a successful Result with the new FileTree instance
 * if successful, or a failed Result with an error message otherwise
 * @public
 */
export function fromFileApiFiles(files: IFileApiFile[], prefix?: string): Promise<Result<FileTree.FileTree>> {
  return FileApiTreeAccessors.create(files, prefix);
}

/**
 * Helper function to get the original File object from a FileList by path.
 * @param fileList - The original FileList
 * @param path - The path to the file
 * @returns A successful Result with the File object if found,
 * or a failed Result with an error message otherwise
 * @public
 */
export function getOriginalFile(fileList: FileList, path: string): Result<File> {
  return FileApiTreeAccessors.getOriginalFile(fileList, path);
}

/**
 * Helper function to extract metadata from a FileList.
 * @param fileList - The FileList to extract metadata from
 * @returns Array of file metadata objects
 * @public
 */
export function extractFileMetadata(fileList: FileList): Array<{
  path: string;
  name: string;
  size: number;
  type: string;
  lastModified: number;
}> {
  return FileApiTreeAccessors.extractFileMetadata(fileList);
}
