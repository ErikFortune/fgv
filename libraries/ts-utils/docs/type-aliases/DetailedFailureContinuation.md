[**@fgv/ts-utils**](../README.md)

***

[@fgv/ts-utils](../README.md) / DetailedFailureContinuation

# Type Alias: DetailedFailureContinuation()\<T, TD\>

> **DetailedFailureContinuation**\<`T`, `TD`\> = (`message`, `detail?`) => [`DetailedResult`](DetailedResult.md)\<`T`, `TD`\>

Callback to be called when a [DetailedResult](DetailedResult.md) encounters a failure.

## Type Parameters

| Type Parameter |
| ------ |
| `T` |
| `TD` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `message` | `string` |
| `detail?` | `TD` |

## Returns

[`DetailedResult`](DetailedResult.md)\<`T`, `TD`\>

## Remarks

A failure callback can change [DetailedFailure\<T, TD\>](../classes/DetailedFailure.md) to
[DetailedSuccess\<T, TD\>](../classes/DetailedSuccess.md) (e.g. by returning a default value)
or it can change or embellish the error message, but it cannot change the success return type.
