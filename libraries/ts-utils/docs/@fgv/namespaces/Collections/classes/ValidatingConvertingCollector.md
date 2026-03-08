[**@fgv/ts-utils**](../../../../README.md)

***

[@fgv/ts-utils](../../../../README.md) / [Collections](../README.md) / ValidatingConvertingCollector

# Class: ValidatingConvertingCollector\<TITEM, TSRC\>

A [ConvertingCollector](ConvertingCollector.md) with a
[ConvertingCollectorValidator](ConvertingCollectorValidator.md)
property that enables validated use of the underlying map with weakly-typed keys and values.

## Extends

- [`ConvertingCollector`](ConvertingCollector.md)\<`TITEM`, `TSRC`\>

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TITEM` *extends* [`ICollectible`](../interfaces/ICollectible.md)\<`any`, `any`\> | - |
| `TSRC` | `TITEM` |

## Constructors

### Constructor

> **new ValidatingConvertingCollector**\<`TITEM`, `TSRC`\>(`params`): `ValidatingConvertingCollector`\<`TITEM`, `TSRC`\>

Constructs a new ValidatingConvertingCollector
from the supplied [parameters](../interfaces/IValidatingConvertingCollectorConstructorParams.md).

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params` | [`IValidatingConvertingCollectorConstructorParams`](../interfaces/IValidatingConvertingCollectorConstructorParams.md)\<`TITEM`, `TSRC`\> | Required parameters for constructing the collector. |

#### Returns

`ValidatingConvertingCollector`\<`TITEM`, `TSRC`\>

#### Overrides

[`ConvertingCollector`](ConvertingCollector.md).[`constructor`](ConvertingCollector.md#constructor)

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="_converters"></a> `_converters` | `readonly` | [`KeyValueConverters`](KeyValueConverters.md)\<[`CollectibleKey`](../type-aliases/CollectibleKey.md)\<`TITEM`\>, `TSRC`\> | - |
| <a id="validating"></a> `validating` | `readonly` | [`ConvertingCollectorValidator`](ConvertingCollectorValidator.md)\<`TITEM`, `TSRC`\> | A [ConvertingCollectorValidator](ConvertingCollectorValidator.md) which validates keys and values before inserting them into this collector. |

## Accessors

### size

#### Get Signature

> **get** **size**(): `number`

Returns the number of entries in the map.

##### Returns

`number`

Returns the number of entries in the map.

#### Inherited from

[`ConvertingCollector`](ConvertingCollector.md).[`size`](ConvertingCollector.md#size)

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

#### Inherited from

[`ConvertingCollector`](ConvertingCollector.md).[`_buildItem`](ConvertingCollector.md#_builditem)

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

#### Inherited from

[`ConvertingCollector`](ConvertingCollector.md).[`_isFactoryCB`](ConvertingCollector.md#_isfactorycb)

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

[`ConvertingCollector`](ConvertingCollector.md).[`_isItem`](ConvertingCollector.md#_isitem)

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

#### Inherited from

[`ConvertingCollector`](ConvertingCollector.md).[`_overloadIsItem`](ConvertingCollector.md#_overloadisitem)

***

### \[iterator\]()

> **\[iterator\]**(): `IterableIterator`\<[`KeyValueEntry`](../type-aliases/KeyValueEntry.md)\<[`CollectibleKey`](../type-aliases/CollectibleKey.md)\<`TITEM`\>, `TITEM`\>\>

Gets an iterator over the map entries.

#### Returns

`IterableIterator`\<[`KeyValueEntry`](../type-aliases/KeyValueEntry.md)\<[`CollectibleKey`](../type-aliases/CollectibleKey.md)\<`TITEM`\>, `TITEM`\>\>

An iterator over the map entries.

#### Inherited from

[`ConvertingCollector`](ConvertingCollector.md).[`[iterator]`](ConvertingCollector.md#iterator)

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

##### Inherited from

[`ConvertingCollector`](ConvertingCollector.md).[`add`](ConvertingCollector.md#add)

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

##### Inherited from

[`ConvertingCollector`](ConvertingCollector.md).[`add`](ConvertingCollector.md#add)

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

##### Inherited from

[`ConvertingCollector`](ConvertingCollector.md).[`add`](ConvertingCollector.md#add)

***

### entries()

> **entries**(): `IterableIterator`\<[`KeyValueEntry`](../type-aliases/KeyValueEntry.md)\<[`CollectibleKey`](../type-aliases/CollectibleKey.md)\<`TITEM`\>, `TITEM`\>\>

Returns an iterator over the map entries.

#### Returns

`IterableIterator`\<[`KeyValueEntry`](../type-aliases/KeyValueEntry.md)\<[`CollectibleKey`](../type-aliases/CollectibleKey.md)\<`TITEM`\>, `TITEM`\>\>

An iterator over the map entries.

#### Inherited from

[`ConvertingCollector`](ConvertingCollector.md).[`entries`](ConvertingCollector.md#entries)

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

[`ConvertingCollector`](ConvertingCollector.md).[`forEach`](ConvertingCollector.md#foreach)

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

[`ConvertingCollector`](ConvertingCollector.md).[`get`](ConvertingCollector.md#get)

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

[`ConvertingCollector`](ConvertingCollector.md).[`getAt`](ConvertingCollector.md#getat)

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

##### Inherited from

[`ConvertingCollector`](ConvertingCollector.md).[`getOrAdd`](ConvertingCollector.md#getoradd)

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

##### Inherited from

[`ConvertingCollector`](ConvertingCollector.md).[`getOrAdd`](ConvertingCollector.md#getoradd)

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

##### Inherited from

[`ConvertingCollector`](ConvertingCollector.md).[`getOrAdd`](ConvertingCollector.md#getoradd)

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

[`ConvertingCollector`](ConvertingCollector.md).[`has`](ConvertingCollector.md#has)

***

### keys()

> **keys**(): `IterableIterator`\<[`CollectibleKey`](../type-aliases/CollectibleKey.md)\<`TITEM`\>\>

Returns an iterator over the map keys.

#### Returns

`IterableIterator`\<[`CollectibleKey`](../type-aliases/CollectibleKey.md)\<`TITEM`\>\>

An iterator over the map keys.

#### Inherited from

[`ConvertingCollector`](ConvertingCollector.md).[`keys`](ConvertingCollector.md#keys)

***

### toReadOnly()

> **toReadOnly**(): [`IReadOnlyValidatingCollector`](../interfaces/IReadOnlyValidatingCollector.md)\<`TITEM`\>

Gets a read-only version of this collector as a
[read-only map](../interfaces/IReadOnlyValidatingResultMap.md).

#### Returns

[`IReadOnlyValidatingCollector`](../interfaces/IReadOnlyValidatingCollector.md)\<`TITEM`\>

#### Overrides

[`ConvertingCollector`](ConvertingCollector.md).[`toReadOnly`](ConvertingCollector.md#toreadonly)

***

### values()

> **values**(): `IterableIterator`\<`TITEM`\>

Returns an iterator over the map values.

#### Returns

`IterableIterator`\<`TITEM`\>

An iterator over the map values.

#### Inherited from

[`ConvertingCollector`](ConvertingCollector.md).[`values`](ConvertingCollector.md#values)

***

### valuesByIndex()

> **valuesByIndex**(): readonly `TITEM`[]

Gets all items in the collection, ordered by index.

#### Returns

readonly `TITEM`[]

An array of items in the collection, ordered by index.

#### Inherited from

[`ConvertingCollector`](ConvertingCollector.md).[`valuesByIndex`](ConvertingCollector.md#valuesbyindex)

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

[`ConvertingCollector`](ConvertingCollector.md).[`createCollector`](ConvertingCollector.md#createcollector)

***

### createConvertingCollector()

> `static` **createConvertingCollector**\<`TITEM`, `TSRC`\>(`params`): [`Result`](../../../../type-aliases/Result.md)\<[`ConvertingCollector`](ConvertingCollector.md)\<`TITEM`, `TSRC`\>\>

Creates a new [ConvertingCollector](ConvertingCollector.md).

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

[`Result`](../../../../type-aliases/Result.md)\<[`ConvertingCollector`](ConvertingCollector.md)\<`TITEM`, `TSRC`\>\>

Returns [Success](../../../../classes/Success.md) with the new collector if it is created, or [Failure](../../../../classes/Failure.md)
with an error if the collector cannot be created.

#### Inherited from

[`ConvertingCollector`](ConvertingCollector.md).[`createConvertingCollector`](ConvertingCollector.md#createconvertingcollector)

***

### createValidatingCollector()

> `static` **createValidatingCollector**\<`TITEM`, `TSRC`\>(`params`): [`Result`](../../../../type-aliases/Result.md)\<`ValidatingConvertingCollector`\<`TITEM`, `TSRC`\>\>

Creates a new ValidatingConvertingCollector instance from
the supplied [parameters](../interfaces/IValidatingConvertingCollectorConstructorParams.md).

#### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TITEM` *extends* [`ICollectible`](../interfaces/ICollectible.md)\<`any`, `any`\> | - |
| `TSRC` | `TITEM` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params` | [`IValidatingConvertingCollectorConstructorParams`](../interfaces/IValidatingConvertingCollectorConstructorParams.md)\<`TITEM`, `TSRC`\> | Required parameters for constructing the collector. |

#### Returns

[`Result`](../../../../type-aliases/Result.md)\<`ValidatingConvertingCollector`\<`TITEM`, `TSRC`\>\>

[Success](../../../../classes/Success.md) with the new collector if successful, [Failure](../../../../classes/Failure.md) otherwise.
