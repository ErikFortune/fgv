[**@fgv/ts-json-base**](../../../../README.md)

***

[@fgv/ts-json-base](../../../../README.md) / [FileTree](../README.md) / IMutableFileTreeDirectoryItem

# Interface: IMutableFileTreeDirectoryItem\<TCT\>

Extended directory item interface that supports mutation operations.
Use [isMutableDirectoryItem](../functions/isMutableDirectoryItem.md) type guard to narrow.

## Extends

- [`IFileTreeDirectoryItem`](IFileTreeDirectoryItem.md)\<`TCT`\>

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

### createChildDirectory()

> **createChildDirectory**(`name`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`IMutableFileTreeDirectoryItem`\<`TCT`\>\>

Creates a new subdirectory as a child of this directory.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `name` | `string` | The directory name to create. |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`IMutableFileTreeDirectoryItem`\<`TCT`\>\>

`Success` with the new directory item, or `Failure` with an error message.

***

### createChildFile()

> **createChildFile**(`name`, `contents`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IMutableFileTreeFileItem`](IMutableFileTreeFileItem.md)\<`TCT`\>\>

Creates a new file as a child of this directory.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `name` | `string` | The file name to create. |
| `contents` | `string` | The string contents to write. |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IMutableFileTreeFileItem`](IMutableFileTreeFileItem.md)\<`TCT`\>\>

`Success` with the new file item, or `Failure` with an error message.

***

### delete()

> **delete**(): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`boolean`\>

Deletes this directory from its backing store.
The directory must be empty or the operation will fail.

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`boolean`\>

`Success` with `true` if the directory was deleted, or `Failure` with an error message.

***

### deleteChild()

> **deleteChild**(`name`, `options?`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`boolean`\>

Deletes a child item from this directory.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `name` | `string` | The name of the child to delete. |
| `options?` | [`IDeleteChildOptions`](IDeleteChildOptions.md) | Optional [options](IDeleteChildOptions.md) controlling deletion behavior. |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`boolean`\>

`Success` with `true` if the child was deleted, or `Failure` with an error message.

***

### getChildren()

> **getChildren**(): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<readonly [`FileTreeItem`](../type-aliases/FileTreeItem.md)\<`TCT`\>[]\>

Gets the children of the directory.

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<readonly [`FileTreeItem`](../type-aliases/FileTreeItem.md)\<`TCT`\>[]\>

`Success` with the children of the directory if successful,
or `Failure` with an error message otherwise.

#### Inherited from

[`IFileTreeDirectoryItem`](IFileTreeDirectoryItem.md).[`getChildren`](IFileTreeDirectoryItem.md#getchildren)
