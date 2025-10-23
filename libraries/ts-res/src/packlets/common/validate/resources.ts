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
import { candidateValueKey, identifier, segmentedIdentifier } from './regularExpressions';
import {
  CandidateValueIndex,
  CandidateValueKey,
  ResourceId,
  ResourceIndex,
  ResourceName,
  ResourceTypeIndex,
  ResourceTypeName
} from '../resources';

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
 * Checks if the given index is a valid candidate value index.
 *
 * @param index - The index to validate.
 * @returns `true` if the index is a valid candidate value index, otherwise `false`.
 * @public
 */
export function isValidCandidateValueIndex(index: number): index is CandidateValueIndex {
  return index >= 0;
}

/**
 * Checks if the given key is a valid candidate value key.
 *
 * @param key - The key to validate.
 * @returns `true` if the key is a valid candidate value key, otherwise `false`.
 * @public
 */
export function isValidCandidateValueKey(key: string): key is CandidateValueKey {
  return candidateValueKey.test(key);
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
  /* c8 ignore next 3 - coverage having issues */
  if (!isValidResourceName(name)) {
    return fail(`${name}: invalid resource name.`);
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
  /* c8 ignore next 3 - defensive coding: resource ID validation should prevent invalid IDs */
  if (!isValidResourceId(id)) {
    return fail(`${id}: invalid resource ID.`);
  }
  return succeed(id);
}

/**
 * Converts an optional string to an optional {@link ResourceId | resource ID}.
 *
 * @param id - The string to convert.
 * @returns `Success` with the converted ID if valid, or `Failure` with an error message
 * if not.
 * @public
 */
export function toOptionalResourceId(id?: string): Result<ResourceId | undefined> {
  return id ? toResourceId(id) : succeed(undefined);
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
    return fail(`${index}: invalid resource index.`);
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
    return fail(`${name}: invalid resource type name.`);
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
  /* c8 ignore next 3 - coverage having issues */
  if (!isValidResourceTypeIndex(index)) {
    return fail(`${index}: invalid resource type index.`);
  }
  return succeed(index);
}

/**
 * Converts a string to a {@link CandidateValueKey | candidate value key}.
 *
 * @param key - The key to convert.
 * @returns `Success` with the converted key if valid, or `Failure` with an error message
 * if not.
 * @public
 */
export function toCandidateValueKey(key: string): Result<CandidateValueKey> {
  /* c8 ignore next 3 - coverage having issues */
  if (!isValidCandidateValueKey(key)) {
    return fail(`${key}: invalid candidate value key.`);
  }
  return succeed(key);
}

/**
 * Converts a number to a {@link CandidateValueIndex | candidate value index}.
 *
 * @param index - The number to convert.
 * @returns `Success` with the converted index if valid, or `Failure` with an error message
 * if not.
 * @public
 */
export function toCandidateValueIndex(index: number): Result<CandidateValueIndex> {
  /* c8 ignore next 3 - coverage having issues */
  if (!isValidCandidateValueIndex(index)) {
    return fail(`${index}: invalid candidate value index.`);
  }
  return succeed(index);
}
