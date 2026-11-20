[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-utils](../README.md) / AsyncFailureContinuation

# Type Alias: AsyncFailureContinuation\<T\>

> **AsyncFailureContinuation**\<`T`\> = (`message`) => `PromiseLike`\<[`Result`](Result.md)\<`T`\>\>

Async continuation callback to be called in the event that a
[Result](Result.md) fails, returning a `PromiseLike` of a new [Result](Result.md).

## Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-t"></a> `T` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `message` | `string` |

## Returns

`PromiseLike`\<[`Result`](Result.md)\<`T`\>\>

## Remarks

See [AsyncSuccessContinuation](AsyncSuccessContinuation.md) for the rationale behind accepting
any `PromiseLike<Result<T>>` rather than only a `Promise<Result<T>>`.
