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
 * Sub-library base class for standardized collection management
 * @packageDocumentation
 */

import { Collections, Converter, Validator } from '@fgv/ts-utils';

import { SourceId } from '../common';
import { Converters as CommonConverters } from '../common';

// ============================================================================
// Type Aliases
// ============================================================================

/**
 * A single entry in a sub-library collection.
 * Fixes the collection ID type to SourceId.
 *
 * @typeParam TBaseId - The base item ID type (e.g., `BaseIngredientId`)
 * @typeParam TItem - The item type stored in the collection (e.g., `Ingredient`)
 * @public
 */
export type SubLibraryCollectionEntry<TBaseId extends string, TItem> = Collections.AggregatedResultMapEntry<
  SourceId,
  TBaseId,
  TItem
>;

/**
 * Initialization type for a sub-library collection entry.
 * Fixes the collection ID type to SourceId.
 *
 * @typeParam TBaseId - The base item ID type (e.g., `BaseIngredientId`)
 * @typeParam TItem - The item type stored in the collection (e.g., `Ingredient`)
 * @public
 */
export type SubLibraryEntryInit<TBaseId extends string, TItem> = Collections.AggregatedResultMapEntryInit<
  SourceId,
  TBaseId,
  TItem
>;

/**
 * Validator type for sub-library collections.
 *
 * @typeParam TCompositeId - The composite ID type (e.g., `IngredientId`)
 * @typeParam TItem - The item type stored in the collection (e.g., `Ingredient`)
 * @public
 */
export type SubLibraryCollectionValidator<
  TCompositeId extends string,
  TItem
> = Collections.IReadOnlyResultMapValidator<TCompositeId, TItem>;

/**
 * Type for the collections map in a sub-library.
 * Maps SourceId to collection entries.
 *
 * @typeParam TBaseId - The base item ID type (e.g., `BaseIngredientId`)
 * @typeParam TItem - The item type stored in the collection (e.g., `Ingredient`)
 * @public
 */
export type SubLibraryCollection<TBaseId extends string, TItem> = Collections.IReadOnlyValidatingResultMap<
  SourceId,
  SubLibraryCollectionEntry<TBaseId, TItem>
>;

// ============================================================================
// Constructor Parameters
// ============================================================================

/**
 * Parameters for constructing a SubLibrary.
 * @public
 */
export interface ISubLibraryConstructorParams<TBaseId extends string, TItem> {
  /**
   * Converter or validator for item IDs within collections.
   */
  readonly itemIdConverter: Converter<TBaseId, unknown> | Validator<TBaseId, unknown>;

  /**
   * Converter or validator for items within collections.
   */
  readonly itemConverter: Converter<TItem, unknown> | Validator<TItem, unknown>;

  /**
   * Optional initial collections to populate the library.
   */
  readonly collections?: ReadonlyArray<SubLibraryEntryInit<TBaseId, TItem>>;
}

// ============================================================================
// SubLibraryBase Class
// ============================================================================

/**
 * Base class for sub-libraries that use SourceId as the collection ID.
 *
 * This abstract class standardizes:
 * - Collection ID type: Always `SourceId`
 * - Separator: Always `.` (dot)
 * - Collection ID converter: Always `CommonConverters.sourceId`
 *
 * This reduces the type parameter count from 4 to 3 and eliminates
 * boilerplate in derived classes.
 *
 * @typeParam TCompositeId - The composite ID type (e.g., `IngredientId`)
 * @typeParam TBaseId - The base item ID type (e.g., `BaseIngredientId`)
 * @typeParam TItem - The item type stored in collections (e.g., `Ingredient`)
 * @public
 */
export abstract class SubLibraryBase<
  TCompositeId extends string,
  TBaseId extends string,
  TItem
> extends Collections.AggregatedResultMapBase<TCompositeId, SourceId, TBaseId, TItem> {
  /**
   * Creates a new SubLibraryBase instance.
   *
   * @param params - Construction parameters (itemIdConverter, itemConverter, collections)
   */
  protected constructor(params: ISubLibraryConstructorParams<TBaseId, TItem>) {
    super({
      collectionIdConverter: CommonConverters.sourceId,
      separator: '.',
      ...params
    });
  }
}
