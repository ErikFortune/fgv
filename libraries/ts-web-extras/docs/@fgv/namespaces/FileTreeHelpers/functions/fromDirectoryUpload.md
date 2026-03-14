[**@fgv/ts-web-extras**](../../../../README.md)

***

[@fgv/ts-web-extras](../../../../README.md) / [FileTreeHelpers](../README.md) / fromDirectoryUpload

# Function: fromDirectoryUpload()

> **fromDirectoryUpload**(`fileList`, `params?`): `Promise`\<[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`FileTree_2`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`string`\>\>\>

Helper function to create a new FileTree instance
from a directory upload with webkitRelativePath support.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `fileList` | `FileList` | FileList from a directory upload (input with webkitdirectory) |
| `params?` | [`IFileTreeInitParams`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`string`\> | Optional `IFileTreeInitParams` for the file tree. |

## Returns

`Promise`\<[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`FileTree_2`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`string`\>\>\>

Promise resolving to a successful Result with the new FileTree instance
if successful, or a failed Result with an error message otherwise

## Remarks

The content type of the files is always `string` and the default
accept contentType function (`FileTree.FileItem.defaultAcceptContentType`) is
is used, so content type is derived from the mime type of the file, when
available.
