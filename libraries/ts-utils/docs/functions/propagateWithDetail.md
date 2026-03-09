[**@fgv/ts-utils**](../README.md)

***

[@fgv/ts-utils](../README.md) / propagateWithDetail

# Function: propagateWithDetail()

> **propagateWithDetail**\<`T`, `TD`\>(`result`, `detail`, `successDetail?`): [`DetailedResult`](../type-aliases/DetailedResult.md)\<`T`, `TD`\>

Propagates a [Success](../classes/Success.md) or [Failure](../classes/Failure.md) [Result](../type-aliases/Result.md), adding supplied
event details as appropriate.

## Type Parameters

| Type Parameter |
| ------ |
| `T` |
| `TD` |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `result` | [`Result`](../type-aliases/Result.md)\<`T`\> | The [Result](../type-aliases/Result.md) to be propagated. |
| `detail` | `TD` | The event detail (type `<TD>`) to be added to the [result](../type-aliases/Result.md). |
| `successDetail?` | `TD` | An optional distinct event detail to be added to [Success](../classes/Success.md) results. If `successDetail` is omitted or `undefined`, then `detail` will be applied to [Success](../classes/Success.md) results. |

## Returns

[`DetailedResult`](../type-aliases/DetailedResult.md)\<`T`, `TD`\>

A new [DetailedResult\<T, TD\>](../type-aliases/DetailedResult.md) with the success value or error
message from the original `result` but with the specified detail added.
