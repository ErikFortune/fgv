[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-json-base](../README.md) / pickJsonObject

# Function: pickJsonObject()

> **pickJsonObject**(`src`, `path`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`JsonObject`](../interfaces/JsonObject.md)\>

Picks a nested [JsonObject](../interfaces/JsonObject.md) from a supplied
[JsonObject](../interfaces/JsonObject.md).

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `src` | [`JsonObject`](../interfaces/JsonObject.md) | The [object](../interfaces/JsonObject.md) from which the field is to be picked. |
| `path` | `string` | Dot-separated path of the member to be picked. |

## Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`JsonObject`](../interfaces/JsonObject.md)\>

`Success` with the property if the path is valid and the value
is an object. Returns `Failure` with details if an error occurs.
