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
 * Decoration - resolved decoration view with materialized ingredient references
 * @packageDocumentation
 */

import { Result, mapResults, succeed } from '@fgv/ts-utils';

import { BaseDecorationId, DecorationId, Helpers, Model as CommonModel, ProcedureId } from '../../common';
import { Decorations, IDecorationEntity } from '../../entities';
import {
  IDecoration,
  IDecorationContext,
  IResolvedDecorationIngredient,
  IResolvedDecorationProcedure
} from './model';

// ============================================================================
// Decoration Class
// ============================================================================

/**
 * A resolved view of a decoration with materialized ingredient references.
 *
 * Decoration wraps a data-layer IDecorationEntity and provides:
 * - Composite identity (DecorationId) for cross-source references
 * - Resolved ingredient references (preferred ingredient materialized)
 * - Resolved procedure references (lazily materialized)
 * - Passthrough for ratings, notes, and tags
 *
 * @public
 */
export class Decoration implements IDecoration {
  private readonly _context: IDecorationContext;
  private readonly _id: DecorationId;
  private readonly _entity: IDecorationEntity;
  private _resolvedIngredients?: ReadonlyArray<IResolvedDecorationIngredient>;
  private _resolvedProcedures?: CommonModel.IOptionsWithPreferred<IResolvedDecorationProcedure, ProcedureId>;

  private constructor(context: IDecorationContext, id: DecorationId, entity: IDecorationEntity) {
    this._context = context;
    this._id = id;
    this._entity = entity;
  }

  /**
   * Factory method for creating a Decoration.
   * @param context - The runtime context for ingredient/procedure resolution
   * @param id - The composite decoration ID
   * @param entity - The decoration data entity
   * @returns Success with Decoration
   */
  public static create(
    context: IDecorationContext,
    id: DecorationId,
    entity: IDecorationEntity
  ): Result<Decoration> {
    return succeed(new Decoration(context, id, entity));
  }

  // ============================================================================
  // Identity
  // ============================================================================

  /**
   * The composite decoration ID (e.g., "common.gold-leaf-accent")
   */
  public get id(): DecorationId {
    return this._id;
  }

  /**
   * The base decoration ID within the source
   */
  public get baseId(): BaseDecorationId {
    return this._entity.baseId;
  }

  // ============================================================================
  // Core Properties
  // ============================================================================

  /**
   * Human-readable name of the decoration
   */
  public get name(): string {
    return this._entity.name;
  }

  /**
   * Optional description
   */
  public get description(): string | undefined {
    return this._entity.description;
  }

  /**
   * Resolved ingredients with materialized preferred ingredient.
   * Lazily resolved and cached on first access.
   */
  public get ingredients(): ReadonlyArray<IResolvedDecorationIngredient> {
    if (!this._resolvedIngredients) {
      this._resolvedIngredients = this._resolveIngredients().orDefault([]);
    }
    return this._resolvedIngredients;
  }

  /**
   * Optional resolved procedures with preferred selection.
   * Lazily resolved and cached on first access.
   */
  public get procedures():
    | CommonModel.IOptionsWithPreferred<IResolvedDecorationProcedure, ProcedureId>
    | undefined {
    if (this._resolvedProcedures === undefined) {
      if (!this._entity.procedures) {
        return undefined;
      }
      this._resolvedProcedures = this._resolveProcedures().orThrow();
    }
    return this._resolvedProcedures;
  }

  /**
   * The preferred procedure (or first if no preference is set), or undefined if no procedures.
   */
  public get preferredProcedure(): IResolvedDecorationProcedure | undefined {
    return this.procedures ? Helpers.getPreferredOrFirst(this.procedures) : undefined;
  }

  /**
   * Optional ratings
   */
  public get ratings(): ReadonlyArray<Decorations.IDecorationRating> | undefined {
    return this._entity.ratings;
  }

  /**
   * Optional tags
   */
  public get tags(): ReadonlyArray<string> | undefined {
    return this._entity.tags;
  }

  /**
   * Optional categorized notes
   */
  public get notes(): ReadonlyArray<CommonModel.ICategorizedNote> | undefined {
    return this._entity.notes;
  }

  /**
   * Gets the underlying decoration data entity
   */
  public get entity(): IDecorationEntity {
    return this._entity;
  }

  // ============================================================================
  // Private Resolution
  // ============================================================================

  /**
   * Resolves all decoration ingredients by materializing preferred ingredients.
   */
  private _resolveIngredients(): Result<ReadonlyArray<IResolvedDecorationIngredient>> {
    return mapResults(
      this._entity.ingredients.map((ingredientEntity) => this._resolveIngredient(ingredientEntity))
    );
  }

  /**
   * Resolves a single decoration ingredient entity.
   */
  private _resolveIngredient(
    ingredientEntity: Decorations.IDecorationIngredientEntity
  ): Result<IResolvedDecorationIngredient> {
    const preferredId = ingredientEntity.ingredient.preferredId ?? ingredientEntity.ingredient.ids[0];
    return this._context
      ._getIngredient(preferredId)
      .withErrorFormat((msg) => `decoration '${this._id}' ingredient '${preferredId}': ${msg}`)
      .onSuccess((ingredient) =>
        succeed({
          ingredient,
          ingredientIds: ingredientEntity.ingredient,
          amount: ingredientEntity.amount,
          notes: ingredientEntity.notes
        })
      );
  }

  /**
   * Resolves all decoration procedure references.
   */
  private _resolveProcedures(): Result<
    CommonModel.IOptionsWithPreferred<IResolvedDecorationProcedure, ProcedureId>
  > {
    const procRefs = this._entity.procedures!;
    return mapResults(
      procRefs.options.map((ref) =>
        this._context.procedures
          .get(ref.id)
          .asResult.withErrorFormat((msg) => `decoration '${this._id}' procedure '${ref.id}': ${msg}`)
          .onSuccess((procedure) =>
            succeed({
              id: ref.id,
              procedure,
              notes: ref.notes,
              entity: ref
            })
          )
      )
    ).onSuccess((options) => succeed({ options, preferredId: procRefs.preferredId }));
  }
}
