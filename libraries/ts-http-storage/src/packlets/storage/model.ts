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
 * How a file's bytes are represented in the `contents` field on the wire.
 *
 * @remarks
 * - `'utf8'` — `contents` is the file decoded as UTF-8 text. This is the
 *   historical (and default) representation, and it is **lossy**: the decode is
 *   the lenient WHATWG one, so any byte sequence that is not valid UTF-8 has
 *   already been replaced by U+FFFD by the time it reaches the wire, and the
 *   substitution is not recoverable downstream.
 * - `'base64'` — `contents` is the file's bytes, base64-encoded. Byte-faithful
 *   and therefore the only representation over which a consumer can decide
 *   whether the stored bytes were valid UTF-8, or read genuinely binary content.
 *   Costs roughly 33% more payload.
 * @public
 */
export type StorageContentEncoding = 'utf8' | 'base64';

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

  /**
   * How `contents` is encoded. Absent means `'utf8'`.
   *
   * @remarks
   * **This field describes what the server actually produced, not what the
   * client asked for**, and a client must branch on it rather than on its own
   * request. A provider that does not implement `'base64'` ignores the request
   * and answers with UTF-8 text; a client that base64-decoded on the strength of
   * having *asked* would corrupt every such response. Trusting the field instead
   * makes an older or simpler provider degrade to today's behavior rather than
   * to garbage.
   */
  readonly encoding?: StorageContentEncoding;
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
 * Request for reading a file, with an optional preferred content encoding.
 *
 * @remarks
 * `encoding` is a *preference*, not a demand: a provider that cannot honour it
 * answers in `'utf8'` and says so on {@link IStorageFileResponse.encoding}. The
 * response is the authority.
 * @public
 */
export interface IStorageReadFileRequest extends IStoragePathRequest {
  readonly encoding?: StorageContentEncoding;
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
 * All methods are async to support both filesystem and database backends.
 * @public
 */
export interface IHttpStorageProvider {
  getItem(path: string): Promise<Result<IStorageTreeItem>>;
  getChildren(path: string): Promise<Result<ReadonlyArray<IStorageTreeItem>>>;
  /**
   * Reads a file.
   * @param path - Path of the file to read.
   * @param encoding - Preferred wire encoding for the returned `contents`. A
   * provider that does not implement the requested encoding MUST answer in
   * `'utf8'` and report that on the response, rather than failing — the field is
   * a preference and the response is the authority.
   */
  getFile(path: string, encoding?: StorageContentEncoding): Promise<Result<IStorageFileResponse>>;
  saveFile(path: string, contents: string, contentType?: string): Promise<Result<IStorageFileResponse>>;
  deleteFile(path: string): Promise<Result<boolean>>;
  createDirectory(path: string): Promise<Result<IStorageTreeItem>>;
  sync(): Promise<Result<IStorageSyncResponse>>;
}
