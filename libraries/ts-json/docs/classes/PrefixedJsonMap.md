[**@fgv/ts-json**](../README.md)

***

[@fgv/ts-json](../README.md) / PrefixedJsonMap

# Class: PrefixedJsonMap

A PrefixedJsonMap enforces a supplied prefix for all contained values,
optionally adding the prefix as necessary (default `true`).

## Extends

- [`SimpleJsonMap`](SimpleJsonMap.md)

## Constructors

### Constructor

> `protected` **new PrefixedJsonMap**(`values?`, `context?`, `options?`): `PrefixedJsonMap`

Constructs a new PrefixedJsonMap from the supplied values

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `values?` | [`MapOrRecord`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json/docs)\<[`JsonValue`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\> | A string-keyed Map or Record of the `JsonValue` to be returned |
| `context?` | [`IJsonContext`](../interfaces/IJsonContext.md) | Optional [JSON Context](../interfaces/IJsonContext.md) used to format returned values |
| `options?` | [`ISimpleJsonMapOptions`](../interfaces/ISimpleJsonMapOptions.md) | - |

#### Returns

`PrefixedJsonMap`

#### Overrides

[`SimpleJsonMap`](SimpleJsonMap.md).[`constructor`](SimpleJsonMap.md#constructor)

## Methods

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

[`SimpleJsonMap`](SimpleJsonMap.md).[`getJsonObject`](SimpleJsonMap.md#getjsonobject)

***

### getJsonValue()

> **getJsonValue**(`key`, `context?`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonValue`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs), [`JsonReferenceMapFailureReason`](../type-aliases/JsonReferenceMapFailureReason.md)\>

Gets a `JsonValue` specified by key.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `string` | key of the value to be retrieved |
| `context?` | [`IJsonContext`](../interfaces/IJsonContext.md) | Optional [JSON context](../interfaces/IJsonContext.md) used to format the value |

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonValue`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs), [`JsonReferenceMapFailureReason`](../type-aliases/JsonReferenceMapFailureReason.md)\>

Success with the formatted object if successful. Failure with detail 'unknown'
if no such object exists, or failure with detail 'error' if the object was found but
could not be formatted.

#### Inherited from

[`SimpleJsonMap`](SimpleJsonMap.md).[`getJsonValue`](SimpleJsonMap.md#getjsonvalue)

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

[`SimpleJsonMap`](SimpleJsonMap.md).[`has`](SimpleJsonMap.md#has)

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

[`SimpleJsonMap`](SimpleJsonMap.md).[`keyIsInRange`](SimpleJsonMap.md#keyisinrange)

***

### createPrefixed()

#### Call Signature

> `static` **createPrefixed**(`prefix`, `values?`, `context?`, `editor?`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`PrefixedJsonMap`\>

Creates a new PrefixedJsonMap from the supplied values

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `prefix` | `string` | A string prefix to be enforced for and added to key names as necessary |
| `values?` | [`MapOrRecord`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json/docs)\<[`JsonValue`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\> | A string-keyed Map or Record of the `JsonValue` to be returned |
| `context?` | [`IJsonContext`](../interfaces/IJsonContext.md) | Optional [JSON Context](../interfaces/IJsonContext.md) used to format returned values |
| `editor?` | [`JsonEditor`](JsonEditor.md) | Optional [JsonEditor](JsonEditor.md) used to format returned values |

##### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`PrefixedJsonMap`\>

`Success` with a PrefixedJsonMap or `Failure` with a message
if an error occurs.

#### Call Signature

> `static` **createPrefixed**(`prefixOptions`, `values?`, `context?`, `editor?`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`PrefixedJsonMap`\>

Creates a new PrefixedJsonMap from the supplied values

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `prefixOptions` | [`IKeyPrefixOptions`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json/docs) | A KeyPrefixOptions indicating the prefix to enforce and whether that prefix should be added automatically if necessary (default true) |
| `values?` | [`MapOrRecord`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json/docs)\<[`JsonValue`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\> | A string-keyed Map or record of the `JsonValue` to be returned |
| `context?` | [`IJsonContext`](../interfaces/IJsonContext.md) | Optional [JSON Context](../interfaces/IJsonContext.md) used to format returned values |
| `editor?` | [`JsonEditor`](JsonEditor.md) | Optional [JsonEditor](JsonEditor.md) used to format returned values |

##### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`PrefixedJsonMap`\>

***

### createSimple()

> `static` **createSimple**(`values?`, `context?`, `options?`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`SimpleJsonMap`](SimpleJsonMap.md)\>

Creates a new [SimpleJsonMap](SimpleJsonMap.md) from the supplied objects

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `values?` | [`MapOrRecord`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json/docs)\<[`JsonValue`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\> | A string-keyed `Map` or `Record` of the `JsonValue` to be returned. |
| `context?` | [`IJsonContext`](../interfaces/IJsonContext.md) | Optional [IJsonContext](../interfaces/IJsonContext.md) used to format returned values. |
| `options?` | [`ISimpleJsonMapOptions`](../interfaces/ISimpleJsonMapOptions.md) | Optional [ISimpleJsonMapOptions](../interfaces/ISimpleJsonMapOptions.md) for initialization. |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`SimpleJsonMap`](SimpleJsonMap.md)\>

`Success` with a [SimpleJsonMap](SimpleJsonMap.md) or `Failure` with a message if
an error occurs.

#### Inherited from

[`SimpleJsonMap`](SimpleJsonMap.md).[`createSimple`](SimpleJsonMap.md#createsimple)
