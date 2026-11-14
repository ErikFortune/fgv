[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-json-base](../../../README.md) / [FileTree](../README.md) / isAtomicDirectoryItem

# Function: isAtomicDirectoryItem()

> **isAtomicDirectoryItem**\<`TCT`\>(`item`): `item is IAtomicFileTreeDirectoryItem<TCT>`

Type guard narrowing a directory item to [FileTree.IAtomicFileTreeDirectoryItem](../interfaces/IAtomicFileTreeDirectoryItem.md).

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-tct"></a> `TCT` *extends* `string` | `string` |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `item` | [`IFileTreeDirectoryItem`](../interfaces/IFileTreeDirectoryItem.md)\<`TCT`\> \| [`IMutableFileTreeDirectoryItem`](../interfaces/IMutableFileTreeDirectoryItem.md)\<`TCT`\> \| [`IFileTreeFileItem`](../interfaces/IFileTreeFileItem.md)\<`TCT`\> | The directory item to check. |

## Returns

`item is IAtomicFileTreeDirectoryItem<TCT>`

`true` if the item implements [FileTree.IAtomicFileTreeDirectoryItem](../interfaces/IAtomicFileTreeDirectoryItem.md).

## Remarks

Narrows the type; does **not** promise `writeChildAtomically()` will
succeed — see that interface's remarks. Follow a successful narrowing with
[getAtomicWriteCapabilities](../interfaces/IAtomicFileTreeDirectoryItem.md#getatomicwritecapabilities), which does answer for the backing store.
