[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-json-base](../../../README.md) / [FileTree](../README.md) / IInMemoryFile

# Interface: IInMemoryFile\<TCT\>

Represents a single file in an in-memory [file tree](../classes/FileTree.md).

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-tct"></a> `TCT` *extends* `string` | `string` |

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-contents"></a> `contents` | `readonly` | `unknown` | The contents of the file. **Remarks** A `string` is stored verbatim. A `Uint8Array` is stored verbatim as bytes and is decoded as UTF-8 on text reads. Any other value is serialized with `JSON.stringify` on read. |
| <a id="property-contenttype"></a> `contentType?` | `readonly` | `TCT` | The content type of the file. |
| <a id="property-path"></a> `path` | `readonly` | `string` | The absolute path of the file in the tree. |
