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

import { fail, Result, succeed } from '@fgv/ts-utils';
import { KeyStore } from '../../../../packlets/crypto-utils';

/**
 * In-memory implementation of `IPrivateKeyStorage` for keystore tests.
 *
 * Not exported from `@fgv/ts-extras`. Lives in the test tree as a reference
 * implementation downstream packages may copy if useful, but the public API
 * delegates concrete backends to platform-specific packages
 * (browser/IDB in `@fgv/ts-web-extras`, encrypted-file in `@fgv/ts-chocolate`).
 *
 * Holds `CryptoKey` objects directly in a `Map`, so it advertises
 * `supportsNonExtractable: true` by default. The constructor accepts overrides
 * useful for negative tests:
 *   - `supportsNonExtractable: false` exercises the extractable=true codepath.
 *   - `failOn: { store?, load?, delete?, list? }` makes the named operations
 *     return Failure with a stable message so tests can assert downstream
 *     warning/error propagation without resorting to mocks.
 */
export class InMemoryPrivateKeyStorage implements KeyStore.IPrivateKeyStorage {
  public readonly supportsNonExtractable: boolean;
  public readonly entries: Map<string, CryptoKey>;
  private readonly _failOn: {
    readonly store?: string;
    readonly load?: string;
    readonly delete?: string;
    readonly list?: string;
  };

  public constructor(options?: {
    supportsNonExtractable?: boolean;
    failOn?: {
      store?: string;
      load?: string;
      delete?: string;
      list?: string;
    };
  }) {
    this.supportsNonExtractable = options?.supportsNonExtractable ?? true;
    this.entries = new Map();
    this._failOn = options?.failOn ?? {};
  }

  public async store(id: string, key: CryptoKey): Promise<Result<string>> {
    if (this._failOn.store) {
      return fail(this._failOn.store);
    }
    this.entries.set(id, key);
    return succeed(id);
  }

  public async load(id: string): Promise<Result<CryptoKey>> {
    if (this._failOn.load) {
      return fail(this._failOn.load);
    }
    const key = this.entries.get(id);
    if (!key) {
      return fail(`No private key for id '${id}'`);
    }
    return succeed(key);
  }

  public async delete(id: string): Promise<Result<string>> {
    if (this._failOn.delete) {
      return fail(this._failOn.delete);
    }
    if (!this.entries.has(id)) {
      return fail(`No private key for id '${id}'`);
    }
    this.entries.delete(id);
    return succeed(id);
  }

  public async list(): Promise<Result<readonly string[]>> {
    if (this._failOn.list) {
      return fail(this._failOn.list);
    }
    return succeed(Array.from(this.entries.keys()));
  }
}
