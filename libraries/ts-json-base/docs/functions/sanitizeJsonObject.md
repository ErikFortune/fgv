[**@fgv/ts-json-base**](../README.md)

***

[@fgv/ts-json-base](../README.md) / sanitizeJsonObject

# Function: sanitizeJsonObject()

> **sanitizeJsonObject**\<`T`\>(`from`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`\>

Sanitizes some value using JSON stringification and parsing, returning an
returning a matching strongly-typed value.

## Type Parameters

| Type Parameter |
| ------ |
| `T` |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `from` | `T` | The value to be sanitized. |

## Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`\>

`Success` with a [JsonObject](../interfaces/JsonObject.md) if conversion succeeds,
`Failure` with details if an error occurs.
