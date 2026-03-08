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
 * ConfectionRecipeBase - abstract base class for runtime confections
 * @packageDocumentation
 */

import { Failure, Result, Success, mapResults } from '@fgv/ts-utils';

import {
  BaseConfectionId,
  ConfectionId,
  ConfectionName,
  ConfectionType,
  ConfectionRecipeVariationSpec,
  Converters,
  DecorationId,
  Model as CommonModel,
  ProcedureId,
  CollectionId
} from '../../common';
import { Confections } from '../../entities';
import {
  AnyConfectionRecipeVariation,
  IConfectionContext,
  IResolvedConfectionDecorationRef,
  IResolvedConfectionProcedure,
  IResolvedFillingSlot,
  IConfectionBase
} from '../model';

// Forward declarations to avoid circular imports
import type { MoldedBonBonRecipe } from './moldedBonBon';
import type { BarTruffleRecipe } from './barTruffle';
import type { RolledTruffleRecipe } from './rolledTruffle';

// ============================================================================
// ConfectionRecipeBase Abstract Class
// ============================================================================

/**
 * Abstract base class for runtime confections.
 * Provides common properties and variation navigation shared by all confection types.
 *
 * @typeParam TVariation - The specific variation type for this confection
 * @typeParam TEntity - The specific entity type for this confection
 * @public
 */
export abstract class ConfectionBase<
  TVariation extends AnyConfectionRecipeVariation = AnyConfectionRecipeVariation,
  TEntity extends Confections.AnyConfectionRecipeEntity = Confections.AnyConfectionRecipeEntity
> implements IConfectionBase<TVariation>
{
  protected readonly _context: IConfectionContext;
  protected readonly _id: ConfectionId;
  protected readonly _confection: TEntity;
  protected readonly _sourceId: CollectionId;
  protected readonly _baseId: BaseConfectionId;
  protected readonly _goldenVariationEntity: Confections.AnyConfectionRecipeVariationEntity;

  // Lazy-resolved variation caches (undefined = not yet resolved)
  private _resolvedGoldenVariation: TVariation | undefined;
  private _resolvedVariations: ReadonlyArray<TVariation> | undefined;
  private _variationCache: Map<ConfectionRecipeVariationSpec, TVariation> | undefined;

  /**
   * Creates a ConfectionBase.
   * @param context - The runtime context for navigation
   * @param id - The composite confection ID
   * @param confection - The confection data
   * @internal
   */
  protected constructor(context: IConfectionContext, id: ConfectionId, confection: TEntity) {
    this._context = context;
    this._id = id;
    this._confection = confection;

    const parsed = Converters.parsedConfectionId.convert(id).orThrow();
    this._sourceId = parsed.collectionId;
    this._baseId = parsed.itemId;

    // Find and cache the golden variation entity
    const goldenVariation = confection.variations.find(
      (v) => v.variationSpec === confection.goldenVariationSpec
    );
    /* c8 ignore next 3 - defensive: converter validates golden variation exists */
    if (!goldenVariation) {
      throw new Error(`Golden variation ${confection.goldenVariationSpec} not found in confection ${id}`);
    }
    this._goldenVariationEntity = goldenVariation;
  }

  /**
   * The composite confection ID (e.g., "common.dark-dome-bonbon")
   */
  public get id(): ConfectionId {
    return this._id;
  }

  /**
   * The source ID part of the composite ID
   */
  public get collectionId(): CollectionId {
    return this._sourceId;
  }

  /**
   * The base confection ID within the source
   */
  public get baseId(): BaseConfectionId {
    return this._baseId;
  }

  // ============================================================================
  // Core Properties (identity/metadata from confection, config from golden variation)
  // ============================================================================

  /**
   * Confection type - must be overridden by subclasses
   */
  public abstract get confectionType(): ConfectionType;

  /**
   * Human-readable name
   */
  public get name(): ConfectionName {
    return this._confection.name;
  }

  /**
   * Optional description
   */
  public get description(): string | undefined {
    return this._confection.description;
  }

  /**
   * Base tags for searching/filtering (variation may add more via additionalTags)
   */
  public get tags(): ReadonlyArray<string> | undefined {
    return this._confection.tags;
  }

  /**
   * Base URLs (variation may add more via additionalUrls)
   */
  public get urls(): ReadonlyArray<CommonModel.ICategorizedUrl> | undefined {
    return this._confection.urls;
  }

  /**
   * The ID of the golden (approved default) variation
   */
  public get goldenVariationSpec(): ConfectionRecipeVariationSpec {
    return this._confection.goldenVariationSpec;
  }

  // ============================================================================
  // Properties from Golden Variation (convenience accessors)
  // ============================================================================

  /**
   * Resolved decorations from the golden variation
   */
  public get decorations():
    | CommonModel.IOptionsWithPreferred<IResolvedConfectionDecorationRef, DecorationId>
    | undefined {
    return this.goldenVariation.decorations;
  }

  /**
   * Yield specification from the golden variation
   */
  public get yield(): Confections.ConfectionYield {
    return this._goldenVariationEntity.yield;
  }

  /**
   * Resolved filling slots from the golden variation (lazy-loaded)
   */
  public abstract get fillings(): ReadonlyArray<IResolvedFillingSlot> | undefined;

  /**
   * Resolved procedures from the golden variation (lazy-loaded)
   */
  public abstract get procedures():
    | CommonModel.IOptionsWithPreferred<IResolvedConfectionProcedure, ProcedureId>
    | undefined;

  // ============================================================================
  // Variation Navigation (lazy)
  // ============================================================================

  /**
   * Gets the golden (default) variation - resolved.
   * Resolved lazily on first access.
   * @returns Result with golden variation, or Failure if creation fails
   * @public
   */
  public getGoldenVariation(): Result<TVariation> {
    if (this._resolvedGoldenVariation === undefined) {
      return this._createVariation(this._goldenVariationEntity).onSuccess((variation) => {
        this._resolvedGoldenVariation = variation;
        return Success.with(variation);
      });
    }
    return Success.with(this._resolvedGoldenVariation);
  }

  /**
   * The golden (default) variation - resolved.
   * Resolved lazily on first access.
   * @throws if variation creation fails - prefer getGoldenVariation() for proper error handling
   */
  public get goldenVariation(): TVariation {
    return this.getGoldenVariation().orThrow();
  }

  /**
   * Gets all variations - resolved.
   * Resolved lazily on first access.
   * @returns Result with all variations, or Failure if any variation creation fails
   * @public
   */
  public getVariations(): Result<ReadonlyArray<TVariation>> {
    if (this._resolvedVariations === undefined) {
      return mapResults(this._confection.variations.map((v) => this._getOrCreateVariation(v))).onSuccess(
        (variations) => {
          this._resolvedVariations = variations;
          return Success.with(variations);
        }
      );
    }
    return Success.with(this._resolvedVariations);
  }

  /**
   * All variations - resolved.
   * Resolved lazily on first access.
   * @throws if variation creation fails - prefer getVariations() for proper error handling
   */
  public get variations(): ReadonlyArray<TVariation> {
    return this.getVariations().orThrow();
  }

  /**
   * Wraps an arbitrary variation entity using this confection's context.
   * Used to create a runtime variation from an in-memory entity that may not yet
   * be persisted (e.g., a newly created variation from EditedConfectionRecipe).
   * Does not cache the result.
   * @param entity - The variation entity to wrap
   * @returns Result with runtime variation, or Failure if creation fails
   * @public
   */
  public getVariationFromEntity(entity: Confections.AnyConfectionRecipeVariationEntity): Result<TVariation> {
    return this._createVariation(entity);
  }

  /**
   * Gets a specific variation by variation specifier.
   * @param variationSpec - The variation specifier to find
   * @returns Success with runtime variation, or Failure if not found or creation fails
   */
  public getVariation(variationSpec: ConfectionRecipeVariationSpec): Result<TVariation> {
    const entity = this._confection.variations.find((v) => v.variationSpec === variationSpec);
    if (!entity) {
      return Failure.with(`Variation ${variationSpec} not found in confection ${this._id}`);
    }
    return this._getOrCreateVariation(entity);
  }

  /**
   * Gets or creates a runtime variation from a data layer entity, using caching.
   * @param entity - The data layer entity
   * @returns Result with runtime variation (from cache or newly created), or Failure if creation fails
   * @internal
   */
  private _getOrCreateVariation(entity: Confections.AnyConfectionRecipeVariationEntity): Result<TVariation> {
    // Initialize cache if needed
    if (this._variationCache === undefined) {
      this._variationCache = new Map();
    }

    // Check cache
    const cached = this._variationCache.get(entity.variationSpec);
    if (cached !== undefined) {
      return Success.with(cached);
    }

    // Create new variation and cache it
    return this._createVariation(entity).onSuccess((variation) => {
      this._variationCache!.set(entity.variationSpec, variation);
      return Success.with(variation);
    });
  }

  /**
   * Creates a runtime variation from a data layer entity.
   * Must be overridden by subclasses to return the appropriate typed variation.
   * @param entity - The data layer entity
   * @returns Result with runtime variation, or Failure if creation fails
   * @internal
   */
  protected abstract _createVariation(
    entity: Confections.AnyConfectionRecipeVariationEntity
  ): Result<TVariation>;

  // ============================================================================
  // Effective Tags/URLs (merged from base + variation)
  // ============================================================================

  /**
   * Gets effective tags for the golden variation (base tags + variation's additional tags).
   */
  public get effectiveTags(): ReadonlyArray<string> {
    return this.getEffectiveTags(this._goldenVariationEntity);
  }

  /**
   * Gets effective URLs for the golden variation (base URLs + variation's additional URLs).
   */
  public get effectiveUrls(): ReadonlyArray<CommonModel.ICategorizedUrl> {
    return this.getEffectiveUrls(this._goldenVariationEntity);
  }

  /**
   * Gets effective tags for a specific variation (base tags + variation's additional tags).
   * @param variation - The variation to get tags for (defaults to golden variation)
   */
  public getEffectiveTags(variation?: Confections.AnyConfectionRecipeVariationEntity): ReadonlyArray<string> {
    const targetVariation = variation ?? this._goldenVariationEntity;
    const baseTags = this._confection.tags ?? [];
    const variationTags = targetVariation.additionalTags ?? [];
    // Deduplicate while preserving order (base first)
    return [...new Set([...baseTags, ...variationTags])];
  }

  /**
   * Gets effective URLs for a specific variation (base URLs + variation's additional URLs).
   * @param variation - The variation to get URLs for (defaults to golden variation)
   */
  public getEffectiveUrls(
    variation?: Confections.AnyConfectionRecipeVariationEntity
  ): ReadonlyArray<CommonModel.ICategorizedUrl> {
    const targetVariation = variation ?? this._goldenVariationEntity;
    const baseUrls = this._confection.urls ?? [];
    const variationUrls = targetVariation.additionalUrls ?? [];
    return [...baseUrls, ...variationUrls];
  }

  // ============================================================================
  // Type Guards - delegate to confection module helpers for consistency
  // ============================================================================

  /**
   * Returns true if this is a molded bonbon confection.
   */
  public isMoldedBonBon(): this is MoldedBonBonRecipe {
    return Confections.isMoldedBonBonRecipeEntity(this._confection);
  }

  /**
   * Returns true if this is a bar truffle confection.
   */
  public isBarTruffle(): this is BarTruffleRecipe {
    return Confections.isBarTruffleEntity(this._confection);
  }

  /**
   * Returns true if this is a rolled truffle confection.
   */
  public isRolledTruffle(): this is RolledTruffleRecipe {
    return Confections.isRolledTruffleRecipeEntity(this._confection);
  }

  /**
   * Gets the underlying confection data entity (read-only)
   */
  public abstract get entity(): Confections.AnyConfectionRecipeEntity;
}
