[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-utils](../README.md) / captureAsyncResult

# Function: captureAsyncResult()

> **captureAsyncResult**\<`T`\>(`func`): `Promise`\<[`Result`](../type-aliases/Result.md)\<`T`\>\>

Wraps an async function which might throw to convert exception results
to [Failure](../classes/Failure.md).

## Type Parameters

| Type Parameter |
| ------ |
| `T` |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `func` | () => `Promise`\<`T`\> | The async function to be captured. |

## Returns

`Promise`\<[`Result`](../type-aliases/Result.md)\<`T`\>\>

Returns a `Promise` of [Success](../classes/Success.md) with a value of type `<T>` on
success, or [Failure](../classes/Failure.md) with the thrown error message if `func` throws or rejects.
