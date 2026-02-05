[**@fgv/ts-chocolate**](../../../../../../README.md)

***

[@fgv/ts-chocolate](../../../../../../README.md) / [LibraryRuntime](../../../README.md) / [Indexers](../README.md) / IFillingRecipesByIngredientConfig

# Interface: IFillingRecipesByIngredientConfig

Defined in: [ts-chocolate/src/packlets/library-runtime/indexers/fillingRecipesByIngredientIndexer.ts:45](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/indexers/fillingRecipesByIngredientIndexer.ts#L45)

Configuration for the RecipesByIngredient indexer.

## Properties

### ingredientId

> `readonly` **ingredientId**: [`IngredientId`](../../../../../../type-aliases/IngredientId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/indexers/fillingRecipesByIngredientIndexer.ts:49](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/indexers/fillingRecipesByIngredientIndexer.ts#L49)

The ingredient ID to search for.

***

### usageType?

> `readonly` `optional` **usageType**: [`IngredientUsageType`](../type-aliases/IngredientUsageType.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/indexers/fillingRecipesByIngredientIndexer.ts:58](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/indexers/fillingRecipesByIngredientIndexer.ts#L58)

Filter by usage type.
- 'primary': Only recipes where ingredient is primary
- 'alternate': Only recipes where ingredient is alternate
- 'any': Any usage
Defaults to 'any'.
