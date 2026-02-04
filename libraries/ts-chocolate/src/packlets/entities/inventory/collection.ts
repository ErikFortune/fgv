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
 * Type aliases for Inventory Collection types
 * @packageDocumentation
 */

import {
  SubLibraryCollection,
  SubLibraryCollectionEntry,
  SubLibraryCollectionValidator,
  SubLibraryEntryInit
} from '../../library-data';
import {
  IIngredientInventoryEntryEntity,
  IMoldInventoryEntryEntity,
  IngredientInventoryEntryBaseId,
  MoldInventoryEntryBaseId
} from './model';

// ============================================================================
// Mold Inventory Collection Types
// ============================================================================

/**
 * A single entry in a mold inventory collection.
 * Keyed by the inventory entry's base ID (not the mold's ID).
 * The entry's `moldId` field contains the composite MoldId of the mold being inventoried.
 * @public
 */
export type MoldInventoryCollectionEntry = SubLibraryCollectionEntry<
  MoldInventoryEntryBaseId,
  IMoldInventoryEntryEntity
>;

/**
 * Initialization type for a MoldInventoryLibrary collection entry.
 * @public
 */
export type MoldInventoryCollectionEntryInit = SubLibraryEntryInit<
  MoldInventoryEntryBaseId,
  IMoldInventoryEntryEntity
>;

/**
 * Validator type for MoldInventoryLibrary collections.
 * @public
 */
export type MoldInventoryCollectionValidator = SubLibraryCollectionValidator<
  MoldInventoryEntryBaseId,
  IMoldInventoryEntryEntity
>;

/**
 * Type for the collections in a MoldInventoryLibrary.
 * @public
 */
export type MoldInventoryCollection = SubLibraryCollection<
  MoldInventoryEntryBaseId,
  IMoldInventoryEntryEntity
>;

// ============================================================================
// Ingredient Inventory Collection Types
// ============================================================================

/**
 * A single entry in an ingredient inventory collection.
 * Keyed by the inventory entry's base ID (not the ingredient's ID).
 * The entry's `ingredientId` field contains the composite IngredientId of the ingredient being inventoried.
 * @public
 */
export type IngredientInventoryCollectionEntry = SubLibraryCollectionEntry<
  IngredientInventoryEntryBaseId,
  IIngredientInventoryEntryEntity
>;

/**
 * Initialization type for an IngredientInventoryLibrary collection entry.
 * @public
 */
export type IngredientInventoryCollectionEntryInit = SubLibraryEntryInit<
  IngredientInventoryEntryBaseId,
  IIngredientInventoryEntryEntity
>;

/**
 * Validator type for IngredientInventoryLibrary collections.
 * @public
 */
export type IngredientInventoryCollectionValidator = SubLibraryCollectionValidator<
  IngredientInventoryEntryBaseId,
  IIngredientInventoryEntryEntity
>;

/**
 * Type for the collections in an IngredientInventoryLibrary.
 * @public
 */
export type IngredientInventoryCollection = SubLibraryCollection<
  IngredientInventoryEntryBaseId,
  IIngredientInventoryEntryEntity
>;
