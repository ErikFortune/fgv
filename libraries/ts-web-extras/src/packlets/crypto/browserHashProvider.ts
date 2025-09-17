/*
 * Copyright (c) 2025 Erik Fortune
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

import { Hash, Result, succeed, fail } from '@fgv/ts-utils';

/**
 * Browser-compatible hash provider using the Web Crypto API.
 * Supports common hash algorithms available in browsers.
 * @public
 */
export class BrowserHashProvider {
  /**
   * Create an MD5 normalizer using browser crypto (via SHA-256 as MD5 is not available in Web Crypto).
   * Note: This uses SHA-256 instead of MD5 for better security and browser compatibility.
   * @returns A hashing normalizer using SHA-256
   */
  public static createSha256Normalizer(): BrowserHashingNormalizer {
    return new BrowserHashingNormalizer('SHA-256');
  }

  /**
   * Create a SHA-1 normalizer using browser crypto.
   * @returns A hashing normalizer using SHA-1
   */
  public static createSha1Normalizer(): BrowserHashingNormalizer {
    return new BrowserHashingNormalizer('SHA-1');
  }

  /**
   * Create a SHA-512 normalizer using browser crypto.
   * @returns A hashing normalizer using SHA-512
   */
  public static createSha512Normalizer(): BrowserHashingNormalizer {
    return new BrowserHashingNormalizer('SHA-512');
  }

  /**
   * Hash a string using the specified algorithm.
   * @param data - The string to hash
   * @param algorithm - The hash algorithm to use
   * @returns Promise resolving to the hex-encoded hash
   */
  public static async hashString(data: string, algorithm: string = 'SHA-256'): Promise<Result<string>> {
    try {
      if (!crypto.subtle) {
        return fail('Web Crypto API not available in this environment');
      }

      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);
      const hashBuffer = await crypto.subtle.digest(algorithm, dataBuffer);
      const hashArray = new Uint8Array(hashBuffer);
      const hashHex = Array.from(hashArray)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');

      return succeed(hashHex);
    } catch (error) {
      return fail(`Hash computation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Hash multiple strings concatenated with a separator.
   * @param parts - Array of strings to concatenate and hash
   * @param algorithm - The hash algorithm to use
   * @param separator - Separator to use between parts (default: '|')
   * @returns Promise resolving to the hex-encoded hash
   */
  public static async hashParts(
    parts: string[],
    algorithm: string = 'SHA-256',
    separator: string = '|'
  ): Promise<Result<string>> {
    const combined = parts.join(separator);
    return this.hashString(combined, algorithm);
  }
}

/**
 * Browser-compatible hashing normalizer using Web Crypto API.
 * @public
 */
export class BrowserHashingNormalizer extends Hash.HashingNormalizer {
  private readonly _algorithm: string;

  /**
   * Create a new browser hashing normalizer.
   * @param algorithm - The hash algorithm to use (e.g., 'SHA-256', 'SHA-1', 'SHA-512')
   */
  public constructor(algorithm: string = 'SHA-256') {
    super((parts: string[]) => {
      throw new Error('Synchronous hashing not supported in browser. Use hashAsync instead.');
    });
    this._algorithm = algorithm;
  }

  /**
   * Asynchronously compute the hash of the provided parts.
   * @param parts - Array of strings to hash
   * @returns Promise resolving to the hash result
   */
  public async hashAsync(parts: string[]): Promise<Result<string>> {
    return BrowserHashProvider.hashParts(parts, this._algorithm);
  }

  /**
   * Asynchronously normalize an object to its hash representation.
   * @param from - The object to normalize
   * @returns Promise resolving to the normalized hash result
   */
  public async normalizeAsync<T>(from: T): Promise<Result<string>> {
    const hashResult = this.computeHash(from);
    if (hashResult.isFailure()) {
      return hashResult;
    }
    // The synchronous computeHash returns a hash, but we need to use async crypto
    // So we'll re-implement the logic asynchronously
    return this._computeHashAsync(from);
  }

  /**
   * Asynchronously compute hash for complex objects.
   * @param from - The object to hash
   * @returns Promise resolving to the hash result
   */
  private async _computeHashAsync(from: unknown): Promise<Result<string>> {
    try {
      switch (typeof from) {
        case 'string':
        case 'bigint':
        case 'boolean':
        case 'number':
        case 'symbol':
        case 'undefined':
          const literalResult = this._normalizeLiteralToString(from);
          if (literalResult.isFailure()) return literalResult;
          return this.hashAsync([literalResult.value]);

        case 'object':
          if (from === null || from instanceof Date || from instanceof RegExp) {
            const literalResult = this._normalizeLiteralToString(from);
            if (literalResult.isFailure()) return literalResult;
            return this.hashAsync([literalResult.value]);
          } else if (Array.isArray(from)) {
            const hashPromises = from.map((e) => this._computeHashAsync(e));
            const hashResults = await Promise.all(hashPromises);
            const allHashes: string[] = [];
            for (const result of hashResults) {
              if (result.isFailure()) return result;
              allHashes.push(result.value);
            }
            return this.hashAsync(['array', ...allHashes]);
          }
          // Handle objects
          const entries = Object.entries(from).sort((a, b) => String(a[0]).localeCompare(String(b[0])));
          const entryHashes: string[] = [];
          for (const [key, value] of entries) {
            const valueHash = await this._computeHashAsync(value);
            if (valueHash.isFailure()) return valueHash;
            entryHashes.push(`${key}:${valueHash.value}`);
          }
          return this.hashAsync(['object', ...entryHashes]);
      }
      return fail(`computeHash: Unexpected type - cannot hash '${typeof from}'`);
    } catch (error) {
      return fail(`Hash computation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get the algorithm used by this normalizer.
   */
  public get algorithm(): string {
    return this._algorithm;
  }
}
