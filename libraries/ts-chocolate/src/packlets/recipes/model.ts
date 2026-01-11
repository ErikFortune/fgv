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

import {
  BaseRecipeId,
  ICategorizedUrl,
  IIdsWithPreferred,
  IngredientId,
  IOptionsWithPreferred,
  IRefWithNotes,
  Measurement,
  MeasurementUnit,
  MoldId,
  ProcedureId,
  RatingScore,
  RecipeName,
  RecipeVersionId,
  RecipeVersionSpec,
  SpoonLevel
} from '../common';

// ============================================================================
// Ingredient Modifiers
// ============================================================================

/**
 * Modifiers that qualify how an ingredient is measured or added.
 * Groups measurement hints and qualifiers to avoid interface pollution.
 * @public
 */
export interface IIngredientModifiers {
  /**
   * For tsp/Tbsp measurements: whether the spoon is level, heaping, or scant.
   * This is a display hint only and does not affect scaling calculations.
   */
  readonly spoonLevel?: SpoonLevel;

  /**
   * Indicates this ingredient is "to taste" - the amount is a suggestion.
   * Display format: "1/4 tsp salt, to taste"
   */
  readonly toTaste?: boolean;
}

// ============================================================================
// Recipe Ingredient
// ============================================================================

/**
 * Reference to an ingredient used in a recipe.
 * Uses IIdsWithPreferred pattern - `ids` contains all valid ingredient options,
 * `preferredId` indicates the default/recommended one.
 * @public
 */
export interface IRecipeIngredient {
  /**
   * Available ingredient options with preferred selection.
   * The preferredId (or first id if not specified) is the primary ingredient.
   */
  readonly ingredient: IIdsWithPreferred<IngredientId>;

  /**
   * Amount of this ingredient in the specified unit.
   * When unit is not specified, this is in grams.
   */
  readonly amount: Measurement;

  /**
   * Measurement unit for the amount.
   * Defaults to 'g' (grams) when not specified.
   */
  readonly unit?: MeasurementUnit;

  /**
   * Optional modifiers that qualify how the ingredient is measured or added.
   * Includes spoonLevel, toTaste, and future measurement qualifiers.
   */
  readonly modifiers?: IIngredientModifiers;

  /**
   * Optional notes for this specific ingredient usage
   */
  readonly notes?: string;
}

/**
 * Categories for rating a recipe version
 * @public
 */
export type RatingCategory = 'overall' | 'taste' | 'texture' | 'shelf-life' | 'appearance' | 'workability';

/**
 * Categories for classifying recipes by type
 * @public
 */
export type RecipeCategory = 'ganache' | 'caramel' | 'gianduja';

/**
 * All possible recipe categories
 * @public
 */
export const allRecipeCategories: RecipeCategory[] = ['ganache', 'caramel', 'gianduja'];

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
  readonly scaledWeight: Measurement;

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
  readonly baseWeight: Measurement;

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

/**
 * Reference to a source recipe+version from which a recipe was derived.
 * Used to track lineage when a user edits a read-only recipe and creates
 * a new recipe in a writable collection.
 * @public
 */
export interface IRecipeDerivation {
  /**
   * Source recipe version ID (format: "sourceId.recipeId\@versionSpec")
   */
  readonly sourceVersionId: RecipeVersionId;

  /**
   * Date of derivation (ISO 8601 format)
   */
  readonly derivedDate: string;

  /**
   * Optional notes about the derivation
   */
  readonly notes?: string;
}

/**
 * Reference to a procedure that can be used with a recipe.
 * Contains the procedure ID and optional notes.
 * @public
 */
export type IRecipeProcedureRef = IRefWithNotes<ProcedureId>;

/**
 * Reference to a mold that can be used with a recipe.
 * Contains the mold ID and optional notes.
 * @public
 */
export type IRecipeMoldRef = IRefWithNotes<MoldId>;

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
   * Category for classifying the recipe type
   */
  readonly category: RecipeCategory;

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
   * Optional derivation info - tracks lineage if this recipe was forked
   * from another recipe (e.g., when editing a read-only recipe)
   */
  readonly derivedFrom?: IRecipeDerivation;

  /**
   * Optional procedures associated with this recipe.
   * Contains applicable procedures and the preferred default.
   */
  readonly recipeProcedures?: IOptionsWithPreferred<IRecipeProcedureRef, ProcedureId>;

  /**
   * Optional molds associated with this recipe.
   * Contains available molds and the preferred default.
   */
  readonly recipeMolds?: IOptionsWithPreferred<IRecipeMoldRef, MoldId>;

  /**
   * Optional categorized URLs for external resources (tutorials, videos, etc.)
   */
  readonly urls?: ReadonlyArray<ICategorizedUrl>;
}

/**
 * Scaled ingredient with original and scaled amounts.
 * Used at runtime when computing scaled recipes; not typically persisted.
 * @public
 */
export interface IScaledRecipeIngredient extends IRecipeIngredient {
  /**
   * Original amount before scaling
   */
  readonly originalAmount: Measurement;

  /**
   * Scaling factor applied
   */
  readonly scaleFactor: number;
}

/**
 * Lightweight scaling reference - the default storage format for scaled recipes.
 * Stores only the reference and scale parameters, not ingredient snapshots.
 * @public
 */
export interface IScalingRef {
  /**
   * Source recipe version ID (format: "sourceId.recipeId\@versionSpec")
   */
  readonly sourceVersionId: RecipeVersionId;

  /**
   * Scaling factor applied
   */
  readonly scaleFactor: number;

  /**
   * Target weight requested
   */
  readonly targetWeight: Measurement;

  /**
   * Date the scaling was created (ISO 8601 format)
   */
  readonly createdDate: string;
}

/**
 * Optional ingredient snapshot for archival purposes.
 * Used when the source recipe might become unavailable.
 * @public
 */
export interface IIngredientSnapshot {
  /**
   * The ingredient ID
   */
  readonly ingredientId: IngredientId;

  /**
   * Original amount before scaling
   */
  readonly originalAmount: Measurement;

  /**
   * Scaled amount after applying scale factor
   */
  readonly scaledAmount: Measurement;

  /**
   * Optional notes for this ingredient
   */
  readonly notes?: string;
}

/**
 * A scaled recipe version - reference-based by default.
 * Scaling is primarily a runtime operation; this represents what gets persisted
 * (e.g., in a journal record).
 * @public
 */
export interface IScaledRecipeVersion {
  /**
   * Reference to source recipe version with scaling parameters
   */
  readonly scalingRef: IScalingRef;

  /**
   * Optional snapshot of ingredients for archival.
   * Only present when explicitly requested (e.g., before losing access to source).
   */
  readonly snapshotIngredients?: ReadonlyArray<IIngredientSnapshot>;

  /**
   * Optional notes
   */
  readonly notes?: string;
}

/**
 * Information about the source of a scaled recipe.
 * Used at runtime for computed scaled versions.
 * @public
 */
export interface IScalingSource {
  /**
   * Source recipe version ID (format: "sourceId.recipeId\@versionSpec")
   */
  readonly sourceVersionId: RecipeVersionId;

  /**
   * Scaling factor applied
   */
  readonly scaleFactor: number;

  /**
   * Resulting target weight
   */
  readonly targetWeight: Measurement;
}

/**
 * A computed scaled recipe with full ingredient data.
 * This is the output format from the scaler - a runtime object with all calculated values.
 * Not intended for persistence - use IScaledRecipeVersion for that.
 * @public
 */
export interface IComputedScaledRecipe {
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
  readonly baseWeight: Measurement;

  /**
   * Optional yield description (from source version)
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
  return 'scalingRef' in version;
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
