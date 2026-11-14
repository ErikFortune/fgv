[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-utils](../README.md) / AsyncDetailedFailureContinuation

# Type Alias: AsyncDetailedFailureContinuation\<T, TD\>

> **AsyncDetailedFailureContinuation**\<`T`, `TD`\> = (`message`, `detail?`) => `PromiseLike`\<[`DetailedResult`](DetailedResult.md)\<`T`, `TD`\>\>

Async continuation callback to be called in the event that a
[DetailedResult](DetailedResult.md) fails, returning a `PromiseLike` of a new
[DetailedResult](DetailedResult.md).

## Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-t"></a> `T` |
| <a id="type-parameter-td"></a> `TD` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `message` | `string` |
| `detail?` | `TD` |

## Returns

`PromiseLike`\<[`DetailedResult`](DetailedResult.md)\<`T`, `TD`\>\>

## Remarks

The detail-preserving sibling of [AsyncFailureContinuation](AsyncFailureContinuation.md). As with
[DetailedFailureContinuation](DetailedFailureContinuation.md), the callback may recover to a success or
embellish the failure, but it cannot change the success type.
