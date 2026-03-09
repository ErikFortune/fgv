[**@fgv/ts-json-base**](../../../../README.md)

***

[@fgv/ts-json-base](../../../../README.md) / [FileTree](../README.md) / inMemory

# Function: inMemory()

## Call Signature

> **inMemory**\<`TCT`\>(`files`, `prefix?`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`FileTree`](../classes/FileTree.md)\<`TCT`\>\>

Helper function to create a new [FileTree](../classes/FileTree.md) instance
with accessors for an in-memory file tree.

### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TCT` *extends* `string` | `string` |

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `files` | [`IInMemoryFile`](../interfaces/IInMemoryFile.md)\<`TCT`\>[] | An array of File |[in-memory files](../interfaces/IInMemoryFile.md) to include in the tree. |
| `prefix?` | `string` | An optional prefix to add to the paths of all files in the tree. |

### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`FileTree`](../classes/FileTree.md)\<`TCT`\>\>

`Success` with the new [FileTree](../classes/FileTree.md) instance
if successful, or `Failure` with an error message otherwise.

## Call Signature

> **inMemory**\<`TCT`\>(`files`, `params?`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`FileTree`](../classes/FileTree.md)\<`TCT`\>\>

Helper function to create a new [FileTree](../classes/FileTree.md) instance
with accessors for an in-memory file tree.

### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TCT` *extends* `string` | `string` |

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `files` | [`IInMemoryFile`](../interfaces/IInMemoryFile.md)\<`TCT`\>[] | An array of File |[in-memory files](../interfaces/IInMemoryFile.md) to include in the tree. |
| `params?` | [`IFileTreeInitParams`](../interfaces/IFileTreeInitParams.md)\<`TCT`\> | Optional [initialization parameters](../interfaces/IFileTreeInitParams.md) for the file tree. |

### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`FileTree`](../classes/FileTree.md)\<`TCT`\>\>

`Success` with the new [FileTree](../classes/FileTree.md) instance
if successful, or `Failure` with an error message otherwise.
