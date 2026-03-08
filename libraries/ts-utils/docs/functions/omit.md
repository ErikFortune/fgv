[**@fgv/ts-utils**](../README.md)

***

[@fgv/ts-utils](../README.md) / omit

# Function: omit()

> **omit**\<`T`, `K`\>(`from`, `exclude`): `Omit`\<`T`, `K`\>

Simple implicit omit function, which picks all of the properties from a supplied
object except those specified for exclusion.

## Type Parameters

| Type Parameter |
| ------ |
| `T` *extends* `object` |
| `K` *extends* `string` \| `number` \| `symbol` |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `from` | `T` | The object from which keys are to be picked. |
| `exclude` | `K`[] | The keys of the properties to be excluded from the returned object. |

## Returns

`Omit`\<`T`, `K`\>

A new object containing all of the properties from `from` that were not
explicitly excluded.
