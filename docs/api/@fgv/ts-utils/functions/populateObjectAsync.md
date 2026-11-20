[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-utils](../README.md) / populateObjectAsync

# Function: populateObjectAsync()

> **populateObjectAsync**\<`T`\>(`initializers`, `options?`, `aggregatedErrors?`): `Promise`\<[`Result`](../type-aliases/Result.md)\<`T`\>\>

Populates an object based on a prototype full of asynchronous field initializers that return
[Result\<T\[key\]\>](../type-aliases/Result.md).

## Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-t"></a> `T` |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `initializers` | [`AsyncFieldInitializers`](../type-aliases/AsyncFieldInitializers.md)\<`T`\> | An object with the shape of the target but with asynchronous initializer functions for each property. |
| `options?` | [`PopulateObjectOptions`](../interfaces/PopulateObjectOptions.md)\<`T`\> | An optional [set of options](../interfaces/PopulateObjectOptions.md) which modify the behavior of this call. |
| `aggregatedErrors?` | [`IMessageAggregator`](../interfaces/IMessageAggregator.md) | Optional aggregator to which any error messages will be appended. Each error is appended as an individual string. |

## Returns

`Promise`\<[`Result`](../type-aliases/Result.md)\<`T`\>\>

[Success](../classes/Success.md) with the populated object if all initializers succeed, or
[Failure](../classes/Failure.md) with a concatenated list of all error messages.

## Remarks

This is the asynchronous sibling of `populateObject`, and it is *transitively*
asynchronous: the algorithm is unchanged and remains serial, because each initializer receives
the `Partial<T>` populated by the initializers before it.  That is dependency sequencing, so
this function deliberately takes no [IAsyncResultOptions](../interfaces/IAsyncResultOptions.md) - offering a `concurrency`
option would imply the initializers are independent, which the `Partial<T>` contract says they
are not.

An initializer which throws synchronously or returns a rejected promise is reported as a
failure for that key, exactly as if it had returned [Failure](../classes/Failure.md).
