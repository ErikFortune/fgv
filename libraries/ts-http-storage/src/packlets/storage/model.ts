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

import type { Result } from '@fgv/ts-utils';

/**
 * Namespace identifier for scoped storage.
 * @public
 */
export type StorageNamespace = string;

/**
 * Storage item type.
 * @public
 */
export type StorageItemType = 'file' | 'directory';

/**
 * Storage tree item metadata.
 * @public
 */
export interface IStorageTreeItem {
  readonly path: string;
  readonly name: string;
  readonly type: StorageItemType;
}

/**
 * Response for listing children.
 * @public
 */
export interface IStorageTreeChildrenResponse {
  readonly path: string;
  readonly children: ReadonlyArray<IStorageTreeItem>;
}

/**
 * Response for reading a file.
 * @public
 */
export interface IStorageFileResponse {
  readonly path: string;
  readonly contents: string;
  readonly contentType?: string;
}

/**
 * Request for path-based operations.
 * @public
 */
export interface IStoragePathRequest {
  readonly path: string;
  readonly namespace?: StorageNamespace;
}

/**
 * Request for writing file contents.
 * @public
 */
export interface IStorageWriteFileRequest extends IStoragePathRequest {
  readonly contents: string;
  readonly contentType?: string;
}

/**
 * Request for sync operation.
 * @public
 */
export interface IStorageSyncRequest {
  readonly namespace?: StorageNamespace;
}

/**
 * Sync response metadata.
 * @public
 */
export interface IStorageSyncResponse {
  readonly synced: number;
}

/**
 * Provider contract for storage backends.
 * @public
 */
export interface IHttpStorageProvider {
  getItem(path: string): Result<IStorageTreeItem>;
  getChildren(path: string): Result<ReadonlyArray<IStorageTreeItem>>;
  getFile(path: string): Result<IStorageFileResponse>;
  saveFile(path: string, contents: string, contentType?: string): Result<IStorageFileResponse>;
  createDirectory(path: string): Result<IStorageTreeItem>;
  sync(): Promise<Result<IStorageSyncResponse>>;
}
