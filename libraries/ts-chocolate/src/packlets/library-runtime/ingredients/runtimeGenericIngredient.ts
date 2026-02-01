import { Result, Success } from '@fgv/ts-utils';

import { IngredientCategory, IngredientId } from '../../common';
import { Ingredient } from '../../entities';
import { IIngredientContext, IRuntimeIngredient } from '../model';
import { RuntimeIngredientBase } from './runtimeIngredientBase';

export class RuntimeGenericIngredient extends RuntimeIngredientBase implements IRuntimeIngredient {
  protected constructor(context: IIngredientContext, id: IngredientId, ingredient: Ingredient) {
    super(context, id, ingredient);
  }

  public static create(
    context: IIngredientContext,
    id: IngredientId,
    ingredient: Ingredient
  ): Result<RuntimeGenericIngredient> {
    return Success.with(new RuntimeGenericIngredient(context, id, ingredient));
  }

  public get category(): IngredientCategory {
    return this._ingredient.category;
  }

  public get raw(): Ingredient {
    return this._ingredient;
  }
}
