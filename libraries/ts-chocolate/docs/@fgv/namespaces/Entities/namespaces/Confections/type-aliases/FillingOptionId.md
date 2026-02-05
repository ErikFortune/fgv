[**@fgv/ts-chocolate**](../../../../../../README.md)

***

[@fgv/ts-chocolate](../../../../../../README.md) / [Entities](../../../README.md) / [Confections](../README.md) / FillingOptionId

# Type Alias: FillingOptionId

> **FillingOptionId** = [`FillingId`](../../../../../../type-aliases/FillingId.md) \| [`IngredientId`](../../../../../../type-aliases/IngredientId.md)

Defined in: [ts-chocolate/src/packlets/entities/confections/model.ts:124](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/entities/confections/model.ts#L124)

Union type for filling option IDs.
Can be either a RecipeId or IngredientId - disambiguation happens via the type discriminator.
