[**@fgv/ts-json-base**](../../../../README.md)

***

[@fgv/ts-json-base](../../../../README.md) / [FileTree](../README.md) / isPathMutable

# Function: isPathMutable()

> **isPathMutable**(`path`, `mutable`): `boolean`

Checks if a path is allowed by a mutability configuration.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `path` | `string` | The path to check. |
| `mutable` | `boolean` \| [`IFilterSpec`](../interfaces/IFilterSpec.md) \| `undefined` | The mutability configuration. |

## Returns

`boolean`

`true` if the path is mutable according to the configuration.
