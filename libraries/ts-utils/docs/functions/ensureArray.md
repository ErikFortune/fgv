[**@fgv/ts-utils**](../README.md)

***

[@fgv/ts-utils](../README.md) / ensureArray

# Function: ensureArray()

> **ensureArray**\<`T`\>(`items`): [`EnsureArrayResult`](../type-aliases/EnsureArrayResult.md)\<`T`\>

Ensures the input is an array. If already an array, returns it as-is.
If a single item, wraps it in an array.
Preserves readonly status of input arrays.

## Type Parameters

| Type Parameter |
| ------ |
| `T` |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `items` | `T` | A single item or an array of items. |

## Returns

[`EnsureArrayResult`](../type-aliases/EnsureArrayResult.md)\<`T`\>

The input array unchanged, or a new array containing the single item.
