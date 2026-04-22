[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [Qualifiers](../README.md) / QualifierCollector

# Class: QualifierCollector

Collects [Qualifiers](../../../classes/Qualifier.md) from [declarations](../interfaces/IQualifierDecl.md),
with strongly-typed ([QualifierName](../../../type-aliases/QualifierName.md) and [QualifierIndex](../../../type-aliases/QualifierIndex.md)) key
and index.

## Extends

- [`ValidatingConvertingCollector`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`Qualifier`](../../../classes/Qualifier.md), [`IQualifierDecl`](../interfaces/IQualifierDecl.md)\>

## Implements

- [`IReadOnlyQualifierCollector`](../interfaces/IReadOnlyQualifierCollector.md)

## Constructors

### Constructor

> `protected` **new QualifierCollector**(`params`): `QualifierCollector`

Constructor for a QualifierCollector object.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params` | [`IQualifierCollectorCreateParams`](../interfaces/IQualifierCollectorCreateParams.md) | Parameters for creating the collector. |

#### Returns

`QualifierCollector`

#### Overrides

`ValidatingConvertingCollector<Qualifier, IQualifierDecl>.constructor`

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="_converters"></a> `_converters` | `readonly` | [`KeyValueConverters`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`QualifierName`](../../../type-aliases/QualifierName.md), [`IQualifierDecl`](../interfaces/IQualifierDecl.md)\> | - |
| <a id="qualifiertypes"></a> `qualifierTypes` | `public` | [`ReadOnlyQualifierTypeCollector`](../../QualifierTypes/type-aliases/ReadOnlyQualifierTypeCollector.md) | The [qualifier types](../../QualifierTypes/classes/QualifierTypeCollector.md) that this collector uses. |
| <a id="validating"></a> `validating` | `readonly` | [`ConvertingCollectorValidator`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`Qualifier`](../../../classes/Qualifier.md), [`IQualifierDecl`](../interfaces/IQualifierDecl.md)\> | A [ConvertingCollectorValidator](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) which validates keys and values before inserting them into this collector. |

## Accessors

### size

#### Get Signature

> **get** **size**(): `number`

Returns the number of entries in the map.

##### Returns

`number`

Returns the number of entries in the map.

#### Implementation of

[`IReadOnlyQualifierCollector`](../interfaces/IReadOnlyQualifierCollector.md).[`size`](../interfaces/IReadOnlyQualifierCollector.md#size)

#### Inherited from

`ValidatingConvertingCollector.size`

## Methods

### \_buildItem()

> **\_buildItem**(`key`, `itemOrCb`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`Qualifier`](../../../classes/Qualifier.md)\>

Helper method for derived classes to build an item from a key and a source representation using
a default or supplied factory.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | [`QualifierName`](../../../type-aliases/QualifierName.md) | The key of the item to build. |
| `itemOrCb` | [`IQualifierDecl`](../interfaces/IQualifierDecl.md) \| [`CollectibleFactoryCallback`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`Qualifier`](../../../classes/Qualifier.md)\> | The source representation of the item to build, or a factory callback to create it. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`Qualifier`](../../../classes/Qualifier.md)\>

Returns [Success](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) with the item if it is built, or [Failure](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)
with an error if the item cannot be built.

#### Inherited from

`ValidatingConvertingCollector._buildItem`

***

### \_isFactoryCB()

> **\_isFactoryCB**(`itemOrCb`): `itemOrCb is CollectibleFactoryCallback<Qualifier>`

Helper method for derived classes to determine if a supplied
itemOrCb parameter is a factory callback.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `itemOrCb` | [`IQualifierDecl`](../interfaces/IQualifierDecl.md) \| [`CollectibleFactoryCallback`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`Qualifier`](../../../classes/Qualifier.md)\> | Overloaded parameter is either `CollectibleKey<TITEM>` or a [factory callback](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs). |

#### Returns

`itemOrCb is CollectibleFactoryCallback<Qualifier>`

Returns `true` if the parameter is a factory callback, `false` otherwise.

#### Inherited from

`ValidatingConvertingCollector._isFactoryCB`

***

### \_isItem()

> `protected` **\_isItem**(`keyOrItem`): `keyOrItem is Qualifier`

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `keyOrItem` | [`QualifierName`](../../../type-aliases/QualifierName.md) \| [`Qualifier`](../../../classes/Qualifier.md) |

#### Returns

`keyOrItem is Qualifier`

#### Inherited from

`ValidatingConvertingCollector._isItem`

***

### \_overloadIsItem()

> **\_overloadIsItem**(`keyOrItem`, `itemOrCb?`): `keyOrItem is Qualifier`

Helper method for derived classes to determine if a supplied
keyOrItem parameter is an item.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `keyOrItem` | [`QualifierName`](../../../type-aliases/QualifierName.md) \| [`Qualifier`](../../../classes/Qualifier.md) | Overloaded parameter is either `CollectibleKey<TITEM>` or `TITEM`. |
| `itemOrCb?` | [`IQualifierDecl`](../interfaces/IQualifierDecl.md) \| [`CollectibleFactoryCallback`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`Qualifier`](../../../classes/Qualifier.md)\> | Overloaded parameter is either `TSRC`, a [factory callback](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) or `undefined`. |

#### Returns

`keyOrItem is Qualifier`

Returns `true` if the parameter is an item, `false` otherwise.

#### Inherited from

`ValidatingConvertingCollector._overloadIsItem`

***

### \_qualifierFactory()

> **\_qualifierFactory**(`__key`, `index`, `decl`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`Qualifier`](../../../classes/Qualifier.md)\>

Factory method for creating a [Qualifier](../../../classes/Qualifier.md) from a [declaration](../interfaces/IQualifierDecl.md).

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `__key` | [`QualifierName`](../../../type-aliases/QualifierName.md) | The key for the qualifier. |
| `index` | `number` | The index of the qualifier. |
| `decl` | [`IQualifierDecl`](../interfaces/IQualifierDecl.md) | The [declaration](../interfaces/IQualifierDecl.md) for the qualifier. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`Qualifier`](../../../classes/Qualifier.md)\>

`Success` with the new [Qualifier](../../../classes/Qualifier.md) if successful, or `Failure` if not.

***

### \[iterator\]()

> **\[iterator\]**(): `IterableIterator`\<[`KeyValueEntry`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`QualifierName`](../../../type-aliases/QualifierName.md), [`Qualifier`](../../../classes/Qualifier.md)\>\>

Gets an iterator over the map entries.

#### Returns

`IterableIterator`\<[`KeyValueEntry`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`QualifierName`](../../../type-aliases/QualifierName.md), [`Qualifier`](../../../classes/Qualifier.md)\>\>

An iterator over the map entries.

#### Implementation of

[`IReadOnlyQualifierCollector`](../interfaces/IReadOnlyQualifierCollector.md).[`[iterator]`](../interfaces/IReadOnlyQualifierCollector.md#iterator)

#### Inherited from

`ValidatingConvertingCollector.[iterator]`

***

### add()

#### Call Signature

> **add**(`item`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`Qualifier`](../../../classes/Qualifier.md), [`CollectorResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

Adds an item to the collection, failing if a different item with the same key already exists. Note
that adding an object that is already in the collection again will succeed without updating the collection.

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `item` | [`Qualifier`](../../../classes/Qualifier.md) | The item to add. |

##### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`Qualifier`](../../../classes/Qualifier.md), [`CollectorResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

Returns [Success](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) with the item and detail `added` if it was added
or detail `exists` if the item was already in the map.  Returns [Failure](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) with
an error message and appropriate detail if the item could not be added.

##### Inherited from

`ValidatingConvertingCollector.add`

#### Call Signature

> **add**(`key`, `item`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`Qualifier`](../../../classes/Qualifier.md), [`CollectorResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

Adds an item to the collector using the default [factory](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)
at a specified key, failing if an item with that key already exists.

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | [`QualifierName`](../../../type-aliases/QualifierName.md) | The key of the item to add. |
| `item` | [`IQualifierDecl`](../interfaces/IQualifierDecl.md) | The source representation of the item to be added. |

##### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`Qualifier`](../../../classes/Qualifier.md), [`CollectorResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

Returns [Success](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) with the item if it is added, or [Failure](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) with
an error if the item cannot be created and indexed.

##### Inherited from

`ValidatingConvertingCollector.add`

#### Call Signature

> **add**(`key`, `cb`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`Qualifier`](../../../classes/Qualifier.md), [`CollectorResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

Adds an item to the collector using a supplied [factory callback](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)
at a specified key, failing if an item with that key already exists or if the created item is invalid.

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | [`QualifierName`](../../../type-aliases/QualifierName.md) | The key of the item to add. |
| `cb` | [`CollectibleFactoryCallback`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`Qualifier`](../../../classes/Qualifier.md)\> | The factory callback to create the item. |

##### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`Qualifier`](../../../classes/Qualifier.md), [`CollectorResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

Returns [Success](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) with the item if it is added, or [Failure](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) with
an error if the item cannot be created and indexed.

##### Inherited from

`ValidatingConvertingCollector.add`

***

### entries()

> **entries**(): `IterableIterator`\<[`KeyValueEntry`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`QualifierName`](../../../type-aliases/QualifierName.md), [`Qualifier`](../../../classes/Qualifier.md)\>\>

Returns an iterator over the map entries.

#### Returns

`IterableIterator`\<[`KeyValueEntry`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`QualifierName`](../../../type-aliases/QualifierName.md), [`Qualifier`](../../../classes/Qualifier.md)\>\>

An iterator over the map entries.

#### Implementation of

[`IReadOnlyQualifierCollector`](../interfaces/IReadOnlyQualifierCollector.md).[`entries`](../interfaces/IReadOnlyQualifierCollector.md#entries)

#### Inherited from

`ValidatingConvertingCollector.entries`

***

### forEach()

> **forEach**(`callback`, `arg?`): `void`

Calls a function for each entry in the map.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `callback` | [`ResultMapForEachCb`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`QualifierName`](../../../type-aliases/QualifierName.md), [`Qualifier`](../../../classes/Qualifier.md)\> | The function to call for each entry. |
| `arg?` | `unknown` | An optional argument to pass to the callback. |

#### Returns

`void`

#### Implementation of

[`IReadOnlyQualifierCollector`](../interfaces/IReadOnlyQualifierCollector.md).[`forEach`](../interfaces/IReadOnlyQualifierCollector.md#foreach)

#### Inherited from

`ValidatingConvertingCollector.forEach`

***

### get()

> **get**(`key`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`Qualifier`](../../../classes/Qualifier.md), [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

Gets a value by key.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | [`QualifierName`](../../../type-aliases/QualifierName.md) | The key to look up. |

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`Qualifier`](../../../classes/Qualifier.md), [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

Returns [Success](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) with the value and detail `exists` if found,
or [Failure](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) with detail `not-found` if the key does not exist.

#### Implementation of

[`IReadOnlyQualifierCollector`](../interfaces/IReadOnlyQualifierCollector.md).[`get`](../interfaces/IReadOnlyQualifierCollector.md#get)

#### Inherited from

`ValidatingConvertingCollector.get`

***

### getAt()

> **getAt**(`index`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`Qualifier`](../../../classes/Qualifier.md)\>

Gets the item at a specified index.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `index` | `number` | The index of the item to retrieve. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`Qualifier`](../../../classes/Qualifier.md)\>

Returns [Success](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) with the item if it exists, or [Failure](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)
with an error if the index is out of range.

#### Implementation of

[`IReadOnlyQualifierCollector`](../interfaces/IReadOnlyQualifierCollector.md).[`getAt`](../interfaces/IReadOnlyQualifierCollector.md#getat)

#### Inherited from

`ValidatingConvertingCollector.getAt`

***

### getByNameOrToken()

> **getByNameOrToken**(`nameOrToken`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`Qualifier`](../../../classes/Qualifier.md)\>

Gets a [qualifier](../../../classes/Qualifier.md) by name or token.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `nameOrToken` | `string` | The name or token of the qualifier to retrieve. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`Qualifier`](../../../classes/Qualifier.md)\>

`Success` with the qualifier if found, or `Failure` if not.

#### Implementation of

[`IReadOnlyQualifierCollector`](../interfaces/IReadOnlyQualifierCollector.md).[`getByNameOrToken`](../interfaces/IReadOnlyQualifierCollector.md#getbynameortoken)

***

### getOrAdd()

#### Call Signature

> **getOrAdd**(`item`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`Qualifier`](../../../classes/Qualifier.md), [`CollectorResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

Gets an existing item with a key matching that of the supplied item, or adds the supplied
item to the collector if no item with that key exists.

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `item` | [`Qualifier`](../../../classes/Qualifier.md) | The item to get or add. |

##### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`Qualifier`](../../../classes/Qualifier.md), [`CollectorResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

Returns [Success](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) with the item stored in the collector -
detail `exists` indicates that an existing item was returned and detail `added` indicates
that the item was added. Returns [Failure](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) with an error and
appropriate detail if the item could not be added.

##### Inherited from

`ValidatingConvertingCollector.getOrAdd`

#### Call Signature

> **getOrAdd**(`key`, `callback`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`Qualifier`](../../../classes/Qualifier.md), [`CollectorResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

Gets an existing item with a key matching the supplied key, or adds a new item to the collector
using a factory callback if no item with that key exists.

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | [`QualifierName`](../../../type-aliases/QualifierName.md) | The key of the item to get or add. |
| `callback` | [`CollectibleFactoryCallback`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`Qualifier`](../../../classes/Qualifier.md)\> | The factory callback to create the item. |

##### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`Qualifier`](../../../classes/Qualifier.md), [`CollectorResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

Returns [Success](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) with the item stored in the collector -
detail `exists` indicates that an existing item was returned and detail `added` indicates
that the item was added. Returns [Failure](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) with an error and
appropriate detail if the item could not be added.

##### Inherited from

`ValidatingConvertingCollector.getOrAdd`

#### Call Signature

> **getOrAdd**(`key`, `item`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`Qualifier`](../../../classes/Qualifier.md), [`CollectorResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

Gets an item by key if it exists, or creates a new item and adds it using the default [factory](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) if not.

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | [`QualifierName`](../../../type-aliases/QualifierName.md) | The key of the item to retrieve. |
| `item` | [`IQualifierDecl`](../interfaces/IQualifierDecl.md) | The source representation of the item to be added if it does not exist. |

##### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`Qualifier`](../../../classes/Qualifier.md), [`CollectorResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

Returns [Success](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) with the item if it exists or could be created, or [Failure](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) with an error if the
item cannot be created and indexed.

##### Inherited from

`ValidatingConvertingCollector.getOrAdd`

***

### has()

> **has**(`key`): `boolean`

Returns true if the map contains an entry with the given key.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | [`QualifierName`](../../../type-aliases/QualifierName.md) | The key to check for. |

#### Returns

`boolean`

`true` if the key exists, `false` otherwise.

#### Implementation of

[`IReadOnlyQualifierCollector`](../interfaces/IReadOnlyQualifierCollector.md).[`has`](../interfaces/IReadOnlyQualifierCollector.md#has)

#### Inherited from

`ValidatingConvertingCollector.has`

***

### hasNameOrToken()

> **hasNameOrToken**(`nameOrToken`): `boolean`

Checks if a qualifier with a given name or token is in the collection.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `nameOrToken` | `string` | The name or token of the qualifier to check. |

#### Returns

`boolean`

`true` if the qualifier is in the collection, `false` if not.

#### Implementation of

[`IReadOnlyQualifierCollector`](../interfaces/IReadOnlyQualifierCollector.md).[`hasNameOrToken`](../interfaces/IReadOnlyQualifierCollector.md#hasnameortoken)

***

### keys()

> **keys**(): `IterableIterator`\<[`QualifierName`](../../../type-aliases/QualifierName.md)\>

Returns an iterator over the map keys.

#### Returns

`IterableIterator`\<[`QualifierName`](../../../type-aliases/QualifierName.md)\>

An iterator over the map keys.

#### Implementation of

[`IReadOnlyQualifierCollector`](../interfaces/IReadOnlyQualifierCollector.md).[`keys`](../interfaces/IReadOnlyQualifierCollector.md#keys)

#### Inherited from

`ValidatingConvertingCollector.keys`

***

### toReadOnly()

> **toReadOnly**(): [`IReadOnlyQualifierCollector`](../interfaces/IReadOnlyQualifierCollector.md)

Gets a read-only view of this collector.

#### Returns

[`IReadOnlyQualifierCollector`](../interfaces/IReadOnlyQualifierCollector.md)

A read-only view of this collector.

#### Overrides

`ValidatingConvertingCollector.toReadOnly`

***

### values()

> **values**(): `IterableIterator`\<[`Qualifier`](../../../classes/Qualifier.md)\>

Returns an iterator over the map values.

#### Returns

`IterableIterator`\<[`Qualifier`](../../../classes/Qualifier.md)\>

An iterator over the map values.

#### Implementation of

[`IReadOnlyQualifierCollector`](../interfaces/IReadOnlyQualifierCollector.md).[`values`](../interfaces/IReadOnlyQualifierCollector.md#values)

#### Inherited from

`ValidatingConvertingCollector.values`

***

### valuesByIndex()

> **valuesByIndex**(): readonly [`Qualifier`](../../../classes/Qualifier.md)[]

Gets all items in the collection, ordered by index.

#### Returns

readonly [`Qualifier`](../../../classes/Qualifier.md)[]

An array of items in the collection, ordered by index.

#### Implementation of

[`IReadOnlyQualifierCollector`](../interfaces/IReadOnlyQualifierCollector.md).[`valuesByIndex`](../interfaces/IReadOnlyQualifierCollector.md#valuesbyindex)

#### Inherited from

`ValidatingConvertingCollector.valuesByIndex`

***

### create()

> `static` **create**(`params`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`QualifierCollector`\>

Creates a new QualifierCollector object.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params` | [`IQualifierCollectorCreateParams`](../interfaces/IQualifierCollectorCreateParams.md) | [Parameters](../interfaces/IQualifierCollectorCreateParams.md) for creating a new QualifierCollector. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`QualifierCollector`\>

`Success` with the new collector if successful, or `Failure` if not.

***

### createCollector()

> `static` **createCollector**\<`TITEM`\>(`params?`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`Collector`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TITEM`\>\>

Creates a new [Collector](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) instance.

#### Type Parameters

| Type Parameter |
| ------ |
| `TITEM` *extends* [`ICollectible`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`any`, `any`\> |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params?` | [`ICollectorConstructorParams`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TITEM`\> | Optional [initialization parameters](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) used to create the collector. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`Collector`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TITEM`\>\>

Returns [Success](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) with the new collector if it was created successfully,
or [Failure](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) with an error if the collector could not be created.

#### Inherited from

`ValidatingConvertingCollector.createCollector`

***

### createConvertingCollector()

> `static` **createConvertingCollector**\<`TITEM`, `TSRC`\>(`params`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ConvertingCollector`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TITEM`, `TSRC`\>\>

Creates a new [ConvertingCollector](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs).

#### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TITEM` *extends* [`ICollectible`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`any`, `any`\> | - |
| `TSRC` | `TITEM` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params` | [`IConvertingCollectorConstructorParams`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TITEM`, `TSRC`\> | Required parameters for constructing the collector. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ConvertingCollector`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TITEM`, `TSRC`\>\>

Returns [Success](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) with the new collector if it is created, or [Failure](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)
with an error if the collector cannot be created.

#### Inherited from

`ValidatingConvertingCollector.createConvertingCollector`

***

### createValidatingCollector()

> `static` **createValidatingCollector**\<`TITEM`, `TSRC`\>(`params`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ValidatingConvertingCollector`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TITEM`, `TSRC`\>\>

Creates a new [ValidatingConvertingCollector](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) instance from
the supplied [parameters](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs).

#### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TITEM` *extends* [`ICollectible`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`any`, `any`\> | - |
| `TSRC` | `TITEM` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params` | [`IValidatingConvertingCollectorConstructorParams`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TITEM`, `TSRC`\> | Required parameters for constructing the collector. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ValidatingConvertingCollector`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TITEM`, `TSRC`\>\>

Success with the new collector if successful, [Failure](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) otherwise.

#### Inherited from

`ValidatingConvertingCollector.createValidatingCollector`
