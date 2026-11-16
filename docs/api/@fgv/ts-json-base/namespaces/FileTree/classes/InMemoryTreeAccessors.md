[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-json-base](../../../README.md) / [FileTree](../README.md) / InMemoryTreeAccessors

# Class: InMemoryTreeAccessors\<TCT\>

Implementation of [FileTree.IMutableFileTreeAccessors](../interfaces/IMutableFileTreeAccessors.md) that uses an in-memory
tree to access and modify files and directories.

## Remarks

Also implements the read half of the optional binary capability
([FileTree.IBinaryFileTreeAccessors](../interfaces/IBinaryFileTreeAccessors.md)). Byte *writes* are deliberately not
supported: subclasses that persist this tree (`localStorage`, HTTP JSON transport,
File System Access) persist text, so a byte write could not round-trip through them.
Seed a tree with `Uint8Array` contents to hold bytes verbatim.

Also implements the optional atomic-write capability
([FileTree.IAtomicFileTreeAccessors](../interfaces/IAtomicFileTreeAccessors.md)). A replacement of an in-memory file's
contents is a single synchronous property assignment, so a reader can never observe
a torn write — this store advertises the `'session'` guarantee and never
`'process-crash'`: nothing here survives the process exiting, because nothing here
is ever written to anything other than process memory.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-tct"></a> `TCT` *extends* `string` | `string` |

## Implements

- [`IMutableFileTreeAccessors`](../interfaces/IMutableFileTreeAccessors.md)\<`TCT`\>
- [`IBinaryFileTreeAccessors`](../interfaces/IBinaryFileTreeAccessors.md)\<`TCT`\>
- [`IAtomicFileTreeAccessors`](../interfaces/IAtomicFileTreeAccessors.md)\<`TCT`\>

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

### cleanupAtomicTemporaries()

> **cleanupAtomicTemporaries**(`directory`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<readonly `string`[]\>

Removes any working files this store reserves for interrupted atomic
writes from the given directory.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `directory` | `string` | Absolute path of the directory to reclaim. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<readonly `string`[]\>

`Success` with an empty list, or `Failure` if the path is not an
existing directory.

#### Remarks

Always an empty list: an in-memory replacement is a single synchronous
assignment, so there is no intermediate working file for an interrupted
write to leave behind. The method exists so a consumer's reopen path is the
same shape whichever store is behind it.

#### Implementation of

[`IAtomicFileTreeAccessors`](../interfaces/IAtomicFileTreeAccessors.md).[`cleanupAtomicTemporaries`](../interfaces/IAtomicFileTreeAccessors.md#cleanupatomictemporaries)

***

### createDirectory()

> **createDirectory**(`dirPath`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>

Creates a directory at the given path, including any missing parent directories.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `dirPath` | `string` | The path of the directory to create. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>

`Success` with the absolute path if created, or `Failure` with an error message.

#### Implementation of

[`IAtomicFileTreeAccessors`](../interfaces/IAtomicFileTreeAccessors.md).[`createDirectory`](../interfaces/IAtomicFileTreeAccessors.md#createdirectory)

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

#### Implementation of

[`IAtomicFileTreeAccessors`](../interfaces/IAtomicFileTreeAccessors.md).[`deleteDirectory`](../interfaces/IAtomicFileTreeAccessors.md#deletedirectory)

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

#### Implementation of

[`IAtomicFileTreeAccessors`](../interfaces/IAtomicFileTreeAccessors.md).[`deleteFile`](../interfaces/IAtomicFileTreeAccessors.md#deletefile)

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

[`IAtomicFileTreeAccessors`](../interfaces/IAtomicFileTreeAccessors.md).[`fileIsMutable`](../interfaces/IAtomicFileTreeAccessors.md#fileismutable)

***

### getAtomicWriteCapabilities()

> **getAtomicWriteCapabilities**(`directory`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IAtomicWriteCapabilities`](../interfaces/IAtomicWriteCapabilities.md)\>

Reports what atomic replacement this store can offer for writes into the
given directory.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `directory` | `string` | Absolute path of the containing directory. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IAtomicWriteCapabilities`](../interfaces/IAtomicWriteCapabilities.md)\>

`Success` with the store's [capabilities](../interfaces/IAtomicWriteCapabilities.md), or `Failure` if the directory does not exist or the path
names a file rather than a directory.

#### Implementation of

[`IAtomicFileTreeAccessors`](../interfaces/IAtomicFileTreeAccessors.md).[`getAtomicWriteCapabilities`](../interfaces/IAtomicFileTreeAccessors.md#getatomicwritecapabilities)

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

[`IAtomicFileTreeAccessors`](../interfaces/IAtomicFileTreeAccessors.md).[`getBaseName`](../interfaces/IAtomicFileTreeAccessors.md#getbasename)

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

#### Implementation of

[`IAtomicFileTreeAccessors`](../interfaces/IAtomicFileTreeAccessors.md).[`getChildren`](../interfaces/IAtomicFileTreeAccessors.md#getchildren)

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

[`IAtomicFileTreeAccessors`](../interfaces/IAtomicFileTreeAccessors.md).[`getExtension`](../interfaces/IAtomicFileTreeAccessors.md#getextension)

***

### getFileBytes()

> **getFileBytes**(`path`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`Uint8Array`\<`ArrayBufferLike`\>\>

Gets the contents of a file in the file tree as bytes, with no text decoding applied.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `path` | `string` | Absolute path of the file. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`Uint8Array`\<`ArrayBufferLike`\>\>

`Success` with the raw bytes of the file, or `Failure` with an error message.

#### Remarks

The returned array must be treated as read-only — implementations are free to
return their internal buffer rather than a copy.

#### Implementation of

[`IBinaryFileTreeAccessors`](../interfaces/IBinaryFileTreeAccessors.md).[`getFileBytes`](../interfaces/IBinaryFileTreeAccessors.md#getfilebytes)

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

#### Implementation of

[`IAtomicFileTreeAccessors`](../interfaces/IAtomicFileTreeAccessors.md).[`getFileContents`](../interfaces/IAtomicFileTreeAccessors.md#getfilecontents)

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

#### Implementation of

[`IAtomicFileTreeAccessors`](../interfaces/IAtomicFileTreeAccessors.md).[`getFileContentType`](../interfaces/IAtomicFileTreeAccessors.md#getfilecontenttype)

***

### getFileTextStrict()

> **getFileTextStrict**(`path`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>

Reads a file's contents, decoding UTF-8 strictly.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `path` | `string` | Absolute path of the file. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>

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

***

### getItem()

> **getItem**(`itemPath`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`FileTreeItem`](../type-aliases/FileTreeItem.md)\<`TCT`\>\>

Gets an item from the file tree.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `itemPath` | `string` | Path of the item to get. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`FileTreeItem`](../type-aliases/FileTreeItem.md)\<`TCT`\>\>

The item if it exists.

#### Implementation of

[`IAtomicFileTreeAccessors`](../interfaces/IAtomicFileTreeAccessors.md).[`getItem`](../interfaces/IAtomicFileTreeAccessors.md#getitem)

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

[`IAtomicFileTreeAccessors`](../interfaces/IAtomicFileTreeAccessors.md).[`joinPaths`](../interfaces/IAtomicFileTreeAccessors.md#joinpaths)

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

[`IAtomicFileTreeAccessors`](../interfaces/IAtomicFileTreeAccessors.md).[`resolveAbsolutePath`](../interfaces/IAtomicFileTreeAccessors.md#resolveabsolutepath)

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

#### Implementation of

[`IAtomicFileTreeAccessors`](../interfaces/IAtomicFileTreeAccessors.md).[`saveFileContents`](../interfaces/IAtomicFileTreeAccessors.md#savefilecontents)

***

### writeFileAtomically()

> **writeFileAtomically**(`path`, `contents`, `options`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IAtomicWriteReceipt`](../interfaces/IAtomicWriteReceipt.md), [`IAtomicWriteFailure`](../interfaces/IAtomicWriteFailure.md)\>

Replaces (or creates) a file's contents such that a reader never observes
a torn write.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `path` | `string` | Absolute path of the file to write. |
| `contents` | `string` | The string contents to write. |
| `options` | [`IAtomicWriteOptions`](../interfaces/IAtomicWriteOptions.md) | The requested [options](../interfaces/IAtomicWriteOptions.md). |

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IAtomicWriteReceipt`](../interfaces/IAtomicWriteReceipt.md), [`IAtomicWriteFailure`](../interfaces/IAtomicWriteFailure.md)\>

`DetailedSuccess` with the receipt if the write committed, or
`DetailedFailure` with a classified failure.

#### Remarks

A replacement of an in-memory file's contents is a single synchronous
assignment (see `MutableInMemoryFile.setContents`), so there is no
intermediate state a reader could observe as torn — this store can honor
`'session'` unconditionally whenever ordinary mutation would succeed, and
fails any stronger request before touching anything.

#### Implementation of

[`IAtomicFileTreeAccessors`](../interfaces/IAtomicFileTreeAccessors.md).[`writeFileAtomically`](../interfaces/IAtomicFileTreeAccessors.md#writefileatomically)

***

### create()

Creates a new InMemoryTreeAccessors instance with the supplied
in-memory files.

#### Param

**files**

An array of [in-memory files](../interfaces/IInMemoryFile.md) to include in the tree.

#### Param

**params**

Optional params for the tree.

#### Call Signature

> `static` **create**\<`TCT`\>(`files`, `prefix?`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`InMemoryTreeAccessors`\<`TCT`\>\>

Creates a new InMemoryTreeAccessors instance with the supplied
in-memory files.

##### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-tct-1"></a> `TCT` *extends* `string` | `string` |

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `files` | [`IInMemoryFile`](../interfaces/IInMemoryFile.md)\<`TCT`\>[] | An array of [in-memory files](../interfaces/IInMemoryFile.md) to include in the tree. |
| `prefix?` | `string` | Optional prefix for the tree. |

##### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`InMemoryTreeAccessors`\<`TCT`\>\>

#### Call Signature

> `static` **create**\<`TCT`\>(`files`, `params?`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`InMemoryTreeAccessors`\<`TCT`\>\>

Creates a new InMemoryTreeAccessors instance with the supplied
in-memory files.

##### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-tct-2"></a> `TCT` *extends* `string` | `string` |

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `files` | [`IInMemoryFile`](../interfaces/IInMemoryFile.md)\<`TCT`\>[] | An array of [in-memory files](../interfaces/IInMemoryFile.md) to include in the tree. |
| `params?` | [`IFileTreeInitParams`](../interfaces/IFileTreeInitParams.md)\<`TCT`\> | Optional params for the tree. |

##### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`InMemoryTreeAccessors`\<`TCT`\>\>
