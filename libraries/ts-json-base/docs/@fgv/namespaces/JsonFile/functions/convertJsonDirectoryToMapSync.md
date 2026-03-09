[**@fgv/ts-json-base**](../../../../README.md)

***

[@fgv/ts-json-base](../../../../README.md) / [JsonFile](../README.md) / convertJsonDirectoryToMapSync

# Function: convertJsonDirectoryToMapSync()

> **convertJsonDirectoryToMapSync**\<`T`, `TC`\>(`srcPath`, `options`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`Map`\<`string`, `T`\>\>

Reads and converts all JSON files from a directory, returning a
`Map<string, T>` indexed by file base name (i.e. minus the extension)
with an optional name transformation applied if present.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | - |
| `TC` | `unknown` |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `srcPath` | `string` | The path of the folder to be read. |
| `options` | [`IJsonFsDirectoryToMapOptions`](../interfaces/IJsonFsDirectoryToMapOptions.md)\<`T`, `TC`\> | [Options](../interfaces/IJsonFsDirectoryToMapOptions.md) to control conversion, filtering and naming. |

## Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`Map`\<`string`, `T`\>\>
