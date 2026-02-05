[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryRuntime](../README.md) / ICategoryFilter

# Interface: ICategoryFilter

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:334](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L334)

Filter by ingredient category.

## Properties

### category

> `readonly` **category**: `RegExp` \| [`IngredientCategory`](../../../../type-aliases/IngredientCategory.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:340](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L340)

Category to match (literal or regex).
- Literal: exact category match (e.g., 'chocolate')
- RegExp: pattern match against category string
