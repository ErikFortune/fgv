[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-utils](../README.md) / firstSuccessAsync

# Function: firstSuccessAsync()

> **firstSuccessAsync**\<`T`\>(`work`, `aggregatedErrors?`): `Promise`\<[`Result`](../type-aliases/Result.md)\<`T`\>\>

Returns the first successful result from an ordered collection of deferred asynchronous work.

## Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-t"></a> `T` |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `work` | `Iterable`\<[`AsyncDeferredResult`](../type-aliases/AsyncDeferredResult.md)\<`T`\>\> | The ordered collection of [AsyncDeferredResult\<T\>](../type-aliases/AsyncDeferredResult.md) to be attempted in turn. |
| `aggregatedErrors?` | [`IMessageAggregator`](../interfaces/IMessageAggregator.md) | Optional aggregator to which error messages will be appended if no attempt succeeds. Each error is appended as an individual string. |

## Returns

`Promise`\<[`Result`](../type-aliases/Result.md)\<`T`\>\>

The first successful result, or [Failure](../classes/Failure.md) with a concatenated summary of all
error messages.

## Remarks

This is the asynchronous sibling of [firstSuccess](firstSuccess.md), and like it is serial: "first" means
"do not do work you do not need".  It is therefore *transitively* asynchronous and deliberately
takes no [IAsyncResultOptions](../interfaces/IAsyncResultOptions.md) - a `concurrency` field on an operation which is serial by
definition would be a lie in the type signature.

When every attempt fails, the failure carries every attempt's message.  An empty collection
fails with `no results found`.
