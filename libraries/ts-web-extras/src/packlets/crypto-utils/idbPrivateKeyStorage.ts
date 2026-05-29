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
    const firstOpen = await this._open(undefined);
    /* c8 ignore next 3 - defensive: database open only fails on a corrupted/blocked IndexedDB environment */
    if (firstOpen.isFailure()) {
      return firstOpen;
    }
    // The object store is created in `onupgradeneeded`, which only fires when
    // the version changes. If a database at this name already existed at the
    // current version but without our store (e.g. a different `storeName` than
    // a prior instance used), the store is absent. Re-open at the next version
    // to add it via a version-bump upgrade rather than failing later writes
    // with NotFoundError.
    let db = firstOpen.value;
    if (!db.objectStoreNames.contains(this._storeName)) {
      const nextVersion = db.version + 1;
      db.close();
      const reopen = await this._open(nextVersion);
      /* c8 ignore next 3 - defensive: the version-bump re-open only fails on an IndexedDB environment fault */
      if (reopen.isFailure()) {
        return reopen;
      }
      db = reopen.value;
    }
    this._db = db;
    return succeed(db);
  }

  private async _open(version: number | undefined): Promise<Result<IDBDatabase>> {
    return captureAsyncResult<IDBDatabase>(
      () =>
        new Promise<IDBDatabase>((resolve, reject) => {
          const request =
            version === undefined
              ? this._factory.open(this._databaseName)
              : this._factory.open(this._databaseName, version);
          request.onupgradeneeded = (): void => {
            // Create our object store if absent. This fires on initial creation
            // and on the version bump used to add a store to an existing
            // database; future schema migrations extend this hook additively.
            if (!request.result.objectStoreNames.contains(this._storeName)) {
              request.result.createObjectStore(this._storeName);
            }
          };
          request.onsuccess = (): void => {
            const db = request.result;
            // If another connection (e.g. a sibling instance adding a store via
            // version bump, or another tab) needs to upgrade, close this one so
            // we don't block it. Clear the cached handle first so the next
            // operation reopens rather than reusing the now-closed connection.
            // Single-tab use is the documented assumption; this just prevents a
            // deadlock when several instances share a db.
            db.onversionchange = (): void => {
              if (this._db === db) {
                this._db = undefined;
              }
              db.close();
            };
            resolve(db);
          };
          /* c8 ignore next 2 - defensive: open errors require a corrupted/blocked IndexedDB environment */
          request.onerror = (): void => reject(request.error ?? new Error('IndexedDB open failed'));
        })
    );
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
    const txnResult = captureResult(() => dbResult.value.transaction(this._storeName, mode));
    /* c8 ignore next 3 - transaction creation only throws if the store was deleted out from under us */
    if (txnResult.isFailure()) {
      return fail(txnResult.message);
    }
    const transaction = txnResult.value;

    // For writes, a successful request is not durable until the transaction
    // commits (oncomplete); it can still abort afterwards. Attach the completion
    // listener BEFORE issuing the request so no event is missed, and wait for it
    // before reporting success. Reads need no such wait.
    const completion = mode === 'readwrite' ? this._awaitCompletion(transaction) : undefined;

    // `op` builds and issues the IDB request synchronously (e.g. `store.put`),
    // which can throw before any Promise is created — DataCloneError on a
    // non-cloneable value, or a transaction-state DOMException. Run it inside a
    // capture boundary so those surface as Failure rather than a rejection,
    // preserving the Result contract.
    const opOuter = await captureAsyncResult(() => op(transaction.objectStore(this._storeName)));
    /* c8 ignore next 3 - defensive: synchronous IDB throws (e.g. DataCloneError) are unreachable for the typed public surface (private CryptoKeys clone; reads pass a string id), but the capture preserves the Result contract */
    if (opOuter.isFailure()) {
      return fail(opOuter.message);
    }
    const opResult = opOuter.value;
    /* c8 ignore next 3 - defensive: the request itself only fails on an IndexedDB environment fault */
    if (opResult.isFailure()) {
      return opResult;
    }
    if (completion !== undefined) {
      const commitResult = await completion;
      /* c8 ignore next 3 - defensive: a transaction abort after a successful request requires an IndexedDB environment fault */
      if (commitResult.isFailure()) {
        return fail(commitResult.message);
      }
    }
    return opResult;
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

  private async _awaitCompletion(transaction: IDBTransaction): Promise<Result<true>> {
    return captureAsyncResult<true>(
      () =>
        new Promise<true>((resolve, reject) => {
          transaction.oncomplete = (): void => resolve(true);
          /* c8 ignore next 4 - defensive: abort/error after a successful write requires an IndexedDB environment fault */
          transaction.onabort = (): void =>
            reject(transaction.error ?? new Error('IndexedDB transaction aborted'));
          transaction.onerror = (): void =>
            reject(transaction.error ?? new Error('IndexedDB transaction error'));
        })
    );
  }
}
