import { Result, Success } from '@fgv/ts-utils';

import { IngredientCategory, IngredientId } from '../../common';
import { IngredientEntity } from '../../entities';
import { IIngredientContext, IIngredient } from '../model';
import { IngredientBase } from './ingredientBase';

/**
 * A resolved view of a generic ingredient with navigation capabilities.
 * Immutable - does not allow modification of underlying data.
 * @public
 */
export class GenericIngredient extends IngredientBase implements IIngredient {
  protected constructor(context: IIngredientContext, id: IngredientId, ingredient: IngredientEntity) {
    super(context, id, ingredient);
  }

  /**
   * Factory method for creating a GenericIngredient.
   * @param context - The runtime context
   * @param id - The ingredient ID
   * @param ingredient - The generic ingredient data entity
   * @returns Success with GenericIngredient
   */
  public static create(
    context: IIngredientContext,
    id: IngredientId,
    ingredient: IngredientEntity
  ): Result<GenericIngredient> {
    return Success.with(new GenericIngredient(context, id, ingredient));
  }

  /**
   * Gets the ingredient category.
   */
  public get category(): IngredientCategory {
    return this._ingredient.category;
  }

  /**
   * Gets the underlying generic ingredient data entity.
   */
  public get entity(): IngredientEntity {
    return this._ingredient;
  }
}
