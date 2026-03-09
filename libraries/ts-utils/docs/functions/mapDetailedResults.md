[**@fgv/ts-utils**](../README.md)

***

[@fgv/ts-utils](../README.md) / mapDetailedResults

# Function: mapDetailedResults()

> **mapDetailedResults**\<`T`, `TD`\>(`results`, `ignore`, `aggregatedErrors?`): [`Result`](../type-aliases/Result.md)\<`T`[]\>

Aggregates successful results from a collection of [DetailedResult\<T, TD\>](../type-aliases/DetailedResult.md),
optionally ignoring certain error details.

## Type Parameters

| Type Parameter |
| ------ |
| `T` |
| `TD` |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `results` | `Iterable`\<[`DetailedResult`](../type-aliases/DetailedResult.md)\<`T`, `TD`\>\> | The collection of [DetailedResult\<T, TD\>](../type-aliases/DetailedResult.md) to be mapped. |
| `ignore` | `TD`[] | An array of error detail values (of type `<TD>`) that should be ignored. |
| `aggregatedErrors?` | [`IMessageAggregator`](../interfaces/IMessageAggregator.md) | Optional string array to which any non-ignorable error messages will be appended. Each error is appended as an individual string. |

## Returns

[`Result`](../type-aliases/Result.md)\<`T`[]\>

[Success](../classes/Success.md) with an array containing all successful results if all results either
succeeded or returned error details listed in `ignore`.  If any results failed with details
that cannot be ignored, returns [Failure](../classes/Failure.md) with an concatenated summary of all non-ignorable
error messages.
