[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-json-base](../../../README.md) / [FileTree](../README.md) / isMutableBinaryFileItem

# Function: isMutableBinaryFileItem()

> **isMutableBinaryFileItem**\<`TCT`\>(`item`): `item is IMutableBinaryFileTreeFileItem<TCT>`

Type guard narrowing a file item to [FileTree.IMutableBinaryFileTreeFileItem](../interfaces/IMutableBinaryFileTreeFileItem.md).

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-tct"></a> `TCT` *extends* `string` | `string` |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `item` | [`IFileTreeFileItem`](../interfaces/IFileTreeFileItem.md)\<`TCT`\> \| [`IMutableFileTreeFileItem`](../interfaces/IMutableFileTreeFileItem.md)\<`TCT`\> \| [`IFileTreeDirectoryItem`](../interfaces/IFileTreeDirectoryItem.md)\<`TCT`\> | The file item to check. |

## Returns

`item is IMutableBinaryFileTreeFileItem<TCT>`

`true` if the item implements [FileTree.IMutableBinaryFileTreeFileItem](../interfaces/IMutableBinaryFileTreeFileItem.md).

## Remarks

Narrows the type; does **not** promise `setRawBytes()` will succeed — see
[isBinaryFileItem](isBinaryFileItem.md). Byte writes are supported only
by byte-persisting stores, and that is knowable at the accessors level: use
[isMutableBinaryAccessors](isMutableBinaryAccessors.md) when the check
needs to be a success guarantee.
