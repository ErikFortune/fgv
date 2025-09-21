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

import { captureResult, Result } from '@fgv/ts-utils';
import { FileTree } from './fileTree';
import { FsFileTreeAccessors } from './fsTree';
import { IInMemoryFile, InMemoryTreeAccessors } from './in-memory';
import { IFileTreeInitParams } from './fileTreeAccessors';

/**
 * Helper function to create a new {@link FileTree.FileTree | FileTree} instance
 * with accessors for the filesystem.
 * @param prefix - An optional prefix to prepended to supplied relative paths.
 * @returns `Success` with the new {@link FileTree.FileTree | FileTree} instance
 * if successful, or `Failure` with an error message otherwise.
 * @public
 */
export function forFilesystem<TCT extends string = string>(prefix?: string): Result<FileTree<TCT>>;

/**
 * Helper function to create a new {@link FileTree.FileTree | FileTree} instance
 * with accessors for the filesystem.
 * @param params - Optional {@link FileTree.IFileTreeInitParams | initialization parameters} for the file tree.
 * @returns `Success` with the new {@link FileTree.FileTree | FileTree} instance
 * if successful, or `Failure` with an error message otherwise.
 * @public
 */
export function forFilesystem<TCT extends string = string>(
  params?: IFileTreeInitParams<TCT>
): Result<FileTree<TCT>>;
export function forFilesystem<TCT extends string = string>(
  params?: IFileTreeInitParams<TCT> | string
): Result<FileTree<TCT>> {
  params = typeof params === 'string' ? { prefix: params } : params;
  return captureResult(() => new FsFileTreeAccessors<TCT>(params)).onSuccess((hal) => FileTree.create(hal));
}

/**
 * Helper function to create a new {@link FileTree.FileTree | FileTree} instance
 * with accessors for an in-memory file tree.
 * @param files - An array of File |{@link FileTree.IInMemoryFile | in-memory files} to include in the tree.
 * @param prefix - An optional prefix to add to the paths of all files in the tree.
 * @returns `Success` with the new {@link FileTree.FileTree | FileTree} instance
 * if successful, or `Failure` with an error message otherwise.
 * @public
 */
export function inMemory<TCT extends string = string>(
  files: IInMemoryFile<TCT>[],
  prefix?: string
): Result<FileTree<TCT>>;

/**
 * Helper function to create a new {@link FileTree.FileTree | FileTree} instance
 * with accessors for an in-memory file tree.
 * @param files - An array of File |{@link FileTree.IInMemoryFile | in-memory files} to include in the tree.
 * @param params - Optional {@link FileTree.IFileTreeInitParams | initialization parameters} for the file tree.
 * @returns `Success` with the new {@link FileTree.FileTree | FileTree} instance
 * if successful, or `Failure` with an error message otherwise.
 * @public
 */
export function inMemory<TCT extends string = string>(
  files: IInMemoryFile<TCT>[],
  params?: IFileTreeInitParams<TCT>
): Result<FileTree<TCT>>;
export function inMemory<TCT extends string = string>(
  files: IInMemoryFile<TCT>[],
  params?: IFileTreeInitParams<TCT> | string
): Result<FileTree<TCT>> {
  params = typeof params === 'string' ? { prefix: params } : params;
  return InMemoryTreeAccessors.create<TCT>(files, params).onSuccess((hal: InMemoryTreeAccessors<TCT>) =>
    FileTree.create<TCT>(hal)
  );
}
