[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [Validation](../README.md) / toSessionSpec

# Function: toSessionSpec()

> **toSessionSpec**(`from`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`SessionSpec`](../../../../type-aliases/SessionSpec.md)\>

Defined in: [ts-chocolate/src/packlets/common/validation.ts:423](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/common/validation.ts#L423)

Validates unknown value is a [SessionSpec](../../../../type-aliases/SessionSpec.md).

## Parameters

### from

`unknown`

Value to validate

## Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`SessionSpec`](../../../../type-aliases/SessionSpec.md)\>

`Success` with [SessionSpec](../../../../type-aliases/SessionSpec.md) or `Failure` with an error
message if validation fails.
