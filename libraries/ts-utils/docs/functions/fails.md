[**@fgv/ts-utils**](../README.md)

***

[@fgv/ts-utils](../README.md) / fails

# Function: fails()

> **fails**\<`T`\>(`message`): [`Failure`](../classes/Failure.md)\<`T`\>

Returns [Failure\<T\>](../classes/Failure.md) with the supplied error message.

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `T` |  |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `message` | `string` | Error message to be returned. |

## Returns

[`Failure`](../classes/Failure.md)\<`T`\>

## Remarks

A `fails` alias was added in release 5.0 due to
issues with the name `fail` being used test frameworks and libraries.
