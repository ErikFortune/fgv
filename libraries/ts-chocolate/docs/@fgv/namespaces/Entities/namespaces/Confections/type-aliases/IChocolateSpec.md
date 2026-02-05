[**@fgv/ts-chocolate**](../../../../../../README.md)

***

[@fgv/ts-chocolate](../../../../../../README.md) / [Entities](../../../README.md) / [Confections](../README.md) / IChocolateSpec

# Type Alias: IChocolateSpec

> **IChocolateSpec** = [`IIdsWithPreferred`](../../../../Model/interfaces/IIdsWithPreferred.md)\<[`IngredientId`](../../../../../../type-aliases/IngredientId.md)\>

Defined in: [ts-chocolate/src/packlets/entities/confections/model.ts:183](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/entities/confections/model.ts#L183)

Chocolate specification for shell, enrobing, or coating.
Uses IIdsWithPreferred pattern - `ids` contains all valid chocolates,
`preferredId` indicates the default/recommended one.
