[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryRuntime](../README.md) / IResolvedFillingSlot

# Interface: IResolvedFillingSlot

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1256](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1256)

A resolved filling slot with resolved recipe/ingredient references.

## Properties

### filling

> `readonly` **filling**: [`IOptionsWithPreferred`](../../Model/interfaces/IOptionsWithPreferred.md)\<[`IResolvedFillingOption`](../type-aliases/IResolvedFillingOption.md), [`FillingOptionId`](../../Entities/namespaces/Confections/type-aliases/FillingOptionId.md)\>

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1262](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1262)

Resolved filling options with preferred selection

***

### name?

> `readonly` `optional` **name**: `string`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1260](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1260)

Human-readable name for display

***

### slotId

> `readonly` **slotId**: [`SlotId`](../../../../type-aliases/SlotId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1258](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1258)

Unique identifier for this slot within the confection
