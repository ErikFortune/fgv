[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-utils](../README.md) / AsyncSuccessContinuation

# Type Alias: AsyncSuccessContinuation\<T, TN\>

> **AsyncSuccessContinuation**\<`T`, `TN`\> = (`value`) => `PromiseLike`\<[`Result`](Result.md)\<`TN`\>\>

Async continuation callback to be called in the event that a
[Result](Result.md) is successful, returning a `PromiseLike` of a new
[Result](Result.md).

## Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-t"></a> `T` |
| <a id="type-parameter-tn"></a> `TN` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `T` |

## Returns

`PromiseLike`\<[`Result`](Result.md)\<`TN`\>\>

## Remarks

Typed as `PromiseLike<Result<TN>>` rather than `Promise<Result<TN>>` so
callers can return the result of [captureAsyncResult](../functions/captureAsyncResult.md) (which is an
[AsyncResult](../classes/AsyncResult.md), itself a `PromiseLike<Result<TN>>`) directly from a
`thenOnSuccess` callback without an `async` wrapper to coerce the
contextual return type back through `Awaited<>`. The continuation result
is always wrapped into an [AsyncResult](../classes/AsyncResult.md), so chaining is unaffected.
