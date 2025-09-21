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
import { FileApiTreeAccessors, IFileMetadata } from '../file-tree/fileApiTreeAccessors';

/**
 * Default initialization parameters for a `FileTree` using {@link FileApiTreeAccessors}.
 * @public
 */
export const defaultFileApiTreeInitParams: FileTree.IFileTreeInitParams<string> = {
  inferContentType: FileTree.FileItem.defaultAcceptContentType
};

/**
 * Helper function to create a new FileTree instance
 * from a browser FileList (e.g., from input[type="file"]).
 * @param fileList - FileList from a file input element
 * @param params - Optional `IFileTreeInitParams` for the file tree.
 * @returns Promise resolving to a successful Result with the new FileTree instance
 * if successful, or a failed Result with an error message otherwise
 * @remarks The content type of the files is always `string` and the default
 * accept contentType function (`FileTree.FileItem.defaultAcceptContentType`) is
 * used, so content type is derived from the mime type of the file, when
 * available.
 * @public
 */
export function fromFileList(
  fileList: FileList,
  params?: FileTree.IFileTreeInitParams<string>
): Promise<Result<FileTree.FileTree<string>>> {
  params = { ...defaultFileApiTreeInitParams, ...(params ?? {}) };
  return FileApiTreeAccessors.fromFileList(fileList, params);
}

/**
 * Helper function to create a new FileTree instance
 * from a directory upload with webkitRelativePath support.
 * @param fileList - FileList from a directory upload (input with webkitdirectory)
 * @param params - Optional `IFileTreeInitParams` for the file tree.
 * @returns Promise resolving to a successful Result with the new FileTree instance
 * if successful, or a failed Result with an error message otherwise
 * @remarks The content type of the files is always `string` and the default
 * accept contentType function (`FileTree.FileItem.defaultAcceptContentType`) is
 * is used, so content type is derived from the mime type of the file, when
 * available.
 * @public
 */
export function fromDirectoryUpload(
  fileList: FileList,
  params?: FileTree.IFileTreeInitParams<string>
): Promise<Result<FileTree.FileTree<string>>> {
  params = { ...defaultFileApiTreeInitParams, ...(params ?? {}) };
  return FileApiTreeAccessors.fromDirectoryUpload(fileList, params);
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
 * Helper function to extract metadata from a `FileList`.
 * @param fileList - The `FileList` to extract metadata from
 * @returns Array of {@link IFileMetadata | file metadata} objects
 * @public
 */
export function extractFileListMetadata(fileList: FileList): Array<IFileMetadata> {
  return Array.from(fileList).map((f) => FileApiTreeAccessors.extractFileMetadata(f));
}

/**
 * Helper function to extract metadata from a `File`.
 * @param file - The File to extract metadata from
 * @returns {@link IFileMetadata | file metadata} object
 * @public
 */
export function extractFileMetadata(file: File): IFileMetadata {
  return FileApiTreeAccessors.extractFileMetadata(file);
}
