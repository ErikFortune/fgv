[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-web-extras](../README.md) / LocalStorageTreeAccessors

# Class: LocalStorageTreeAccessors\<TCT\>

Browser localStorage-backed file tree accessors with persistence support.

Maps filesystem-like directory paths to localStorage keys, where each key stores
multiple collections as a JSON object. This provides a general-purpose implementation
for browser-based file tree persistence without requiring File System Access API.

Storage format per key: `{ "collection-id": "<raw file content>" }`
File paths map as: `/data/ingredients/collection-id.yaml` → stored in key for `/data/ingredients`

Legacy format (v1): `{ "collection-id": { ...parsedJsonObject } }` is auto-migrated on load.

## Remarks

Supports the read half of the optional binary capability
(`FileTree.IBinaryFileTreeAccessors`) — narrow with
`FileTree.isBinaryAccessors` and call `getFileBytes()` to
read a file's bytes without going through a lenient UTF-8 decode.

Byte *writes* are deliberately not supported: the backing store is a JSON document in
`localStorage`, so bytes that are not valid UTF-8 could not survive a `syncToDisk()`
round-trip. Base64-encoding them would change the on-disk format that existing
deployments already hold.

## Extends

- [`InMemoryTreeAccessors`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`TCT`\>

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-tct"></a> `TCT` *extends* `string` | `string` |

## Implements

- [`IPersistentFileTreeAccessors`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`TCT`\>
- [`IBinaryFileTreeAccessors`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`TCT`\>

## Methods

### cleanupAtomicTemporaries()

> **cleanupAtomicTemporaries**(`directory`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<readonly `string`[]\>

Removes any working files this store reserves for interrupted atomic
writes from the given directory.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `directory` | `string` | Absolute path of the directory to reclaim. |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<readonly `string`[]\>

`Success` with an empty list, or `Failure` if the path is not an
existing directory.

#### Remarks

Always an empty list: an in-memory replacement is a single synchronous
assignment, so there is no intermediate working file for an interrupted
write to leave behind. The method exists so a consumer's reopen path is the
same shape whichever store is behind it.

#### Inherited from

`FileTree.InMemoryTreeAccessors.cleanupAtomicTemporaries`

***

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

Delete a file and remove it from localStorage.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `path` | `string` | File path to delete |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`boolean`\>

Result with true if deleted, or error

#### Implementation of

`FileTree.IPersistentFileTreeAccessors.deleteFile`

#### Overrides

`FileTree.InMemoryTreeAccessors.deleteFile`

***

### fileIsMutable()

> **fileIsMutable**(`path`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`boolean`, [`SaveDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\>

Check if a file is mutable and return persistence detail.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `path` | `string` | File path to check |

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`boolean`, [`SaveDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\>

DetailedResult with mutability status and 'persistent' detail if mutable

#### Implementation of

`FileTree.IPersistentFileTreeAccessors.fileIsMutable`

#### Overrides

`FileTree.InMemoryTreeAccessors.fileIsMutable`

***

### getAtomicWriteCapabilities()

> **getAtomicWriteCapabilities**(`directory`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IAtomicWriteCapabilities`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\>

FileTree.IAtomicFileTreeAccessors.getAtomicWriteCapabilities

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `directory` | `string` |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IAtomicWriteCapabilities`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\>

#### Inherited from

`FileTree.InMemoryTreeAccessors.getAtomicWriteCapabilities`

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

Get list of file paths with unsaved changes.

#### Returns

`string`[]

Array of dirty file paths

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

### getFileBytes()

> **getFileBytes**(`path`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`Uint8Array`\<`ArrayBufferLike`\>\>

FileTree.IBinaryFileTreeAccessors.getFileBytes

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `path` | `string` |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`Uint8Array`\<`ArrayBufferLike`\>\>

#### Implementation of

`FileTree.IBinaryFileTreeAccessors.getFileBytes`

#### Inherited from

`FileTree.InMemoryTreeAccessors.getFileBytes`

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

### getFileTextStrict()

> **getFileTextStrict**(`path`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>

Reads a file's contents, decoding UTF-8 strictly.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `path` | `string` | Absolute path of the file. |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>

`Success` with the decoded text; `Failure` if the bytes are not
valid UTF-8, or if this store no longer holds the original bytes to judge.

#### Remarks

Decidable **per file**, not per store: only a byte-seeded file still has the
original bytes to judge. A `string`- or JSON-seeded file was decoded before
this tree received it, so the substitution — if any — already happened
upstream and re-encoding would produce well-formed UTF-8. Those fail rather
than reporting a success this store cannot stand behind.

This is also what makes the derived string-backed stores correct for free:
an HTTP tree seeded from a JSON `contents` field, or a `localStorage` tree,
holds only strings and so refuses every file — structurally, not by a
hand-written special case.

#### Inherited from

`FileTree.InMemoryTreeAccessors.getFileTextStrict`

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

Check if there are unsaved changes.

#### Returns

`boolean`

True if there are dirty files

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

Save file contents. Marks file as dirty and optionally auto-syncs.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `path` | `string` | File path |
| `contents` | `string` | New file contents |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>

Result with the saved contents or error

#### Implementation of

`FileTree.IPersistentFileTreeAccessors.saveFileContents`

#### Overrides

`FileTree.InMemoryTreeAccessors.saveFileContents`

***

### syncToDisk()

> **syncToDisk**(): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`void`\>\>

Sync all dirty files to localStorage.

#### Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`void`\>\>

Result indicating success or failure

#### Implementation of

`FileTree.IPersistentFileTreeAccessors.syncToDisk`

***

### writeFileAtomically()

> **writeFileAtomically**(`path`, `contents`, `options`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IAtomicWriteReceipt`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs), [`IAtomicWriteFailure`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\>

Replaces (or creates) a file's contents such that a reader never observes
a torn write.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `path` | `string` | Absolute path of the file to write. |
| `contents` | `string` | The string contents to write. |
| `options` | [`IAtomicWriteOptions`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) | The requested [options](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs). |

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IAtomicWriteReceipt`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs), [`IAtomicWriteFailure`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\>

`DetailedSuccess` with the receipt if the write committed, or
`DetailedFailure` with a classified failure.

#### Remarks

A replacement of an in-memory file's contents is a single synchronous
assignment (see `MutableInMemoryFile.setContents`), so there is no
intermediate state a reader could observe as torn — this store can honor
`'session'` unconditionally whenever ordinary mutation would succeed, and
fails any stronger request before touching anything.

#### Inherited from

`FileTree.InMemoryTreeAccessors.writeFileAtomically`

***

### create()

#### Call Signature

> `static` **create**\<`TCT`\>(`files`, `prefix?`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`InMemoryTreeAccessors`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`TCT`\>\>

Creates a new [InMemoryTreeAccessors](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) instance with the supplied
in-memory files.

##### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-tct-1"></a> `TCT` *extends* `string` | `string` |

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
| <a id="type-parameter-tct-2"></a> `TCT` *extends* `string` | `string` |

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

### fromStorage()

> `static` **fromStorage**\<`TCT`\>(`params`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`LocalStorageTreeAccessors`\<`TCT`\>\>

Create LocalStorageTreeAccessors from browser localStorage.
Loads all collections from the configured storage keys.

#### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-tct-3"></a> `TCT` *extends* `string` | `string` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params` | [`ILocalStorageTreeParams`](../interfaces/ILocalStorageTreeParams.md)\<`TCT`\> | Configuration including path-to-key mappings |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`LocalStorageTreeAccessors`\<`TCT`\>\>

Result containing the accessors or an error
