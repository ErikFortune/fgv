[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-json-base](../../../README.md) / [FileTree](../README.md) / isMutableFileItem

# Function: isMutableFileItem()

> **isMutableFileItem**\<`TCT`\>(`item`): `item is IMutableFileTreeFileItem<TCT>`

Type guard to check if a file item supports mutation.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TCT` *extends* `string` | `string` |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `item` | [`IFileTreeFileItem`](../interfaces/IFileTreeFileItem.md)\<`TCT`\> \| [`IMutableFileTreeFileItem`](../interfaces/IMutableFileTreeFileItem.md)\<`TCT`\> \| [`IFileTreeDirectoryItem`](../interfaces/IFileTreeDirectoryItem.md)\<`TCT`\> | The file item to check. |

## Returns

`item is IMutableFileTreeFileItem<TCT>`

`true` if the item implements [FileTree.IMutableFileTreeFileItem](../interfaces/IMutableFileTreeFileItem.md).
