[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-utils](../README.md) / AsyncDeferredResult

# Type Alias: AsyncDeferredResult\<T\>

> **AsyncDeferredResult**\<`T`\> = () => `Promise`\<[`Result`](Result.md)\<`T`\>\>

A unit of asynchronous work, deferred so that a scheduler can decide when to start it.

## Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-t"></a> `T` |

## Returns

`Promise`\<[`Result`](Result.md)\<`T`\>\>

## Remarks

The asynchronous members of this family take *deferred* work rather than already-materialized
promises, because a promise that has already been created has already started - by the time a
collector saw it, there would be nothing left to bound. Deferring the work is what makes a
concurrency bound possible at all.

This is the asynchronous sibling of [DeferredResult\<T\>](DeferredResult.md).
