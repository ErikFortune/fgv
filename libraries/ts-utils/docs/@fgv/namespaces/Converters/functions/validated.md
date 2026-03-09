[**@fgv/ts-utils**](../../../../README.md)

***

[@fgv/ts-utils](../../../../README.md) / [Converters](../README.md) / validated

# Function: validated()

> **validated**\<`T`, `TC`\>(`converterOrValidator`): [`Converter`](../../Conversion/interfaces/Converter.md)\<`T`, `TC`\>

Helper function to create a [Converter](../../Conversion/interfaces/Converter.md) from any [Validation.Validator](../../Validation/interfaces/Validator.md)

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | - |
| `TC` | `unknown` |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `converterOrValidator` | [`Validator`](../../Validation/interfaces/Validator.md)\<`T`, `TC`\> \| [`Converter`](../../Conversion/interfaces/Converter.md)\<`T`, `TC`\> | the [Validation.Validator](../../Validation/interfaces/Validator.md) to be wrapped or [Converter](../../Conversion/interfaces/Converter.md) to be used directly. |

## Returns

[`Converter`](../../Conversion/interfaces/Converter.md)\<`T`, `TC`\>

A [Converter](../../Conversion/interfaces/Converter.md) which uses the supplied validator.
