[**@fgv/ts-json-base**](../README.md)

***

[@fgv/ts-json-base](../README.md) / isJsonObject

# Function: isJsonObject()

> **isJsonObject**(`from`): `from is JsonObject`

Test if an `unknown` is potentially a [JsonObject](../interfaces/JsonObject.md).

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `from` | `unknown` | The `unknown` to be tested. |

## Returns

`from is JsonObject`

`true` if the supplied parameter is a non-array, non-special object
with no symbol keys, `false` otherwise.
