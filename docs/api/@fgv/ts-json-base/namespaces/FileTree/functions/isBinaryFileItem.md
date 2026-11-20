[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-json-base](../../../README.md) / [FileTree](../README.md) / isBinaryFileItem

# Function: isBinaryFileItem()

> **isBinaryFileItem**\<`TCT`\>(`item`): `item is IBinaryFileTreeFileItem<TCT>`

Type guard narrowing a file item to [FileTree.IBinaryFileTreeFileItem](../interfaces/IBinaryFileTreeFileItem.md).

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-tct"></a> `TCT` *extends* `string` | `string` |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `item` | [`IFileTreeFileItem`](../interfaces/IFileTreeFileItem.md)\<`TCT`\> \| [`IMutableFileTreeFileItem`](../interfaces/IMutableFileTreeFileItem.md)\<`TCT`\> \| [`IFileTreeDirectoryItem`](../interfaces/IFileTreeDirectoryItem.md)\<`TCT`\> | The file item to check. |

## Returns

`item is IBinaryFileTreeFileItem<TCT>`

`true` if the item implements [FileTree.IBinaryFileTreeFileItem](../interfaces/IBinaryFileTreeFileItem.md).

## Remarks

Narrows the type; does **not** promise `getRawBytes()` will succeed.
[FileTree.FileItem](../classes/FileItem.md) implements the interface unconditionally and delegates to
its accessors, so this returns `true` for any `FileItem` and the call reports a
non-byte-capable backing store as a `Failure`. Use
[isBinaryAccessors](isBinaryAccessors.md) for a capability check that
is a success guarantee.
