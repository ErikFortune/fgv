[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-json-base](../../../README.md) / [FileTree](../README.md) / IAtomicFileTreeAccessors

# Interface: IAtomicFileTreeAccessors\<TCT\>

Extended accessors interface for trees that can replace a file's contents
such that a reader never observes a torn write.

## Remarks

This is an *optional capability* — use
[isAtomicAccessors](../functions/isAtomicAccessors.md) to narrow. It is
deliberately separate from [FileTree.IPersistentFileTreeAccessors](IPersistentFileTreeAccessors.md) —
`isPersistentAccessors` means `syncToDisk`/`isDirty`/`getDirtyPaths` exist,
which is neither necessary for atomic write-through storage nor sufficient
for transactional durability; a buffered adapter would need to implement
and separately qualify this capability, including its own flush boundary,
before a caller can accept it as durable. Method presence (this guard),
writability (still [fileIsMutable](IMutableFileTreeAccessors.md#fileismutable)), atomic visibility
([atomicReplace](IAtomicWriteCapabilities.md#property-atomicreplace)),
and durability ([guarantees](IAtomicWriteCapabilities.md#property-guarantees)) are four distinct questions this interface keeps separate
rather than conflating into one boolean.

## Extends

- [`IMutableFileTreeAccessors`](IMutableFileTreeAccessors.md)\<`TCT`\>

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-tct"></a> `TCT` *extends* `string` | `string` |

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

`Success` with the names removed, or `Failure` naming what could
not be removed.

#### Remarks

A store that commits by writing somewhere else first can leave that
working file behind when the process dies mid-write. The name of such a
file is reserved to the store, so only the store can recognize one; this
is how a consumer reclaims them without being handed a naming convention
it would then depend on.

**Call this only at exclusive reopen**, which the single-writer fault
model already assumes: a working file belonging to a *live* write is
indistinguishable from an orphan, and removing it would break that write.
A store with nothing to reclaim answers with an empty list.

***

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

#### Inherited from

[`IMutableFileTreeAccessors`](IMutableFileTreeAccessors.md).[`createDirectory`](IMutableFileTreeAccessors.md#createdirectory)

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

#### Inherited from

[`IMutableFileTreeAccessors`](IMutableFileTreeAccessors.md).[`deleteDirectory`](IMutableFileTreeAccessors.md#deletedirectory)

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

#### Inherited from

[`IMutableFileTreeAccessors`](IMutableFileTreeAccessors.md).[`deleteFile`](IMutableFileTreeAccessors.md#deletefile)

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

#### Inherited from

[`IMutableFileTreeAccessors`](IMutableFileTreeAccessors.md).[`fileIsMutable`](IMutableFileTreeAccessors.md#fileismutable)

***

### getAtomicWriteCapabilities()

> **getAtomicWriteCapabilities**(`directory`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IAtomicWriteCapabilities`](IAtomicWriteCapabilities.md)\>

Reports what atomic replacement this store can offer for writes into the
given directory.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `directory` | `string` | Absolute path of the containing directory. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IAtomicWriteCapabilities`](IAtomicWriteCapabilities.md)\>

`Success` with the store's [capabilities](IAtomicWriteCapabilities.md), or `Failure` if the directory does not exist or the path
names a file rather than a directory.

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

[`IMutableFileTreeAccessors`](IMutableFileTreeAccessors.md).[`getBaseName`](IMutableFileTreeAccessors.md#getbasename)

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

[`IMutableFileTreeAccessors`](IMutableFileTreeAccessors.md).[`getChildren`](IMutableFileTreeAccessors.md#getchildren)

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

[`IMutableFileTreeAccessors`](IMutableFileTreeAccessors.md).[`getExtension`](IMutableFileTreeAccessors.md#getextension)

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

#### Remarks

The bytes are decoded as UTF-8 with the *lenient* WHATWG default, so malformed
input is silently replaced with U+FFFD rather than reported. Accessors whose
backing store is byte-native also implement
[IBinaryFileTreeAccessors](IBinaryFileTreeAccessors.md); narrow with
[isBinaryAccessors](../functions/isBinaryAccessors.md) and call
[getFileBytes](IBinaryFileTreeAccessors.md#getfilebytes) to read the
undecoded bytes — for a strict decode that fails loudly on malformed UTF-8:

```ts
new TextDecoder('utf-8', { fatal: true }).decode(bytes)
```

#### Inherited from

[`IMutableFileTreeAccessors`](IMutableFileTreeAccessors.md).[`getFileContents`](IMutableFileTreeAccessors.md#getfilecontents)

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

[`IMutableFileTreeAccessors`](IMutableFileTreeAccessors.md).[`getFileContentType`](IMutableFileTreeAccessors.md#getfilecontenttype)

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

[`IMutableFileTreeAccessors`](IMutableFileTreeAccessors.md).[`getItem`](IMutableFileTreeAccessors.md#getitem)

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

[`IMutableFileTreeAccessors`](IMutableFileTreeAccessors.md).[`joinPaths`](IMutableFileTreeAccessors.md#joinpaths)

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

[`IMutableFileTreeAccessors`](IMutableFileTreeAccessors.md).[`resolveAbsolutePath`](IMutableFileTreeAccessors.md#resolveabsolutepath)

***

### resolveRealPath()?

> `optional` **resolveRealPath**(`path`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>

Resolves a path to its canonical real path, with every symbolic link
resolved. Optional: only storage that has symbolic links (a filesystem)
implements it.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `path` | `string` | The path to resolve. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>

`Success` with the real path, or `Failure` if it cannot be
resolved (for example, it does not exist).

#### Inherited from

[`IMutableFileTreeAccessors`](IMutableFileTreeAccessors.md).[`resolveRealPath`](IMutableFileTreeAccessors.md#resolverealpath)

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

#### Remarks

The string is encoded as UTF-8. To write bytes that are not valid UTF-8, narrow
with [isMutableBinaryAccessors](../functions/isMutableBinaryAccessors.md) and use
[saveFileBytes](IMutableBinaryFileTreeAccessors.md#savefilebytes) instead.

#### Inherited from

[`IMutableFileTreeAccessors`](IMutableFileTreeAccessors.md).[`saveFileContents`](IMutableFileTreeAccessors.md#savefilecontents)

***

### writeFileAtomically()

> **writeFileAtomically**(`path`, `contents`, `options`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IAtomicWriteReceipt`](IAtomicWriteReceipt.md), [`IAtomicWriteFailure`](IAtomicWriteFailure.md)\>

Replaces (or creates) a file's contents such that a reader never
observes a torn write.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `path` | `string` | Absolute path of the file to write. |
| `contents` | `string` | The string contents to write. |
| `options` | [`IAtomicWriteOptions`](IAtomicWriteOptions.md) | The requested [options](IAtomicWriteOptions.md). |

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IAtomicWriteReceipt`](IAtomicWriteReceipt.md), [`IAtomicWriteFailure`](IAtomicWriteFailure.md)\>

`DetailedSuccess` with the [receipt](IAtomicWriteReceipt.md) if the write committed, or `DetailedFailure` with a classified
[failure](IAtomicWriteFailure.md).

#### Remarks

Validates destination writability, path confinement, and the requested
guarantee before any mutation — a stronger guarantee than this store can
honor fails at the `'validate'` stage, leaving the destination
unchanged. Ordinary [saveFileContents](IMutableFileTreeAccessors.md#savefilecontents) retains its existing semantics; this is a sibling
capability, not a replacement.
