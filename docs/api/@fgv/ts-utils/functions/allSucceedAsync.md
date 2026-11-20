[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-utils](../README.md) / allSucceedAsync

# Function: allSucceedAsync()

## Call Signature

> **allSucceedAsync**\<`T`\>(`work`, `successValue`, `options?`): `Promise`\<[`Result`](../type-aliases/Result.md)\<`T`\>\>

Determines whether a collection of deferred asynchronous work all succeeded, running at most
[IAsyncResultOptions.concurrency](../interfaces/IAsyncResultOptions.md#property-concurrency) operations at once.

### Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-t"></a> `T` |

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `work` | `Iterable`\<[`AsyncDeferredResult`](../type-aliases/AsyncDeferredResult.md)\<`unknown`\>\> | The collection of deferred work to be run. |
| `successValue` | `T` | The value to be returned if all work succeeds. |
| `options?` | [`IAsyncResultOptions`](../interfaces/IAsyncResultOptions.md) | Optional [options](../interfaces/IAsyncResultOptions.md) for the call. |

### Returns

`Promise`\<[`Result`](../type-aliases/Result.md)\<`T`\>\>

[Success](../classes/Success.md) with `successValue` if all work succeeded.  If any failed, returns
[Failure](../classes/Failure.md) with a concatenated summary of the error messages from all failed elements.

### Remarks

This is the asynchronous sibling of [allSucceed](allSucceed.md), with the same fold.  It deliberately
does *not* short-circuit on the first failure: consistency with `allSucceed`'s
aggregate-everything contract beats a faster failure path.

If `<T>` (the type of `successValue`) is itself a function type, the `(items, fn)` overload
cannot be distinguished from this one at runtime when options are also supplied.  Call the
deferred form with no options in that case, or wrap the value.

## Call Signature

> **allSucceedAsync**\<`TItem`, `T`\>(`items`, `fn`, `successValue`, `options?`): `Promise`\<[`Result`](../type-aliases/Result.md)\<`T`\>\>

Applies an asynchronous [Result](../type-aliases/Result.md)-returning function to every element of a collection,
running at most [IAsyncResultOptions.concurrency](../interfaces/IAsyncResultOptions.md#property-concurrency) operations at once, and determines
whether all of them succeeded.

### Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-titem"></a> `TItem` |
| <a id="type-parameter-t-1"></a> `T` |

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `items` | `Iterable`\<`TItem`\> | The collection of items to be processed. |
| `fn` | (`item`, `index`) => `Promise`\<[`Result`](../type-aliases/Result.md)\<`unknown`\>\> | The asynchronous function to be applied to each item. |
| `successValue` | `T` | The value to be returned if all work succeeds. |
| `options?` | [`IAsyncResultOptions`](../interfaces/IAsyncResultOptions.md) | Optional [options](../interfaces/IAsyncResultOptions.md) for the call. |

### Returns

`Promise`\<[`Result`](../type-aliases/Result.md)\<`T`\>\>

[Success](../classes/Success.md) with `successValue` if all work succeeded.  If any failed, returns
[Failure](../classes/Failure.md) with a concatenated summary of the error messages from all failed elements.
