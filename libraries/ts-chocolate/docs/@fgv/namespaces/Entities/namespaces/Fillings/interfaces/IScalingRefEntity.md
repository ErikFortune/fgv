[**@fgv/ts-chocolate**](../../../../../../README.md)

***

[@fgv/ts-chocolate](../../../../../../README.md) / [Entities](../../../README.md) / [Fillings](../README.md) / IScalingRefEntity

# Interface: IScalingRefEntity

Defined in: [ts-chocolate/src/packlets/entities/fillings/model.ts:326](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/entities/fillings/model.ts#L326)

Lightweight scaling reference - the default storage format for scaled filling recipes.
Stores only the reference and scale parameters, not ingredient snapshots.

## Properties

### createdDate

> `readonly` **createdDate**: `string`

Defined in: [ts-chocolate/src/packlets/entities/fillings/model.ts:345](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/entities/fillings/model.ts#L345)

Date the scaling was created (ISO 8601 format)

***

### scaleFactor

> `readonly` **scaleFactor**: `number`

Defined in: [ts-chocolate/src/packlets/entities/fillings/model.ts:335](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/entities/fillings/model.ts#L335)

Scaling factor applied

***

### sourceVersionId

> `readonly` **sourceVersionId**: [`FillingVersionId`](../../../../../../type-aliases/FillingVersionId.md)

Defined in: [ts-chocolate/src/packlets/entities/fillings/model.ts:330](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/entities/fillings/model.ts#L330)

Source filling recipe version ID (format: "sourceId.fillingId@versionSpec")

***

### targetWeight

> `readonly` **targetWeight**: [`Measurement`](../../../../../../type-aliases/Measurement.md)

Defined in: [ts-chocolate/src/packlets/entities/fillings/model.ts:340](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/entities/fillings/model.ts#L340)

Target weight requested
