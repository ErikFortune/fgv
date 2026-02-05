[**@fgv/ts-chocolate**](../../../../../../README.md)

***

[@fgv/ts-chocolate](../../../../../../README.md) / [Entities](../../../README.md) / [Fillings](../README.md) / IIngredientSnapshotEntity

# Interface: IIngredientSnapshotEntity

Defined in: [ts-chocolate/src/packlets/entities/fillings/model.ts:353](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/entities/fillings/model.ts#L353)

Optional ingredient snapshot for archival purposes.
Used when the source filling recipe might become unavailable.

## Properties

### ingredientId

> `readonly` **ingredientId**: [`IngredientId`](../../../../../../type-aliases/IngredientId.md)

Defined in: [ts-chocolate/src/packlets/entities/fillings/model.ts:357](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/entities/fillings/model.ts#L357)

The ingredient ID

***

### notes?

> `readonly` `optional` **notes**: readonly [`ICategorizedNote`](../../../../Model/interfaces/ICategorizedNote.md)[]

Defined in: [ts-chocolate/src/packlets/entities/fillings/model.ts:372](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/entities/fillings/model.ts#L372)

Optional categorized notes for this ingredient

***

### originalAmount

> `readonly` **originalAmount**: [`Measurement`](../../../../../../type-aliases/Measurement.md)

Defined in: [ts-chocolate/src/packlets/entities/fillings/model.ts:362](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/entities/fillings/model.ts#L362)

Original amount before scaling

***

### scaledAmount

> `readonly` **scaledAmount**: [`Measurement`](../../../../../../type-aliases/Measurement.md)

Defined in: [ts-chocolate/src/packlets/entities/fillings/model.ts:367](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/entities/fillings/model.ts#L367)

Scaled amount after applying scale factor
