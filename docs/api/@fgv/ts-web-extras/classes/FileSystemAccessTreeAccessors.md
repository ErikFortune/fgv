[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-web-extras](../README.md) / FileSystemAccessTreeAccessors

# Class: FileSystemAccessTreeAccessors\<TCT\>

Implementation of `FileTree.IPersistentFileTreeAccessors` that uses the File System Access API
to provide persistent file editing in browsers.

## Extends

- [`InMemoryTreeAccessors`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`TCT`\>

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TCT` *extends* `string` | `string` |

## Implements

- [`IPersistentFileTreeAccessors`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`TCT`\>

## Constructors

### Constructor

> `protected` **new FileSystemAccessTreeAccessors**\<`TCT`\>(`files`, `rootDir`, `handles`, `params`, `hasWritePermission`): `FileSystemAccessTreeAccessors`\<`TCT`\>

Protected constructor for FileSystemAccessTreeAccessors.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `files` | [`IInMemoryFile`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`TCT`\>[] | An array of in-memory files to include in the tree. |
| `rootDir` | [`FileSystemDirectoryHandle`](../interfaces/FileSystemDirectoryHandle.md) | The root directory handle. |
| `handles` | `Map`\<`string`, [`FileSystemFileHandle`](../interfaces/FileSystemFileHandle.md)\> | Map of file paths to their handles. |
| `params` | [`IFileSystemAccessTreeParams`](../interfaces/IFileSystemAccessTreeParams.md)\<`TCT`\> \| `undefined` | Optional params for the tree. |
| `hasWritePermission` | `boolean` | Whether write permission was granted. |

#### Returns

`FileSystemAccessTreeAccessors`\<`TCT`\>

#### Overrides

`FileTree.InMemoryTreeAccessors<TCT>.constructor`

## Methods

### createDirectory()

> **createDirectory**(`dirPath`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>

Creates a directory at the given path, including any missing parent directories.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `dirPath` | `string` | The path of the directory to create. |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>

`Success` with the absolute path if created, or `Failure` with an error message.

#### Implementation of

`FileTree.IPersistentFileTreeAccessors.createDirectory`

#### Inherited from

`FileTree.InMemoryTreeAccessors.createDirectory`

***

### deleteDirectory()

> **deleteDirectory**(`path`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`boolean`\>

Deletes a directory at the given path.
The directory must be empty or the operation will fail.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `path` | `string` | The path of the directory to delete. |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`boolean`\>

`Success` with `true` if the directory was deleted, or `Failure` with an error message.

#### Implementation of

`FileTree.IPersistentFileTreeAccessors.deleteDirectory`

#### Inherited from

`FileTree.InMemoryTreeAccessors.deleteDirectory`

***

### deleteFile()

> **deleteFile**(`path`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`boolean`\>

Override deleteFile to track pending deletions for syncToDisk.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `path` | `string` |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`boolean`\>

#### Implementation of

`FileTree.IPersistentFileTreeAccessors.deleteFile`

#### Overrides

`FileTree.InMemoryTreeAccessors.deleteFile`

***

### fileIsMutable()

> **fileIsMutable**(`path`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`boolean`, [`SaveDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\>

Implements `FileTree.IMutableFileTreeAccessors.fileIsMutable`

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `path` | `string` |

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`boolean`, [`SaveDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\>

#### Implementation of

`FileTree.IPersistentFileTreeAccessors.fileIsMutable`

#### Overrides

`FileTree.InMemoryTreeAccessors.fileIsMutable`

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

`FileTree.IPersistentFileTreeAccessors.getBaseName`

#### Inherited from

`FileTree.InMemoryTreeAccessors.getBaseName`

***

### getChildren()

> **getChildren**(`path`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<readonly [`FileTreeItem`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`TCT`\>[]\>

Gets the children of a directory in the file tree.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `path` | `string` | Path of the directory. |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<readonly [`FileTreeItem`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`TCT`\>[]\>

The children of the directory.

#### Implementation of

`FileTree.IPersistentFileTreeAccessors.getChildren`

#### Inherited from

`FileTree.InMemoryTreeAccessors.getChildren`

***

### getDirtyPaths()

> **getDirtyPaths**(): `string`[]

Implements `FileTree.IPersistentFileTreeAccessors.getDirtyPaths`

#### Returns

`string`[]

#### Implementation of

`FileTree.IPersistentFileTreeAccessors.getDirtyPaths`

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

`FileTree.IPersistentFileTreeAccessors.getExtension`

#### Inherited from

`FileTree.InMemoryTreeAccessors.getExtension`

***

### getFileContents()

> **getFileContents**(`path`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>

Gets the contents of a file in the file tree.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `path` | `string` | Absolute path of the file. |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>

The contents of the file.

#### Implementation of

`FileTree.IPersistentFileTreeAccessors.getFileContents`

#### Inherited from

`FileTree.InMemoryTreeAccessors.getFileContents`

***

### getFileContentType()

> **getFileContentType**(`path`, `provided?`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`TCT` \| `undefined`\>

Gets the content type of a file in the file tree.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `path` | `string` | Absolute path of the file. |
| `provided?` | `string` | Optional supplied content type. |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`TCT` \| `undefined`\>

The content type of the file.

#### Implementation of

`FileTree.IPersistentFileTreeAccessors.getFileContentType`

#### Inherited from

`FileTree.InMemoryTreeAccessors.getFileContentType`

***

### getItem()

> **getItem**(`itemPath`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`FileTreeItem`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`TCT`\>\>

Gets an item from the file tree.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `itemPath` | `string` | Path of the item to get. |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`FileTreeItem`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`TCT`\>\>

The item if it exists.

#### Implementation of

`FileTree.IPersistentFileTreeAccessors.getItem`

#### Inherited from

`FileTree.InMemoryTreeAccessors.getItem`

***

### isDirty()

> **isDirty**(): `boolean`

Implements `FileTree.IPersistentFileTreeAccessors.isDirty`

#### Returns

`boolean`

#### Implementation of

`FileTree.IPersistentFileTreeAccessors.isDirty`

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

`FileTree.IPersistentFileTreeAccessors.joinPaths`

#### Inherited from

`FileTree.InMemoryTreeAccessors.joinPaths`

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

`FileTree.IPersistentFileTreeAccessors.resolveAbsolutePath`

#### Inherited from

`FileTree.InMemoryTreeAccessors.resolveAbsolutePath`

***

### saveFileContents()

> **saveFileContents**(`path`, `contents`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>

Implements `FileTree.IMutableFileTreeAccessors.saveFileContents`

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `path` | `string` |
| `contents` | `string` |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>

#### Implementation of

`FileTree.IPersistentFileTreeAccessors.saveFileContents`

#### Overrides

`FileTree.InMemoryTreeAccessors.saveFileContents`

***

### syncToDisk()

> **syncToDisk**(): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`void`\>\>

Implements `FileTree.IPersistentFileTreeAccessors.syncToDisk`

#### Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`void`\>\>

#### Implementation of

`FileTree.IPersistentFileTreeAccessors.syncToDisk`

***

### create()

#### Call Signature

> `static` **create**\<`TCT`\>(`files`, `prefix?`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`InMemoryTreeAccessors`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`TCT`\>\>

Creates a new [InMemoryTreeAccessors](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) instance with the supplied
in-memory files.

##### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TCT` *extends* `string` | `string` |

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `files` | [`IInMemoryFile`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`TCT`\>[] | An array of [in-memory files](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) to include in the tree. |
| `prefix?` | `string` | Optional prefix for the tree. |

##### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`InMemoryTreeAccessors`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`TCT`\>\>

##### Inherited from

`FileTree.InMemoryTreeAccessors.create`

#### Call Signature

> `static` **create**\<`TCT`\>(`files`, `params?`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`InMemoryTreeAccessors`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`TCT`\>\>

Creates a new [InMemoryTreeAccessors](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) instance with the supplied
in-memory files.

##### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TCT` *extends* `string` | `string` |

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `files` | [`IInMemoryFile`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`TCT`\>[] | An array of [in-memory files](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) to include in the tree. |
| `params?` | [`IFileTreeInitParams`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`TCT`\> | Optional params for the tree. |

##### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`InMemoryTreeAccessors`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`TCT`\>\>

##### Inherited from

`FileTree.InMemoryTreeAccessors.create`

***

### fromDirectoryHandle()

> `static` **fromDirectoryHandle**\<`TCT`\>(`dirHandle`, `params?`): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`FileSystemAccessTreeAccessors`\<`TCT`\>\>\>

Creates a new FileSystemAccessTreeAccessors instance from a directory handle.

#### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TCT` *extends* `string` | `string` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `dirHandle` | [`FileSystemDirectoryHandle`](../interfaces/FileSystemDirectoryHandle.md) | The FileSystemDirectoryHandle to load files from. |
| `params?` | [`IFileSystemAccessTreeParams`](../interfaces/IFileSystemAccessTreeParams.md)\<`TCT`\> | Optional parameters including autoSync and permission settings. |

#### Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`FileSystemAccessTreeAccessors`\<`TCT`\>\>\>

Promise resolving to a FileSystemAccessTreeAccessors instance.

***

### fromFileHandle()

> `static` **fromFileHandle**\<`TCT`\>(`fileHandle`, `params?`): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`FileSystemAccessTreeAccessors`\<`TCT`\>\>\>

Creates a new FileSystemAccessTreeAccessors instance from a single file handle.

The resulting tree contains exactly one file at `/<filename>`.
`syncToDisk()` writes changes back to the original file via the File System Access API.
New file creation is not supported on this tree (no parent directory handle).

#### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TCT` *extends* `string` | `string` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `fileHandle` | [`FileSystemFileHandle`](../interfaces/FileSystemFileHandle.md) | The FileSystemFileHandle to load. |
| `params?` | [`IFileSystemAccessTreeParams`](../interfaces/IFileSystemAccessTreeParams.md)\<`TCT`\> | Optional parameters including autoSync and permission settings. |

#### Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`FileSystemAccessTreeAccessors`\<`TCT`\>\>\>

Promise resolving to a FileSystemAccessTreeAccessors instance.
