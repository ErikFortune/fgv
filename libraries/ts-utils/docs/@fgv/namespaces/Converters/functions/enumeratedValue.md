[**@fgv/ts-utils**](../../../../README.md)

***

[@fgv/ts-utils](../../../../README.md) / [Converters](../README.md) / enumeratedValue

# Function: enumeratedValue()

> **enumeratedValue**\<`T`\>(`values`): [`Converter`](../../Conversion/interfaces/Converter.md)\<`T`, readonly `T`[]\>

Helper function to create a [Converter](../../Conversion/interfaces/Converter.md) which converts `unknown` to one of a set of supplied
enumerated values. Anything else fails.

## Type Parameters

| Type Parameter |
| ------ |
| `T` |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `values` | readonly `T`[] | Array of allowed values. |

## Returns

[`Converter`](../../Conversion/interfaces/Converter.md)\<`T`, readonly `T`[]\>

A new [Converter](../../Conversion/interfaces/Converter.md) returning `<T>`.

## Remarks

Allowed enumerated values can also be supplied as context at conversion time.
