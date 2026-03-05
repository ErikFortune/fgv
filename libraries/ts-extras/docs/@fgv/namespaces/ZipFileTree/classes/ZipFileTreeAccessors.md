[**@fgv/ts-extras**](../../../../README.md)

***

[@fgv/ts-extras](../../../../README.md) / [ZipFileTree](../README.md) / ZipFileTreeAccessors

# Class: ZipFileTreeAccessors\<TCT\>

File tree accessors for ZIP archives.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TCT` *extends* `string` | `string` |

## Implements

- [`IMutableFileTreeAccessors`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`TCT`\>

## Methods

### fileIsMutable()

> **fileIsMutable**(`__path`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`boolean`, [`SaveDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\>

Returns a boolean indicating whether this file can be saved.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `__path` | `string` |

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`boolean`, [`SaveDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\>

A `DetailedResult` indicating success or failure.

#### Implementation of

`FileTree.IMutableFileTreeAccessors.fileIsMutable`

***

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

`FileTree.IMutableFileTreeAccessors.getBaseName`

***

### getChildren()

> **getChildren**(`path`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<readonly [`FileTreeItem`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`TCT`\>[]\>

Gets the children of a directory in the file tree.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `path` | `string` |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<readonly [`FileTreeItem`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`TCT`\>[]\>

#### Implementation of

`FileTree.IMutableFileTreeAccessors.getChildren`

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

`FileTree.IMutableFileTreeAccessors.getExtension`

***

### getFileContents()

> **getFileContents**(`path`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string`\>

Gets the contents of a file in the file tree.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `path` | `string` |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string`\>

#### Implementation of

`FileTree.IMutableFileTreeAccessors.getFileContents`

***

### getFileContentType()

> **getFileContentType**(`path`, `provided?`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TCT` \| `undefined`\>

Gets the content type of a file in the file tree.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `path` | `string` |
| `provided?` | `string` |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TCT` \| `undefined`\>

#### Implementation of

`FileTree.IMutableFileTreeAccessors.getFileContentType`

***

### getItem()

> **getItem**(`path`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`FileTreeItem`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`TCT`\>\>

Gets an item from the file tree.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `path` | `string` |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`FileTreeItem`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`TCT`\>\>

#### Implementation of

`FileTree.IMutableFileTreeAccessors.getItem`

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

`FileTree.IMutableFileTreeAccessors.joinPaths`

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

`FileTree.IMutableFileTreeAccessors.resolveAbsolutePath`

***

### saveFileContents()

> **saveFileContents**(`__path`, `__contents`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string`\>

Saves the contents of a file.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `__path` | `string` |
| `__contents` | `string` |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string`\>

A `Result` indicating success or failure.

#### Implementation of

`FileTree.IMutableFileTreeAccessors.saveFileContents`

***

### defaultInferContentType()

> `static` **defaultInferContentType**\<`TCT`\>(`__filePath`, `__provided?`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TCT` \| `undefined`\>

Default function to infer the content type of a file.

#### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TCT` *extends* `string` | `string` |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `__filePath` | `string` |
| `__provided?` | `string` |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TCT` \| `undefined`\>

`Success` with the content type of the file if successful, or
`Failure` with an error message otherwise.

#### Remarks

This default implementation always returns `Success` with `undefined`.

***

### fromBuffer()

#### Call Signature

> `static` **fromBuffer**\<`TCT`\>(`zipBuffer`, `prefix?`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`ZipFileTreeAccessors`\<`TCT`\>\>

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

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`ZipFileTreeAccessors`\<`TCT`\>\>

Result containing the ZipFileTreeAccessors instance.

#### Call Signature

> `static` **fromBuffer**\<`TCT`\>(`zipBuffer`, `params?`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`ZipFileTreeAccessors`\<`TCT`\>\>

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

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`ZipFileTreeAccessors`\<`TCT`\>\>

Result containing the ZipFileTreeAccessors instance.

***

### fromBufferAsync()

#### Call Signature

> `static` **fromBufferAsync**\<`TCT`\>(`zipBuffer`, `prefix?`): `Promise`\<[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`ZipFileTreeAccessors`\<`TCT`\>\>\>

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

`Promise`\<[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`ZipFileTreeAccessors`\<`TCT`\>\>\>

Promise containing Result with the ZipFileTreeAccessors instance.

#### Call Signature

> `static` **fromBufferAsync**\<`TCT`\>(`zipBuffer`, `params?`): `Promise`\<[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`ZipFileTreeAccessors`\<`TCT`\>\>\>

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

`Promise`\<[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`ZipFileTreeAccessors`\<`TCT`\>\>\>

Promise containing Result with the ZipFileTreeAccessors instance.

***

### fromFile()

> `static` **fromFile**\<`TCT`\>(`file`, `params?`): `Promise`\<[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`ZipFileTreeAccessors`\<`TCT`\>\>\>

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

`Promise`\<[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`ZipFileTreeAccessors`\<`TCT`\>\>\>

Result containing the ZipFileTreeAccessors instance.
