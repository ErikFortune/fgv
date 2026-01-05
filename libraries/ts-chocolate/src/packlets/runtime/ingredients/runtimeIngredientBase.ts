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
 * RuntimeIngredientBase - abstract base class for runtime ingredients
 * @packageDocumentation
 */

import { Result } from '@fgv/ts-utils';

import {
  Allergen,
  BaseIngredientId,
  Certification,
  ID_SEPARATOR,
  IngredientCategory,
  IngredientId,
  RecipeId,
  SourceId
} from '../../common';
import { IGanacheCharacteristics, Ingredient } from '../../ingredients';
import { IRuntimeIngredient } from '../model';

// Forward declarations to avoid circular imports
import type { RuntimeChocolateIngredient } from './runtimeChocolateIngredient';
import type { RuntimeDairyIngredient } from './runtimeDairyIngredient';
import type { RuntimeSugarIngredient } from './runtimeSugarIngredient';
import type { RuntimeFatIngredient } from './runtimeFatIngredient';
import type { RuntimeAlcoholIngredient } from './runtimeAlcoholIngredient';

// ============================================================================
// Internal Context Interface
// ============================================================================

/**
 * Minimal context interface for RuntimeIngredient.
 * @internal
 */
export interface IIngredientContext {
  getRecipeIdsUsingIngredient(id: IngredientId): Result<ReadonlySet<RecipeId>>;
  getRecipeIdsWithPrimaryIngredient(id: IngredientId): Result<ReadonlySet<RecipeId>>;
  getRecipeIdsWithAlternateIngredient(id: IngredientId): Result<ReadonlySet<RecipeId>>;
}

// ============================================================================
// RuntimeIngredientBase Abstract Class
// ============================================================================

/**
 * Abstract base class for runtime ingredients.
 * Provides common properties and navigation shared by all ingredient types.
 * @public
 */
export abstract class RuntimeIngredientBase implements IRuntimeIngredient {
  protected readonly _context: IIngredientContext;
  protected readonly _id: IngredientId;
  protected readonly _ingredient: Ingredient;
  protected readonly _sourceId: SourceId;
  protected readonly _baseId: BaseIngredientId;

  /**
   * Creates a RuntimeIngredientBase.
   * @param context - The runtime context for navigation
   * @param id - The composite ingredient ID
   * @param ingredient - The raw ingredient data
   * @internal
   */
  protected constructor(context: IIngredientContext, id: IngredientId, ingredient: Ingredient) {
    this._context = context;
    this._id = id;
    this._ingredient = ingredient;

    // Parse the composite ID
    const parts = (id as string).split(ID_SEPARATOR);
    this._sourceId = parts[0] as SourceId;
    this._baseId = parts[1] as BaseIngredientId;
  }

  // ============================================================================
  // Identity
  // ============================================================================

  /**
   * The composite ingredient ID (e.g., "felchlin.maracaibo-65")
   */
  public get id(): IngredientId {
    return this._id;
  }

  /**
   * The source ID part of the composite ID
   */
  public get sourceId(): SourceId {
    return this._sourceId;
  }

  /**
   * The base ingredient ID within the source
   */
  public get baseId(): BaseIngredientId {
    return this._baseId;
  }

  // ============================================================================
  // Core Properties (passthrough to underlying Ingredient)
  // ============================================================================

  /**
   * Display name of the ingredient
   */
  public get name(): string {
    return this._ingredient.name;
  }

  /**
   * Ingredient category - must be overridden by subclasses
   */
  public abstract get category(): IngredientCategory;

  /**
   * Optional description
   */
  public get description(): string | undefined {
    return this._ingredient.description;
  }

  /**
   * Optional manufacturer
   */
  public get manufacturer(): string | undefined {
    return this._ingredient.manufacturer;
  }

  /**
   * Ganache-relevant characteristics
   */
  public get ganacheCharacteristics(): IGanacheCharacteristics {
    return this._ingredient.ganacheCharacteristics;
  }

  /**
   * Tags for searching/filtering
   */
  public get tags(): ReadonlyArray<string> {
    return this._ingredient.tags ?? [];
  }

  /**
   * Common allergens present
   */
  public get allergens(): ReadonlyArray<Allergen> {
    return this._ingredient.allergens ?? [];
  }

  /**
   * Trace allergens (possible contamination)
   */
  public get traceAllergens(): ReadonlyArray<Allergen> {
    /* c8 ignore next - empty array returned when traceAllergens undefined */
    return this._ingredient.traceAllergens ?? [];
  }

  /**
   * Certifications the ingredient has
   */
  public get certifications(): ReadonlyArray<Certification> {
    return this._ingredient.certifications ?? [];
  }

  /**
   * Whether the ingredient is vegan
   */
  public get vegan(): boolean | undefined {
    return this._ingredient.vegan;
  }

  // ============================================================================
  // Type Guards - use category discriminator for type narrowing
  // ============================================================================

  // TODO: use isChocolate etc helpers from the ingredient module

  /**
   * Returns true if this is a chocolate ingredient.
   */
  public isChocolate(): this is RuntimeChocolateIngredient {
    return this.category === 'chocolate';
  }

  /**
   * Returns true if this is a dairy ingredient.
   */
  public isDairy(): this is RuntimeDairyIngredient {
    return this.category === 'dairy';
  }

  /**
   * Returns true if this is a sugar ingredient.
   */
  public isSugar(): this is RuntimeSugarIngredient {
    return this.category === 'sugar';
  }

  /**
   * Returns true if this is a fat ingredient.
   */
  public isFat(): this is RuntimeFatIngredient {
    return this.category === 'fat';
  }

  /**
   * Returns true if this is an alcohol ingredient.
   */
  public isAlcohol(): this is RuntimeAlcoholIngredient {
    return this.category === 'alcohol';
  }

  // ============================================================================
  // Navigation (via reverse index)
  // ============================================================================

  /**
   * Gets the IDs of all recipes that use this ingredient (primary or alternate).
   */
  public get usedByRecipeIds(): ReadonlySet<RecipeId> {
    // orThrow is safe here - this ingredient was created from a valid ID
    return this._context.getRecipeIdsUsingIngredient(this._id).orThrow();
  }

  /**
   * Gets the IDs of recipes where this ingredient is the primary choice.
   */
  public get primaryInRecipeIds(): ReadonlySet<RecipeId> {
    // orThrow is safe here - this ingredient was created from a valid ID
    return this._context.getRecipeIdsWithPrimaryIngredient(this._id).orThrow();
  }

  /**
   * Gets the IDs of recipes where this ingredient is listed as an alternate.
   */
  public get alternateInRecipeIds(): ReadonlySet<RecipeId> {
    // orThrow is safe here - this ingredient was created from a valid ID
    return this._context.getRecipeIdsWithAlternateIngredient(this._id).orThrow();
  }

  // ============================================================================
  // Raw Access - must be overridden by subclasses to return typed data
  // ============================================================================

  /**
   * Gets the underlying raw ingredient data (read-only)
   */
  public abstract get raw(): Ingredient;
}
