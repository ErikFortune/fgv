[**@fgv/ts-utils**](../README.md)

***

[@fgv/ts-utils](../README.md) / populateObject

# Function: populateObject()

## Call Signature

> **populateObject**\<`T`\>(`initializers`, `options?`, `aggregatedErrors?`): [`Result`](../type-aliases/Result.md)\<`T`\>

Populates an an object based on a prototype full of field initializers that return [Result\<T\[key\]\>](../type-aliases/Result.md).
Returns [Success](../classes/Success.md) with the populated object if all initializers succeed, or [Failure](../classes/Failure.md) with a
concatenated list of all error messages.

### Type Parameters

| Type Parameter |
| ------ |
| `T` |

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `initializers` | [`FieldInitializers`](../type-aliases/FieldInitializers.md)\<`T`\> | An object with the shape of the target but with initializer functions for each property. |
| `options?` | [`PopulateObjectOptions`](../interfaces/PopulateObjectOptions.md)\<`T`\> | An optional [set of options](../interfaces/PopulateObjectOptions.md) which modify the behavior of this call. |
| `aggregatedErrors?` | [`IMessageAggregator`](../interfaces/IMessageAggregator.md) | Optional string array to which any returned error messages will be appended. Each error is appended as an individual string. |

### Returns

[`Result`](../type-aliases/Result.md)\<`T`\>

## Call Signature

> **populateObject**\<`T`\>(`initializers`, `order`, `aggregatedErrors?`): [`Result`](../type-aliases/Result.md)\<`T`\>

Populates an an object based on a prototype full of field initializers that return [Result\<T\[key\]\>](../type-aliases/Result.md).
Returns [Success](../classes/Success.md) with the populated object if all initializers succeed, or [Failure](../classes/Failure.md) with a
concatenated list of all error messages.

### Type Parameters

| Type Parameter |
| ------ |
| `T` |

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `initializers` | [`FieldInitializers`](../type-aliases/FieldInitializers.md)\<`T`\> | An object with the shape of the target but with initializer functions for each property. |
| `order` | keyof `T`[] \| `undefined` | Optional order in which keys should be written. |
| `aggregatedErrors?` | [`IMessageAggregator`](../interfaces/IMessageAggregator.md) | Optional string array to which any returned error messages will be appended. Each error is appended as an individual string. |

### Returns

[`Result`](../type-aliases/Result.md)\<`T`\>

### Deprecated

Pass [PopulateObjectOptions](../interfaces/PopulateObjectOptions.md) instead.
