[**@fgv/ts-chocolate**](../../../../../../README.md)

***

[@fgv/ts-chocolate](../../../../../../README.md) / [Runtime](../../../README.md) / [Session](../README.md) / ISessionProcedure

# Interface: ISessionProcedure

Defined in: [ts-chocolate/src/packlets/runtime/session/model.ts:331](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/runtime/session/model.ts#L331)

Tracks the selected procedure for a confection session

## Properties

### originalProcedureId?

> `readonly` `optional` **originalProcedureId**: [`ProcedureId`](../../../../../../type-aliases/ProcedureId.md)

Defined in: [ts-chocolate/src/packlets/runtime/session/model.ts:340](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/runtime/session/model.ts#L340)

The original procedure ID when the session started

***

### procedureId

> `readonly` **procedureId**: [`ProcedureId`](../../../../../../type-aliases/ProcedureId.md)

Defined in: [ts-chocolate/src/packlets/runtime/session/model.ts:335](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/runtime/session/model.ts#L335)

The currently selected procedure ID

***

### status

> `readonly` **status**: [`ConfectionSelectionStatus`](../type-aliases/ConfectionSelectionStatus.md)

Defined in: [ts-chocolate/src/packlets/runtime/session/model.ts:345](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/runtime/session/model.ts#L345)

Current status of the procedure selection
