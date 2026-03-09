[**@fgv/ts-json-base**](../../../../README.md)

***

[@fgv/ts-json-base](../../../../README.md) / [FileTree](../README.md) / isMutableAccessors

# Function: isMutableAccessors()

> **isMutableAccessors**\<`TCT`\>(`accessors`): `accessors is IMutableFileTreeAccessors<TCT>`

Type guard to check if accessors support mutation.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TCT` *extends* `string` | `string` |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `accessors` | [`IFileTreeAccessors`](../interfaces/IFileTreeAccessors.md)\<`TCT`\> | The accessors to check. |

## Returns

`accessors is IMutableFileTreeAccessors<TCT>`

`true` if the accessors implement [FileTree.IMutableFileTreeAccessors](../interfaces/IMutableFileTreeAccessors.md).
