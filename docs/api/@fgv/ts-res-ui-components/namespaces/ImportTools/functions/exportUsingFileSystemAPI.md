[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res-ui-components](../../../README.md) / [ImportTools](../README.md) / exportUsingFileSystemAPI

# Function: exportUsingFileSystemAPI()

> **exportUsingFileSystemAPI**(`data`, `suggestedName`, `description?`, `window?`): `Promise`\<`boolean`\>

Export data using File System Access API with fallback to blob download.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `data` | `unknown` | Data to export as JSON |
| `suggestedName` | `string` | Suggested filename for the save dialog |
| `description?` | `string` | Description for file type filter (default: 'JSON files') |
| `window?` | `Window` | Window object for API access (default: globalThis.window) |

## Returns

`Promise`\<`boolean`\>

Promise resolving to true if saved via File System Access API, false if fallback used
