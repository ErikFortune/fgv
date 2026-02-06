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
 * Concrete inventory entry classes with resolved references.
 * @packageDocumentation
 */

import { Result, succeed } from '@fgv/ts-utils';

import { Model as CommonModel } from '../common';
import {
  IIngredientInventoryEntryEntity,
  IMoldInventoryEntryEntity,
  Inventory as InventoryEntities
} from '../entities';
import { IIngredient, IMold } from '../library-runtime';
import { ISessionContext } from '../runtime';
import { IIngredientInventoryEntry, IMoldInventoryEntry, IInventoryEntryBase } from './model';

// ============================================================================
// Base Class
// ============================================================================

/**
 * Abstract base class for materialized inventory entries.
 * Provides common properties shared by all inventory entry types.
 *
 * @typeParam TId - The inventory entry ID type
 * @typeParam TItem - The resolved item interface type
 * @typeParam TEntity - The specific inventory entry entity type
 * @internal
 */
export abstract class InventoryEntryBase<TId, TItem, TEntity>
  implements IInventoryEntryBase<TId, TItem, TEntity>
{
  protected readonly _context: ISessionContext;
  protected readonly _id: TId;
  protected readonly _entity: TEntity;
  protected readonly _item: TItem;

  /**
   * Creates an InventoryEntryBase.
   * @param context - Session context for resolving references
   * @param id - Composite inventory entry ID
   * @param entity - Inventory entry entity
   * @param item - Resolved item (mold or ingredient)
   * @internal
   */
  protected constructor(context: ISessionContext, id: TId, entity: TEntity, item: TItem) {
    this._context = context;
    this._id = id;
    this._entity = entity;
    this._item = item;
  }

  /**
   * {@inheritDoc IInventoryEntryBase.id}
   */
  public get id(): TId {
    return this._id;
  }

  /**
   * {@inheritDoc IInventoryEntryBase.item}
   */
  public get item(): TItem {
    return this._item;
  }

  /**
   * {@inheritDoc IInventoryEntryBase.quantity}
   */
  public get quantity(): number {
    return (this._entity as { quantity: number }).quantity;
  }

  /**
   * {@inheritDoc IInventoryEntryBase.location}
   */
  public get location(): string | undefined {
    return (this._entity as { location?: string }).location;
  }

  /**
   * {@inheritDoc IInventoryEntryBase.notes}
   */
  public get notes(): ReadonlyArray<CommonModel.ICategorizedNote> | undefined {
    return (this._entity as { notes?: ReadonlyArray<CommonModel.ICategorizedNote> }).notes;
  }

  /**
   * {@inheritDoc IInventoryEntryBase.entity}
   */
  public get entity(): TEntity {
    return this._entity;
  }
}

// ============================================================================
// Mold Inventory Entry
// ============================================================================

/**
 * Materialized mold inventory entry with resolved mold reference.
 * @internal
 */
export class MoldInventoryEntry
  extends InventoryEntryBase<InventoryEntities.MoldInventoryEntryId, IMold, IMoldInventoryEntryEntity>
  implements IMoldInventoryEntry
{
  /**
   * Creates a MoldInventoryEntry.
   * @internal
   */
  private constructor(
    context: ISessionContext,
    id: InventoryEntities.MoldInventoryEntryId,
    entity: IMoldInventoryEntryEntity,
    mold: IMold
  ) {
    super(context, id, entity, mold);
  }

  /**
   * Convenience accessor for the resolved mold.
   */
  public get mold(): IMold {
    return this._item;
  }

  /**
   * Factory method to create a materialized mold inventory entry.
   * @param context - Session context for resolving references
   * @param id - Composite inventory entry ID
   * @param entity - Mold inventory entry entity
   * @returns Result with materialized inventory entry
   * @internal
   */
  public static create(
    context: ISessionContext,
    id: InventoryEntities.MoldInventoryEntryId,
    entity: IMoldInventoryEntryEntity
  ): Result<MoldInventoryEntry> {
    return context.molds
      .get(entity.moldId)
      .asResult.withErrorFormat((msg) => `inventory ${id}: ${msg}`)
      .onSuccess((mold) => {
        return succeed(new MoldInventoryEntry(context, id, entity, mold));
      });
  }
}

// ============================================================================
// Ingredient Inventory Entry
// ============================================================================

/**
 * Materialized ingredient inventory entry with resolved ingredient reference.
 * @internal
 */
export class IngredientInventoryEntry
  extends InventoryEntryBase<
    InventoryEntities.IngredientInventoryEntryId,
    IIngredient,
    IIngredientInventoryEntryEntity
  >
  implements IIngredientInventoryEntry
{
  /**
   * Creates an IngredientInventoryEntry.
   * @internal
   */
  private constructor(
    context: ISessionContext,
    id: InventoryEntities.IngredientInventoryEntryId,
    entity: IIngredientInventoryEntryEntity,
    ingredient: IIngredient
  ) {
    super(context, id, entity, ingredient);
  }

  /**
   * Convenience accessor for the resolved ingredient.
   */
  public get ingredient(): IIngredient {
    return this._item;
  }

  /**
   * Factory method to create a materialized ingredient inventory entry.
   * @param context - Session context for resolving references
   * @param id - Composite inventory entry ID
   * @param entity - Ingredient inventory entry entity
   * @returns Result with materialized inventory entry
   * @internal
   */
  public static create(
    context: ISessionContext,
    id: InventoryEntities.IngredientInventoryEntryId,
    entity: IIngredientInventoryEntryEntity
  ): Result<IngredientInventoryEntry> {
    return context.ingredients
      .get(entity.ingredientId)
      .asResult.withErrorFormat((msg) => `inventory ${id}: ${msg}`)
      .onSuccess((ingredient) => {
        return succeed(new IngredientInventoryEntry(context, id, entity, ingredient));
      });
  }
}
