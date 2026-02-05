[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryRuntime](../README.md) / FillingRecipeIngredientsFilter

# Type Alias: FillingRecipeIngredientsFilter

> **FillingRecipeIngredientsFilter** = `string` \| `RegExp` \| [`ICategoryFilter`](../interfaces/ICategoryFilter.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:350](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L350)

Filter for recipe ingredients.
- string: Match ingredient ID exactly
- RegExp: Match ingredient ID by pattern
- ICategoryFilter: Match by category
