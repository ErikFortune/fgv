[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-json-base](../../../README.md) / [FileTree](../README.md) / FsFileTreeAccessors

# Class: FsFileTreeAccessors\<TCT\>

Implementation of [FileTree.IMutableBinaryFileTreeAccessors](../interfaces/IMutableBinaryFileTreeAccessors.md) that uses the
file system to access and modify files and directories.

## Remarks

The file system is byte-native, so this implementation supports the optional binary
capability for both reads and writes.

It also implements the optional atomic-write capability
([FileTree.IAtomicFileTreeAccessors](../interfaces/IAtomicFileTreeAccessors.md)). Ordinary
[saveFileContents](#savefilecontents) and
[saveFileBytes](#savefilebytes) are
unchanged and still write in place; the atomic capability is a separate,
opt-in path. Which guarantee — if any — a given root can honor depends on the
platform and filesystem and is reported by
[getAtomicWriteCapabilities](#getatomicwritecapabilities); an unqualified root refuses a durable write
rather than quietly performing a weaker one.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-tct"></a> `TCT` *extends* `string` | `string` |

## Implements

- [`IMutableBinaryFileTreeAccessors`](../interfaces/IMutableBinaryFileTreeAccessors.md)\<`TCT`\>
- [`IAtomicFileTreeAccessors`](../interfaces/IAtomicFileTreeAccessors.md)\<`TCT`\>

## Constructors

### Constructor

> **new FsFileTreeAccessors**\<`TCT`\>(`params?`): `FsFileTreeAccessors`\<`TCT`\>

Construct a new instance of the FsFileTreeAccessors class.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params?` | [`IFsFileTreeInitParams`](../interfaces/IFsFileTreeInitParams.md)\<`TCT`\> | Optional [initialization parameters](../interfaces/IFsFileTreeInitParams.md). |

#### Returns

`FsFileTreeAccessors`\<`TCT`\>

#### Throws

When `params` asks for confinement without a `prefix` to confine to,
asks for `realPath` under `'unconfined'`, or names an unknown policy. Use
[create](#create) to receive that as a `Result`.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-_infercontenttype"></a> `_inferContentType` | `public readonly` | (`filePath`) => [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`TCT` \| `undefined`\> | Function to infer the content type of a file. |
| <a id="property-absolutepathpolicy"></a> `absolutePathPolicy` | `public readonly` | [`FsAbsolutePathPolicy`](../type-aliases/FsAbsolutePathPolicy.md) | How a path that resolves outside [prefix](#property-prefix) is treated. See [FsAbsolutePathPolicy](../type-aliases/FsAbsolutePathPolicy.md). |
| <a id="property-prefix"></a> `prefix` | `public readonly` | `string` \| `undefined` | Optional root of the tree. **Remarks** A relative path is always resolved against the prefix. What happens to a path that resolves outside it — an absolute path elsewhere, or a relative one that climbs out with `..` — depends on [absolutePathPolicy](#property-absolutepathpolicy): under `'unconfined'` (the default) it is used as given and the prefix confines nothing except the atomic-write methods; under `'confined'` it is mapped beneath the prefix; under `'verified'` the operation fails. |
| <a id="property-realpath"></a> `realPath` | `public readonly` | `boolean` | Whether every operation also checks the real path — symbolic links followed — of what it touches against the real path of the prefix. **Remarks** Limits: hard links and bind mounts are invisible to it — a hard link inside the prefix to a file outside it has a real path inside, so a write through it reaches the outside file. Under `'verified'` with a prefix that is itself a symbolic link, an absolute input spelled through the prefix's *real* path is refused, because it does not lie under the prefix as given (safe, but surprising). A dangling symbolic link is refused for every operation, so it cannot be deleted through these accessors at all. |

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

> **deleteDirectory**(`dirPath`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`boolean`\>

Deletes a directory at the given path.
The directory must be empty or the operation will fail.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `dirPath` | `string` | The path of the directory to delete. |

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

> **getBaseName**(`itemPath`, `suffix?`): `string`

Gets the base name of a path.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `itemPath` | `string` | Path to get the base name of. |
| `suffix?` | `string` | Optional suffix to remove from the base name. |

#### Returns

`string`

The base name of the path.

#### Implementation of

[`IAtomicFileTreeAccessors`](../interfaces/IAtomicFileTreeAccessors.md).[`getBaseName`](../interfaces/IAtomicFileTreeAccessors.md#getbasename)

***

### getChildren()

> **getChildren**(`dirPath`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<readonly [`FileTreeItem`](../type-aliases/FileTreeItem.md)\<`TCT`\>[]\>

Gets the children of a directory in the file tree.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `dirPath` | `string` | Path of the directory. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<readonly [`FileTreeItem`](../type-aliases/FileTreeItem.md)\<`TCT`\>[]\>

The children of the directory.

#### Implementation of

[`IAtomicFileTreeAccessors`](../interfaces/IAtomicFileTreeAccessors.md).[`getChildren`](../interfaces/IAtomicFileTreeAccessors.md#getchildren)

***

### getExtension()

> **getExtension**(`itemPath`): `string`

Gets the extension of a path.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `itemPath` | `string` | Path to get the extension of. |

#### Returns

`string`

The extension of the path.

#### Implementation of

[`IAtomicFileTreeAccessors`](../interfaces/IAtomicFileTreeAccessors.md).[`getExtension`](../interfaces/IAtomicFileTreeAccessors.md#getextension)

***

### getFileBytes()

> **getFileBytes**(`filePath`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`Uint8Array`\<`ArrayBufferLike`\>\>

Gets the contents of a file in the file tree as bytes, with no text decoding applied.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `filePath` | `string` | Absolute path of the file. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`Uint8Array`\<`ArrayBufferLike`\>\>

`Success` with the raw bytes of the file, or `Failure` with an error message.

#### Remarks

The returned array must be treated as read-only — implementations are free to
return their internal buffer rather than a copy.

#### Implementation of

[`IMutableBinaryFileTreeAccessors`](../interfaces/IMutableBinaryFileTreeAccessors.md).[`getFileBytes`](../interfaces/IMutableBinaryFileTreeAccessors.md#getfilebytes)

***

### getFileContents()

> **getFileContents**(`filePath`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>

Gets the contents of a file in the file tree.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `filePath` | `string` | Absolute path of the file. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>

The contents of the file.

#### Implementation of

[`IAtomicFileTreeAccessors`](../interfaces/IAtomicFileTreeAccessors.md).[`getFileContents`](../interfaces/IAtomicFileTreeAccessors.md#getfilecontents)

***

### getFileContentType()

> **getFileContentType**(`filePath`, `provided?`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`TCT` \| `undefined`\>

Gets the content type of a file in the file tree.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `filePath` | `string` | Absolute path of the file. |
| `provided?` | `string` | Optional supplied content type. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`TCT` \| `undefined`\>

The content type of the file.

#### Implementation of

[`IAtomicFileTreeAccessors`](../interfaces/IAtomicFileTreeAccessors.md).[`getFileContentType`](../interfaces/IAtomicFileTreeAccessors.md#getfilecontenttype)

***

### getFileTextStrict()

> **getFileTextStrict**(`filePath`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>

Reads a file's contents, decoding UTF-8 strictly.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `filePath` | `string` | Absolute path of the file. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>

`Success` with the decoded text; `Failure` if the bytes are not
valid UTF-8.

#### Remarks

Always decidable here: the bytes are read from disk, so this store has
custody of exactly what was written.

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

#### Remarks

A relative first path is resolved against the prefix, and an absolute one
is taken as given; `..` segments are collapsed either way. Then, by
[absolutePathPolicy](#property-absolutepathpolicy):

- `'unconfined'` and `'verified'` return that path unchanged. Under
  `'verified'` an operation on a path outside the prefix then fails.
- `'confined'` maps a path that is not under the prefix beneath it. An
  absolute input has the prefix prepended (`/x` becomes `<prefix>/x`). A
  relative input that climbs out with `..` is resolved as though the prefix
  were the filesystem root, where `..` cannot climb any higher (`../x` and
  `a/../../x` both become `<prefix>/x`). A path already under the prefix is
  never re-prefixed, which makes the mapping idempotent and means
  `<prefix>/<prefix>/…` cannot be named by an absolute path — use the
  relative form instead.

"Under" means equal to the prefix or beginning with the prefix and a
separator, so `/prefixx/a` is not under `/prefix`.

A `..` in a name handed to a directory item — `createChildFile`,
`createChildDirectory`, `deleteChild` — is joined onto the item's absolute
path, so under `'confined'` it follows the absolute-path rule (prepend), not
the relative-escape rule: `<prefix>/sub` + `../../x` resolves to the
absolute path above the prefix, which then has the prefix prepended.
Either way it stays under the prefix.

#### Implementation of

[`IAtomicFileTreeAccessors`](../interfaces/IAtomicFileTreeAccessors.md).[`resolveAbsolutePath`](../interfaces/IAtomicFileTreeAccessors.md#resolveabsolutepath)

***

### resolveRealPath()

> **resolveRealPath**(`itemPath`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>

Resolves a path to its canonical real path, with every symbolic link
resolved. Optional: only storage that has symbolic links (a filesystem)
implements it.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `itemPath` | `string` | The path to resolve. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>

`Success` with the real path, or `Failure` if it cannot be
resolved (for example, it does not exist).

#### Implementation of

[`IAtomicFileTreeAccessors`](../interfaces/IAtomicFileTreeAccessors.md).[`resolveRealPath`](../interfaces/IAtomicFileTreeAccessors.md#resolverealpath)

***

### saveFileBytes()

> **saveFileBytes**(`path`, `bytes`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`Uint8Array`\<`ArrayBufferLike`\>\>

Saves bytes to a file at the given path, with no text encoding applied.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `path` | `string` | The path of the file to save. |
| `bytes` | `Uint8Array` | The bytes to save. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`Uint8Array`\<`ArrayBufferLike`\>\>

`Success` with the bytes that were saved, or `Failure` with an error message.

#### Implementation of

[`IMutableBinaryFileTreeAccessors`](../interfaces/IMutableBinaryFileTreeAccessors.md).[`saveFileBytes`](../interfaces/IMutableBinaryFileTreeAccessors.md#savefilebytes)

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

> **writeFileAtomically**(`filePath`, `contents`, `options`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IAtomicWriteReceipt`](../interfaces/IAtomicWriteReceipt.md), [`IAtomicWriteFailure`](../interfaces/IAtomicWriteFailure.md)\>

Replaces (or creates) a file's contents such that a reader never
observes a torn write.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `filePath` | `string` | Absolute path of the file to write. |
| `contents` | `string` | The string contents to write. |
| `options` | [`IAtomicWriteOptions`](../interfaces/IAtomicWriteOptions.md) | The requested [options](../interfaces/IAtomicWriteOptions.md). |

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IAtomicWriteReceipt`](../interfaces/IAtomicWriteReceipt.md), [`IAtomicWriteFailure`](../interfaces/IAtomicWriteFailure.md)\>

`DetailedSuccess` with the [receipt](../interfaces/IAtomicWriteReceipt.md) if the write committed, or `DetailedFailure` with a classified
[failure](../interfaces/IAtomicWriteFailure.md).

#### Remarks

Validates destination writability, path confinement, and the requested
guarantee before any mutation — a stronger guarantee than this store can
honor fails at the `'validate'` stage, leaving the destination
unchanged. Ordinary [saveFileContents](../interfaces/IMutableFileTreeAccessors.md#savefilecontents) retains its existing semantics; this is a sibling
capability, not a replacement.

#### Implementation of

[`IAtomicFileTreeAccessors`](../interfaces/IAtomicFileTreeAccessors.md).[`writeFileAtomically`](../interfaces/IAtomicFileTreeAccessors.md#writefileatomically)

***

### create()

> `static` **create**\<`TCT`\>(`params?`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`FsFileTreeAccessors`\<`TCT`\>\>

Creates a new FsFileTreeAccessors.

#### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-tct-1"></a> `TCT` *extends* `string` | `string` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params?` | [`IFsFileTreeInitParams`](../interfaces/IFsFileTreeInitParams.md)\<`TCT`\> | Optional [initialization parameters](../interfaces/IFsFileTreeInitParams.md). |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`FsFileTreeAccessors`\<`TCT`\>\>

`Success` with the accessors, or `Failure` if `params` asks for
confinement without a `prefix`, asks for `realPath` under `'unconfined'`, or
names an unknown policy.
