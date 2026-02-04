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
 * IngredientBase - abstract base class for runtime ingredients
 * @packageDocumentation
 */

import {
  Allergen,
  BaseIngredientId,
  Certification,
  Converters,
  IngredientCategory,
  IngredientId,
  CollectionId
} from '../../common';
import { Ingredients, IngredientEntity } from '../../entities';
import { IIngredientContext, IIngredient, IFillingRecipe } from '../model';

// Forward declarations to avoid circular imports
import type { ChocolateIngredient } from './chocolateIngredient';
import type { DairyIngredient } from './dairyIngredient';
import type { SugarIngredient } from './sugarIngredient';
import type { FatIngredient } from './fatIngredient';
import type { AlcoholIngredient } from './alcoholIngredient';

// ============================================================================
// IngredientBase Abstract Class
// ============================================================================

/**
 * Abstract base class for runtime ingredients.
 * Provides common properties and navigation shared by all ingredient types.
 * @public
 */
export abstract class IngredientBase implements IIngredient {
  protected readonly _context: IIngredientContext;
  protected readonly _id: IngredientId;
  protected readonly _ingredient: IngredientEntity;
  protected readonly _sourceId: CollectionId;
  protected readonly _baseId: BaseIngredientId;

  /**
   * Creates a IngredientBase.
   * @param context - The runtime context for navigation
   * @param id - The composite ingredient ID
   * @param ingredient - The ingredient data entity
   * @internal
   */
  protected constructor(context: IIngredientContext, id: IngredientId, ingredient: IngredientEntity) {
    this._context = context;
    this._id = id;
    this._ingredient = ingredient;

    const parsed = Converters.parsedIngredientId.convert(id).orThrow();
    this._sourceId = parsed.collectionId;
    this._baseId = parsed.itemId;
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
  public get collectionId(): CollectionId {
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
  public get ganacheCharacteristics(): Ingredients.IGanacheCharacteristics {
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
  // Type Guards - delegate to ingredient module helpers for consistency
  // ============================================================================

  /**
   * Returns true if this is a chocolate ingredient.
   */
  public isChocolate(): this is ChocolateIngredient {
    return Ingredients.isChocolateIngredientEntity(this._ingredient);
  }

  /**
   * Returns true if this is a dairy ingredient.
   */
  public isDairy(): this is DairyIngredient {
    return Ingredients.isDairyIngredientEntity(this._ingredient);
  }

  /**
   * Returns true if this is a sugar ingredient.
   */
  public isSugar(): this is SugarIngredient {
    return Ingredients.isSugarIngredientEntity(this._ingredient);
  }

  /**
   * Returns true if this is a fat ingredient.
   */
  public isFat(): this is FatIngredient {
    return Ingredients.isFatIngredientEntity(this._ingredient);
  }

  /**
   * Returns true if this is an alcohol ingredient.
   */
  public isAlcohol(): this is AlcoholIngredient {
    return Ingredients.isAlcoholIngredientEntity(this._ingredient);
  }

  // ============================================================================
  // Navigation (via reverse index)
  // ============================================================================

  /**
   * Gets all filling recipes that use this ingredient (primary or alternate).
   */
  public usedByFillings(): IFillingRecipe[] {
    return this._context.getFillingsUsingIngredient(this._id);
  }

  /**
   * Gets filling recipes where this ingredient is the primary choice.
   */
  public primaryInFillings(): IFillingRecipe[] {
    return this._context.getFillingsWithPrimaryIngredient(this._id);
  }

  /**
   * Gets filling recipes where this ingredient is listed as an alternate.
   */
  public alternateInFillings(): IFillingRecipe[] {
    return this._context.getFillingsWithAlternateIngredient(this._id);
  }

  /**
   * Gets the underlying ingredient data entity (read-only)
   */
  public abstract get entity(): IngredientEntity;
}
