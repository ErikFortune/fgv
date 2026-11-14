[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [ZipFileTree](../README.md) / ZipFileTreeAccessors

# Class: ZipFileTreeAccessors\<TCT\>

Read-only file tree accessors for ZIP archives.
ZIP archives are read-only by design — use [isMutableAccessors](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)
to check before attempting mutations.

## Remarks

ZIP entries are byte-native, so these accessors also implement the read half of the
optional binary capability (`FileTree.IBinaryFileTreeAccessors`) — use
`FileTree.isBinaryAccessors` to narrow and `getFileBytes()` to read an entry's
undecoded bytes.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-tct"></a> `TCT` *extends* `string` | `string` |

## Implements

- [`IBinaryFileTreeAccessors`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`TCT`\>
- [`IStrictTextFileTreeAccessors`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`TCT`\>

## Methods

### getBaseName()

> **getBaseName**(`path`, `suffix?`): `string`

Gets the base name of a path.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `path` | `string` |
| `suffix?` | `string` |

#### Returns

`string`

#### Implementation of

`FileTree.IBinaryFileTreeAccessors.getBaseName`

***

### getChildren()

> **getChildren**(`path`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<readonly [`FileTreeItem`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`TCT`\>[]\>

Gets the children of a directory in the file tree.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `path` | `string` |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<readonly [`FileTreeItem`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`TCT`\>[]\>

#### Implementation of

`FileTree.IBinaryFileTreeAccessors.getChildren`

***

### getExtension()

> **getExtension**(`path`): `string`

Gets the extension of a path.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `path` | `string` |

#### Returns

`string`

#### Implementation of

`FileTree.IBinaryFileTreeAccessors.getExtension`

***

### getFileBytes()

> **getFileBytes**(`path`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`Uint8Array`\<`ArrayBufferLike`\>\>

Gets the raw bytes of a ZIP entry, with no text decoding applied.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `path` | `string` |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`Uint8Array`\<`ArrayBufferLike`\>\>

#### Remarks

The returned array is the archive's internal buffer and must not be modified.

#### Implementation of

`FileTree.IBinaryFileTreeAccessors.getFileBytes`

***

### getFileContents()

> **getFileContents**(`path`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>

Gets the contents of a file in the file tree.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `path` | `string` |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>

#### Remarks

The entry's bytes are decoded as UTF-8 with the lenient WHATWG default. Use
`getFileBytes()` for the undecoded bytes.

#### Implementation of

`FileTree.IBinaryFileTreeAccessors.getFileContents`

***

### getFileContentType()

> **getFileContentType**(`path`, `provided?`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`TCT` \| `undefined`\>

Gets the content type of a file in the file tree.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `path` | `string` |
| `provided?` | `string` |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`TCT` \| `undefined`\>

#### Implementation of

`FileTree.IBinaryFileTreeAccessors.getFileContentType`

***

### getFileTextStrict()

> **getFileTextStrict**(`path`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>

Gets the contents of a file in the file tree, decoding UTF-8 strictly.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `path` | `string` | Absolute path of the entry. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>

`Success` with the decoded text; `Failure` if the entry's bytes are
not valid UTF-8.

#### Remarks

Always decidable here: ZIP entries are byte-native, so this store holds
exactly the bytes the archive carried.

#### Implementation of

`FileTree.IStrictTextFileTreeAccessors.getFileTextStrict`

***

### getItem()

> **getItem**(`path`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`FileTreeItem`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`TCT`\>\>

Gets an item from the file tree.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `path` | `string` |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`FileTreeItem`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`TCT`\>\>

#### Implementation of

`FileTree.IBinaryFileTreeAccessors.getItem`

***

### joinPaths()

> **joinPaths**(...`paths`): `string`

Joins paths together.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| ...`paths` | `string`[] |

#### Returns

`string`

#### Implementation of

`FileTree.IBinaryFileTreeAccessors.joinPaths`

***

### resolveAbsolutePath()

> **resolveAbsolutePath**(...`paths`): `string`

Resolves paths to an absolute path.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| ...`paths` | `string`[] |

#### Returns

`string`

#### Implementation of

`FileTree.IBinaryFileTreeAccessors.resolveAbsolutePath`

***

### defaultInferContentType()

> `static` **defaultInferContentType**\<`TCT`\>(`__filePath`, `__provided?`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`TCT` \| `undefined`\>

Default function to infer the content type of a file.

#### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-tct-1"></a> `TCT` *extends* `string` | `string` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `__filePath` | `string` | The path of the file. |
| `__provided?` | `string` | Optional supplied content type. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`TCT` \| `undefined`\>

`Success` with the content type of the file if successful, or
`Failure` with an error message otherwise.

#### Remarks

This default implementation always returns `Success` with `undefined`.

***

### fromBuffer()

#### Call Signature

> `static` **fromBuffer**\<`TCT`\>(`zipBuffer`, `prefix?`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`ZipFileTreeAccessors`\<`TCT`\>\>

Creates a new ZipFileTreeAccessors instance from a ZIP file buffer (synchronous).

##### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-tct-2"></a> `TCT` *extends* `string` | `string` |

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `zipBuffer` | `ArrayBuffer` \| `Uint8Array`\<`ArrayBufferLike`\> | The ZIP file as an ArrayBuffer or Uint8Array. |
| `prefix?` | `string` | Optional prefix to prepend to paths. |

##### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`ZipFileTreeAccessors`\<`TCT`\>\>

Result containing the ZipFileTreeAccessors instance.

#### Call Signature

> `static` **fromBuffer**\<`TCT`\>(`zipBuffer`, `params?`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`ZipFileTreeAccessors`\<`TCT`\>\>

Creates a new ZipFileTreeAccessors instance from a ZIP file buffer (synchronous).

##### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-tct-3"></a> `TCT` *extends* `string` | `string` |

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `zipBuffer` | `ArrayBuffer` \| `Uint8Array`\<`ArrayBufferLike`\> | The ZIP file as an ArrayBuffer or Uint8Array. |
| `params?` | [`IFileTreeInitParams`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`TCT`\> | Optional initialization parameters. |

##### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`ZipFileTreeAccessors`\<`TCT`\>\>

Result containing the ZipFileTreeAccessors instance.

***

### fromBufferAsync()

#### Call Signature

> `static` **fromBufferAsync**\<`TCT`\>(`zipBuffer`, `prefix?`): `Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`ZipFileTreeAccessors`\<`TCT`\>\>\>

Creates a new ZipFileTreeAccessors instance from a ZIP file buffer (asynchronous).

##### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-tct-4"></a> `TCT` *extends* `string` | `string` |

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `zipBuffer` | `ArrayBuffer` \| `Uint8Array`\<`ArrayBufferLike`\> | The ZIP file as an ArrayBuffer or Uint8Array. |
| `prefix?` | `string` | Optional prefix to prepend to paths. |

##### Returns

`Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`ZipFileTreeAccessors`\<`TCT`\>\>\>

Promise containing Result with the ZipFileTreeAccessors instance.

#### Call Signature

> `static` **fromBufferAsync**\<`TCT`\>(`zipBuffer`, `params?`): `Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`ZipFileTreeAccessors`\<`TCT`\>\>\>

Creates a new ZipFileTreeAccessors instance from a ZIP file buffer (asynchronous).

##### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-tct-5"></a> `TCT` *extends* `string` | `string` |

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `zipBuffer` | `ArrayBuffer` \| `Uint8Array`\<`ArrayBufferLike`\> | The ZIP file as an ArrayBuffer or Uint8Array. |
| `params?` | [`IFileTreeInitParams`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`TCT`\> | Optional initialization parameters. |

##### Returns

`Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`ZipFileTreeAccessors`\<`TCT`\>\>\>

Promise containing Result with the ZipFileTreeAccessors instance.

***

### fromFile()

> `static` **fromFile**\<`TCT`\>(`file`, `params?`): `Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`ZipFileTreeAccessors`\<`TCT`\>\>\>

Creates a new ZipFileTreeAccessors instance from a File object (browser environment).

#### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-tct-6"></a> `TCT` *extends* `string` | `string` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `file` | `File` | The File object containing ZIP data. |
| `params?` | [`IFileTreeInitParams`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`TCT`\> | Optional initialization parameters. |

#### Returns

`Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`ZipFileTreeAccessors`\<`TCT`\>\>\>

Result containing the ZipFileTreeAccessors instance.
