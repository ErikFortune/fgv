[**@fgv/ts-web-extras**](../README.md)

***

[@fgv/ts-web-extras](../README.md) / FileApiTreeAccessors

# Class: FileApiTreeAccessors\<TCT\>

Helper class to create FileTree instances from various file sources.
Supports File API (FileList) and File System Access API handles.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TCT` *extends* `string` | `string` |

## Constructors

### Constructor

> **new FileApiTreeAccessors**\<`TCT`\>(): `FileApiTreeAccessors`\<`TCT`\>

#### Returns

`FileApiTreeAccessors`\<`TCT`\>

## Methods

### create()

> `static` **create**\<`TCT`\>(`initializers`, `params?`): `Promise`\<[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`FileTree_2`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`TCT`\>\>\>

Create FileTree from various file sources using TreeInitializer array.

#### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TCT` *extends* `string` | `string` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `initializers` | [`TreeInitializer`](../type-aliases/TreeInitializer.md)[] | Array of TreeInitializer objects specifying file sources |
| `params?` | [`IFileTreeInitParams`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`TCT`\> | Optional `IFileTreeInitParams` for the file tree. |

#### Returns

`Promise`\<[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`FileTree_2`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`TCT`\>\>\>

Promise resolving to a FileTree with all content pre-loaded

***

### createFromHttp()

> `static` **createFromHttp**\<`TCT`\>(`params`): `Promise`\<[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`FileTree_2`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`TCT`\>\>\>

Create a persistent FileTree from an HTTP storage service.

#### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TCT` *extends* `string` | `string` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params` | [`IHttpTreeParams`](../interfaces/IHttpTreeParams.md)\<`TCT`\> | Configuration including API base URL, namespace, and optional autoSync |

#### Returns

`Promise`\<[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`FileTree_2`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`TCT`\>\>\>

Promise resolving to a FileTree with persistence capability

***

### createFromLocalStorage()

> `static` **createFromLocalStorage**\<`TCT`\>(`params`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`FileTree_2`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`TCT`\>\>

Create a persistent FileTree from browser localStorage.
Changes to files can be synced back to localStorage.

#### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TCT` *extends* `string` | `string` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params` | [`ILocalStorageTreeParams`](../interfaces/ILocalStorageTreeParams.md)\<`TCT`\> | Configuration including path-to-key mappings and optional autoSync |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`FileTree_2`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`TCT`\>\>

Result containing a FileTree with persistence capability

#### Remarks

- Works in all browsers with localStorage support
- Maps directory paths to localStorage keys
- Each key stores multiple collections as JSON
- Files are automatically discovered from storage

#### Example

```typescript
const tree = FileApiTreeAccessors.createFromLocalStorage({
  pathToKeyMap: {
    '/data/ingredients': 'myapp:ingredients:v1',
    '/data/fillings': 'myapp:fillings:v1'
  },
  mutable: true,
  autoSync: false
});
```

***

### createPersistent()

> `static` **createPersistent**\<`TCT`\>(`dirHandle`, `params?`): `Promise`\<[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`FileTree_2`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`TCT`\>\>\>

Create a persistent FileTree from a File System Access API directory handle.
Changes to files can be synced back to disk.

#### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TCT` *extends* `string` | `string` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `dirHandle` | [`FileSystemDirectoryHandle`](../interfaces/FileSystemDirectoryHandle.md) | FileSystemDirectoryHandle to load files from |
| `params?` | [`IFileSystemAccessTreeParams`](../interfaces/IFileSystemAccessTreeParams.md)\<`TCT`\> | Optional parameters including autoSync and permission settings |

#### Returns

`Promise`\<[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`FileTree_2`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`TCT`\>\>\>

Promise resolving to a FileTree with persistence capability

#### Remarks

- Only works in browsers supporting File System Access API (Chrome, Edge, Opera)
- Requires 'readwrite' permission on the directory handle
- Falls back to read-only mode if permissions unavailable (unless requireWritePermission is true)

***

### createPersistentFromFile()

> `static` **createPersistentFromFile**\<`TCT`\>(`fileHandle`, `params?`): `Promise`\<[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`FileTree_2`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`TCT`\>\>\>

Create a persistent FileTree from a single File System Access API file handle.
The tree contains exactly one file at `/<filename>`.
Changes can be synced back to the original file via `syncToDisk()`.

#### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TCT` *extends* `string` | `string` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `fileHandle` | [`FileSystemFileHandle`](../interfaces/FileSystemFileHandle.md) | FileSystemFileHandle to load |
| `params?` | [`IFileSystemAccessTreeParams`](../interfaces/IFileSystemAccessTreeParams.md)\<`TCT`\> | Optional parameters including autoSync and permission settings |

#### Returns

`Promise`\<[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`FileTree_2`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`TCT`\>\>\>

Promise resolving to a FileTree with persistence capability

***

### extractFileMetadata()

> `static` **extractFileMetadata**(`file`): [`IFileMetadata`](../interfaces/IFileMetadata.md)

Extract file metadata from a File.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `file` | `File` |

#### Returns

[`IFileMetadata`](../interfaces/IFileMetadata.md)

The [file metadata](../interfaces/IFileMetadata.md)

***

### fromDirectoryUpload()

> `static` **fromDirectoryUpload**\<`TCT`\>(`fileList`, `params?`): `Promise`\<[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`FileTree_2`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`TCT`\>\>\>

Create FileTree from directory upload with webkitRelativePath.

#### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TCT` *extends* `string` | `string` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `fileList` | `FileList` | FileList from a directory upload (input with webkitdirectory) |
| `params?` | [`IFileTreeInitParams`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`TCT`\> | Optional `IFileTreeInitParams` for the file tree. |

#### Returns

`Promise`\<[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`FileTree_2`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`TCT`\>\>\>

Promise resolving to a FileTree with all content pre-loaded

***

### fromFileList()

> `static` **fromFileList**\<`TCT`\>(`fileList`, `params?`): `Promise`\<[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`FileTree_2`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`TCT`\>\>\>

Create FileTree from FileList (e.g., from input[type="file"]).

#### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TCT` *extends* `string` | `string` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `fileList` | `FileList` | FileList from a file input element |
| `params?` | [`IFileTreeInitParams`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`TCT`\> | Optional `IFileTreeInitParams` for the file tree. |

#### Returns

`Promise`\<[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`FileTree_2`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`TCT`\>\>\>

Promise resolving to a FileTree with all content pre-loaded

***

### getOriginalFile()

> `static` **getOriginalFile**(`fileList`, `targetPath`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`File`\>

Get the File object for a specific path from the original FileList.
This is useful for accessing the original File API object for operations
like getting file metadata, MIME type, etc.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `fileList` | `FileList` | The original FileList |
| `targetPath` | `string` | The path to find |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`File`\>

Result containing the File object if found
