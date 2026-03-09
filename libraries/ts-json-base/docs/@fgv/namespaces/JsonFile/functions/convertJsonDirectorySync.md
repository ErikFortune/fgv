[**@fgv/ts-json-base**](../../../../README.md)

***

[@fgv/ts-json-base](../../../../README.md) / [JsonFile](../README.md) / convertJsonDirectorySync

# Function: convertJsonDirectorySync()

> **convertJsonDirectorySync**\<`T`, `TC`\>(`srcPath`, `options`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IReadDirectoryItem`](../interfaces/IReadDirectoryItem.md)\<`T`\>[]\>

Reads all JSON files from a directory and apply a supplied converter.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | - |
| `TC` | `unknown` |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `srcPath` | `string` | The path of the folder to be read. |
| `options` | [`IJsonFsDirectoryOptions`](../interfaces/IJsonFsDirectoryOptions.md)\<`T`, `TC`\> | [Options](../interfaces/IJsonFsDirectoryOptions.md) to control conversion and filtering |

## Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IReadDirectoryItem`](../interfaces/IReadDirectoryItem.md)\<`T`\>[]\>
