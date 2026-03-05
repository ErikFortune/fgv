[**@fgv/ts-extras**](../../../../README.md)

***

[@fgv/ts-extras](../../../../README.md) / [ZipFileTree](../README.md) / ZipDirectoryItem

# Class: ZipDirectoryItem\<TCT\>

Implementation of `IFileTreeDirectoryItem` for directories in a ZIP archive.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TCT` *extends* `string` | `string` |

## Implements

- [`IFileTreeDirectoryItem`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`TCT`\>

## Constructors

### Constructor

> **new ZipDirectoryItem**\<`TCT`\>(`directoryPath`, `accessors`): `ZipDirectoryItem`\<`TCT`\>

Constructor for ZipDirectoryItem.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `directoryPath` | `string` | The path of the directory within the ZIP. |
| `accessors` | [`ZipFileTreeAccessors`](ZipFileTreeAccessors.md)\<`TCT`\> | The ZIP file tree accessors. |

#### Returns

`ZipDirectoryItem`\<`TCT`\>

## Properties

| Property | Modifier | Type | Default value | Description |
| ------ | ------ | ------ | ------ | ------ |
| <a id="absolutepath"></a> `absolutePath` | `readonly` | `string` | `undefined` | The absolute path of the directory within the ZIP archive. |
| <a id="name"></a> `name` | `readonly` | `string` | `undefined` | The name of the directory |
| <a id="type"></a> `type` | `readonly` | `"directory"` | `'directory'` | Indicates that this `FileTree.FileTreeItem` is a directory. |

## Methods

### getChildren()

> **getChildren**(): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<readonly [`FileTreeItem`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`TCT`\>[]\>

Gets the children of the directory.

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<readonly [`FileTreeItem`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`TCT`\>[]\>

#### Implementation of

`FileTree.IFileTreeDirectoryItem.getChildren`
