[**@fgv/ts-utils**](../../../../README.md)

***

[@fgv/ts-utils](../../../../README.md) / [Converters](../README.md) / mappedEnumeratedValue

# Function: mappedEnumeratedValue()

> **mappedEnumeratedValue**\<`T`, `TC`\>(`map`, `message?`): [`Converter`](../../Conversion/interfaces/Converter.md)\<`T`, readonly `TC`[]\>

Helper function to create a [Converter](../../Conversion/interfaces/Converter.md) which converts `unknown` to one of a set of supplied enumerated
values, mapping any of multiple supplied values to the enumeration.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | - |
| `TC` | `unknown` |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `map` | readonly \[`T`, readonly `TC`[]\][] | An array of tuples describing the mapping. The first element of each tuple is the result value, the second is the set of values that map to the result. Tuples are evaluated in the order supplied and are not checked for duplicates. |
| `message?` | `string` | An optional error message. |

## Returns

[`Converter`](../../Conversion/interfaces/Converter.md)\<`T`, readonly `TC`[]\>

A [Converter](../../Conversion/interfaces/Converter.md) which applies the mapping and yields `<T>` on success.

## Remarks

Enables mapping of multiple input values to a consistent internal representation (so e.g. `'y'`, `'yes'`,
`'true'`, `1` and `true` can all map to boolean `true`)
