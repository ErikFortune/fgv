[**@fgv/ts-json-base**](../README.md)

***

[@fgv/ts-json-base](../README.md) / pickJsonValue

# Function: pickJsonValue()

> **pickJsonValue**(`src`, `path`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonValue`](../type-aliases/JsonValue.md)\>

Picks a nested field from a supplied [JsonObject](../interfaces/JsonObject.md).

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `src` | [`JsonObject`](../interfaces/JsonObject.md) | The [object](../interfaces/JsonObject.md) from which the field is to be picked. |
| `path` | `string` | Dot-separated path of the member to be picked. |

## Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonValue`](../type-aliases/JsonValue.md)\>

`Success` with the property if the path is valid, `Failure`
with an error message otherwise.
