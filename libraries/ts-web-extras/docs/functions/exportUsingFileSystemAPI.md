[**@fgv/ts-web-extras**](../README.md)

***

[@fgv/ts-web-extras](../README.md) / exportUsingFileSystemAPI

# Function: exportUsingFileSystemAPI()

> **exportUsingFileSystemAPI**(`data`, `suggestedName`, `description`, `window`): `Promise`\<`boolean`\>

Export data using File System Access API with fallback to blob download.

## Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `data` | `unknown` | `undefined` | Data to export as JSON |
| `suggestedName` | `string` | `undefined` | Suggested filename for the save dialog |
| `description` | `string` | `'JSON files'` | Description for file type filter (default: 'JSON files') |
| `window` | `Window` | `globalThis.window` | Window object for API access (default: globalThis.window) |

## Returns

`Promise`\<`boolean`\>

Promise resolving to true if saved via File System Access API, false if fallback used
