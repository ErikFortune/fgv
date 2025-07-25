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

import { Result, succeed } from '@fgv/ts-utils';
import { JsonValue, isJsonObject, isJsonArray, isJsonPrimitive } from '@fgv/ts-json-base';

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
 * @see {@link jsonDiff} for the function that produces this result
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
 * Deep comparison function for JSON values that handles all JSON types.
 */
function deepEquals(a: JsonValue, b: JsonValue): boolean {
  if (a === b) {
    return true;
  }

  if (isJsonPrimitive(a) || isJsonPrimitive(b)) {
    return a === b;
  }

  if (isJsonArray(a) && isJsonArray(b)) {
    if (a.length !== b.length) {
      return false;
    }
    for (let i = 0; i < a.length; i++) {
      if (!deepEquals(a[i], b[i])) {
        return false;
      }
    }
    return true;
  }

  if (isJsonObject(a) && isJsonObject(b)) {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    if (keysA.length !== keysB.length) {
      return false;
    }

    for (const key of keysA) {
      if (!(key in b) || !deepEquals(a[key], b[key])) {
        return false;
      }
    }
    return true;
  }

  return false;
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
 * {@link jsonDiff} but returns only a true/false result, making it ideal for
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
 * @see {@link jsonDiff} for detailed change analysis when equality fails
 * @see {@link jsonThreeWayDiff} for actionable difference results
 *
 * @public
 */
export function jsonEquals(obj1: JsonValue, obj2: JsonValue): boolean {
  return deepEquals(obj1, obj2);
}

/**
 * Metadata about the differences found in a three-way diff.
 *
 * Provides summary statistics about the types and quantities of changes
 * detected between two JSON values, making it easy to understand the
 * overall scope of differences at a glance.
 *
 * @example
 * ```typescript
 * const metadata: IThreeWayDiffMetadata = {
 *   removed: 2,    // 2 properties only in first object
 *   added: 1,      // 1 property only in second object
 *   modified: 3,   // 3 properties changed between objects
 *   unchanged: 5   // 5 properties identical in both objects
 * };
 *
 * console.log(`Total changes: ${metadata.added + metadata.removed + metadata.modified}`);
 * console.log(`Stability: ${metadata.unchanged / (metadata.unchanged + metadata.modified) * 100}%`);
 * ```
 *
 * @public
 */
export interface IThreeWayDiffMetadata {
  /**
   * Number of properties that exist only in the first object.
   *
   * These represent data that was removed when transitioning from
   * the first object to the second object.
   */
  removed: number;

  /**
   * Number of properties that exist only in the second object.
   *
   * These represent new data that was added when transitioning from
   * the first object to the second object.
   */
  added: number;

  /**
   * Number of properties that exist in both objects but have different values.
   *
   * These represent data that was modified during the transition between objects.
   * For arrays, this counts entire array replacements as single modifications.
   */
  modified: number;

  /**
   * Number of properties that exist in both objects with identical values.
   *
   * These represent stable data that remained consistent between the two objects.
   */
  unchanged: number;
}

/**
 * Result of a three-way JSON diff operation.
 *
 * This interface provides an actionable representation of differences between
 * two JSON values by separating them into three distinct objects. This approach
 * makes it easy to apply changes, display side-by-side comparisons, perform
 * merges, or programmatically work with the differences.
 *
 * **Key Benefits:**
 * - **Actionable Results**: Objects can be directly used for merging or applying changes
 * - **UI-Friendly**: Perfect for side-by-side diff displays with clear visual separation
 * - **Merge-Ready**: Simplified three-way merge operations
 * - **Structured Data**: Maintains original JSON structure rather than flattened paths
 *
 * @example Basic usage
 * ```typescript
 * const result: IThreeWayDiff = {
 *   onlyInA: { name: "John", city: "NYC" },      // Original or removed data
 *   unchanged: { age: 30 },                      // Stable data
 *   onlyInB: { name: "Jane", country: "USA" },  // New or modified data
 *   metadata: { added: 1, removed: 1, modified: 1, unchanged: 1 },
 *   identical: false
 * };
 *
 * // Apply changes: merge unchanged + onlyInB
 * const updated = { ...result.unchanged, ...result.onlyInB };
 * // Result: { age: 30, name: "Jane", country: "USA" }
 *
 * // Revert changes: merge unchanged + onlyInA
 * const reverted = { ...result.unchanged, ...result.onlyInA };
 * // Result: { age: 30, name: "John", city: "NYC" }
 * ```
 *
 * @see {@link IThreeWayDiffMetadata} for metadata structure details
 * @see {@link jsonThreeWayDiff} for the function that produces this result
 * @see {@link jsonDiff} for an alternative detailed change-list approach
 *
 * @public
 */
export interface IThreeWayDiff {
  /**
   * Contains properties that exist only in the first object, plus the first object's
   * version of any properties that exist in both but have different values.
   *
   * This object represents the "old" or "source" state and can be used for:
   * - Reverting changes by merging with `unchanged`
   * - Displaying what was removed or changed from the original
   * - Understanding the baseline state before modifications
   *
   * Will be `null` if no properties are unique to the first object.
   */
  onlyInA: JsonValue;

  /**
   * Contains properties that exist in both objects with identical values.
   *
   * This object represents the stable, consistent data between both inputs
   * and can be used for:
   * - The foundation for merging operations
   * - Identifying what remained constant during changes
   * - Building complete objects by combining with other parts
   *
   * Will be `null` if no properties are shared between the objects.
   */
  unchanged: JsonValue;

  /**
   * Contains properties that exist only in the second object, plus the second object's
   * version of any properties that exist in both but have different values.
   *
   * This object represents the "new" or "target" state and can be used for:
   * - Applying changes by merging with `unchanged`
   * - Displaying what was added or changed in the update
   * - Understanding the desired end state after modifications
   *
   * Will be `null` if no properties are unique to the second object.
   */
  onlyInB: JsonValue;

  /**
   * Summary metadata about the differences found.
   *
   * Provides counts of added, removed, modified, and unchanged properties
   * for quick assessment of the scope and nature of changes.
   */
  metadata: IThreeWayDiffMetadata;

  /**
   * True if the objects are identical, false otherwise.
   *
   * When `true`, both `onlyInA` and `onlyInB` will be `null`, and `unchanged`
   * will contain the complete shared structure. The metadata will show zero
   * added, removed, and modified properties.
   */
  identical: boolean;
}

/**
 * Internal function to build three-way diff for objects.
 */
function buildThreeWayDiffForObjects(
  obj1: JsonValue,
  obj2: JsonValue,
  metadata: IThreeWayDiffMetadata
): { onlyInA: JsonValue; unchanged: JsonValue; onlyInB: JsonValue } {
  if (!isJsonObject(obj1) || !isJsonObject(obj2)) {
    // Handle non-object cases
    if (deepEquals(obj1, obj2)) {
      metadata.unchanged++;
      return {
        onlyInA: null,
        unchanged: obj1,
        onlyInB: null
      };
    } else {
      metadata.modified++;
      return {
        onlyInA: obj1,
        unchanged: null,
        onlyInB: obj2
      };
    }
  }

  const keys1 = new Set(Object.keys(obj1));
  const keys2 = new Set(Object.keys(obj2));
  const allKeys = new Set([...keys1, ...keys2]);

  const onlyInA: Record<string, JsonValue> = {};
  const unchanged: Record<string, JsonValue> = {};
  const onlyInB: Record<string, JsonValue> = {};

  let hasOnlyInA = false;
  let hasUnchanged = false;
  let hasOnlyInB = false;

  for (const key of allKeys) {
    if (!keys1.has(key)) {
      // Property only exists in obj2
      metadata.added++;
      onlyInB[key] = obj2[key];
      hasOnlyInB = true;
    } else if (!keys2.has(key)) {
      // Property only exists in obj1
      metadata.removed++;
      onlyInA[key] = obj1[key];
      hasOnlyInA = true;
    } else {
      // Property exists in both
      const val1 = obj1[key];
      const val2 = obj2[key];

      if (deepEquals(val1, val2)) {
        // Values are identical
        if (isJsonObject(val1) && isJsonObject(val2)) {
          // For objects, we need to recurse to get proper metadata counts
          const childDiff = buildThreeWayDiffForObjects(val1, val2, metadata);
          if (childDiff.unchanged !== null) {
            unchanged[key] = childDiff.unchanged;
            hasUnchanged = true;
          }
        } else {
          metadata.unchanged++;
          unchanged[key] = val1;
          hasUnchanged = true;
        }
      } else {
        // Values are different
        if (isJsonObject(val1) && isJsonObject(val2)) {
          // For nested objects, recurse
          const childDiff = buildThreeWayDiffForObjects(val1, val2, metadata);

          if (childDiff.onlyInA !== null) {
            onlyInA[key] = childDiff.onlyInA;
            hasOnlyInA = true;
          }
          if (childDiff.unchanged !== null) {
            unchanged[key] = childDiff.unchanged;
            hasUnchanged = true;
          }
          if (childDiff.onlyInB !== null) {
            onlyInB[key] = childDiff.onlyInB;
            hasOnlyInB = true;
          }
        } else {
          // For primitives or arrays, treat as complete replacement
          metadata.modified++;
          onlyInA[key] = val1;
          onlyInB[key] = val2;
          hasOnlyInA = true;
          hasOnlyInB = true;
        }
      }
    }
  }

  return {
    onlyInA: hasOnlyInA ? onlyInA : null,
    unchanged: hasUnchanged ? unchanged : null,
    onlyInB: hasOnlyInB ? onlyInB : null
  };
}

/**
 * Performs a three-way diff comparison between two JSON values, returning separate
 * objects containing the differences and similarities.
 *
 * This function provides an alternative to {@link jsonDiff} that focuses on actionable
 * results rather than detailed change analysis. Instead of a list of individual changes,
 * it returns three objects that can be directly used for merging, UI display, or
 * programmatic manipulation.
 *
 * **Key Features:**
 * - **Actionable Results**: Returns objects ready for immediate use in merging operations
 * - **Simplified Array Handling**: Arrays are treated as atomic values for cleaner results
 * - **Structural Preservation**: Maintains original JSON structure rather than flattened paths
 * - **UI-Optimized**: Perfect for side-by-side diff displays and change visualization
 * - **Merge-Friendly**: Designed specifically for three-way merge scenarios
 *
 * **Array Handling:**
 * Unlike {@link jsonDiff}, this function treats arrays as complete units. If arrays differ,
 * the entire array appears in the appropriate result object rather than computing
 * element-by-element deltas. This approach is simpler and more predictable for most
 * use cases involving data updates and synchronization.
 *
 * **Use Cases:**
 * - Applying configuration updates while preserving unchanged settings
 * - Creating side-by-side diff displays in user interfaces
 * - Building three-way merge tools for data synchronization
 * - Implementing undo/redo functionality with granular control
 * - Generating patch objects for API updates
 *
 * @param obj1 - The first JSON value to compare (often the "before" or "source" state)
 * @param obj2 - The second JSON value to compare (often the "after" or "target" state)
 * @returns A Result containing the three-way diff with separate objects and metadata
 *
 * @example Basic usage for applying changes
 * ```typescript
 * const original = { name: "John", age: 30, city: "NYC", active: true };
 * const updated = { name: "Jane", age: 30, country: "USA", active: true };
 *
 * const result = jsonThreeWayDiff(original, updated);
 * if (result.success) {
 *   const { onlyInA, unchanged, onlyInB } = result.value;
 *
 *   // Apply changes: merge unchanged + onlyInB
 *   const applied = { ...unchanged, ...onlyInB };
 *   console.log(applied); // { age: 30, active: true, name: "Jane", country: "USA" }
 *
 *   // Revert changes: merge unchanged + onlyInA
 *   const reverted = { ...unchanged, ...onlyInA };
 *   console.log(reverted); // { age: 30, active: true, name: "John", city: "NYC" }
 * }
 * ```
 *
 * @example UI-friendly diff display
 * ```typescript
 * const result = jsonThreeWayDiff(userBefore, userAfter);
 * if (result.success) {
 *   const { onlyInA, unchanged, onlyInB, metadata } = result.value;
 *
 *   // Display summary
 *   console.log(`Changes: ${metadata.added} added, ${metadata.removed} removed, ${metadata.modified} modified`);
 *
 *   // Show removed/old values in red
 *   if (onlyInA) displayInColor(onlyInA, 'red');
 *
 *   // Show unchanged values in gray
 *   if (unchanged) displayInColor(unchanged, 'gray');
 *
 *   // Show added/new values in green
 *   if (onlyInB) displayInColor(onlyInB, 'green');
 * }
 * ```
 *
 * @example Nested objects and array handling
 * ```typescript
 * const config1 = {
 *   database: { host: "localhost", port: 5432 },
 *   features: ["auth", "logging"],
 *   version: "1.0"
 * };
 * const config2 = {
 *   database: { host: "production.db", port: 5432 },
 *   features: ["auth", "logging", "metrics"],  // Array treated as complete unit
 *   version: "1.1"
 * };
 *
 * const result = jsonThreeWayDiff(config1, config2);
 * if (result.success) {
 *   // result.value.onlyInA = { database: { host: "localhost" }, features: ["auth", "logging"], version: "1.0" }
 *   // result.value.unchanged = { database: { port: 5432 } }
 *   // result.value.onlyInB = { database: { host: "production.db" }, features: ["auth", "logging", "metrics"], version: "1.1" }
 * }
 * ```
 *
 * @example Conditional updates based on changes
 * ```typescript
 * const result = jsonThreeWayDiff(currentState, newState);
 * if (result.success && !result.value.identical) {
 *   const { metadata } = result.value;
 *
 *   if (metadata.modified > 0) {
 *     console.log("Critical settings changed - requires restart");
 *   } else if (metadata.added > 0) {
 *     console.log("New features enabled");
 *   } else if (metadata.removed > 0) {
 *     console.log("Features disabled");
 *   }
 * }
 * ```
 *
 * @see {@link IThreeWayDiff} for the structure of returned results
 * @see {@link IThreeWayDiffMetadata} for metadata details
 * @see {@link jsonDiff} for detailed change-by-change analysis
 * @see {@link jsonEquals} for simple equality checking
 *
 * @public
 */
export function jsonThreeWayDiff(obj1: JsonValue, obj2: JsonValue): Result<IThreeWayDiff> {
  const metadata: IThreeWayDiffMetadata = {
    removed: 0,
    added: 0,
    modified: 0,
    unchanged: 0
  };

  const diff = buildThreeWayDiffForObjects(obj1, obj2, metadata);

  const result: IThreeWayDiff = {
    onlyInA: diff.onlyInA,
    unchanged: diff.unchanged,
    onlyInB: diff.onlyInB,
    metadata,
    identical: metadata.removed === 0 && metadata.added === 0 && metadata.modified === 0
  };

  return succeed(result);
}
