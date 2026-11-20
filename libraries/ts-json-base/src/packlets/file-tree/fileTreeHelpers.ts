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
import { FileTree } from './fileTree';
import { FsFileTreeAccessors, IFsFileTreeInitParams } from './fsTree';

/**
 * Helper function to create a new {@link FileTree.FileTree | FileTree} instance
 * with accessors for the filesystem.
 * @param prefix - An optional prefix, against which relative paths are resolved.
 * An absolute path is used as given (the default `'unconfined'` policy); pass
 * {@link FileTree.IFsFileTreeInitParams | parameters} with `absolutePathPolicy` to
 * confine paths to the prefix.
 * @returns `Success` with the new {@link FileTree.FileTree | FileTree} instance
 * if successful, or `Failure` with an error message otherwise.
 * @public
 */
export function forFilesystem<TCT extends string = string>(prefix?: string): Result<FileTree<TCT>>;

/**
 * Helper function to create a new {@link FileTree.FileTree | FileTree} instance
 * with accessors for the filesystem.
 * @param params - Optional {@link FileTree.IFsFileTreeInitParams | initialization parameters} for the file tree.
 * @returns `Success` with the new {@link FileTree.FileTree | FileTree} instance
 * if successful, or `Failure` with an error message otherwise — including when
 * `params` asks for confinement without a `prefix` (see
 * {@link FileTree.FsFileTreeAccessors.create | FsFileTreeAccessors.create}).
 * @public
 */
export function forFilesystem<TCT extends string = string>(
  params?: IFsFileTreeInitParams<TCT>
): Result<FileTree<TCT>>;
export function forFilesystem<TCT extends string = string>(
  params?: IFsFileTreeInitParams<TCT> | string
): Result<FileTree<TCT>> {
  params = typeof params === 'string' ? { prefix: params } : params;
  return FsFileTreeAccessors.create<TCT>(params).onSuccess((hal) => FileTree.create(hal));
}
