[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-json](../README.md) / SimpleJsonMap

# Class: SimpleJsonMap

A SimpleJsonMap  presents a view of a simple map
of JSON values.

## Extends

- [`SimpleJsonMapBase`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json/docs)\<[`JsonValue`](../../ts-res-ui-components/type-aliases/JsonValue.md)\>

## Extended by

- [`PrefixedJsonMap`](PrefixedJsonMap.md)

## Constructors

### Constructor

> `protected` **new SimpleJsonMap**(`values?`, `context?`, `options?`): `SimpleJsonMap`

Constructs a new SimpleJsonMap from the supplied objects

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `values?` | [`MapOrRecord`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json/docs)\<[`JsonValue`](../../ts-res-ui-components/type-aliases/JsonValue.md)\> | A string-keyed `Map` or `Record` of the `JsonValue` to be returned. |
| `context?` | [`IJsonContext`](../interfaces/IJsonContext.md) | Optional [IJsonContext](../interfaces/IJsonContext.md) used to format returned values. |
| `options?` | [`ISimpleJsonMapOptions`](../interfaces/ISimpleJsonMapOptions.md) | Optional [ISimpleJsonMapOptions](../interfaces/ISimpleJsonMapOptions.md) for initialization. |

#### Returns

`SimpleJsonMap`

#### Overrides

`SimpleJsonMapBase<JsonValue>.constructor`

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="_context"></a> `_context?` | `readonly` | [`IJsonContext`](../interfaces/IJsonContext.md) | **`Internal`** An optional [IJsonContext](../interfaces/IJsonContext.md) used for any conversions involving items in this map. |
| <a id="_editor"></a> `_editor?` | `protected` | [`JsonEditor`](JsonEditor.md) | **`Internal`** |
| <a id="_keypolicy"></a> `_keyPolicy` | `readonly` | [`ReferenceMapKeyPolicy`](ReferenceMapKeyPolicy.md)\<[`JsonValue`](../../ts-res-ui-components/type-aliases/JsonValue.md)\> | **`Internal`** The [key policy](ReferenceMapKeyPolicy.md) in effect for this map. |
| <a id="_values"></a> `_values` | `readonly` | `Map`\<`string`, [`JsonValue`](../../ts-res-ui-components/type-aliases/JsonValue.md)\> | **`Internal`** A map containing keys and values already present in this map. |

## Methods

### \_clone()

> `protected` **\_clone**(`value`, `context?`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonValue`](../../ts-res-ui-components/type-aliases/JsonValue.md), [`JsonReferenceMapFailureReason`](../type-aliases/JsonReferenceMapFailureReason.md)\>

**`Internal`**

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | [`JsonValue`](../../ts-res-ui-components/type-aliases/JsonValue.md) |
| `context?` | [`IJsonContext`](../interfaces/IJsonContext.md) |

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonValue`](../../ts-res-ui-components/type-aliases/JsonValue.md), [`JsonReferenceMapFailureReason`](../type-aliases/JsonReferenceMapFailureReason.md)\>

***

### getJsonObject()

> **getJsonObject**(`key`, `context?`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs), [`JsonReferenceMapFailureReason`](../type-aliases/JsonReferenceMapFailureReason.md)\>

Gets a `JsonObject` specified by key.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `string` | key of the object to be retrieved |
| `context?` | [`IJsonContext`](../interfaces/IJsonContext.md) | optional [JSON context](../interfaces/IJsonContext.md) used to format the returned object. |

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs), [`JsonReferenceMapFailureReason`](../type-aliases/JsonReferenceMapFailureReason.md)\>

ts-utils#Success \| \`Success\` with the formatted object if successful.
ts-utils#Failure \| \`Failure\` with detail 'unknown' if no such object exists,
or ts-utils#Failure \| \`Failure\` with detail 'error' if the object was found
but could not be formatted.

#### Inherited from

`SimpleJsonMapBase.getJsonObject`

***

### getJsonValue()

> **getJsonValue**(`key`, `context?`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonValue`](../../ts-res-ui-components/type-aliases/JsonValue.md), [`JsonReferenceMapFailureReason`](../type-aliases/JsonReferenceMapFailureReason.md)\>

Gets a `JsonValue` specified by key.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `string` | key of the value to be retrieved |
| `context?` | [`IJsonContext`](../interfaces/IJsonContext.md) | Optional [JSON context](../interfaces/IJsonContext.md) used to format the value |

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonValue`](../../ts-res-ui-components/type-aliases/JsonValue.md), [`JsonReferenceMapFailureReason`](../type-aliases/JsonReferenceMapFailureReason.md)\>

Success with the formatted object if successful. Failure with detail 'unknown'
if no such object exists, or failure with detail 'error' if the object was found but
could not be formatted.

#### Overrides

`SimpleJsonMapBase.getJsonValue`

***

### has()

> **has**(`key`): `boolean`

Determines if an entry with the specified key actually exists in the map.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `string` | key to be tested |

#### Returns

`boolean`

`true` if an object with the specified key exists, `false` otherwise.

#### Inherited from

`SimpleJsonMapBase.has`

***

### keyIsInRange()

> **keyIsInRange**(`key`): `boolean`

Determine if a key might be valid for this map but does not determine if key actually
exists. Allows key range to be constrained.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `string` | key to be tested |

#### Returns

`boolean`

`true` if the key is in the valid range, `false` otherwise.

#### Inherited from

`SimpleJsonMapBase.keyIsInRange`

***

### \_toMap()

> `protected` `static` **\_toMap**\<`T`\>(`values?`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`Map`\<`string`, `T`\>\>

**`Internal`**

Returns a `Map\<string, T\>` derived from a supplied [MapOrRecord](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json/docs)

#### Type Parameters

| Type Parameter |
| ------ |
| `T` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `values?` | [`MapOrRecord`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json/docs)\<`T`\> | The [MapOrRecord](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json/docs) to be returned as a map. |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`Map`\<`string`, `T`\>\>

`Success` with the corresponding `Map\<string, T\>` or `Failure` with a
message if an error occurs.

#### Inherited from

`SimpleJsonMapBase._toMap`

***

### createSimple()

> `static` **createSimple**(`values?`, `context?`, `options?`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`SimpleJsonMap`\>

Creates a new SimpleJsonMap from the supplied objects

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `values?` | [`MapOrRecord`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json/docs)\<[`JsonValue`](../../ts-res-ui-components/type-aliases/JsonValue.md)\> | A string-keyed `Map` or `Record` of the `JsonValue` to be returned. |
| `context?` | [`IJsonContext`](../interfaces/IJsonContext.md) | Optional [IJsonContext](../interfaces/IJsonContext.md) used to format returned values. |
| `options?` | [`ISimpleJsonMapOptions`](../interfaces/ISimpleJsonMapOptions.md) | Optional [ISimpleJsonMapOptions](../interfaces/ISimpleJsonMapOptions.md) for initialization. |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`SimpleJsonMap`\>

`Success` with a SimpleJsonMap or `Failure` with a message if
an error occurs.
