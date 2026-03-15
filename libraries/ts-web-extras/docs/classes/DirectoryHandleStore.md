[**@fgv/ts-web-extras**](../README.md)

***

[@fgv/ts-web-extras](../README.md) / DirectoryHandleStore

# Class: DirectoryHandleStore

Manages persistence of [FileSystemDirectoryHandle](../interfaces/FileSystemDirectoryHandle.md) objects in IndexedDB.
Keyed by a label (typically the directory name).

## Constructors

### Constructor

> **new DirectoryHandleStore**(`dbName`, `storeName`): `DirectoryHandleStore`

#### Parameters

| Parameter | Type | Default value |
| ------ | ------ | ------ |
| `dbName` | `string` | `DEFAULT_DIRECTORY_HANDLE_DB` |
| `storeName` | `string` | `DEFAULT_DIRECTORY_HANDLE_STORE` |

#### Returns

`DirectoryHandleStore`

## Methods

### getAll()

> **getAll**(): `Promise`\<[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`object`[]\>\>

Returns all stored handles as label/handle pairs.

#### Returns

`Promise`\<[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`object`[]\>\>

Success with array of entries, or Failure

***

### getAllLabels()

> **getAllLabels**(): `Promise`\<[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string`[]\>\>

Returns all stored labels (keys).

#### Returns

`Promise`\<[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string`[]\>\>

Success with array of labels, or Failure

***

### load()

> **load**(`label`): `Promise`\<[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`FileSystemDirectoryHandle`](../interfaces/FileSystemDirectoryHandle.md) \| `undefined`\>\>

Retrieves a directory handle by label.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `label` | `string` | Key to look up |

#### Returns

`Promise`\<[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`FileSystemDirectoryHandle`](../interfaces/FileSystemDirectoryHandle.md) \| `undefined`\>\>

Success with handle (or undefined if not found), or Failure on error

***

### remove()

> **remove**(`label`): `Promise`\<[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`void`\>\>

Removes a directory handle from IndexedDB.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `label` | `string` | Key to remove |

#### Returns

`Promise`\<[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`void`\>\>

Success or Failure

***

### save()

> **save**(`label`, `handle`): `Promise`\<[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`void`\>\>

Saves a directory handle to IndexedDB under the given label.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `label` | `string` | Key to store the handle under (typically dirHandle.name) |
| `handle` | [`FileSystemDirectoryHandle`](../interfaces/FileSystemDirectoryHandle.md) | The FileSystemDirectoryHandle to persist |

#### Returns

`Promise`\<[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`void`\>\>

Success or Failure
