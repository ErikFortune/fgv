[**@fgv/ts-utils**](../../../../README.md)

***

[@fgv/ts-utils](../../../../README.md) / [Collections](../README.md) / ConvertingResultMap

# Class: ConvertingResultMap\<TK, TSRC, TTARGET, TSRCMAP\>

A result map that wraps an inner [IResultMap](../interfaces/IResultMap.md) of source type
and returns lazily-converted, cached values of a target type. Exposes the inner map
via a [source](CacheInvalidatingResultMapWrapper.md) property that
invalidates cache entries when mutations occur.

## Extends

- [`ReadOnlyConvertingResultMap`](ReadOnlyConvertingResultMap.md)\<`TK`, `TSRC`, `TTARGET`\>

## Extended by

- [`ValidatingConvertingResultMap`](ValidatingConvertingResultMap.md)

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TK` *extends* `string` | - |
| `TSRC` | - |
| `TTARGET` | - |
| `TSRCMAP` *extends* [`IResultMap`](../interfaces/IResultMap.md)\<`TK`, `TSRC`\> | [`IResultMap`](../interfaces/IResultMap.md)\<`TK`, `TSRC`\> |

## Constructors

### Constructor

> **new ConvertingResultMap**\<`TK`, `TSRC`, `TTARGET`, `TSRCMAP`\>(`params`): `ConvertingResultMap`\<`TK`, `TSRC`, `TTARGET`, `TSRCMAP`\>

Constructs a new ConvertingResultMap.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params` | [`IConvertingResultMapConstructorParams`](../interfaces/IConvertingResultMapConstructorParams.md)\<`TK`, `TSRC`, `TTARGET`, `TSRCMAP`\> | Parameters for constructing the map. |

#### Returns

`ConvertingResultMap`\<`TK`, `TSRC`, `TTARGET`, `TSRCMAP`\>

#### Overrides

[`ReadOnlyConvertingResultMap`](ReadOnlyConvertingResultMap.md).[`constructor`](ReadOnlyConvertingResultMap.md#constructor)

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="_cache"></a> `_cache` | `readonly` | `Map`\<`TK`, `TTARGET`\> | Cache of converted target values. |
| <a id="_converter"></a> `_converter` | `readonly` | [`ConvertingResultMapValueConverter`](../type-aliases/ConvertingResultMapValueConverter.md)\<`TK`, `TSRC`, `TTARGET`\> | The converter function to transform source values to target values. |
| <a id="_inner"></a> `_inner` | `readonly` | [`IReadOnlyResultMap`](../interfaces/IReadOnlyResultMap.md)\<`TK`, `TSRC`\> | The inner map containing source values. |
| <a id="_logger"></a> `_logger?` | `readonly` | [`ILogger`](../../Logging/interfaces/ILogger.md) | Optional logger for warnings. |
| <a id="_onconversionerror"></a> `_onConversionError` | `readonly` | [`ConversionErrorHandling`](../type-aliases/ConversionErrorHandling.md) | Error handling behavior for conversion failures during iteration. |
| <a id="_typedinner"></a> `_typedInner` | `readonly` | `TSRCMAP` | The inner map, typed as the specific source map type. |
| <a id="source"></a> `source` | `readonly` | [`CacheInvalidatingResultMapWrapper`](CacheInvalidatingResultMapWrapper.md)\<`TK`, `TSRC`, `TTARGET`, `TSRCMAP`\> | A wrapper around the inner map that invalidates cache entries when mutations occur. Use this property to add, update, or delete source values. |

## Accessors

### size

#### Get Signature

> **get** **size**(): `number`

The number of entries in the map.

##### Returns

`number`

Returns the number of entries in the map.

#### Inherited from

[`ReadOnlyConvertingResultMap`](ReadOnlyConvertingResultMap.md).[`size`](ReadOnlyConvertingResultMap.md#size)

## Methods

### \_convertAndCache()

> `protected` **\_convertAndCache**(`key`, `src`): [`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<`TTARGET`, [`ResultMapResultDetail`](../type-aliases/ResultMapResultDetail.md)\>

Converts a source value to a target value and caches the result.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `TK` | The key of the value. |
| `src` | `TSRC` | The source value to convert. |

#### Returns

[`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<`TTARGET`, [`ResultMapResultDetail`](../type-aliases/ResultMapResultDetail.md)\>

`Success` with the converted value if successful, `Failure` otherwise.

#### Inherited from

[`ReadOnlyConvertingResultMap`](ReadOnlyConvertingResultMap.md).[`_convertAndCache`](ReadOnlyConvertingResultMap.md#_convertandcache)

***

### \_getOrConvert()

> `protected` **\_getOrConvert**(`key`, `src`): `TTARGET` \| `undefined`

Gets a cached value or converts and caches a source value.
Used by iterators. Handles conversion failures according to `_onConversionError`.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `TK` | The key of the value. |
| `src` | `TSRC` | The source value to convert if not cached. |

#### Returns

`TTARGET` \| `undefined`

The converted value, or `undefined` if conversion failed.

#### Throws

Error if `_onConversionError` is `'fail'` and conversion fails.

#### Inherited from

[`ReadOnlyConvertingResultMap`](ReadOnlyConvertingResultMap.md).[`_getOrConvert`](ReadOnlyConvertingResultMap.md#_getorconvert)

***

### \[iterator\]()

> **\[iterator\]**(): `IterableIterator`\<[`KeyValueEntry`](../type-aliases/KeyValueEntry.md)\<`TK`, `TTARGET`\>\>

Gets an iterator over the map entries.

#### Returns

`IterableIterator`\<[`KeyValueEntry`](../type-aliases/KeyValueEntry.md)\<`TK`, `TTARGET`\>\>

An iterator over the map entries.

#### Inherited from

[`ReadOnlyConvertingResultMap`](ReadOnlyConvertingResultMap.md).[`[iterator]`](ReadOnlyConvertingResultMap.md#iterator)

***

### entries()

> **entries**(): `IterableIterator`\<[`KeyValueEntry`](../type-aliases/KeyValueEntry.md)\<`TK`, `TTARGET`\>\>

Returns an iterator over the map entries with converted values.

#### Returns

`IterableIterator`\<[`KeyValueEntry`](../type-aliases/KeyValueEntry.md)\<`TK`, `TTARGET`\>\>

An iterator over the map entries.

#### Inherited from

[`ReadOnlyConvertingResultMap`](ReadOnlyConvertingResultMap.md).[`entries`](ReadOnlyConvertingResultMap.md#entries)

***

### forEach()

> **forEach**(`cb`, `thisArg?`): `void`

Calls a callback for each entry in the map with converted values.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `cb` | [`ResultMapForEachCb`](../type-aliases/ResultMapForEachCb.md)\<`TK`, `TTARGET`\> | The callback to call for each entry. |
| `thisArg?` | `unknown` | Optional `this` argument for the callback. |

#### Returns

`void`

#### Inherited from

[`ReadOnlyConvertingResultMap`](ReadOnlyConvertingResultMap.md).[`forEach`](ReadOnlyConvertingResultMap.md#foreach)

***

### get()

> **get**(`key`): [`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<`TTARGET`, [`ResultMapResultDetail`](../type-aliases/ResultMapResultDetail.md)\>

Gets a converted value from the map by key.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `TK` | The key to retrieve. |

#### Returns

[`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<`TTARGET`, [`ResultMapResultDetail`](../type-aliases/ResultMapResultDetail.md)\>

`Success` with the converted value and detail `exists` if the key was found,
`Failure` with detail `not-found` if the key was not found, or `Failure` with
detail `invalid-value` if conversion failed.

#### Inherited from

[`ReadOnlyConvertingResultMap`](ReadOnlyConvertingResultMap.md).[`get`](ReadOnlyConvertingResultMap.md#get)

***

### has()

> **has**(`key`): `boolean`

Checks if the map contains a key.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `TK` | The key to check. |

#### Returns

`boolean`

`true` if the key exists, `false` otherwise.

#### Inherited from

[`ReadOnlyConvertingResultMap`](ReadOnlyConvertingResultMap.md).[`has`](ReadOnlyConvertingResultMap.md#has)

***

### keys()

> **keys**(): `IterableIterator`\<`TK`\>

Returns an iterator over the map keys.

#### Returns

`IterableIterator`\<`TK`\>

An iterator over the map keys.

#### Inherited from

[`ReadOnlyConvertingResultMap`](ReadOnlyConvertingResultMap.md).[`keys`](ReadOnlyConvertingResultMap.md#keys)

***

### toReadOnly()

> **toReadOnly**(): [`IReadOnlyResultMap`](../interfaces/IReadOnlyResultMap.md)\<`TK`, `TTARGET`\>

Gets a read-only version of this map.

#### Returns

[`IReadOnlyResultMap`](../interfaces/IReadOnlyResultMap.md)\<`TK`, `TTARGET`\>

A read-only version of this map.

#### Inherited from

[`ReadOnlyConvertingResultMap`](ReadOnlyConvertingResultMap.md).[`toReadOnly`](ReadOnlyConvertingResultMap.md#toreadonly)

***

### values()

> **values**(): `IterableIterator`\<`TTARGET`\>

Returns an iterator over the converted map values.

#### Returns

`IterableIterator`\<`TTARGET`\>

An iterator over the map values.

#### Inherited from

[`ReadOnlyConvertingResultMap`](ReadOnlyConvertingResultMap.md).[`values`](ReadOnlyConvertingResultMap.md#values)

***

### create()

> `static` **create**\<`TK`, `TSRC`, `TTARGET`, `TSRCMAP`\>(`params`): [`Result`](../../../../type-aliases/Result.md)\<`ConvertingResultMap`\<`TK`, `TSRC`, `TTARGET`, `TSRCMAP`\>\>

Creates a new ConvertingResultMap.

#### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TK` *extends* `string` | - |
| `TSRC` | - |
| `TTARGET` | - |
| `TSRCMAP` *extends* [`IResultMap`](../interfaces/IResultMap.md)\<`TK`, `TSRC`\> | [`IResultMap`](../interfaces/IResultMap.md)\<`TK`, `TSRC`\> |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params` | [`IConvertingResultMapConstructorParams`](../interfaces/IConvertingResultMapConstructorParams.md)\<`TK`, `TSRC`, `TTARGET`, `TSRCMAP`\> | Parameters for constructing the map. |

#### Returns

[`Result`](../../../../type-aliases/Result.md)\<`ConvertingResultMap`\<`TK`, `TSRC`, `TTARGET`, `TSRCMAP`\>\>

`Success` with the new map, or `Failure` with error details if an error occurred.

#### Overrides

[`ReadOnlyConvertingResultMap`](ReadOnlyConvertingResultMap.md).[`create`](ReadOnlyConvertingResultMap.md#create)
