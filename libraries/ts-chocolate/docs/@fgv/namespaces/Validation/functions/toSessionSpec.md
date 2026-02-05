[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [Validation](../README.md) / toSessionSpec

# Function: toSessionSpec()

> **toSessionSpec**(`from`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`SessionSpec`](../../../../type-aliases/SessionSpec.md)\>

Defined in: [ts-chocolate/src/packlets/common/validation.ts:423](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/common/validation.ts#L423)

Validates unknown value is a [SessionSpec](../../../../type-aliases/SessionSpec.md).

## Parameters

### from

`unknown`

Value to validate

## Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`SessionSpec`](../../../../type-aliases/SessionSpec.md)\>

`Success` with [SessionSpec](../../../../type-aliases/SessionSpec.md) or `Failure` with an error
message if validation fails.
