[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-json-base](../../../README.md) / [FileTree](../README.md) / isBinaryAccessors

# Function: isBinaryAccessors()

> **isBinaryAccessors**\<`TCT`\>(`accessors`): `accessors is IBinaryFileTreeAccessors<TCT>`

Type guard to check if accessors support reading raw bytes.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-tct"></a> `TCT` *extends* `string` | `string` |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `accessors` | [`IFileTreeAccessors`](../interfaces/IFileTreeAccessors.md)\<`TCT`\> | The accessors to check. |

## Returns

`accessors is IBinaryFileTreeAccessors<TCT>`

`true` if the accessors implement [FileTree.IBinaryFileTreeAccessors](../interfaces/IBinaryFileTreeAccessors.md).
