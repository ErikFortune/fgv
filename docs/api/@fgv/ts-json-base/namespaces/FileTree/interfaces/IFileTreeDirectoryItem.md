[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-json-base](../../../README.md) / [FileTree](../README.md) / IFileTreeDirectoryItem

# Interface: IFileTreeDirectoryItem\<TCT\>

Interface for a read-only directory in a file tree.

## Extended by

- [`IMutableFileTreeDirectoryItem`](IMutableFileTreeDirectoryItem.md)

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TCT` *extends* `string` | `string` |

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="absolutepath"></a> `absolutePath` | `readonly` | `string` | The absolute path of the directory. |
| <a id="name"></a> `name` | `readonly` | `string` | The name of the directory |
| <a id="type"></a> `type` | `readonly` | `"directory"` | Indicates that this [file tree item](../type-aliases/FileTreeItem.md) is a directory |

## Methods

### getChildren()

> **getChildren**(): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<readonly [`FileTreeItem`](../type-aliases/FileTreeItem.md)\<`TCT`\>[]\>

Gets the children of the directory.

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<readonly [`FileTreeItem`](../type-aliases/FileTreeItem.md)\<`TCT`\>[]\>

`Success` with the children of the directory if successful,
or `Failure` with an error message otherwise.
