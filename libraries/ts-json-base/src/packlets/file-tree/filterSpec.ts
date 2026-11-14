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

import { IFilterSpec } from './fileTreeAccessors';

/**
 * Checks if a path matches a single pattern (string or RegExp).
 * @param path - The path to check.
 * @param pattern - The pattern to match against.
 * @returns `true` if the path matches the pattern.
 * @internal
 */
function matchesPattern(path: string, pattern: string | RegExp): boolean {
  if (typeof pattern === 'string') {
    return path === pattern || path.startsWith(pattern + '/') || path.includes(pattern);
  }
  return pattern.test(path);
}

/**
 * Checks if a path matches any pattern in an array.
 * @param path - The path to check.
 * @param patterns - The patterns to match against.
 * @returns `true` if the path matches any pattern.
 * @internal
 */
function matchesAny(path: string, patterns: (string | RegExp)[] | undefined): boolean {
  if (!patterns || patterns.length === 0) {
    return false;
  }
  return patterns.some((pattern) => matchesPattern(path, pattern));
}

/**
 * Checks if a path is allowed by a mutability configuration.
 * @param path - The path to check.
 * @param mutable - The mutability configuration.
 * @returns `true` if the path is mutable according to the configuration.
 * @public
 */
export function isPathMutable(path: string, mutable: boolean | IFilterSpec | undefined): boolean {
  if (mutable === undefined || mutable === false) {
    return false;
  }

  if (mutable === true) {
    return true;
  }

  const { include, exclude } = mutable;

  // If exclude patterns are specified and path matches, it's not mutable
  if (matchesAny(path, exclude)) {
    return false;
  }

  // If include patterns are specified, path must match at least one
  if (include && include.length > 0) {
    return matchesAny(path, include);
  }

  // No include patterns means all paths (not excluded) are mutable
  return true;
}
