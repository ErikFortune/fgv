[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-json-base](../../../README.md) / [FileTree](../README.md) / IMutableBinaryFileTreeDirectoryItem

# Interface: IMutableBinaryFileTreeDirectoryItem\<TCT\>

Extended directory item interface for directories that can create a child file
directly from raw bytes.

## Remarks

This is an *optional capability* — use
[isMutableBinaryDirectoryItem](../functions/isMutableBinaryDirectoryItem.md) to narrow.
It exists because
[createChildFile](IMutableFileTreeDirectoryItem.md#createchildfile) is
string-only: without it, writing a byte-native file into a directory means creating a
placeholder and then calling
[setRawBytes](IMutableBinaryFileTreeFileItem.md#setrawbytes), which leaves
an empty file behind when the byte write turns out not to be supported.

**As with the other item-level guards, `isMutableBinaryDirectoryItem` narrows the type
and is not a success guarantee** — [FileTree.DirectoryItem](../classes/DirectoryItem.md) implements this
interface unconditionally and delegates to its accessors. Unlike the file-item case,
however, the answer *is* reachable from the item: call
[canCreateChildFileBytes](#cancreatechildfilebytes),
which reports what the backing store will actually do. That mirrors
[getIsMutable](IMutableFileTreeFileItem.md#getismutable), which exists for
the same reason.

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
[createChildFileBytes](#createchildfilebytes)
will fail for every name, because the store persists text and a byte write could not
round-trip.

**It reports the store's mechanism, not its current mutability policy** — the same
axis [isMutableAccessors](../functions/isMutableAccessors.md) reports, and for the same
reason. A byte-persisting store with mutation switched off still answers `true`, and
the write then fails with the real reason. That is deliberate: answering `false` there
would send a caller down a text path to be refused for a *different* reason, which is
a worse diagnosis than the true one. Ask
[getIsMutable](IMutableFileTreeFileItem.md#getismutable) for the policy.

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

### createChildFileBytes()

> **createChildFileBytes**(`name`, `bytes`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IMutableFileTreeFileItem`](IMutableFileTreeFileItem.md)\<`TCT`\>\>

Creates a new file as a child of this directory from raw bytes, with no text
encoding applied.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `name` | `string` | The file name to create. |
| `bytes` | `Uint8Array` | The bytes to write. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IMutableFileTreeFileItem`](IMutableFileTreeFileItem.md)\<`TCT`\>\>

`Success` with the new file item, or `Failure` with an error message.

#### Remarks

Nothing is written when the capability is absent — the check happens before the
create, so a failure leaves no placeholder behind.

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
