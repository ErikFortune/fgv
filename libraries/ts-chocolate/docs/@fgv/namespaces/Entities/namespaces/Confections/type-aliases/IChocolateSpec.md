[**@fgv/ts-chocolate**](../../../../../../README.md)

***

[@fgv/ts-chocolate](../../../../../../README.md) / [Entities](../../../README.md) / [Confections](../README.md) / IChocolateSpec

# Type Alias: IChocolateSpec

> **IChocolateSpec** = [`IIdsWithPreferred`](../../../../Model/interfaces/IIdsWithPreferred.md)\<[`IngredientId`](../../../../../../type-aliases/IngredientId.md)\>

Defined in: [ts-chocolate/src/packlets/entities/confections/model.ts:183](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/entities/confections/model.ts#L183)

Chocolate specification for shell, enrobing, or coating.
Uses IIdsWithPreferred pattern - `ids` contains all valid chocolates,
`preferredId` indicates the default/recommended one.
