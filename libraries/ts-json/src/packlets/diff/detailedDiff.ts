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

import { JsonValue, isJsonObject, isJsonArray, isJsonPrimitive } from '@fgv/ts-json-base';
import { Result, succeed } from '@fgv/ts-utils';
import { deepEquals } from './utils';

/**
 * JSON Diff Utilities for TypeScript
 *
 * This module provides comprehensive tools for comparing JSON values and identifying
 * differences between them. It offers two complementary approaches:
 *
 * ## **Detailed Diff API** (`jsonDiff`)
 * Best for analysis, debugging, and understanding specific changes:
 * - Returns a list of individual changes with exact paths and values
 * - Ideal for logging, change tracking, and detailed analysis
 * - Configurable options for array handling and path notation
 *
 * ## **Three-Way Diff API** (`jsonThreeWayDiff`)
 * Best for applying changes and programmatic manipulation:
 * - Returns three objects representing removed, unchanged, and added data
 * - Perfect for merging, UI displays, and actionable results
 * - Treats arrays as atomic units for simpler handling
 *
 * ## **Simple Equality** (`jsonEquals`)
 * Fast boolean check for JSON equality without change details.
 *
 * **Key Features:**
 * - Deep recursive comparison of nested structures
 * - Support for all JSON types: objects, arrays, primitives, null
 * - TypeScript-first with comprehensive type safety
 * - Result pattern for consistent error handling
 * - Extensive TSDoc documentation with practical examples
 *
 * @example Quick comparison of the two main APIs
 * ```typescript
 * const before = { name: "John", age: 30, city: "NYC" };
 * const after = { name: "Jane", age: 30, country: "USA" };
 *
 * // Detailed analysis
 * const detailed = jsonDiff(before, after);
 * // Returns: [
 * //   { path: "name", type: "modified", oldValue: "John", newValue: "Jane" },
 * //   { path: "city", type: "removed", oldValue: "NYC" },
 * //   { path: "country", type: "added", newValue: "USA" }
 * // ]
 *
 * // Actionable objects
 * const actionable = jsonThreeWayDiff(before, after);
 * // Returns: {
 * //   onlyInA: { name: "John", city: "NYC" },
 * //   unchanged: { age: 30 },
 * //   onlyInB: { name: "Jane", country: "USA" }
 * // }
 *
 * // Apply changes: { ...unchanged, ...onlyInB }
 * // Revert changes: { ...unchanged, ...onlyInA }
 * ```
 */

/**
 * Type of change detected in a JSON diff operation.
 *
 * - `'added'` - Property exists only in the second object
 * - `'removed'` - Property exists only in the first object
 * - `'modified'` - Property exists in both objects but with different values
 * - `'unchanged'` - Property exists in both objects with identical values (only included when `includeUnchanged` is true)
 *
 * @public
 */
export type DiffChangeType = 'added' | 'removed' | 'modified' | 'unchanged';

/**
 * Represents a single change in a JSON diff operation.
 *
 * Each change describes a specific difference between two JSON values, including
 * the location of the change and the old/new values involved.
 *
 * @example
 * ```typescript
 * // Example changes from diffing { name: "John", age: 30 } vs { name: "Jane", city: "NYC" }
 * const changes: IDiffChange[] = [
 *   { path: "name", type: "modified", oldValue: "John", newValue: "Jane" },
 *   { path: "age", type: "removed", oldValue: 30 },
 *   { path: "city", type: "added", newValue: "NYC" }
 * ];
 * ```
 *
 * @public
 */
export interface IDiffChange {
  /**
   * The path to the changed value using dot notation.
   *
   * For nested objects, uses dots to separate levels (e.g., "user.profile.name").
   * For arrays, uses numeric indices (e.g., "items.0.id", "tags.2").
   * Empty string indicates the root value itself changed.
   *
   * @example "user.name", "items.0.id", "settings.theme", ""
   */
  path: string;

  /**
   * The type of change that occurred.
   *
   * @see {@link DiffChangeType} for detailed descriptions of each change type.
   */
  type: DiffChangeType;

  /**
   * The value in the first object.
   *
   * - Present for `'removed'` and `'modified'` changes
   * - Present for `'unchanged'` changes when `includeUnchanged` is true
   * - Undefined for `'added'` changes
   */
  oldValue?: JsonValue;

  /**
   * The value in the second object.
   *
   * - Present for `'added'` and `'modified'` changes
   * - Present for `'unchanged'` changes when `includeUnchanged` is true
   * - Undefined for `'removed'` changes
   */
  newValue?: JsonValue;
}

/**
 * Result of a JSON diff operation containing all detected changes.
 *
 * This interface provides detailed information about every difference found
 * between two JSON values, making it ideal for analysis, debugging, and
 * understanding exactly what changed.
 *
 * @example
 * ```typescript
 * const result: IDiffResult = {
 *   changes: [
 *     { path: "name", type: "modified", oldValue: "John", newValue: "Jane" },
 *     { path: "hobbies.1", type: "added", newValue: "gaming" }
 *   ],
 *   identical: false
 * };
 * ```
 *
 * @see {@link IDiffChange} for details about individual change objects
 * @see {@link Diff.jsonDiff} for the function that produces this result
 * @public
 */
export interface IDiffResult {
  /**
   * Array of all changes detected between the two JSON objects.
   *
   * Changes are ordered by the path where they occur. For nested structures,
   * parent changes appear before child changes.
   */
  changes: IDiffChange[];

  /**
   * True if the objects are identical, false otherwise.
   *
   * When true, the `changes` array will be empty (unless `includeUnchanged`
   * option was used, in which case it may contain 'unchanged' entries).
   */
  identical: boolean;
}

/**
 * Options for customizing JSON diff behavior.
 *
 * These options allow you to control how the diff algorithm processes
 * different types of JSON structures and what information is included
 * in the results.
 *
 * @example
 * ```typescript
 * // Include unchanged values and use custom path separator
 * const options: IJsonDiffOptions = {
 *   includeUnchanged: true,
 *   pathSeparator: '/',
 *   arrayOrderMatters: false
 * };
 *
 * const result = jsonDiff(obj1, obj2, options);
 * ```
 *
 * @public
 */
export interface IJsonDiffOptions {
  /**
   * If true, includes unchanged values in the result.
   *
   * When enabled, the diff result will include entries with `type: 'unchanged'`
   * for properties that exist in both objects with identical values. This can
   * be useful for displaying complete side-by-side comparisons.
   *
   * @defaultValue false
   */
  includeUnchanged?: boolean;

  /**
   * Custom path separator for nested property paths.
   *
   * Controls the character used to separate levels in nested object paths.
   * For example, with separator `'/'`, a nested property would be reported
   * as `"user/profile/name"` instead of `"user.profile.name"`.
   *
   * @defaultValue "."
   * @example "/", "-\>", "::"
   */
  pathSeparator?: string;

  /**
   * If true, treats arrays as ordered lists where position matters.
   * If false, treats arrays as unordered sets.
   *
   * When `true` (default), array changes are reported by index position:
   * `[1,2,3]` vs `[1,3,2]` shows modifications at indices 1 and 2.
   *
   * When `false`, arrays are compared as sets: `[1,2,3]` vs `[1,3,2]`
   * may be considered equivalent (simplified unordered comparison).
   *
   * @defaultValue true
   */
  arrayOrderMatters?: boolean;
}

/**
 * Internal recursive diff function that builds the change list.
 */
function diffRecursive(
  obj1: JsonValue,
  obj2: JsonValue,
  path: string,
  options: Required<IJsonDiffOptions>,
  changes: IDiffChange[]
): void {
  const pathPrefix = path ? `${path}${options.pathSeparator}` : '';

  // Handle primitive values
  if (isJsonPrimitive(obj1) || isJsonPrimitive(obj2)) {
    if (!deepEquals(obj1, obj2)) {
      changes.push({
        path,
        type: 'modified',
        oldValue: obj1,
        newValue: obj2
      });
    } else if (options.includeUnchanged) {
      changes.push({
        path,
        type: 'unchanged',
        oldValue: obj1,
        newValue: obj2
      });
    }
    return;
  }

  // Handle arrays
  if (isJsonArray(obj1) && isJsonArray(obj2)) {
    if (options.arrayOrderMatters) {
      // Ordered array comparison
      const maxLength = Math.max(obj1.length, obj2.length);
      for (let i = 0; i < maxLength; i++) {
        const itemPath = `${pathPrefix}${i}`;

        if (i >= obj1.length) {
          changes.push({
            path: itemPath,
            type: 'added',
            newValue: obj2[i]
          });
        } else if (i >= obj2.length) {
          changes.push({
            path: itemPath,
            type: 'removed',
            oldValue: obj1[i]
          });
        } else {
          diffRecursive(obj1[i], obj2[i], itemPath, options, changes);
        }
      }
    } else {
      // Unordered array comparison - simplified approach
      // This is a basic implementation; a more sophisticated approach would use
      // algorithms like longest common subsequence for better matching
      const processed = new Set<number>();

      // Find matching elements
      for (let i = 0; i < obj1.length; i++) {
        let found = false;
        for (let j = 0; j < obj2.length; j++) {
          if (!processed.has(j) && deepEquals(obj1[i], obj2[j])) {
            processed.add(j);
            found = true;
            if (options.includeUnchanged) {
              changes.push({
                path: `${pathPrefix}${i}`,
                type: 'unchanged',
                oldValue: obj1[i],
                newValue: obj2[j]
              });
            }
            break;
          }
        }
        if (!found) {
          changes.push({
            path: `${pathPrefix}${i}`,
            type: 'removed',
            oldValue: obj1[i]
          });
        }
      }

      // Find added elements
      for (let j = 0; j < obj2.length; j++) {
        if (!processed.has(j)) {
          changes.push({
            path: `${pathPrefix}${j}`,
            type: 'added',
            newValue: obj2[j]
          });
        }
      }
    }
    return;
  }

  // Handle one array, one non-array
  if (isJsonArray(obj1) || isJsonArray(obj2)) {
    changes.push({
      path,
      type: 'modified',
      oldValue: obj1,
      newValue: obj2
    });
    return;
  }

  // Handle objects
  if (isJsonObject(obj1) && isJsonObject(obj2)) {
    const keys1 = new Set(Object.keys(obj1));
    const keys2 = new Set(Object.keys(obj2));
    const allKeys = new Set([...keys1, ...keys2]);

    for (const key of allKeys) {
      const keyPath = path ? `${path}${options.pathSeparator}${key}` : key;

      if (!keys1.has(key)) {
        changes.push({
          path: keyPath,
          type: 'added',
          newValue: obj2[key]
        });
      } else if (!keys2.has(key)) {
        changes.push({
          path: keyPath,
          type: 'removed',
          oldValue: obj1[key]
        });
      } else {
        diffRecursive(obj1[key], obj2[key], keyPath, options, changes);
      }
    }
    return;
  }
  /* c8 ignore next 9 - defensive code path that should never be reached with valid JsonValue types */

  // Handle mixed object types
  changes.push({
    path,
    type: 'modified',
    oldValue: obj1,
    newValue: obj2
  });
}

/**
 * Performs a deep diff comparison between two JSON values.
 *
 * This function provides detailed change tracking by analyzing every difference
 * between two JSON structures. It returns a list of specific changes with paths,
 * making it ideal for debugging, logging, change analysis, and understanding
 * exactly what has changed between two data states.
 *
 * **Key Features:**
 * - Deep recursive comparison of nested objects and arrays
 * - Precise path tracking using dot notation (e.g., "user.profile.name")
 * - Support for all JSON value types: objects, arrays, primitives, null
 * - Configurable array comparison (ordered vs unordered)
 * - Optional inclusion of unchanged values for complete comparisons
 *
 * **Use Cases:**
 * - Debugging data changes in applications
 * - Generating change logs or audit trails
 * - Validating API responses against expected data
 * - Creating detailed diff reports for data synchronization
 *
 * @param obj1 - The first JSON value to compare (often the "before" state)
 * @param obj2 - The second JSON value to compare (often the "after" state)
 * @param options - Optional configuration for customizing diff behavior
 * @returns A Result containing the diff result with all detected changes
 *
 * @example Basic usage with objects
 * ```typescript
 * const before = { name: "John", age: 30, city: "NYC" };
 * const after = { name: "Jane", age: 30, country: "USA" };
 *
 * const result = jsonDiff(before, after);
 * if (result.success) {
 *   result.value.changes.forEach(change => {
 *     console.log(`${change.path}: ${change.type}`);
 *     // Output:
 *     // name: modified
 *     // city: removed
 *     // country: added
 *   });
 * }
 * ```
 *
 * @example With arrays and nested structures
 * ```typescript
 * const user1 = {
 *   profile: { name: "John", hobbies: ["reading"] },
 *   settings: { theme: "dark" }
 * };
 * const user2 = {
 *   profile: { name: "John", hobbies: ["reading", "gaming"] },
 *   settings: { theme: "light", notifications: true }
 * };
 *
 * const result = jsonDiff(user1, user2);
 * if (result.success) {
 *   console.log(result.value.changes);
 *   // [
 *   //   { path: "profile.hobbies.1", type: "added", newValue: "gaming" },
 *   //   { path: "settings.theme", type: "modified", oldValue: "dark", newValue: "light" },
 *   //   { path: "settings.notifications", type: "added", newValue: true }
 *   // ]
 * }
 * ```
 *
 * @example Using options for custom behavior
 * ```typescript
 * const options: IJsonDiffOptions = {
 *   includeUnchanged: true,        // Include unchanged properties
 *   pathSeparator: '/',            // Use '/' instead of '.' in paths
 *   arrayOrderMatters: false       // Treat arrays as unordered sets
 * };
 *
 * const result = jsonDiff(obj1, obj2, options);
 * ```
 *
 * @see {@link IDiffResult} for the structure of returned results
 * @see {@link IDiffChange} for details about individual changes
 * @see {@link IJsonDiffOptions} for available configuration options
 * @see {@link jsonThreeWayDiff} for an alternative API focused on actionable results
 * @see {@link jsonEquals} for simple equality checking without change details
 *
 * @public
 */
export function jsonDiff(
  obj1: JsonValue,
  obj2: JsonValue,
  options: IJsonDiffOptions = {}
): Result<IDiffResult> {
  const opts: Required<IJsonDiffOptions> = {
    includeUnchanged: false,
    pathSeparator: '.',
    arrayOrderMatters: true,
    ...options
  };

  const changes: IDiffChange[] = [];
  diffRecursive(obj1, obj2, '', opts, changes);

  const result: IDiffResult = {
    changes,
    identical: changes.length === 0 || changes.every((c) => c.type === 'unchanged')
  };

  return succeed(result);
}

/**
 * A simpler helper function that returns true if two JSON values are deeply equal.
 *
 * This function provides a fast boolean check for JSON equality without the overhead
 * of tracking individual changes. It performs the same deep comparison logic as
 * {@link Diff.jsonDiff} but returns only a true/false result, making it ideal for
 * conditional logic and validation scenarios.
 *
 * **Key Features:**
 * - Deep recursive comparison of all nested structures
 * - Handles all JSON types: objects, arrays, primitives, null
 * - Object property order independence
 * - Array order significance (index positions matter)
 * - Performance optimized for equality checking
 *
 * **Use Cases:**
 * - Conditional logic based on data equality
 * - Input validation and testing assertions
 * - Caching and memoization keys
 * - Quick checks before expensive diff operations
 *
 * @param obj1 - The first JSON value to compare
 * @param obj2 - The second JSON value to compare
 * @returns True if the values are deeply equal, false otherwise
 *
 * @example Basic equality checking
 * ```typescript
 * // Objects with same structure and values
 * const user1 = { name: "John", hobbies: ["reading", "gaming"] };
 * const user2 = { name: "John", hobbies: ["reading", "gaming"] };
 * console.log(jsonEquals(user1, user2)); // true
 *
 * // Different property order (still equal)
 * const obj1 = { a: 1, b: 2 };
 * const obj2 = { b: 2, a: 1 };
 * console.log(jsonEquals(obj1, obj2)); // true
 *
 * // Different values
 * const before = { status: "pending" };
 * const after = { status: "completed" };
 * console.log(jsonEquals(before, after)); // false
 * ```
 *
 * @example With nested structures
 * ```typescript
 * const config1 = {
 *   database: { host: "localhost", port: 5432 },
 *   features: ["auth", "cache"]
 * };
 * const config2 = {
 *   database: { host: "localhost", port: 5432 },
 *   features: ["auth", "cache"]
 * };
 *
 * if (jsonEquals(config1, config2)) {
 *   console.log("Configurations are identical");
 * }
 * ```
 *
 * @example Array order sensitivity
 * ```typescript
 * const list1 = [1, 2, 3];
 * const list2 = [3, 2, 1];
 * console.log(jsonEquals(list1, list2)); // false - order matters
 *
 * const list3 = [1, 2, 3];
 * const list4 = [1, 2, 3];
 * console.log(jsonEquals(list3, list4)); // true - same order
 * ```
 *
 * @see {@link Diff.jsonDiff} for detailed change analysis when equality fails
 * @see {@link jsonThreeWayDiff} for actionable difference results
 *
 * @public
 */
export function jsonEquals(obj1: JsonValue, obj2: JsonValue): boolean {
  return deepEquals(obj1, obj2);
}
