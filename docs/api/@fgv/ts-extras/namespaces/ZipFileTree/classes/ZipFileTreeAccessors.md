[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [ZipFileTree](../README.md) / ZipFileTreeAccessors

# Class: ZipFileTreeAccessors\<TCT\>

Read-only file tree accessors for ZIP archives.
ZIP archives are read-only by design — use [isMutableAccessors](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)
to check before attempting mutations.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TCT` *extends* `string` | `string` |

## Implements

- [`IFileTreeAccessors`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`TCT`\>

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

`FileTree.IFileTreeAccessors.getBaseName`

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

`FileTree.IFileTreeAccessors.getChildren`

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

`FileTree.IFileTreeAccessors.getExtension`

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

#### Implementation of

`FileTree.IFileTreeAccessors.getFileContents`

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

`FileTree.IFileTreeAccessors.getFileContentType`

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

`FileTree.IFileTreeAccessors.getItem`

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

`FileTree.IFileTreeAccessors.joinPaths`

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

`FileTree.IFileTreeAccessors.resolveAbsolutePath`

***

### defaultInferContentType()

> `static` **defaultInferContentType**\<`TCT`\>(`__filePath`, `__provided?`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`TCT` \| `undefined`\>

Default function to infer the content type of a file.

#### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TCT` *extends* `string` | `string` |

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
| `TCT` *extends* `string` | `string` |

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
| `TCT` *extends* `string` | `string` |

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
| `TCT` *extends* `string` | `string` |

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
| `TCT` *extends* `string` | `string` |

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
| `TCT` *extends* `string` | `string` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `file` | `File` | The File object containing ZIP data. |
| `params?` | [`IFileTreeInitParams`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`TCT`\> | Optional initialization parameters. |

#### Returns

`Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`ZipFileTreeAccessors`\<`TCT`\>\>\>

Result containing the ZipFileTreeAccessors instance.
