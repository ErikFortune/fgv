[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-web-extras](../README.md) / DirectoryHandleStore

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

> **getAll**(): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`object`[]\>\>

Returns all stored handles as label/handle pairs.

#### Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`object`[]\>\>

Success with array of entries, or Failure

***

### getAllLabels()

> **getAllLabels**(): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`string`[]\>\>

Returns all stored labels (keys).

#### Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`string`[]\>\>

Success with array of labels, or Failure

***

### load()

> **load**(`label`): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`FileSystemDirectoryHandle`](../interfaces/FileSystemDirectoryHandle.md) \| `undefined`\>\>

Retrieves a directory handle by label.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `label` | `string` | Key to look up |

#### Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`FileSystemDirectoryHandle`](../interfaces/FileSystemDirectoryHandle.md) \| `undefined`\>\>

Success with handle (or undefined if not found), or Failure on error

***

### remove()

> **remove**(`label`): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`void`\>\>

Removes a directory handle from IndexedDB.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `label` | `string` | Key to remove |

#### Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`void`\>\>

Success or Failure

***

### save()

> **save**(`label`, `handle`): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`void`\>\>

Saves a directory handle to IndexedDB under the given label.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `label` | `string` | Key to store the handle under (typically dirHandle.name) |
| `handle` | [`FileSystemDirectoryHandle`](../interfaces/FileSystemDirectoryHandle.md) | The FileSystemDirectoryHandle to persist |

#### Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`void`\>\>

Success or Failure
