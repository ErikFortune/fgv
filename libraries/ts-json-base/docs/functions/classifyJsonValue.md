[**@fgv/ts-json-base**](../README.md)

***

[@fgv/ts-json-base](../README.md) / classifyJsonValue

# Function: classifyJsonValue()

> **classifyJsonValue**(`from`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonValueType`](../type-aliases/JsonValueType.md)\>

Identifies whether some `unknown` value is a [primitive](../type-aliases/JsonPrimitive.md),
[object](../interfaces/JsonObject.md) or [array](../interfaces/JsonArray.md). Fails for any value
that cannot be converted to JSON (e.g. a function) _but_ this is a shallow test -
it does not test the properties of an object or elements in an array.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `from` | `unknown` | The `unknown` value to be tested |

## Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonValueType`](../type-aliases/JsonValueType.md)\>
