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

import { BaseRecipeId, Grams, IngredientId, RecipeName } from '../common';

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
   * Scaled weight used for this production run
   */
  readonly scaledWeight: Grams;

  /**
   * Optional notes about this usage
   */
  readonly notes?: string;
}

// ============================================================================
// Recipe Version Details
// ============================================================================

/**
 * Complete details for a single version of a recipe
 * @public
 */
export interface IRecipeDetails {
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
  readonly versionNotes?: string;

  /**
   * Usage history for this version
   */
  readonly usage: ReadonlyArray<IRecipeUsage>;
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
   * Version history (newest first)
   */
  readonly versions: ReadonlyArray<IRecipeDetails>;

  /**
   * Convenience accessor for the current (most recent) version
   */
  readonly currentVersion: IRecipeDetails;
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
// Recipe Type (discriminated union for future extension)
// ============================================================================

/**
 * Recipe type for ganache-based confections
 * @public
 */
export type Recipe = IRecipe;
