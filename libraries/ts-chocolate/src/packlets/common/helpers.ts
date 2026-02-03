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
 * Helper functions for composite IDs
 * @packageDocumentation
 */

import { Result } from '@fgv/ts-utils';

import {
  ID_SEPARATOR,
  IHasId,
  IIdsWithPreferred,
  IOptionsWithPreferred,
  VERSION_ID_SEPARATOR
} from './model';
import {
  BaseFillingId,
  BaseIngredientId,
  ConfectionId,
  ConfectionVersionId,
  ConfectionVersionSpec,
  FillingId,
  FillingVersionId,
  FillingVersionSpec,
  IngredientId,
  JournalBaseId,
  JournalId,
  PersistedSessionId,
  SessionBaseId,
  SourceId
} from './ids';
import {
  confectionVersionId as confectionVersionIdConverter,
  fillingVersionId as fillingVersionIdConverter,
  ParsedConfectionVersionId,
  ParsedFillingId,
  ParsedFillingVersionId,
  ParsedIngredientId,
  ParsedJournalId,
  ParsedPersistedSessionId,
  parsedConfectionVersionId,
  parsedFillingId,
  parsedFillingVersionId,
  parsedIngredientId,
  parsedJournalId,
  parsedPersistedSessionId
} from './converters';

// ============================================================================
// Composite ID Helpers
// ============================================================================

/**
 * Creates a composite IngredientId from source ID and base ID
 * @param sourceId - The source identifier
 * @param baseId - The base ingredient identifier
 * @returns Composite ingredient ID in format "sourceId.baseId"
 * @public
 */
export function createIngredientId(sourceId: SourceId, baseId: BaseIngredientId): IngredientId {
  return `${sourceId}${ID_SEPARATOR}${baseId}` as IngredientId;
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
 * Gets the source ID from a composite IngredientId
 * @param id - The composite ingredient ID
 * @returns The source ID portion
 * @public
 */
export function getIngredientSourceId(id: IngredientId): SourceId {
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
 * Creates a composite FillingId from source ID and base ID
 * @param sourceId - The source identifier
 * @param baseId - The base filling identifier
 * @returns Composite filling ID in format "sourceId.baseId"
 * @public
 */
export function createFillingId(sourceId: SourceId, baseId: BaseFillingId): FillingId {
  return `${sourceId}${ID_SEPARATOR}${baseId}` as FillingId;
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
 * Gets the source ID from a composite FillingId
 * @param id - The composite filling ID
 * @returns The source ID portion
 * @public
 */
export function getFillingSourceId(id: FillingId): SourceId {
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
export function createJournalId(collectionId: SourceId, baseId: JournalBaseId): JournalId {
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
export function getJournalCollectionId(id: JournalId): SourceId {
  return parsedJournalId.convert(id).orThrow().collectionId;
}

/**
 * Gets the base ID from a composite JournalId
 * @param id - The composite journal ID
 * @returns The base journal ID portion
 * @public
 */
export function getJournalBaseId(id: JournalId): JournalBaseId {
  return parsedJournalId.convert(id).orThrow().itemId;
}

// ============================================================================
// Persisted Session ID Helpers
// ============================================================================

/**
 * Creates a composite PersistedSessionId from collection ID and base session ID
 * @param collectionId - The collection identifier (e.g., "user-sessions")
 * @param baseId - The base session identifier
 * @returns Composite persisted session ID in format "collectionId.baseSessionId"
 * @public
 */
export function createPersistedSessionId(collectionId: SourceId, baseId: SessionBaseId): PersistedSessionId {
  return `${collectionId}${ID_SEPARATOR}${baseId}` as PersistedSessionId;
}

/**
 * Parses a composite PersistedSessionId into its component parts
 * @param id - The composite persisted session ID to parse
 * @returns Result with parsed composite ID or error
 * @public
 */
export function parsePersistedSessionId(id: PersistedSessionId): Result<ParsedPersistedSessionId> {
  return parsedPersistedSessionId.convert(id);
}

/**
 * Gets the collection ID from a composite PersistedSessionId
 * @param id - The composite persisted session ID
 * @returns The collection ID portion
 * @public
 */
export function getPersistedSessionCollectionId(id: PersistedSessionId): SourceId {
  return parsedPersistedSessionId.convert(id).orThrow().collectionId;
}

/**
 * Gets the base ID from a composite PersistedSessionId
 * @param id - The composite persisted session ID
 * @returns The base session ID portion
 * @public
 */
export function getPersistedSessionBaseId(id: PersistedSessionId): SessionBaseId {
  return parsedPersistedSessionId.convert(id).orThrow().itemId;
}

// ============================================================================
// Filling Version ID Helpers
// ============================================================================

/**
 * Creates a composite FillingVersionId from filling ID and version spec
 * @param fillingId - The filling identifier
 * @param versionSpec - The version specifier
 * @returns Composite filling version ID in format "fillingId\@versionSpec"
 * @public
 */
export function createFillingVersionId(
  fillingId: FillingId,
  versionSpec: FillingVersionSpec
): FillingVersionId {
  return `${fillingId}${VERSION_ID_SEPARATOR}${versionSpec}` as FillingVersionId;
}

/**
 * Parses a composite FillingVersionId into its component parts
 * @param id - The composite filling version ID to parse
 * @returns Result with parsed composite ID or error
 * @public
 */
export function parseFillingVersionId(id: FillingVersionId): Result<ParsedFillingVersionId> {
  return parsedFillingVersionId.convert(id);
}

/**
 * Gets the filling ID from a composite FillingVersionId
 * @param id - The composite filling version ID
 * @returns The filling ID portion
 * @public
 */
export function getFillingVersionFillingId(id: FillingVersionId): FillingId {
  return parsedFillingVersionId.convert(id).orThrow().collectionId;
}

/**
 * Gets the version spec from a composite FillingVersionId
 * @param id - The composite filling version ID
 * @returns The version spec portion
 * @public
 */
export function getFillingVersionSpec(id: FillingVersionId): FillingVersionSpec {
  return parsedFillingVersionId.convert(id).orThrow().itemId;
}

/**
 * Creates and validates a confection version ID from component parts.
 * Uses converter to ensure the formatted ID is valid.
 * @param parts - Object with collectionId (ConfectionId) and itemId (ConfectionVersionSpec)
 * @returns Result with validated confection version ID or error
 * @public
 */
export function createConfectionVersionId(parts: {
  collectionId: ConfectionId;
  itemId: ConfectionVersionSpec;
}): Result<ConfectionVersionId> {
  const formatted = `${parts.collectionId}${VERSION_ID_SEPARATOR}${parts.itemId}`;
  return confectionVersionIdConverter.convert(formatted);
}

/**
 * Parses a composite ConfectionVersionId into its component parts
 * @param id - The composite confection version ID to parse
 * @returns Result with parsed composite ID or error
 * @public
 */
export function parseConfectionVersionId(id: ConfectionVersionId): Result<ParsedConfectionVersionId> {
  return parsedConfectionVersionId.convert(id);
}

/**
 * Creates and validates a filling version ID from component parts.
 * Uses converter to ensure the formatted ID is valid.
 * @param parts - Object with collectionId (FillingId) and itemId (FillingVersionSpec)
 * @returns Result with validated filling version ID or error
 * @public
 */
export function createFillingVersionIdValidated(parts: {
  collectionId: FillingId;
  itemId: FillingVersionSpec;
}): Result<FillingVersionId> {
  const formatted = `${parts.collectionId}${VERSION_ID_SEPARATOR}${parts.itemId}`;
  return fillingVersionIdConverter.convert(formatted);
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
