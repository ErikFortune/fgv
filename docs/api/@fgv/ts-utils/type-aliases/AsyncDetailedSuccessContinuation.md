[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-utils](../README.md) / AsyncDetailedSuccessContinuation

# Type Alias: AsyncDetailedSuccessContinuation\<T, TD, TN\>

> **AsyncDetailedSuccessContinuation**\<`T`, `TD`, `TN`\> = (`value`, `detail?`) => `PromiseLike`\<[`DetailedResult`](DetailedResult.md)\<`TN`, `TD`\>\>

Async continuation callback to be called in the event that a
[DetailedResult](DetailedResult.md) is successful, returning a `PromiseLike` of a new
[DetailedResult](DetailedResult.md).

## Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-t"></a> `T` |
| <a id="type-parameter-td"></a> `TD` |
| <a id="type-parameter-tn"></a> `TN` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `T` |
| `detail?` | `TD` |

## Returns

`PromiseLike`\<[`DetailedResult`](DetailedResult.md)\<`TN`, `TD`\>\>

## Remarks

The detail-preserving sibling of [AsyncSuccessContinuation](AsyncSuccessContinuation.md). Like its
synchronous counterpart [DetailedSuccessContinuation](DetailedSuccessContinuation.md), it receives the
detail alongside the value and may mutate the success type from `<T>` to
`<TN>`, but it cannot change the detail type `<TD>` — that is what makes the
detail survive an arbitrarily long chain.

Typed as `PromiseLike` for the same reason as
[AsyncSuccessContinuation](AsyncSuccessContinuation.md): so a callback can return an
[AsyncDetailedResult](../classes/AsyncDetailedResult.md) directly without an `async` wrapper.
