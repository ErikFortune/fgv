[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-json-base](../../../README.md) / [FileTree](../README.md) / isMutableBinaryDirectoryItem

# Function: isMutableBinaryDirectoryItem()

> **isMutableBinaryDirectoryItem**\<`TCT`\>(`item`): `item is IMutableBinaryFileTreeDirectoryItem<TCT>`

Type guard narrowing a directory item to
[FileTree.IMutableBinaryFileTreeDirectoryItem](../interfaces/IMutableBinaryFileTreeDirectoryItem.md).

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-tct"></a> `TCT` *extends* `string` | `string` |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `item` | [`IFileTreeDirectoryItem`](../interfaces/IFileTreeDirectoryItem.md)\<`TCT`\> \| [`IMutableFileTreeDirectoryItem`](../interfaces/IMutableFileTreeDirectoryItem.md)\<`TCT`\> \| [`IFileTreeFileItem`](../interfaces/IFileTreeFileItem.md)\<`TCT`\> | The directory item to check. |

## Returns

`item is IMutableBinaryFileTreeDirectoryItem<TCT>`

`true` if the item implements
[FileTree.IMutableBinaryFileTreeDirectoryItem](../interfaces/IMutableBinaryFileTreeDirectoryItem.md).

## Remarks

Narrows the type; does **not** promise `createChildFileBytes()` will succeed — see that
interface's remarks. Follow a successful narrowing with
[canCreateChildFileBytes](../interfaces/IMutableBinaryFileTreeDirectoryItem.md#cancreatechildfilebytes),
which does answer for the backing store.
