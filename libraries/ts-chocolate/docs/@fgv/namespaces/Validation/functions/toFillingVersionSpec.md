[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [Validation](../README.md) / toFillingVersionSpec

# Function: toFillingVersionSpec()

> **toFillingVersionSpec**(`from`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`FillingVersionSpec`](../../../../type-aliases/FillingVersionSpec.md)\>

Defined in: [ts-chocolate/src/packlets/common/validation.ts:371](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/common/validation.ts#L371)

Validates unknown value is a [FillingVersionSpec](../../../../type-aliases/FillingVersionSpec.md).

## Parameters

### from

`unknown`

Value to validate

## Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`FillingVersionSpec`](../../../../type-aliases/FillingVersionSpec.md)\>

`Success` with [FillingVersionSpec](../../../../type-aliases/FillingVersionSpec.md) or `Failure` with an error
message if validation fails.
