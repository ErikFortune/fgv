[**@fgv/ts-utils**](../../../../README.md)

***

[@fgv/ts-utils](../../../../README.md) / [Converters](../README.md) / delimitedString

# Function: delimitedString()

> **delimitedString**(`delimiter`, `options`): [`Converter`](../../Conversion/interfaces/Converter.md)\<`string`[], `string`\>

Helper function to create a [Converter](../../Conversion/interfaces/Converter.md) which converts any `string` into an
array of `string`, by separating at a supplied delimiter.

## Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `delimiter` | `string` | `undefined` | The delimiter at which to split. |
| `options` | `"all"` \| `"filtered"` | `'filtered'` | - |

## Returns

[`Converter`](../../Conversion/interfaces/Converter.md)\<`string`[], `string`\>

A new [Converter](../../Conversion/interfaces/Converter.md) returning `string[]`.

## Remarks

Delimiter may also be supplied as context at conversion time.
