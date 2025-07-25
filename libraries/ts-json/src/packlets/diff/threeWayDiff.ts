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
import { JsonValue, isJsonObject } from '@fgv/ts-json-base';
import { deepEquals } from './utils';

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
 * @see {@link Diff.jsonDiff} for an alternative detailed change-list approach
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
 * This function provides an alternative to {@link Diff.jsonDiff} that focuses on actionable
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
 * Unlike {@link Diff.jsonDiff}, this function treats arrays as complete units. If arrays differ,
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
 * @see {@link Diff.jsonDiff} for detailed change-by-change analysis
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
