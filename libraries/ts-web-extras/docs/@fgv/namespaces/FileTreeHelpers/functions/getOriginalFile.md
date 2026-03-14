[**@fgv/ts-web-extras**](../../../../README.md)

***

[@fgv/ts-web-extras](../../../../README.md) / [FileTreeHelpers](../README.md) / getOriginalFile

# Function: getOriginalFile()

> **getOriginalFile**(`fileList`, `path`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`File`\>

Helper function to get the original File object from a FileList by path.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `fileList` | `FileList` | The original FileList |
| `path` | `string` | The path to the file |

## Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`File`\>

A successful Result with the File object if found,
or a failed Result with an error message otherwise
