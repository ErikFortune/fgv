[**@fgv/ts-utils**](../README.md)

***

[@fgv/ts-utils](../README.md) / useOrInitialize

# Function: useOrInitialize()

> **useOrInitialize**\<`T`\>(`value`, `initializer`): [`Result`](../type-aliases/Result.md)\<`T`\>

Uses a value or calls a supplied initializer if the supplied value is undefined.

## Type Parameters

| Type Parameter |
| ------ |
| `T` |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `value` | `T` \| `undefined` | the value |
| `initializer` | () => [`Result`](../type-aliases/Result.md)\<`T`\> | a function that initializes the value if it is undefined |

## Returns

[`Result`](../type-aliases/Result.md)\<`T`\>

`Success` with the value if it is defined, or the result of calling the initializer function.
