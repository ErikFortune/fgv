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

import { Result, fail, succeed } from '@fgv/ts-utils';

import { Grams, IngredientId, RecipeId } from '../common';
import { Ingredient, IngredientsLibrary, builtInIngredientCollections } from '../ingredients';
import { IRecipe, IScaledRecipe, RecipesLibrary, scaleRecipe, IRecipeScaleOptions } from '../recipes';
import { IGanacheCalculation, IngredientResolver, calculateGanache } from '../calculations';

// ============================================================================
// Parameters Interface
// ============================================================================

/**
 * Parameters for creating a ChocolateLibrary
 * @public
 */
export interface IChocolateLibraryParams {
  /**
   * Pre-built ingredients library (optional, will create with built-ins if not provided)
   */
  readonly ingredients?: IngredientsLibrary;

  /**
   * Pre-built recipes library (optional, will create empty if not provided)
   */
  readonly recipes?: RecipesLibrary;

  /**
   * Whether to include built-in ingredients (default: true)
   * Ignored if ingredients library is provided
   */
  readonly includeBuiltInIngredients?: boolean;
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
    // Get or create ingredients library
    const ingredientsResult: Result<IngredientsLibrary> =
      params?.ingredients !== undefined
        ? succeed(params.ingredients)
        : params?.includeBuiltInIngredients === false
        ? IngredientsLibrary.create()
        : IngredientsLibrary.create({
            collections: builtInIngredientCollections
          });

    // Get or create recipes library
    const recipesResult: Result<RecipesLibrary> =
      params?.recipes !== undefined ? succeed(params.recipes) : RecipesLibrary.create();

    return ingredientsResult.onSuccess((ingredients) =>
      recipesResult.onSuccess((recipes) => succeed(new ChocolateLibrary(ingredients, recipes)))
    );
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
   * @returns Success with scaled recipe, or Failure if recipe not found or invalid
   */
  public scaleRecipe(
    id: RecipeId,
    targetWeight: Grams,
    options?: IRecipeScaleOptions
  ): Result<IScaledRecipe> {
    return this.getRecipe(id).onSuccess((recipe) => scaleRecipe(recipe, targetWeight, options));
  }

  /**
   * Scales a recipe by a multiplicative factor
   *
   * @param id - Recipe ID to scale
   * @param factor - Multiplicative factor (e.g., 2.0 for double)
   * @param options - Optional scaling options
   * @returns Success with scaled recipe, or Failure if recipe not found or invalid
   */
  public scaleRecipeByFactor(
    id: RecipeId,
    factor: number,
    options?: IRecipeScaleOptions
  ): Result<IScaledRecipe> {
    return this.getRecipe(id).onSuccess((recipe) => {
      const version =
        options?.versionIndex !== undefined ? recipe.versions[options.versionIndex] : recipe.currentVersion;

      /* c8 ignore next 3 - tested in chocolateLibrary.test.ts but coverage intermittently missed */
      if (!version) {
        return fail(`Invalid version index: ${options?.versionIndex}`);
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
   * @param versionIndex - Optional version index (default: current version)
   * @returns Success with ganache calculation, or Failure if recipe not found or ingredients missing
   */
  public calculateGanache(id: RecipeId, versionIndex?: number): Result<IGanacheCalculation> {
    return this.getRecipe(id).onSuccess((recipe) =>
      calculateGanache(recipe, this.createIngredientResolver(), versionIndex)
    );
  }

  /**
   * Calculates ganache characteristics for a recipe object
   * Useful when working with recipes not yet added to the library
   *
   * @param recipe - Recipe to analyze
   * @param versionIndex - Optional version index (default: current version)
   * @returns Success with ganache calculation, or Failure if ingredients missing
   */
  public calculateGanacheForRecipe(recipe: IRecipe, versionIndex?: number): Result<IGanacheCalculation> {
    return calculateGanache(recipe, this.createIngredientResolver(), versionIndex);
  }
}
