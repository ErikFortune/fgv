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

/**
 * MongoDB-backed storage provider for multi-user data persistence.
 * @packageDocumentation
 */

import * as path from 'path';

import { fail, type Result, succeed } from '@fgv/ts-utils';
import type { Collection, Db } from 'mongodb';

import type {
  IHttpStorageProvider,
  IHttpStorageProviderFactory,
  IStorageFileResponse,
  IStorageSyncResponse,
  IStorageTreeItem,
  StorageItemType
} from '@fgv/ts-http-storage';

/**
 * MongoDB document schema for storage items.
 * @internal
 */
interface IMongoStorageEntry {
  readonly userId: string;
  readonly namespace: string;
  readonly path: string;
  readonly name: string;
  readonly type: StorageItemType;
  readonly contents?: string;
  readonly contentType?: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * MongoDB-backed implementation of {@link IHttpStorageProvider}.
 *
 * Each provider instance is scoped to a specific user and namespace.
 * Documents are keyed by the compound `(userId, namespace, path)`.
 *
 * @public
 */
export class MongoStorageProvider implements IHttpStorageProvider {
  private readonly _collection: Collection<IMongoStorageEntry>;
  private readonly _userId: string;
  private readonly _namespace: string;

  public constructor(collection: Collection<IMongoStorageEntry>, userId: string, namespace: string) {
    this._collection = collection;
    this._userId = userId;
    this._namespace = namespace;
  }

  public async getItem(itemPath: string): Promise<Result<IStorageTreeItem>> {
    const normalized = _normalizeRequestPath(itemPath);
    try {
      const entry = await this._collection.findOne({
        userId: this._userId,
        namespace: this._namespace,
        path: normalized
      });
      if (!entry) {
        return fail(`${normalized}: not found`);
      }
      return succeed({
        path: entry.path,
        name: entry.name,
        type: entry.type
      });
    } catch (err: unknown) {
      return fail(`${normalized}: ${_toMessage(err)}`);
    }
  }

  public async getChildren(itemPath: string): Promise<Result<ReadonlyArray<IStorageTreeItem>>> {
    const normalized = _normalizeRequestPath(itemPath);
    try {
      // Verify parent exists (or is root)
      if (normalized !== '/') {
        const parent = await this._collection.findOne({
          userId: this._userId,
          namespace: this._namespace,
          path: normalized,
          type: 'directory'
        });
        if (!parent) {
          return fail(`${normalized}: directory not found`);
        }
      }

      // Match immediate children: prefix + name with no further slashes
      const prefix = normalized === '/' ? '/' : `${normalized}/`;
      const escapedPrefix = _escapeRegex(prefix);
      const entries = await this._collection
        .find({
          userId: this._userId,
          namespace: this._namespace,
          path: { $regex: `^${escapedPrefix}[^/]+$` }
        })
        .sort({ path: 1 })
        .toArray();

      const items: IStorageTreeItem[] = entries.map((entry) => ({
        path: entry.path,
        name: entry.name,
        type: entry.type
      }));
      return succeed(items);
    } catch (err: unknown) {
      return fail(`${normalized}: ${_toMessage(err)}`);
    }
  }

  public async getFile(itemPath: string): Promise<Result<IStorageFileResponse>> {
    const normalized = _normalizeRequestPath(itemPath);
    try {
      const entry = await this._collection.findOne({
        userId: this._userId,
        namespace: this._namespace,
        path: normalized
      });
      if (!entry) {
        return fail(`${normalized}: not found`);
      }
      if (entry.type !== 'file') {
        return fail(`${normalized}: not a file`);
      }
      return succeed({
        path: entry.path,
        contents: entry.contents ?? '',
        contentType: entry.contentType ?? undefined
      });
    } catch (err: unknown) {
      return fail(`${normalized}: ${_toMessage(err)}`);
    }
  }

  public async saveFile(
    itemPath: string,
    contents: string,
    contentType?: string
  ): Promise<Result<IStorageFileResponse>> {
    const normalized = _normalizeRequestPath(itemPath);
    const name = normalized === '/' ? '/' : path.posix.basename(normalized);
    try {
      // Ensure parent directories exist
      await this._ensureParentDirectories(normalized);

      const now = new Date();
      await this._collection.updateOne(
        {
          userId: this._userId,
          namespace: this._namespace,
          path: normalized
        },
        {
          $set: {
            name,
            type: 'file' as const,
            contents,
            contentType,
            updatedAt: now
          },
          $setOnInsert: {
            userId: this._userId,
            namespace: this._namespace,
            path: normalized,
            createdAt: now
          }
        },
        { upsert: true }
      );

      return succeed({
        path: normalized,
        contents,
        contentType: contentType ?? undefined
      });
    } catch (err: unknown) {
      return fail(`${normalized}: ${_toMessage(err)}`);
    }
  }

  public async createDirectory(itemPath: string): Promise<Result<IStorageTreeItem>> {
    const normalized = _normalizeRequestPath(itemPath);
    const name = normalized === '/' ? '/' : path.posix.basename(normalized);
    try {
      await this._ensureParentDirectories(normalized);

      const now = new Date();
      await this._collection.updateOne(
        {
          userId: this._userId,
          namespace: this._namespace,
          path: normalized
        },
        {
          $set: {
            name,
            type: 'directory' as const,
            updatedAt: now
          },
          $setOnInsert: {
            userId: this._userId,
            namespace: this._namespace,
            path: normalized,
            createdAt: now
          }
        },
        { upsert: true }
      );

      return succeed({ path: normalized, name, type: 'directory' });
    } catch (err: unknown) {
      return fail(`${normalized}: ${_toMessage(err)}`);
    }
  }

  public async sync(): Promise<Result<IStorageSyncResponse>> {
    try {
      await this._collection.createIndex({ userId: 1, namespace: 1, path: 1 }, { unique: true });
      return succeed({ synced: 0 });
    } catch (err: unknown) {
      return fail(`sync: ${_toMessage(err)}`);
    }
  }

  /**
   * Creates directory entries for each ancestor of the given path.
   * Uses upsert to avoid duplicates.
   */
  private async _ensureParentDirectories(itemPath: string): Promise<void> {
    const segments = itemPath.split('/').filter((s) => s.length > 0);
    let current = '';
    const now = new Date();

    for (let i = 0; i < segments.length - 1; i++) {
      current += `/${segments[i]}`;
      await this._collection.updateOne(
        {
          userId: this._userId,
          namespace: this._namespace,
          path: current
        },
        {
          $set: {
            updatedAt: now
          },
          $setOnInsert: {
            userId: this._userId,
            namespace: this._namespace,
            path: current,
            name: segments[i],
            type: 'directory' as const,
            createdAt: now
          }
        },
        { upsert: true }
      );
    }
  }
}

/**
 * Options for creating a MongoDB storage provider factory.
 * @public
 */
export interface IMongoStorageProviderFactoryOptions {
  readonly db: Db;
  readonly userId: string | (() => string);
  readonly collectionName?: string;
}

/**
 * Factory for creating user-scoped MongoDB storage providers.
 *
 * The factory holds a reference to a MongoDB `Db` instance and creates
 * namespace-scoped providers on demand. Connection lifecycle is managed
 * externally (by the caller that creates the `MongoClient`).
 *
 * @public
 */
export class MongoStorageProviderFactory implements IHttpStorageProviderFactory {
  private readonly _db: Db;
  private readonly _getUserId: () => string;
  private readonly _collectionName: string;

  public constructor(options: IMongoStorageProviderFactoryOptions) {
    this._db = options.db;
    const { userId } = options;
    this._getUserId = typeof userId === 'function' ? userId : (): string => userId;
    this._collectionName = options.collectionName ?? 'storage_items';
  }

  public forNamespace(namespace?: string): Result<IHttpStorageProvider> {
    const safeNamespace = _sanitizeNamespace(namespace);
    if (safeNamespace.isFailure()) {
      return fail(safeNamespace.message);
    }

    const collection = this._db.collection<IMongoStorageEntry>(this._collectionName);
    return succeed(new MongoStorageProvider(collection, this._getUserId(), safeNamespace.value));
  }

  /**
   * Ensures indexes exist on the storage collection.
   * Should be called once at startup.
   */
  public async ensureIndexes(): Promise<Result<boolean>> {
    try {
      const collection = this._db.collection<IMongoStorageEntry>(this._collectionName);
      await collection.createIndex({ userId: 1, namespace: 1, path: 1 }, { unique: true });
      return succeed(true);
    } catch (err: unknown) {
      return fail(`ensureIndexes: ${_toMessage(err)}`);
    }
  }
}

// ============================================================================
// Helpers
// ============================================================================

function _normalizeRequestPath(requestPath: string): string {
  if (requestPath.length === 0) {
    return '/';
  }
  const normalized = path.posix.normalize(requestPath.startsWith('/') ? requestPath : `/${requestPath}`);
  return normalized.startsWith('/') ? normalized : `/${normalized}`;
}

function _escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function _sanitizeNamespace(namespace?: string): Result<string> {
  if (!namespace || namespace.trim().length === 0) {
    return succeed('default');
  }
  const trimmed = namespace.trim();
  if (!/^[a-zA-Z0-9._-]+$/.test(trimmed)) {
    return fail(`namespace '${namespace}': only [a-zA-Z0-9._-] allowed`);
  }
  return succeed(trimmed);
}

function _toMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
