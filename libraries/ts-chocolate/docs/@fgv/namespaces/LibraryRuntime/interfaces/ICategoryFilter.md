[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryRuntime](../README.md) / ICategoryFilter

# Interface: ICategoryFilter

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:339](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L339)

Filter by ingredient category.

## Properties

### category

> `readonly` **category**: `RegExp` \| [`IngredientCategory`](../../../../type-aliases/IngredientCategory.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:345](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L345)

Category to match (literal or regex).
- Literal: exact category match (e.g., 'chocolate')
- RegExp: pattern match against category string
