[**@fgv/ts-utils**](../README.md)

***

[@fgv/ts-utils](../README.md) / mapResults

# Function: mapResults()

> **mapResults**\<`T`\>(`results`, `aggregatedErrors?`): [`Result`](../type-aliases/Result.md)\<`T`[]\>

Aggregates successful result values from a collection of [Result\<T\>](../type-aliases/Result.md).

## Type Parameters

| Type Parameter |
| ------ |
| `T` |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `results` | `Iterable`\<[`Result`](../type-aliases/Result.md)\<`T`\>\> | The collection of [Result\<T\>](../type-aliases/Result.md) to be mapped. |
| `aggregatedErrors?` | [`IMessageAggregator`](../interfaces/IMessageAggregator.md) | Optional string array to which any error messages will be appended. Each error is appended as an individual string. |

## Returns

[`Result`](../type-aliases/Result.md)\<`T`[]\>

If all [results](../type-aliases/Result.md) are successful, returns [Success](../classes/Success.md) with an
array containing all returned values.  If any [results](../type-aliases/Result.md) failed, returns
[Failure](../classes/Failure.md) with a concatenated summary of all error messages.
