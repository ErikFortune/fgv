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
 * Decoration entity model types and interfaces
 * @packageDocumentation
 */

import {
  BaseDecorationId,
  DecorationId,
  IngredientId,
  Measurement,
  Model as CommonModel,
  ProcedureId,
  RatingScore
} from '../../common';
import { IProcedureRefEntity, RatingCategory } from '../fillings';

// ============================================================================
// Rating Categories
// ============================================================================

/**
 * Valid rating categories for decorations
 * @public
 */
export const allDecorationRatingCategories: RatingCategory[] = [
  'difficulty' as RatingCategory,
  'durability' as RatingCategory,
  'appearance' as RatingCategory,
  'workability' as RatingCategory
];

// ============================================================================
// Decoration Ingredient
// ============================================================================

/**
 * An ingredient used in a decoration, with alternates and an amount.
 * @public
 */
export interface IDecorationIngredientEntity {
  /**
   * Ingredient options with preferred selection.
   * Uses IIdsWithPreferred to allow alternates.
   */
  readonly ingredient: CommonModel.IIdsWithPreferred<IngredientId>;

  /**
   * Amount of this ingredient in grams.
   */
  readonly amount: Measurement;

  /**
   * Optional categorized notes about this ingredient usage.
   */
  readonly notes?: ReadonlyArray<CommonModel.ICategorizedNote>;
}

// ============================================================================
// Decoration Rating
// ============================================================================

/**
 * Rating for a specific category of a decoration.
 * @public
 */
export interface IDecorationRating {
  /**
   * The category being rated (e.g., difficulty, durability, appearance)
   */
  readonly category: RatingCategory;

  /**
   * Score from 1-5
   */
  readonly score: RatingScore;

  /**
   * Optional categorized notes about the rating
   */
  readonly notes?: ReadonlyArray<CommonModel.ICategorizedNote>;
}

// ============================================================================
// Decoration Entity
// ============================================================================

/**
 * A decoration entity — a first-class library entity describing a confection decoration.
 * Includes ingredients (e.g., colored cocoa butter, gold leaf), optional procedures,
 * ratings, notes, and tags.
 * @public
 */
export interface IDecorationEntity {
  /**
   * Base identifier within collection (no dots)
   */
  readonly baseId: BaseDecorationId;

  /**
   * Human-readable name of the decoration
   */
  readonly name: string;

  /**
   * Optional description of the decoration
   */
  readonly description?: string;

  /**
   * Ingredients used in this decoration
   */
  readonly ingredients: ReadonlyArray<IDecorationIngredientEntity>;

  /**
   * Optional procedures with preferred selection
   */
  readonly procedures?: CommonModel.IOptionsWithPreferred<IProcedureRefEntity, ProcedureId>;

  /**
   * Optional ratings for this decoration
   */
  readonly ratings?: ReadonlyArray<IDecorationRating>;

  /**
   * Optional tags for categorization and search
   */
  readonly tags?: ReadonlyArray<string>;

  /**
   * Optional categorized notes about this decoration
   */
  readonly notes?: ReadonlyArray<CommonModel.ICategorizedNote>;
}

// ============================================================================
// Factory
// ============================================================================

/**
 * Creates a minimal blank decoration entity.
 * @param baseId - The base ID for the new decoration
 * @param name - The display name
 * @returns A minimal IDecorationEntity with required fields only
 * @public
 */
export function createBlankDecorationEntity(baseId: BaseDecorationId, name: string): IDecorationEntity {
  return {
    baseId,
    name,
    ingredients: []
  };
}

// ============================================================================
// Decoration Reference (used in confection variations)
// ============================================================================

/**
 * Reference to a decoration entity from a confection variation.
 * @public
 */
export interface IDecorationRefEntity {
  /**
   * Full decoration ID (collectionId.baseDecorationId)
   */
  readonly id: DecorationId;

  /**
   * Optional notes specific to this usage of the decoration
   */
  readonly notes?: ReadonlyArray<CommonModel.ICategorizedNote>;
}
