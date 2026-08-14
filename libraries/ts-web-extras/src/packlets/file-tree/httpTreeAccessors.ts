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

import {
  captureResult,
  DetailedResult,
  fail,
  type Result,
  succeed,
  succeedWithDetail,
  Logging
} from '@fgv/ts-utils';
import { FileTree } from '@fgv/ts-json-base';

interface IHttpStorageTreeItem {
  readonly path: string;
  readonly name: string;
  readonly type: 'file' | 'directory';
}

interface IHttpStorageTreeChildrenResponse {
  readonly path: string;
  readonly children: ReadonlyArray<IHttpStorageTreeItem>;
}

interface IHttpStorageFileResponse {
  readonly path: string;
  readonly contents: string;
  readonly contentType?: string;
  readonly encoding?: HttpContentEncoding;
}

/**
 * How a file's bytes are represented in the storage API's `contents` field.
 *
 * @remarks
 * Mirrors `StorageContentEncoding` in `@fgv/ts-http-storage`. Declared here
 * rather than imported because this package must not take a dependency on the
 * server library — the two are ends of a wire contract, not layers of a stack.
 * @public
 */
export type HttpContentEncoding = 'utf8' | 'base64';

interface IHttpStorageSyncResponse {
  readonly synced: number;
}

function normalizeFetch(fetchImpl?: typeof fetch): typeof fetch {
  const resolved = fetchImpl ?? globalThis.fetch;
  return resolved.bind(globalThis) as typeof fetch;
}

/**
 * Configuration for creating HTTP-backed tree accessors.
 * @public
 */
export interface IHttpTreeParams<TCT extends string = string> extends FileTree.IFileTreeInitParams<TCT> {
  readonly baseUrl: string;
  readonly namespace?: string;
  readonly autoSync?: boolean;
  readonly fetchImpl?: typeof fetch;
  readonly userId?: string;
  readonly logger?: Logging.LogReporter<unknown>;

  /**
   * Wire encoding to request for file contents. Default `'utf8'` — today's
   * behavior, byte-identical.
   *
   * @remarks
   * Set `'base64'` to make this store **byte-faithful**: the server sends the
   * file's bytes rather than a lenient UTF-8 decode of them, and this tree is
   * seeded with those bytes verbatim. That is what makes `getFileBytes()`
   * honest here and what lets the optional strict-text capability
   * (`FileTree.getFileTextStrict`) actually decide whether the stored bytes were
   * valid UTF-8, instead of refusing for want of custody. It also makes reading
   * genuinely binary content (images, PDFs) correct rather than lossy.
   *
   * The cost is roughly 33% more payload per file, which is why it is opt-in
   * rather than the default.
   *
   * **Requesting it is not the same as getting it.** A server that does not
   * implement base64 ignores the parameter and answers in UTF-8, saying so on
   * the response; this store branches on what came back, not on what it asked
   * for, so such a server degrades to today's behavior rather than to garbage.
   */
  readonly contentEncoding?: HttpContentEncoding;
}

/**
 * HTTP-backed file tree accessors that cache data in memory and persist via REST API.
 *
 * @remarks
 * Supports the read half of the optional binary capability
 * (`FileTree.IBinaryFileTreeAccessors`) — narrow with
 * `FileTree.isBinaryAccessors` and call `getFileBytes()`.
 *
 * **Whether this adapter is byte-faithful depends on
 * {@link IHttpTreeParams.contentEncoding | contentEncoding}, and nothing else.**
 *
 * Under the default `'utf8'`, it is **not**, and `getFileBytes()` must not be used
 * to detect invalid UTF-8. The REST transport carries file contents as JSON
 * strings, so `JSON.parse` has already decoded them **leniently** — substituting
 * U+FFFD for every invalid sequence — before this class ever sees them. The
 * inherited `getFileBytes()` then *re-encodes* that string, so what you get back
 * is well-formed UTF-8 whose corruption is already baked in and no longer
 * detectable. A `TextDecoder('utf-8', { fatal: true })` over those bytes will
 * succeed, having nothing left to check. For the same reason the optional
 * strict-text capability (`FileTree.IStrictTextFileTreeAccessors`) **fails every
 * file**: with no custody of the original bytes it cannot answer "was this valid
 * UTF-8?" even in principle, so it refuses rather than returning a success from a
 * check that cannot fail.
 *
 * Under `contentEncoding: 'base64'`, all of that goes away. The server sends the
 * file's bytes and this tree is seeded with them verbatim, so `getFileBytes()`
 * returns what the origin actually stored and `getFileTextStrict()` decides
 * honestly. Nothing in the capability implementations is special-cased for HTTP —
 * they follow the general custody rule, and this option is simply how this store
 * comes to have custody.
 *
 * (An earlier version of this doc said `getFileBytes()` reads bytes "without going
 * through a lenient UTF-8 decode", unconditionally. That was true of the
 * byte-seeded stores this class inherits from and false here.)
 *
 * Byte *writes* remain unsupported: `syncToDisk()` still sends `contents` as UTF-8
 * text, so bytes that are not valid UTF-8 could not survive the round trip. The
 * read direction is byte-faithful; the write direction is not yet.
 * @public
 */
export class HttpTreeAccessors<TCT extends string = string>
  extends FileTree.InMemoryTreeAccessors<TCT>
  implements FileTree.IPersistentFileTreeAccessors<TCT>, FileTree.IBinaryFileTreeAccessors<TCT>
{
  private readonly _baseUrl: string;
  private readonly _namespace: string | undefined;
  private readonly _fetchImpl: typeof fetch;
  private readonly _dirtyFiles: Set<string> = new Set();
  private readonly _pendingDeletions: Set<string> = new Set();
  private readonly _autoSync: boolean;
  private readonly _userId: string | undefined;
  private readonly _logger: Logging.LogReporter<unknown>;

  /** Guards against concurrent syncToDisk calls (thundering herd from autoSync). */
  private _syncPromise: Promise<Result<void>> | undefined;

  private constructor(files: FileTree.IInMemoryFile<TCT>[], params: IHttpTreeParams<TCT>) {
    super(files, params);
    this._baseUrl = params.baseUrl.replace(/\/$/, '');
    this._namespace = params.namespace;
    this._fetchImpl = normalizeFetch(params.fetchImpl);
    this._autoSync = params.autoSync ?? false;
    this._userId = params.userId;
    this._logger = params.logger ?? new Logging.LogReporter<unknown>();
  }

  private async _runAutoSyncTask(path: string): Promise<void> {
    try {
      const result = await this.syncToDisk();
      if (result.isFailure()) {
        this._logger.error(`Auto-sync failed for ${path}: ${result.message}`);
      }
    } catch (err) {
      this._logger.error(`Auto-sync threw for ${path}: ${String(err)}`);
    }
  }

  /**
   * Creates a new HttpTreeAccessors instance from an HTTP backend.
   * @param params - Configuration parameters for the HTTP tree accessors.
   * @returns A promise that resolves to a result containing the new HttpTreeAccessors instance or an error message.
   */
  public static async fromHttp<TCT extends string = string>(
    params: IHttpTreeParams<TCT>
  ): Promise<Result<HttpTreeAccessors<TCT>>> {
    const filesResult = await this._loadFiles<TCT>(params, '/');
    if (filesResult.isFailure()) {
      return fail(filesResult.message);
    }
    return succeed(new HttpTreeAccessors<TCT>(filesResult.value, params));
  }

  /**
   * Synchronizes all dirty files to the HTTP backend.
   *
   * Uses a concurrency guard: if a sync is already in progress, callers
   * await the existing operation rather than starting a parallel one.
   * This prevents the thundering herd that occurs when autoSync fires
   * for every file written during a bulk operation (e.g. restore).
   *
   * @returns A promise that resolves to a result indicating success or failure.
   */
  public async syncToDisk(): Promise<Result<void>> {
    if (this._syncPromise) {
      // Wait for the in-flight sync — it drains the queue in a loop,
      // so any items added before it finishes will be included.
      return this._syncPromise;
    }

    this._syncPromise = this._doSync().finally(() => {
      this._syncPromise = undefined;
    });
    return this._syncPromise;
  }

  private async _doSync(): Promise<Result<void>> {
    // Drain loop: keep processing as long as new items arrive.
    // This is critical for bulk operations (e.g. reset) where many
    // deleteFile/saveFileContents calls happen synchronously — only
    // the first may be in the set when we snapshot, but the rest
    // arrive during the async gaps and must be picked up before
    // we return.
    let didWork = false;
    while (this._dirtyFiles.size > 0 || this._pendingDeletions.size > 0) {
      didWork = true;
      // Snapshot and clear so that changes arriving during the async
      // requests land in the live sets for the next iteration.
      const deletions = new Set(this._pendingDeletions);
      const dirty = new Set(this._dirtyFiles);
      this._pendingDeletions.clear();
      this._dirtyFiles.clear();

      for (const path of deletions) {
        const query = new URLSearchParams();
        query.set('path', path);
        if (this._namespace) {
          query.set('namespace', this._namespace);
        }

        const deleteResult = await this._requestWithRetry<{ deleted: boolean }>(`/file?${query.toString()}`, {
          method: 'DELETE'
        });
        if (deleteResult.isFailure()) {
          this._restoreUnsynced(deletions, dirty);
          return fail(`delete ${path}: ${deleteResult.message}`);
        }
      }

      for (const path of dirty) {
        const contentsResult = this.getFileContents(path);
        if (contentsResult.isFailure()) {
          this._restoreUnsynced(deletions, dirty);
          return fail(`${path}: ${contentsResult.message}`);
        }

        const body: Record<string, unknown> = {
          path,
          contents: contentsResult.value
        };
        if (this._namespace) {
          body.namespace = this._namespace;
        }

        const saveResult = await this._requestWithRetry<IHttpStorageFileResponse>('/file', {
          method: 'PUT',
          body: JSON.stringify(body)
        });
        if (saveResult.isFailure()) {
          this._restoreUnsynced(deletions, dirty);
          return fail(`sync ${path}: ${saveResult.message}`);
        }
      }
    }

    if (didWork) {
      const syncBody: Record<string, unknown> = {};
      if (this._namespace) {
        syncBody.namespace = this._namespace;
      }

      const syncResult = await this._requestWithRetry<IHttpStorageSyncResponse>('/sync', {
        method: 'POST',
        body: JSON.stringify(syncBody)
      });

      if (syncResult.isFailure()) {
        return fail(syncResult.message);
      }
    }
    return succeed(undefined);
  }

  /**
   * Restores snapshotted items back into the live dirty sets so they
   * are retried on the next sync attempt. Items that were added to
   * the live sets while the sync was in flight are preserved.
   */
  private _restoreUnsynced(deletions: Set<string>, dirty: Set<string>): void {
    for (const path of deletions) {
      this._pendingDeletions.add(path);
    }
    for (const path of dirty) {
      this._dirtyFiles.add(path);
    }
  }

  /**
   * Checks if there are any dirty files that need synchronization.
   * @returns True if there are dirty files, false otherwise.
   */
  public isDirty(): boolean {
    return this._dirtyFiles.size > 0 || this._pendingDeletions.size > 0;
  }

  /**
   * Gets the list of paths for all dirty files.
   * @returns An array of file paths that have been modified but not yet synchronized.
   */
  public getDirtyPaths(): string[] {
    return [...Array.from(this._dirtyFiles), ...Array.from(this._pendingDeletions)];
  }

  public deleteFile(path: string): Result<boolean> {
    const result = super.deleteFile(path);
    if (result.isFailure()) {
      return result;
    }

    this._dirtyFiles.delete(path);
    this._pendingDeletions.add(path);

    if (!this._autoSync) {
      return result;
    }

    this._runAutoSyncTask(path).catch(() => undefined);
    return result;
  }

  /**
   * Saves file contents and marks the file as dirty for synchronization.
   * @param path - The path to the file.
   * @param contents - The new contents of the file.
   * @returns A result indicating success or failure.
   */
  public saveFileContents(path: string, contents: string): Result<string> {
    const result = super.saveFileContents(path, contents);
    if (result.isFailure()) {
      return result;
    }

    this._dirtyFiles.add(path);
    if (!this._autoSync) {
      return result;
    }

    // fire-and-log-on-failure automatic sync for immediate persistence workflow
    this._runAutoSyncTask(path).catch(() => undefined);
    return result;
  }

  /**
   * Checks if a file is mutable (can be modified).
   * @param path - The path to the file.
   * @returns A detailed result indicating if the file is mutable and the reason.
   */
  public fileIsMutable(path: string): DetailedResult<boolean, FileTree.SaveDetail> {
    const result = super.fileIsMutable(path);
    if (result.isSuccess() && result.value === true) {
      return succeedWithDetail(true, 'persistent');
    }
    return result;
  }

  /**
   * Makes an HTTP request to the specified resource path.
   * @param resourcePath - The path to the resource.
   * @param init - Optional request initialization options.
   * @returns A promise that resolves to a result containing the response data or an error message.
   */
  private async _request<T>(resourcePath: string, init?: RequestInit): Promise<Result<T>> {
    const response = await this._fetchImpl(`${this._baseUrl}${resourcePath}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(this._userId ? { 'X-User-Id': this._userId } : {}),
        /* c8 ignore next 1 - defensive coding: init.headers is never set by current callers */
        ...(init?.headers ?? {})
      },
      ...init
    }).catch((err: unknown) => ({ err } as const));

    if ('err' in response) {
      const message = response.err instanceof Error ? response.err.message : String(response.err);
      return fail(message);
    }

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      const message = body
        ? `HTTP ${response.status}: ${body}`
        : `HTTP ${response.status} ${response.statusText}`;
      return fail(message);
    }

    const json = await response.json().catch(() => undefined);
    if (json === undefined) {
      return fail('invalid JSON response');
    }
    return succeed(json as T);
  }

  /**
   * Wraps `_request` with retry logic for transient failures
   * (network errors, 503 service unavailable, etc.).
   */
  private async _requestWithRetry<T>(resourcePath: string, init?: RequestInit): Promise<Result<T>> {
    const maxAttempts = 3;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const result = await this._request<T>(resourcePath, init);
      if (result.isSuccess() || attempt === maxAttempts) {
        return result;
      }
      // Retry on transient-looking errors
      const msg = result.message;
      const lowerMsg = msg.toLowerCase();
      const isTransient =
        msg.includes('503') ||
        msg.includes('502') ||
        msg.includes('429') ||
        lowerMsg.includes('disconnect') ||
        lowerMsg.includes('econnreset') ||
        lowerMsg.includes('failed to fetch') ||
        lowerMsg.includes('network');
      if (!isTransient) {
        return result;
      }
      // Exponential backoff: 500ms, 1000ms
      const delayMs = 500 * Math.pow(2, attempt - 1);
      this._logger.detail(
        `Retrying ${
          init?.method ?? 'GET'
        } ${resourcePath} after ${delayMs}ms (attempt ${attempt}/${maxAttempts})`
      );
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
    /* c8 ignore next 1 - defensive coding: loop always returns */
    return fail('retry loop exited unexpectedly');
  }

  /**
   * Loads files from the HTTP backend for the specified directory path.
   * @param params - Configuration parameters for the HTTP tree accessors.
   * @param directoryPath - The path to the directory to load files from.
   * @returns A promise that resolves to a result containing the loaded files or an error message.
   */
  /**
   * Resolves a file response's `contents` to what should seed the in-memory tree:
   * raw bytes when the server says it sent base64, the string verbatim otherwise.
   *
   * @remarks
   * The branch is on **`response.encoding`, never on what was requested.** A
   * server that does not implement base64 ignores the query parameter and answers
   * in UTF-8; decoding that as base64 because we happened to ask would silently
   * corrupt every file. Trusting the response makes the same client correct
   * against both a byte-faithful server and a text-only one.
   */
  private static _decodeContents(
    filePath: string,
    response: IHttpStorageFileResponse
  ): Result<string | Uint8Array> {
    if (response.encoding !== 'base64') {
      return succeed(response.contents);
    }
    return captureResult(() => {
      const binary = atob(response.contents);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return bytes;
    }).withErrorFormat((message: string) => `${filePath}: malformed base64 in storage response: ${message}`);
  }

  private static async _loadFiles<TCT extends string = string>(
    params: IHttpTreeParams<TCT>,
    directoryPath: string
  ): Promise<Result<FileTree.IInMemoryFile<TCT>[]>> {
    const childrenResult = await this._requestWithParams<IHttpStorageTreeChildrenResponse>(
      params,
      '/tree/children',
      {
        path: directoryPath,
        namespace: params.namespace
      }
    );
    if (childrenResult.isFailure()) {
      return fail(childrenResult.message);
    }

    const allFiles: FileTree.IInMemoryFile<TCT>[] = [];

    for (const item of childrenResult.value.children) {
      if (item.type === 'directory') {
        const nestedResult = await this._loadFiles(params, item.path);
        if (nestedResult.isFailure()) {
          return fail(nestedResult.message);
        }
        allFiles.push(...nestedResult.value);
      } else {
        const fileResult = await this._requestWithParams<IHttpStorageFileResponse>(params, '/file', {
          path: item.path,
          namespace: params.namespace,
          encoding: params.contentEncoding
        });
        if (fileResult.isFailure()) {
          return fail(fileResult.message);
        }

        const contentType = params.inferContentType?.(item.path, fileResult.value.contentType).orDefault();
        const decoded = HttpTreeAccessors._decodeContents(item.path, fileResult.value);
        if (decoded.isFailure()) {
          return fail(decoded.message);
        }
        allFiles.push({
          path: item.path,
          contents: decoded.value,
          contentType
        });
      }
    }

    return succeed(allFiles);
  }

  /**
   * Makes an HTTP request with query parameters to the specified resource path.
   * @param params - Configuration parameters for the HTTP tree accessors.
   * @param resourcePath - The path to the resource.
   * @param query - Query parameters to include in the request.
   * @returns A promise that resolves to a result containing the response data or an error message.
   */
  private static async _requestWithParams<T>(
    params: IHttpTreeParams,
    resourcePath: string,
    query: Record<string, string | undefined>
  ): Promise<Result<T>> {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) {
        search.set(key, value);
      }
    }

    const fetchImpl = normalizeFetch(params.fetchImpl);
    const userIdHeaders: RequestInit | undefined = /* c8 ignore next */ params.userId
      ? { headers: { 'X-User-Id': params.userId } }
      : undefined;
    const response = await fetchImpl(
      `${params.baseUrl.replace(/\/$/, '')}${resourcePath}?${search.toString()}`,
      userIdHeaders
    ).catch((err: unknown) => ({ err } as const));

    if ('err' in response) {
      const message = response.err instanceof Error ? response.err.message : String(response.err);
      return fail(message);
    }

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      const message = body
        ? `HTTP ${response.status}: ${body}`
        : `HTTP ${response.status} ${response.statusText}`;
      return fail(message);
    }

    const json = await response.json().catch(() => undefined);
    if (json === undefined) {
      return fail('invalid JSON response');
    }

    return succeed(json as T);
  }
}
