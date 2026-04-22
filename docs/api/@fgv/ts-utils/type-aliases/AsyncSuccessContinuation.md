[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-utils](../README.md) / AsyncSuccessContinuation

# Type Alias: AsyncSuccessContinuation()\<T, TN\>

> **AsyncSuccessContinuation**\<`T`, `TN`\> = (`value`) => `Promise`\<[`Result`](Result.md)\<`TN`\>\>

Async continuation callback to be called in the event that a
[Result](Result.md) is successful, returning a `Promise` of a new [Result](Result.md).

## Type Parameters

| Type Parameter |
| ------ |
| `T` |
| `TN` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `T` |

## Returns

`Promise`\<[`Result`](Result.md)\<`TN`\>\>
