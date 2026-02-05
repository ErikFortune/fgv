[**@fgv/ts-chocolate**](../../../../../../README.md)

***

[@fgv/ts-chocolate](../../../../../../README.md) / [Entities](../../../README.md) / [Confections](../README.md) / IFillingSlotEntity

# Interface: IFillingSlotEntity

Defined in: [ts-chocolate/src/packlets/entities/confections/model.ts:164](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/entities/confections/model.ts#L164)

A single filling slot with its own options and preferred selection.
Each slot can hold recipes OR ingredients (or both).

## Properties

### filling

> `readonly` **filling**: [`IOptionsWithPreferred`](../../../../Model/interfaces/IOptionsWithPreferred.md)\<[`AnyFillingOptionEntity`](../type-aliases/AnyFillingOptionEntity.md), [`FillingOptionId`](../type-aliases/FillingOptionId.md)\>

Defined in: [ts-chocolate/src/packlets/entities/confections/model.ts:170](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/entities/confections/model.ts#L170)

Available filling options with preferred selection

***

### name?

> `readonly` `optional` **name**: `string`

Defined in: [ts-chocolate/src/packlets/entities/confections/model.ts:168](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/entities/confections/model.ts#L168)

Human-readable name for display (e.g., "Inner Layer", "Ganache Center")

***

### slotId

> `readonly` **slotId**: [`SlotId`](../../../../../../type-aliases/SlotId.md)

Defined in: [ts-chocolate/src/packlets/entities/confections/model.ts:166](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/entities/confections/model.ts#L166)

Unique identifier for this slot within the confection (e.g., "layer1", "center")
