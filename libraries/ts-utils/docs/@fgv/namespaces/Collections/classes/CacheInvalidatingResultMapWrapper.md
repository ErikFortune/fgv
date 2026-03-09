[**@fgv/ts-utils**](../../../../README.md)

***

[@fgv/ts-utils](../../../../README.md) / [Collections](../README.md) / CacheInvalidatingResultMapWrapper

# Class: CacheInvalidatingResultMapWrapper\<TK, TSRC, TTARGET, TSRCMAP\>

A wrapper around a mutable result map that invalidates cache entries
in the parent [ConvertingResultMap](ConvertingResultMap.md) when mutations occur.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TK` *extends* `string` | - |
| `TSRC` | - |
| `TTARGET` | - |
| `TSRCMAP` *extends* [`IResultMap`](../interfaces/IResultMap.md)\<`TK`, `TSRC`\> | [`IResultMap`](../interfaces/IResultMap.md)\<`TK`, `TSRC`\> |

## Implements

- [`IResultMap`](../interfaces/IResultMap.md)\<`TK`, `TSRC`\>

## Constructors

### Constructor

> **new CacheInvalidatingResultMapWrapper**\<`TK`, `TSRC`, `TTARGET`, `TSRCMAP`\>(`inner`, `parent`): `CacheInvalidatingResultMapWrapper`\<`TK`, `TSRC`, `TTARGET`, `TSRCMAP`\>

Constructs a new cache-invalidating wrapper.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `inner` | `TSRCMAP` | The inner map to wrap. |
| `parent` | [`ConvertingResultMap`](ConvertingResultMap.md)\<`TK`, `TSRC`, `TTARGET`, `TSRCMAP`\> | The parent converting map whose cache should be invalidated. |

#### Returns

`CacheInvalidatingResultMapWrapper`\<`TK`, `TSRC`, `TTARGET`, `TSRCMAP`\>

## Accessors

### size

#### Get Signature

> **get** **size**(): `number`

The number of entries in the map.

##### Returns

`number`

Returns the number of entries in the map.

#### Implementation of

[`IResultMap`](../interfaces/IResultMap.md).[`size`](../interfaces/IResultMap.md#size)

## Methods

### \[iterator\]()

> **\[iterator\]**(): `IterableIterator`\<[`KeyValueEntry`](../type-aliases/KeyValueEntry.md)\<`TK`, `TSRC`\>\>

Gets an iterator over the map entries.

#### Returns

`IterableIterator`\<[`KeyValueEntry`](../type-aliases/KeyValueEntry.md)\<`TK`, `TSRC`\>\>

An iterator over the map entries.

#### Implementation of

[`IResultMap`](../interfaces/IResultMap.md).[`[iterator]`](../interfaces/IResultMap.md#iterator)

***

### add()

> **add**(`key`, `value`): [`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<`TSRC`, [`ResultMapResultDetail`](../type-aliases/ResultMapResultDetail.md)\>

Adds a key/value pair to the map if the key does not already exist.
Invalidates the cache entry for the key.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `TK` | The key to add. |
| `value` | `TSRC` | The value to add. |

#### Returns

[`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<`TSRC`, [`ResultMapResultDetail`](../type-aliases/ResultMapResultDetail.md)\>

The result of the add operation.

#### Implementation of

[`IResultMap`](../interfaces/IResultMap.md).[`add`](../interfaces/IResultMap.md#add)

***

### clear()

> **clear**(): `void`

Clears all entries from the map.
Clears the entire cache.

#### Returns

`void`

#### Implementation of

[`IResultMap`](../interfaces/IResultMap.md).[`clear`](../interfaces/IResultMap.md#clear)

***

### delete()

> **delete**(`key`): [`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<`TSRC`, [`ResultMapResultDetail`](../type-aliases/ResultMapResultDetail.md)\>

Deletes a key from the map.
Invalidates the cache entry for the key.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `TK` | The key to delete. |

#### Returns

[`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<`TSRC`, [`ResultMapResultDetail`](../type-aliases/ResultMapResultDetail.md)\>

The result of the delete operation.

#### Implementation of

[`IResultMap`](../interfaces/IResultMap.md).[`delete`](../interfaces/IResultMap.md#delete)

***

### entries()

> **entries**(): `IterableIterator`\<[`KeyValueEntry`](../type-aliases/KeyValueEntry.md)\<`TK`, `TSRC`\>\>

Returns an iterator over the map entries.

#### Returns

`IterableIterator`\<[`KeyValueEntry`](../type-aliases/KeyValueEntry.md)\<`TK`, `TSRC`\>\>

An iterator over the map entries.

#### Implementation of

[`IResultMap`](../interfaces/IResultMap.md).[`entries`](../interfaces/IResultMap.md#entries)

***

### forEach()

> **forEach**(`cb`, `thisArg?`): `void`

Calls a callback for each entry in the map.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `cb` | [`ResultMapForEachCb`](../type-aliases/ResultMapForEachCb.md)\<`TK`, `TSRC`\> | The callback to call for each entry. |
| `thisArg?` | `unknown` | Optional `this` argument for the callback. |

#### Returns

`void`

#### Implementation of

[`IResultMap`](../interfaces/IResultMap.md).[`forEach`](../interfaces/IResultMap.md#foreach)

***

### get()

> **get**(`key`): [`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<`TSRC`, [`ResultMapResultDetail`](../type-aliases/ResultMapResultDetail.md)\>

Gets a value from the map.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `TK` | The key to retrieve. |

#### Returns

[`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<`TSRC`, [`ResultMapResultDetail`](../type-aliases/ResultMapResultDetail.md)\>

The result of the get operation.

#### Implementation of

[`IResultMap`](../interfaces/IResultMap.md).[`get`](../interfaces/IResultMap.md#get)

***

### getOrAdd()

#### Call Signature

> **getOrAdd**(`key`, `value`): [`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<`TSRC`, [`ResultMapResultDetail`](../type-aliases/ResultMapResultDetail.md)\>

Gets a value from the map, or adds a supplied value if it does not exist.
Invalidates the cache entry for the key if a new value is added.

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `TK` | The key to retrieve or add. |
| `value` | `TSRC` | The value to add if the key does not exist. |

##### Returns

[`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<`TSRC`, [`ResultMapResultDetail`](../type-aliases/ResultMapResultDetail.md)\>

The result of the operation.

##### Implementation of

[`IResultMap`](../interfaces/IResultMap.md).[`getOrAdd`](../interfaces/IResultMap.md#getoradd)

#### Call Signature

> **getOrAdd**(`key`, `factory`): [`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<`TSRC`, [`ResultMapResultDetail`](../type-aliases/ResultMapResultDetail.md)\>

Gets a value from the map, or adds a value created by a factory if it does not exist.
Invalidates the cache entry for the key if a new value is added.

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `TK` | The key to retrieve or add. |
| `factory` | [`ResultMapValueFactory`](../type-aliases/ResultMapValueFactory.md)\<`TK`, `TSRC`\> | A factory function to create the value if the key does not exist. |

##### Returns

[`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<`TSRC`, [`ResultMapResultDetail`](../type-aliases/ResultMapResultDetail.md)\>

The result of the operation.

##### Implementation of

[`IResultMap`](../interfaces/IResultMap.md).[`getOrAdd`](../interfaces/IResultMap.md#getoradd)

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

[`IResultMap`](../interfaces/IResultMap.md).[`has`](../interfaces/IResultMap.md#has)

***

### keys()

> **keys**(): `IterableIterator`\<`TK`\>

Returns an iterator over the map keys.

#### Returns

`IterableIterator`\<`TK`\>

An iterator over the map keys.

#### Implementation of

[`IResultMap`](../interfaces/IResultMap.md).[`keys`](../interfaces/IResultMap.md#keys)

***

### set()

> **set**(`key`, `value`): [`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<`TSRC`, [`ResultMapResultDetail`](../type-aliases/ResultMapResultDetail.md)\>

Sets a key/value pair in the map.
Invalidates the cache entry for the key.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `TK` | The key to set. |
| `value` | `TSRC` | The value to set. |

#### Returns

[`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<`TSRC`, [`ResultMapResultDetail`](../type-aliases/ResultMapResultDetail.md)\>

The result of the set operation.

#### Implementation of

[`IResultMap`](../interfaces/IResultMap.md).[`set`](../interfaces/IResultMap.md#set)

***

### toReadOnly()

> **toReadOnly**(): [`IReadOnlyResultMap`](../interfaces/IReadOnlyResultMap.md)\<`TK`, `TSRC`\>

Gets a read-only version of this map.

#### Returns

[`IReadOnlyResultMap`](../interfaces/IReadOnlyResultMap.md)\<`TK`, `TSRC`\>

A read-only version of this map.

#### Implementation of

[`IResultMap`](../interfaces/IResultMap.md).[`toReadOnly`](../interfaces/IResultMap.md#toreadonly)

***

### update()

> **update**(`key`, `value`): [`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<`TSRC`, [`ResultMapResultDetail`](../type-aliases/ResultMapResultDetail.md)\>

Updates an existing key in the map.
Invalidates the cache entry for the key.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `TK` | The key to update. |
| `value` | `TSRC` | The new value. |

#### Returns

[`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<`TSRC`, [`ResultMapResultDetail`](../type-aliases/ResultMapResultDetail.md)\>

The result of the update operation.

#### Implementation of

[`IResultMap`](../interfaces/IResultMap.md).[`update`](../interfaces/IResultMap.md#update)

***

### values()

> **values**(): `IterableIterator`\<`TSRC`\>

Returns an iterator over the map values.

#### Returns

`IterableIterator`\<`TSRC`\>

An iterator over the map values.

#### Implementation of

[`IResultMap`](../interfaces/IResultMap.md).[`values`](../interfaces/IResultMap.md#values)
