[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-json-base](../../../README.md) / [FileTree](../README.md) / IAtomicFileTreeDirectoryItem

# Interface: IAtomicFileTreeDirectoryItem\<TCT\>

Extended directory item interface for directories that can atomically
write a child file, without the caller ever seeing a native path or
reaching into accessor internals.

## Remarks

This is an *optional capability* — use
[isAtomicDirectoryItem](../functions/isAtomicDirectoryItem.md) to narrow.
**As with the other item-level guards, the guard narrows the type and is
not a success guarantee** — [FileTree.DirectoryItem](../classes/DirectoryItem.md) implements this
interface unconditionally and delegates to its accessors, so
`isAtomicDirectoryItem` is `true` for any `DirectoryItem` regardless of
what backs it. Ask
[getAtomicWriteCapabilities](#getatomicwritecapabilities) for the store's actual answer, mirroring
[canCreateChildFileBytes](IMutableBinaryFileTreeDirectoryItem.md#cancreatechildfilebytes).

## Extends

- [`IMutableFileTreeDirectoryItem`](IMutableFileTreeDirectoryItem.md)\<`TCT`\>

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-tct"></a> `TCT` *extends* `string` | `string` |

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-absolutepath"></a> `absolutePath` | `readonly` | `string` | The absolute path of the directory. |
| <a id="property-name"></a> `name` | `readonly` | `string` | The name of the directory |
| <a id="property-type"></a> `type` | `readonly` | `"directory"` | Indicates that this [file tree item](../type-aliases/FileTreeItem.md) is a directory |

## Methods

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

***

### createChildDirectory()

> **createChildDirectory**(`name`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IMutableFileTreeDirectoryItem`](IMutableFileTreeDirectoryItem.md)\<`TCT`\>\>

Creates a new subdirectory as a child of this directory.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `name` | `string` | The directory name to create. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IMutableFileTreeDirectoryItem`](IMutableFileTreeDirectoryItem.md)\<`TCT`\>\>

`Success` with the new directory item, or `Failure` with an error message.

#### Inherited from

[`IMutableFileTreeDirectoryItem`](IMutableFileTreeDirectoryItem.md).[`createChildDirectory`](IMutableFileTreeDirectoryItem.md#createchilddirectory)

***

### createChildFile()

> **createChildFile**(`name`, `contents`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IMutableFileTreeFileItem`](IMutableFileTreeFileItem.md)\<`TCT`\>\>

Creates a new file as a child of this directory.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `name` | `string` | The file name to create. |
| `contents` | `string` | The string contents to write. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IMutableFileTreeFileItem`](IMutableFileTreeFileItem.md)\<`TCT`\>\>

`Success` with the new file item, or `Failure` with an error message.

#### Inherited from

[`IMutableFileTreeDirectoryItem`](IMutableFileTreeDirectoryItem.md).[`createChildFile`](IMutableFileTreeDirectoryItem.md#createchildfile)

***

### delete()

> **delete**(): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`boolean`\>

Deletes this directory from its backing store.
The directory must be empty or the operation will fail.

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`boolean`\>

`Success` with `true` if the directory was deleted, or `Failure` with an error message.

#### Inherited from

[`IMutableFileTreeDirectoryItem`](IMutableFileTreeDirectoryItem.md).[`delete`](IMutableFileTreeDirectoryItem.md#delete)

***

### deleteChild()

> **deleteChild**(`name`, `options?`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`boolean`\>

Deletes a child item from this directory.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `name` | `string` | The name of the child to delete. |
| `options?` | [`IDeleteChildOptions`](IDeleteChildOptions.md) | Optional [options](IDeleteChildOptions.md) controlling deletion behavior. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`boolean`\>

`Success` with `true` if the child was deleted, or `Failure` with an error message.

#### Inherited from

[`IMutableFileTreeDirectoryItem`](IMutableFileTreeDirectoryItem.md).[`deleteChild`](IMutableFileTreeDirectoryItem.md#deletechild)

***

### getAtomicWriteCapabilities()

> **getAtomicWriteCapabilities**(): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IAtomicWriteCapabilities`](IAtomicWriteCapabilities.md)\>

Reports what atomic replacement this directory's backing store can
offer.

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IAtomicWriteCapabilities`](IAtomicWriteCapabilities.md)\>

`Success` with the store's [capabilities](IAtomicWriteCapabilities.md) — a non-capable store answers `atomicReplace: false`
rather than failing the inquiry. This directory's own `absolutePath` is
known to exist, so no accessor shipped today fails this call for a
`DirectoryItem`; a hypothetical accessor whose directory-existence check
could race with deletion is not precluded from returning `Failure`.

***

### getChildren()

> **getChildren**(): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<readonly [`FileTreeItem`](../type-aliases/FileTreeItem.md)\<`TCT`\>[]\>

Gets the children of the directory.

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<readonly [`FileTreeItem`](../type-aliases/FileTreeItem.md)\<`TCT`\>[]\>

`Success` with the children of the directory if successful,
or `Failure` with an error message otherwise.

#### Inherited from

[`IMutableFileTreeDirectoryItem`](IMutableFileTreeDirectoryItem.md).[`getChildren`](IMutableFileTreeDirectoryItem.md#getchildren)

***

### getStorageIdentity()?

> `optional` **getStorageIdentity**(): [`IFileTreeStorageIdentity`](IFileTreeStorageIdentity.md)\<`TCT`\>

Says what storage this directory names, so a consumer can tell whether two
directory items reach the same place. Optional: an item that cannot say
leaves it absent. See [FileTree.IFileTreeStorageIdentity](IFileTreeStorageIdentity.md).

#### Returns

[`IFileTreeStorageIdentity`](IFileTreeStorageIdentity.md)\<`TCT`\>

#### Inherited from

[`IMutableFileTreeDirectoryItem`](IMutableFileTreeDirectoryItem.md).[`getStorageIdentity`](IMutableFileTreeDirectoryItem.md#getstorageidentity)

***

### writeChildAtomically()

> **writeChildAtomically**(`name`, `contents`, `options`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IAtomicWriteReceipt`](IAtomicWriteReceipt.md), [`IAtomicWriteFailure`](IAtomicWriteFailure.md)\>

Atomically writes (creating or replacing) a child file of this
directory, such that a reader never observes a torn write.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `name` | `string` | The file name to write, relative to this directory. Must be a single valid child name — no path separators. |
| `contents` | `string` | The string contents to write. |
| `options` | [`IAtomicWriteOptions`](IAtomicWriteOptions.md) | The requested [options](IAtomicWriteOptions.md). |

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IAtomicWriteReceipt`](IAtomicWriteReceipt.md), [`IAtomicWriteFailure`](IAtomicWriteFailure.md)\>

`DetailedSuccess` with the [receipt](IAtomicWriteReceipt.md) if the write committed, or `DetailedFailure` with a classified
[failure](IAtomicWriteFailure.md).
