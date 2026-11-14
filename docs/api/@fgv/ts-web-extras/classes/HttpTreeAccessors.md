[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-web-extras](../README.md) / HttpTreeAccessors

# Class: HttpTreeAccessors\<TCT\>

HTTP-backed file tree accessors that cache data in memory and persist via REST API.

## Remarks

Supports the read half of the optional binary capability
(`FileTree.IBinaryFileTreeAccessors`) — narrow with
`FileTree.isBinaryAccessors` and call `getFileBytes()`.

**Whether this adapter is byte-faithful depends on
[contentEncoding](../interfaces/IHttpTreeParams.md#property-contentencoding), and nothing else.**

Under the default `'utf8'`, it is **not**, and `getFileBytes()` must not be used
to detect invalid UTF-8. The REST transport carries file contents as JSON
strings, so `JSON.parse` has already decoded them **leniently** — substituting
U+FFFD for every invalid sequence — before this class ever sees them. The
inherited `getFileBytes()` then *re-encodes* that string, so what you get back
is well-formed UTF-8 whose corruption is already baked in and no longer
detectable. A `TextDecoder('utf-8', { fatal: true })` over those bytes will
succeed, having nothing left to check. For the same reason the optional
strict-text capability (`FileTree.IStrictTextFileTreeAccessors`) **fails every
file**: with no custody of the original bytes it cannot answer "was this valid
UTF-8?" even in principle, so it refuses rather than returning a success from a
check that cannot fail.

Under `contentEncoding: 'base64'`, all of that goes away. The server sends the
file's bytes and this tree is seeded with them verbatim, so `getFileBytes()`
returns what the origin actually stored and `getFileTextStrict()` decides
honestly. Nothing in the capability implementations is special-cased for HTTP —
they follow the general custody rule, and this option is simply how this store
comes to have custody.

(An earlier version of this doc said `getFileBytes()` reads bytes "without going
through a lenient UTF-8 decode", unconditionally. That was true of the
byte-seeded stores this class inherits from and false here.)

Byte *writes* remain unsupported: `syncToDisk()` still sends `contents` as UTF-8
text, so bytes that are not valid UTF-8 could not survive the round trip. The
read direction is byte-faithful; the write direction is not yet.

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

Deletes a file at the given path.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `path` | `string` | The path of the file to delete. |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`boolean`\>

`Success` with `true` if the file was deleted, or `Failure` with an error message.

#### Implementation of

`FileTree.IPersistentFileTreeAccessors.deleteFile`

#### Overrides

`FileTree.InMemoryTreeAccessors.deleteFile`

***

### fileIsMutable()

> **fileIsMutable**(`path`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`boolean`, [`SaveDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\>

Checks if a file is mutable (can be modified).

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `path` | `string` | The path to the file. |

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`boolean`, [`SaveDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\>

A detailed result indicating if the file is mutable and the reason.

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

Gets the list of paths for all dirty files.

#### Returns

`string`[]

An array of file paths that have been modified but not yet synchronized.

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

Checks if there are any dirty files that need synchronization.

#### Returns

`boolean`

True if there are dirty files, false otherwise.

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

Saves file contents and marks the file as dirty for synchronization.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `path` | `string` | The path to the file. |
| `contents` | `string` | The new contents of the file. |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>

A result indicating success or failure.

#### Implementation of

`FileTree.IPersistentFileTreeAccessors.saveFileContents`

#### Overrides

`FileTree.InMemoryTreeAccessors.saveFileContents`

***

### syncToDisk()

> **syncToDisk**(): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`void`\>\>

Synchronizes all dirty files to the HTTP backend.

Uses a concurrency guard: if a sync is already in progress, callers
await the existing operation rather than starting a parallel one.
This prevents the thundering herd that occurs when autoSync fires
for every file written during a bulk operation (e.g. restore).

#### Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`void`\>\>

A promise that resolves to a result indicating success or failure.

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

### fromHttp()

> `static` **fromHttp**\<`TCT`\>(`params`): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`HttpTreeAccessors`\<`TCT`\>\>\>

Creates a new HttpTreeAccessors instance from an HTTP backend.

#### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-tct-3"></a> `TCT` *extends* `string` | `string` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params` | [`IHttpTreeParams`](../interfaces/IHttpTreeParams.md)\<`TCT`\> | Configuration parameters for the HTTP tree accessors. |

#### Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`HttpTreeAccessors`\<`TCT`\>\>\>

A promise that resolves to a result containing the new HttpTreeAccessors instance or an error message.
