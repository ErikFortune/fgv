[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-json-base](../../../README.md) / [JsonFile](../README.md) / readJsonFileSync

# Function: readJsonFileSync()

> **readJsonFileSync**(`srcPath`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`JsonValue`](../../../type-aliases/JsonValue.md)\>

Read type-safe JSON from a file.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `srcPath` | `string` | Path of the file to read |

## Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`JsonValue`](../../../type-aliases/JsonValue.md)\>

`Success` with a [JsonValue](../../../type-aliases/JsonValue.md) or `Failure`
with a message if an error occurs.
