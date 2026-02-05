[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryRuntime](../README.md) / Ingredient

# Abstract Class: Ingredient

Defined in: [ts-chocolate/src/packlets/library-runtime/ingredients/ingredient.ts:75](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/ingredients/ingredient.ts#L75)

Static factory for creating runtime ingredients.
This class cannot be instantiated - use create() to get the appropriate concrete type.

## Example

```typescript
const result = Ingredient.create(context, id, ingredient);
if (result.isSuccess()) {
  const ingredient = result.value;
  if (ingredient.isChocolate()) {
    console.log(ingredient.chocolateType);
  }
}
```

## Methods

### create()

> `static` **create**(`context`, `id`, `ingredient`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`AnyIngredient`](../type-aliases/AnyIngredient.md)\>

Defined in: [ts-chocolate/src/packlets/library-runtime/ingredients/ingredient.ts:87](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/ingredients/ingredient.ts#L87)

Factory method that auto-detects ingredient type and returns appropriate concrete class.

#### Parameters

##### context

[`IIngredientContext`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-chocolate/docs)

The runtime context for navigation

##### id

[`IngredientId`](../../../../type-aliases/IngredientId.md)

The ingredient ID

##### ingredient

[`IngredientEntity`](../../Entities/type-aliases/IngredientEntity.md)

The ingredient data entity

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`AnyIngredient`](../type-aliases/AnyIngredient.md)\>

Success with the appropriate concrete Ingredient subclass, or Failure for unknown category
