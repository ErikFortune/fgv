[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-utils](../README.md) / captureAsyncResult

# Function: captureAsyncResult()

> **captureAsyncResult**\<`T`\>(`func`): [`AsyncResult`](../classes/AsyncResult.md)\<`T`\>

Wraps an async function which might throw to convert exception results
to [Failure](../classes/Failure.md).

## Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-t"></a> `T` |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `func` | () => `Promise`\<`T`\> | The async function to be captured. |

## Returns

[`AsyncResult`](../classes/AsyncResult.md)\<`T`\>

An [AsyncResult](../classes/AsyncResult.md) resolving to [Success](../classes/Success.md) with a value
of type `<T>` on success, or [Failure](../classes/Failure.md) with the thrown error message
if `func` throws or rejects.

## Remarks

Returns an [AsyncResult](../classes/AsyncResult.md) so callers can fluently chain
(`.onSuccess` / `.thenOnSuccess` / `.withErrorFormat`) directly off the
captured result. Because [AsyncResult](../classes/AsyncResult.md) implements
`PromiseLike<Result<T>>`, existing `await captureAsyncResult(...)` call
sites continue to work unchanged and yield the same [Result](../type-aliases/Result.md).

Synchronous throws from `func` (before it returns its `Promise`), promise
rejections, and successful resolutions are all funneled through the
returned [AsyncResult](../classes/AsyncResult.md), which resolves to a [Failure](../classes/Failure.md) for the
throw/reject cases and a [Success](../classes/Success.md) wrapping the resolved value
otherwise.
