import { Result, Success } from '@fgv/ts-utils';

import { IngredientCategory, IngredientId } from '../../common';
import { IngredientEntity } from '../../entities';
import { IIngredientContext, IIngredient } from '../model';
import { RuntimeIngredientBase } from './ingredientBase';

export class RuntimeGenericIngredient extends RuntimeIngredientBase implements IIngredient {
  protected constructor(context: IIngredientContext, id: IngredientId, ingredient: IngredientEntity) {
    super(context, id, ingredient);
  }

  public static create(
    context: IIngredientContext,
    id: IngredientId,
    ingredient: IngredientEntity
  ): Result<RuntimeGenericIngredient> {
    return Success.with(new RuntimeGenericIngredient(context, id, ingredient));
  }

  public get category(): IngredientCategory {
    return this._ingredient.category;
  }

  public get raw(): IngredientEntity {
    return this._ingredient;
  }
}
