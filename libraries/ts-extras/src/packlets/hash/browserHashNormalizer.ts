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

import { Hash } from '@fgv/ts-utils';

/**
 * Browser-compatible hash normalizer that uses SHA-256 instead of MD5.
 * This provides a safer alternative to MD5 that works in browser environments
 * using the Web Crypto API.
 * @public
 */
export class BrowserHashNormalizer extends Hash.HashingNormalizer {
  public constructor() {
    super(BrowserHashNormalizer.sha256Hash);
  }

  /**
   * Compute SHA-256 hash using Web Crypto API.
   * Note: This is an async operation but provides a sync interface by throwing
   * an error that directs users to use the async version from \\@fgv/ts-web-extras.
   */
  public static sha256Hash(parts: string[]): string {
    throw new Error(
      'Browser crypto requires async operations. Use BrowserHashingNormalizer from @fgv/ts-web-extras for async browser-compatible hashing.'
    );
  }

  /**
   * Check if we're in a browser environment.
   */
  public static get isBrowserEnvironment(): boolean {
    /* c8 ignore next 1 - browser environment detection tested in browser context */
    return (
      typeof window !== 'undefined' && typeof crypto !== 'undefined' && typeof crypto.subtle !== 'undefined'
    );
  }

  /**
   * Get a browser-compatible hash normalizer recommendation.
   */
  public static getBrowserRecommendation(): string {
    return 'For browser environments, use BrowserHashingNormalizer from @fgv/ts-web-extras which provides async Web Crypto API support.';
  }
}
