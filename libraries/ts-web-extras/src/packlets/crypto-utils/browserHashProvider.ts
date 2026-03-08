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

import { Result, succeed, fail } from '@fgv/ts-utils';

/**
 * Browser-compatible hash provider using the Web Crypto API.
 * Supports common hash algorithms available in browsers.
 * @public
 */
export class BrowserHashProvider {
  /**
   * Hash a string using the specified algorithm.
   * @param data - The string to hash
   * @param algorithm - The hash algorithm to use
   * @returns Promise resolving to the hex-encoded hash
   */
  public static async hashString(data: string, algorithm: string = 'SHA-256'): Promise<Result<string>> {
    try {
      /* c8 ignore next 3 - defense in depth */
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
