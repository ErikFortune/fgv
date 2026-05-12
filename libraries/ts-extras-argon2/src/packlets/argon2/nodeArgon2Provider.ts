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

import * as argon2 from 'argon2';
import { Result, captureAsyncResult, fail, succeed } from '@fgv/ts-utils';
import { CryptoUtils } from '@fgv/ts-extras';

/**
 * Node.js implementation of {@link @fgv/ts-extras#IArgon2idProvider} backed by the
 * `argon2` (kelektiv) native binding.
 * @public
 */
export class NodeArgon2Provider implements CryptoUtils.IArgon2idProvider {
  private constructor() {}

  /**
   * Creates a new {@link NodeArgon2Provider} instance.
   * @returns Success with a new provider instance.
   * @public
   */
  public static create(): Result<NodeArgon2Provider> {
    return succeed(new NodeArgon2Provider());
  }

  /**
   * Derives a key using Argon2id.
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
    const error = NodeArgon2Provider._validateParams(params);
    if (error !== undefined) {
      return fail(error);
    }

    return captureAsyncResult(async () => {
      const result = await argon2.hash(password instanceof Uint8Array ? Buffer.from(password) : password, {
        type: argon2.argon2id,
        salt: Buffer.from(salt),
        memoryCost: params.memoryKiB,
        timeCost: params.iterations,
        parallelism: params.parallelism,
        hashLength: params.outputBytes,
        raw: true
      });
      return Uint8Array.from(result);
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
