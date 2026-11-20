[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-json-base](../../../README.md) / [FileTree](../README.md) / IFileTreeStorageIdentity

# Interface: IFileTreeStorageIdentity\<TCT\>

What storage a [directory item](IFileTreeDirectoryItem.md) names.

## Remarks

Two items name the same directory when they share `accessors` and `path`, or
when both carry a `realPath` and those are equal. Nothing else is detectable:
two separate accessor objects over one non-filesystem backing store (two
`localStorage` accessors over the same key, say) carry no `realPath` and look
like different storage.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-tct"></a> `TCT` *extends* `string` | `string` |

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-accessors"></a> `accessors` | `readonly` | [`IFileTreeAccessors`](IFileTreeAccessors.md)\<`TCT`\> | The accessors object that serves the item. |
| <a id="property-path"></a> `path` | `readonly` | `string` | The item's absolute path, as its accessors resolve it. |
| <a id="property-realpath"></a> `realPath?` | `readonly` | `string` | For a filesystem-backed item, its canonical path with every symbolic link resolved. Absent for storage that has no such notion, or when the path cannot be resolved (it does not exist). |
