[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-utils](../README.md) / AsyncFailureContinuation

# Type Alias: AsyncFailureContinuation()\<T\>

> **AsyncFailureContinuation**\<`T`\> = (`message`) => `Promise`\<[`Result`](Result.md)\<`T`\>\>

Async continuation callback to be called in the event that a
[Result](Result.md) fails, returning a `Promise` of a new [Result](Result.md).

## Type Parameters

| Type Parameter |
| ------ |
| `T` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `message` | `string` |

## Returns

`Promise`\<[`Result`](Result.md)\<`T`\>\>
