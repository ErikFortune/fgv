[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-utils](../README.md) / mapSuccessAsync

# Function: mapSuccessAsync()

## Call Signature

> **mapSuccessAsync**\<`T`\>(`work`, `options?`): `Promise`\<[`Result`](../type-aliases/Result.md)\<`T`[]\>\>

Aggregates successful results from a collection of deferred asynchronous work, running at most
[IAsyncResultOptions.concurrency](../interfaces/IAsyncResultOptions.md#property-concurrency) operations at once and failing only if everything
failed.

### Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-t"></a> `T` |

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `work` | `Iterable`\<[`AsyncDeferredResult`](../type-aliases/AsyncDeferredResult.md)\<`T`\>\> | The collection of [AsyncDeferredResult\<T\>](../type-aliases/AsyncDeferredResult.md) to be run. |
| `options?` | [`IAsyncResultOptions`](../interfaces/IAsyncResultOptions.md) | Optional [options](../interfaces/IAsyncResultOptions.md) for the call. |

### Returns

`Promise`\<[`Result`](../type-aliases/Result.md)\<`T`[]\>\>

[Success](../classes/Success.md) with an array of `<T>` if any results were successful.  If all failed,
returns [Failure](../classes/Failure.md) with a concatenated summary of all error messages.

### Remarks

This is the asynchronous sibling of [mapSuccess](mapSuccess.md), with the same fold.  Results are
returned in input order regardless of completion order.  Every failure is appended to
[IAsyncResultOptions.aggregatedErrors](../interfaces/IAsyncResultOptions.md#property-aggregatederrors), if supplied, in input order and whether or not
any work succeeded, so a partial fold can report what it dropped.

## Call Signature

> **mapSuccessAsync**\<`TItem`, `T`\>(`items`, `fn`, `options?`): `Promise`\<[`Result`](../type-aliases/Result.md)\<`T`[]\>\>

Applies an asynchronous [Result\<T\>](../type-aliases/Result.md)-returning function to every element of a
collection, running at most [IAsyncResultOptions.concurrency](../interfaces/IAsyncResultOptions.md#property-concurrency) operations at once and
failing only if everything failed.

### Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-titem"></a> `TItem` |
| <a id="type-parameter-t-1"></a> `T` |

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `items` | `Iterable`\<`TItem`\> | The collection of items to be processed. |
| `fn` | (`item`, `index`) => `Promise`\<[`Result`](../type-aliases/Result.md)\<`T`\>\> | The asynchronous function to be applied to each item. |
| `options?` | [`IAsyncResultOptions`](../interfaces/IAsyncResultOptions.md) | Optional [options](../interfaces/IAsyncResultOptions.md) for the call. |

### Returns

`Promise`\<[`Result`](../type-aliases/Result.md)\<`T`[]\>\>

[Success](../classes/Success.md) with an array of `<T>` if any results were successful.  If all failed,
returns [Failure](../classes/Failure.md) with a concatenated summary of all error messages.

### Remarks

Every failure is appended to [IAsyncResultOptions.aggregatedErrors](../interfaces/IAsyncResultOptions.md#property-aggregatederrors), if supplied, in
input order and whether or not any item succeeded, so a partial fold can report what it
dropped.
