[**@fgv/ts-json-base**](../../../../README.md)

***

[@fgv/ts-json-base](../../../../README.md) / [Converters](../README.md) / enumeratedValue

# Function: enumeratedValue()

> **enumeratedValue**\<`T`\>(`values`, `message?`): [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`, [`IJsonConverterContext`](../interfaces/IJsonConverterContext.md) \| readonly `T`[]\>

Helper function to create a `Converter` which converts `unknown` to one of a set of
supplied enumerated values. Anything else fails.

## Type Parameters

| Type Parameter |
| ------ |
| `T` |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `values` | readonly `T`[] | Array of allowed values. |
| `message?` | `string` | Optional custom failure message. |

## Returns

[`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`, [`IJsonConverterContext`](../interfaces/IJsonConverterContext.md) \| readonly `T`[]\>

A new `Converter` returning `<T>`.

## Remarks

This JSON variant accepts an `IJsonConverterContext` OR
a `ReadonlyArray<T>` as its conversion context. If the context is an array, it is used to override the
allowed values for that conversion; otherwise, the original `values` supplied at creation time are used.
