[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-json-base](../../../README.md) / [FileTree](../README.md) / forFilesystem

# Function: forFilesystem()

## Call Signature

> **forFilesystem**\<`TCT`\>(`prefix?`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`FileTree`](../classes/FileTree.md)\<`TCT`\>\>

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

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`FileTree`](../classes/FileTree.md)\<`TCT`\>\>

`Success` with the new [FileTree](../classes/FileTree.md) instance
if successful, or `Failure` with an error message otherwise.

## Call Signature

> **forFilesystem**\<`TCT`\>(`params?`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`FileTree`](../classes/FileTree.md)\<`TCT`\>\>

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

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`FileTree`](../classes/FileTree.md)\<`TCT`\>\>

`Success` with the new [FileTree](../classes/FileTree.md) instance
if successful, or `Failure` with an error message otherwise.
