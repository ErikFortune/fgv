[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-utils](../README.md) / isDeferredResult

# Function: isDeferredResult()

> **isDeferredResult**\<`T`\>(`result`): `result is DeferredResult<T>`

Checks if a result is a deferred result.

## Type Parameters

| Type Parameter |
| ------ |
| `T` |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `result` | [`Result`](../type-aliases/Result.md)\<`T`\> \| [`DeferredResult`](../type-aliases/DeferredResult.md)\<`T`\> | The result to check. |

## Returns

`result is DeferredResult<T>`

`true` if the result is a deferred result, `false` otherwise.
