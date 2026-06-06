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

import * as fs from 'fs';
import * as fsp from 'fs/promises';
import * as path from 'path';

import { captureResult, fail, type Result, succeed } from '@fgv/ts-utils';

import type {
  IHttpStorageProvider,
  IStorageFileResponse,
  IStorageSyncResponse,
  IStorageTreeItem,
  StorageItemType
} from './model';
import type { IHttpStorageProviderFactory } from './provider';

/**
 * Options for creating filesystem-backed storage providers.
 * @public
 */
export interface IFsStorageProviderFactoryOptions {
  readonly rootPath: string;
}

function toItemType(stats: fs.Stats): StorageItemType {
  return stats.isDirectory() ? 'directory' : 'file';
}

/**
 * Filesystem-backed implementation of {@link IHttpStorageProvider}.
 * @public
 */
export class FsStorageProvider implements IHttpStorageProvider {
  private readonly _rootPath: string;

  public constructor(rootPath: string) {
    this._rootPath = rootPath;
  }

  public async getItem(itemPath: string): Promise<Result<IStorageTreeItem>> {
    const resolved = this._resolveAbsolutePath(itemPath);
    if (resolved.isFailure()) {
      return fail(resolved.message);
    }
    try {
      const stats = await fsp.stat(resolved.value);
      return succeed(this._toTreeItem(itemPath, toItemType(stats)));
    } catch (err: unknown) {
      return fail(`${itemPath}: ${_toMessage(err)}`);
    }
  }

  public async getChildren(itemPath: string): Promise<Result<ReadonlyArray<IStorageTreeItem>>> {
    const resolved = this._resolveAbsolutePath(itemPath);
    if (resolved.isFailure()) {
      return fail(resolved.message);
    }
    try {
      const entries = await fsp.readdir(resolved.value, { withFileTypes: true });
      return _mapEntries(entries, itemPath);
    } catch (err: unknown) {
      return fail(`${itemPath}: ${_toMessage(err)}`);
    }
  }

  public async getFile(itemPath: string): Promise<Result<IStorageFileResponse>> {
    const resolved = this._resolveAbsolutePath(itemPath);
    if (resolved.isFailure()) {
      return fail(resolved.message);
    }
    try {
      const stats = await fsp.stat(resolved.value);
      if (!stats.isFile()) {
        return fail(`${itemPath}: not a file`);
      }
      const contents = await fsp.readFile(resolved.value, 'utf8');
      return succeed({
        path: normalizeRequestPath(itemPath),
        contents
      });
    } catch (err: unknown) {
      return fail(`${itemPath}: ${_toMessage(err)}`);
    }
  }

  public async saveFile(
    itemPath: string,
    contents: string,
    contentType?: string
  ): Promise<Result<IStorageFileResponse>> {
    const resolved = this._resolveAbsolutePath(itemPath);
    if (resolved.isFailure()) {
      return fail(resolved.message);
    }
    try {
      const parentDir = path.dirname(resolved.value);
      await fsp.mkdir(parentDir, { recursive: true });
      await fsp.writeFile(resolved.value, contents, 'utf8');
      return succeed({
        path: normalizeRequestPath(itemPath),
        contents,
        contentType
      });
    } catch (err: unknown) {
      return fail(`${itemPath}: ${_toMessage(err)}`);
    }
  }

  public async deleteFile(itemPath: string): Promise<Result<boolean>> {
    const resolved = this._resolveAbsolutePath(itemPath);
    if (resolved.isFailure()) {
      return fail(resolved.message);
    }
    try {
      const stats = await fsp.stat(resolved.value);
      if (!stats.isFile()) {
        return fail(`${itemPath}: not a file`);
      }
      await fsp.unlink(resolved.value);
      return succeed(true);
    } catch (err: unknown) {
      return fail(`${itemPath}: ${_toMessage(err)}`);
    }
  }

  public async createDirectory(itemPath: string): Promise<Result<IStorageTreeItem>> {
    const resolved = this._resolveAbsolutePath(itemPath);
    if (resolved.isFailure()) {
      return fail(resolved.message);
    }
    try {
      await fsp.mkdir(resolved.value, { recursive: true });
      return succeed(this._toTreeItem(itemPath, 'directory'));
    } catch (err: unknown) {
      return fail(`${itemPath}: ${_toMessage(err)}`);
    }
  }

  public async sync(): Promise<Result<IStorageSyncResponse>> {
    return succeed({ synced: 0 });
  }

  private _resolveAbsolutePath(requestPath: string): Result<string> {
    const normalized = normalizeRequestPath(requestPath);
    const candidate = path.resolve(this._rootPath, `.${normalized}`);
    const relative = path.relative(this._rootPath, candidate);
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
      return fail(`${requestPath}: path is outside storage root`);
    }
    return succeed(candidate);
  }

  private _toTreeItem(itemPath: string, type: StorageItemType): IStorageTreeItem {
    const normalizedPath = normalizeRequestPath(itemPath);
    const name = normalizedPath === '/' ? '/' : path.posix.basename(normalizedPath);
    return {
      path: normalizedPath,
      name,
      type
    };
  }
}

function _mapEntries(
  entries: ReadonlyArray<fs.Dirent>,
  parentPath: string
): Result<ReadonlyArray<IStorageTreeItem>> {
  const normalizedParent = normalizeRequestPath(parentPath);
  const items: IStorageTreeItem[] = entries.map((entry) => {
    const isDirectory = entry.isDirectory();
    const childPath = normalizedParent === '/' ? `/${entry.name}` : `${normalizedParent}/${entry.name}`;
    return {
      path: childPath,
      name: entry.name,
      type: isDirectory ? 'directory' : 'file'
    };
  });
  return succeed(items);
}

function _toMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

/**
 * Normalizes a request path to a consistent POSIX format.
 * @public
 */
export function normalizeRequestPath(requestPath: string): string {
  if (requestPath.length === 0) {
    return '/';
  }
  const normalized = path.posix.normalize(requestPath.startsWith('/') ? requestPath : `/${requestPath}`);
  return normalized.startsWith('/') ? normalized : `/${normalized}`;
}

/**
 * Namespace-aware provider factory backed by filesystem directories.
 * @public
 */
export class FsStorageProviderFactory implements IHttpStorageProviderFactory {
  private readonly _rootPath: string;

  public constructor(options: IFsStorageProviderFactoryOptions) {
    this._rootPath = path.resolve(options.rootPath);
  }

  public forNamespace(namespace?: string): Result<IHttpStorageProvider> {
    const safeNamespace = sanitizeNamespace(namespace);
    if (safeNamespace.isFailure()) {
      return fail(safeNamespace.message);
    }

    const namespaceRoot = path.resolve(this._rootPath, safeNamespace.value);
    const relative = path.relative(this._rootPath, namespaceRoot);
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
      return fail(`namespace '${safeNamespace.value}' is outside root`);
    }

    const ensureResult = captureResult(() => fs.mkdirSync(namespaceRoot, { recursive: true }));
    if (ensureResult.isFailure()) {
      return fail(`namespace '${safeNamespace.value}': ${ensureResult.message}`);
    }

    return succeed(new FsStorageProvider(namespaceRoot));
  }
}

/**
 * Sanitize namespace path segment.
 * @public
 */
export function sanitizeNamespace(namespace?: string): Result<string> {
  if (!namespace || namespace.trim().length === 0) {
    return succeed('default');
  }
  const trimmed = namespace.trim();
  if (!/^[a-zA-Z0-9._-]+$/.test(trimmed)) {
    return fail(`namespace '${namespace}': only [a-zA-Z0-9._-] allowed`);
  }
  return succeed(trimmed);
}
