[**@fgv/ts-json-base**](../../../../README.md)

***

[@fgv/ts-json-base](../../../../README.md) / [FileTree](../README.md) / DirectoryItem

# Class: DirectoryItem\<TCT\>

Class representing a directory in a file tree.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TCT` *extends* `string` | `string` |

## Implements

- [`IFileTreeDirectoryItem`](../interfaces/IFileTreeDirectoryItem.md)\<`TCT`\>

## Constructors

### Constructor

> `protected` **new DirectoryItem**\<`TCT`\>(`path`, `hal`): `DirectoryItem`\<`TCT`\>

Protected constructor for derived classes.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `path` | `string` | Relative path of the directory. |
| `hal` | [`IFileTreeAccessors`](../interfaces/IFileTreeAccessors.md)\<`TCT`\> | The [accessors](../interfaces/IFileTreeAccessors.md) to use for file system operations. |

#### Returns

`DirectoryItem`\<`TCT`\>

## Properties

| Property | Modifier | Type | Default value | Description |
| ------ | ------ | ------ | ------ | ------ |
| <a id="_hal"></a> `_hal` | `readonly` | [`IFileTreeAccessors`](../interfaces/IFileTreeAccessors.md)\<`TCT`\> | `undefined` | The [accessors](../interfaces/IFileTreeAccessors.md) to use for file system operations. |
| <a id="absolutepath"></a> `absolutePath` | `readonly` | `string` | `undefined` | The absolute path of the directory. |
| <a id="type"></a> `type` | `readonly` | `"directory"` | `'directory'` | Indicates that this [file tree item](../type-aliases/FileTreeItem.md) is a directory |

## Accessors

### name

#### Get Signature

> **get** **name**(): `string`

The name of the directory

##### Returns

`string`

The name of the directory

#### Implementation of

[`IFileTreeDirectoryItem`](../interfaces/IFileTreeDirectoryItem.md).[`name`](../interfaces/IFileTreeDirectoryItem.md#name)

## Methods

### createChildDirectory()

> **createChildDirectory**(`name`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IFileTreeDirectoryItem`](../interfaces/IFileTreeDirectoryItem.md)\<`TCT`\>\>

Creates a new subdirectory as a child of this directory.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `name` | `string` | The directory name to create. |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IFileTreeDirectoryItem`](../interfaces/IFileTreeDirectoryItem.md)\<`TCT`\>\>

`Success` with the new directory item, or `Failure` with an error message.

#### Remarks

This method is optional. Only available on mutable directory items.

#### Implementation of

[`IFileTreeDirectoryItem`](../interfaces/IFileTreeDirectoryItem.md).[`createChildDirectory`](../interfaces/IFileTreeDirectoryItem.md#createchilddirectory)

***

### createChildFile()

> **createChildFile**(`name`, `contents`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IFileTreeFileItem`](../interfaces/IFileTreeFileItem.md)\<`TCT`\>\>

Creates a new file as a child of this directory.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `name` | `string` | The file name to create. |
| `contents` | `string` | The string contents to write. |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IFileTreeFileItem`](../interfaces/IFileTreeFileItem.md)\<`TCT`\>\>

`Success` with the new file item, or `Failure` with an error message.

#### Remarks

This method is optional. Only available on mutable directory items.

#### Implementation of

[`IFileTreeDirectoryItem`](../interfaces/IFileTreeDirectoryItem.md).[`createChildFile`](../interfaces/IFileTreeDirectoryItem.md#createchildfile)

***

### getChildren()

> **getChildren**(): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<readonly [`FileTreeItem`](../type-aliases/FileTreeItem.md)\<`TCT`\>[]\>

Gets the children of the directory.

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<readonly [`FileTreeItem`](../type-aliases/FileTreeItem.md)\<`TCT`\>[]\>

`Success` with the children of the directory if successful,
or `Failure` with an error message otherwise.

#### Implementation of

[`IFileTreeDirectoryItem`](../interfaces/IFileTreeDirectoryItem.md).[`getChildren`](../interfaces/IFileTreeDirectoryItem.md#getchildren)

***

### create()

> `static` **create**\<`TCT`\>(`path`, `hal`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`DirectoryItem`\<`TCT`\>\>

Creates a new DirectoryItem instance.

#### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TCT` *extends* `string` | `string` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `path` | `string` | Relative path of the directory. |
| `hal` | [`IFileTreeAccessors`](../interfaces/IFileTreeAccessors.md)\<`TCT`\> | The [accessors](../interfaces/IFileTreeAccessors.md) to use for file system operations. |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`DirectoryItem`\<`TCT`\>\>

`Success` with the new DirectoryItem instance if successful,
or `Failure` with an error message otherwise.
