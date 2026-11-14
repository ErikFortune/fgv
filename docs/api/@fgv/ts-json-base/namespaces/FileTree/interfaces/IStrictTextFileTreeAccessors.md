[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-json-base](../../../README.md) / [FileTree](../README.md) / IStrictTextFileTreeAccessors

# Interface: IStrictTextFileTreeAccessors\<TCT\>

Extended accessors for stores that can decode a file's text **strictly** —
failing on malformed UTF-8 instead of substituting U+FFFD.

## Remarks

This is an *optional capability*, deliberately not part of
[FileTree.IFileTreeAccessors](IFileTreeAccessors.md). Narrow with
[isStrictTextAccessors](../functions/isStrictTextAccessors.md).

**The capability is about custody of the bytes, not about the adapter.** A
store can only answer "was this valid UTF-8?" if it still holds the original
bytes. A store whose transport already decoded them — a REST payload carrying
`contents` as a JSON string, `localStorage`, an in-memory tree seeded with a
`string` — cannot answer it *even in principle*: the substitution happened
before the store existed, and re-encoding the decoded string produces
well-formed UTF-8 whose corruption is baked in and no longer detectable.

Such stores therefore **fail** rather than reporting success. That is the
whole point of the capability: a strict read that quietly succeeded on an
already-decoded string would be a green light from a check that cannot fail,
which is worse than not offering one.

## Extends

- [`IFileTreeAccessors`](IFileTreeAccessors.md)\<`TCT`\>

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-tct"></a> `TCT` *extends* `string` | `string` |

## Methods

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

[`IFileTreeAccessors`](IFileTreeAccessors.md).[`getBaseName`](IFileTreeAccessors.md#getbasename)

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

[`IFileTreeAccessors`](IFileTreeAccessors.md).[`getChildren`](IFileTreeAccessors.md#getchildren)

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

[`IFileTreeAccessors`](IFileTreeAccessors.md).[`getExtension`](IFileTreeAccessors.md#getextension)

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

[`IFileTreeAccessors`](IFileTreeAccessors.md).[`getFileContents`](IFileTreeAccessors.md#getfilecontents)

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

[`IFileTreeAccessors`](IFileTreeAccessors.md).[`getFileContentType`](IFileTreeAccessors.md#getfilecontenttype)

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

[`IFileTreeAccessors`](IFileTreeAccessors.md).[`getItem`](IFileTreeAccessors.md#getitem)

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

[`IFileTreeAccessors`](IFileTreeAccessors.md).[`joinPaths`](IFileTreeAccessors.md#joinpaths)

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

[`IFileTreeAccessors`](IFileTreeAccessors.md).[`resolveAbsolutePath`](IFileTreeAccessors.md#resolveabsolutepath)

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

[`IFileTreeAccessors`](IFileTreeAccessors.md).[`resolveRealPath`](IFileTreeAccessors.md#resolverealpath)
