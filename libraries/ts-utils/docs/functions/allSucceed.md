[**@fgv/ts-utils**](../README.md)

***

[@fgv/ts-utils](../README.md) / allSucceed

# Function: allSucceed()

> **allSucceed**\<`T`\>(`results`, `successValue`, `aggregatedErrors?`): [`Result`](../type-aliases/Result.md)\<`T`\>

Determines if an iterable collection of [Result\<T\>](../type-aliases/Result.md) were all successful.

## Type Parameters

| Type Parameter |
| ------ |
| `T` |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `results` | `Iterable`\<[`Result`](../type-aliases/Result.md)\<`unknown`\>\> | The collection of [Result\<T\>](../type-aliases/Result.md) to be tested. |
| `successValue` | `T` | The value to be returned if results are successful. |
| `aggregatedErrors?` | [`IMessageAggregator`](../interfaces/IMessageAggregator.md) | Optional string array to which any returned error messages will be appended. Each error is appended as an individual string. |

## Returns

[`Result`](../type-aliases/Result.md)\<`T`\>

Returns [Success](../classes/Success.md) with `successValue` if all [results](../type-aliases/Result.md) are successful.
If any are unsuccessful, returns [Failure](../classes/Failure.md) with a concatenated summary of the error
messages from all failed elements.
