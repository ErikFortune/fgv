[**@fgv/ts-utils**](../../../../README.md)

***

[@fgv/ts-utils](../../../../README.md) / [Converters](../README.md) / tuple

# Function: tuple()

> **tuple**\<`T`, `TC`\>(`converters`): [`Converter`](../../Conversion/interfaces/Converter.md)\<[`ConverterResultTypes`](../../Conversion/type-aliases/ConverterResultTypes.md)\<`T`\>, `TC`\>

Creates a [Converter](../../Conversion/interfaces/Converter.md) that converts an array to a strongly-typed tuple,
using the supplied tuple of [Converters](../../Conversion/interfaces/Converter.md) to convert each element.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` *extends* readonly [`Converter`](../../Conversion/interfaces/Converter.md)\<`unknown`, `TC`\>[] | - |
| `TC` | `unknown` |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `converters` | \[`...T[]`\] | A tuple of [Converters](../../Conversion/interfaces/Converter.md) defining the expected types for each element of the tuple. |

## Returns

[`Converter`](../../Conversion/interfaces/Converter.md)\<[`ConverterResultTypes`](../../Conversion/type-aliases/ConverterResultTypes.md)\<`T`\>, `TC`\>

A [Converter](../../Conversion/interfaces/Converter.md) that returns a strongly-typed tuple.

## Remarks

The resulting [Converter](../../Conversion/interfaces/Converter.md) returns [Success](../../../../classes/Success.md) with a tuple
containing the converted values if all conversions succeed. Returns [Failure](../../../../classes/Failure.md)
with an error message if the source is not an array, has the wrong number of elements, or
any element conversion fails.

## Example

```typescript
const converter = tuple([Converters.string, Converters.number, Converters.boolean]);
// Type is Converter<[string, number, boolean]>

converter.convert(['hello', 42, true]);
// Returns Success with ['hello', 42, true]
```
