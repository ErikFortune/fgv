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
  BaseIngredientId,
  BaseRecipeId,
  ID_SEPARATOR,
  IHasId,
  IIdsWithPreferred,
  IngredientId,
  IOptionsWithPreferred,
  RecipeId,
  RecipeVersionId,
  RecipeVersionSpec,
  SourceId,
  VERSION_ID_SEPARATOR
} from './model';
import {
  ParsedIngredientId,
  ParsedRecipeId,
  ParsedRecipeVersionId,
  parsedIngredientId,
  parsedRecipeId,
  parsedRecipeVersionId
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
 * Creates a composite RecipeId from source ID and base ID
 * @param sourceId - The source identifier
 * @param baseId - The base recipe identifier
 * @returns Composite recipe ID in format "sourceId.baseId"
 * @public
 */
export function createRecipeId(sourceId: SourceId, baseId: BaseRecipeId): RecipeId {
  return `${sourceId}${ID_SEPARATOR}${baseId}` as RecipeId;
}

/**
 * Parses a composite RecipeId into its component parts
 * @param id - The composite recipe ID to parse
 * @returns Result with parsed composite ID or error
 * @public
 */
export function parseRecipeId(id: RecipeId): Result<ParsedRecipeId> {
  return parsedRecipeId.convert(id);
}

/**
 * Gets the source ID from a composite RecipeId
 * @param id - The composite recipe ID
 * @returns The source ID portion
 * @public
 */
export function getRecipeSourceId(id: RecipeId): SourceId {
  return parsedRecipeId.convert(id).orThrow().collectionId;
}

/**
 * Gets the base ID from a composite RecipeId
 * @param id - The composite recipe ID
 * @returns The base recipe ID portion
 * @public
 */
export function getRecipeBaseId(id: RecipeId): BaseRecipeId {
  return parsedRecipeId.convert(id).orThrow().itemId;
}

// ============================================================================
// Recipe Version ID Helpers
// ============================================================================

/**
 * Creates a composite RecipeVersionId from recipe ID and version spec
 * @param recipeId - The recipe identifier
 * @param versionSpec - The version specifier
 * @returns Composite recipe version ID in format "recipeId\@versionSpec"
 * @public
 */
export function createRecipeVersionId(recipeId: RecipeId, versionSpec: RecipeVersionSpec): RecipeVersionId {
  return `${recipeId}${VERSION_ID_SEPARATOR}${versionSpec}` as RecipeVersionId;
}

/**
 * Parses a composite RecipeVersionId into its component parts
 * @param id - The composite recipe version ID to parse
 * @returns Result with parsed composite ID or error
 * @public
 */
export function parseRecipeVersionId(id: RecipeVersionId): Result<ParsedRecipeVersionId> {
  return parsedRecipeVersionId.convert(id);
}

/**
 * Gets the recipe ID from a composite RecipeVersionId
 * @param id - The composite recipe version ID
 * @returns The recipe ID portion
 * @public
 */
export function getRecipeVersionRecipeId(id: RecipeVersionId): RecipeId {
  return parsedRecipeVersionId.convert(id).orThrow().collectionId;
}

/**
 * Gets the version spec from a composite RecipeVersionId
 * @param id - The composite recipe version ID
 * @returns The version spec portion
 * @public
 */
export function getRecipeVersionSpec(id: RecipeVersionId): RecipeVersionSpec {
  return parsedRecipeVersionId.convert(id).orThrow().itemId;
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
