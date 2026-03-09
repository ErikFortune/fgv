[**@fgv/ts-utils**](../../../../README.md)

***

[@fgv/ts-utils](../../../../README.md) / [Collections](../README.md) / ConvertingCollector

# Class: ConvertingCollector\<TITEM, TSRC\>

A [collector](Collector.md) that collects [ICollectible](../interfaces/ICollectible.md) items,
optionally converting them from a source representation to the target representation using a factory
supplied at default or at the time of collection.

## Extends

- [`Collector`](Collector.md)\<`TITEM`\>

## Extended by

- [`ValidatingConvertingCollector`](ValidatingConvertingCollector.md)

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TITEM` *extends* [`ICollectible`](../interfaces/ICollectible.md)\<`any`, `any`\> | - |
| `TSRC` | `TITEM` |

## Constructors

### Constructor

> **new ConvertingCollector**\<`TITEM`, `TSRC`\>(`params`): `ConvertingCollector`\<`TITEM`, `TSRC`\>

Constructs a new ConvertingCollector.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params` | [`IConvertingCollectorConstructorParams`](../interfaces/IConvertingCollectorConstructorParams.md)\<`TITEM`, `TSRC`\> | Parameters for constructing the collector. |

#### Returns

`ConvertingCollector`\<`TITEM`, `TSRC`\>

#### Overrides

[`Collector`](Collector.md).[`constructor`](Collector.md#constructor)

## Accessors

### size

#### Get Signature

> **get** **size**(): `number`

Returns the number of entries in the map.

##### Returns

`number`

Returns the number of entries in the map.

#### Inherited from

[`Collector`](Collector.md).[`size`](Collector.md#size)

## Methods

### \_buildItem()

> **\_buildItem**(`key`, `itemOrCb`): [`Result`](../../../../type-aliases/Result.md)\<`TITEM`\>

Helper method for derived classes to build an item from a key and a source representation using
a default or supplied factory.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | [`CollectibleKey`](../type-aliases/CollectibleKey.md)\<`TITEM`\> | The key of the item to build. |
| `itemOrCb` | `TSRC` \| [`CollectibleFactoryCallback`](../type-aliases/CollectibleFactoryCallback.md)\<`TITEM`\> | The source representation of the item to build, or a factory callback to create it. |

#### Returns

[`Result`](../../../../type-aliases/Result.md)\<`TITEM`\>

Returns [Success](../../../../classes/Success.md) with the item if it is built, or [Failure](../../../../classes/Failure.md)
with an error if the item cannot be built.

***

### \_isFactoryCB()

> **\_isFactoryCB**(`itemOrCb`): `itemOrCb is CollectibleFactoryCallback<TITEM>`

Helper method for derived classes to determine if a supplied
itemOrCb parameter is a factory callback.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `itemOrCb` | `TSRC` \| [`CollectibleFactoryCallback`](../type-aliases/CollectibleFactoryCallback.md)\<`TITEM`\> | Overloaded parameter is either `CollectibleKey<TITEM>` or a [factory callback](../type-aliases/CollectibleFactoryCallback.md). |

#### Returns

`itemOrCb is CollectibleFactoryCallback<TITEM>`

Returns `true` if the parameter is a factory callback, `false` otherwise.

***

### \_isItem()

> `protected` **\_isItem**(`keyOrItem`): `keyOrItem is TITEM`

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `keyOrItem` | `TITEM` \| [`CollectibleKey`](../type-aliases/CollectibleKey.md)\<`TITEM`\> |

#### Returns

`keyOrItem is TITEM`

#### Inherited from

[`Collector`](Collector.md).[`_isItem`](Collector.md#_isitem)

***

### \_overloadIsItem()

> **\_overloadIsItem**(`keyOrItem`, `itemOrCb?`): `keyOrItem is TITEM`

Helper method for derived classes to determine if a supplied
keyOrItem parameter is an item.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `keyOrItem` | `TITEM` \| [`CollectibleKey`](../type-aliases/CollectibleKey.md)\<`TITEM`\> | Overloaded parameter is either `CollectibleKey<TITEM>` or `TITEM`. |
| `itemOrCb?` | `TSRC` \| [`CollectibleFactoryCallback`](../type-aliases/CollectibleFactoryCallback.md)\<`TITEM`\> | Overloaded parameter is either `TSRC`, a [factory callback](../type-aliases/CollectibleFactoryCallback.md) or `undefined`. |

#### Returns

`keyOrItem is TITEM`

Returns `true` if the parameter is an item, `false` otherwise.

***

### \[iterator\]()

> **\[iterator\]**(): `IterableIterator`\<[`KeyValueEntry`](../type-aliases/KeyValueEntry.md)\<[`CollectibleKey`](../type-aliases/CollectibleKey.md)\<`TITEM`\>, `TITEM`\>\>

Gets an iterator over the map entries.

#### Returns

`IterableIterator`\<[`KeyValueEntry`](../type-aliases/KeyValueEntry.md)\<[`CollectibleKey`](../type-aliases/CollectibleKey.md)\<`TITEM`\>, `TITEM`\>\>

An iterator over the map entries.

#### Inherited from

[`Collector`](Collector.md).[`[iterator]`](Collector.md#iterator)

***

### add()

#### Call Signature

> **add**(`item`): [`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<`TITEM`, [`CollectorResultDetail`](../type-aliases/CollectorResultDetail.md)\>

Adds an item to the collection, failing if a different item with the same key already exists. Note
that adding an object that is already in the collection again will succeed without updating the collection.

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `item` | `TITEM` | The item to add. |

##### Returns

[`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<`TITEM`, [`CollectorResultDetail`](../type-aliases/CollectorResultDetail.md)\>

Returns [Success](../../../../classes/DetailedSuccess.md) with the item and detail `added` if it was added
or detail `exists` if the item was already in the map.  Returns [Failure](../../../../classes/DetailedFailure.md) with
an error message and appropriate detail if the item could not be added.

##### Overrides

[`Collector`](Collector.md).[`add`](Collector.md#add)

#### Call Signature

> **add**(`key`, `item`): [`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<`TITEM`, [`CollectorResultDetail`](../type-aliases/CollectorResultDetail.md)\>

Adds an item to the collector using the default [factory](../type-aliases/CollectibleFactory.md)
at a specified key, failing if an item with that key already exists.

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | [`CollectibleKey`](../type-aliases/CollectibleKey.md)\<`TITEM`\> | The key of the item to add. |
| `item` | `TSRC` | The source representation of the item to be added. |

##### Returns

[`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<`TITEM`, [`CollectorResultDetail`](../type-aliases/CollectorResultDetail.md)\>

Returns [Success](../../../../classes/Success.md) with the item if it is added, or [Failure](../../../../classes/Failure.md) with
an error if the item cannot be created and indexed.

##### Overrides

`Collector.add`

#### Call Signature

> **add**(`key`, `cb`): [`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<`TITEM`, [`CollectorResultDetail`](../type-aliases/CollectorResultDetail.md)\>

Adds an item to the collector using a supplied [factory callback](../type-aliases/CollectibleFactoryCallback.md)
at a specified key, failing if an item with that key already exists or if the created item is invalid.

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | [`CollectibleKey`](../type-aliases/CollectibleKey.md)\<`TITEM`\> | The key of the item to add. |
| `cb` | [`CollectibleFactoryCallback`](../type-aliases/CollectibleFactoryCallback.md)\<`TITEM`\> | The factory callback to create the item. |

##### Returns

[`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<`TITEM`, [`CollectorResultDetail`](../type-aliases/CollectorResultDetail.md)\>

Returns [Success](../../../../classes/Success.md) with the item if it is added, or [Failure](../../../../classes/Failure.md) with
an error if the item cannot be created and indexed.

##### Overrides

`Collector.add`

***

### entries()

> **entries**(): `IterableIterator`\<[`KeyValueEntry`](../type-aliases/KeyValueEntry.md)\<[`CollectibleKey`](../type-aliases/CollectibleKey.md)\<`TITEM`\>, `TITEM`\>\>

Returns an iterator over the map entries.

#### Returns

`IterableIterator`\<[`KeyValueEntry`](../type-aliases/KeyValueEntry.md)\<[`CollectibleKey`](../type-aliases/CollectibleKey.md)\<`TITEM`\>, `TITEM`\>\>

An iterator over the map entries.

#### Inherited from

[`Collector`](Collector.md).[`entries`](Collector.md#entries)

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

#### Inherited from

[`Collector`](Collector.md).[`forEach`](Collector.md#foreach)

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

#### Inherited from

[`Collector`](Collector.md).[`get`](Collector.md#get)

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

#### Inherited from

[`Collector`](Collector.md).[`getAt`](Collector.md#getat)

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

##### Overrides

[`Collector`](Collector.md).[`getOrAdd`](Collector.md#getoradd)

#### Call Signature

> **getOrAdd**(`key`, `callback`): [`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<`TITEM`, [`CollectorResultDetail`](../type-aliases/CollectorResultDetail.md)\>

Gets an existing item with a key matching the supplied key, or adds a new item to the collector
using a factory callback if no item with that key exists.

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | [`CollectibleKey`](../type-aliases/CollectibleKey.md)\<`TITEM`\> | The key of the item to add. |
| `callback` | [`CollectibleFactoryCallback`](../type-aliases/CollectibleFactoryCallback.md)\<`TITEM`\> | The factory callback to create the item. |

##### Returns

[`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<`TITEM`, [`CollectorResultDetail`](../type-aliases/CollectorResultDetail.md)\>

Returns [Success](../../../../classes/DetailedSuccess.md) with the item stored in the collector -
detail `exists` indicates that an existing item return and detail `added` indicates that the
item was added. Returns [Failure](../../../../classes/DetailedFailure.md) with an error and appropriate
detail if the item could not be added.

##### Overrides

[`Collector`](Collector.md).[`getOrAdd`](Collector.md#getoradd)

#### Call Signature

> **getOrAdd**(`key`, `item`): [`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<`TITEM`, [`CollectorResultDetail`](../type-aliases/CollectorResultDetail.md)\>

Gets an item by key if it exists, or creates a new item and adds it using the default [factory](../type-aliases/CollectibleFactory.md) if not.

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | [`CollectibleKey`](../type-aliases/CollectibleKey.md)\<`TITEM`\> | The key of the item to retrieve. |
| `item` | `TSRC` | The source representation of the item to be added if it does not exist. |

##### Returns

[`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<`TITEM`, [`CollectorResultDetail`](../type-aliases/CollectorResultDetail.md)\>

Returns [Success](../../../../classes/Success.md) with the item if it exists or could be created, or [Failure](../../../../classes/Failure.md) with an error if the
item cannot be created and indexed.

##### Overrides

`Collector.getOrAdd`

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

#### Inherited from

[`Collector`](Collector.md).[`has`](Collector.md#has)

***

### keys()

> **keys**(): `IterableIterator`\<[`CollectibleKey`](../type-aliases/CollectibleKey.md)\<`TITEM`\>\>

Returns an iterator over the map keys.

#### Returns

`IterableIterator`\<[`CollectibleKey`](../type-aliases/CollectibleKey.md)\<`TITEM`\>\>

An iterator over the map keys.

#### Inherited from

[`Collector`](Collector.md).[`keys`](Collector.md#keys)

***

### toReadOnly()

> **toReadOnly**(): [`IReadOnlyCollector`](../interfaces/IReadOnlyCollector.md)\<`TITEM`\>

Gets a read-only version of this collector.

#### Returns

[`IReadOnlyCollector`](../interfaces/IReadOnlyCollector.md)\<`TITEM`\>

#### Inherited from

[`Collector`](Collector.md).[`toReadOnly`](Collector.md#toreadonly)

***

### values()

> **values**(): `IterableIterator`\<`TITEM`\>

Returns an iterator over the map values.

#### Returns

`IterableIterator`\<`TITEM`\>

An iterator over the map values.

#### Inherited from

[`Collector`](Collector.md).[`values`](Collector.md#values)

***

### valuesByIndex()

> **valuesByIndex**(): readonly `TITEM`[]

Gets all items in the collection, ordered by index.

#### Returns

readonly `TITEM`[]

An array of items in the collection, ordered by index.

#### Inherited from

[`Collector`](Collector.md).[`valuesByIndex`](Collector.md#valuesbyindex)

***

### createCollector()

> `static` **createCollector**\<`TITEM`\>(`params?`): [`Result`](../../../../type-aliases/Result.md)\<[`Collector`](Collector.md)\<`TITEM`\>\>

Creates a new [Collector](Collector.md) instance.

#### Type Parameters

| Type Parameter |
| ------ |
| `TITEM` *extends* [`ICollectible`](../interfaces/ICollectible.md)\<`any`, `any`\> |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params?` | [`ICollectorConstructorParams`](../interfaces/ICollectorConstructorParams.md)\<`TITEM`\> | Optional [initialization parameters](../interfaces/ICollectorConstructorParams.md) used to create the collector. |

#### Returns

[`Result`](../../../../type-aliases/Result.md)\<[`Collector`](Collector.md)\<`TITEM`\>\>

Returns [Success](../../../../classes/Success.md) with the new collector if it was created successfully,
or [Failure](../../../../classes/Failure.md) with an error if the collector could not be created.

#### Inherited from

[`Collector`](Collector.md).[`createCollector`](Collector.md#createcollector)

***

### createConvertingCollector()

> `static` **createConvertingCollector**\<`TITEM`, `TSRC`\>(`params`): [`Result`](../../../../type-aliases/Result.md)\<`ConvertingCollector`\<`TITEM`, `TSRC`\>\>

Creates a new ConvertingCollector.

#### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TITEM` *extends* [`ICollectible`](../interfaces/ICollectible.md)\<`any`, `any`\> | - |
| `TSRC` | `TITEM` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params` | [`IConvertingCollectorConstructorParams`](../interfaces/IConvertingCollectorConstructorParams.md)\<`TITEM`, `TSRC`\> | Required parameters for constructing the collector. |

#### Returns

[`Result`](../../../../type-aliases/Result.md)\<`ConvertingCollector`\<`TITEM`, `TSRC`\>\>

Returns [Success](../../../../classes/Success.md) with the new collector if it is created, or [Failure](../../../../classes/Failure.md)
with an error if the collector cannot be created.
