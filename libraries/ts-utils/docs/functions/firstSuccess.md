[**@fgv/ts-utils**](../README.md)

***

[@fgv/ts-utils](../README.md) / firstSuccess

# Function: firstSuccess()

> **firstSuccess**\<`T`\>(`results`): [`Result`](../type-aliases/Result.md)\<`T`\>

Returns the first successful result from a collection of [Result\<T\>](../type-aliases/Result.md) or [DeferredResult\<T\>](../type-aliases/DeferredResult.md).

## Type Parameters

| Type Parameter |
| ------ |
| `T` |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `results` | `Iterable`\<[`Result`](../type-aliases/Result.md)\<`T`\> \| [`DeferredResult`](../type-aliases/DeferredResult.md)\<`T`\>\> | The collection of [Result\<T\>](../type-aliases/Result.md) or [DeferredResult\<T\>](../type-aliases/DeferredResult.md) to be tested. |

## Returns

[`Result`](../type-aliases/Result.md)\<`T`\>

The first successful result, or [Failure](../classes/Failure.md) with a concatenated summary of all error messages.
