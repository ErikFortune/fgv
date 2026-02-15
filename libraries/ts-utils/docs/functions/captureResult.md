[**@fgv/ts-utils**](../README.md)

***

[@fgv/ts-utils](../README.md) / captureResult

# Function: captureResult()

> **captureResult**\<`T`\>(`func`): [`Result`](../type-aliases/Result.md)\<`T`\>

Wraps a function which might throw to convert exception results
to [Failure](../classes/Failure.md).

## Type Parameters

| Type Parameter |
| ------ |
| `T` |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `func` | () => `T` | The function to be captured. |

## Returns

[`Result`](../type-aliases/Result.md)\<`T`\>

Returns [Success](../classes/Success.md) with a value of type `<T>` on
success , or [Failure](../classes/Failure.md) with the thrown error message if
`func` throws an `Error`.
