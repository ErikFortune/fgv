[**@fgv/ts-json-base**](../../../../README.md)

***

[@fgv/ts-json-base](../../../../README.md) / [FileTree](../README.md) / isPersistentAccessors

# Function: isPersistentAccessors()

> **isPersistentAccessors**\<`TCT`\>(`accessors`): `accessors is IPersistentFileTreeAccessors<TCT>`

Type guard to check if accessors support persistence.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TCT` *extends* `string` | `string` |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `accessors` | [`IFileTreeAccessors`](../interfaces/IFileTreeAccessors.md)\<`TCT`\> | The accessors to check. |

## Returns

`accessors is IPersistentFileTreeAccessors<TCT>`

`true` if the accessors implement [FileTree.IPersistentFileTreeAccessors](../interfaces/IPersistentFileTreeAccessors.md).
