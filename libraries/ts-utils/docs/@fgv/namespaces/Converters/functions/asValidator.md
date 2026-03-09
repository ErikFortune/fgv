[**@fgv/ts-utils**](../../../../README.md)

***

[@fgv/ts-utils](../../../../README.md) / [Converters](../README.md) / asValidator

# Function: asValidator()

> **asValidator**\<`T`, `TC`\>(`converterOrValidator`): [`Validator`](../../Validation/interfaces/Validator.md)\<`T`, `TC`\>

Helper function to create a [Validator](../../Validation/interfaces/Validator.md) from any [Converter](../../Conversion/interfaces/Converter.md)
or [Validator](../../Validation/interfaces/Validator.md).

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | - |
| `TC` | `unknown` |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `converterOrValidator` | [`Converter`](../../Conversion/interfaces/Converter.md)\<`T`, `TC`\> \| [`Validator`](../../Validation/interfaces/Validator.md)\<`T`, `TC`\> | the [Converter](../../Conversion/interfaces/Converter.md) to be wrappped or [Validator](../../Validation/interfaces/Validator.md) to be used directly. |

## Returns

[`Validator`](../../Validation/interfaces/Validator.md)\<`T`, `TC`\>

A [Validator](../../Validation/interfaces/Validator.md) which uses the supplied converter or validator.
