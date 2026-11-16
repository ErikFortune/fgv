[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-utils](../README.md) / mapResultsAsync

# Function: mapResultsAsync()

## Call Signature

> **mapResultsAsync**\<`T`\>(`work`, `options?`): `Promise`\<[`Result`](../type-aliases/Result.md)\<`T`[]\>\>

Aggregates successful result values from a collection of deferred asynchronous work, running
at most [IAsyncResultOptions.concurrency](../interfaces/IAsyncResultOptions.md#property-concurrency) operations at once.

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

If all results are successful, returns [Success](../classes/Success.md) with an array containing all
returned values.  If any failed, returns [Failure](../classes/Failure.md) with a concatenated summary of all
error messages.

### Remarks

This is the asynchronous sibling of [mapResults](mapResults.md), with the same fold: all work is run
and *every* error is aggregated - a failure does not stop the remaining work from being
scheduled.

Results are returned in input order regardless of completion order.  An empty collection
succeeds with an empty array.

## Call Signature

> **mapResultsAsync**\<`TItem`, `T`\>(`items`, `fn`, `options?`): `Promise`\<[`Result`](../type-aliases/Result.md)\<`T`[]\>\>

Applies an asynchronous [Result\<T\>](../type-aliases/Result.md)-returning function to every element of a
collection, running at most [IAsyncResultOptions.concurrency](../interfaces/IAsyncResultOptions.md#property-concurrency) operations at once.

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

If all results are successful, returns [Success](../classes/Success.md) with an array containing all
returned values.  If any failed, returns [Failure](../classes/Failure.md) with a concatenated summary of all
error messages.

### Remarks

This form makes already-started work structurally inexpressible - the caller supplies data and
a function, so there is nowhere to put a promise which has already been created.
