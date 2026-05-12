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

import { argon2id } from 'hash-wasm';
import { Result, captureAsyncResult, fail, succeed } from '@fgv/ts-utils';
import { CryptoUtils } from '@fgv/ts-extras';

/**
 * Browser (and Node) implementation of {@link @fgv/ts-extras#IArgon2idProvider} backed by
 * `hash-wasm` (pure WASM — no Web Crypto dependency). Runs identically in both Node and
 * browser environments, enabling cross-runtime test equivalence.
 * @public
 */
export class BrowserArgon2Provider implements CryptoUtils.IArgon2idProvider {
  private constructor() {}

  /**
   * Creates a new {@link BrowserArgon2Provider} instance.
   * @returns Success with a new provider instance.
   * @public
   */
  public static create(): Result<BrowserArgon2Provider> {
    return succeed(new BrowserArgon2Provider());
  }

  /**
   * Derives a key using Argon2id via the hash-wasm WASM implementation.
   *
   * @remarks
   * `hash-wasm` computes Argon2id sequentially regardless of the `parallelism` value —
   * the WASM engine does not spawn worker threads. The `parallelism` value IS still wired
   * into the hash computation; output bytes differ for different parallelism values.
   * For interoperability with server-side Node derivations, ensure both sides use the same
   * `parallelism` value (recommend `parallelism: 1` unless compatibility requires otherwise).
   *
   * @param password - The password or passphrase (string or raw bytes).
   * @param salt - The salt (must be at least 8 bytes; 16+ bytes recommended).
   * @param params - Argon2id parameters. All values are validated before derivation.
   * @returns Success with the derived key bytes, or Failure with a descriptive message.
   * @public
   */
  public async argon2id(
    password: Uint8Array | string,
    salt: Uint8Array,
    params: CryptoUtils.IArgon2idParams
  ): Promise<Result<Uint8Array>> {
    const error = BrowserArgon2Provider._validateParams(params);
    if (error !== undefined) {
      return fail(error);
    }

    return captureAsyncResult(async () => {
      const result = await argon2id({
        password,
        salt,
        iterations: params.iterations,
        parallelism: params.parallelism,
        memorySize: params.memoryKiB,
        hashLength: params.outputBytes,
        outputType: 'binary'
      });
      return result;
    });
  }

  private static _validateParams(params: CryptoUtils.IArgon2idParams): string | undefined {
    if (params.memoryKiB < 8) {
      return `argon2id: memoryKiB must be >= 8, got ${params.memoryKiB}`;
    }
    if (params.iterations < 1) {
      return `argon2id: iterations must be >= 1, got ${params.iterations}`;
    }
    if (params.parallelism < 1 || params.parallelism > 255) {
      return `argon2id: parallelism must be 1..255, got ${params.parallelism}`;
    }
    if (params.outputBytes < 4) {
      return `argon2id: outputBytes must be >= 4, got ${params.outputBytes}`;
    }
    return undefined;
  }
}
