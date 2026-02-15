[**@fgv/ts-utils**](../README.md)

***

[@fgv/ts-utils](../README.md) / getTypeOfProperty

# Function: getTypeOfProperty()

> **getTypeOfProperty**\<`T`\>(`key`, `item`): `"string"` \| `"number"` \| `"bigint"` \| `"boolean"` \| `"symbol"` \| `"undefined"` \| `"object"` \| `"function"` \| `undefined`

Gets the type of a property specified by key from an arbitrary object.

## Type Parameters

| Type Parameter |
| ------ |
| `T` *extends* `object` |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `string` \| `number` \| `symbol` | The key specifying the property to be tested. |
| `item` | `T` | The object from which the property is to be tested. |

## Returns

`"string"` \| `"number"` \| `"bigint"` \| `"boolean"` \| `"symbol"` \| `"undefined"` \| `"object"` \| `"function"` \| `undefined`

The type of the requested property, or `undefined` if the
property does not exist.

## Example

```ts
Returns `'undefined'` (a string) if the property exists but has the value
undefined but `undefined` (the literal) if the property does not exist.
@public
```
