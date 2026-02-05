[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [Validation](../README.md) / toSlotId

# Function: toSlotId()

> **toSlotId**(`from`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`SlotId`](../../../../type-aliases/SlotId.md)\>

Defined in: [ts-chocolate/src/packlets/common/validation.ts:733](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/common/validation.ts#L733)

Validates unknown value is a [SlotId](../../../../type-aliases/SlotId.md).

## Parameters

### from

`unknown`

Value to validate

## Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`SlotId`](../../../../type-aliases/SlotId.md)\>

`Success` with [SlotId](../../../../type-aliases/SlotId.md) or `Failure` with an error
message if validation fails.
