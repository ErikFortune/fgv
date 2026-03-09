[**@fgv/ts-utils**](../README.md)

***

[@fgv/ts-utils](../README.md) / isKeyOf

# Function: isKeyOf()

> **isKeyOf**\<`T`\>(`key`, `item`): `key is keyof T`

Helper type-guard function to report whether a specified key is present in
a supplied object.

## Type Parameters

| Type Parameter |
| ------ |
| `T` *extends* `object` |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `string` \| `number` \| `symbol` | The key to be tested. |
| `item` | `T` | The object to be tested. |

## Returns

`key is keyof T`

Returns `true` if the key is present, `false` otherwise.
