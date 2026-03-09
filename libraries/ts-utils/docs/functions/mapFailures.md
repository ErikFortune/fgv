[**@fgv/ts-utils**](../README.md)

***

[@fgv/ts-utils](../README.md) / mapFailures

# Function: mapFailures()

> **mapFailures**\<`T`\>(`results`, `aggregatedErrors?`): `string`[]

Aggregates error messages from a collection of [Result\<T\>](../type-aliases/Result.md).

## Type Parameters

| Type Parameter |
| ------ |
| `T` |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `results` | `Iterable`\<[`Result`](../type-aliases/Result.md)\<`T`\>\> | An iterable collection of [Result\<T\>](../type-aliases/Result.md) for which error messages are aggregated. |
| `aggregatedErrors?` | [`IMessageAggregator`](../interfaces/IMessageAggregator.md) | Optional string array to which any returned error messages will be appended. Each error is appended as an individual string. |

## Returns

`string`[]

An array of strings consisting of all error messages returned by
[results](../type-aliases/Result.md) in the source collection. Ignores [Success](../classes/Success.md)
results and returns an empty array if there were no errors.
