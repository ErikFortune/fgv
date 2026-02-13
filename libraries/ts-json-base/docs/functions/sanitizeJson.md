[**@fgv/ts-json-base**](../README.md)

***

[@fgv/ts-json-base](../README.md) / sanitizeJson

# Function: sanitizeJson()

> **sanitizeJson**(`from`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonValue`](../type-aliases/JsonValue.md)\>

"Sanitizes" an `unknown` by stringifying and then parsing it.  Guarantees a
valid [JsonValue](../type-aliases/JsonValue.md) but is not idempotent and gives no guarantees
about fidelity. Fails if the supplied value cannot be stringified as Json.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `from` | `unknown` | The `unknown` to be sanitized. |

## Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonValue`](../type-aliases/JsonValue.md)\>

`Success` with a [JsonValue](../type-aliases/JsonValue.md) if conversion succeeds,
`Failure` with details if an error occurs.
