[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-json](../README.md) / CompositeJsonMap

# Class: CompositeJsonMap

A CompositeJsonMap presents a composed view of one or more other
[JSON reference maps](../interfaces/IJsonReferenceMap.md).

## Implements

- [`IJsonReferenceMap`](../interfaces/IJsonReferenceMap.md)

## Constructors

### Constructor

> `protected` **new CompositeJsonMap**(`maps`): `CompositeJsonMap`

**`Internal`**

The [reference maps](../interfaces/IJsonReferenceMap.md) from which this map is to be composed.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `maps` | [`IJsonReferenceMap`](../interfaces/IJsonReferenceMap.md)[] | An array o [IJsonReferenceMap](../interfaces/IJsonReferenceMap.md) containing the maps from which this map is to be composed. |

#### Returns

`CompositeJsonMap`

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="_maps"></a> `_maps` | `protected` | [`IJsonReferenceMap`](../interfaces/IJsonReferenceMap.md)[] | **`Internal`** The [reference maps](../interfaces/IJsonReferenceMap.md) from which this map is composed. |

## Methods

### getJsonObject()

> **getJsonObject**(`key`, `context?`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs), [`JsonReferenceMapFailureReason`](../type-aliases/JsonReferenceMapFailureReason.md)\>

Gets a JSON object specified by key.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `string` | The key of the object to be retrieved. |
| `context?` | [`IJsonContext`](../interfaces/IJsonContext.md) | An optional [JSON Context](../interfaces/IJsonContext.md) used to format the object. |

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs), [`JsonReferenceMapFailureReason`](../type-aliases/JsonReferenceMapFailureReason.md)\>

`Success` with the formatted object if successful. `Failure` with detail `'unknown'`
if no such object exists, or `Failure` with detail `'error'` if the object was found but
could not be formatted.

#### Implementation of

[`IJsonReferenceMap`](../interfaces/IJsonReferenceMap.md).[`getJsonObject`](../interfaces/IJsonReferenceMap.md#getjsonobject)

***

### getJsonValue()

> **getJsonValue**(`key`, `context?`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonValue`](../../ts-res-ui-components/type-aliases/JsonValue.md), [`JsonReferenceMapFailureReason`](../type-aliases/JsonReferenceMapFailureReason.md)\>

Gets a JSON value specified by key.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `string` | The key of the object to be retrieved. |
| `context?` | [`IJsonContext`](../interfaces/IJsonContext.md) | An optional [JSON Context](../interfaces/IJsonContext.md) used to format the value. |

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonValue`](../../ts-res-ui-components/type-aliases/JsonValue.md), [`JsonReferenceMapFailureReason`](../type-aliases/JsonReferenceMapFailureReason.md)\>

`Success` with the formatted object if successful. `Failure` with detail `'unknown'`
if no such object exists, or failure with detail `'error'` if the object was found but
could not be formatted.

#### Implementation of

[`IJsonReferenceMap`](../interfaces/IJsonReferenceMap.md).[`getJsonValue`](../interfaces/IJsonReferenceMap.md#getjsonvalue)

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

#### Implementation of

[`IJsonReferenceMap`](../interfaces/IJsonReferenceMap.md).[`has`](../interfaces/IJsonReferenceMap.md#has)

***

### keyIsInRange()

> **keyIsInRange**(`key`): `boolean`

Determine if a key might be valid for this map but does not determine
if key actually exists. Allows key range to be constrained.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `string` | The key to be tested. |

#### Returns

`boolean`

`true` if the key is in the valid range, `false` otherwise.

#### Implementation of

[`IJsonReferenceMap`](../interfaces/IJsonReferenceMap.md).[`keyIsInRange`](../interfaces/IJsonReferenceMap.md#keyisinrange)

***

### create()

> `static` **create**(`maps`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`CompositeJsonMap`\>

Creates a new CompositeJsonMap from supplied
[maps](../interfaces/IJsonReferenceMap.md).

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `maps` | [`IJsonReferenceMap`](../interfaces/IJsonReferenceMap.md)[] | one or more [object maps](../interfaces/IJsonReferenceMap.md) to be composed. |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`CompositeJsonMap`\>
