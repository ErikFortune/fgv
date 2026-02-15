[**@fgv/ts-utils**](../../../../README.md)

***

[@fgv/ts-utils](../../../../README.md) / [Collections](../README.md) / Collector

# Class: Collector\<TITEM\>

A Collector that is a specialized collection
which contains items of type [ICollectible](../interfaces/ICollectible.md),
which have a unique key and a write-once index.

Items are assigned an index sequentially as they are added to the collection.
Once added, items are immutable - they cannot be removed or replaced.

## Extended by

- [`ConvertingCollector`](ConvertingCollector.md)
- [`ValidatingCollector`](ValidatingCollector.md)

## Type Parameters

| Type Parameter |
| ------ |
| `TITEM` *extends* [`ICollectible`](../interfaces/ICollectible.md)\<`any`, `any`\> |

## Implements

- [`IReadOnlyCollector`](../interfaces/IReadOnlyCollector.md)\<`TITEM`\>

## Constructors

### Constructor

> **new Collector**\<`TITEM`\>(`params?`): `Collector`\<`TITEM`\>

Constructs a new Collector.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params?` | [`ICollectorConstructorParams`](../interfaces/ICollectorConstructorParams.md)\<`TITEM`\> | Optional [initialization parameters](../interfaces/ICollectorConstructorParams.md) used to construct the collector. |

#### Returns

`Collector`\<`TITEM`\>

## Accessors

### size

#### Get Signature

> **get** **size**(): `number`

Returns the number of entries in the map.

##### Returns

`number`

Returns the number of entries in the map.

#### Implementation of

[`IReadOnlyCollector`](../interfaces/IReadOnlyCollector.md).[`size`](../interfaces/IReadOnlyCollector.md#size)

## Methods

### \_isItem()

> `protected` **\_isItem**(`keyOrItem`): `keyOrItem is TITEM`

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `keyOrItem` | `TITEM` \| [`CollectibleKey`](../type-aliases/CollectibleKey.md)\<`TITEM`\> |

#### Returns

`keyOrItem is TITEM`

***

### \[iterator\]()

> **\[iterator\]**(): `IterableIterator`\<[`KeyValueEntry`](../type-aliases/KeyValueEntry.md)\<[`CollectibleKey`](../type-aliases/CollectibleKey.md)\<`TITEM`\>, `TITEM`\>\>

Gets an iterator over the map entries.

#### Returns

`IterableIterator`\<[`KeyValueEntry`](../type-aliases/KeyValueEntry.md)\<[`CollectibleKey`](../type-aliases/CollectibleKey.md)\<`TITEM`\>, `TITEM`\>\>

An iterator over the map entries.

#### Implementation of

[`IReadOnlyCollector`](../interfaces/IReadOnlyCollector.md).[`[iterator]`](../interfaces/IReadOnlyCollector.md#iterator)

***

### add()

> **add**(`item`): [`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<`TITEM`, [`CollectorResultDetail`](../type-aliases/CollectorResultDetail.md)\>

Adds an item to the collection, failing if a different item with the same key already exists. Note
that adding an object that is already in the collection again will succeed without updating the collection.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `item` | `TITEM` | The item to add. |

#### Returns

[`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<`TITEM`, [`CollectorResultDetail`](../type-aliases/CollectorResultDetail.md)\>

Returns [Success](../../../../classes/DetailedSuccess.md) with the item and detail `added` if it was added
or detail `exists` if the item was already in the map.  Returns [Failure](../../../../classes/DetailedFailure.md) with
an error message and appropriate detail if the item could not be added.

***

### entries()

> **entries**(): `IterableIterator`\<[`KeyValueEntry`](../type-aliases/KeyValueEntry.md)\<[`CollectibleKey`](../type-aliases/CollectibleKey.md)\<`TITEM`\>, `TITEM`\>\>

Returns an iterator over the map entries.

#### Returns

`IterableIterator`\<[`KeyValueEntry`](../type-aliases/KeyValueEntry.md)\<[`CollectibleKey`](../type-aliases/CollectibleKey.md)\<`TITEM`\>, `TITEM`\>\>

An iterator over the map entries.

#### Implementation of

[`IReadOnlyCollector`](../interfaces/IReadOnlyCollector.md).[`entries`](../interfaces/IReadOnlyCollector.md#entries)

***

### forEach()

> **forEach**(`callback`, `arg?`): `void`

Calls a function for each entry in the map.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `callback` | [`ResultMapForEachCb`](../type-aliases/ResultMapForEachCb.md)\<[`CollectibleKey`](../type-aliases/CollectibleKey.md)\<`TITEM`\>, `TITEM`\> | The function to call for each entry. |
| `arg?` | `unknown` | An optional argument to pass to the callback. |

#### Returns

`void`

#### Implementation of

[`IReadOnlyCollector`](../interfaces/IReadOnlyCollector.md).[`forEach`](../interfaces/IReadOnlyCollector.md#foreach)

***

### get()

> **get**(`key`): [`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<`TITEM`, [`ResultMapResultDetail`](../type-aliases/ResultMapResultDetail.md)\>

Gets a value from the map.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | [`CollectibleKey`](../type-aliases/CollectibleKey.md)\<`TITEM`\> | The key to retrieve. |

#### Returns

[`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<`TITEM`, [`ResultMapResultDetail`](../type-aliases/ResultMapResultDetail.md)\>

`Success` with the value and detail `exists` if the key was found,
`Failure` with detail `not-found` if the key was not found or with detail
`invalid-key` if the key is invalid.

#### Implementation of

[`IReadOnlyCollector`](../interfaces/IReadOnlyCollector.md).[`get`](../interfaces/IReadOnlyCollector.md#get)

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

#### Implementation of

[`IReadOnlyCollector`](../interfaces/IReadOnlyCollector.md).[`getAt`](../interfaces/IReadOnlyCollector.md#getat)

***

### getOrAdd()

#### Call Signature

> **getOrAdd**(`item`): [`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<`TITEM`, [`CollectorResultDetail`](../type-aliases/CollectorResultDetail.md)\>

Gets an existing item with a key matching that of a supplied item, or adds the supplied
item to the collector if no item with that key exists.

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `item` | `TITEM` | The item to get or add. |

##### Returns

[`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<`TITEM`, [`CollectorResultDetail`](../type-aliases/CollectorResultDetail.md)\>

Returns [Success](../../../../classes/DetailedSuccess.md) with the item stored in the collector -
detail `exists` indicates that an existing item return and detail `added` indicates that the
item was added. Returns [Failure](../../../../classes/DetailedFailure.md) with an error and appropriate
detail if the item could not be added.

#### Call Signature

> **getOrAdd**(`key`, `factory`): [`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<`TITEM`, [`CollectorResultDetail`](../type-aliases/CollectorResultDetail.md)\>

Gets an existing item with a key matching the supplied key, or adds a new item to the collector
using a factory callback if no item with that key exists.

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | [`CollectibleKey`](../type-aliases/CollectibleKey.md)\<`TITEM`\> | The key of the item to add. |
| `factory` | [`CollectibleFactoryCallback`](../type-aliases/CollectibleFactoryCallback.md)\<`TITEM`\> | The factory callback to create the item. |

##### Returns

[`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<`TITEM`, [`CollectorResultDetail`](../type-aliases/CollectorResultDetail.md)\>

Returns [Success](../../../../classes/DetailedSuccess.md) with the item stored in the collector -
detail `exists` indicates that an existing item return and detail `added` indicates that the
item was added. Returns [Failure](../../../../classes/DetailedFailure.md) with an error and appropriate
detail if the item could not be added.

***

### has()

> **has**(`key`): `boolean`

Returns `true` if the map contains a key.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | [`CollectibleKey`](../type-aliases/CollectibleKey.md)\<`TITEM`\> | The key to check. |

#### Returns

`boolean`

`true` if the key exists, `false` otherwise.

#### Implementation of

[`IReadOnlyCollector`](../interfaces/IReadOnlyCollector.md).[`has`](../interfaces/IReadOnlyCollector.md#has)

***

### keys()

> **keys**(): `IterableIterator`\<[`CollectibleKey`](../type-aliases/CollectibleKey.md)\<`TITEM`\>\>

Returns an iterator over the map keys.

#### Returns

`IterableIterator`\<[`CollectibleKey`](../type-aliases/CollectibleKey.md)\<`TITEM`\>\>

An iterator over the map keys.

#### Implementation of

[`IReadOnlyCollector`](../interfaces/IReadOnlyCollector.md).[`keys`](../interfaces/IReadOnlyCollector.md#keys)

***

### toReadOnly()

> **toReadOnly**(): [`IReadOnlyCollector`](../interfaces/IReadOnlyCollector.md)\<`TITEM`\>

Gets a read-only version of this collector.

#### Returns

[`IReadOnlyCollector`](../interfaces/IReadOnlyCollector.md)\<`TITEM`\>

***

### values()

> **values**(): `IterableIterator`\<`TITEM`\>

Returns an iterator over the map values.

#### Returns

`IterableIterator`\<`TITEM`\>

An iterator over the map values.

#### Implementation of

[`IReadOnlyCollector`](../interfaces/IReadOnlyCollector.md).[`values`](../interfaces/IReadOnlyCollector.md#values)

***

### valuesByIndex()

> **valuesByIndex**(): readonly `TITEM`[]

Gets all items in the collection, ordered by index.

#### Returns

readonly `TITEM`[]

An array of items in the collection, ordered by index.

#### Implementation of

[`IReadOnlyCollector`](../interfaces/IReadOnlyCollector.md).[`valuesByIndex`](../interfaces/IReadOnlyCollector.md#valuesbyindex)

***

### createCollector()

> `static` **createCollector**\<`TITEM`\>(`params?`): [`Result`](../../../../type-aliases/Result.md)\<`Collector`\<`TITEM`\>\>

Creates a new Collector instance.

#### Type Parameters

| Type Parameter |
| ------ |
| `TITEM` *extends* [`ICollectible`](../interfaces/ICollectible.md)\<`any`, `any`\> |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params?` | [`ICollectorConstructorParams`](../interfaces/ICollectorConstructorParams.md)\<`TITEM`\> | Optional [initialization parameters](../interfaces/ICollectorConstructorParams.md) used to create the collector. |

#### Returns

[`Result`](../../../../type-aliases/Result.md)\<`Collector`\<`TITEM`\>\>

Returns [Success](../../../../classes/Success.md) with the new collector if it was created successfully,
or [Failure](../../../../classes/Failure.md) with an error if the collector could not be created.
