/*
 * MIT License
 *
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

import { IKillerConstraints } from '../killerCombinationsTypes';

/**
 * @internal
 */
export class CombinationCache {
  private static readonly _cache: Map<string, number[][]> = new Map<string, number[][]>();
  private static readonly _maxCacheSize: number = 1000;

  /**
   * Generate cache key for combination parameters.
   */
  public static generateKey(cageSize: number, total: number, constraints?: IKillerConstraints): string {
    const excluded = constraints?.excludedNumbers?.slice().sort().join(',') ?? '';
    const required = constraints?.requiredNumbers?.slice().sort().join(',') ?? '';
    return `${cageSize}:${total}:${excluded}:${required}`;
  }

  /**
   * Get cached combination result.
   */
  public static get(key: string): number[][] | undefined {
    const result = this._cache.get(key);
    if (result) {
      // Deep clone to prevent mutation of cached data
      return result.map((combination) => [...combination]);
    }
    return undefined;
  }

  /**
   * Store combination result in cache.
   */
  public static set(key: string, combinations: number[][]): void {
    // Implement simple LRU by clearing cache when it gets too large
    if (this._cache.size >= this._maxCacheSize) {
      this.clear();
    }

    // Deep clone to prevent mutation of cached data
    const clonedCombinations = combinations.map((combination) => [...combination]);
    this._cache.set(key, clonedCombinations);
  }

  /**
   * Clear the entire cache.
   */
  public static clear(): void {
    this._cache.clear();
  }

  /**
   * Get current cache size (for testing/debugging).
   */
  public static size(): number {
    return this._cache.size;
  }
}
