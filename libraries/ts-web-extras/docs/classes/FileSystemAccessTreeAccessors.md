[**@fgv/ts-web-extras**](../README.md)

***

[@fgv/ts-web-extras](../README.md) / FileSystemAccessTreeAccessors

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

> **createDirectory**(`dirPath`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string`\>

FileTree.IMutableFileTreeAccessors.createDirectory

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `dirPath` | `string` |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string`\>

#### Implementation of

`FileTree.IPersistentFileTreeAccessors.createDirectory`

#### Inherited from

`FileTree.InMemoryTreeAccessors.createDirectory`

***

### deleteFile()

> **deleteFile**(`path`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`boolean`\>

FileTree.IMutableFileTreeAccessors.deleteFile

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `path` | `string` |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`boolean`\>

#### Implementation of

`FileTree.IPersistentFileTreeAccessors.deleteFile`

#### Inherited from

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

FileTree.IFileTreeAccessors.getBaseName

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `path` | `string` |
| `suffix?` | `string` |

#### Returns

`string`

#### Implementation of

`FileTree.IPersistentFileTreeAccessors.getBaseName`

#### Inherited from

`FileTree.InMemoryTreeAccessors.getBaseName`

***

### getChildren()

> **getChildren**(`path`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<readonly [`FileTreeItem`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`TCT`\>[]\>

FileTree.IFileTreeAccessors.getChildren

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `path` | `string` |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<readonly [`FileTreeItem`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`TCT`\>[]\>

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

FileTree.IFileTreeAccessors.getExtension

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `path` | `string` |

#### Returns

`string`

#### Implementation of

`FileTree.IPersistentFileTreeAccessors.getExtension`

#### Inherited from

`FileTree.InMemoryTreeAccessors.getExtension`

***

### getFileContents()

> **getFileContents**(`path`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string`\>

FileTree.IFileTreeAccessors.getFileContents

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `path` | `string` |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string`\>

#### Implementation of

`FileTree.IPersistentFileTreeAccessors.getFileContents`

#### Inherited from

`FileTree.InMemoryTreeAccessors.getFileContents`

***

### getFileContentType()

> **getFileContentType**(`path`, `provided?`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TCT` \| `undefined`\>

FileTree.IFileTreeAccessors.getFileContentType

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `path` | `string` |
| `provided?` | `string` |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TCT` \| `undefined`\>

#### Implementation of

`FileTree.IPersistentFileTreeAccessors.getFileContentType`

#### Inherited from

`FileTree.InMemoryTreeAccessors.getFileContentType`

***

### getItem()

> **getItem**(`itemPath`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`FileTreeItem`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`TCT`\>\>

FileTree.IFileTreeAccessors.getItem

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `itemPath` | `string` |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`FileTreeItem`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`TCT`\>\>

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

FileTree.IFileTreeAccessors.joinPaths

#### Parameters

| Parameter | Type |
| ------ | ------ |
| ...`paths` | `string`[] |

#### Returns

`string`

#### Implementation of

`FileTree.IPersistentFileTreeAccessors.joinPaths`

#### Inherited from

`FileTree.InMemoryTreeAccessors.joinPaths`

***

### resolveAbsolutePath()

> **resolveAbsolutePath**(...`paths`): `string`

FileTree.IFileTreeAccessors.resolveAbsolutePath

#### Parameters

| Parameter | Type |
| ------ | ------ |
| ...`paths` | `string`[] |

#### Returns

`string`

#### Implementation of

`FileTree.IPersistentFileTreeAccessors.resolveAbsolutePath`

#### Inherited from

`FileTree.InMemoryTreeAccessors.resolveAbsolutePath`

***

### saveFileContents()

> **saveFileContents**(`path`, `contents`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string`\>

Implements `FileTree.IMutableFileTreeAccessors.saveFileContents`

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `path` | `string` |
| `contents` | `string` |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string`\>

#### Implementation of

`FileTree.IPersistentFileTreeAccessors.saveFileContents`

#### Overrides

`FileTree.InMemoryTreeAccessors.saveFileContents`

***

### syncToDisk()

> **syncToDisk**(): `Promise`\<[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`void`\>\>

Implements `FileTree.IPersistentFileTreeAccessors.syncToDisk`

#### Returns

`Promise`\<[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`void`\>\>

#### Implementation of

`FileTree.IPersistentFileTreeAccessors.syncToDisk`

***

### create()

#### Call Signature

> `static` **create**\<`TCT`\>(`files`, `prefix?`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`InMemoryTreeAccessors`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`TCT`\>\>

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

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`InMemoryTreeAccessors`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`TCT`\>\>

##### Inherited from

`FileTree.InMemoryTreeAccessors.create`

#### Call Signature

> `static` **create**\<`TCT`\>(`files`, `params?`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`InMemoryTreeAccessors`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`TCT`\>\>

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

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`InMemoryTreeAccessors`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`TCT`\>\>

##### Inherited from

`FileTree.InMemoryTreeAccessors.create`

***

### fromDirectoryHandle()

> `static` **fromDirectoryHandle**\<`TCT`\>(`dirHandle`, `params?`): `Promise`\<[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`FileSystemAccessTreeAccessors`\<`TCT`\>\>\>

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

`Promise`\<[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`FileSystemAccessTreeAccessors`\<`TCT`\>\>\>

Promise resolving to a FileSystemAccessTreeAccessors instance.

***

### fromFileHandle()

> `static` **fromFileHandle**\<`TCT`\>(`fileHandle`, `params?`): `Promise`\<[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`FileSystemAccessTreeAccessors`\<`TCT`\>\>\>

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

`Promise`\<[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`FileSystemAccessTreeAccessors`\<`TCT`\>\>\>

Promise resolving to a FileSystemAccessTreeAccessors instance.
