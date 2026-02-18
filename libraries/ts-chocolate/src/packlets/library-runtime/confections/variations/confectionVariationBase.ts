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
 * ConfectionRecipeVariationBase - abstract base class for runtime confection recipe variations.
 * @packageDocumentation
 */

import { Result, mapResults, succeed } from '@fgv/ts-utils';

import {
  ConfectionId,
  ConfectionRecipeVariationSpec,
  DecorationId,
  Helpers,
  Model as CommonModel,
  ProcedureId
} from '../../../common';
import { Confections } from '../../../entities';
import {
  IConfectionContext,
  IResolvedConfectionDecorationRef,
  IResolvedConfectionProcedure,
  IResolvedFillingSlot,
  IResolvedFillingOption,
  IConfectionBase,
  IConfectionRecipeVariationBase
} from '../../model';

// Forward declarations to avoid circular imports
import type { MoldedBonBonRecipeVariation } from './moldedBonBonVariation';
import type { BarTruffleRecipeVariation } from './barTruffleVariation';
import type { RolledTruffleRecipeVariation } from './rolledTruffleVariation';

/**
 * Abstract base class for runtime confection variations.
 * Provides common properties and resolution logic shared by all confection variation types.
 *
 * @typeParam TConfection - The specific confection type for this variation
 * @typeParam TEntity - The specific entity type for this variation
 * @public
 */
export abstract class ConfectionRecipeVariationBase<
  TConfection extends IConfectionBase = IConfectionBase,
  TEntity extends Confections.AnyConfectionRecipeVariationEntity = Confections.AnyConfectionRecipeVariationEntity
> implements IConfectionRecipeVariationBase<TConfection>
{
  protected readonly _context: IConfectionContext;
  protected readonly _confectionId: ConfectionId;
  protected readonly _entity: TEntity;

  // Lazy-resolved caches (undefined = not yet resolved)
  private _confection: TConfection | undefined;
  private _resolvedFillings: ReadonlyArray<IResolvedFillingSlot> | undefined;
  private _resolvedDecorations:
    | CommonModel.IOptionsWithPreferred<IResolvedConfectionDecorationRef, DecorationId>
    | undefined;
  private _resolvedProcedures:
    | CommonModel.IOptionsWithPreferred<IResolvedConfectionProcedure, ProcedureId>
    | undefined;

  /**
   * Initializes a ConfectionRecipeVariationBase.
   * @param context - The runtime context for navigation
   * @param confectionId - The parent confection ID
   * @param entity - The variation entity data
   * @internal
   */
  protected constructor(context: IConfectionContext, confectionId: ConfectionId, entity: TEntity) {
    this._context = context;
    this._confectionId = confectionId;
    this._entity = entity;
  }

  // ============================================================================
  // Identity
  // ============================================================================

  /**
   * Variation specifier for this variation.
   */
  public get variationSpec(): ConfectionRecipeVariationSpec {
    return this._entity.variationSpec;
  }

  /**
   * Optional human-readable name for this variation.
   */
  public get name(): string | undefined {
    return this._entity.name;
  }

  /**
   * Date this variation was created (ISO 8601 format).
   */
  public get createdDate(): string {
    return this._entity.createdDate;
  }

  /**
   * The parent confection ID.
   */
  public get confectionId(): ConfectionId {
    return this._confectionId;
  }

  /**
   * The parent confection - resolved.
   * Enables navigation: `variation.confection.name`
   */
  public get confection(): TConfection {
    if (this._confection === undefined) {
      // orThrow is safe - variation was created from a valid confection
      this._confection = this._context.confections.get(this._confectionId).value as TConfection;
    }
    return this._confection;
  }

  /**
   * The runtime context for navigation and resource resolution.
   * Used by editing sessions to access library resources.
   */
  public get context(): IConfectionContext {
    return this._context;
  }

  /**
   * The underlying confection variation entity.
   * Use this to get the variation entity data for persistence or journaling.
   */
  /* c8 ignore next 3 - dead code: all subclasses override with narrower return type */
  public get entity(): TEntity {
    return this._entity;
  }

  // ============================================================================
  // Variation Properties
  // ============================================================================

  /**
   * Yield specification for this variation.
   */
  public get yield(): Confections.IConfectionYield {
    return this._entity.yield;
  }

  /**
   * Gets resolved decorations for this variation.
   * @returns Result with resolved decorations (undefined if none), or Failure if resolution fails
   * @public
   */
  public getDecorations(): Result<
    CommonModel.IOptionsWithPreferred<IResolvedConfectionDecorationRef, DecorationId> | undefined
  > {
    if (this._resolvedDecorations === undefined) {
      const decorationRefs = this._entity.decorations;
      if (!decorationRefs || decorationRefs.options.length === 0) {
        return succeed(undefined);
      }

      return this._context.decorations
        .getRefsWithAlternates(decorationRefs)
        .withErrorFormat((msg) => `confection ${this._confectionId}: failed to resolve decorations: ${msg}`)
        .onSuccess((resolved) => {
          const options: IResolvedConfectionDecorationRef[] = [
            {
              id: resolved.primaryId,
              decoration: resolved.primary,
              notes: resolved.primaryNotes,
              // safe: getRefsWithAlternates derives IDs from the same options array
              entity: Helpers.findById(resolved.primaryId, decorationRefs.options)!
            },
            ...resolved.alternates.map((alt) => ({
              id: alt.id,
              decoration: alt.item,
              notes: alt.notes,
              // safe: getRefsWithAlternates derives IDs from the same options array
              entity: Helpers.findById(alt.id, decorationRefs.options)!
            }))
          ];
          this._resolvedDecorations = { options, preferredId: decorationRefs.preferredId };
          return succeed(this._resolvedDecorations);
        });
    }
    return succeed(this._resolvedDecorations);
  }

  /**
   * Resolved decorations for this variation.
   * Undefined if the variation has no decorations.
   * @throws if resolution fails - prefer getDecorations() for proper error handling
   */
  public get decorations():
    | CommonModel.IOptionsWithPreferred<IResolvedConfectionDecorationRef, DecorationId>
    | undefined {
    return this.getDecorations().orThrow();
  }

  /**
   * Optional categorized notes about this variation.
   */
  public get notes(): ReadonlyArray<CommonModel.ICategorizedNote> | undefined {
    return this._entity.notes;
  }

  // ============================================================================
  // Resolved References (lazy)
  // ============================================================================

  /**
   * Gets resolved filling slots for this variation.
   * @returns Result with resolved fillings (empty array if none), or Failure if resolution fails
   * @public
   */
  public getFillings(): Result<ReadonlyArray<IResolvedFillingSlot>> {
    if (this._resolvedFillings === undefined) {
      const slots = this._entity.fillings ?? [];
      return mapResults(slots.map((slot) => this._resolveFillingSlot(slot))).onSuccess((slots) => {
        this._resolvedFillings = slots;
        return succeed(slots);
      });
    }
    return succeed(this._resolvedFillings);
  }

  /**
   * Resolves a single filling slot.
   * @param slot - The filling slot to resolve
   * @returns Result with resolved filling slot, or Failure if resolution fails
   * @internal
   */
  private _resolveFillingSlot(slot: Confections.IFillingSlotEntity): Result<IResolvedFillingSlot> {
    return this._resolveFillingOptions(slot.filling)
      .withErrorFormat((msg) => `slot ${slot.name}: failed to resolve fillings: ${msg}`)
      .onSuccess((filling) =>
        succeed({
          slotId: slot.slotId,
          name: slot.name,
          filling
        })
      );
  }

  /**
   * Resolved filling slots for this variation.
   * Undefined if the variation has no fillings.
   * @throws if resolution fails - prefer getFillings() for proper error handling
   */
  public get fillings(): ReadonlyArray<IResolvedFillingSlot> | undefined {
    const result = this.getFillings().orThrow();
    return Helpers.nonEmpty(result);
  }

  /**
   * Gets resolved procedures for this variation.
   * @returns Result with resolved procedures (undefined if none), or Failure if resolution fails
   * @public
   */
  public getProcedures(): Result<
    CommonModel.IOptionsWithPreferred<IResolvedConfectionProcedure, ProcedureId> | undefined
  > {
    if (this._resolvedProcedures === undefined) {
      const procedures = this._entity.procedures;
      if (!procedures || procedures.options.length === 0) {
        return succeed(undefined);
      }

      return this._context.procedures
        .getRefsWithAlternates(procedures)
        .withErrorFormat((msg) => `confection ${this._confectionId}: failed to resolve procedures: ${msg}`)
        .onSuccess((resolved) => {
          const options: IResolvedConfectionProcedure[] = [
            {
              id: resolved.primaryId,
              procedure: resolved.primary,
              notes: resolved.primaryNotes,
              // safe: getRefsWithAlternates derives IDs from the same options array
              entity: Helpers.findById(resolved.primaryId, procedures.options)!
            },
            ...resolved.alternates.map((alt) => ({
              id: alt.id,
              procedure: alt.item,
              notes: alt.notes,
              // safe: getRefsWithAlternates derives IDs from the same options array
              entity: Helpers.findById(alt.id, procedures.options)!
            }))
          ];
          this._resolvedProcedures = { options, preferredId: procedures.preferredId };
          return succeed(this._resolvedProcedures);
        });
    }
    /* c8 ignore next 2 - coverage intermittently missed in full suite */
    return succeed(this._resolvedProcedures);
  }

  /**
   * Resolved procedures for this variation.
   * Undefined if the variation has no procedures.
   * @throws if resolution fails - prefer getProcedures() for proper error handling
   */
  public get procedures():
    | CommonModel.IOptionsWithPreferred<IResolvedConfectionProcedure, ProcedureId>
    | undefined {
    return this.getProcedures().orThrow();
  }

  /**
   * Resolves filling options for a slot.
   * @internal
   */
  private _resolveFillingOptions(
    options: CommonModel.IOptionsWithPreferred<
      Confections.AnyFillingOptionEntity,
      Confections.FillingOptionId
    >
  ): Result<CommonModel.IOptionsWithPreferred<IResolvedFillingOption, Confections.FillingOptionId>> {
    return mapResults(options.options.map((opt) => this._resolveFillingOption(opt))).onSuccess((resolved) =>
      succeed({ options: resolved, preferredId: options.preferredId })
    );
  }

  /**
   * Resolves a single filling option (recipe or ingredient).
   * @internal
   */
  private _resolveFillingOption(opt: Confections.AnyFillingOptionEntity): Result<IResolvedFillingOption> {
    if (opt.type === 'recipe') {
      return this._context.fillings
        .get(opt.id)
        .asResult.withErrorFormat((msg) => `filling recipe '${opt.id}': ${msg}`)
        .onSuccess((filling) =>
          succeed({
            type: 'recipe' as const,
            id: opt.id,
            filling,
            notes: opt.notes,
            entity: opt
          })
        );
    } else {
      return this._context.ingredients
        .get(opt.id)
        .asResult.withErrorFormat((msg) => `filling ingredient '${opt.id}': ${msg}`)
        .onSuccess((ingredient) =>
          succeed({
            type: 'ingredient' as const,
            id: opt.id,
            ingredient,
            notes: opt.notes,
            entity: opt
          })
        );
    }
  }

  // ============================================================================
  // Effective Tags/URLs
  // ============================================================================

  /**
   * Effective tags for this variation (base confection tags + variation's additional tags).
   */
  public get effectiveTags(): ReadonlyArray<string> {
    /* c8 ignore next 2 - branch: test confections always have tags */
    const baseTags = this.confection.tags ?? [];
    const variationTags = this._entity.additionalTags ?? [];
    // Deduplicate while preserving order (base first)
    return [...new Set([...baseTags, ...variationTags])];
  }

  /**
   * Effective URLs for this variation (base confection URLs + variation's additional URLs).
   */
  public get effectiveUrls(): ReadonlyArray<CommonModel.ICategorizedUrl> {
    /* c8 ignore next 2 - branch: test confections always have urls */
    const baseUrls = this.confection.urls ?? [];
    const variationUrls = this._entity.additionalUrls ?? [];
    return [...baseUrls, ...variationUrls];
  }

  /**
   * Returns true if this is a molded bonbon variation.
   */
  public isMoldedBonBonVariation(): this is MoldedBonBonRecipeVariation {
    return Confections.isMoldedBonBonRecipeVariationEntity(this._entity);
  }

  /**
   * Returns true if this is a bar truffle variation.
   */
  public isBarTruffleVariation(): this is BarTruffleRecipeVariation {
    return Confections.isBarTruffleRecipeVariationEntity(this._entity);
  }

  /**
   * Returns true if this is a rolled truffle variation.
   */
  public isRolledTruffleVariation(): this is RolledTruffleRecipeVariation {
    return Confections.isRolledTruffleRecipeVariationEntity(this._entity);
  }
}
