[**@fgv/ts-utils**](../README.md)

***

[@fgv/ts-utils](../README.md) / mapSuccess

# Function: mapSuccess()

> **mapSuccess**\<`T`\>(`results`, `aggregatedErrors?`): [`Result`](../type-aliases/Result.md)\<`T`[]\>

Aggregates successful results from a a collection of [Result\<T\>](../type-aliases/Result.md).

## Type Parameters

| Type Parameter |
| ------ |
| `T` |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `results` | `Iterable`\<[`Result`](../type-aliases/Result.md)\<`T`\>\> | An `Iterable` of [Result\<T\>](../type-aliases/Result.md) from which success results are to be aggregated. |
| `aggregatedErrors?` | [`IMessageAggregator`](../interfaces/IMessageAggregator.md) | Optional string array to which any returned error messages will be appended. Each error is appended as an individual string. |

## Returns

[`Result`](../type-aliases/Result.md)\<`T`[]\>

[Success](../classes/Success.md) with an array of `<T>` if any results were successful. If
all [results](../type-aliases/Result.md) failed, returns [Failure](../classes/Failure.md) with a concatenated
summary of all error messages.
