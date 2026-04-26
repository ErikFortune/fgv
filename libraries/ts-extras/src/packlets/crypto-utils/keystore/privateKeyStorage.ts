// Copyright (c) 2026 Erik Fortune
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

import { Result } from '@fgv/ts-utils';

/**
 * Pluggable backend that persists raw asymmetric private keys outside of the
 * encrypted keystore vault. Concrete implementations live in platform-specific
 * packages (e.g. an IndexedDB-backed implementation in `@fgv/ts-web-extras` or
 * an encrypted-file implementation in `@fgv/ts-chocolate`).
 *
 * The keystore writes storage-first: a private key is always stored here
 * before the corresponding public-key vault entry is committed. Conversely,
 * deletes hit the vault first and then this storage best-effort. As a result,
 * crashes or skipped saves can leave orphaned blobs here; callers are expected
 * to reconcile via {@link CryptoUtils.KeyStore.IPrivateKeyStorage.list} cross-referenced
 * against the keystore's asymmetric entries.
 *
 * @public
 */
export interface IPrivateKeyStorage {
  /**
   * Whether keys generated for this backend may be marked
   * `extractable: false`. `true` on backends that store `CryptoKey`
   * objects directly (e.g. IndexedDB). `false` on backends that must
   * round-trip via JWK (e.g. encrypted-file backends).
   */
  readonly supportsNonExtractable: boolean;

  /**
   * Stores `key` under `id`. Returns the stored `id` on success so the
   * call can compose into a Result chain.
   * @param id - Storage handle to write under.
   * @param key - The private `CryptoKey` to persist.
   */
  store(id: string, key: CryptoKey): Promise<Result<string>>;

  /**
   * Loads the private key previously stored under `id`.
   * @param id - Storage handle to look up.
   */
  load(id: string): Promise<Result<CryptoKey>>;

  /**
   * Deletes the entry stored under `id`. Returns the deleted `id` on
   * success so the call can compose into a Result chain.
   * @param id - Storage handle to remove.
   */
  delete(id: string): Promise<Result<string>>;

  /**
   * Lists every `id` currently held by the backend. Used by consumers to
   * garbage-collect orphans left by crashes or aborted sessions; the
   * keystore itself does not invoke this automatically.
   */
  list(): Promise<Result<readonly string[]>>;
}
