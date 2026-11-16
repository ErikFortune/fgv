[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-utils](../README.md) / mapFailuresAsync

# Function: mapFailuresAsync()

## Call Signature

> **mapFailuresAsync**\<`T`\>(`work`, `options?`): `Promise`\<`string`[]\>

Aggregates error messages from a collection of deferred asynchronous work, running at most
[IAsyncResultOptions.concurrency](../interfaces/IAsyncResultOptions.md#property-concurrency) operations at once.

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

`Promise`\<`string`[]\>

An array of strings consisting of all error messages returned by the work.  Ignores
successes and returns an empty array if there were no errors.

### Remarks

This is the asynchronous sibling of [mapFailures](mapFailures.md).  Messages are returned in input order
regardless of completion order.

## Call Signature

> **mapFailuresAsync**\<`TItem`, `T`\>(`items`, `fn`, `options?`): `Promise`\<`string`[]\>

Applies an asynchronous [Result\<T\>](../type-aliases/Result.md)-returning function to every element of a
collection, running at most [IAsyncResultOptions.concurrency](../interfaces/IAsyncResultOptions.md#property-concurrency) operations at once, and
aggregates the resulting error messages.

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

`Promise`\<`string`[]\>

An array of strings consisting of all error messages returned by the work.  Ignores
successes and returns an empty array if there were no errors.
