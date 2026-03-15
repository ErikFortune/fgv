[**@fgv/ts-web-extras**](../README.md)

***

[@fgv/ts-web-extras](../README.md) / safeShowDirectoryPicker

# Function: safeShowDirectoryPicker()

> **safeShowDirectoryPicker**(`window`, `options?`): `Promise`\<[`FileSystemDirectoryHandle`](../interfaces/FileSystemDirectoryHandle.md) \| `null`\>

Safely access showDirectoryPicker with proper type checking

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `window` | `Window` | The window object |
| `options?` | [`ShowDirectoryPickerOptions`](../interfaces/ShowDirectoryPickerOptions.md) | Options for the directory picker |

## Returns

`Promise`\<[`FileSystemDirectoryHandle`](../interfaces/FileSystemDirectoryHandle.md) \| `null`\>

Promise with directory handle or null if not supported
