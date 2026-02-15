[**@fgv/ts-utils**](../../../../README.md)

***

[@fgv/ts-utils](../../../../README.md) / [Converters](../README.md) / generic

# Function: generic()

> **generic**\<`T`, `TC`\>(`convert`): [`Converter`](../../Conversion/interfaces/Converter.md)\<`T`, `TC`\>

Helper function to create a [Converter](../../Conversion/interfaces/Converter.md) from a supplied [ConverterFunc](../../Conversion/type-aliases/ConverterFunc.md).

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | - |
| `TC` | `unknown` |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `convert` | [`ConverterFunc`](../../Conversion/type-aliases/ConverterFunc.md)\<`T`, `TC`\> | the function to be wrapped |

## Returns

[`Converter`](../../Conversion/interfaces/Converter.md)\<`T`, `TC`\>

A [Converter](../../Conversion/interfaces/Converter.md) which uses the supplied function.
