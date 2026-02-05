[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryRuntime](../README.md) / FillingRecipeIngredientsFilter

# Type Alias: FillingRecipeIngredientsFilter

> **FillingRecipeIngredientsFilter** = `string` \| `RegExp` \| [`ICategoryFilter`](../interfaces/ICategoryFilter.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:350](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L350)

Filter for recipe ingredients.
- string: Match ingredient ID exactly
- RegExp: Match ingredient ID by pattern
- ICategoryFilter: Match by category
