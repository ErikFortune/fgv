[**@fgv/ts-json-base**](../../../../README.md)

***

[@fgv/ts-json-base](../../../../README.md) / [FileTree](../README.md) / InMemoryTreeAccessors

# Class: InMemoryTreeAccessors\<TCT\>

Implementation of [FileTree.IMutableFileTreeAccessors](../interfaces/IMutableFileTreeAccessors.md) that uses an in-memory
tree to access and modify files and directories.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TCT` *extends* `string` | `string` |

## Implements

- [`IMutableFileTreeAccessors`](../interfaces/IMutableFileTreeAccessors.md)\<`TCT`\>

## Constructors

### Constructor

> `protected` **new InMemoryTreeAccessors**\<`TCT`\>(`files`, `params?`): `InMemoryTreeAccessors`\<`TCT`\>

Protected constructor for derived classes.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `files` | [`IInMemoryFile`](../interfaces/IInMemoryFile.md)\<`TCT`\>[] | An array of [in-memory files](../interfaces/IInMemoryFile.md) to include in the tree. |
| `params?` | [`IFileTreeInitParams`](../interfaces/IFileTreeInitParams.md)\<`TCT`\> | Optional params for the tree. |

#### Returns

`InMemoryTreeAccessors`\<`TCT`\>

## Methods

### createDirectory()

> **createDirectory**(`dirPath`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string`\>

Creates a directory at the given path, including any missing parent directories.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `dirPath` | `string` | The path of the directory to create. |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string`\>

`Success` with the absolute path if created, or `Failure` with an error message.

#### Implementation of

[`IMutableFileTreeAccessors`](../interfaces/IMutableFileTreeAccessors.md).[`createDirectory`](../interfaces/IMutableFileTreeAccessors.md#createdirectory)

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

#### Implementation of

[`IMutableFileTreeAccessors`](../interfaces/IMutableFileTreeAccessors.md).[`fileIsMutable`](../interfaces/IMutableFileTreeAccessors.md#fileismutable)

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

#### Implementation of

[`IMutableFileTreeAccessors`](../interfaces/IMutableFileTreeAccessors.md).[`getBaseName`](../interfaces/IMutableFileTreeAccessors.md#getbasename)

***

### getChildren()

> **getChildren**(`path`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<readonly [`FileTreeItem`](../type-aliases/FileTreeItem.md)\<`TCT`\>[]\>

Gets the children of a directory in the file tree.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `path` | `string` | Path of the directory. |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<readonly [`FileTreeItem`](../type-aliases/FileTreeItem.md)\<`TCT`\>[]\>

The children of the directory.

#### Implementation of

[`IMutableFileTreeAccessors`](../interfaces/IMutableFileTreeAccessors.md).[`getChildren`](../interfaces/IMutableFileTreeAccessors.md#getchildren)

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

#### Implementation of

[`IMutableFileTreeAccessors`](../interfaces/IMutableFileTreeAccessors.md).[`getExtension`](../interfaces/IMutableFileTreeAccessors.md#getextension)

***

### getFileContents()

> **getFileContents**(`path`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string`\>

Gets the contents of a file in the file tree.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `path` | `string` | Absolute path of the file. |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string`\>

The contents of the file.

#### Implementation of

[`IMutableFileTreeAccessors`](../interfaces/IMutableFileTreeAccessors.md).[`getFileContents`](../interfaces/IMutableFileTreeAccessors.md#getfilecontents)

***

### getFileContentType()

> **getFileContentType**(`path`, `provided?`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TCT` \| `undefined`\>

Gets the content type of a file in the file tree.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `path` | `string` | Absolute path of the file. |
| `provided?` | `string` | Optional supplied content type. |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TCT` \| `undefined`\>

The content type of the file.

#### Implementation of

[`IMutableFileTreeAccessors`](../interfaces/IMutableFileTreeAccessors.md).[`getFileContentType`](../interfaces/IMutableFileTreeAccessors.md#getfilecontenttype)

***

### getItem()

> **getItem**(`itemPath`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`FileTreeItem`](../type-aliases/FileTreeItem.md)\<`TCT`\>\>

Gets an item from the file tree.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `itemPath` | `string` | Path of the item to get. |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`FileTreeItem`](../type-aliases/FileTreeItem.md)\<`TCT`\>\>

The item if it exists.

#### Implementation of

[`IMutableFileTreeAccessors`](../interfaces/IMutableFileTreeAccessors.md).[`getItem`](../interfaces/IMutableFileTreeAccessors.md#getitem)

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

#### Implementation of

[`IMutableFileTreeAccessors`](../interfaces/IMutableFileTreeAccessors.md).[`joinPaths`](../interfaces/IMutableFileTreeAccessors.md#joinpaths)

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

#### Implementation of

[`IMutableFileTreeAccessors`](../interfaces/IMutableFileTreeAccessors.md).[`resolveAbsolutePath`](../interfaces/IMutableFileTreeAccessors.md#resolveabsolutepath)

***

### saveFileContents()

> **saveFileContents**(`path`, `contents`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string`\>

Saves the contents to a file at the given path.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `path` | `string` | The path of the file to save. |
| `contents` | `string` | The string contents to save. |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string`\>

`Success` if the file was saved, or `Failure` with an error message.

#### Implementation of

[`IMutableFileTreeAccessors`](../interfaces/IMutableFileTreeAccessors.md).[`saveFileContents`](../interfaces/IMutableFileTreeAccessors.md#savefilecontents)

***

### create()

Creates a new InMemoryTreeAccessors instance with the supplied
in-memory files.

#### Param

An array of [in-memory files](../interfaces/IInMemoryFile.md) to include in the tree.

#### Param

Optional params for the tree.

#### Call Signature

> `static` **create**\<`TCT`\>(`files`, `prefix?`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`InMemoryTreeAccessors`\<`TCT`\>\>

Creates a new InMemoryTreeAccessors instance with the supplied
in-memory files.

##### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TCT` *extends* `string` | `string` |

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `files` | [`IInMemoryFile`](../interfaces/IInMemoryFile.md)\<`TCT`\>[] | An array of [in-memory files](../interfaces/IInMemoryFile.md) to include in the tree. |
| `prefix?` | `string` | Optional prefix for the tree. |

##### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`InMemoryTreeAccessors`\<`TCT`\>\>

#### Call Signature

> `static` **create**\<`TCT`\>(`files`, `params?`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`InMemoryTreeAccessors`\<`TCT`\>\>

Creates a new InMemoryTreeAccessors instance with the supplied
in-memory files.

##### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TCT` *extends* `string` | `string` |

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `files` | [`IInMemoryFile`](../interfaces/IInMemoryFile.md)\<`TCT`\>[] | An array of [in-memory files](../interfaces/IInMemoryFile.md) to include in the tree. |
| `params?` | [`IFileTreeInitParams`](../interfaces/IFileTreeInitParams.md)\<`TCT`\> | Optional params for the tree. |

##### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`InMemoryTreeAccessors`\<`TCT`\>\>
