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
 * Converters for inventory entry types
 * @packageDocumentation
 */

import { Converter, Converters, Failure, fail, Result, Success, succeed } from '@fgv/ts-utils';

import { Converters as CommonConverters, Model as CommonModel, CollectionId } from '../../common';
import {
  allInventoryTypes,
  AnyInventoryEntryEntity,
  IIngredientInventoryEntryEntity,
  IngredientInventoryEntryBaseId,
  IngredientInventoryEntryId,
  IMoldInventoryEntryEntity,
  InventoryType,
  MoldInventoryEntryBaseId,
  MoldInventoryEntryId
} from './model';

// ============================================================================
// ID Separator
// ============================================================================

const ID_SEPARATOR: string = '.';

// ============================================================================
// Mold Inventory Entry ID Validation
// ============================================================================

/**
 * Validates a value is a valid {@link Entities.Inventory.MoldInventoryEntryBaseId | MoldInventoryEntryBaseId}.
 * @internal
 */
function toMoldInventoryEntryBaseId(from: unknown): Result<MoldInventoryEntryBaseId> {
  if (typeof from === 'string' && from.length > 0 && CommonModel.BASE_ID_PATTERN.test(from)) {
    return Success.with(from as MoldInventoryEntryBaseId);
  }
  return Failure.with(
    'Invalid MoldInventoryEntryBaseId: must be non-empty alphanumeric with dashes/underscores, no dots'
  );
}

/**
 * Validates a value is a valid {@link Entities.Inventory.MoldInventoryEntryId | MoldInventoryEntryId}.
 * @internal
 */
function toMoldInventoryEntryId(from: unknown): Result<MoldInventoryEntryId> {
  if (typeof from === 'string' && from.length > 0 && CommonModel.COMPOSITE_ID_PATTERN.test(from)) {
    return Success.with(from as MoldInventoryEntryId);
  }
  return Failure.with('Invalid MoldInventoryEntryId: must be in format collection.entryId');
}

// ============================================================================
// Mold Inventory Entry ID Converters
// ============================================================================

/**
 * Converter for {@link Entities.Inventory.MoldInventoryEntryBaseId | MoldInventoryEntryBaseId}.
 * @public
 */
export const moldInventoryEntryBaseId: Converter<MoldInventoryEntryBaseId> =
  Converters.generic(toMoldInventoryEntryBaseId);

/**
 * Converter for {@link Entities.Inventory.MoldInventoryEntryId | MoldInventoryEntryId}.
 * @public
 */
export const moldInventoryEntryId: Converter<MoldInventoryEntryId> =
  Converters.generic(toMoldInventoryEntryId);

/**
 * Type alias for parsed {@link Entities.Inventory.MoldInventoryEntryId | MoldInventoryEntryId} components.
 * @public
 */
export type ParsedMoldInventoryEntryId = Converters.ICompositeId<CollectionId, MoldInventoryEntryBaseId>;

/**
 * Converter that parses a {@link Entities.Inventory.MoldInventoryEntryId | MoldInventoryEntryId} string
 * into its component parts.
 * @public
 */
export const parsedMoldInventoryEntryId: Converter<ParsedMoldInventoryEntryId> = Converters.compositeId(
  CommonConverters.collectionId,
  ID_SEPARATOR,
  moldInventoryEntryBaseId
);

// ============================================================================
// Ingredient Inventory Entry ID Validation
// ============================================================================

/**
 * Validates a value is a valid {@link Entities.Inventory.IngredientInventoryEntryBaseId | IngredientInventoryEntryBaseId}.
 * @internal
 */
function toIngredientInventoryEntryBaseId(from: unknown): Result<IngredientInventoryEntryBaseId> {
  if (typeof from === 'string' && from.length > 0 && CommonModel.BASE_ID_PATTERN.test(from)) {
    return Success.with(from as IngredientInventoryEntryBaseId);
  }
  return Failure.with(
    'Invalid IngredientInventoryEntryBaseId: must be non-empty alphanumeric with dashes/underscores, no dots'
  );
}

/**
 * Validates a value is a valid {@link Entities.Inventory.IngredientInventoryEntryId | IngredientInventoryEntryId}.
 * @internal
 */
function toIngredientInventoryEntryId(from: unknown): Result<IngredientInventoryEntryId> {
  if (typeof from === 'string' && from.length > 0 && CommonModel.COMPOSITE_ID_PATTERN.test(from)) {
    return Success.with(from as IngredientInventoryEntryId);
  }
  return Failure.with('Invalid IngredientInventoryEntryId: must be in format collection.entryId');
}

// ============================================================================
// Ingredient Inventory Entry ID Converters
// ============================================================================

/**
 * Converter for {@link Entities.Inventory.IngredientInventoryEntryBaseId | IngredientInventoryEntryBaseId}.
 * @public
 */
export const ingredientInventoryEntryBaseId: Converter<IngredientInventoryEntryBaseId> = Converters.generic(
  toIngredientInventoryEntryBaseId
);

/**
 * Converter for {@link Entities.Inventory.IngredientInventoryEntryId | IngredientInventoryEntryId}.
 * @public
 */
export const ingredientInventoryEntryId: Converter<IngredientInventoryEntryId> = Converters.generic(
  toIngredientInventoryEntryId
);

/**
 * Type alias for parsed {@link Entities.Inventory.IngredientInventoryEntryId | IngredientInventoryEntryId} components.
 * @public
 */
export type ParsedIngredientInventoryEntryId = Converters.ICompositeId<
  CollectionId,
  IngredientInventoryEntryBaseId
>;

/**
 * Converter that parses a {@link Entities.Inventory.IngredientInventoryEntryId | IngredientInventoryEntryId} string
 * into its component parts.
 * @public
 */
export const parsedIngredientInventoryEntryId: Converter<ParsedIngredientInventoryEntryId> =
  Converters.compositeId(CommonConverters.collectionId, ID_SEPARATOR, ingredientInventoryEntryBaseId);

// ============================================================================
// Enumeration Converters
// ============================================================================

/**
 * Converter for {@link Entities.Inventory.InventoryType | InventoryType}.
 * @public
 */
export const inventoryType: Converter<InventoryType> = Converters.enumeratedValue(allInventoryTypes);

// ============================================================================
// Mold Inventory Entry Converter
// ============================================================================

/**
 * Converter for {@link Entities.Inventory.IMoldInventoryEntryEntity | IMoldInventoryEntryEntity}.
 * @public
 */
export const moldInventoryEntryEntity: Converter<IMoldInventoryEntryEntity> =
  Converters.object<IMoldInventoryEntryEntity>({
    inventoryType: Converters.literal('mold'),
    moldId: CommonConverters.moldId,
    count: Converters.number,
    location: Converters.string.optional(),
    notes: Converters.arrayOf(CommonConverters.categorizedNote).optional()
  });

// ============================================================================
// Ingredient Inventory Entry Converter
// ============================================================================

/**
 * Converter for {@link Entities.Inventory.IIngredientInventoryEntryEntity | IIngredientInventoryEntryEntity}.
 * @public
 */
export const ingredientInventoryEntryEntity: Converter<IIngredientInventoryEntryEntity> =
  Converters.object<IIngredientInventoryEntryEntity>({
    inventoryType: Converters.literal('ingredient'),
    ingredientId: CommonConverters.ingredientId,
    quantity: CommonConverters.measurement,
    unit: CommonConverters.measurementUnit.optional(),
    location: Converters.string.optional(),
    notes: Converters.arrayOf(CommonConverters.categorizedNote).optional()
  });

// ============================================================================
// Discriminated Union Converter
// ============================================================================

/**
 * Converter for {@link Entities.Inventory.AnyInventoryEntryEntity | AnyInventoryEntryEntity}.
 * Uses the `inventoryType` property to determine which specific converter to use.
 * @public
 */
export const anyInventoryEntryEntity: Converter<AnyInventoryEntryEntity> =
  Converters.generic<AnyInventoryEntryEntity>((from: unknown): Result<AnyInventoryEntryEntity> => {
    // First validate it's an object with an inventoryType field
    const typeResult = Converters.object({ inventoryType })
      .convert(from)
      .onSuccess((obj) => succeed(obj.inventoryType));

    if (typeResult.isFailure()) {
      return fail(`Invalid inventory entry: ${typeResult.message}`);
    }

    // Dispatch to the appropriate converter based on type
    switch (typeResult.value) {
      case 'mold':
        return moldInventoryEntryEntity.convert(from);
      case 'ingredient':
        return ingredientInventoryEntryEntity.convert(from);
      /* c8 ignore next 3 - defensive coding: exhaustive check */
      default:
        // @ts-expect-error - exhaustive check
        return fail(`Unknown inventory type: ${typeResult.value}`);
    }
  });
