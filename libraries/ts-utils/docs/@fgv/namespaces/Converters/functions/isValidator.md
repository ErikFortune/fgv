[**@fgv/ts-utils**](../../../../README.md)

***

[@fgv/ts-utils](../../../../README.md) / [Converters](../README.md) / isValidator

# Function: isValidator()

> **isValidator**\<`T`, `TC`\>(`converterOrValidator`): `converterOrValidator is Validator<T, TC>`

Determines if a supplied [Converter](../../Conversion/interfaces/Converter.md) or [Validator](../../Validation/interfaces/Validator.md) is
a [Validator](../../Validation/interfaces/Validator.md).

## Type Parameters

| Type Parameter |
| ------ |
| `T` |
| `TC` |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `converterOrValidator` | [`Converter`](../../Conversion/interfaces/Converter.md)\<`T`, `TC`\> \| [`Validator`](../../Validation/interfaces/Validator.md)\<`T`, `TC`\> | The [Converter](../../Conversion/interfaces/Converter.md) or [Validator](../../Validation/interfaces/Validator.md) to be tested. |

## Returns

`converterOrValidator is Validator<T, TC>`

`true` if `converterOrValidator` is a [Validator](../../Validation/interfaces/Validator.md), `false` otherwise.
