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

  public getItem(itemPath: string): Result<IStorageTreeItem> {
    return this._resolveAbsolutePath(itemPath).onSuccess((absolutePath) => {
      return captureResult(() => fs.statSync(absolutePath)).onSuccess((stats) =>
        succeed(this._toTreeItem(itemPath, toItemType(stats)))
      );
    });
  }

  public getChildren(itemPath: string): Result<ReadonlyArray<IStorageTreeItem>> {
    return this._resolveAbsolutePath(itemPath).onSuccess((absolutePath) => {
      return captureResult(() => fs.readdirSync(absolutePath, { withFileTypes: true })).onSuccess(
        (entries) => {
          return mapEntries(entries, itemPath);
        }
      );
    });
  }

  public getFile(itemPath: string): Result<IStorageFileResponse> {
    return this._resolveAbsolutePath(itemPath).onSuccess((absolutePath) => {
      return captureResult(() => {
        const stats = fs.statSync(absolutePath);
        if (!stats.isFile()) {
          throw new Error(`${itemPath}: not a file`);
        }
        return fs.readFileSync(absolutePath, 'utf8');
      }).onSuccess((contents) =>
        succeed({
          path: normalizeRequestPath(itemPath),
          contents
        })
      );
    });
  }

  public saveFile(itemPath: string, contents: string, contentType?: string): Result<IStorageFileResponse> {
    return this._resolveAbsolutePath(itemPath).onSuccess((absolutePath) => {
      return captureResult(() => {
        const parentDir = path.dirname(absolutePath);
        fs.mkdirSync(parentDir, { recursive: true });
        fs.writeFileSync(absolutePath, contents, 'utf8');
      }).onSuccess(() =>
        succeed({
          path: normalizeRequestPath(itemPath),
          contents,
          contentType
        })
      );
    });
  }

  public createDirectory(itemPath: string): Result<IStorageTreeItem> {
    return this._resolveAbsolutePath(itemPath).onSuccess((absolutePath) => {
      return captureResult(() => fs.mkdirSync(absolutePath, { recursive: true })).onSuccess(() =>
        succeed(this._toTreeItem(itemPath, 'directory'))
      );
    });
  }

  public async sync(): Promise<Result<IStorageSyncResponse>> {
    return Promise.resolve(succeed({ synced: 0 }));
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

function mapEntries(
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

function normalizeRequestPath(requestPath: string): string {
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
