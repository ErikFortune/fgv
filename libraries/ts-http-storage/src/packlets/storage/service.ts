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

import { fail, type Result, succeed } from '@fgv/ts-utils';

import type {
  IHttpStorageProvider,
  IStorageFileResponse,
  IStoragePathRequest,
  IStorageSyncRequest,
  IStorageSyncResponse,
  IStorageTreeChildrenResponse,
  IStorageTreeItem,
  IStorageWriteFileRequest
} from './model';
import type { IHttpStorageProviderFactory } from './provider';

/**
 * Service layer for storage API operations.
 * @public
 */
export class HttpStorageService {
  private readonly _providers: IHttpStorageProviderFactory;

  public constructor(providers: IHttpStorageProviderFactory) {
    this._providers = providers;
  }

  public getItem(request: IStoragePathRequest): Result<IStorageTreeItem> {
    return this._getProvider(request.namespace).onSuccess((provider) => provider.getItem(request.path));
  }

  public getChildren(request: IStoragePathRequest): Result<IStorageTreeChildrenResponse> {
    return this._getProvider(request.namespace)
      .onSuccess((provider) => provider.getChildren(request.path))
      .onSuccess((children) =>
        succeed({
          path: request.path,
          children
        })
      );
  }

  public getFile(request: IStoragePathRequest): Result<IStorageFileResponse> {
    return this._getProvider(request.namespace).onSuccess((provider) => provider.getFile(request.path));
  }

  public saveFile(request: IStorageWriteFileRequest): Result<IStorageFileResponse> {
    return this._getProvider(request.namespace).onSuccess((provider) =>
      provider.saveFile(request.path, request.contents, request.contentType)
    );
  }

  public createDirectory(request: IStoragePathRequest): Result<IStorageTreeItem> {
    return this._getProvider(request.namespace).onSuccess((provider) =>
      provider.createDirectory(request.path)
    );
  }

  public async sync(request: IStorageSyncRequest): Promise<Result<IStorageSyncResponse>> {
    const providerResult = this._getProvider(request.namespace);
    if (providerResult.isFailure()) {
      return fail(providerResult.message);
    }
    return providerResult.value.sync();
  }

  private _getProvider(namespace?: string): Result<IHttpStorageProvider> {
    return this._providers.forNamespace(namespace).withErrorFormat((msg) => `provider: ${msg}`);
  }
}
