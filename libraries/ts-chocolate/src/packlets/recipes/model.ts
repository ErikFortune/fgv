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
 * Recipe model types and interfaces
 * @packageDocumentation
 */

import { Result, fail, succeed } from '@fgv/ts-utils';

import { BaseRecipeId, Grams, IngredientId, RatingScore, RecipeName, RecipeVersionId } from '../common';

// ============================================================================
// Recipe Ingredient Reference
// ============================================================================

/**
 * Reference to an ingredient used in a recipe
 * Uses composite IngredientId to support cross-source references
 * @public
 */
export interface IRecipeIngredient {
  /**
   * Composite ingredient ID (e.g., "felchlin.maracaibo-65")
   */
  readonly ingredientId: IngredientId;

  /**
   * Optional alternate ingredient IDs that can be used in place of the primary ingredient
   */
  readonly alternateIngredientIds?: IngredientId[];

  /**
   * Amount of this ingredient in grams
   */
  readonly amount: Grams;

  /**
   * Optional notes for this specific ingredient usage
   */
  readonly notes?: string;
}

// ============================================================================
// Version Rating
// ============================================================================

/**
 * Categories for rating a recipe version
 * @public
 */
export type RatingCategory = 'overall' | 'taste' | 'texture' | 'shelf-life' | 'appearance' | 'workability';

/**
 * All possible rating categories
 * @public
 */
export const allRatingCategories: RatingCategory[] = [
  'overall',
  'taste',
  'texture',
  'shelf-life',
  'appearance',
  'workability'
];

/**
 * Rating for a specific category of a recipe version
 * @public
 */
export interface IVersionRating {
  /**
   * The category being rated
   */
  readonly category: RatingCategory;

  /**
   * Score from 1-5
   */
  readonly score: RatingScore;

  /**
   * Optional notes about the rating
   */
  readonly notes?: string;
}

// ============================================================================
// Recipe Usage Tracking
// ============================================================================

/**
 * Record of a recipe being used (for production tracking)
 * @public
 */
export interface IRecipeUsage {
  /**
   * Date of use in ISO 8601 format
   */
  readonly date: string;

  /**
   * Which version was used
   */
  readonly versionId: RecipeVersionId;

  /**
   * Scaled weight used for this production run
   */
  readonly scaledWeight: Grams;

  /**
   * Optional scale factor for reference
   */
  readonly scaleFactor?: number;

  /**
   * Optional notes about this usage
   */
  readonly notes?: string;

  /**
   * If modifications were made during this usage that created a new version,
   * this is the ID of that new version
   */
  readonly modifiedVersionId?: RecipeVersionId;
}

// ============================================================================
// Recipe Version
// ============================================================================

/**
 * Complete details for a single version of a recipe
 * @public
 */
export interface IRecipeVersion {
  /**
   * Unique identifier for this version
   */
  readonly versionId: RecipeVersionId;

  /**
   * Date this version was created (ISO 8601 format)
   */
  readonly createdDate: string;

  /**
   * Ingredients used in this version of the recipe
   */
  readonly ingredients: ReadonlyArray<IRecipeIngredient>;

  /**
   * Base weight of the recipe (sum of all ingredient amounts)
   */
  readonly baseWeight: Grams;

  /**
   * Optional yield description (e.g., "50 bonbons")
   */
  readonly yield?: string;

  /**
   * Optional notes about this version
   */
  readonly notes?: string;

  /**
   * Optional ratings for this version
   */
  readonly ratings?: ReadonlyArray<IVersionRating>;
}

// ============================================================================
// Recipe Interface
// ============================================================================

/**
 * Complete recipe with version history
 * @public
 */
export interface IRecipe {
  /**
   * Base recipe identifier (unique within source)
   */
  readonly baseId: BaseRecipeId;

  /**
   * Human-readable recipe name
   */
  readonly name: RecipeName;

  /**
   * Optional description of the recipe
   */
  readonly description?: string;

  /**
   * Optional tags for categorization and search
   */
  readonly tags?: ReadonlyArray<string>;

  /**
   * Version history
   */
  readonly versions: ReadonlyArray<IRecipeVersion>;

  /**
   * The ID of the golden (approved default) version
   */
  readonly goldenVersionId: RecipeVersionId;

  /**
   * Usage history for all versions of this recipe
   */
  readonly usage: ReadonlyArray<IRecipeUsage>;
}

// ============================================================================
// Scaled Recipe Output
// ============================================================================

/**
 * Scaled ingredient with original and scaled amounts
 * @public
 */
export interface IScaledRecipeIngredient extends IRecipeIngredient {
  /**
   * Original amount before scaling
   */
  readonly originalAmount: Grams;

  /**
   * Scaling factor applied
   */
  readonly scaleFactor: number;
}

/**
 * Result of scaling a recipe to a target weight
 * @public
 */
export interface IScaledRecipe {
  /**
   * Original recipe reference
   */
  readonly recipe: IRecipe;

  /**
   * Target total weight
   */
  readonly targetWeight: Grams;

  /**
   * Scaling factor applied
   */
  readonly scaleFactor: number;

  /**
   * Scaled ingredients
   */
  readonly ingredients: ReadonlyArray<IScaledRecipeIngredient>;
}

// ============================================================================
// Recipe Class
// ============================================================================

/**
 * Recipe class with helper methods for accessing versions
 * @public
 */
export class Recipe implements IRecipe {
  /**
   * Base recipe identifier (unique within source)
   */
  public readonly baseId: BaseRecipeId;

  /**
   * Human-readable recipe name
   */
  public readonly name: RecipeName;

  /**
   * Optional description of the recipe
   */
  public readonly description?: string;

  /**
   * Optional tags for categorization and search
   */
  public readonly tags?: ReadonlyArray<string>;

  /**
   * Version history
   */
  public readonly versions: ReadonlyArray<IRecipeVersion>;

  /**
   * The ID of the golden (approved default) version
   */
  public readonly goldenVersionId: RecipeVersionId;

  /**
   * Usage history for all versions of this recipe
   */
  public readonly usage: ReadonlyArray<IRecipeUsage>;

  private constructor(data: IRecipe) {
    this.baseId = data.baseId;
    this.name = data.name;
    this.description = data.description;
    this.tags = data.tags;
    this.versions = data.versions;
    this.goldenVersionId = data.goldenVersionId;
    this.usage = data.usage;
  }

  /**
   * Returns the golden (approved default) version
   */
  public get goldenVersion(): IRecipeVersion {
    const version = this.versions.find((v) => v.versionId === this.goldenVersionId);
    /* c8 ignore next 3 - defensive coding: validated in create() */
    if (!version) {
      throw new Error(`Golden version ${this.goldenVersionId} not found in recipe ${this.baseId}`);
    }
    return version;
  }

  /**
   * Find a version by its ID
   * @param versionId - The version ID to find
   * @returns Result with the version or error
   */
  public getVersion(versionId: RecipeVersionId): Result<IRecipeVersion> {
    const version = this.versions.find((v) => v.versionId === versionId);
    if (!version) {
      return fail(`Version ${versionId} not found in recipe ${this.baseId}`);
    }
    return succeed(version);
  }

  /**
   * Creates a new Recipe instance
   * @param data - The recipe data
   * @returns Result with the Recipe or error if validation fails
   */
  public static create(data: IRecipe): Result<Recipe> {
    // Validate that goldenVersionId exists in versions
    const goldenExists = data.versions.some((v) => v.versionId === data.goldenVersionId);
    /* c8 ignore next 3 - tested in converters.test.ts */
    if (!goldenExists) {
      return fail(`Golden version ${data.goldenVersionId} not found in versions for recipe ${data.baseId}`);
    }
    return succeed(new Recipe(data));
  }
}
