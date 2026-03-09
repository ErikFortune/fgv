[**@fgv/ts-json-base**](../../../../README.md)

***

[@fgv/ts-json-base](../../../../README.md) / [FileTree](../README.md) / IInMemoryFile

# Interface: IInMemoryFile\<TCT\>

Represents a single file in an in-memory [file tree](../classes/FileTree.md).

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TCT` *extends* `string` | `string` |

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="contents"></a> `contents` | `readonly` | `unknown` | The contents of the file |
| <a id="contenttype"></a> `contentType?` | `readonly` | `TCT` | The content type of the file. |
| <a id="path"></a> `path` | `readonly` | `string` | The absolute path of the file in the tree. |
