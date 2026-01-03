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
 * Ingredients library with multi-source collection support
 * @packageDocumentation
 */

import { captureResult, Collections, Result, Success } from '@fgv/ts-utils';

import { BaseIngredientId, IngredientId, SourceId } from '../common';
import { Converters as CommonConverters } from '../common';
import { BuiltInSpec, IBuiltInLoadParams, Ingredient } from './model';
import { ingredient as ingredientConverter } from './converters';
import { IngredientCollectionEntryInit } from './ingredientsCollection';
import { CollectionLoader, ILoadCollectionFromFileTreeParams } from '../library-data';
import { BuiltInData } from '../built-in';

// ============================================================================
// Parameters Interface
// ============================================================================

/**
 * Parameters for creating an IngredientsLibrary instance
 * @public
 */
export interface IIngredientsLibraryParams {
  /**
   * Controls which built-in ingredient collections are loaded.
   * Built-in collections are always immutable.
   *
   * - `true` (default): Load all built-in collections.
   * - `false`: Load no built-in collections.
   * - `SourceId[]`: Load only the specified built-in collections by name.
   * - `IBuiltInLoadParams`: Fine-grained control using include/exclude patterns.
   */
  readonly builtin?: BuiltInSpec;

  /**
   * Optional additional collections of ingredients
   * Each collection can be provided as a JSON entry or pre-built entry
   */
  readonly collections?: ReadonlyArray<IngredientCollectionEntryInit>;
}

// ============================================================================
// IngredientsLibrary Class
// ============================================================================

/**
 * Multi-source ingredient library with type-safe access
 *
 * Wraps AggregatedResultMap to provide:
 * - Composite ID access (e.g., "felchlin.maracaibo-65")
 * - Multi-source management (built-in, user, app-local, etc.)
 * - Mutable vs immutable collection distinction
 * - Weakly-typed validating access for external data
 *
 * @public
 */
export class IngredientsLibrary extends Collections.AggregatedResultMapBase<
  IngredientId,
  SourceId,
  BaseIngredientId,
  Ingredient
> {
  private constructor(collections: ReadonlyArray<IngredientCollectionEntryInit>) {
    super({
      collectionIdConverter: CommonConverters.sourceId,
      itemIdConverter: CommonConverters.baseIngredientId,
      itemConverter: ingredientConverter,
      separator: '.',
      collections
    });
  }

  /**
   * Converts BuiltInSpec to ILoadCollectionFromFileTreeParams for the CollectionLoader.
   * @param spec - The BuiltInSpec to convert.
   * @returns The loading parameters, or undefined if no built-ins should be loaded.
   */
  private static _builtInSpecToLoadParams(
    spec: BuiltInSpec
  ): ILoadCollectionFromFileTreeParams<SourceId> | undefined {
    // false means no built-ins
    if (spec === false) {
      return undefined;
    }

    // true means load all with default settings
    if (spec === true) {
      return {
        mutable: false // Built-ins are always immutable
      };
    }

    // Array of SourceId means load only those collections
    if (Array.isArray(spec)) {
      return {
        included: spec,
        mutable: false
      };
    }

    // IBuiltInLoadParams - fine-grained control
    const params = spec as IBuiltInLoadParams;
    return {
      included: params.included,
      excluded: params.excluded,
      recurseWithDelimiter: params.recurseWithDelimiter,
      mutable: false // Built-ins are always immutable
    };
  }

  /**
   * Loads built-in ingredient collections based on the BuiltInSpec.
   * @param spec - The BuiltInSpec controlling which built-ins to load.
   * @returns Success with collections or Failure with error.
   */
  private static _loadBuiltInCollections(
    spec: BuiltInSpec
  ): Result<ReadonlyArray<IngredientCollectionEntryInit>> {
    const loadParams = IngredientsLibrary._builtInSpecToLoadParams(spec);
    if (loadParams === undefined) {
      return Success.with([]);
    }

    const loader = new CollectionLoader<Ingredient, SourceId, BaseIngredientId>({
      itemConverter: ingredientConverter,
      collectionIdConverter: CommonConverters.sourceId,
      itemIdConverter: CommonConverters.baseIngredientId,
      mutable: false // Default for this loader
    });

    return BuiltInData.getIngredientsDirectory().onSuccess((ingredientsDir) => {
      return loader.loadFromFileTree(ingredientsDir, loadParams);
    });
  }

  /**
   * Creates a new IngredientsLibrary instance
   * @param params - Optional creation parameters with initial collections
   * @returns Success with new instance, or Failure with error message
   * @public
   */
  public static create(params?: IIngredientsLibraryParams): Result<IngredientsLibrary> {
    const builtin = params?.builtin ?? true;
    const additionalCollections = params?.collections ?? [];

    return IngredientsLibrary._loadBuiltInCollections(builtin).onSuccess((builtInCollections) => {
      const allCollections: IngredientCollectionEntryInit[] = [
        ...builtInCollections,
        ...additionalCollections
      ];
      return captureResult(() => new IngredientsLibrary(allCollections));
    });
  }
}
