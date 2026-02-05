[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryRuntime](../README.md) / ICategoryFilter

# Interface: ICategoryFilter

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:334](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L334)

Filter by ingredient category.

## Properties

### category

> `readonly` **category**: `RegExp` \| [`IngredientCategory`](../../../../type-aliases/IngredientCategory.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:340](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L340)

Category to match (literal or regex).
- Literal: exact category match (e.g., 'chocolate')
- RegExp: pattern match against category string
