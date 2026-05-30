[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-json-base](../../../README.md) / [FileTree](../README.md) / FileTree

# Class: FileTree\<TCT\>

Represents a file tree.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TCT` *extends* `string` | `string` |

## Constructors

### Constructor

> `protected` **new FileTree**\<`TCT`\>(`hal`): `FileTree`\<`TCT`\>

Protected constructor for derived classes.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `hal` | [`IFileTreeAccessors`](../interfaces/IFileTreeAccessors.md)\<`TCT`\> | The [accessors](../interfaces/IFileTreeAccessors.md) to use for file system operations. |

#### Returns

`FileTree`\<`TCT`\>

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="hal"></a> `hal` | `public` | [`IFileTreeAccessors`](../interfaces/IFileTreeAccessors.md)\<`TCT`\> | The [accessors](../interfaces/IFileTreeAccessors.md) to use for file system operations. |

## Methods

### getDirectory()

> **getDirectory**(`directoryPath`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IFileTreeDirectoryItem`](../interfaces/IFileTreeDirectoryItem.md)\<`TCT`\>\>

Gets a directory item from the tree.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `directoryPath` | `string` | The path to the directory. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IFileTreeDirectoryItem`](../interfaces/IFileTreeDirectoryItem.md)\<`TCT`\>\>

`Success` with the [directory item](../interfaces/IFileTreeDirectoryItem.md)
if successful, or `Failure` with an error message otherwise.

***

### getFile()

> **getFile**(`filePath`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IFileTreeFileItem`](../interfaces/IFileTreeFileItem.md)\<`TCT`\>\>

Gets a file item from the tree.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `filePath` | `string` | The path to the file. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IFileTreeFileItem`](../interfaces/IFileTreeFileItem.md)\<`TCT`\>\>

`Success` with the [file item](../interfaces/IFileTreeFileItem.md)
if successful, or `Failure` with an error message otherwise.

***

### getItem()

> **getItem**(`itemPath`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`FileTreeItem`](../type-aliases/FileTreeItem.md)\<`TCT`\>\>

Gets an item from the tree.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `itemPath` | `string` | The path to the item. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`FileTreeItem`](../type-aliases/FileTreeItem.md)\<`TCT`\>\>

`Success` with the item if successful,
or `Failure` with an error message otherwise.

***

### create()

> `static` **create**\<`TCT`\>(`hal`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`FileTree`\<`TCT`\>\>

Creates a new FileTree instance with the supplied
accessors.

#### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TCT` *extends* `string` | `string` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `hal` | [`IFileTreeAccessors`](../interfaces/IFileTreeAccessors.md)\<`TCT`\> | The [accessors](../interfaces/IFileTreeAccessors.md) to use for file system operations. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`FileTree`\<`TCT`\>\>
