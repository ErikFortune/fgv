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

import { MessageAggregator, Result, mapResults, succeed } from '@fgv/ts-utils';
import { ResourceId, ResourceName } from '../resources';
import { toResourceId, toResourceName } from '../validate/resources';

/**
 * Splits a {@link ResourceId | resource id} into its component {@link ResourceName | resource names}.
 *
 * @param id - The ID to split.
 * @returns `Success`with an array of {@link ResourceName | ResourceName} objects if the ID is valid, or
 * `Failure` with an error message if not.
 * @public
 */
export function splitResourceId(id: string | undefined): Result<ResourceName[]> {
  if (id === undefined) {
    return succeed([]);
  }
  return mapResults(id.split('.').map(toResourceName));
}

/**
 * Joins a list of {@link ResourceId | resource ID} or {@link ResourceName | resource name} with
 * to create a new {@link ResourceId | resource ID}. Fails if resulting ID is invalid or empty.
 *
 * @param base - The base name or ID to join.
 * @param names - Additional names to join.
 * @returns `Success` with the new ID if the base and names are valid, or `Failure` with an error message
 * if not.
 * @public
 */
export function joinResourceIds(...ids: (string | undefined)[]): Result<ResourceId> {
  const errors: MessageAggregator = new MessageAggregator();
  const parts: ResourceName[] = [];
  ids
    .filter((id) => id !== '')
    .forEach((id) => {
      parts.push(...splitResourceId(id).aggregateError(errors).orDefault([]));
    });
  const id = parts.join('.');
  return errors.returnOrReport(toResourceId(id));
}

/**
 * Joins a list of {@link ResourceId | resource ID} or {@link ResourceName | resource name} with
 * to create a new {@link ResourceId | resource ID}. Returns `undefined` if no names are defined.
 *
 * @param base - The base name or ID to join.
 * @param names - Additional names to join.
 * @returns `Success` with the new ID if the base and names are valid, `Success` with `undefined`
 * if names were present, or `Failure` with an error message if the resulting id is invalid.
 * @public
 */
export function joinOptionalResourceIds(...ids: (string | undefined)[]): Result<ResourceId | undefined> {
  const errors: MessageAggregator = new MessageAggregator();
  const parts: ResourceName[] = [];
  ids
    .filter((id) => id !== '')
    .forEach((id) => {
      parts.push(...splitResourceId(id).aggregateError(errors).orDefault([]));
    });
  const id = parts.join('.');
  return errors.returnOrReport(id ? toResourceId(id) : succeed(undefined));
}

/**
 * Gets the name for a resource ID.
 * @param id - The resource ID to get the name for.
 * @returns The resource name if found, or undefined if not.
 * @public
 */
export function getNameForResourceId(id: string | undefined): Result<ResourceName> {
  return splitResourceId(id).onSuccess((parts) => {
    return parts.length > 0 ? succeed(parts[parts.length - 1]) : fail('Empty id has no name');
  });
}
