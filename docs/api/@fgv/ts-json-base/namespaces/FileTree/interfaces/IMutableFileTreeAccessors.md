[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-json-base](../../../README.md) / [FileTree](../README.md) / IMutableFileTreeAccessors

# Interface: IMutableFileTreeAccessors\<TCT\>

Extended accessors interface that supports mutation operations.
All mutation methods are required — use [isMutableAccessors](../functions/isMutableAccessors.md)
type guard to check if an accessor supports mutation.

## Extends

- [`IFileTreeAccessors`](IFileTreeAccessors.md)\<`TCT`\>

## Extended by

- [`IPersistentFileTreeAccessors`](IPersistentFileTreeAccessors.md)

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TCT` *extends* `string` | `string` |

## Methods

### createDirectory()

> **createDirectory**(`path`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>

Creates a directory at the given path, including any missing parent directories.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `path` | `string` | The path of the directory to create. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>

`Success` with the absolute path if created, or `Failure` with an error message.

***

### deleteDirectory()

> **deleteDirectory**(`path`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`boolean`\>

Deletes a directory at the given path.
The directory must be empty or the operation will fail.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `path` | `string` | The path of the directory to delete. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`boolean`\>

`Success` with `true` if the directory was deleted, or `Failure` with an error message.

***

### deleteFile()

> **deleteFile**(`path`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`boolean`\>

Deletes a file at the given path.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `path` | `string` | The path of the file to delete. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`boolean`\>

`Success` with `true` if the file was deleted, or `Failure` with an error message.

***

### fileIsMutable()

> **fileIsMutable**(`path`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`boolean`, [`SaveDetail`](../type-aliases/SaveDetail.md)\>

Checks if a file at the given path can be saved.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `path` | `string` | The path to check. |

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`boolean`, [`SaveDetail`](../type-aliases/SaveDetail.md)\>

`DetailedSuccess` with [FileTree.SaveCapability](../type-aliases/SaveCapability.md) if the file can be saved,
or `DetailedFailure` with [FileTree.SaveFailureReason](../type-aliases/SaveFailureReason.md) if it cannot.

***

### getBaseName()

> **getBaseName**(`path`, `suffix?`): `string`

Gets the base name of a path.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `path` | `string` | Path to get the base name of. |
| `suffix?` | `string` | Optional suffix to remove from the base name. |

#### Returns

`string`

The base name of the path.

#### Inherited from

[`IFileTreeAccessors`](IFileTreeAccessors.md).[`getBaseName`](IFileTreeAccessors.md#getbasename)

***

### getChildren()

> **getChildren**(`path`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<readonly [`FileTreeItem`](../type-aliases/FileTreeItem.md)\<`TCT`\>[]\>

Gets the children of a directory in the file tree.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `path` | `string` | Path of the directory. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<readonly [`FileTreeItem`](../type-aliases/FileTreeItem.md)\<`TCT`\>[]\>

The children of the directory.

#### Inherited from

[`IFileTreeAccessors`](IFileTreeAccessors.md).[`getChildren`](IFileTreeAccessors.md#getchildren)

***

### getExtension()

> **getExtension**(`path`): `string`

Gets the extension of a path.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `path` | `string` | Path to get the extension of. |

#### Returns

`string`

The extension of the path.

#### Inherited from

[`IFileTreeAccessors`](IFileTreeAccessors.md).[`getExtension`](IFileTreeAccessors.md#getextension)

***

### getFileContents()

> **getFileContents**(`path`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>

Gets the contents of a file in the file tree.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `path` | `string` | Absolute path of the file. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>

The contents of the file.

#### Inherited from

[`IFileTreeAccessors`](IFileTreeAccessors.md).[`getFileContents`](IFileTreeAccessors.md#getfilecontents)

***

### getFileContentType()

> **getFileContentType**(`path`, `provided?`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`TCT` \| `undefined`\>

Gets the content type of a file in the file tree.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `path` | `string` | Absolute path of the file. |
| `provided?` | `string` | Optional supplied content type. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`TCT` \| `undefined`\>

The content type of the file.

#### Inherited from

[`IFileTreeAccessors`](IFileTreeAccessors.md).[`getFileContentType`](IFileTreeAccessors.md#getfilecontenttype)

***

### getItem()

> **getItem**(`path`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`FileTreeItem`](../type-aliases/FileTreeItem.md)\<`TCT`\>\>

Gets an item from the file tree.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `path` | `string` | Path of the item to get. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`FileTreeItem`](../type-aliases/FileTreeItem.md)\<`TCT`\>\>

The item if it exists.

#### Inherited from

[`IFileTreeAccessors`](IFileTreeAccessors.md).[`getItem`](IFileTreeAccessors.md#getitem)

***

### joinPaths()

> **joinPaths**(...`paths`): `string`

Joins paths together.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| ...`paths` | `string`[] | Paths to join. |

#### Returns

`string`

The joined paths.

#### Inherited from

[`IFileTreeAccessors`](IFileTreeAccessors.md).[`joinPaths`](IFileTreeAccessors.md#joinpaths)

***

### resolveAbsolutePath()

> **resolveAbsolutePath**(...`paths`): `string`

Resolves paths to an absolute path.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| ...`paths` | `string`[] | Paths to resolve. |

#### Returns

`string`

The resolved absolute path.

#### Inherited from

[`IFileTreeAccessors`](IFileTreeAccessors.md).[`resolveAbsolutePath`](IFileTreeAccessors.md#resolveabsolutepath)

***

### saveFileContents()

> **saveFileContents**(`path`, `contents`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>

Saves the contents to a file at the given path.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `path` | `string` | The path of the file to save. |
| `contents` | `string` | The string contents to save. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>

`Success` if the file was saved, or `Failure` with an error message.
