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
 * Main ChocolateLibrary class - unified access to ingredients and recipes
 * @packageDocumentation
 */

import { Failure, Result, Success } from '@fgv/ts-utils';

import { Grams, IngredientId, RecipeId, RecipeVersionId, SourceId } from '../common';
import { Ingredient, IngredientsLibrary } from '../ingredients';
import { IRecipe, IScaledRecipeVersion, RecipesLibrary, scaleRecipe, IRecipeScaleOptions } from '../recipes';
import { IGanacheCalculation, IngredientResolver, calculateGanache } from '../calculations';
import {
  FullLibraryLoadSpec,
  IFileTreeSource,
  ILibraryFileTreeSource,
  normalizeFileSources,
  resolveBuiltInSpec,
  SubLibraryId
} from '../library-data';

// ============================================================================
// Parameters Interface
// ============================================================================

/**
 * Pre-built library instances to include.
 * Useful for testing or when libraries are constructed through other means.
 * @public
 */
export interface IInstantiatedLibrarySource {
  /**
   * Pre-built ingredients library
   */
  readonly ingredients?: IngredientsLibrary;

  /**
   * Pre-built recipes library
   */
  readonly recipes?: RecipesLibrary;
}

/**
 * Parameters for creating a ChocolateLibrary
 *
 * Sources are processed in order:
 * 1. Built-in collections (if enabled)
 * 2. File tree sources (in array order)
 * 3. Pre-instantiated libraries (merged in)
 *
 * When multiple sources provide the same collection ID within a sub-library,
 * an error is returned (strict mode - no overwrites).
 *
 * @public
 */
export interface IChocolateLibraryParams {
  /**
   * Controls built-in data loading for each sub-library.
   *
   * - `true` (default): Load all built-ins for all sub-libraries
   * - `false`: Load no built-ins
   * - Per-sub-library control with `ingredients`, `recipes`, or `default` keys
   */
  readonly builtin?: FullLibraryLoadSpec;

  /**
   * File tree sources to load data from.
   * Each source navigates to standard paths (data/ingredients, data/recipes)
   * and loads collections according to the source's load spec.
   */
  readonly fileSources?: ILibraryFileTreeSource | ReadonlyArray<ILibraryFileTreeSource>;

  /**
   * Pre-instantiated library instances.
   * Used for advanced scenarios like testing or custom library construction.
   * If provided along with other sources, collections are combined.
   */
  readonly libraries?: IInstantiatedLibrarySource;
}

// ============================================================================
// ChocolateLibrary Class
// ============================================================================

/**
 * Main entry point for the chocolate library
 *
 * Provides unified access to:
 * - Ingredient management (multi-source with built-ins)
 * - Recipe management (multi-source)
 * - Recipe scaling
 * - Ganache characteristic calculations
 *
 * @public
 */
export class ChocolateLibrary {
  private readonly _ingredients: IngredientsLibrary;
  private readonly _recipes: RecipesLibrary;

  private constructor(ingredients: IngredientsLibrary, recipes: RecipesLibrary) {
    this._ingredients = ingredients;
    this._recipes = recipes;
  }

  /**
   * Creates a new ChocolateLibrary instance
   * @param params - Optional creation parameters
   * @returns Success with new instance, or Failure with error message
   * @public
   */
  public static create(params?: IChocolateLibraryParams): Result<ChocolateLibrary> {
    const builtinSpec = params?.builtin ?? true;
    const fileSources = normalizeFileSources(params?.fileSources);

    // --- INGREDIENTS ---
    // All sources (builtin, fileSources, libraries) are merged together
    const ingredientsResult = IngredientsLibrary.create({
      builtin: resolveBuiltInSpec<SourceId>(builtinSpec, 'ingredients'),
      fileSources: ChocolateLibrary._toFileSources(fileSources, 'ingredients'),
      mergeLibraries: params?.libraries?.ingredients
    });

    // --- RECIPES ---
    // All sources (builtin, fileSources, libraries) are merged together
    const recipesResult = RecipesLibrary.create({
      builtin: resolveBuiltInSpec<SourceId>(builtinSpec, 'recipes'),
      fileSources: ChocolateLibrary._toFileSources(fileSources, 'recipes'),
      mergeLibraries: params?.libraries?.recipes
    });

    // Combine results
    return ingredientsResult.onSuccess((ingredients) =>
      recipesResult.onSuccess((recipes) => Success.with(new ChocolateLibrary(ingredients, recipes)))
    );
  }

  /**
   * Converts full library file sources to sub-library-specific file sources
   */
  private static _toFileSources(
    sources: ReadonlyArray<ILibraryFileTreeSource>,
    subLibraryId: SubLibraryId
  ): ReadonlyArray<IFileTreeSource<SourceId>> {
    return sources.map((source) => ({
      directory: source.directory,
      load: resolveBuiltInSpec<SourceId>(source.load, subLibraryId),
      mutable: source.mutable
    }));
  }

  // ============================================================================
  // Read-only accessors
  // ============================================================================

  /**
   * The ingredients library
   */
  public get ingredients(): IngredientsLibrary {
    return this._ingredients;
  }

  /**
   * The recipes library
   */
  public get recipes(): RecipesLibrary {
    return this._recipes;
  }

  // ============================================================================
  // Convenience methods - Ingredient lookup
  // ============================================================================

  /**
   * Gets an ingredient by its composite ID
   * @param id - Composite ingredient ID
   * @returns Success with ingredient, or Failure if not found
   */
  public getIngredient(id: IngredientId): Result<Ingredient> {
    return this._ingredients.get(id);
  }

  /**
   * Checks if an ingredient exists
   * @param id - Composite ingredient ID
   * @returns True if ingredient exists
   */
  public hasIngredient(id: IngredientId): boolean {
    return this._ingredients.has(id);
  }

  // ============================================================================
  // Convenience methods - Recipe lookup
  // ============================================================================

  /**
   * Gets a recipe by its composite ID
   * @param id - Composite recipe ID
   * @returns Success with recipe, or Failure if not found
   */
  public getRecipe(id: RecipeId): Result<IRecipe> {
    return this._recipes.get(id);
  }

  /**
   * Checks if a recipe exists
   * @param id - Composite recipe ID
   * @returns True if recipe exists
   */
  public hasRecipe(id: RecipeId): boolean {
    return this._recipes.has(id);
  }

  // ============================================================================
  // Recipe scaling
  // ============================================================================

  /**
   * Scales a recipe to a target weight
   *
   * @param id - Recipe ID to scale
   * @param targetWeight - Target total weight in grams
   * @param options - Optional scaling options
   * @returns Success with scaled recipe version, or Failure if recipe not found or invalid
   */
  public scaleRecipe(
    id: RecipeId,
    targetWeight: Grams,
    options?: IRecipeScaleOptions
  ): Result<IScaledRecipeVersion> {
    return this.getRecipe(id).onSuccess((recipe) => scaleRecipe(recipe, targetWeight, options));
  }

  /**
   * Scales a recipe by a multiplicative factor
   *
   * @param id - Recipe ID to scale
   * @param factor - Multiplicative factor (e.g., 2.0 for double)
   * @param options - Optional scaling options
   * @returns Success with scaled recipe version, or Failure if recipe not found or invalid
   */
  public scaleRecipeByFactor(
    id: RecipeId,
    factor: number,
    options?: IRecipeScaleOptions
  ): Result<IScaledRecipeVersion> {
    return this.getRecipe(id).onSuccess((recipe) => {
      // Get the version to scale (default to golden version)
      const versionId = options?.versionId ?? recipe.goldenVersionId;
      const version = recipe.versions.find((v) => v.versionId === versionId);

      /* c8 ignore next 3 - tested in chocolateLibrary.test.ts but coverage intermittently missed */
      if (!version) {
        return Failure.with(`Version ${versionId} not found in recipe ${recipe.baseId}`);
      }

      const targetWeight = (version.baseWeight * factor) as Grams;
      return scaleRecipe(recipe, targetWeight, options);
    });
  }

  // ============================================================================
  // Ganache calculations
  // ============================================================================

  /**
   * Creates an ingredient resolver that looks up ingredients from this library
   * @returns Ingredient resolver function
   */
  public createIngredientResolver(): IngredientResolver {
    return (id: IngredientId): Result<Ingredient> => this.getIngredient(id);
  }

  /**
   * Calculates ganache characteristics for a recipe
   *
   * @param id - Recipe ID to analyze
   * @param versionId - Optional version ID (default: golden version)
   * @returns Success with ganache calculation, or Failure if recipe not found or ingredients missing
   */
  public calculateGanache(id: RecipeId, versionId?: RecipeVersionId): Result<IGanacheCalculation> {
    return this.getRecipe(id).onSuccess((recipe) =>
      calculateGanache(recipe, this.createIngredientResolver(), versionId)
    );
  }

  /**
   * Calculates ganache characteristics for a recipe object
   * Useful when working with recipes not yet added to the library
   *
   * @param recipe - Recipe to analyze
   * @param versionId - Optional version ID (default: golden version)
   * @returns Success with ganache calculation, or Failure if ingredients missing
   */
  public calculateGanacheForRecipe(
    recipe: IRecipe,
    versionId?: RecipeVersionId
  ): Result<IGanacheCalculation> {
    return calculateGanache(recipe, this.createIngredientResolver(), versionId);
  }
}
