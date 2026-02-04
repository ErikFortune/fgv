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
 * Filling recipe model types and interfaces
 * @packageDocumentation
 */

import {
  BaseFillingId,
  FillingName,
  FillingVersionId,
  FillingVersionSpec,
  IngredientId,
  Measurement,
  MeasurementUnit,
  Model,
  ProcedureId,
  RatingScore,
  SpoonLevel
} from '../../common';

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
// Filling Recipe Ingredient
// ============================================================================

/**
 * Reference to an ingredient used in a filling recipe.
 * Uses IIdsWithPreferred pattern - `ids` contains all valid ingredient options,
 * `preferredId` indicates the default/recommended one.
 * @public
 */
export interface IFillingIngredientEntity {
  /**
   * Available ingredient options with preferred selection.
   * The preferredId (or first id if not specified) is the primary ingredient.
   */
  readonly ingredient: Model.IIdsWithPreferred<IngredientId>;

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
   * Optional categorized notes for this specific ingredient usage
   */
  readonly notes?: ReadonlyArray<Model.ICategorizedNote>;
}

/**
 * Categories for rating a filling recipe version
 * @public
 */
export type RatingCategory = 'overall' | 'taste' | 'texture' | 'shelf-life' | 'appearance' | 'workability';

/**
 * Categories for classifying filling recipes by type
 * @public
 */
export type FillingCategory = 'ganache' | 'caramel' | 'gianduja';

/**
 * All possible filling categories
 * @public
 */
export const allFillingCategories: FillingCategory[] = ['ganache', 'caramel', 'gianduja'];

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
 * Rating for a specific category of a filling recipe version
 * @public
 */
export interface IFillingRating {
  /**
   * The category being rated
   */
  readonly category: RatingCategory;

  /**
   * Score from 1-5
   */
  readonly score: RatingScore;

  /**
   * Optional categorized notes about the rating
   */
  readonly notes?: ReadonlyArray<Model.ICategorizedNote>;
}

/**
 * Record of a filling recipe being used (for production tracking)
 * @public
 */
export interface IFillingUsageEntity {
  /**
   * Date of use in ISO 8601 format
   */
  readonly date: string;

  /**
   * Which version was used
   */
  readonly versionSpec: FillingVersionSpec;

  /**
   * Scaled weight used for this production run
   */
  readonly scaledWeight: Measurement;

  /**
   * Optional scale factor for reference
   */
  readonly scaleFactor?: number;

  /**
   * Optional categorized notes about this usage
   */
  readonly notes?: ReadonlyArray<Model.ICategorizedNote>;

  /**
   * If modifications were made during this usage that created a new version,
   * this is the ID of that new version
   */
  readonly modifiedVersionSpec?: FillingVersionSpec;
}

/**
 * Complete details for a single version of a filling recipe
 * @public
 */
export interface IFillingRecipeVersionEntity {
  /**
   * Unique identifier for this version
   */
  readonly versionSpec: FillingVersionSpec;

  /**
   * Date this version was created (ISO 8601 format)
   */
  readonly createdDate: string;

  /**
   * Ingredients used in this version of the filling recipe
   */
  readonly ingredients: ReadonlyArray<IFillingIngredientEntity>;

  /**
   * Base weight of the filling recipe (sum of all ingredient amounts)
   */
  readonly baseWeight: Measurement;

  /**
   * Optional yield description (e.g., "50 bonbons")
   */
  readonly yield?: string;

  /**
   * Optional categorized notes about this version
   */
  readonly notes?: ReadonlyArray<Model.ICategorizedNote>;

  /**
   * Optional ratings for this version
   */
  readonly ratings?: ReadonlyArray<IFillingRating>;

  /**
   * Optional procedures associated with this version.
   * Contains applicable procedures and the preferred default.
   */
  readonly procedures?: Model.IOptionsWithPreferred<IProcedureRefEntity, ProcedureId>;
}
/**
 * Reference to a source filling recipe+version from which a filling recipe was derived.
 * Used to track lineage when a user edits a read-only filling recipe and creates
 * a new filling recipe in a writable collection.
 * @public
 */
export interface IFillingDerivationEntity {
  /**
   * Source filling recipe version ID (format: "sourceId.fillingId\@versionSpec")
   */
  readonly sourceVersionId: FillingVersionId;

  /**
   * Date of derivation (ISO 8601 format)
   */
  readonly derivedDate: string;

  /**
   * Optional categorized notes about the derivation
   */
  readonly notes?: ReadonlyArray<Model.ICategorizedNote>;
}

/**
 * Reference to a procedure that can be used with a filling recipe.
 * Contains the procedure ID and optional notes.
 * @public
 */
export type IProcedureRefEntity = Model.IRefWithNotes<ProcedureId>;

/**
 * Complete filling recipe with version history
 * @public
 */
export interface IFillingRecipeEntity {
  /**
   * Base filling recipe identifier (unique within source)
   */
  readonly baseId: BaseFillingId;

  /**
   * Human-readable filling recipe name
   */
  readonly name: FillingName;

  /**
   * Category for classifying the filling recipe type
   */
  readonly category: FillingCategory;

  /**
   * Optional description of the filling recipe
   */
  readonly description?: string;

  /**
   * Optional tags for categorization and search
   */
  readonly tags?: ReadonlyArray<string>;

  /**
   * Version history
   */
  readonly versions: ReadonlyArray<IFillingRecipeVersionEntity>;

  /**
   * The ID of the golden (approved default) version
   */
  readonly goldenVersionSpec: FillingVersionSpec;

  /**
   * Optional derivation info - tracks lineage if this filling recipe was forked
   * from another filling recipe (e.g., when editing a read-only filling recipe)
   */
  readonly derivedFrom?: IFillingDerivationEntity;

  /**
   * Optional categorized URLs for external resources (tutorials, videos, etc.)
   */
  readonly urls?: ReadonlyArray<Model.ICategorizedUrl>;
}

/**
 * Lightweight scaling reference - the default storage format for scaled filling recipes.
 * Stores only the reference and scale parameters, not ingredient snapshots.
 * @public
 */
export interface IScalingRefEntity {
  /**
   * Source filling recipe version ID (format: "sourceId.fillingId\@versionSpec")
   */
  readonly sourceVersionId: FillingVersionId;

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
 * Used when the source filling recipe might become unavailable.
 * @public
 */
export interface IIngredientSnapshotEntity {
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
   * Optional categorized notes for this ingredient
   */
  readonly notes?: ReadonlyArray<Model.ICategorizedNote>;
}

// ============================================================================
// Produced Filling Types (for Journal/Runtime)
// ============================================================================

/**
 * Resolved filling ingredient with concrete choice.
 * Unlike IFillingIngredient which uses IIdsWithPreferred, this stores
 * the single actual ingredient that was used in production.
 * @public
 */
export interface IProducedFillingIngredientEntity {
  /** The single selected ingredient ID */
  readonly ingredientId: IngredientId;
  /** Actual amount used */
  readonly amount: Measurement;
  /** Measurement unit (default: 'g') */
  readonly unit?: MeasurementUnit;
  /** Measurement modifiers (spoonLevel, toTaste) - production metadata */
  readonly modifiers?: IIngredientModifiers;
  /** Optional categorized notes about this ingredient usage */
  readonly notes?: ReadonlyArray<Model.ICategorizedNote>;
}

/**
 * Produced filling with concrete choices.
 * Captures what was actually made during a filling production session.
 * @public
 */
export interface IProducedFillingEntity {
  /** Filling version ID that was produced */
  readonly versionId: FillingVersionId;
  /** Scale factor applied */
  readonly scaleFactor: number;
  /** Target weight for this production */
  readonly targetWeight: Measurement;
  /** Resolved ingredients with concrete selections */
  readonly ingredients: ReadonlyArray<IProducedFillingIngredientEntity>;
  /** Resolved procedure ID if one was used */
  readonly procedureId?: ProcedureId;
  /** Optional categorized notes about production */
  readonly notes?: ReadonlyArray<Model.ICategorizedNote>;
}
