[**@fgv/ts-json-base**](../../../../README.md)

***

[@fgv/ts-json-base](../../../../README.md) / [JsonFile](../README.md) / readJsonFileSync

# Function: readJsonFileSync()

> **readJsonFileSync**(`srcPath`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonValue`](../../../../type-aliases/JsonValue.md)\>

Read type-safe JSON from a file.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `srcPath` | `string` | Path of the file to read |

## Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonValue`](../../../../type-aliases/JsonValue.md)\>

`Success` with a [JsonValue](../../../../type-aliases/JsonValue.md) or `Failure`
with a message if an error occurs.
