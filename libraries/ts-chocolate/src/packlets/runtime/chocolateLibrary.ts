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

import { Grams, IngredientId, RecipeId, RecipeVersionSpec, SourceId } from '../common';
import { Ingredient, IngredientsLibrary } from '../ingredients';
import { IComputedScaledRecipe, IRecipe, RecipesLibrary, scaleRecipe, IRecipeScaleOptions } from '../recipes';
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
 * Pre-built library instances to include in a {@link Runtime.ChocolateLibrary | ChocolateLibrary}.
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
 * Parameters for creating a {@link Runtime.ChocolateLibrary | ChocolateLibrary}.
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
export interface IChocolateLibraryCreateParams {
  /**
   * {@link LibraryData.FullLibraryLoadSpec | Specifies built-in data loading} for each sub-library.
   *
   * - `true` (default): Load all built-ins for all sub-libraries
   * - `false`: Load no built-ins
   * - Per-sub-library control with `ingredients`, `recipes`, or `default` keys
   */
  readonly builtin?: FullLibraryLoadSpec;

  /**
   * {@link LibraryData.ILibraryFileTreeSource | File tree sources} to load data from.
   * Each source navigates to standard paths (data/ingredients, data/recipes)
   * and loads collections according to the source's load spec.
   */
  readonly fileSources?: ILibraryFileTreeSource | ReadonlyArray<ILibraryFileTreeSource>;

  /**
   * Pre-instantiated {@link Runtime.IInstantiatedLibrarySource | library sources}.
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
   * Creates a new {@link Runtime.ChocolateLibrary | ChocolateLibrary} instance.
   * @param params - Optional {@link Runtime.IChocolateLibraryCreateParams | creation parameters}
   * @returns `Success` with new instance, or `Failure` with error message
   * @public
   */
  public static create(params?: IChocolateLibraryCreateParams): Result<ChocolateLibrary> {
    const builtinSpec = params?.builtin ?? true;
    const fileSources = normalizeFileSources(params?.fileSources);

    const ingredientsResult = IngredientsLibrary.create({
      builtin: resolveBuiltInSpec<SourceId>(builtinSpec, 'ingredients'),
      fileSources: ChocolateLibrary._toFileSources(fileSources, 'ingredients'),
      mergeLibraries: params?.libraries?.ingredients
    });

    const recipesResult = RecipesLibrary.create({
      builtin: resolveBuiltInSpec<SourceId>(builtinSpec, 'recipes'),
      fileSources: ChocolateLibrary._toFileSources(fileSources, 'recipes'),
      mergeLibraries: params?.libraries?.recipes
    });

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

  /**
   * The {@link Ingredients.IngredientsLibrary | ingredients library}.
   */
  public get ingredients(): IngredientsLibrary {
    return this._ingredients;
  }

  /**
   * The {@link Recipes.RecipesLibrary | recipes library}.
   */
  public get recipes(): RecipesLibrary {
    return this._recipes;
  }

  /**
   * Gets an {@link Ingredients.Ingredient | ingredient} by its {@link IngredientId | composite ID}
   * @param id - The {@link IngredientId | id} of the ingredient to retrieve.
   * @returns `Success` with ingredient, or `Failure` if not found
   */
  public getIngredient(id: IngredientId): Result<Ingredient> {
    return this._ingredients.get(id);
  }

  /**
   * Checks if an ingredient exists
   * @param id - The {@link IngredientId | id} of the ingredient to check.
   * @returns `true` if the ingredient exists
   */
  public hasIngredient(id: IngredientId): boolean {
    return this._ingredients.has(id);
  }

  /**
   * Gets a {@link Recipes.Recipe | recipe} by its {@link RecipeId | composite ID}
   * @param id - The {@link RecipeId | id} of the recipe to retrieve.
   * @returns `Success` with recipe, or `Failure` if not found
   */
  public getRecipe(id: RecipeId): Result<IRecipe> {
    return this._recipes.get(id);
  }

  /**
   * Checks if a recipe exists
   * @param id - The {@link RecipeId | id} of the recipe to check.
   * @returns `true` if the recipe exists
   */
  public hasRecipe(id: RecipeId): boolean {
    return this._recipes.has(id);
  }

  /**
   * Scales a recipe to a target weight
   *
   * @param id - The {@link RecipeId | id} of the recipe to scale
   * @param targetWeight - Target total weight in grams
   * @param options - Optional {@link Recipes.IRecipeScaleOptions | scaling options}.
   * @returns `Success` with computed scaled recipe, or `Failure` if recipe not found or invalid
   */
  public scaleRecipe(
    id: RecipeId,
    targetWeight: Grams,
    options?: IRecipeScaleOptions
  ): Result<IComputedScaledRecipe> {
    return this.getRecipe(id).onSuccess((recipe) => scaleRecipe(recipe, id, targetWeight, options));
  }

  /**
   * Scales a recipe by a multiplicative factor
   *
   * @param id - The {@link RecipeId | id} of the recipe to scale
   * @param factor - Multiplicative factor (e.g., 2.0 for double)
   * @param options - Optional {@link Recipes.IRecipeScaleOptions | scaling options}.
   * @returns `Success` with computed scaled recipe, or `Failure` if recipe not found or invalid
   */
  public scaleRecipeByFactor(
    id: RecipeId,
    factor: number,
    options?: IRecipeScaleOptions
  ): Result<IComputedScaledRecipe> {
    return this.getRecipe(id).onSuccess((recipe) => {
      // Get the version to scale (default to golden version)
      const versionSpec = options?.versionSpec ?? recipe.goldenVersionSpec;
      const version = recipe.versions.find((v) => v.versionSpec === versionSpec);

      /* c8 ignore next 3 - tested in chocolateLibrary.test.ts but coverage intermittently missed */
      if (!version) {
        return Failure.with(`Version ${versionSpec} not found in recipe ${recipe.baseId}`);
      }

      const targetWeight = (version.baseWeight * factor) as Grams;
      return scaleRecipe(recipe, id, targetWeight, options);
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
   * @param versionSpec - Optional version ID (default: golden version)
   * @returns Success with ganache calculation, or Failure if recipe not found or ingredients missing
   */
  public calculateGanache(id: RecipeId, versionSpec?: RecipeVersionSpec): Result<IGanacheCalculation> {
    return this.getRecipe(id).onSuccess((recipe) =>
      calculateGanache(recipe, this.createIngredientResolver(), versionSpec)
    );
  }

  /**
   * Calculates ganache characteristics for a recipe object
   * Useful when working with recipes not yet added to the library
   *
   * @param recipe - Recipe to analyze
   * @param versionSpec - Optional version ID (default: golden version)
   * @returns Success with ganache calculation, or Failure if ingredients missing
   */
  public calculateGanacheForRecipe(
    recipe: IRecipe,
    versionSpec?: RecipeVersionSpec
  ): Result<IGanacheCalculation> {
    return calculateGanache(recipe, this.createIngredientResolver(), versionSpec);
  }
}
