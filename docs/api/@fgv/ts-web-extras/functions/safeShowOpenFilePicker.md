[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-web-extras](../README.md) / safeShowOpenFilePicker

# Function: safeShowOpenFilePicker()

> **safeShowOpenFilePicker**(`window`, `options?`): `Promise`\<[`FileSystemFileHandle`](../interfaces/FileSystemFileHandle.md)[] \| `null`\>

Safely access showOpenFilePicker with proper type checking

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `window` | `Window` | The window object |
| `options?` | [`ShowOpenFilePickerOptions`](../interfaces/ShowOpenFilePickerOptions.md) | Options for the file picker |

## Returns

`Promise`\<[`FileSystemFileHandle`](../interfaces/FileSystemFileHandle.md)[] \| `null`\>

Promise with file handles or null if not supported
