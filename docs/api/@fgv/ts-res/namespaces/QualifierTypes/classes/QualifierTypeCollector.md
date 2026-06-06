[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [QualifierTypes](../README.md) / QualifierTypeCollector

# Class: QualifierTypeCollector

Collector for [QualifierType](../../../classes/QualifierType.md) objects.

## Extends

- [`ValidatingConvertingCollector`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`QualifierType`](../../../classes/QualifierType.md), [`QualifierType`](../../../classes/QualifierType.md)\>

## Constructors

### Constructor

> `protected` **new QualifierTypeCollector**(`params`): `QualifierTypeCollector`

Constructor for a QualifierTypeCollector object.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params` | [`IQualifierTypeCollectorCreateParams`](../interfaces/IQualifierTypeCollectorCreateParams.md) | Optional [parameters](../interfaces/IQualifierTypeCollectorCreateParams.md) used to construct the collector. |

#### Returns

`QualifierTypeCollector`

#### Overrides

`ValidatingConvertingCollector<QualifierType, QualifierType>.constructor`

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="_converters"></a> `_converters` | `readonly` | [`KeyValueConverters`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`QualifierTypeName`](../../../type-aliases/QualifierTypeName.md), [`QualifierType`](../../../classes/QualifierType.md)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\>\> | - |
| <a id="validating"></a> `validating` | `readonly` | [`ConvertingCollectorValidator`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`QualifierType`](../../../classes/QualifierType.md)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\>, [`QualifierType`](../../../classes/QualifierType.md)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\>\> | A [ConvertingCollectorValidator](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) which validates keys and values before inserting them into this collector. |

## Accessors

### size

#### Get Signature

> **get** **size**(): `number`

Returns the number of entries in the map.

##### Returns

`number`

#### Inherited from

`ValidatingConvertingCollector.size`

## Methods

### \_buildItem()

> **\_buildItem**(`key`, `itemOrCb`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`QualifierType`](../../../classes/QualifierType.md)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\>\>

Helper method for derived classes to build an item from a key and a source representation using
a default or supplied factory.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | [`QualifierTypeName`](../../../type-aliases/QualifierTypeName.md) | The key of the item to build. |
| `itemOrCb` | [`QualifierType`](../../../classes/QualifierType.md)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\> \| [`CollectibleFactoryCallback`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`QualifierType`](../../../classes/QualifierType.md)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\>\> | The source representation of the item to build, or a factory callback to create it. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`QualifierType`](../../../classes/QualifierType.md)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\>\>

Returns [Success](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) with the item if it is built, or [Failure](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)
with an error if the item cannot be built.

#### Inherited from

`ValidatingConvertingCollector._buildItem`

***

### \_isFactoryCB()

> **\_isFactoryCB**(`itemOrCb`): `itemOrCb is CollectibleFactoryCallback<QualifierType<JsonObject>>`

Helper method for derived classes to determine if a supplied
itemOrCb parameter is a factory callback.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `itemOrCb` | [`QualifierType`](../../../classes/QualifierType.md)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\> \| [`CollectibleFactoryCallback`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`QualifierType`](../../../classes/QualifierType.md)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\>\> | Overloaded parameter is either `CollectibleKey<TITEM>` or a [factory callback](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs). |

#### Returns

`itemOrCb is CollectibleFactoryCallback<QualifierType<JsonObject>>`

Returns `true` if the parameter is a factory callback, `false` otherwise.

#### Inherited from

`ValidatingConvertingCollector._isFactoryCB`

***

### \_isItem()

> `protected` **\_isItem**(`keyOrItem`): `keyOrItem is QualifierType<JsonObject>`

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `keyOrItem` | [`QualifierTypeName`](../../../type-aliases/QualifierTypeName.md) \| [`QualifierType`](../../../classes/QualifierType.md)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\> |

#### Returns

`keyOrItem is QualifierType<JsonObject>`

#### Inherited from

`ValidatingConvertingCollector._isItem`

***

### \_overloadIsItem()

> **\_overloadIsItem**(`keyOrItem`, `itemOrCb?`): `keyOrItem is QualifierType<JsonObject>`

Helper method for derived classes to determine if a supplied
keyOrItem parameter is an item.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `keyOrItem` | [`QualifierTypeName`](../../../type-aliases/QualifierTypeName.md) \| [`QualifierType`](../../../classes/QualifierType.md)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\> | Overloaded parameter is either `CollectibleKey<TITEM>` or `TITEM`. |
| `itemOrCb?` | [`QualifierType`](../../../classes/QualifierType.md)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\> \| [`CollectibleFactoryCallback`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`QualifierType`](../../../classes/QualifierType.md)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\>\> | Overloaded parameter is either `TSRC`, a [factory callback](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) or `undefined`. |

#### Returns

`keyOrItem is QualifierType<JsonObject>`

Returns `true` if the parameter is an item, `false` otherwise.

#### Inherited from

`ValidatingConvertingCollector._overloadIsItem`

***

### \[iterator\]()

> **\[iterator\]**(): `IterableIterator`\<[`KeyValueEntry`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`QualifierTypeName`](../../../type-aliases/QualifierTypeName.md), [`QualifierType`](../../../classes/QualifierType.md)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\>\>\>

Gets an iterator over the map entries.

#### Returns

`IterableIterator`\<[`KeyValueEntry`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`QualifierTypeName`](../../../type-aliases/QualifierTypeName.md), [`QualifierType`](../../../classes/QualifierType.md)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\>\>\>

An iterator over the map entries.

#### Inherited from

`ValidatingConvertingCollector.[iterator]`

***

### add()

#### Call Signature

> **add**(`item`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`QualifierType`](../../../classes/QualifierType.md)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\>, [`CollectorResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

Adds an item to the collection, failing if a different item with the same key already exists. Note
that adding an object that is already in the collection again will succeed without updating the collection.

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `item` | [`QualifierType`](../../../classes/QualifierType.md) | The item to add. |

##### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`QualifierType`](../../../classes/QualifierType.md)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\>, [`CollectorResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

Returns [Success](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) with the item and detail `added` if it was added
or detail `exists` if the item was already in the map.  Returns [Failure](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) with
an error message and appropriate detail if the item could not be added.

##### Inherited from

`ValidatingConvertingCollector.add`

#### Call Signature

> **add**(`key`, `item`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`QualifierType`](../../../classes/QualifierType.md)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\>, [`CollectorResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

Adds an item to the collector using the default [factory](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)
at a specified key, failing if an item with that key already exists.

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | [`QualifierTypeName`](../../../type-aliases/QualifierTypeName.md) | The key of the item to add. |
| `item` | [`QualifierType`](../../../classes/QualifierType.md) | The source representation of the item to be added. |

##### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`QualifierType`](../../../classes/QualifierType.md)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\>, [`CollectorResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

Returns [Success](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) with the item if it is added, or [Failure](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) with
an error if the item cannot be created and indexed.

##### Inherited from

`ValidatingConvertingCollector.add`

#### Call Signature

> **add**(`key`, `cb`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`QualifierType`](../../../classes/QualifierType.md)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\>, [`CollectorResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

Adds an item to the collector using a supplied [factory callback](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)
at a specified key, failing if an item with that key already exists or if the created item is invalid.

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | [`QualifierTypeName`](../../../type-aliases/QualifierTypeName.md) | The key of the item to add. |
| `cb` | [`CollectibleFactoryCallback`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`QualifierType`](../../../classes/QualifierType.md)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\>\> | The factory callback to create the item. |

##### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`QualifierType`](../../../classes/QualifierType.md)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\>, [`CollectorResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

Returns [Success](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) with the item if it is added, or [Failure](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) with
an error if the item cannot be created and indexed.

##### Inherited from

`ValidatingConvertingCollector.add`

***

### entries()

> **entries**(): `IterableIterator`\<[`KeyValueEntry`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`QualifierTypeName`](../../../type-aliases/QualifierTypeName.md), [`QualifierType`](../../../classes/QualifierType.md)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\>\>\>

Returns an iterator over the map entries.

#### Returns

`IterableIterator`\<[`KeyValueEntry`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`QualifierTypeName`](../../../type-aliases/QualifierTypeName.md), [`QualifierType`](../../../classes/QualifierType.md)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\>\>\>

An iterator over the map entries.

#### Inherited from

`ValidatingConvertingCollector.entries`

***

### forEach()

> **forEach**(`callback`, `arg?`): `void`

Calls a function for each entry in the map.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `callback` | [`ResultMapForEachCb`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`QualifierTypeName`](../../../type-aliases/QualifierTypeName.md), [`QualifierType`](../../../classes/QualifierType.md)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\>\> | The function to call for each entry. |
| `arg?` | `unknown` | An optional argument to pass to the callback. |

#### Returns

`void`

#### Inherited from

`ValidatingConvertingCollector.forEach`

***

### get()

> **get**(`key`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`QualifierType`](../../../classes/QualifierType.md)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\>, [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

Gets a value by key.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | [`QualifierTypeName`](../../../type-aliases/QualifierTypeName.md) | The key to look up. |

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`QualifierType`](../../../classes/QualifierType.md)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\>, [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

Returns [Success](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) with the value and detail `exists` if found,
or [Failure](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) with detail `not-found` if the key does not exist.

#### Inherited from

`ValidatingConvertingCollector.get`

***

### getAt()

> **getAt**(`index`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`QualifierType`](../../../classes/QualifierType.md)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\>\>

Gets the item at a specified index.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `index` | `number` | The index of the item to retrieve. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`QualifierType`](../../../classes/QualifierType.md)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\>\>

Returns [Success](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) with the item if it exists, or [Failure](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)
with an error if the index is out of range.

#### Inherited from

`ValidatingConvertingCollector.getAt`

***

### getOrAdd()

#### Call Signature

> **getOrAdd**(`item`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`QualifierType`](../../../classes/QualifierType.md)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\>, [`CollectorResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

Gets an existing item with a key matching that of the supplied item, or adds the supplied
item to the collector if no item with that key exists.

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `item` | [`QualifierType`](../../../classes/QualifierType.md) | The item to get or add. |

##### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`QualifierType`](../../../classes/QualifierType.md)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\>, [`CollectorResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

Returns [Success](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) with the item stored in the collector -
detail `exists` indicates that an existing item was returned and detail `added` indicates
that the item was added. Returns [Failure](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) with an error and
appropriate detail if the item could not be added.

##### Inherited from

`ValidatingConvertingCollector.getOrAdd`

#### Call Signature

> **getOrAdd**(`key`, `callback`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`QualifierType`](../../../classes/QualifierType.md)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\>, [`CollectorResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

Gets an existing item with a key matching the supplied key, or adds a new item to the collector
using a factory callback if no item with that key exists.

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | [`QualifierTypeName`](../../../type-aliases/QualifierTypeName.md) | The key of the item to get or add. |
| `callback` | [`CollectibleFactoryCallback`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`QualifierType`](../../../classes/QualifierType.md)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\>\> | The factory callback to create the item. |

##### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`QualifierType`](../../../classes/QualifierType.md)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\>, [`CollectorResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

Returns [Success](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) with the item stored in the collector -
detail `exists` indicates that an existing item was returned and detail `added` indicates
that the item was added. Returns [Failure](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) with an error and
appropriate detail if the item could not be added.

##### Inherited from

`ValidatingConvertingCollector.getOrAdd`

#### Call Signature

> **getOrAdd**(`key`, `item`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`QualifierType`](../../../classes/QualifierType.md)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\>, [`CollectorResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

Gets an item by key if it exists, or creates a new item and adds it using the default [factory](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) if not.

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | [`QualifierTypeName`](../../../type-aliases/QualifierTypeName.md) | The key of the item to retrieve. |
| `item` | [`QualifierType`](../../../classes/QualifierType.md) | The source representation of the item to be added if it does not exist. |

##### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`QualifierType`](../../../classes/QualifierType.md)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\>, [`CollectorResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

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
| `key` | [`QualifierTypeName`](../../../type-aliases/QualifierTypeName.md) | The key to check for. |

#### Returns

`boolean`

`true` if the key exists, `false` otherwise.

#### Inherited from

`ValidatingConvertingCollector.has`

***

### keys()

> **keys**(): `IterableIterator`\<[`QualifierTypeName`](../../../type-aliases/QualifierTypeName.md)\>

Returns an iterator over the map keys.

#### Returns

`IterableIterator`\<[`QualifierTypeName`](../../../type-aliases/QualifierTypeName.md)\>

An iterator over the map keys.

#### Inherited from

`ValidatingConvertingCollector.keys`

***

### toReadOnly()

> **toReadOnly**(): [`IReadOnlyValidatingCollector`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`QualifierType`](../../../classes/QualifierType.md)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\>\>

Gets a read-only version of this collector as a
[read-only map](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs).

#### Returns

[`IReadOnlyValidatingCollector`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`QualifierType`](../../../classes/QualifierType.md)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\>\>

#### Inherited from

`ValidatingConvertingCollector.toReadOnly`

***

### values()

> **values**(): `IterableIterator`\<[`QualifierType`](../../../classes/QualifierType.md)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\>\>

Returns an iterator over the map values.

#### Returns

`IterableIterator`\<[`QualifierType`](../../../classes/QualifierType.md)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\>\>

An iterator over the map values.

#### Inherited from

`ValidatingConvertingCollector.values`

***

### valuesByIndex()

> **valuesByIndex**(): readonly [`QualifierType`](../../../classes/QualifierType.md)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\>[]

Gets all items in the collection, ordered by index.

#### Returns

readonly [`QualifierType`](../../../classes/QualifierType.md)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\>[]

An array of items in the collection, ordered by index.

#### Inherited from

`ValidatingConvertingCollector.valuesByIndex`

***

### \_qualifierTypeFactory()

> `protected` `static` **\_qualifierTypeFactory**(`key`, `index`, `value`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`QualifierType`](../../../classes/QualifierType.md)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\>\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `key` | [`QualifierTypeName`](../../../type-aliases/QualifierTypeName.md) |
| `index` | `number` |
| `value` | [`QualifierType`](../../../classes/QualifierType.md) |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`QualifierType`](../../../classes/QualifierType.md)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\>\>

***

### \_toQualifierType()

> `protected` `static` **\_toQualifierType**(`from`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`QualifierType`](../../../classes/QualifierType.md)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\>\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `from` | `unknown` |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`QualifierType`](../../../classes/QualifierType.md)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\>\>

***

### create()

> `static` **create**(`params?`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`QualifierTypeCollector`\>

Creates a new QualifierTypeCollector object.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params?` | [`IQualifierTypeCollectorCreateParams`](../interfaces/IQualifierTypeCollectorCreateParams.md) | Optional [parameters](../interfaces/IQualifierTypeCollectorCreateParams.md) used to create the collector. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`QualifierTypeCollector`\>

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
