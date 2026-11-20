[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-json](../README.md) / IJsonReferenceMap

# Interface: IJsonReferenceMap

Interface for a simple map that returns named `JsonValue` values with templating,
conditional logic, and external reference lookups applied using an optionally supplied context.

## Methods

### getJsonObject()

> **getJsonObject**(`key`, `context?`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs), [`JsonReferenceMapFailureReason`](../type-aliases/JsonReferenceMapFailureReason.md)\>

Gets a `JsonObject` specified by key.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `string` | The key of the object to be retrieved. |
| `context?` | [`IJsonContext`](IJsonContext.md) | Optional [IJsonContext](IJsonContext.md) used to construct the object. |

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs), [`JsonReferenceMapFailureReason`](../type-aliases/JsonReferenceMapFailureReason.md)\>

`Success` with the formatted JsonObject if successful. `Failure`
with detail `'unknown'`  if no such object exists, or `Failure` with detail `'error'` if
the object was found but could not be formatted.

***

### getJsonValue()

> **getJsonValue**(`key`, `context?`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonValue`](../../ts-res-ui-components/type-aliases/JsonValue.md), [`JsonReferenceMapFailureReason`](../type-aliases/JsonReferenceMapFailureReason.md)\>

Gets a `JsonValue` specified by key.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `string` | The key of the object to be retrieved. |
| `context?` | [`IJsonContext`](IJsonContext.md) | Optional [JSON Context](IJsonContext.md) used to format the value |

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonValue`](../../ts-res-ui-components/type-aliases/JsonValue.md), [`JsonReferenceMapFailureReason`](../type-aliases/JsonReferenceMapFailureReason.md)\>

`Success` with the formatted `JsonValue` if successful. `Failure`
with detail `'unknown'` if no such object exists, or `Failure` with detail `'error'` if
the object was found but could not be formatted.

***

### has()

> **has**(`key`): `boolean`

Determines if an object with the specified key actually exists in the map.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `string` | The key to be tested. |

#### Returns

`boolean`

`true` if an object with the specified key exists, `false` otherwise.

***

### keyIsInRange()

> **keyIsInRange**(`key`): `boolean`

Determine if a key might be valid for this map but does not determine if key actually
exists. Allows key range to be constrained.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `string` | The key to be tested. |

#### Returns

`boolean`

`true` if the key is in the valid range, `false` otherwise.
