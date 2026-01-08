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
  Grams,
  IngredientId,
  MoldId,
  ProcedureId,
  RatingScore,
  RecipeName,
  RecipeVersionId,
  RecipeVersionSpec
} from '../common';

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
 * Contains the procedure ID and a placeholder for future templating instructions.
 * @public
 */
export interface IRecipeProcedureRef {
  /**
   * Composite procedure ID (e.g., "common.ganache-cold-method")
   */
  readonly procedureId: ProcedureId;

  /**
   * Optional notes specific to using this procedure with the recipe
   */
  readonly notes?: string;

  // Future: templating instructions, parameter overrides, etc.
}

/**
 * Collection of procedures associated with a recipe.
 * @public
 */
export interface IRecipeProcedures {
  /**
   * Available procedures for this recipe
   */
  readonly procedures: ReadonlyArray<IRecipeProcedureRef>;

  /**
   * ID of the recommended/default procedure
   */
  readonly recommendedProcedureId?: ProcedureId;
}

/**
 * Reference to a mold that can be used with a recipe.
 * Contains the mold ID and optional notes.
 * @public
 */
export interface IRecipeMoldRef {
  /**
   * Composite mold ID (e.g., "common.chocolate-world-cw-2227")
   */
  readonly moldId: MoldId;

  /**
   * Optional notes specific to using this mold with the recipe
   */
  readonly notes?: string;
}

/**
 * Collection of molds associated with a recipe.
 * @public
 */
export interface IRecipeMolds {
  /**
   * Available molds for this recipe
   */
  readonly molds: ReadonlyArray<IRecipeMoldRef>;

  /**
   * ID of the recommended/default mold
   */
  readonly recommendedMoldId?: MoldId;
}

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
   * Contains available procedures and the recommended default.
   */
  readonly recipeProcedures?: IRecipeProcedures;

  /**
   * Optional molds associated with this recipe.
   * Contains available molds and the recommended default.
   */
  readonly recipeMolds?: IRecipeMolds;
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
  readonly originalAmount: Grams;

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
  readonly targetWeight: Grams;

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
  readonly originalAmount: Grams;

  /**
   * Scaled amount after applying scale factor
   */
  readonly scaledAmount: Grams;

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
  readonly targetWeight: Grams;
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
  readonly baseWeight: Grams;

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
