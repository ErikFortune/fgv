[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-json-base](../../../README.md) / [FileTree](../README.md) / DirectoryItem

# Class: DirectoryItem\<TCT\>

Class representing a directory in a file tree.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TCT` *extends* `string` | `string` |

## Implements

- [`IMutableFileTreeDirectoryItem`](../interfaces/IMutableFileTreeDirectoryItem.md)\<`TCT`\>

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

[`IMutableFileTreeDirectoryItem`](../interfaces/IMutableFileTreeDirectoryItem.md).[`name`](../interfaces/IMutableFileTreeDirectoryItem.md#name)

## Methods

### createChildDirectory()

> **createChildDirectory**(`name`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IMutableFileTreeDirectoryItem`](../interfaces/IMutableFileTreeDirectoryItem.md)\<`TCT`\>\>

Creates a new subdirectory as a child of this directory.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `name` | `string` | The directory name to create. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IMutableFileTreeDirectoryItem`](../interfaces/IMutableFileTreeDirectoryItem.md)\<`TCT`\>\>

`Success` with the new directory item, or `Failure` with an error message.

#### Implementation of

[`IMutableFileTreeDirectoryItem`](../interfaces/IMutableFileTreeDirectoryItem.md).[`createChildDirectory`](../interfaces/IMutableFileTreeDirectoryItem.md#createchilddirectory)

***

### createChildFile()

> **createChildFile**(`name`, `contents`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IMutableFileTreeFileItem`](../interfaces/IMutableFileTreeFileItem.md)\<`TCT`\>\>

Creates a new file as a child of this directory.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `name` | `string` | The file name to create. |
| `contents` | `string` | The string contents to write. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IMutableFileTreeFileItem`](../interfaces/IMutableFileTreeFileItem.md)\<`TCT`\>\>

`Success` with the new file item, or `Failure` with an error message.

#### Implementation of

[`IMutableFileTreeDirectoryItem`](../interfaces/IMutableFileTreeDirectoryItem.md).[`createChildFile`](../interfaces/IMutableFileTreeDirectoryItem.md#createchildfile)

***

### delete()

> **delete**(): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`boolean`\>

Deletes this directory from its backing store.
The directory must be empty or the operation will fail.

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`boolean`\>

`Success` with `true` if the directory was deleted, or `Failure` with an error message.

#### Implementation of

[`IMutableFileTreeDirectoryItem`](../interfaces/IMutableFileTreeDirectoryItem.md).[`delete`](../interfaces/IMutableFileTreeDirectoryItem.md#delete)

***

### deleteChild()

> **deleteChild**(`name`, `options?`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`boolean`\>

Deletes a child item from this directory.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `name` | `string` | The name of the child to delete. |
| `options?` | [`IDeleteChildOptions`](../interfaces/IDeleteChildOptions.md) | Optional [options](../interfaces/IDeleteChildOptions.md) controlling deletion behavior. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`boolean`\>

`Success` with `true` if the child was deleted, or `Failure` with an error message.

#### Implementation of

[`IMutableFileTreeDirectoryItem`](../interfaces/IMutableFileTreeDirectoryItem.md).[`deleteChild`](../interfaces/IMutableFileTreeDirectoryItem.md#deletechild)

***

### getChildren()

> **getChildren**(): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<readonly [`FileTreeItem`](../type-aliases/FileTreeItem.md)\<`TCT`\>[]\>

Gets the children of the directory.

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<readonly [`FileTreeItem`](../type-aliases/FileTreeItem.md)\<`TCT`\>[]\>

`Success` with the children of the directory if successful,
or `Failure` with an error message otherwise.

#### Implementation of

[`IMutableFileTreeDirectoryItem`](../interfaces/IMutableFileTreeDirectoryItem.md).[`getChildren`](../interfaces/IMutableFileTreeDirectoryItem.md#getchildren)

***

### create()

> `static` **create**\<`TCT`\>(`path`, `hal`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`DirectoryItem`\<`TCT`\>\>

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

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`DirectoryItem`\<`TCT`\>\>

`Success` with the new DirectoryItem instance if successful,
or `Failure` with an error message otherwise.
