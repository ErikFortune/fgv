[**@fgv/ts-utils**](../../../../README.md)

***

[@fgv/ts-utils](../../../../README.md) / [Collections](../README.md) / ReadOnlyConvertingResultMap

# Class: ReadOnlyConvertingResultMap\<TK, TSRC, TTARGET\>

A read-only result map that wraps an inner [IReadOnlyResultMap](../interfaces/IReadOnlyResultMap.md)
of source type and returns lazily-converted, cached values of a target type.

## Extended by

- [`ConvertingResultMap`](ConvertingResultMap.md)
- [`ValidatingReadOnlyConvertingResultMap`](ValidatingReadOnlyConvertingResultMap.md)

## Type Parameters

| Type Parameter |
| ------ |
| `TK` *extends* `string` |
| `TSRC` |
| `TTARGET` |

## Implements

- [`IReadOnlyResultMap`](../interfaces/IReadOnlyResultMap.md)\<`TK`, `TTARGET`\>

## Constructors

### Constructor

> **new ReadOnlyConvertingResultMap**\<`TK`, `TSRC`, `TTARGET`\>(`params`): `ReadOnlyConvertingResultMap`\<`TK`, `TSRC`, `TTARGET`\>

Constructs a new ReadOnlyConvertingResultMap.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params` | [`IReadOnlyConvertingResultMapConstructorParams`](../interfaces/IReadOnlyConvertingResultMapConstructorParams.md)\<`TK`, `TSRC`, `TTARGET`\> | Parameters for constructing the map. |

#### Returns

`ReadOnlyConvertingResultMap`\<`TK`, `TSRC`, `TTARGET`\>

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="_cache"></a> `_cache` | `readonly` | `Map`\<`TK`, `TTARGET`\> | Cache of converted target values. |
| <a id="_converter"></a> `_converter` | `readonly` | [`ConvertingResultMapValueConverter`](../type-aliases/ConvertingResultMapValueConverter.md)\<`TK`, `TSRC`, `TTARGET`\> | The converter function to transform source values to target values. |
| <a id="_inner"></a> `_inner` | `readonly` | [`IReadOnlyResultMap`](../interfaces/IReadOnlyResultMap.md)\<`TK`, `TSRC`\> | The inner map containing source values. |
| <a id="_logger"></a> `_logger?` | `readonly` | [`ILogger`](../../Logging/interfaces/ILogger.md) | Optional logger for warnings. |
| <a id="_onconversionerror"></a> `_onConversionError` | `readonly` | [`ConversionErrorHandling`](../type-aliases/ConversionErrorHandling.md) | Error handling behavior for conversion failures during iteration. |

## Accessors

### size

#### Get Signature

> **get** **size**(): `number`

The number of entries in the map.

##### Returns

`number`

Returns the number of entries in the map.

#### Implementation of

[`IReadOnlyResultMap`](../interfaces/IReadOnlyResultMap.md).[`size`](../interfaces/IReadOnlyResultMap.md#size)

## Methods

### \_clearCache()

> `protected` **\_clearCache**(): `void`

Clears all entries from the cache.

#### Returns

`void`

***

### \_clearCacheEntry()

> `protected` **\_clearCacheEntry**(`key`): `void`

Clears a single entry from the cache.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `TK` | The key to clear from the cache. |

#### Returns

`void`

***

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

***

### \[iterator\]()

> **\[iterator\]**(): `IterableIterator`\<[`KeyValueEntry`](../type-aliases/KeyValueEntry.md)\<`TK`, `TTARGET`\>\>

Gets an iterator over the map entries.

#### Returns

`IterableIterator`\<[`KeyValueEntry`](../type-aliases/KeyValueEntry.md)\<`TK`, `TTARGET`\>\>

An iterator over the map entries.

#### Implementation of

[`IReadOnlyResultMap`](../interfaces/IReadOnlyResultMap.md).[`[iterator]`](../interfaces/IReadOnlyResultMap.md#iterator)

***

### entries()

> **entries**(): `IterableIterator`\<[`KeyValueEntry`](../type-aliases/KeyValueEntry.md)\<`TK`, `TTARGET`\>\>

Returns an iterator over the map entries with converted values.

#### Returns

`IterableIterator`\<[`KeyValueEntry`](../type-aliases/KeyValueEntry.md)\<`TK`, `TTARGET`\>\>

An iterator over the map entries.

#### Implementation of

[`IReadOnlyResultMap`](../interfaces/IReadOnlyResultMap.md).[`entries`](../interfaces/IReadOnlyResultMap.md#entries)

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

#### Implementation of

[`IReadOnlyResultMap`](../interfaces/IReadOnlyResultMap.md).[`forEach`](../interfaces/IReadOnlyResultMap.md#foreach)

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

#### Implementation of

[`IReadOnlyResultMap`](../interfaces/IReadOnlyResultMap.md).[`get`](../interfaces/IReadOnlyResultMap.md#get)

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

#### Implementation of

[`IReadOnlyResultMap`](../interfaces/IReadOnlyResultMap.md).[`has`](../interfaces/IReadOnlyResultMap.md#has)

***

### keys()

> **keys**(): `IterableIterator`\<`TK`\>

Returns an iterator over the map keys.

#### Returns

`IterableIterator`\<`TK`\>

An iterator over the map keys.

#### Implementation of

[`IReadOnlyResultMap`](../interfaces/IReadOnlyResultMap.md).[`keys`](../interfaces/IReadOnlyResultMap.md#keys)

***

### toReadOnly()

> **toReadOnly**(): [`IReadOnlyResultMap`](../interfaces/IReadOnlyResultMap.md)\<`TK`, `TTARGET`\>

Gets a read-only version of this map.

#### Returns

[`IReadOnlyResultMap`](../interfaces/IReadOnlyResultMap.md)\<`TK`, `TTARGET`\>

A read-only version of this map.

***

### values()

> **values**(): `IterableIterator`\<`TTARGET`\>

Returns an iterator over the converted map values.

#### Returns

`IterableIterator`\<`TTARGET`\>

An iterator over the map values.

#### Implementation of

[`IReadOnlyResultMap`](../interfaces/IReadOnlyResultMap.md).[`values`](../interfaces/IReadOnlyResultMap.md#values)

***

### create()

> `static` **create**\<`TK`, `TSRC`, `TTARGET`\>(`params`): [`Result`](../../../../type-aliases/Result.md)\<`ReadOnlyConvertingResultMap`\<`TK`, `TSRC`, `TTARGET`\>\>

Creates a new ReadOnlyConvertingResultMap.

#### Type Parameters

| Type Parameter |
| ------ |
| `TK` *extends* `string` |
| `TSRC` |
| `TTARGET` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params` | [`IReadOnlyConvertingResultMapConstructorParams`](../interfaces/IReadOnlyConvertingResultMapConstructorParams.md)\<`TK`, `TSRC`, `TTARGET`\> | Parameters for constructing the map. |

#### Returns

[`Result`](../../../../type-aliases/Result.md)\<`ReadOnlyConvertingResultMap`\<`TK`, `TSRC`, `TTARGET`\>\>

`Success` with the new map, or `Failure` with error details if an error occurred.
