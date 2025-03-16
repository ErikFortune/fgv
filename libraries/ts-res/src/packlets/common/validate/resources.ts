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

import { fail, succeed, Result } from '@fgv/ts-utils';
import { ResourceId, ResourceIndex, ResourceName, ResourceTypeIndex, ResourceTypeName } from '../resources';
import { identifier, segmentedIdentifier } from './regularExpressions';

/**
 * Checks if the given name is a valid resource name.
 *
 * @param name - The name to validate.
 * @returns `true` if the name is a valid resource name, otherwise `false`.
 * @public
 */
export function isValidResourceName(name: string): name is ResourceName {
  return identifier.test(name);
}

/**
 * Checks if the given ID is a valid resource ID.
 *
 * @param id - The ID to validate.
 * @returns `true` if the ID is a valid resource ID, otherwise `false`.
 * @public
 */
export function isValidResourceId(id: string): id is ResourceId {
  return segmentedIdentifier.test(id);
}

/**
 * Checks if the given index is a valid resource index.
 *
 * @param index - The index to validate.
 * @returns `true` if the index is a valid resource index, otherwise `false`.
 * @public
 */
export function isValidResourceIndex(index: number): index is ResourceIndex {
  return index >= 0;
}

/**
 * Checks if the given name is a valid resource type name.
 *
 * @param name - The name to validate.
 * @returns `true` if the name is a valid resource type name, otherwise `false`.
 * @public
 */
export function isValidResourceTypeName(name: string): name is ResourceTypeName {
  return identifier.test(name);
}

/**
 * Checks if the given index is a valid resource type index.
 *
 * @param index - The index to validate.
 * @returns `true` if the index is a valid resource type index, otherwise `false`.
 * @public
 */
export function isValidResourceTypeIndex(index: number): index is ResourceTypeIndex {
  return index >= 0;
}

/**
 * Converts a string to a {@link ResourceName | resource name}.
 *
 * @param id - The string to convert.
 * @returns `Success` with the converted name if valid, or `Failure` with an error message
 * if not.
 * @public
 */
export function toResourceName(name: string): Result<ResourceName> {
  if (!isValidResourceName(name)) {
    return fail(`${name}: not a valid resource name.`);
  }
  return succeed(name);
}

/**
 * Converts a string to a {@link ResourceId | resource ID}.
 *
 * @param id - The string to convert.
 * @returns `Success` with the converted ID if valid, or `Failure` with an error message
 * if not.
 * @public
 */
export function toResourceId(id: string): Result<ResourceId> {
  if (!isValidResourceId(id)) {
    return fail(`${id}: not a valid resource ID.`);
  }
  return succeed(id);
}

/**
 * Converts a number to a {@link ResourceIndex | resource index}.
 *
 * @param index - The number to convert.
 * @returns `Success` with the converted index if valid, or `Failure` with an error message
 * if not.
 * @public
 */
export function toResourceIndex(index: number): Result<ResourceIndex> {
  if (!isValidResourceIndex(index)) {
    return fail(`${index}: not a valid resource index.`);
  }
  return succeed(index);
}

/**
 * Converts a string to a {@link ResourceTypeName | resource type name}.
 *
 * @param name - The string to convert.
 * @returns `Success` with the converted name if valid, or `Failure` with an error message
 * if not.
 * @public
 */
export function toResourceTypeName(name: string): Result<ResourceTypeName> {
  /* c8 ignore next 3 - coverage having issues */
  if (!isValidResourceTypeName(name)) {
    return fail(`${name}: not a valid resource type name.`);
  }
  return succeed(name);
}

/**
 * Converts a number to a {@link ResourceTypeIndex | resource type index}.
 *
 * @param index - The number to convert.
 * @returns `Success` with the converted index if valid, or `Failure` with an error message
 * if not.
 * @public
 */
export function toResourceTypeIndex(index: number): Result<ResourceTypeIndex> {
  if (!isValidResourceTypeIndex(index)) {
    return fail(`${index}: not a valid resource type index.`);
  }
  return succeed(index);
}
