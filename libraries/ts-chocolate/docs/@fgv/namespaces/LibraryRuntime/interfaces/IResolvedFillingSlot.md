[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryRuntime](../README.md) / IResolvedFillingSlot

# Interface: IResolvedFillingSlot

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1284](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1284)

A resolved filling slot with resolved recipe/ingredient references.

## Properties

### filling

> `readonly` **filling**: [`IOptionsWithPreferred`](../../Model/interfaces/IOptionsWithPreferred.md)\<[`IResolvedFillingOption`](../type-aliases/IResolvedFillingOption.md), [`FillingOptionId`](../../Entities/namespaces/Confections/type-aliases/FillingOptionId.md)\>

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1290](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1290)

Resolved filling options with preferred selection

***

### name?

> `readonly` `optional` **name**: `string`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1288](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1288)

Human-readable name for display

***

### slotId

> `readonly` **slotId**: [`SlotId`](../../../../type-aliases/SlotId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1286](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1286)

Unique identifier for this slot within the confection
