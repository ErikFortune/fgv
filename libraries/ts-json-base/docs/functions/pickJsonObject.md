[**@fgv/ts-json-base**](../README.md)

***

[@fgv/ts-json-base](../README.md) / pickJsonObject

# Function: pickJsonObject()

> **pickJsonObject**(`src`, `path`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonObject`](../interfaces/JsonObject.md)\>

Picks a nested [JsonObject](../interfaces/JsonObject.md) from a supplied
[JsonObject](../interfaces/JsonObject.md).

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `src` | [`JsonObject`](../interfaces/JsonObject.md) | The [object](../interfaces/JsonObject.md) from which the field is to be picked. |
| `path` | `string` | Dot-separated path of the member to be picked. |

## Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonObject`](../interfaces/JsonObject.md)\>

`Success` with the property if the path is valid and the value
is an object. Returns `Failure` with details if an error occurs.
