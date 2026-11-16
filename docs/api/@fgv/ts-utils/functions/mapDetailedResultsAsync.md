[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-utils](../README.md) / mapDetailedResultsAsync

# Function: mapDetailedResultsAsync()

## Call Signature

> **mapDetailedResultsAsync**\<`T`, `TD`\>(`work`, `ignore`, `options?`): `Promise`\<[`Result`](../type-aliases/Result.md)\<`T`[]\>\>

Aggregates successful results from a collection of deferred asynchronous work which produces
[DetailedResult\<T, TD\>](../type-aliases/DetailedResult.md), optionally ignoring certain error details and
running at most [IAsyncResultOptions.concurrency](../interfaces/IAsyncResultOptions.md#property-concurrency) operations at once.

### Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-t"></a> `T` |
| <a id="type-parameter-td"></a> `TD` |

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `work` | `Iterable`\<() => `Promise`\<[`DetailedResult`](../type-aliases/DetailedResult.md)\<`T`, `TD`\>\>\> | The collection of deferred work to be run. |
| `ignore` | `TD`[] | An array of error detail values (of type `<TD>`) that should be ignored. |
| `options?` | [`IAsyncResultOptions`](../interfaces/IAsyncResultOptions.md) | Optional [options](../interfaces/IAsyncResultOptions.md) for the call. |

### Returns

`Promise`\<[`Result`](../type-aliases/Result.md)\<`T`[]\>\>

[Success](../classes/Success.md) with an array containing all successful results if all results either
succeeded or returned error details listed in `ignore`.  Otherwise returns [Failure](../classes/Failure.md) with
a concatenated summary of all non-ignorable error messages.

### Remarks

This is the asynchronous sibling of [mapDetailedResults](mapDetailedResults.md), with the same fold, and the
same deliberate scheduling of all work regardless of failures.

One behaviour is necessarily new: a work function which throws synchronously or returns a
rejected promise produces no detail at all, so there is nothing for `ignore` to match.  Such a
failure is therefore always reported and can never be ignored.

## Call Signature

> **mapDetailedResultsAsync**\<`TItem`, `T`, `TD`\>(`items`, `fn`, `ignore`, `options?`): `Promise`\<[`Result`](../type-aliases/Result.md)\<`T`[]\>\>

Applies an asynchronous [DetailedResult\<T, TD\>](../type-aliases/DetailedResult.md)-returning function to
every element of a collection, optionally ignoring certain error details and running at most
[IAsyncResultOptions.concurrency](../interfaces/IAsyncResultOptions.md#property-concurrency) operations at once.

### Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-titem"></a> `TItem` |
| <a id="type-parameter-t-1"></a> `T` |
| <a id="type-parameter-td-1"></a> `TD` |

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `items` | `Iterable`\<`TItem`\> | The collection of items to be processed. |
| `fn` | (`item`, `index`) => `Promise`\<[`DetailedResult`](../type-aliases/DetailedResult.md)\<`T`, `TD`\>\> | The asynchronous function to be applied to each item. |
| `ignore` | `TD`[] | An array of error detail values (of type `<TD>`) that should be ignored. |
| `options?` | [`IAsyncResultOptions`](../interfaces/IAsyncResultOptions.md) | Optional [options](../interfaces/IAsyncResultOptions.md) for the call. |

### Returns

`Promise`\<[`Result`](../type-aliases/Result.md)\<`T`[]\>\>

[Success](../classes/Success.md) with an array containing all successful results if all results either
succeeded or returned error details listed in `ignore`.  Otherwise returns [Failure](../classes/Failure.md) with
a concatenated summary of all non-ignorable error messages.
