// Copyright (c) 2026 Erik Fortune
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

/**
 * Filter predicate types and utilities for query builders
 * @packageDocumentation
 */

import { AnyRuntimeIngredient } from '../ingredients';
import { RuntimeRecipe } from '../fillings';

// ============================================================================
// Generic Filter Types
// ============================================================================

/**
 * Generic filter predicate function
 * @public
 */
export type FilterPredicate<T> = (item: T) => boolean;

/**
 * Filter for RuntimeIngredient
 * @public
 */
export type IngredientFilter = FilterPredicate<AnyRuntimeIngredient>;

/**
 * Filter for RuntimeRecipe
 * @public
 */
export type RecipeFilter = FilterPredicate<RuntimeRecipe>;

// ============================================================================
// Filter Combinators
// ============================================================================

/**
 * Combines multiple filters with AND logic.
 * @param filters - Filters to combine
 * @returns Combined filter that passes only if all filters pass
 * @public
 */
export function andFilters<T>(...filters: FilterPredicate<T>[]): FilterPredicate<T> {
  return (item: T): boolean => {
    for (const filter of filters) {
      if (!filter(item)) {
        return false;
      }
    }
    return true;
  };
}

/**
 * Combines multiple filters with OR logic.
 * @param filters - Filters to combine
 * @returns Combined filter that passes if any filter passes
 * @public
 */
export function orFilters<T>(...filters: FilterPredicate<T>[]): FilterPredicate<T> {
  return (item: T): boolean => {
    if (filters.length === 0) {
      return true;
    }
    for (const filter of filters) {
      if (filter(item)) {
        return true;
      }
    }
    return false;
  };
}

/**
 * Negates a filter.
 * @param filter - Filter to negate
 * @returns Filter that passes when original fails and vice versa
 * @public
 */
export function notFilter<T>(filter: FilterPredicate<T>): FilterPredicate<T> {
  return (item: T): boolean => !filter(item);
}

// ============================================================================
// String Matching Utilities
// ============================================================================

/**
 * Creates a case-insensitive contains filter.
 * @param text - Text to search for
 * @param getter - Function to get the string to search in
 * @returns Filter that matches if text is found
 * @public
 */
export function containsIgnoreCase<T>(
  text: string,
  getter: (item: T) => string | undefined
): FilterPredicate<T> {
  const lowerText = text.toLowerCase();
  return (item: T): boolean => {
    const value = getter(item);
    return value !== undefined && value.toLowerCase().includes(lowerText);
  };
}

/**
 * Creates a tag filter that checks if item has the specified tag.
 * @param tag - Tag to search for (case-insensitive)
 * @param getter - Function to get tags array
 * @returns Filter that matches if tag is found
 * @public
 */
export function hasTag<T>(tag: string, getter: (item: T) => ReadonlyArray<string>): FilterPredicate<T> {
  const lowerTag = tag.toLowerCase();
  return (item: T): boolean => {
    const tags = getter(item);
    return tags.some((t) => t.toLowerCase() === lowerTag);
  };
}

/**
 * Creates a filter that checks if item has any of the specified tags.
 * @param tags - Tags to search for (case-insensitive)
 * @param getter - Function to get tags array
 * @returns Filter that matches if any tag is found
 * @public
 */
export function hasAnyTag<T>(tags: string[], getter: (item: T) => ReadonlyArray<string>): FilterPredicate<T> {
  const lowerTags = tags.map((t) => t.toLowerCase());
  return (item: T): boolean => {
    const itemTags = getter(item).map((t) => t.toLowerCase());
    return lowerTags.some((tag) => itemTags.includes(tag));
  };
}

/**
 * Creates a filter that checks if item has all of the specified tags.
 * @param tags - Tags to search for (case-insensitive)
 * @param getter - Function to get tags array
 * @returns Filter that matches if all tags are found
 * @public
 */
export function hasAllTags<T>(
  tags: string[],
  getter: (item: T) => ReadonlyArray<string>
): FilterPredicate<T> {
  const lowerTags = tags.map((t) => t.toLowerCase());
  return (item: T): boolean => {
    const itemTags = getter(item).map((t) => t.toLowerCase());
    return lowerTags.every((tag) => itemTags.includes(tag));
  };
}

// ============================================================================
// Numeric Range Utilities
// ============================================================================

/**
 * Creates a filter for numeric range (inclusive).
 * @param min - Minimum value (inclusive), undefined for no minimum
 * @param max - Maximum value (inclusive), undefined for no maximum
 * @param getter - Function to get the numeric value
 * @returns Filter that matches if value is in range
 * @public
 */
export function inRange<T>(
  min: number | undefined,
  max: number | undefined,
  getter: (item: T) => number | undefined
): FilterPredicate<T> {
  return (item: T): boolean => {
    const value = getter(item);
    if (value === undefined) {
      return false;
    }
    if (min !== undefined && value < min) {
      return false;
    }
    if (max !== undefined && value > max) {
      return false;
    }
    return true;
  };
}

/**
 * Creates a filter for minimum value (inclusive).
 * @param min - Minimum value
 * @param getter - Function to get the numeric value
 * @returns Filter that matches if value is greater than or equal to min
 * @public
 */
export function atLeast<T>(min: number, getter: (item: T) => number | undefined): FilterPredicate<T> {
  return inRange(min, undefined, getter);
}

/**
 * Creates a filter for maximum value (inclusive).
 * @param max - Maximum value
 * @param getter - Function to get the numeric value
 * @returns Filter that matches if value is less than or equal to max
 * @public
 */
export function atMost<T>(max: number, getter: (item: T) => number | undefined): FilterPredicate<T> {
  return inRange(undefined, max, getter);
}

// ============================================================================
// Collection Utilities
// ============================================================================

/**
 * Creates a filter that checks if a collection contains a value.
 * @param value - Value to search for
 * @param getter - Function to get the collection
 * @returns Filter that matches if value is in collection
 * @public
 */
export function collectionContains<T, V>(
  value: V,
  getter: (item: T) => ReadonlyArray<V> | undefined
): FilterPredicate<T> {
  return (item: T): boolean => {
    const collection = getter(item);
    return collection !== undefined && collection.includes(value);
  };
}

/**
 * Creates a filter that checks if a collection contains any of the values.
 * @param values - Values to search for
 * @param getter - Function to get the collection
 * @returns Filter that matches if any value is in collection
 * @public
 */
export function collectionContainsAny<T, V>(
  values: V[],
  getter: (item: T) => ReadonlyArray<V> | undefined
): FilterPredicate<T> {
  return (item: T): boolean => {
    const collection = getter(item);
    if (collection === undefined) {
      return false;
    }
    return values.some((v) => collection.includes(v));
  };
}

// ============================================================================
// Equality Utilities
// ============================================================================

/**
 * Creates a filter for exact equality.
 * @param expected - Expected value
 * @param getter - Function to get the actual value
 * @returns Filter that matches if values are equal
 * @public
 */
export function equals<T, V>(expected: V, getter: (item: T) => V | undefined): FilterPredicate<T> {
  return (item: T): boolean => getter(item) === expected;
}

/**
 * Creates a filter that checks if value is one of the allowed values.
 * @param allowed - Allowed values
 * @param getter - Function to get the actual value
 * @returns Filter that matches if value is in allowed list
 * @public
 */
export function oneOf<T, V>(allowed: V[], getter: (item: T) => V | undefined): FilterPredicate<T> {
  return (item: T): boolean => {
    const value = getter(item);
    return value !== undefined && allowed.includes(value);
  };
}
