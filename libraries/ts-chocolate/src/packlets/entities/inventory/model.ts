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
 * Inventory model types for the user library.
 *
 * This module defines the schema for inventory records that track
 * what molds and ingredients the user has on hand.
 *
 * @packageDocumentation
 */

import { Brand } from '@fgv/ts-utils';

import {
  IngredientId,
  LocationId,
  Measurement,
  MeasurementUnit,
  Model as CommonModel,
  MoldId
} from '../../common';

// ============================================================================
// Inventory Entry ID Types
// ============================================================================

/**
 * Base ID for a mold inventory entry within an inventory collection.
 * Character restrictions: alphanumeric, dashes, underscores only (no dots)
 * Pattern: /^[a-zA-Z0-9_-]+$/
 * @public
 */
export type MoldInventoryEntryBaseId = Brand<string, 'MoldInventoryEntryBaseId'>;

/**
 * Composite ID for a mold inventory entry (inventoryCollection.entryBaseId).
 * @public
 */
export type MoldInventoryEntryId = Brand<string, 'MoldInventoryEntryId'>;

/**
 * Base ID for an ingredient inventory entry within an inventory collection.
 * Character restrictions: alphanumeric, dashes, underscores only (no dots)
 * Pattern: /^[a-zA-Z0-9_-]+$/
 * @public
 */
export type IngredientInventoryEntryBaseId = Brand<string, 'IngredientInventoryEntryBaseId'>;

/**
 * Composite ID for an ingredient inventory entry (inventoryCollection.entryBaseId).
 * @public
 */
export type IngredientInventoryEntryId = Brand<string, 'IngredientInventoryEntryId'>;

// ============================================================================
// Schema Version
// ============================================================================

/**
 * Current schema version for inventory entries.
 * @public
 */
export const INVENTORY_SCHEMA_VERSION: 1 = 1;

/**
 * Schema version discriminator type.
 * @public
 */
export type InventorySchemaVersion = typeof INVENTORY_SCHEMA_VERSION;

// ============================================================================
// Common Inventory Types
// ============================================================================

/**
 * Inventory entry type discriminator.
 * @public
 */
export type InventoryType = 'mold' | 'ingredient';

/**
 * All possible inventory types.
 * @public
 */
export const allInventoryTypes: ReadonlyArray<InventoryType> = ['mold', 'ingredient'];

// ============================================================================
// Base Inventory Entry
// ============================================================================

/**
 * Common properties shared by all inventory entry types.
 * @public
 */
export interface IInventoryEntryEntityBase {
  /** Inventory type discriminator */
  readonly inventoryType: InventoryType;
  /** Optional location reference (collection.baseId) */
  readonly locationId?: LocationId;
  /** Optional categorized notes about this inventory item */
  readonly notes?: ReadonlyArray<CommonModel.ICategorizedNote>;
}

// ============================================================================
// Mold Inventory Entry
// ============================================================================

/**
 * Inventory entry for molds.
 *
 * The moldId is the full composite ID (e.g., 'builtin.silicone-round')
 * identifying which specific mold from which collection is being inventoried.
 *
 * @public
 */
export interface IMoldInventoryEntryEntity extends IInventoryEntryEntityBase {
  readonly inventoryType: 'mold';
  /** The composite ID of the mold being inventoried (collection.baseId) */
  readonly moldId: MoldId;
  /** Number of this mold the user owns */
  readonly count: number;
}

// ============================================================================
// Ingredient Inventory Entry
// ============================================================================

/**
 * Inventory entry for ingredients.
 *
 * The ingredientId is the full composite ID (e.g., 'builtin.cocoa-butter')
 * identifying which specific ingredient from which collection is being inventoried.
 *
 * @public
 */
export interface IIngredientInventoryEntryEntity extends IInventoryEntryEntityBase {
  readonly inventoryType: 'ingredient';
  /** The composite ID of the ingredient being inventoried (collection.baseId) */
  readonly ingredientId: IngredientId;
  /** Quantity on hand */
  readonly quantity: Measurement;
  /** Unit for the quantity (defaults to 'g' if not specified) */
  readonly unit?: MeasurementUnit;
}

// ============================================================================
// Discriminated Union
// ============================================================================

/**
 * Discriminated union of all inventory entry types.
 * Use type guards to narrow to specific types.
 * @public
 */
export type AnyInventoryEntryEntity = IMoldInventoryEntryEntity | IIngredientInventoryEntryEntity;

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard for IMoldInventoryEntry.
 * @param entry - Entry to check
 * @returns True if the entry is a mold inventory entry
 * @public
 */
export function isMoldInventoryEntryEntity(
  entry: AnyInventoryEntryEntity
): entry is IMoldInventoryEntryEntity {
  return entry.inventoryType === 'mold';
}

/**
 * Type guard for IIngredientInventoryEntry.
 * @param entry - Entry to check
 * @returns True if the entry is an ingredient inventory entry
 * @public
 */
export function isIngredientInventoryEntryEntity(
  entry: AnyInventoryEntryEntity
): entry is IIngredientInventoryEntryEntity {
  return entry.inventoryType === 'ingredient';
}
