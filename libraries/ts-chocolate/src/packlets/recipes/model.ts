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

import { BaseRecipeId, Grams, IngredientId, RatingScore, RecipeName, RecipeVersionSpec } from '../common';

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
export interface IRecipeRating {
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
  readonly versionSpec: RecipeVersionSpec;

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
  readonly modifiedVersionSpec?: RecipeVersionSpec;
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
  readonly versionSpec: RecipeVersionSpec;

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
  readonly ratings?: ReadonlyArray<IRecipeRating>;
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
  readonly goldenVersionSpec: RecipeVersionSpec;

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
 * Information about the source of a scaled recipe
 * @public
 */
export interface IScalingSource {
  /**
   * ID of the recipe this was scaled from
   */
  readonly recipeId: BaseRecipeId;

  /**
   * Exact version that was scaled
   */
  readonly versionSpec: RecipeVersionSpec;

  /**
   * Scaling factor applied
   */
  readonly scaleFactor: number;

  /**
   * Resulting target weight
   */
  readonly targetWeight: Grams;
}

/**
 * A scaled recipe version - mirrors IRecipeVersion structure for interoperability
 * @public
 */
export interface IScaledRecipeVersion {
  /**
   * Information about the source recipe and version that was scaled
   */
  readonly scaledFrom: IScalingSource;

  /**
   * Date this scaled version was created (ISO 8601 format)
   */
  readonly createdDate: string;

  /**
   * Scaled ingredients with both original and scaled amounts
   */
  readonly ingredients: ReadonlyArray<IScaledRecipeIngredient>;

  /**
   * Base weight of the scaled recipe (same as targetWeight)
   */
  readonly baseWeight: Grams;

  /**
   * Optional yield description (may be scaled from original)
   */
  readonly yield?: string;

  /**
   * Optional notes from the source version
   */
  readonly notes?: string;

  /**
   * Optional ratings from the source version
   */
  readonly ratings?: ReadonlyArray<IRecipeRating>;
}

/**
 * Union type for consumers who can work with either scaled or unscaled versions
 * @public
 */
export type AnyRecipeVersion = IRecipeVersion | IScaledRecipeVersion;

/**
 * Type guard to check if a version is a scaled recipe version
 * @param version - The version to check
 * @returns True if this is a scaled recipe version
 * @public
 */
export function isScaledRecipeVersion(version: AnyRecipeVersion): version is IScaledRecipeVersion {
  return 'scaledFrom' in version;
}

/**
 * Type guard to check if a version is a regular (unscaled) recipe version
 * @param version - The version to check
 * @returns True if this is a regular recipe version
 * @public
 */
export function isRecipeVersion(version: AnyRecipeVersion): version is IRecipeVersion {
  return 'versionSpec' in version;
}
