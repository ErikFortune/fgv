// Copyright (c) 2024 Erik Fortune
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

import { Failure, Result, Success } from '@fgv/ts-utils';
import { Converters as CommonConverters, Percentage } from '../common';

// ============================================================================
// String Conversion Utilities
// ============================================================================

/**
 * Convert a string to kebab-case.
 * Useful for generating base IDs from names.
 * @param input - String to convert
 * @returns Kebab-case string
 * @public
 */
export function toKebabCase(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Validate kebab-case string.
 * @param input - String to validate
 * @returns Result of true if valid, or failure with error message
 * @public
 */
export function validateKebabCase(input: string): Result<string> {
  if (!input || input.length === 0) {
    return Failure.with('Kebab-case string cannot be empty');
  }

  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(input)) {
    return Failure.with('String must be in kebab-case format (lowercase letters, numbers, and hyphens only)');
  }

  return Success.with(input);
}

/**
 * Convert a name to a valid base ID.
 * Uses kebab-case conversion.
 * @param name - Name to convert
 * @returns Result containing base ID or failure
 * @public
 */
export function nameToBaseId(name: string): Result<string> {
  if (!name || name.trim().length === 0) {
    return Failure.with('Name cannot be empty');
  }

  const baseId = toKebabCase(name);

  if (baseId.length === 0) {
    return Failure.with('Name must contain at least one alphanumeric character');
  }

  return Success.with(baseId);
}

/**
 * Generate a unique base ID by appending a counter if needed.
 * @param baseId - Base ID to make unique
 * @param existingIds - Set of existing IDs to check against
 * @param maxAttempts - Maximum number of attempts (default: 1000)
 * @returns Result containing unique base ID or failure
 * @public
 */
export function generateUniqueBaseId(
  baseId: string,
  existingIds: ReadonlySet<string> | ReadonlyArray<string>,
  maxAttempts: number = 1000
): Result<string> {
  const idSet = existingIds instanceof Set ? existingIds : new Set(existingIds);

  if (!idSet.has(baseId)) {
    return Success.with(baseId);
  }

  // Try appending counter
  for (let i = 2; i <= maxAttempts; i++) {
    const candidate = `${baseId}-${i}`;
    if (!idSet.has(candidate)) {
      return Success.with(candidate);
    }
  }

  return Failure.with(`Could not generate unique base ID from "${baseId}" after ${maxAttempts} attempts`);
}

/**
 * Generate a unique base ID from a name.
 * Combines nameToBaseId and generateUniqueBaseId.
 * @param name - Name to convert
 * @param existingIds - Set of existing IDs to check against
 * @param maxAttempts - Maximum number of attempts (default: 1000)
 * @returns Result containing unique base ID or failure
 * @public
 */
export function generateUniqueBaseIdFromName(
  name: string,
  existingIds: ReadonlySet<string> | ReadonlyArray<string>,
  maxAttempts: number = 1000
): Result<string> {
  return nameToBaseId(name).onSuccess((baseId) => generateUniqueBaseId(baseId, existingIds, maxAttempts));
}

// ============================================================================
// Validation Utilities
// ============================================================================

/**
 * Validate that a string is not empty.
 * @param value - Value to validate
 * @param fieldName - Name of field for error message
 * @returns Result of true if valid, or failure with error message
 * @public
 */
export function validateNonEmptyString<T extends string = string>(value: T, fieldName: string): Result<T> {
  if (value.trim().length === 0) {
    return Failure.with(`${fieldName} cannot be empty`);
  }

  return Success.with(value);
}

/**
 * Validate string length constraints.
 * @param value - Value to validate
 * @param fieldName - Name of field for error message
 * @param options - Length constraints
 * @returns Result of true if valid, or failure with error message
 * @public
 */
export function validateStringLength<T extends string = string>(
  value: T,
  fieldName: string,
  options: { minLength?: number; maxLength?: number }
): Result<T> {
  if (options.minLength !== undefined && value.length < options.minLength) {
    return Failure.with(`${fieldName} must be at least ${options.minLength} characters`);
  }

  if (options.maxLength !== undefined && value.length > options.maxLength) {
    return Failure.with(`${fieldName} must be at most ${options.maxLength} characters`);
  }

  return Success.with(value);
}

/**
 * Validate that a value is a positive number.
 * @param value - Value to validate
 * @param fieldName - Name of field for error message
 * @returns Result of true if valid, or failure with error message
 * @public
 */
export function validatePositiveNumber(value: unknown, fieldName: string): Result<number> {
  if (typeof value !== 'number' || isNaN(value)) {
    return Failure.with(`${fieldName} must be a number`);
  }

  if (value < 0) {
    return Failure.with(`${fieldName} must be positive`);
  }

  return Success.with(value);
}

/**
 * Validate that a value is a number within a range.
 * @param value - Value to validate
 * @param fieldName - Name of field for error message
 * @param min - Minimum value (inclusive)
 * @param max - Maximum value (inclusive)
 * @returns Result of true if valid, or failure with error message
 * @public
 */
export function validateNumberRange(
  value: unknown,
  fieldName: string,
  min: number,
  max: number
): Result<number> {
  if (typeof value !== 'number' || isNaN(value)) {
    return Failure.with(`${fieldName} must be a number`);
  }

  if (value < min || value > max) {
    return Failure.with(`${fieldName} must be between ${min} and ${max}`);
  }

  return Success.with(value);
}

/**
 * Validate that a value is a percentage (0-100).
 * @param value - Value to validate
 * @param fieldName - Name of field for error message
 * @returns Result of true if valid, or failure with error message
 * @public
 */
export function validatePercentage(value: unknown, fieldName: string): Result<Percentage> {
  return CommonConverters.percentage
    .convert(value)
    .withErrorFormat((msg) => `${fieldName}: must be between 0 and 100`);
}

// ============================================================================
// Collection Utilities
// ============================================================================

/**
 * Check if a base ID exists in a collection.
 * @param baseId - Base ID to check
 * @param existingIds - Collection of existing IDs
 * @returns True if ID exists
 * @public
 */
export function baseIdExists(
  baseId: string,
  existingIds: ReadonlySet<string> | ReadonlyArray<string>
): boolean {
  if (existingIds instanceof Set) {
    return existingIds.has(baseId);
  }
  return (existingIds as ReadonlyArray<string>).includes(baseId);
}

/**
 * Validate that a base ID is unique in a collection.
 * @param baseId - Base ID to validate
 * @param existingIds - Collection of existing IDs
 * @param fieldName - Name of field for error message
 * @returns Result of true if unique, or failure with error message
 * @public
 */
export function validateUniqueBaseId<T extends string = string>(
  baseId: T,
  existingIds: ReadonlySet<T> | ReadonlyArray<T>,
  fieldName: string = 'baseId'
): Result<T> {
  if (baseIdExists(baseId, existingIds)) {
    return Failure.with(`${fieldName} "${baseId}" already exists in this collection`);
  }
  return Success.with(baseId);
}
