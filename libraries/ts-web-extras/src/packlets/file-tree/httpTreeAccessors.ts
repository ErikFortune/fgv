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

import { DetailedResult, fail, type Result, succeed, succeedWithDetail } from '@fgv/ts-utils';
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
}

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
}

/**
 * HTTP-backed file tree accessors that cache data in memory and persist via REST API.
 * @public
 */
export class HttpTreeAccessors<TCT extends string = string>
  extends FileTree.InMemoryTreeAccessors<TCT>
  implements FileTree.IPersistentFileTreeAccessors<TCT>
{
  private readonly _baseUrl: string;
  private readonly _namespace: string | undefined;
  private readonly _fetchImpl: typeof fetch;
  private readonly _dirtyFiles: Set<string> = new Set();
  private readonly _autoSync: boolean;

  private constructor(files: FileTree.IInMemoryFile<TCT>[], params: IHttpTreeParams<TCT>) {
    super(files, params);
    this._baseUrl = params.baseUrl.replace(/\/$/, '');
    this._namespace = params.namespace;
    this._fetchImpl = normalizeFetch(params.fetchImpl);
    this._autoSync = params.autoSync ?? false;
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
   * @returns A promise that resolves to a result indicating success or failure.
   */
  public async syncToDisk(): Promise<Result<void>> {
    if (this._dirtyFiles.size === 0) {
      return succeed(undefined);
    }

    for (const path of this._dirtyFiles) {
      const contentsResult = this.getFileContents(path);
      if (contentsResult.isFailure()) {
        return fail(`${path}: ${contentsResult.message}`);
      }

      const body: Record<string, unknown> = {
        path,
        contents: contentsResult.value
      };
      if (this._namespace) {
        body.namespace = this._namespace;
      }

      const saveResult = await this._request<IHttpStorageFileResponse>('/file', {
        method: 'PUT',
        body: JSON.stringify(body)
      });
      if (saveResult.isFailure()) {
        return fail(`sync ${path}: ${saveResult.message}`);
      }
    }

    this._dirtyFiles.clear();

    const syncBody: Record<string, unknown> = {};
    if (this._namespace) {
      syncBody.namespace = this._namespace;
    }

    const syncResult = await this._request<IHttpStorageSyncResponse>('/sync', {
      method: 'POST',
      body: JSON.stringify(syncBody)
    });

    return syncResult.isFailure() ? fail(syncResult.message) : succeed(undefined);
  }

  /**
   * Checks if there are any dirty files that need synchronization.
   * @returns True if there are dirty files, false otherwise.
   */
  public isDirty(): boolean {
    return this._dirtyFiles.size > 0;
  }

  /**
   * Gets the list of paths for all dirty files.
   * @returns An array of file paths that have been modified but not yet synchronized.
   */
  public getDirtyPaths(): string[] {
    return Array.from(this._dirtyFiles);
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

    // fire-and-forget automatic sync for immediate persistence workflow
    void this.syncToDisk();
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
        ...(init?.headers ?? {})
      },
      ...init
    }).catch((err: unknown) => ({ err } as const));

    if ('err' in response) {
      const message = response.err instanceof Error ? response.err.message : String(response.err);
      return fail(message);
    }

    if (!response.ok) {
      const message = await response.text().catch(() => `HTTP ${response.status}`);
      return fail(message);
    }

    const json = await response.json().catch(() => undefined);
    if (json === undefined) {
      return fail('invalid JSON response');
    }
    return succeed(json as T);
  }

  /**
   * Loads files from the HTTP backend for the specified directory path.
   * @param params - Configuration parameters for the HTTP tree accessors.
   * @param directoryPath - The path to the directory to load files from.
   * @returns A promise that resolves to a result containing the loaded files or an error message.
   */
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
          namespace: params.namespace
        });
        if (fileResult.isFailure()) {
          return fail(fileResult.message);
        }

        const contentType = params.inferContentType?.(item.path, fileResult.value.contentType).orDefault();
        allFiles.push({
          path: item.path,
          contents: fileResult.value.contents,
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
    const response = await fetchImpl(
      `${params.baseUrl.replace(/\/$/, '')}${resourcePath}?${search.toString()}`
    ).catch((err: unknown) => ({ err } as const));

    if ('err' in response) {
      const message = response.err instanceof Error ? response.err.message : String(response.err);
      return fail(message);
    }

    if (!response.ok) {
      const message = await response.text().catch(() => `HTTP ${response.status}`);
      return fail(message);
    }

    const json = await response.json().catch(() => undefined);
    if (json === undefined) {
      return fail('invalid JSON response');
    }

    return succeed(json as T);
  }
}
