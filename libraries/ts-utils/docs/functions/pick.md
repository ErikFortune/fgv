[**@fgv/ts-utils**](../README.md)

***

[@fgv/ts-utils](../README.md) / pick

# Function: pick()

> **pick**\<`T`, `K`\>(`from`, `include`): `Pick`\<`T`, `K`\>

Simple implicit pick function, which picks a set of properties from a supplied
object.  Ignores picked properties that do not exist regardless of type signature.

## Type Parameters

| Type Parameter |
| ------ |
| `T` *extends* `object` |
| `K` *extends* `string` \| `number` \| `symbol` |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `from` | `T` | The object from which keys are to be picked. |
| `include` | `K`[] | The keys of the properties to be picked from `from`. |

## Returns

`Pick`\<`T`, `K`\>

A new object containing the requested properties from `from`, where present.
