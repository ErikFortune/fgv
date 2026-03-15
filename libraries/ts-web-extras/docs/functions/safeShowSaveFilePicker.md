[**@fgv/ts-web-extras**](../README.md)

***

[@fgv/ts-web-extras](../README.md) / safeShowSaveFilePicker

# Function: safeShowSaveFilePicker()

> **safeShowSaveFilePicker**(`window`, `options?`): `Promise`\<[`FileSystemFileHandle`](../interfaces/FileSystemFileHandle.md) \| `null`\>

Safely access showSaveFilePicker with proper type checking

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `window` | `Window` | The window object |
| `options?` | [`ShowSaveFilePickerOptions`](../interfaces/ShowSaveFilePickerOptions.md) | Options for the file picker |

## Returns

`Promise`\<[`FileSystemFileHandle`](../interfaces/FileSystemFileHandle.md) \| `null`\>

Promise with file handle or null if not supported
