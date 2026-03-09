[**@fgv/ts-utils**](../README.md)

***

[@fgv/ts-utils](../README.md) / succeed

# Function: succeed()

> **succeed**\<`T`\>(`value`): [`Success`](../classes/Success.md)\<`T`\>

Returns [Success\<T\>](../classes/Success.md) with the supplied result value.

## Type Parameters

| Type Parameter |
| ------ |
| `T` |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `value` | `T` | The successful result value to be returned |

## Returns

[`Success`](../classes/Success.md)\<`T`\>

## Remarks

A `succeeds` alias was added in release 5.0 for
naming consistency with [fails](fails.md), which was added
to avoid conflicts with test frameworks and libraries.
