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
 * Base class for materialized journal entries with resolved references.
 * @packageDocumentation
 */

import { BaseJournalId, JournalId } from '../common';
import { AnyJournalEntryEntity } from '../entities';
import { ISessionContext } from './model';
import { IJournalEntryBase } from './model';

/**
 * Abstract base class for materialized journal entries.
 * Provides common properties shared by all journal entry types.
 *
 * @typeParam TRecipe - The recipe/confection interface type
 * @typeParam TVariation - The variation interface type
 * @typeParam TVariationId - The variation ID type
 * @typeParam TEntity - The specific journal entry entity type
 * @internal
 */
export abstract class JournalEntryBase<
  TRecipe,
  TVariation,
  TVariationId,
  TEntity extends AnyJournalEntryEntity
> implements IJournalEntryBase<TRecipe, TVariation, TVariationId, TEntity>
{
  protected readonly _context: ISessionContext;
  protected readonly _id: JournalId;
  protected readonly _baseId: BaseJournalId;
  protected readonly _entity: TEntity;
  protected readonly _recipe: TRecipe;
  protected readonly _variation: TVariation;
  protected readonly _updated: TVariation | undefined;

  /**
   * Creates a JournalEntryBase.
   * @param context - Session context for resolving references
   * @param id - Composite journal entry ID
   * @param baseId - Base ID within collection
   * @param entity - Journal entry entity
   * @param recipe - Resolved recipe/confection
   * @param variation - Resolved variation
   * @param updated - Resolved updated variation (if any)
   * @internal
   */
  protected constructor(
    context: ISessionContext,
    id: JournalId,
    baseId: BaseJournalId,
    entity: TEntity,
    recipe: TRecipe,
    variation: TVariation,
    updated?: TVariation
  ) {
    this._context = context;
    this._id = id;
    this._baseId = baseId;
    this._entity = entity;
    this._recipe = recipe;
    this._variation = variation;
    this._updated = updated;
  }

  /**
   * {@inheritDoc IJournalEntryBase.id}
   */
  public get id(): JournalId {
    return this._id;
  }

  /**
   * {@inheritDoc IJournalEntryBase.baseId}
   */
  public get baseId(): BaseJournalId {
    return this._baseId;
  }

  /**
   * {@inheritDoc IJournalEntryBase.timestamp}
   */
  public get timestamp(): string {
    return this._entity.timestamp;
  }

  /**
   * {@inheritDoc IJournalEntryBase.variationId}
   */
  public get variationId(): TVariationId {
    return this._entity.variationId as TVariationId;
  }

  /**
   * {@inheritDoc IJournalEntryBase.recipe}
   */
  public get recipe(): TRecipe {
    return this._recipe;
  }

  /**
   * {@inheritDoc IJournalEntryBase.variation}
   */
  public get variation(): TVariation {
    return this._variation;
  }

  /**
   * {@inheritDoc IJournalEntryBase.updated}
   */
  public get updated(): TVariation | undefined {
    return this._updated;
  }

  /**
   * {@inheritDoc IJournalEntryBase.updatedId}
   */
  public get updatedId(): TVariationId | undefined {
    return this._entity.updatedId as TVariationId | undefined;
  }

  /**
   * {@inheritDoc IJournalEntryBase.notes}
   */
  public get notes(): ReadonlyArray<import('../common').Model.ICategorizedNote> | undefined {
    return this._entity.notes;
  }

  /**
   * {@inheritDoc IJournalEntryBase.entity}
   */
  public get entity(): TEntity {
    return this._entity;
  }
}
