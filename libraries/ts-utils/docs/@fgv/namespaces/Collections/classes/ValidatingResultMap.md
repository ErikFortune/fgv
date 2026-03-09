[**@fgv/ts-utils**](../../../../README.md)

***

[@fgv/ts-utils](../../../../README.md) / [Collections](../README.md) / ValidatingResultMap

# Class: ValidatingResultMap\<TK, TV\>

A [ResultMap](ResultMap.md) with a [validator](ResultMapValidator.md)
property that enables validated use of the underlying map with weakly-typed keys and values.

## Extends

- [`ResultMap`](ResultMap.md)\<`TK`, `TV`\>

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TK` *extends* `string` | `string` |
| `TV` | `unknown` |

## Implements

- [`IReadOnlyValidatingResultMap`](../interfaces/IReadOnlyValidatingResultMap.md)\<`TK`, `TV`\>

## Constructors

### Constructor

> **new ValidatingResultMap**\<`TK`, `TV`\>(`params`): `ValidatingResultMap`\<`TK`, `TV`\>

Constructs a new ValidatingResultMap.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params` | [`IValidatingResultMapConstructorParams`](../interfaces/IValidatingResultMapConstructorParams.md)\<`TK`, `TV`\> | Required parameters for constructing the map. |

#### Returns

`ValidatingResultMap`\<`TK`, `TV`\>

#### Overrides

[`ResultMap`](ResultMap.md).[`constructor`](ResultMap.md#constructor)

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="_inner"></a> `_inner` | `readonly` | `Map`\<`TK`, `TV`\> | Protected raw access to the inner `Map<TK, TV>` object. |
| <a id="validating"></a> `validating` | `readonly` | [`ResultMapValidator`](ResultMapValidator.md)\<`TK`, `TV`\> | A [ResultMapValidator](ResultMapValidator.md) which validates keys and values before inserting them into this collection. |

## Accessors

### size

#### Get Signature

> **get** **size**(): `number`

Returns the number of entries in the map.

##### Returns

`number`

Returns the number of entries in the map.

#### Implementation of

[`IReadOnlyValidatingResultMap`](../interfaces/IReadOnlyValidatingResultMap.md).[`size`](../interfaces/IReadOnlyValidatingResultMap.md#size)

#### Inherited from

[`ResultMap`](ResultMap.md).[`size`](ResultMap.md#size)

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

#### Inherited from

[`ResultMap`](ResultMap.md).[`_isResultMapValueFactory`](ResultMap.md#_isresultmapvaluefactory)

***

### \[iterator\]()

> **\[iterator\]**(): `IterableIterator`\<[`KeyValueEntry`](../type-aliases/KeyValueEntry.md)\<`TK`, `TV`\>\>

Gets an iterator over the map entries.

#### Returns

`IterableIterator`\<[`KeyValueEntry`](../type-aliases/KeyValueEntry.md)\<`TK`, `TV`\>\>

An iterator over the map entries.

#### Implementation of

[`IReadOnlyValidatingResultMap`](../interfaces/IReadOnlyValidatingResultMap.md).[`[iterator]`](../interfaces/IReadOnlyValidatingResultMap.md#iterator)

#### Inherited from

[`ResultMap`](ResultMap.md).[`[iterator]`](ResultMap.md#iterator)

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

#### Inherited from

[`ResultMap`](ResultMap.md).[`add`](ResultMap.md#add)

***

### clear()

> **clear**(): `void`

Clears the map.

#### Returns

`void`

#### Inherited from

[`ResultMap`](ResultMap.md).[`clear`](ResultMap.md#clear)

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

#### Inherited from

[`ResultMap`](ResultMap.md).[`delete`](ResultMap.md#delete)

***

### entries()

> **entries**(): `IterableIterator`\<[`KeyValueEntry`](../type-aliases/KeyValueEntry.md)\<`TK`, `TV`\>\>

Returns an iterator over the map entries.

#### Returns

`IterableIterator`\<[`KeyValueEntry`](../type-aliases/KeyValueEntry.md)\<`TK`, `TV`\>\>

An iterator over the map entries.

#### Implementation of

[`IReadOnlyValidatingResultMap`](../interfaces/IReadOnlyValidatingResultMap.md).[`entries`](../interfaces/IReadOnlyValidatingResultMap.md#entries)

#### Inherited from

[`ResultMap`](ResultMap.md).[`entries`](ResultMap.md#entries)

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

[`IReadOnlyValidatingResultMap`](../interfaces/IReadOnlyValidatingResultMap.md).[`forEach`](../interfaces/IReadOnlyValidatingResultMap.md#foreach)

#### Inherited from

[`ResultMap`](ResultMap.md).[`forEach`](ResultMap.md#foreach)

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

[`IReadOnlyValidatingResultMap`](../interfaces/IReadOnlyValidatingResultMap.md).[`get`](../interfaces/IReadOnlyValidatingResultMap.md#get)

#### Inherited from

[`ResultMap`](ResultMap.md).[`get`](ResultMap.md#get)

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

##### Inherited from

[`ResultMap`](ResultMap.md).[`getOrAdd`](ResultMap.md#getoradd)

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

##### Inherited from

[`ResultMap`](ResultMap.md).[`getOrAdd`](ResultMap.md#getoradd)

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

[`IReadOnlyValidatingResultMap`](../interfaces/IReadOnlyValidatingResultMap.md).[`has`](../interfaces/IReadOnlyValidatingResultMap.md#has)

#### Inherited from

[`ResultMap`](ResultMap.md).[`has`](ResultMap.md#has)

***

### keys()

> **keys**(): `IterableIterator`\<`TK`\>

Returns an iterator over the map keys.

#### Returns

`IterableIterator`\<`TK`\>

An iterator over the map keys.

#### Implementation of

[`IReadOnlyValidatingResultMap`](../interfaces/IReadOnlyValidatingResultMap.md).[`keys`](../interfaces/IReadOnlyValidatingResultMap.md#keys)

#### Inherited from

[`ResultMap`](ResultMap.md).[`keys`](ResultMap.md#keys)

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

#### Inherited from

[`ResultMap`](ResultMap.md).[`set`](ResultMap.md#set)

***

### toReadOnly()

> **toReadOnly**(): [`IReadOnlyValidatingResultMap`](../interfaces/IReadOnlyValidatingResultMap.md)\<`TK`, `TV`\>

Gets a read-only version of this map.

#### Returns

[`IReadOnlyValidatingResultMap`](../interfaces/IReadOnlyValidatingResultMap.md)\<`TK`, `TV`\>

#### Overrides

[`ResultMap`](ResultMap.md).[`toReadOnly`](ResultMap.md#toreadonly)

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

#### Inherited from

[`ResultMap`](ResultMap.md).[`update`](ResultMap.md#update)

***

### values()

> **values**(): `IterableIterator`\<`TV`\>

Returns an iterator over the map values.

#### Returns

`IterableIterator`\<`TV`\>

An iterator over the map values.

#### Implementation of

[`IReadOnlyValidatingResultMap`](../interfaces/IReadOnlyValidatingResultMap.md).[`values`](../interfaces/IReadOnlyValidatingResultMap.md#values)

#### Inherited from

[`ResultMap`](ResultMap.md).[`values`](ResultMap.md#values)

***

### create()

Creates a new [ResultMap](ResultMap.md).

#### Param

An optional iterable to initialize the map, or a set of parameters
to configure the map.

#### Call Signature

> `static` **create**\<`TK`, `TV`\>(`elements`): [`Result`](../../../../type-aliases/Result.md)\<[`ResultMap`](ResultMap.md)\<`TK`, `TV`\>\>

Creates a new [ResultMap](ResultMap.md).

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

[`Result`](../../../../type-aliases/Result.md)\<[`ResultMap`](ResultMap.md)\<`TK`, `TV`\>\>

`Success` with the new map, or `Failure` with error details
if an error occurred.

##### Inherited from

[`ResultMap`](ResultMap.md).[`create`](ResultMap.md#create)

#### Call Signature

> `static` **create**\<`TK`, `TV`\>(`params?`): [`Result`](../../../../type-aliases/Result.md)\<[`ResultMap`](ResultMap.md)\<`TK`, `TV`\>\>

Creates a new [ResultMap](ResultMap.md).

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

[`Result`](../../../../type-aliases/Result.md)\<[`ResultMap`](ResultMap.md)\<`TK`, `TV`\>\>

`Success` with the new map, or `Failure` with error details
if an error occurred.

##### Inherited from

[`ResultMap`](ResultMap.md).[`create`](ResultMap.md#create)

***

### createValidatingResultMap()

> `static` **createValidatingResultMap**\<`TK`, `TV`\>(`params`): [`Result`](../../../../type-aliases/Result.md)\<`ValidatingResultMap`\<`TK`, `TV`\>\>

Creates a new ValidatingResultMap instance.

#### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TK` *extends* `string` | `string` |
| `TV` | `unknown` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params` | [`IValidatingResultMapConstructorParams`](../interfaces/IValidatingResultMapConstructorParams.md)\<`TK`, `TV`\> | Required parameters for constructing the map. |

#### Returns

[`Result`](../../../../type-aliases/Result.md)\<`ValidatingResultMap`\<`TK`, `TV`\>\>

`Success` with the new map if successful, `Failure` otherwise.
