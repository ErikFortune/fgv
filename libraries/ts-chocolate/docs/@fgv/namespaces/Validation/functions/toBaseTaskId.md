[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [Validation](../README.md) / toBaseTaskId

# Function: toBaseTaskId()

> **toBaseTaskId**(`from`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`BaseTaskId`](../../../../type-aliases/BaseTaskId.md)\>

Defined in: [ts-chocolate/src/packlets/common/validation.ts:219](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/common/validation.ts#L219)

Validates unknown value is a [BaseTaskId](../../../../type-aliases/BaseTaskId.md).

## Parameters

### from

`unknown`

Value to validate

## Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`BaseTaskId`](../../../../type-aliases/BaseTaskId.md)\>

`Success` with [BaseTaskId](../../../../type-aliases/BaseTaskId.md) or `Failure` with an error
message if validation fails.
