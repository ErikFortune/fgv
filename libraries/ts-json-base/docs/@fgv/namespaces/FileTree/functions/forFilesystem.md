[**@fgv/ts-json-base**](../../../../README.md)

***

[@fgv/ts-json-base](../../../../README.md) / [FileTree](../README.md) / forFilesystem

# Function: forFilesystem()

## Call Signature

> **forFilesystem**\<`TCT`\>(`prefix?`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`FileTree`](../classes/FileTree.md)\<`TCT`\>\>

Helper function to create a new [FileTree](../classes/FileTree.md) instance
with accessors for the filesystem.

### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TCT` *extends* `string` | `string` |

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `prefix?` | `string` | An optional prefix to prepended to supplied relative paths. |

### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`FileTree`](../classes/FileTree.md)\<`TCT`\>\>

`Success` with the new [FileTree](../classes/FileTree.md) instance
if successful, or `Failure` with an error message otherwise.

## Call Signature

> **forFilesystem**\<`TCT`\>(`params?`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`FileTree`](../classes/FileTree.md)\<`TCT`\>\>

Helper function to create a new [FileTree](../classes/FileTree.md) instance
with accessors for the filesystem.

### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TCT` *extends* `string` | `string` |

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params?` | [`IFileTreeInitParams`](../interfaces/IFileTreeInitParams.md)\<`TCT`\> | Optional [initialization parameters](../interfaces/IFileTreeInitParams.md) for the file tree. |

### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`FileTree`](../classes/FileTree.md)\<`TCT`\>\>

`Success` with the new [FileTree](../classes/FileTree.md) instance
if successful, or `Failure` with an error message otherwise.
