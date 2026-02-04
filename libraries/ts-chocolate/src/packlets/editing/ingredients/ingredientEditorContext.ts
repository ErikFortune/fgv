// Copyright (c) 2024 Erik Fortune
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
 * Ingredient editor context implementation
 * @packageDocumentation
 */

import { Result, Success } from '@fgv/ts-utils';
import { ValidatingEditorContext } from '../validatingEditorContext';
import { EditableCollection } from '../editableCollection';
import { IngredientEntity, Converters as EntityConverters } from '../../entities';
import { BaseIngredientId, Converters as CommonConverters, IngredientId } from '../../common';
import { validateIngredientEntity } from './validators';

// ============================================================================
// Ingredient Editor Context
// ============================================================================

/**
 * Editor context specialized for Ingredient entities.
 * Extends ValidatingEditorContext to provide both pre-validated (base)
 * and raw input (validating) methods for ingredient CRUD operations.
 * @public
 */
export class IngredientEditorContext extends ValidatingEditorContext<
  IngredientEntity,
  BaseIngredientId,
  IngredientId
> {
  /**
   * Create an ingredient editor context from a collection.
   * @param collection - Mutable collection of ingredients
   * @returns Result containing the editor context or failure
   * @public
   */
  public static createFromCollection(
    collection: EditableCollection<IngredientEntity, BaseIngredientId>
  ): Result<IngredientEditorContext> {
    return ValidatingEditorContext.createValidating<IngredientEntity, BaseIngredientId, IngredientId>({
      collection,
      entityConverter: EntityConverters.Ingredients.ingredientEntity,
      keyConverter: CommonConverters.baseIngredientId,
      semanticValidator: validateIngredientEntity,
      createId: CommonConverters.ingredientId,
      /* c8 ignore next 1 - getBaseId reserved for future use by EditorContext but not yet called */
      getBaseId: (ingredient: IngredientEntity) => ingredient.baseId,
      getName: (ingredient: IngredientEntity) => ingredient.name
    }).onSuccess((baseContext) => {
      // Wrap in ingredient-specific context
      return Success.with(
        Object.setPrototypeOf(baseContext, IngredientEditorContext.prototype) as IngredientEditorContext
      );
    });
  }

  /**
   * Get the ingredient name for display purposes.
   * @param ingredient - Ingredient to get name from
   * @returns Ingredient name
   * @public
   */
  public getIngredientName(ingredient: IngredientEntity): string {
    return ingredient.name;
  }

  /**
   * Get the ingredient category.
   * @param ingredient - Ingredient to get category from
   * @returns Ingredient category
   * @public
   */
  public getIngredientCategory(ingredient: IngredientEntity): string {
    return ingredient.category;
  }
}
