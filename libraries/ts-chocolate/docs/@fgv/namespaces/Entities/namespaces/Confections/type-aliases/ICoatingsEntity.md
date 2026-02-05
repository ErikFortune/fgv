[**@fgv/ts-chocolate**](../../../../../../README.md)

***

[@fgv/ts-chocolate](../../../../../../README.md) / [Entities](../../../README.md) / [Confections](../README.md) / ICoatingsEntity

# Type Alias: ICoatingsEntity

> **ICoatingsEntity** = [`IIdsWithPreferred`](../../../../Model/interfaces/IIdsWithPreferred.md)\<[`IngredientId`](../../../../../../type-aliases/IngredientId.md)\>

Defined in: [ts-chocolate/src/packlets/entities/confections/model.ts:246](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/entities/confections/model.ts#L246)

Coating specification for rolled truffles.
Uses IIdsWithPreferred pattern - `ids` contains all valid coating ingredients,
`preferredId` indicates the default/recommended one.
