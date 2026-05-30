[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [Resources](../README.md) / CandidateValueCollector

# Class: CandidateValueCollector

A `ValidatingCollector` for [CandidateValues](CandidateValue.md),
which collects candidate values supplied as either [CandidateValue](CandidateValue.md) or
`JsonValue`.

## Extends

- [`ValidatingCollector`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`CandidateValue`](CandidateValue.md)\>

## Constructors

### Constructor

> `protected` **new CandidateValueCollector**(`params?`): `CandidateValueCollector`

**`Internal`**

Constructor for a Resources.CandidateValueCollector object.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params?` | [`ICandidateValueCollectorCreateParams`](../interfaces/ICandidateValueCollectorCreateParams.md) | Parameters to create the collector. |

#### Returns

`CandidateValueCollector`

#### Overrides

`ValidatingCollector<CandidateValue>.constructor`

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="_converters"></a> `_converters` | `readonly` | [`KeyValueConverters`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`CandidateValueKey`](../../../type-aliases/CandidateValueKey.md), [`CandidateValue`](CandidateValue.md)\> | - |
| <a id="normalizer"></a> `normalizer` | `readonly` | [`HashingNormalizer`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) | - |
| <a id="validating"></a> `validating` | `readonly` | [`CollectorValidator`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`CandidateValue`](CandidateValue.md)\> | A [CollectorValidator](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) which validates keys and values before inserting them into this collector. |

## Accessors

### size

#### Get Signature

> **get** **size**(): `number`

Returns the number of entries in the map.

##### Returns

`number`

#### Inherited from

`ValidatingCollector.size`

## Methods

### \_isItem()

> `protected` **\_isItem**(`keyOrItem`): `keyOrItem is CandidateValue`

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `keyOrItem` | [`CandidateValueKey`](../../../type-aliases/CandidateValueKey.md) \| [`CandidateValue`](CandidateValue.md) |

#### Returns

`keyOrItem is CandidateValue`

#### Inherited from

`ValidatingCollector._isItem`

***

### \[iterator\]()

> **\[iterator\]**(): `IterableIterator`\<[`KeyValueEntry`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`CandidateValueKey`](../../../type-aliases/CandidateValueKey.md), [`CandidateValue`](CandidateValue.md)\>\>

Gets an iterator over the map entries.

#### Returns

`IterableIterator`\<[`KeyValueEntry`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`CandidateValueKey`](../../../type-aliases/CandidateValueKey.md), [`CandidateValue`](CandidateValue.md)\>\>

An iterator over the map entries.

#### Inherited from

`ValidatingCollector.[iterator]`

***

### add()

> **add**(`item`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`CandidateValue`](CandidateValue.md), [`CollectorResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

Adds an item to the collection, failing if a different item with the same key already exists. Note
that adding an object that is already in the collection again will succeed without updating the collection.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `item` | [`CandidateValue`](CandidateValue.md) | The item to add. |

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`CandidateValue`](CandidateValue.md), [`CollectorResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

Returns [Success](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) with the item and detail `added` if it was added
or detail `exists` if the item was already in the map.  Returns [Failure](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) with
an error message and appropriate detail if the item could not be added.

#### Inherited from

`ValidatingCollector.add`

***

### entries()

> **entries**(): `IterableIterator`\<[`KeyValueEntry`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`CandidateValueKey`](../../../type-aliases/CandidateValueKey.md), [`CandidateValue`](CandidateValue.md)\>\>

Returns an iterator over the map entries.

#### Returns

`IterableIterator`\<[`KeyValueEntry`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`CandidateValueKey`](../../../type-aliases/CandidateValueKey.md), [`CandidateValue`](CandidateValue.md)\>\>

An iterator over the map entries.

#### Inherited from

`ValidatingCollector.entries`

***

### forEach()

> **forEach**(`callback`, `arg?`): `void`

Calls a function for each entry in the map.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `callback` | [`ResultMapForEachCb`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`CandidateValueKey`](../../../type-aliases/CandidateValueKey.md), [`CandidateValue`](CandidateValue.md)\> | The function to call for each entry. |
| `arg?` | `unknown` | An optional argument to pass to the callback. |

#### Returns

`void`

#### Inherited from

`ValidatingCollector.forEach`

***

### get()

> **get**(`key`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`CandidateValue`](CandidateValue.md), [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

Gets a value by key.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | [`CandidateValueKey`](../../../type-aliases/CandidateValueKey.md) | The key to look up. |

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`CandidateValue`](CandidateValue.md), [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

Returns [Success](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) with the value and detail `exists` if found,
or [Failure](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) with detail `not-found` if the key does not exist.

#### Inherited from

`ValidatingCollector.get`

***

### getAt()

> **getAt**(`index`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`CandidateValue`](CandidateValue.md)\>

Gets the item at a specified index.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `index` | `number` | The index of the item to retrieve. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`CandidateValue`](CandidateValue.md)\>

Returns [Success](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) with the item if it exists, or [Failure](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)
with an error if the index is out of range.

#### Inherited from

`ValidatingCollector.getAt`

***

### getOrAdd()

#### Call Signature

> **getOrAdd**(`item`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`CandidateValue`](CandidateValue.md), [`CollectorResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

Gets an existing item with a key matching that of a supplied item, or adds the supplied
item to the collector if no item with that key exists.

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `item` | [`CandidateValue`](CandidateValue.md) | The item to get or add. |

##### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`CandidateValue`](CandidateValue.md), [`CollectorResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

Returns [Success](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) with the item stored in the collector -
detail `exists` indicates that an existing item return and detail `added` indicates that the
item was added. Returns [Failure](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) with an error and appropriate
detail if the item could not be added.

##### Inherited from

`ValidatingCollector.getOrAdd`

#### Call Signature

> **getOrAdd**(`key`, `factory`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`CandidateValue`](CandidateValue.md), [`CollectorResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

Gets an existing item with a key matching the supplied key, or adds a new item to the collector
using a factory callback if no item with that key exists.

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | [`CandidateValueKey`](../../../type-aliases/CandidateValueKey.md) | The key of the item to add. |
| `factory` | [`CollectibleFactoryCallback`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`CandidateValue`](CandidateValue.md)\> | The factory callback to create the item. |

##### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`CandidateValue`](CandidateValue.md), [`CollectorResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

Returns [Success](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) with the item stored in the collector -
detail `exists` indicates that an existing item return and detail `added` indicates that the
item was added. Returns [Failure](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) with an error and appropriate
detail if the item could not be added.

##### Inherited from

`ValidatingCollector.getOrAdd`

***

### getValuesByIndex()

> **getValuesByIndex**(): [`JsonValue`](../../../../ts-res-ui-components/type-aliases/JsonValue.md)[]

Returns an array of JSON values ordered by their indices.

#### Returns

[`JsonValue`](../../../../ts-res-ui-components/type-aliases/JsonValue.md)[]

Array of JsonValue objects in index order.

***

### has()

> **has**(`key`): `boolean`

Returns true if the map contains an entry with the given key.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | [`CandidateValueKey`](../../../type-aliases/CandidateValueKey.md) | The key to check for. |

#### Returns

`boolean`

`true` if the key exists, `false` otherwise.

#### Inherited from

`ValidatingCollector.has`

***

### keys()

> **keys**(): `IterableIterator`\<[`CandidateValueKey`](../../../type-aliases/CandidateValueKey.md)\>

Returns an iterator over the map keys.

#### Returns

`IterableIterator`\<[`CandidateValueKey`](../../../type-aliases/CandidateValueKey.md)\>

An iterator over the map keys.

#### Inherited from

`ValidatingCollector.keys`

***

### toReadOnly()

> **toReadOnly**(): [`IReadOnlyValidatingCollector`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`CandidateValue`](CandidateValue.md)\>

Gets a read-only version of this collector as a
[read-only map](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs).

#### Returns

[`IReadOnlyValidatingCollector`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`CandidateValue`](CandidateValue.md)\>

#### Inherited from

`ValidatingCollector.toReadOnly`

***

### values()

> **values**(): `IterableIterator`\<[`CandidateValue`](CandidateValue.md)\>

Returns an iterator over the map values.

#### Returns

`IterableIterator`\<[`CandidateValue`](CandidateValue.md)\>

An iterator over the map values.

#### Inherited from

`ValidatingCollector.values`

***

### valuesByIndex()

> **valuesByIndex**(): readonly [`CandidateValue`](CandidateValue.md)[]

Gets all items in the collection, ordered by index.

#### Returns

readonly [`CandidateValue`](CandidateValue.md)[]

An array of items in the collection, ordered by index.

#### Inherited from

`ValidatingCollector.valuesByIndex`

***

### create()

> `static` **create**(`params?`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`CandidateValueCollector`\>

Creates a new Resources.CandidateValueCollector object.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params?` | [`ICandidateValueCollectorCreateParams`](../interfaces/ICandidateValueCollectorCreateParams.md) | Parameters to create the collector. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`CandidateValueCollector`\>

`Success` with the new collector if successful,
or `Failure` with an error message if not.

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

`ValidatingCollector.createCollector`

***

### createValidatingCollector()

> `static` **createValidatingCollector**\<`TITEM`\>(`params`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ValidatingCollector`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TITEM`\>\>

Creates a new [ValidatingCollector](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) instance from
the supplied [parameters](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs).

#### Type Parameters

| Type Parameter |
| ------ |
| `TITEM` *extends* [`ICollectible`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`any`, `any`\> |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params` | [`IValidatingCollectorConstructorParams`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TITEM`\> | Required parameters for constructing the collector. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ValidatingCollector`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TITEM`\>\>

Success with the new collector if successful, [Failure](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) otherwise.

#### Inherited from

`ValidatingCollector.createValidatingCollector`
