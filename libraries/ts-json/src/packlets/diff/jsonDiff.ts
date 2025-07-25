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

import { Result, succeed } from '@fgv/ts-utils';
import { JsonValue, isJsonObject, isJsonArray, isJsonPrimitive } from '@fgv/ts-json-base';

/**
 * Type of change detected in a JSON diff operation.
 * @public
 */
export type DiffChangeType = 'added' | 'removed' | 'modified' | 'unchanged';

/**
 * Represents a single change in a JSON diff operation.
 * @public
 */
export interface IDiffChange {
  /**
   * The path to the changed value using dot notation (e.g., "user.name", "items.0.id")
   */
  path: string;

  /**
   * The type of change that occurred
   */
  type: DiffChangeType;

  /**
   * The value in the first object (undefined for 'added' changes)
   */
  oldValue?: JsonValue;

  /**
   * The value in the second object (undefined for 'removed' changes)
   */
  newValue?: JsonValue;
}

/**
 * Result of a JSON diff operation containing all detected changes.
 * @public
 */
export interface IDiffResult {
  /**
   * Array of all changes detected between the two JSON objects
   */
  changes: IDiffChange[];

  /**
   * True if the objects are identical, false otherwise
   */
  identical: boolean;
}

/**
 * Options for customizing JSON diff behavior.
 * @public
 */
export interface IJsonDiffOptions {
  /**
   * If true, includes unchanged values in the result. Default is false.
   */
  includeUnchanged?: boolean;

  /**
   * Custom path separator. Default is ".".
   */
  pathSeparator?: string;

  /**
   * If true, treats arrays as ordered lists (position matters).
   * If false, treats arrays as unordered sets. Default is true.
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
 * @param obj1 - The first JSON value to compare
 * @param obj2 - The second JSON value to compare
 * @param options - Optional configuration for the diff operation
 * @returns A Result containing the diff result with all detected changes
 *
 * @example
 * ```typescript
 * const result = jsonDiff(
 *   { name: "John", age: 30, hobbies: ["reading"] },
 *   { name: "Jane", age: 30, hobbies: ["reading", "gaming"] }
 * );
 *
 * if (result.success) {
 *   console.log(result.value.changes);
 *   // [
 *   //   { path: "name", type: "modified", oldValue: "John", newValue: "Jane" },
 *   //   { path: "hobbies.1", type: "added", newValue: "gaming" }
 *   // ]
 * }
 * ```
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
 * @param obj1 - The first JSON value to compare
 * @param obj2 - The second JSON value to compare
 * @returns True if the values are deeply equal, false otherwise
 *
 * @example
 * ```typescript
 * const equal = jsonEquals(
 *   { name: "John", hobbies: ["reading"] },
 *   { name: "John", hobbies: ["reading"] }
 * ); // true
 * ```
 *
 * @public
 */
export function jsonEquals(obj1: JsonValue, obj2: JsonValue): boolean {
  return deepEquals(obj1, obj2);
}

/**
 * Metadata about the differences found in a three-way diff.
 * @public
 */
export interface IThreeWayDiffMetadata {
  /**
   * Number of properties that exist only in the first object
   */
  removed: number;

  /**
   * Number of properties that exist only in the second object
   */
  added: number;

  /**
   * Number of properties that exist in both objects but have different values
   */
  modified: number;

  /**
   * Number of properties that exist in both objects with identical values
   */
  unchanged: number;
}

/**
 * Result of a three-way JSON diff operation.
 * @public
 */
export interface IThreeWayDiff {
  /**
   * Contains properties that exist only in the first object, plus the first object's
   * version of any properties that exist in both but have different values.
   */
  onlyInA: JsonValue;

  /**
   * Contains properties that exist in both objects with identical values.
   */
  unchanged: JsonValue;

  /**
   * Contains properties that exist only in the second object, plus the second object's
   * version of any properties that exist in both but have different values.
   */
  onlyInB: JsonValue;

  /**
   * Summary metadata about the differences found.
   */
  metadata: IThreeWayDiffMetadata;

  /**
   * True if the objects are identical, false otherwise.
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
 * This approach provides a more actionable result than detailed change lists, making it
 * easy to apply changes, display side-by-side comparisons, or perform merges. Arrays are
 * treated as atomic values - if they differ, the entire array is replaced rather than
 * computing element-by-element deltas.
 *
 * @param obj1 - The first JSON value to compare
 * @param obj2 - The second JSON value to compare
 * @returns A Result containing the three-way diff with separate objects and metadata
 *
 * @example
 * ```typescript
 * const result = jsonThreeWayDiff(
 *   { name: "John", age: 30, city: "NYC" },
 *   { name: "Jane", age: 30, country: "USA" }
 * );
 *
 * if (result.success) {
 *   // result.value.onlyInA = { name: "John", city: "NYC" }
 *   // result.value.unchanged = { age: 30 }
 *   // result.value.onlyInB = { name: "Jane", country: "USA" }
 *   // result.value.metadata = { added: 1, removed: 1, modified: 1, unchanged: 1 }
 * }
 * ```
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
