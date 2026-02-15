[**@fgv/ts-utils**](../../../../README.md)

***

[@fgv/ts-utils](../../../../README.md) / [Collections](../README.md) / IResultMap

# Interface: IResultMap\<TK, TV\>

Interface for a mutable [ResultMap](../classes/ResultMap.md).

## Extends

- [`IReadOnlyResultMap`](IReadOnlyResultMap.md)\<`TK`, `TV`\>

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TK` *extends* `string` | `string` |
| `TV` | `unknown` |

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="size"></a> `size` | `readonly` | `number` | Returns the number of entries in the map. |

## Methods

### \[iterator\]()

> **\[iterator\]**(): `IterableIterator`\<[`KeyValueEntry`](../type-aliases/KeyValueEntry.md)\<`TK`, `TV`\>\>

Gets an iterator over the map entries.

#### Returns

`IterableIterator`\<[`KeyValueEntry`](../type-aliases/KeyValueEntry.md)\<`TK`, `TV`\>\>

An iterator over the map entries.

#### Inherited from

[`IReadOnlyResultMap`](IReadOnlyResultMap.md).[`[iterator]`](IReadOnlyResultMap.md#iterator)

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

***

### clear()

> **clear**(): `void`

Clears all entries from the map.

#### Returns

`void`

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

***

### entries()

> **entries**(): `IterableIterator`\<[`KeyValueEntry`](../type-aliases/KeyValueEntry.md)\<`TK`, `TV`\>\>

Returns an iterator over the map entries.

#### Returns

`IterableIterator`\<[`KeyValueEntry`](../type-aliases/KeyValueEntry.md)\<`TK`, `TV`\>\>

An iterator over the map entries.

#### Overrides

[`IReadOnlyResultMap`](IReadOnlyResultMap.md).[`entries`](IReadOnlyResultMap.md#entries)

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

#### Overrides

[`IReadOnlyResultMap`](IReadOnlyResultMap.md).[`forEach`](IReadOnlyResultMap.md#foreach)

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

#### Overrides

[`IReadOnlyResultMap`](IReadOnlyResultMap.md).[`get`](IReadOnlyResultMap.md#get)

***

### getOrAdd()

#### Call Signature

> **getOrAdd**(`key`, `value`): [`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<`TV`, [`ResultMapResultDetail`](../type-aliases/ResultMapResultDetail.md)\>

Gets a value from the map, or adds a supplied value if it does not exist.

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

#### Inherited from

[`IReadOnlyResultMap`](IReadOnlyResultMap.md).[`has`](IReadOnlyResultMap.md#has)

***

### keys()

> **keys**(): `IterableIterator`\<`TK`\>

Returns an iterator over the map keys.

#### Returns

`IterableIterator`\<`TK`\>

An iterator over the map keys.

#### Overrides

[`IReadOnlyResultMap`](IReadOnlyResultMap.md).[`keys`](IReadOnlyResultMap.md#keys)

***

### set()

> **set**(`key`, `value`): [`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<`TV`, [`ResultMapResultDetail`](../type-aliases/ResultMapResultDetail.md)\>

Sets a key/value pair in the map regardless of whether the key already exists.

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

***

### toReadOnly()

> **toReadOnly**(): [`IReadOnlyResultMap`](IReadOnlyResultMap.md)\<`TK`, `TV`\>

Gets a readonly version of this map.

#### Returns

[`IReadOnlyResultMap`](IReadOnlyResultMap.md)\<`TK`, `TV`\>

***

### update()

> **update**(`key`, `value`): [`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<`TV`, [`ResultMapResultDetail`](../type-aliases/ResultMapResultDetail.md)\>

Updates the value associated with a key in the map.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `TK` | The key to update. |
| `value` | `TV` | The value to set. |

#### Returns

[`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<`TV`, [`ResultMapResultDetail`](../type-aliases/ResultMapResultDetail.md)\>

`Success` with the value and detail 'updated' if the key was found
and the value updated, `Failure` an error message and with detail `not-found`
if the key was not found, or with detail 'invalid-key' or 'invalid-value'
if either is invalid.

***

### values()

> **values**(): `IterableIterator`\<`TV`\>

Returns an iterator over the map values.

#### Returns

`IterableIterator`\<`TV`\>

An iterator over the map values.

#### Overrides

[`IReadOnlyResultMap`](IReadOnlyResultMap.md).[`values`](IReadOnlyResultMap.md#values)
