[**@fgv/ts-utils**](../../../../README.md)

***

[@fgv/ts-utils](../../../../README.md) / [Collections](../README.md) / IReadOnlyCollector

# Interface: IReadOnlyCollector\<TITEM\>

A read-only interface exposing only the non-mutating methods of a [ICollector](../classes/Collector.md).

## Extends

- [`IReadOnlyResultMap`](IReadOnlyResultMap.md)\<[`CollectibleKey`](../type-aliases/CollectibleKey.md)\<`TITEM`\>, `TITEM`\>

## Type Parameters

| Type Parameter |
| ------ |
| `TITEM` *extends* [`ICollectible`](ICollectible.md)\<`any`, `any`\> |

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="size"></a> `size` | `readonly` | `number` | Returns the number of entries in the map. |

## Methods

### \[iterator\]()

> **\[iterator\]**(): `IterableIterator`\<[`KeyValueEntry`](../type-aliases/KeyValueEntry.md)\<[`CollectibleKey`](../type-aliases/CollectibleKey.md)\<`TITEM`\>, `TITEM`\>\>

Gets an iterator over the map entries.

#### Returns

`IterableIterator`\<[`KeyValueEntry`](../type-aliases/KeyValueEntry.md)\<[`CollectibleKey`](../type-aliases/CollectibleKey.md)\<`TITEM`\>, `TITEM`\>\>

An iterator over the map entries.

#### Inherited from

[`IReadOnlyResultMap`](IReadOnlyResultMap.md).[`[iterator]`](IReadOnlyResultMap.md#iterator)

***

### entries()

> **entries**(): `IterableIterator`\<[`KeyValueEntry`](../type-aliases/KeyValueEntry.md)\<[`CollectibleKey`](../type-aliases/CollectibleKey.md)\<`TITEM`\>, `TITEM`\>\>

Returns an iterator over the map entries.

#### Returns

`IterableIterator`\<[`KeyValueEntry`](../type-aliases/KeyValueEntry.md)\<[`CollectibleKey`](../type-aliases/CollectibleKey.md)\<`TITEM`\>, `TITEM`\>\>

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

> **get**(`key`): [`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<`TITEM`, [`ResultMapResultDetail`](../type-aliases/ResultMapResultDetail.md)\>

Gets a value from the map.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | [`CollectibleKey`](../type-aliases/CollectibleKey.md) | The key to retrieve. |

#### Returns

[`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<`TITEM`, [`ResultMapResultDetail`](../type-aliases/ResultMapResultDetail.md)\>

`Success` with the value and detail `exists` if the key was found,
`Failure` with detail `not-found` if the key was not found or with detail
`invalid-key` if the key is invalid.

#### Inherited from

[`IReadOnlyResultMap`](IReadOnlyResultMap.md).[`get`](IReadOnlyResultMap.md#get)

***

### getAt()

> **getAt**(`index`): [`Result`](../../../../type-aliases/Result.md)\<`TITEM`\>

Gets the item at a specified index.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `index` | `number` | The index of the item to retrieve. |

#### Returns

[`Result`](../../../../type-aliases/Result.md)\<`TITEM`\>

Returns [Success](../../../../classes/Success.md) with the item if it exists, or [Failure](../../../../classes/Failure.md)
with an error if the index is out of range.

***

### has()

> **has**(`key`): `boolean`

Returns `true` if the map contains a key.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | [`CollectibleKey`](../type-aliases/CollectibleKey.md) | The key to check. |

#### Returns

`boolean`

`true` if the key exists, `false` otherwise.

#### Inherited from

[`IReadOnlyResultMap`](IReadOnlyResultMap.md).[`has`](IReadOnlyResultMap.md#has)

***

### keys()

> **keys**(): `IterableIterator`\<[`CollectibleKey`](../type-aliases/CollectibleKey.md)\<`TITEM`\>\>

Returns an iterator over the map keys.

#### Returns

`IterableIterator`\<[`CollectibleKey`](../type-aliases/CollectibleKey.md)\<`TITEM`\>\>

An iterator over the map keys.

#### Inherited from

[`IReadOnlyResultMap`](IReadOnlyResultMap.md).[`keys`](IReadOnlyResultMap.md#keys)

***

### values()

> **values**(): `IterableIterator`\<`TITEM`\>

Returns an iterator over the map values.

#### Returns

`IterableIterator`\<`TITEM`\>

An iterator over the map values.

#### Inherited from

[`IReadOnlyResultMap`](IReadOnlyResultMap.md).[`values`](IReadOnlyResultMap.md#values)

***

### valuesByIndex()

> **valuesByIndex**(): readonly `TITEM`[]

Gets all items in the collection, ordered by index.

#### Returns

readonly `TITEM`[]

An array of items in the collection, ordered by index.
