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

/**
 * Helper functions for composite IDs and serialization
 * @packageDocumentation
 */

import { Result, captureResult, fail, succeed } from '@fgv/ts-utils';
import * as yaml from 'js-yaml';

import {
  ID_SEPARATOR,
  IHasId,
  IIdsWithPreferred,
  IOptionsWithPreferred,
  VARIATION_ID_SEPARATOR
} from './model';
import {
  BaseFillingId,
  BaseIngredientId,
  ConfectionId,
  ConfectionRecipeVariationId,
  ConfectionRecipeVariationSpec,
  FillingId,
  FillingRecipeVariationId,
  FillingRecipeVariationSpec,
  IngredientId,
  BaseJournalId,
  JournalId,
  SessionId,
  BaseSessionId,
  CollectionId
} from './ids';
import {
  confectionRecipeVariationId,
  fillingRecipeVariationId,
  ParsedConfectionRecipeVariationId,
  ParsedFillingId,
  ParsedFillingRecipeVariationId,
  ParsedIngredientId,
  ParsedJournalId,
  ParsedSessionId,
  parsedConfectionRecipeVariationId,
  parsedFillingId,
  parsedFillingRecipeVariationId,
  parsedIngredientId,
  parsedJournalId,
  parsedSessionId
} from './converters';
import { sessionId } from './validators';

// ============================================================================
// Composite ID Helpers
// ============================================================================

/**
 * Creates a composite IngredientId from collection ID and base ID
 * @param collectionId - The collection identifier
 * @param baseId - The base ingredient identifier
 * @returns Composite ingredient ID in format "collectionId.baseId"
 * @public
 */
export function createIngredientId(collectionId: CollectionId, baseId: BaseIngredientId): IngredientId {
  return `${collectionId}${ID_SEPARATOR}${baseId}` as IngredientId;
}

/**
 * Parses a composite IngredientId into its component parts
 * @param id - The composite ingredient ID to parse
 * @returns Result with parsed composite ID or error
 * @public
 */
export function parseIngredientId(id: IngredientId): Result<ParsedIngredientId> {
  return parsedIngredientId.convert(id);
}

/**
 * Gets the collection ID from a composite IngredientId
 * @param id - The composite ingredient ID
 * @returns The collection ID portion
 * @public
 */
export function getIngredientCollectionId(id: IngredientId): CollectionId {
  return parsedIngredientId.convert(id).orThrow().collectionId;
}

/**
 * Gets the base ID from a composite IngredientId
 * @param id - The composite ingredient ID
 * @returns The base ingredient ID portion
 * @public
 */
export function getIngredientBaseId(id: IngredientId): BaseIngredientId {
  return parsedIngredientId.convert(id).orThrow().itemId;
}

/**
 * Creates a composite FillingId from collection ID and base ID
 * @param collectionId - The collection identifier
 * @param baseId - The base filling identifier
 * @returns Composite filling ID in format "collectionId.baseId"
 * @public
 */
export function createFillingId(collectionId: CollectionId, baseId: BaseFillingId): FillingId {
  return `${collectionId}${ID_SEPARATOR}${baseId}` as FillingId;
}

/**
 * Parses a composite FillingId into its component parts
 * @param id - The composite filling ID to parse
 * @returns Result with parsed composite ID or error
 * @public
 */
export function parseFillingId(id: FillingId): Result<ParsedFillingId> {
  return parsedFillingId.convert(id);
}

/**
 * Gets the collection ID from a composite FillingId
 * @param id - The composite filling ID
 * @returns The collection ID portion
 * @public
 */
export function getFillingCollectionId(id: FillingId): CollectionId {
  return parsedFillingId.convert(id).orThrow().collectionId;
}

/**
 * Gets the base ID from a composite FillingId
 * @param id - The composite filling ID
 * @returns The base filling ID portion
 * @public
 */
export function getFillingBaseId(id: FillingId): BaseFillingId {
  return parsedFillingId.convert(id).orThrow().itemId;
}

// ============================================================================
// Journal ID Helpers
// ============================================================================

/**
 * Creates a composite JournalId from collection ID and base journal ID
 * @param collectionId - The collection identifier (e.g., "user-journals")
 * @param baseId - The base journal identifier
 * @returns Composite journal ID in format "collectionId.baseJournalId"
 * @public
 */
export function createJournalId(collectionId: CollectionId, baseId: BaseJournalId): JournalId {
  return `${collectionId}${ID_SEPARATOR}${baseId}` as JournalId;
}

/**
 * Parses a composite JournalId into its component parts
 * @param id - The composite journal ID to parse
 * @returns Result with parsed composite ID or error
 * @public
 */
export function parseJournalId(id: JournalId): Result<ParsedJournalId> {
  return parsedJournalId.convert(id);
}

/**
 * Gets the collection ID from a composite JournalId
 * @param id - The composite journal ID
 * @returns The collection ID portion
 * @public
 */
export function getJournalCollectionId(id: JournalId): CollectionId {
  return parsedJournalId.convert(id).orThrow().collectionId;
}

/**
 * Gets the base ID from a composite JournalId
 * @param id - The composite journal ID
 * @returns The base journal ID portion
 * @public
 */
export function getJournalBaseId(id: JournalId): BaseJournalId {
  return parsedJournalId.convert(id).orThrow().itemId;
}

// ============================================================================
// Session ID Helpers
// ============================================================================

/**
 * Creates a composite {@link SessionId | SessionId} from {@link CollectionId | collection ID} and
 * {@link BaseSessionId | base session ID}.
 * @param collectionId - The collection identifier (e.g., "user-sessions")
 * @param baseId - The base session identifier
 * @returns Composite session ID in format "collectionId.baseSessionId"
 * @public
 */
export function createSessionId(collectionId: CollectionId, baseId: BaseSessionId): SessionId {
  return sessionId.convert(`${collectionId}${ID_SEPARATOR}${baseId}`).orThrow();
}

/**
 * Parses a composite {@link SessionId | SessionId} into its component parts
 * @param id - The composite session ID to parse
 * @returns Result with parsed composite ID or error
 * @public
 */
export function parseSessionId(id: SessionId): Result<ParsedSessionId> {
  return parsedSessionId.convert(id);
}

/**
 * Gets the collection ID from a composite {@link SessionId | SessionId}.
 * @param id - The composite session ID
 * @returns The collection ID portion
 * @public
 */
export function getSessionCollectionId(id: SessionId): CollectionId {
  return parsedSessionId.convert(id).orThrow().collectionId;
}

/**
 * Gets the base ID from a composite {@link SessionId | SessionId}.
 * @param id - The composite session ID
 * @returns The base session ID portion
 * @public
 */
export function getSessionBaseId(id: SessionId): BaseSessionId {
  return parsedSessionId.convert(id).orThrow().itemId;
}

// ============================================================================
// Filling Variation ID Helpers
// ============================================================================

/**
 * Creates a composite {@link FillingRecipeVariationId | FillingRecipeVariationId} from
 * {@link FillingId | FillingID} and {@link FillingRecipeVariationSpec | FillingRecipeVariationSpec}.
 * @param fillingId - The filling identifier
 * @param variationSpec - The variation specifier
 * @returns Composite filling variation ID in format "fillingId\@variationSpec"
 * @public
 */
export function createFillingRecipeVariationId(
  fillingId: FillingId,
  variationSpec: FillingRecipeVariationSpec
): FillingRecipeVariationId {
  return `${fillingId}${VARIATION_ID_SEPARATOR}${variationSpec}` as FillingRecipeVariationId;
}

/**
 * Parses a composite {@link FillingRecipeVariationId | FillingRecipeVariationId} into its component parts
 * @param id - The composite filling variation ID to parse
 * @returns Result with parsed composite ID or error
 * @public
 */
export function parseFillingRecipeVariationId(
  id: FillingRecipeVariationId
): Result<ParsedFillingRecipeVariationId> {
  return parsedFillingRecipeVariationId.convert(id);
}

/**
 * Gets the filling ID from a composite {@link FillingRecipeVariationId | FillingRecipeVariationId}
 * @param id - The composite filling variation ID
 * @returns The filling ID portion
 * @public
 */
export function getFillingRecipeVariationFillingId(id: FillingRecipeVariationId): FillingId {
  return parsedFillingRecipeVariationId.convert(id).orThrow().collectionId;
}

/**
 * Gets the variation spec from a composite {@link FillingRecipeVariationId | FillingRecipeVariationId}
 * @param id - The composite filling variation ID
 * @returns The variation spec portion
 * @public
 */
export function getFillingRecipeVariationSpec(id: FillingRecipeVariationId): FillingRecipeVariationSpec {
  return parsedFillingRecipeVariationId.convert(id).orThrow().itemId;
}

/**
 * Creates and validates a {@link ConfectionRecipeVariationId | confection variation ID}
 * from component parts.
 * @param parts - Object with `collectionId` of {@link ConfectionId | ConfectionId} and
 * `itemId` of {@link ConfectionRecipeVariationSpec | ConfectionRecipeVariationSpec}.
 * @returns Result with validated confection variation ID or error
 * @public
 */
export function createConfectionRecipeVariationId(parts: {
  collectionId: ConfectionId;
  itemId: ConfectionRecipeVariationSpec;
}): Result<ConfectionRecipeVariationId> {
  const formatted = `${parts.collectionId}${VARIATION_ID_SEPARATOR}${parts.itemId}`;
  return confectionRecipeVariationId.convert(formatted);
}

/**
 * Parses a composite {@link ConfectionRecipeVariationId | ConfectionRecipeVariationId} into its component parts
 * @param id - The composite confection variation ID to parse
 * @returns Result with parsed composite ID or error
 * @public
 */
export function parseConfectionRecipeVariationId(
  id: ConfectionRecipeVariationId
): Result<ParsedConfectionRecipeVariationId> {
  return parsedConfectionRecipeVariationId.convert(id);
}

/**
 * Creates and validates a {@link FillingRecipeVariationId | filling variation ID} from component parts.
 * Uses converter to ensure the formatted ID is valid.
 * @param parts - Object with `collectionId` of {@link FillingId | FillingId} and `itemId` of {@link FillingRecipeVariationSpec | FillingRecipeVariationSpec}
 * @returns Result with validated filling variation ID or error
 * @public
 */
export function createFillingRecipeVariationIdValidated(parts: {
  collectionId: FillingId;
  itemId: FillingRecipeVariationSpec;
}): Result<FillingRecipeVariationId> {
  const formatted = `${parts.collectionId}${VARIATION_ID_SEPARATOR}${parts.itemId}`;
  return fillingRecipeVariationId.convert(formatted);
}

// ============================================================================
// Options with Preferred Helpers
// ============================================================================

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
  return findById(collection.preferredId, collection.options);
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
  collection?: IOptionsWithPreferred<TOption, TId>
): TOption | undefined {
  if (collection === undefined) {
    return undefined;
  }
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
export function getPreferredId<TId extends string>(collection?: IIdsWithPreferred<TId>): TId | undefined {
  if (collection === undefined || collection.preferredId === undefined) {
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
  collection?: IIdsWithPreferred<TId>
): TId | undefined {
  if (collection === undefined) {
    return undefined;
  }
  return getPreferredId(collection) ?? collection.ids[0];
}

/**
 * Gets the preferred ID from an options collection, falling back to the first option's ID.
 *
 * @typeParam TOption - The option object type
 * @typeParam TId - The ID type
 * @param collection - The options collection
 * @returns The preferred ID, or the first option's ID, or undefined if empty
 * @public
 */
export function getPreferredOptionIdOrFirst<TOption extends IHasId<TId>, TId extends string>(
  collection?: IOptionsWithPreferred<TOption, TId>
): TId | undefined {
  if (collection === undefined) {
    return undefined;
  }
  return collection.preferredId ?? collection.options[0]?.id;
}

// ============================================================================
// Array Utilities
// ============================================================================

/**
 * Returns undefined if the array is empty, otherwise returns the array.
 * Useful for converting empty arrays to undefined in entity representations.
 * @param arr - The array to check
 * @returns The array if non-empty, undefined otherwise
 * @public
 */
export function nonEmpty<T>(arr: ReadonlyArray<T>): ReadonlyArray<T> | undefined {
  return arr.length > 0 ? arr : undefined;
}

/**
 * Finds an item by ID in an optional array of items with IDs.
 * @param id - The ID to search for
 * @param items - The array to search (may be undefined)
 * @returns The matching item, or undefined if not found or items is undefined
 * @public
 */
export function findById<TOption extends IHasId<TId>, TId extends string>(
  id: TId,
  items: ReadonlyArray<TOption> | undefined
): TOption | undefined {
  return items?.find((item) => item.id === id);
}

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
 * Convert a name to a valid base ID.
 * Uses kebab-case conversion.
 * @param name - Name to convert
 * @returns Result containing base ID or failure
 * @public
 */
export function nameToBaseId(name: string): Result<string> {
  if (!name || name.trim().length === 0) {
    return fail('Name cannot be empty');
  }

  const baseId = toKebabCase(name);

  if (baseId.length === 0) {
    return fail('Name must contain at least one alphanumeric character');
  }

  return succeed(baseId);
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
    return succeed(baseId);
  }

  for (let i = 2; i <= maxAttempts; i++) {
    const candidate = `${baseId}-${i}`;
    if (!idSet.has(candidate)) {
      return succeed(candidate);
    }
  }

  return fail(`Could not generate unique base ID from "${baseId}" after ${maxAttempts} attempts`);
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
// Serialization Helpers
// ============================================================================

/**
 * Options for serialization operations.
 * @public
 */
export interface ISerializationOptions {
  /**
   * Whether to pretty-print the output (default: true)
   */
  readonly prettyPrint?: boolean;
}

/**
 * Serialize an object to YAML string.
 * @param data - Object to serialize
 * @param options - Optional serialization options
 * @returns Result containing YAML string or failure
 * @public
 */
export function serializeToYaml<T>(data: T, options?: ISerializationOptions): Result<string> {
  const prettyPrint = options?.prettyPrint ?? true;
  return captureResult(() => {
    return yaml.dump(data, {
      indent: prettyPrint ? 2 : 0,
      lineWidth: 120,
      noRefs: true,
      sortKeys: false
    });
  }).withErrorFormat((error: unknown) => `Failed to serialize to YAML: ${error}`);
}

/**
 * Serialize an object to JSON string.
 * @param data - Object to serialize
 * @param options - Optional serialization options
 * @returns Result containing JSON string or failure
 * @public
 */
export function serializeToJson<T>(data: T, options?: ISerializationOptions): Result<string> {
  const prettyPrint = options?.prettyPrint ?? true;
  return captureResult(() => {
    if (prettyPrint) {
      return JSON.stringify(data, null, 2);
    }
    return JSON.stringify(data);
  }).withErrorFormat((error: unknown) => `Failed to serialize to JSON: ${error}`);
}
