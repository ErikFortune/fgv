[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryRuntime](../README.md) / IResolvedFillingSlot

# Interface: IResolvedFillingSlot

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1251](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1251)

A resolved filling slot with resolved recipe/ingredient references.

## Properties

### filling

> `readonly` **filling**: [`IOptionsWithPreferred`](../../Model/interfaces/IOptionsWithPreferred.md)\<[`IResolvedFillingOption`](../type-aliases/IResolvedFillingOption.md), [`FillingOptionId`](../../Entities/namespaces/Confections/type-aliases/FillingOptionId.md)\>

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1257](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1257)

Resolved filling options with preferred selection

***

### name?

> `readonly` `optional` **name**: `string`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1255](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1255)

Human-readable name for display

***

### slotId

> `readonly` **slotId**: [`SlotId`](../../../../type-aliases/SlotId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1253](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1253)

Unique identifier for this slot within the confection
