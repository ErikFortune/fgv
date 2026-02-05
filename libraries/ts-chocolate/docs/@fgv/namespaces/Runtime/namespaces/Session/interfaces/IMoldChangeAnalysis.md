[**@fgv/ts-chocolate**](../../../../../../README.md)

***

[@fgv/ts-chocolate](../../../../../../README.md) / [Runtime](../../../README.md) / [Session](../README.md) / IMoldChangeAnalysis

# Interface: IMoldChangeAnalysis

Defined in: [ts-chocolate/src/packlets/runtime/session/model.ts:521](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/runtime/session/model.ts#L521)

Analysis of mold change impact on a molded bonbon confection.
Returned by setMold() to show weight changes before confirmation.

## Properties

### fillingSessionsAffected

> `readonly` **fillingSessionsAffected**: readonly [`SlotId`](../../../../../../type-aliases/SlotId.md)[]

Defined in: [ts-chocolate/src/packlets/runtime/session/model.ts:550](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/runtime/session/model.ts#L550)

Slot IDs of filling sessions that will be affected

***

### newMoldId

> `readonly` **newMoldId**: [`MoldId`](../../../../../../type-aliases/MoldId.md)

Defined in: [ts-chocolate/src/packlets/runtime/session/model.ts:530](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/runtime/session/model.ts#L530)

ID of the proposed new mold

***

### newTotalWeight

> `readonly` **newTotalWeight**: [`Measurement`](../../../../../../type-aliases/Measurement.md)

Defined in: [ts-chocolate/src/packlets/runtime/session/model.ts:540](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/runtime/session/model.ts#L540)

Total cavity weight with new mold

***

### oldMoldId

> `readonly` **oldMoldId**: [`MoldId`](../../../../../../type-aliases/MoldId.md)

Defined in: [ts-chocolate/src/packlets/runtime/session/model.ts:525](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/runtime/session/model.ts#L525)

ID of the current mold

***

### oldTotalWeight

> `readonly` **oldTotalWeight**: [`Measurement`](../../../../../../type-aliases/Measurement.md)

Defined in: [ts-chocolate/src/packlets/runtime/session/model.ts:535](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/runtime/session/model.ts#L535)

Total cavity weight with current mold

***

### requiresRescaling

> `readonly` **requiresRescaling**: `boolean`

Defined in: [ts-chocolate/src/packlets/runtime/session/model.ts:555](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/runtime/session/model.ts#L555)

Whether the weight change requires rescaling fillings

***

### weightDelta

> `readonly` **weightDelta**: [`Measurement`](../../../../../../type-aliases/Measurement.md)

Defined in: [ts-chocolate/src/packlets/runtime/session/model.ts:545](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/runtime/session/model.ts#L545)

Weight difference (positive = more filling needed)
