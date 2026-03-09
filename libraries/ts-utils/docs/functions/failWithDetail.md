[**@fgv/ts-utils**](../README.md)

***

[@fgv/ts-utils](../README.md) / failWithDetail

# Function: failWithDetail()

> **failWithDetail**\<`T`, `TD`\>(`message`, `detail?`): [`DetailedFailure`](../classes/DetailedFailure.md)\<`T`, `TD`\>

Returns [DetailedFailure\<T, TD\>](../classes/DetailedFailure.md) with a supplied error message and detail.

## Type Parameters

| Type Parameter |
| ------ |
| `T` |
| `TD` |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `message` | `string` | The error message to be returned. |
| `detail?` | `TD` | The event detail to be returned. |

## Returns

[`DetailedFailure`](../classes/DetailedFailure.md)\<`T`, `TD`\>

An [DetailedFailure\<T, TD\>](../classes/DetailedFailure.md) with the supplied error
message and detail.

## Remarks

The `failsWithDetail` alias was added in release 5.0 for naming consistency
with [fails](fails.md), which was added to avoid conflicts with test frameworks and libraries.
