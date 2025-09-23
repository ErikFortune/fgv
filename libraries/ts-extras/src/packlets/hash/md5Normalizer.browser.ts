/*
 * Copyright (c) 2023 Erik Fortune
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

import { Hash } from '@fgv/ts-utils';

/**
 * Simple deterministic hash implementation for browser environments.
 * Uses a basic string hash algorithm for consistent results.
 * Note: This is not cryptographically secure and does not produce MD5 hashes,
 * but provides deterministic hashing for resource normalization purposes.
 * @public
 */
export class SimpleHashNormalizer extends Hash.HashingNormalizer {
  public constructor() {
    super(SimpleHashNormalizer.simpleHash);
  }

  public static simpleHash(parts: string[]): string {
    // Simple hash implementation for browser compatibility
    // This provides consistent hashing without requiring Node.js crypto
    const input = parts.join('|');
    let hash = 0;

    if (input.length === 0) return '0';

    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      // eslint-disable-next-line no-bitwise
      hash = hash & hash; // Convert to 32-bit integer
    }

    // Convert to positive hex string, padded to consistent length
    const result = Math.abs(hash).toString(16).padStart(8, '0');

    // Extend to 32 character length for consistency
    return result + result + result + result;
  }
}
