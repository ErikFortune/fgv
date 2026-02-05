[**@fgv/ts-chocolate**](../../../../../../README.md)

***

[@fgv/ts-chocolate](../../../../../../README.md) / [Runtime](../../../README.md) / [Session](../README.md) / ISessionMold

# Interface: ISessionMold

Defined in: [ts-chocolate/src/packlets/runtime/session/model.ts:253](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/runtime/session/model.ts#L253)

Tracks the selected mold for a confection session

## Properties

### moldId

> `readonly` **moldId**: [`MoldId`](../../../../../../type-aliases/MoldId.md)

Defined in: [ts-chocolate/src/packlets/runtime/session/model.ts:257](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/runtime/session/model.ts#L257)

The currently selected mold ID

***

### originalMoldId

> `readonly` **originalMoldId**: [`MoldId`](../../../../../../type-aliases/MoldId.md)

Defined in: [ts-chocolate/src/packlets/runtime/session/model.ts:262](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/runtime/session/model.ts#L262)

The original mold ID when the session started

***

### status

> `readonly` **status**: [`ConfectionSelectionStatus`](../type-aliases/ConfectionSelectionStatus.md)

Defined in: [ts-chocolate/src/packlets/runtime/session/model.ts:267](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/runtime/session/model.ts#L267)

Current status of the mold selection
