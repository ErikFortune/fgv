[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [Validation](../README.md) / toBaseSessionId

# Function: toBaseSessionId()

> **toBaseSessionId**(`from`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`BaseSessionId`](../../../../type-aliases/BaseSessionId.md)\>

Defined in: [ts-chocolate/src/packlets/common/validation.ts:449](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/common/validation.ts#L449)

Validates unknown value is a [BaseSessionId](../../../../type-aliases/BaseSessionId.md).

## Parameters

### from

`unknown`

Value to validate

## Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`BaseSessionId`](../../../../type-aliases/BaseSessionId.md)\>

`Success` with [BaseSessionId](../../../../type-aliases/BaseSessionId.md) or `Failure` with an error
message if validation fails.
