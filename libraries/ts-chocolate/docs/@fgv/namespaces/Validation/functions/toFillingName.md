[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [Validation](../README.md) / toFillingName

# Function: toFillingName()

> **toFillingName**(`from`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`FillingName`](../../../../type-aliases/FillingName.md)\>

Defined in: [ts-chocolate/src/packlets/common/validation.ts:323](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/common/validation.ts#L323)

Validates unknown value is a [FillingName](../../../../type-aliases/FillingName.md).

## Parameters

### from

`unknown`

Value to validate

## Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`FillingName`](../../../../type-aliases/FillingName.md)\>

`Success` with [FillingName](../../../../type-aliases/FillingName.md) or `Failure` with an error
message if validation fails.
