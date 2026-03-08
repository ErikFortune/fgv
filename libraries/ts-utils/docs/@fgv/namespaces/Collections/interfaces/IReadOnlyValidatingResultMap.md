[**@fgv/ts-utils**](../../../../README.md)

***

[@fgv/ts-utils](../../../../README.md) / [Collections](../README.md) / IReadOnlyValidatingResultMap

# Interface: IReadOnlyValidatingResultMap\<TK, TV\>

A read-only interface exposing non-mutating methods of a [ValidatingResultMap](../classes/ValidatingResultMap.md).

## Extends

- [`IReadOnlyResultMap`](IReadOnlyResultMap.md)\<`TK`, `TV`\>

## Extended by

- [`IReadOnlyValidatingCollector`](IReadOnlyValidatingCollector.md)

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TK` *extends* `string` | `string` |
| `TV` | `unknown` |

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="size"></a> `size` | `readonly` | `number` | Returns the number of entries in the map. |
| <a id="validating"></a> `validating` | `readonly` | [`IReadOnlyResultMapValidator`](IReadOnlyResultMapValidator.md)\<`TK`, `TV`\> | A [ResultMapValidator](../classes/ResultMapValidator.md) which validates keys and values before inserting them into this collection. |

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

### entries()

> **entries**(): `IterableIterator`\<[`KeyValueEntry`](../type-aliases/KeyValueEntry.md)\<`TK`, `TV`\>\>

Returns an iterator over the map entries.

#### Returns

`IterableIterator`\<[`KeyValueEntry`](../type-aliases/KeyValueEntry.md)\<`TK`, `TV`\>\>

An iterator over the map entries.

#### Inherited from

[`IReadOnlyResultMap`](IReadOnlyResultMap.md).[`entries`](IReadOnlyResultMap.md#entries)

***

### forEach()

> **forEach**(`cb`, `arg?`): `void`

Calls a function for each entry in the map.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `cb` | [`ResultMapForEachCb`](../type-aliases/ResultMapForEachCb.md) | The function to call for each entry. |
| `arg?` | `unknown` | An optional argument to pass to the callback. |

#### Returns

`void`

#### Inherited from

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

#### Inherited from

[`IReadOnlyResultMap`](IReadOnlyResultMap.md).[`get`](IReadOnlyResultMap.md#get)

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

#### Inherited from

[`IReadOnlyResultMap`](IReadOnlyResultMap.md).[`keys`](IReadOnlyResultMap.md#keys)

***

### values()

> **values**(): `IterableIterator`\<`TV`\>

Returns an iterator over the map values.

#### Returns

`IterableIterator`\<`TV`\>

An iterator over the map values.

#### Inherited from

[`IReadOnlyResultMap`](IReadOnlyResultMap.md).[`values`](IReadOnlyResultMap.md#values)
