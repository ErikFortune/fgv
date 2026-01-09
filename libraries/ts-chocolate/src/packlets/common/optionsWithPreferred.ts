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
 * Generic "options with preferred" abstraction for collections that have
 * a set of available options with one identified as preferred/recommended.
 * @packageDocumentation
 */

/**
 * Base interface that option types must extend for use with IOptionsWithPreferred.
 * Enables generic helpers that work with any option type.
 * @typeParam TId - The type of the identifier
 * @public
 */
export interface IHasId<TId extends string> {
  readonly id: TId;
}

/**
 * Collection of options (objects with IDs) with a preferred selection.
 * Use when options are objects containing IDs plus additional metadata.
 *
 * @typeParam TOption - The option object type (must have an `id` property)
 * @typeParam TId - The ID type for the preferred selection
 * @public
 */
export interface IOptionsWithPreferred<TOption extends IHasId<TId>, TId extends string> {
  /** Available options */
  readonly options: ReadonlyArray<TOption>;
  /** ID of the preferred/recommended option */
  readonly preferredId?: TId;
}

/**
 * Collection of simple IDs with a preferred selection.
 * Use when options are just IDs without additional metadata.
 *
 * @typeParam TId - The ID type
 * @public
 */
export interface IIdsWithPreferred<TId extends string> {
  /** Available option IDs */
  readonly ids: ReadonlyArray<TId>;
  /** The preferred/recommended ID */
  readonly preferredId?: TId;
}

/**
 * Gets the preferred option from a collection, if one is specified and exists.
 *
 * @typeParam TOption - The option object type
 * @typeParam TId - The ID type
 * @param collection - The options collection
 * @returns The preferred option, or undefined if not specified or not found
 * @public
 */
export function getPreferred<TOption extends IHasId<TId>, TId extends string>(
  collection: IOptionsWithPreferred<TOption, TId>
): TOption | undefined {
  if (collection.preferredId === undefined) {
    return undefined;
  }
  return collection.options.find((opt) => opt.id === collection.preferredId);
}

/**
 * Gets the preferred option from a collection, falling back to the first option.
 *
 * @typeParam TOption - The option object type
 * @typeParam TId - The ID type
 * @param collection - The options collection
 * @returns The preferred option, or the first option, or undefined if empty
 * @public
 */
export function getPreferredOrFirst<TOption extends IHasId<TId>, TId extends string>(
  collection: IOptionsWithPreferred<TOption, TId>
): TOption | undefined {
  return getPreferred(collection) ?? collection.options[0];
}

/**
 * Gets the preferred ID from a simple ID collection, if specified and valid.
 *
 * @typeParam TId - The ID type
 * @param collection - The IDs collection
 * @returns The preferred ID if it exists in the collection, otherwise undefined
 * @public
 */
export function getPreferredId<TId extends string>(collection: IIdsWithPreferred<TId>): TId | undefined {
  if (collection.preferredId === undefined) {
    return undefined;
  }
  return collection.ids.includes(collection.preferredId) ? collection.preferredId : undefined;
}

/**
 * Gets the preferred ID from a simple ID collection, falling back to the first ID.
 *
 * @typeParam TId - The ID type
 * @param collection - The IDs collection
 * @returns The preferred ID, or the first ID, or undefined if empty
 * @public
 */
export function getPreferredIdOrFirst<TId extends string>(
  collection: IIdsWithPreferred<TId>
): TId | undefined {
  return getPreferredId(collection) ?? collection.ids[0];
}
