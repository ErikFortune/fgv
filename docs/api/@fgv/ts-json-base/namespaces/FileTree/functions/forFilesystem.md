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
| <a id="type-parameter-tct"></a> `TCT` *extends* `string` | `string` |

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `prefix?` | `string` | An optional prefix, against which relative paths are resolved. An absolute path is used as given (the default `'unconfined'` policy); pass [parameters](../interfaces/IFsFileTreeInitParams.md) with `absolutePathPolicy` to confine paths to the prefix. |

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
| <a id="type-parameter-tct-1"></a> `TCT` *extends* `string` | `string` |

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params?` | [`IFsFileTreeInitParams`](../interfaces/IFsFileTreeInitParams.md)\<`TCT`\> | Optional [initialization parameters](../interfaces/IFsFileTreeInitParams.md) for the file tree. |

### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`FileTree`](../classes/FileTree.md)\<`TCT`\>\>

`Success` with the new [FileTree](../classes/FileTree.md) instance
if successful, or `Failure` with an error message otherwise — including when
`params` asks for confinement without a `prefix` (see
[FsFileTreeAccessors.create](../classes/FsFileTreeAccessors.md#create)).
