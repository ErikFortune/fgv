[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-json-base](../../../README.md) / [FileTree](../README.md) / isMutableDirectoryItem

# Function: isMutableDirectoryItem()

> **isMutableDirectoryItem**\<`TCT`\>(`item`): `item is IMutableFileTreeDirectoryItem<TCT>`

Type guard to check if a directory item supports mutation.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TCT` *extends* `string` | `string` |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `item` | [`IFileTreeDirectoryItem`](../interfaces/IFileTreeDirectoryItem.md)\<`TCT`\> \| [`IMutableFileTreeDirectoryItem`](../interfaces/IMutableFileTreeDirectoryItem.md)\<`TCT`\> \| [`IFileTreeFileItem`](../interfaces/IFileTreeFileItem.md)\<`TCT`\> | The directory item to check. |

## Returns

`item is IMutableFileTreeDirectoryItem<TCT>`

`true` if the item implements [FileTree.IMutableFileTreeDirectoryItem](../interfaces/IMutableFileTreeDirectoryItem.md).
