[**@fgv/ts-utils**](../README.md)

***

[@fgv/ts-utils](../README.md) / ResultMapValueType

# Type Alias: ResultMapValueType\<TCollection\>

> **ResultMapValueType**\<`TCollection`\> = `Exclude`\<[`IResultValueType`](IResultValueType.md)\<`ReturnType`\<`TCollection`\[`"get"`\]\>\>, `undefined`\>

**`Beta`**

Type inference to determine the value type returned from a result-map style
`get` method.

## Type Parameters

| Type Parameter |
| ------ |
| `TCollection` *extends* `object` |

## Remarks

Useful for extracting collection entry types from maps whose `get` method
returns an [IResult](../interfaces/IResult.md).
