[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-json-base](../../../README.md) / [FileTree](../README.md) / isMutableBinaryAccessors

# Function: isMutableBinaryAccessors()

> **isMutableBinaryAccessors**\<`TCT`\>(`accessors`): `accessors is IMutableBinaryFileTreeAccessors<TCT>`

Type guard to check if accessors support both reading and writing raw bytes.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-tct"></a> `TCT` *extends* `string` | `string` |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `accessors` | [`IFileTreeAccessors`](../interfaces/IFileTreeAccessors.md)\<`TCT`\> | The accessors to check. |

## Returns

`accessors is IMutableBinaryFileTreeAccessors<TCT>`

`true` if the accessors implement [FileTree.IMutableBinaryFileTreeAccessors](../interfaces/IMutableBinaryFileTreeAccessors.md).
