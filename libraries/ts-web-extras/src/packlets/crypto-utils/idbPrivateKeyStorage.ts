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

import { captureAsyncResult, captureResult, fail, Result, succeed } from '@fgv/ts-utils';
import { CryptoUtils } from '@fgv/ts-extras';

/**
 * Parameters for {@link IdbPrivateKeyStorage.create}.
 * @public
 */
export interface IIdbPrivateKeyStorageCreateParams {
  /**
   * IndexedDB database name. Default: `'fgv-keystore-private-keys'`.
   */
  readonly databaseName?: string;

  /**
   * IndexedDB object-store name. Default: `'privateKeys'`.
   */
  readonly storeName?: string;

  /**
   * IndexedDB factory to use. Defaults to `globalThis.indexedDB`. Supplied
   * explicitly in tests (e.g. a `fake-indexeddb` factory) or to target a
   * non-default factory.
   */
  readonly indexedDB?: IDBFactory;
}

const DEFAULT_DATABASE_NAME: string = 'fgv-keystore-private-keys';
const DEFAULT_STORE_NAME: string = 'privateKeys';

/**
 * Current IndexedDB schema version. The IndexedDB database version *is* the
 * schema version; future migrations bump this and extend the `onupgradeneeded`
 * switch additively.
 */
const SCHEMA_VERSION: number = 1;

/**
 * {@link CryptoUtils.KeyStore.IPrivateKeyStorage | IPrivateKeyStorage}
 * implementation backed by IndexedDB. Stores `CryptoKey` objects directly via
 * IndexedDB's structured-clone serialization — no JWK round-trip — so it works
 * with non-extractable keys.
 *
 * `supportsNonExtractable` is `true`: because the `CryptoKey` is stored by
 * reference (structured clone) rather than exported, the keystore may generate
 * `extractable: false` keys for maximum security on browsers that support it.
 *
 * The database is opened lazily on first use and cached. Each operation runs in
 * its own transaction, relying on IndexedDB's default serialization. Multi-tab
 * concurrency is a known limitation: two tabs writing the same id can race; this
 * implementation targets single-tab use.
 *
 * @public
 */
export class IdbPrivateKeyStorage implements CryptoUtils.KeyStore.IPrivateKeyStorage {
  /**
   * `true` — IndexedDB stores `CryptoKey` objects directly, so non-extractable
   * keys are supported.
   */
  public readonly supportsNonExtractable: true = true;

  private readonly _factory: IDBFactory;
  private readonly _databaseName: string;
  private readonly _storeName: string;
  private _db: IDBDatabase | undefined;

  private constructor(factory: IDBFactory, databaseName: string, storeName: string) {
    this._factory = factory;
    this._databaseName = databaseName;
    this._storeName = storeName;
  }

  /**
   * Creates a new {@link IdbPrivateKeyStorage}.
   * @param params - Optional {@link IIdbPrivateKeyStorageCreateParams}.
   * @returns `Success` with the new instance, or `Failure` if no IndexedDB
   * factory is available.
   */
  public static create(params: IIdbPrivateKeyStorageCreateParams = {}): Result<IdbPrivateKeyStorage> {
    const factory: IDBFactory | undefined = params.indexedDB ?? globalThis.indexedDB;
    if (factory === undefined) {
      return fail('IdbPrivateKeyStorage: no IndexedDB factory available (pass params.indexedDB)');
    }
    return succeed(
      new IdbPrivateKeyStorage(
        factory,
        params.databaseName ?? DEFAULT_DATABASE_NAME,
        params.storeName ?? DEFAULT_STORE_NAME
      )
    );
  }

  /**
   * Stores `key` under `id`.
   * @param id - Storage handle to write under.
   * @param key - The private `CryptoKey` to persist.
   */
  public async store(id: string, key: CryptoKey): Promise<Result<string>> {
    if (key.type !== 'private') {
      return fail(`failed to store private key '${id}': expected a private key, got '${key.type}'`);
    }
    return (await this._withStore('readwrite', (store) => this._request(store.put(key, id))))
      .withErrorFormat((msg) => `failed to store private key '${id}': ${msg}`)
      .onSuccess(() => succeed(id));
  }

  /**
   * Loads the private key stored under `id`.
   * @param id - Storage handle to look up.
   */
  public async load(id: string): Promise<Result<CryptoKey>> {
    return (await this._getRaw(id))
      .withErrorFormat((msg) => `failed to load private key '${id}': ${msg}`)
      .onSuccess((key) => (key === undefined ? fail(`key not found: '${id}'`) : succeed(key)));
  }

  /**
   * Deletes the entry stored under `id`. Missing ids fail, mirroring the
   * encrypted-file backend. The existence check and the delete run in separate
   * transactions (single-tab assumption).
   * @param id - Storage handle to remove.
   */
  public async delete(id: string): Promise<Result<string>> {
    const existingResult = await this._getRaw(id);
    /* c8 ignore next 3 - defensive: the existence-check read only fails on an IndexedDB environment error */
    if (existingResult.isFailure()) {
      return fail(`failed to delete private key '${id}': ${existingResult.message}`);
    }
    if (existingResult.value === undefined) {
      return fail(`key not found: '${id}'`);
    }
    return (await this._withStore('readwrite', (store) => this._request(store.delete(id))))
      .withErrorFormat((msg) => `failed to delete private key '${id}': ${msg}`)
      .onSuccess(() => succeed(id));
  }

  /**
   * Lists every stored id.
   */
  public async list(): Promise<Result<readonly string[]>> {
    return (await this._withStore('readonly', (store) => this._request<IDBValidKey[]>(store.getAllKeys())))
      .withErrorFormat((msg) => `failed to list private keys: ${msg}`)
      .onSuccess((keys) => succeed(keys.map((key) => String(key))));
  }

  private async _getRaw(id: string): Promise<Result<CryptoKey | undefined>> {
    return this._withStore('readonly', (store) => this._request<CryptoKey | undefined>(store.get(id)));
  }

  private async _openDb(): Promise<Result<IDBDatabase>> {
    if (this._db !== undefined) {
      return succeed(this._db);
    }
    const openResult = await captureAsyncResult<IDBDatabase>(
      () =>
        new Promise<IDBDatabase>((resolve, reject) => {
          const request = this._factory.open(this._databaseName, SCHEMA_VERSION);
          request.onupgradeneeded = (): void => {
            // Schema v1: create the private-keys object store. Future schema
            // versions bump SCHEMA_VERSION and switch on the upgrade event's
            // oldVersion to apply additive migrations from here.
            request.result.createObjectStore(this._storeName);
          };
          request.onsuccess = (): void => resolve(request.result);
          /* c8 ignore next 2 - defensive: open errors require a corrupted/blocked IndexedDB environment */
          request.onerror = (): void => reject(request.error ?? new Error('IndexedDB open failed'));
        })
    );
    return openResult.onSuccess((db) => {
      this._db = db;
      return succeed(db);
    });
  }

  private async _withStore<T>(
    mode: IDBTransactionMode,
    op: (store: IDBObjectStore) => Promise<Result<T>>
  ): Promise<Result<T>> {
    const dbResult = await this._openDb();
    /* c8 ignore next 3 - defensive: database open only fails on a corrupted/blocked IndexedDB environment */
    if (dbResult.isFailure()) {
      return fail(dbResult.message);
    }
    const txnResult = captureResult(() =>
      dbResult.value.transaction(this._storeName, mode).objectStore(this._storeName)
    );
    /* c8 ignore next 3 - transaction creation only throws if the store was deleted out from under us */
    if (txnResult.isFailure()) {
      return fail(txnResult.message);
    }
    return op(txnResult.value);
  }

  private async _request<T>(request: IDBRequest<T>): Promise<Result<T>> {
    return captureAsyncResult<T>(
      () =>
        new Promise<T>((resolve, reject) => {
          request.onsuccess = (): void => resolve(request.result);
          /* c8 ignore next 2 - defensive: per-request errors require a corrupted IndexedDB environment */
          request.onerror = (): void => reject(request.error ?? new Error('IndexedDB request failed'));
        })
    );
  }
}
