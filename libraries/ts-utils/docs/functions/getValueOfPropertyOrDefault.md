[**@fgv/ts-utils**](../README.md)

***

[@fgv/ts-utils](../README.md) / getValueOfPropertyOrDefault

# Function: getValueOfPropertyOrDefault()

> **getValueOfPropertyOrDefault**\<`T`\>(`key`, `item`, `defaultValue?`): `unknown`

Gets the value of a property specified by key from an arbitrary object,
or a default value if the property does not exist.

## Type Parameters

| Type Parameter |
| ------ |
| `T` *extends* `object` |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `string` \| `number` \| `symbol` | The key specifying the property to be retrieved. |
| `item` | `T` | The object from which the property is to be retrieved. |
| `defaultValue?` | `unknown` | An optional default value to be returned if the property is not present (default `undefined`). |

## Returns

`unknown`

The value of the requested property, or the default value if the
requested property does not exist.
