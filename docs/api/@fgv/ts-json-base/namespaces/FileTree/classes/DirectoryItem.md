[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-json-base](../../../README.md) / [FileTree](../README.md) / DirectoryItem

# Class: DirectoryItem\<TCT\>

Class representing a directory in a file tree.

## Remarks

Implements the optional byte-native create capability
([FileTree.IMutableBinaryFileTreeDirectoryItem](../interfaces/IMutableBinaryFileTreeDirectoryItem.md)) and the optional atomic-write
capability ([FileTree.IAtomicFileTreeDirectoryItem](../interfaces/IAtomicFileTreeDirectoryItem.md)) by delegating to the underlying
accessors, so both guards are true regardless of what backs it. Ask
[canCreateChildFileBytes](#cancreatechildfilebytes) or
[getAtomicWriteCapabilities](#getatomicwritecapabilities) for
the store's actual answer. A consumer holding a `DirectoryItem` never needs a native path or
accessor internals to perform an atomic child write.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-tct"></a> `TCT` *extends* `string` | `string` |

## Implements

- [`IMutableBinaryFileTreeDirectoryItem`](../interfaces/IMutableBinaryFileTreeDirectoryItem.md)\<`TCT`\>
- [`IAtomicFileTreeDirectoryItem`](../interfaces/IAtomicFileTreeDirectoryItem.md)\<`TCT`\>

## Constructors

### Constructor

> `protected` **new DirectoryItem**\<`TCT`\>(`path`, `hal`): `DirectoryItem`\<`TCT`\>

Protected constructor for derived classes.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `path` | `string` | Relative path of the directory. |
| `hal` | [`IFileTreeAccessors`](../interfaces/IFileTreeAccessors.md)\<`TCT`\> | The [accessors](../interfaces/IFileTreeAccessors.md) to use for file system operations. |

#### Returns

`DirectoryItem`\<`TCT`\>

## Properties

| Property | Modifier | Type | Default value | Description |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-_hal"></a> `_hal` | `public readonly` | [`IFileTreeAccessors`](../interfaces/IFileTreeAccessors.md)\<`TCT`\> | `undefined` | The [accessors](../interfaces/IFileTreeAccessors.md) to use for file system operations. |
| <a id="property-absolutepath"></a> `absolutePath` | `public readonly` | `string` | `undefined` | The absolute path of the directory. |
| <a id="property-type"></a> `type` | `public readonly` | `"directory"` | `'directory'` | Indicates that this [file tree item](../type-aliases/FileTreeItem.md) is a directory |

## Accessors

### name

#### Get Signature

> **get** **name**(): `string`

The name of the directory

##### Returns

`string`

The name of the directory

#### Implementation of

[`IAtomicFileTreeDirectoryItem`](../interfaces/IAtomicFileTreeDirectoryItem.md).[`name`](../interfaces/IAtomicFileTreeDirectoryItem.md#property-name)

## Methods

### canCreateChildFileBytes()

> **canCreateChildFileBytes**(): `boolean`

Reports whether the backing store can persist bytes verbatim.

#### Returns

`boolean`

`true` if the backing store persists bytes verbatim.

#### Remarks

Total and synchronous, and **this one is a success guarantee in the direction that
matters**: it answers from the accessors, which the item's own guard cannot see.
`false` means
[createChildFileBytes](../interfaces/IMutableBinaryFileTreeDirectoryItem.md#createchildfilebytes)
will fail for every name, because the store persists text and a byte write could not
round-trip.

**It reports the store's mechanism, not its current mutability policy** — the same
axis [isMutableAccessors](../functions/isMutableAccessors.md) reports, and for the same
reason. A byte-persisting store with mutation switched off still answers `true`, and
the write then fails with the real reason. That is deliberate: answering `false` there
would send a caller down a text path to be refused for a *different* reason, which is
a worse diagnosis than the true one. Ask
[getIsMutable](../interfaces/IMutableFileTreeFileItem.md#getismutable) for the policy.

#### Implementation of

[`IMutableBinaryFileTreeDirectoryItem`](../interfaces/IMutableBinaryFileTreeDirectoryItem.md).[`canCreateChildFileBytes`](../interfaces/IMutableBinaryFileTreeDirectoryItem.md#cancreatechildfilebytes)

***

### cleanupAtomicTemporaries()

> **cleanupAtomicTemporaries**(): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<readonly `string`[]\>

Removes any working files this store reserves for interrupted atomic
writes from the given directory.

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

[`IAtomicFileTreeDirectoryItem`](../interfaces/IAtomicFileTreeDirectoryItem.md).[`cleanupAtomicTemporaries`](../interfaces/IAtomicFileTreeDirectoryItem.md#cleanupatomictemporaries)

***

### createChildDirectory()

> **createChildDirectory**(`name`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IMutableFileTreeDirectoryItem`](../interfaces/IMutableFileTreeDirectoryItem.md)\<`TCT`\>\>

Creates a new subdirectory as a child of this directory.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `name` | `string` | The directory name to create. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IMutableFileTreeDirectoryItem`](../interfaces/IMutableFileTreeDirectoryItem.md)\<`TCT`\>\>

`Success` with the new directory item, or `Failure` with an error message.

#### Implementation of

[`IAtomicFileTreeDirectoryItem`](../interfaces/IAtomicFileTreeDirectoryItem.md).[`createChildDirectory`](../interfaces/IAtomicFileTreeDirectoryItem.md#createchilddirectory)

***

### createChildFile()

> **createChildFile**(`name`, `contents`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IMutableFileTreeFileItem`](../interfaces/IMutableFileTreeFileItem.md)\<`TCT`\>\>

Creates a new file as a child of this directory.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `name` | `string` | The file name to create. |
| `contents` | `string` | The string contents to write. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IMutableFileTreeFileItem`](../interfaces/IMutableFileTreeFileItem.md)\<`TCT`\>\>

`Success` with the new file item, or `Failure` with an error message.

#### Implementation of

[`IAtomicFileTreeDirectoryItem`](../interfaces/IAtomicFileTreeDirectoryItem.md).[`createChildFile`](../interfaces/IAtomicFileTreeDirectoryItem.md#createchildfile)

***

### createChildFileBytes()

> **createChildFileBytes**(`name`, `bytes`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IMutableFileTreeFileItem`](../interfaces/IMutableFileTreeFileItem.md)\<`TCT`\>\>

Creates a new file as a child of this directory from raw bytes, with no text
encoding applied.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `name` | `string` | The file name to create. |
| `bytes` | `Uint8Array` | The bytes to write. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IMutableFileTreeFileItem`](../interfaces/IMutableFileTreeFileItem.md)\<`TCT`\>\>

`Success` with the new file item, or `Failure` with an error message.

#### Remarks

Nothing is written when the capability is absent — the check happens before the
create, so a failure leaves no placeholder behind.

#### Implementation of

[`IMutableBinaryFileTreeDirectoryItem`](../interfaces/IMutableBinaryFileTreeDirectoryItem.md).[`createChildFileBytes`](../interfaces/IMutableBinaryFileTreeDirectoryItem.md#createchildfilebytes)

***

### delete()

> **delete**(): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`boolean`\>

Deletes this directory from its backing store.
The directory must be empty or the operation will fail.

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`boolean`\>

`Success` with `true` if the directory was deleted, or `Failure` with an error message.

#### Implementation of

[`IAtomicFileTreeDirectoryItem`](../interfaces/IAtomicFileTreeDirectoryItem.md).[`delete`](../interfaces/IAtomicFileTreeDirectoryItem.md#delete)

***

### deleteChild()

> **deleteChild**(`name`, `options?`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`boolean`\>

Deletes a child item from this directory.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `name` | `string` | The name of the child to delete. |
| `options?` | [`IDeleteChildOptions`](../interfaces/IDeleteChildOptions.md) | Optional [options](../interfaces/IDeleteChildOptions.md) controlling deletion behavior. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`boolean`\>

`Success` with `true` if the child was deleted, or `Failure` with an error message.

#### Implementation of

[`IAtomicFileTreeDirectoryItem`](../interfaces/IAtomicFileTreeDirectoryItem.md).[`deleteChild`](../interfaces/IAtomicFileTreeDirectoryItem.md#deletechild)

***

### getAtomicWriteCapabilities()

> **getAtomicWriteCapabilities**(): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IAtomicWriteCapabilities`](../interfaces/IAtomicWriteCapabilities.md)\>

Reports what atomic replacement this directory's backing store can
offer.

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IAtomicWriteCapabilities`](../interfaces/IAtomicWriteCapabilities.md)\>

`Success` with the store's [capabilities](../interfaces/IAtomicWriteCapabilities.md) — a non-capable store answers `atomicReplace: false`
rather than failing the inquiry. This directory's own `absolutePath` is
known to exist, so no accessor shipped today fails this call for a
`DirectoryItem`; a hypothetical accessor whose directory-existence check
could race with deletion is not precluded from returning `Failure`.

#### Implementation of

[`IAtomicFileTreeDirectoryItem`](../interfaces/IAtomicFileTreeDirectoryItem.md).[`getAtomicWriteCapabilities`](../interfaces/IAtomicFileTreeDirectoryItem.md#getatomicwritecapabilities)

***

### getChildren()

> **getChildren**(): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<readonly [`FileTreeItem`](../type-aliases/FileTreeItem.md)\<`TCT`\>[]\>

Gets the children of the directory.

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<readonly [`FileTreeItem`](../type-aliases/FileTreeItem.md)\<`TCT`\>[]\>

`Success` with the children of the directory if successful,
or `Failure` with an error message otherwise.

#### Implementation of

[`IAtomicFileTreeDirectoryItem`](../interfaces/IAtomicFileTreeDirectoryItem.md).[`getChildren`](../interfaces/IAtomicFileTreeDirectoryItem.md#getchildren)

***

### getStorageIdentity()

> **getStorageIdentity**(): [`IFileTreeStorageIdentity`](../interfaces/IFileTreeStorageIdentity.md)\<`TCT`\>

Says what storage this directory names, so a consumer can tell whether two
directory items reach the same place. Optional: an item that cannot say
leaves it absent. See [FileTree.IFileTreeStorageIdentity](../interfaces/IFileTreeStorageIdentity.md).

#### Returns

[`IFileTreeStorageIdentity`](../interfaces/IFileTreeStorageIdentity.md)\<`TCT`\>

#### Implementation of

[`IAtomicFileTreeDirectoryItem`](../interfaces/IAtomicFileTreeDirectoryItem.md).[`getStorageIdentity`](../interfaces/IAtomicFileTreeDirectoryItem.md#getstorageidentity)

***

### writeChildAtomically()

> **writeChildAtomically**(`name`, `contents`, `options`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IAtomicWriteReceipt`](../interfaces/IAtomicWriteReceipt.md), [`IAtomicWriteFailure`](../interfaces/IAtomicWriteFailure.md)\>

Atomically writes (creating or replacing) a child file of this
directory, such that a reader never observes a torn write.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `name` | `string` | The file name to write, relative to this directory. Must be a single valid child name — no path separators. |
| `contents` | `string` | The string contents to write. |
| `options` | [`IAtomicWriteOptions`](../interfaces/IAtomicWriteOptions.md) | The requested [options](../interfaces/IAtomicWriteOptions.md). |

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IAtomicWriteReceipt`](../interfaces/IAtomicWriteReceipt.md), [`IAtomicWriteFailure`](../interfaces/IAtomicWriteFailure.md)\>

`DetailedSuccess` with the [receipt](../interfaces/IAtomicWriteReceipt.md) if the write committed, or `DetailedFailure` with a classified
[failure](../interfaces/IAtomicWriteFailure.md).

#### Implementation of

[`IAtomicFileTreeDirectoryItem`](../interfaces/IAtomicFileTreeDirectoryItem.md).[`writeChildAtomically`](../interfaces/IAtomicFileTreeDirectoryItem.md#writechildatomically)

***

### create()

> `static` **create**\<`TCT`\>(`path`, `hal`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`DirectoryItem`\<`TCT`\>\>

Creates a new DirectoryItem instance.

#### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-tct-1"></a> `TCT` *extends* `string` | `string` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `path` | `string` | Relative path of the directory. |
| `hal` | [`IFileTreeAccessors`](../interfaces/IFileTreeAccessors.md)\<`TCT`\> | The [accessors](../interfaces/IFileTreeAccessors.md) to use for file system operations. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`DirectoryItem`\<`TCT`\>\>

`Success` with the new DirectoryItem instance if successful,
or `Failure` with an error message otherwise.
