[**@fgv/ts-utils**](../../../../README.md)

***

[@fgv/ts-utils](../../../../README.md) / [Collections](../README.md) / ResultMap

# Class: ResultMap\<TK, TV\>

A ResultMap class as a `Map<TK, TV>`-like object which
reports success or failure with additional details using the
[result pattern](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils#the-result-pattern).

## Extended by

- [`ValidatingResultMap`](ValidatingResultMap.md)

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TK` *extends* `string` | `string` |
| `TV` | `unknown` |

## Implements

- [`IResultMap`](../interfaces/IResultMap.md)\<`TK`, `TV`\>

## Constructors

### Constructor

> **new ResultMap**\<`TK`, `TV`\>(`iterable?`): `ResultMap`\<`TK`, `TV`\>

Constructs a new ResultMap.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `iterable?` | `Iterable`\<[`KeyValueEntry`](../type-aliases/KeyValueEntry.md)\<`TK`, `TV`\>, `any`, `any`\> | An iterable to initialize the map. |

#### Returns

`ResultMap`\<`TK`, `TV`\>

### Constructor

> **new ResultMap**\<`TK`, `TV`\>(`params`): `ResultMap`\<`TK`, `TV`\>

Constructs a new ResultMap.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params` | [`IResultMapConstructorParams`](../interfaces/IResultMapConstructorParams.md) | An optional set of parameters to configure the map. |

#### Returns

`ResultMap`\<`TK`, `TV`\>

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="_inner"></a> `_inner` | `readonly` | `Map`\<`TK`, `TV`\> | Protected raw access to the inner `Map<TK, TV>` object. |

## Accessors

### size

#### Get Signature

> **get** **size**(): `number`

Returns the number of entries in the map.

##### Returns

`number`

Returns the number of entries in the map.

#### Implementation of

[`IResultMap`](../interfaces/IResultMap.md).[`size`](../interfaces/IResultMap.md#size)

## Methods

### \_isResultMapValueFactory()

> **\_isResultMapValueFactory**\<`TK`, `TV`\>(`value`): `value is ResultMapValueFactory<TK, TV>`

Determines if a value is a [ResultMapValueFactory](../type-aliases/ResultMapValueFactory.md).

#### Type Parameters

| Type Parameter |
| ------ |
| `TK` *extends* `string` |
| `TV` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `value` | `TV` \| [`ResultMapValueFactory`](../type-aliases/ResultMapValueFactory.md)\<`TK`, `TV`\> | The value to check. |

#### Returns

`value is ResultMapValueFactory<TK, TV>`

`true` if the value is a [ResultMapValueFactory](../type-aliases/ResultMapValueFactory.md),
`false` otherwise.

***

### \[iterator\]()

> **\[iterator\]**(): `IterableIterator`\<[`KeyValueEntry`](../type-aliases/KeyValueEntry.md)\<`TK`, `TV`\>\>

Gets an iterator over the map entries.

#### Returns

`IterableIterator`\<[`KeyValueEntry`](../type-aliases/KeyValueEntry.md)\<`TK`, `TV`\>\>

An iterator over the map entries.

#### Implementation of

[`IResultMap`](../interfaces/IResultMap.md).[`[iterator]`](../interfaces/IResultMap.md#iterator)

***

### add()

> **add**(`key`, `value`): [`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<`TV`, [`ResultMapResultDetail`](../type-aliases/ResultMapResultDetail.md)\>

Sets a key/value pair in the map if the key does not already exist.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `TK` | The key to set. |
| `value` | `TV` | The value to set. |

#### Returns

[`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<`TV`, [`ResultMapResultDetail`](../type-aliases/ResultMapResultDetail.md)\>

`Success` with the value and detail `added` if the key was added,
`Failure` with detail `exists` if the key already exists. Fails with detail
'invalid-key' or 'invalid-value' and an error message if either is invalid.

#### Implementation of

[`IResultMap`](../interfaces/IResultMap.md).[`add`](../interfaces/IResultMap.md#add)

***

### clear()

> **clear**(): `void`

Clears the map.

#### Returns

`void`

#### Implementation of

[`IResultMap`](../interfaces/IResultMap.md).[`clear`](../interfaces/IResultMap.md#clear)

***

### delete()

> **delete**(`key`): [`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<`TV`, [`ResultMapResultDetail`](../type-aliases/ResultMapResultDetail.md)\>

Deletes a key from the map.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `TK` | The key to delete. |

#### Returns

[`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<`TV`, [`ResultMapResultDetail`](../type-aliases/ResultMapResultDetail.md)\>

`Success` with the previous value and the detail 'deleted'
if the key was found and deleted, `Failure` with detail 'not-found'
if the key was not found, or with detail 'invalid-key' if the key is invalid.

#### Implementation of

[`IResultMap`](../interfaces/IResultMap.md).[`delete`](../interfaces/IResultMap.md#delete)

***

### entries()

> **entries**(): `IterableIterator`\<[`KeyValueEntry`](../type-aliases/KeyValueEntry.md)\<`TK`, `TV`\>\>

Returns an iterator over the map entries.

#### Returns

`IterableIterator`\<[`KeyValueEntry`](../type-aliases/KeyValueEntry.md)\<`TK`, `TV`\>\>

An iterator over the map entries.

#### Implementation of

[`IResultMap`](../interfaces/IResultMap.md).[`entries`](../interfaces/IResultMap.md#entries)

***

### forEach()

> **forEach**(`cb`, `arg?`): `void`

Calls a function for each entry in the map.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `cb` | [`ResultMapForEachCb`](../type-aliases/ResultMapForEachCb.md)\<`TK`, `TV`\> | The function to call for each entry. |
| `arg?` | `unknown` | An optional argument to pass to the callback. |

#### Returns

`void`

#### Implementation of

[`IResultMap`](../interfaces/IResultMap.md).[`forEach`](../interfaces/IResultMap.md#foreach)

***

### get()

> **get**(`key`): [`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<`TV`, [`ResultMapResultDetail`](../type-aliases/ResultMapResultDetail.md)\>

Gets a value from the map.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `TK` | The key to retrieve. |

#### Returns

[`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<`TV`, [`ResultMapResultDetail`](../type-aliases/ResultMapResultDetail.md)\>

`Success` with the value and detail `exists` if the key was found,
`Failure` with detail `not-found` if the key was not found or with detail
`invalid-key` if the key is invalid.

#### Implementation of

[`IResultMap`](../interfaces/IResultMap.md).[`get`](../interfaces/IResultMap.md#get)

***

### getOrAdd()

#### Call Signature

> **getOrAdd**(`key`, `value`): [`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<`TV`, [`ResultMapResultDetail`](../type-aliases/ResultMapResultDetail.md)\>

Gets a value from the map, or adds a supplied value it if it does not exist.

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `TK` | The key to be retrieved or created. |
| `value` | `TV` | The value to add if the key does not exist. |

##### Returns

[`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<`TV`, [`ResultMapResultDetail`](../type-aliases/ResultMapResultDetail.md)\>

`Success` with the value and detail `exists` if the key was found,
`Success` with the value and detail `added` if the key was not found and added.
Fails with detail 'invalid-key' or 'invalid-value' and an error message if either
is invalid.

##### Implementation of

[`IResultMap`](../interfaces/IResultMap.md).[`getOrAdd`](../interfaces/IResultMap.md#getoradd)

#### Call Signature

> **getOrAdd**(`key`, `factory`): [`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<`TV`, [`ResultMapResultDetail`](../type-aliases/ResultMapResultDetail.md)\>

Gets a value from the map, or adds a value created by a factory function if it does not exist.

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `TK` | The key of the element to be retrieved or created. |
| `factory` | [`ResultMapValueFactory`](../type-aliases/ResultMapValueFactory.md)\<`TK`, `TV`\> | A [factory function](../type-aliases/ResultMapValueFactory.md) to create the value if the key does not exist. |

##### Returns

[`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<`TV`, [`ResultMapResultDetail`](../type-aliases/ResultMapResultDetail.md)\>

`Success` with the value and detail `exists` if the key was found, `Success` with
the value and detail `added` if the key was not found and added. Fails with detail 'invalid-key'
or 'invalid-value' and an error message if either is invalid.

##### Implementation of

[`IResultMap`](../interfaces/IResultMap.md).[`getOrAdd`](../interfaces/IResultMap.md#getoradd)

***

### has()

> **has**(`key`): `boolean`

Returns `true` if the map contains a key.

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

> **set**(`key`, `value`): [`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<`TV`, [`ResultMapResultDetail`](../type-aliases/ResultMapResultDetail.md)\>

Sets a key/value pair in the map.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `TK` | The key to set. |
| `value` | `TV` | The value to set. |

#### Returns

[`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<`TV`, [`ResultMapResultDetail`](../type-aliases/ResultMapResultDetail.md)\>

`Success` with the new value and the detail `updated` if the
key was found and updated, `Success` with the new value and detail
`added` if the key was not found and added.  Fails with detail
'invalid-key' or 'invalid-value' and an error message if either is invalid.

#### Implementation of

[`IResultMap`](../interfaces/IResultMap.md).[`set`](../interfaces/IResultMap.md#set)

***

### toReadOnly()

> **toReadOnly**(): [`IReadOnlyResultMap`](../interfaces/IReadOnlyResultMap.md)\<`TK`, `TV`\>

Gets a readonly version of this map.

#### Returns

[`IReadOnlyResultMap`](../interfaces/IReadOnlyResultMap.md)\<`TK`, `TV`\>

A readonly version of this map.

#### Implementation of

[`IResultMap`](../interfaces/IResultMap.md).[`toReadOnly`](../interfaces/IResultMap.md#toreadonly)

***

### update()

> **update**(`key`, `value`): [`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<`TV`, [`ResultMapResultDetail`](../type-aliases/ResultMapResultDetail.md)\>

Updates an existing key in the map - the map is not updated if the key does
not exist.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `TK` | The key to update. |
| `value` | `TV` | The value to set. |

#### Returns

[`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<`TV`, [`ResultMapResultDetail`](../type-aliases/ResultMapResultDetail.md)\>

`Success` with the value and detail 'exists' if the key was found
and the value updated, `Failure` an error message and with detail `not-found`
if the key was not found, or with detail 'invalid-key' or 'invalid-value'
if either is invalid.

#### Implementation of

[`IResultMap`](../interfaces/IResultMap.md).[`update`](../interfaces/IResultMap.md#update)

***

### values()

> **values**(): `IterableIterator`\<`TV`\>

Returns an iterator over the map values.

#### Returns

`IterableIterator`\<`TV`\>

An iterator over the map values.

#### Implementation of

[`IResultMap`](../interfaces/IResultMap.md).[`values`](../interfaces/IResultMap.md#values)

***

### create()

Creates a new ResultMap.

#### Param

An optional iterable to initialize the map, or a set of parameters
to configure the map.

#### Call Signature

> `static` **create**\<`TK`, `TV`\>(`elements`): [`Result`](../../../../type-aliases/Result.md)\<`ResultMap`\<`TK`, `TV`\>\>

Creates a new ResultMap.

##### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TK` *extends* `string` | `string` |
| `TV` | `unknown` |

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `elements` | `Iterable`\<[`KeyValueEntry`](../type-aliases/KeyValueEntry.md)\<`TK`, `TV`\>\> | An optional iterable to initialize the map. |

##### Returns

[`Result`](../../../../type-aliases/Result.md)\<`ResultMap`\<`TK`, `TV`\>\>

`Success` with the new map, or `Failure` with error details
if an error occurred.

#### Call Signature

> `static` **create**\<`TK`, `TV`\>(`params?`): [`Result`](../../../../type-aliases/Result.md)\<`ResultMap`\<`TK`, `TV`\>\>

Creates a new ResultMap.

##### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TK` *extends* `string` | `string` |
| `TV` | `unknown` |

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params?` | [`IResultMapConstructorParams`](../interfaces/IResultMapConstructorParams.md)\<`TK`, `TV`\> | An optional set of parameters to configure the map. |

##### Returns

[`Result`](../../../../type-aliases/Result.md)\<`ResultMap`\<`TK`, `TV`\>\>

`Success` with the new map, or `Failure` with error details
if an error occurred.
