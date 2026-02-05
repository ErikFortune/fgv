[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryRuntime](../README.md) / FillingRecipeIngredientsFilter

# Type Alias: FillingRecipeIngredientsFilter

> **FillingRecipeIngredientsFilter** = `string` \| `RegExp` \| [`ICategoryFilter`](../interfaces/ICategoryFilter.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:355](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L355)

Filter for recipe ingredients.
- string: Match ingredient ID exactly
- RegExp: Match ingredient ID by pattern
- ICategoryFilter: Match by category
