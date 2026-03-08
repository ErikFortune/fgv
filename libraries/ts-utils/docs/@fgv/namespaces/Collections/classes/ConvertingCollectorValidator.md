[**@fgv/ts-utils**](../../../../README.md)

***

[@fgv/ts-utils](../../../../README.md) / [Collections](../README.md) / ConvertingCollectorValidator

# Class: ConvertingCollectorValidator\<TITEM, TSRC\>

A [ConvertingCollector](ConvertingCollector.md) wrapper which validates weakly-typed keys
and values before calling the wrapped collector.  Unlike the basic [CollectorValidator](CollectorValidator.md),
the converting collector expects the items to be in the source type of the converting collector, not the target type.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TITEM` *extends* [`ICollectible`](../interfaces/ICollectible.md)\<`any`, `any`\> | - |
| `TSRC` | `TITEM` |

## Implements

- [`IReadOnlyCollectorValidator`](../interfaces/IReadOnlyCollectorValidator.md)\<`TITEM`\>

## Constructors

### Constructor

> **new ConvertingCollectorValidator**\<`TITEM`, `TSRC`\>(`params`): `ConvertingCollectorValidator`\<`TITEM`, `TSRC`\>

Constructs a new ConvertingCollectorValidator.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params` | [`IConvertingCollectorValidatorCreateParams`](../interfaces/IConvertingCollectorValidatorCreateParams.md)\<`TITEM`, `TSRC`\> | Required parameters for constructing the collector validator. |

#### Returns

`ConvertingCollectorValidator`\<`TITEM`, `TSRC`\>

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="_collector"></a> `_collector` | `protected` | [`ConvertingCollector`](ConvertingCollector.md)\<`TITEM`, `TSRC`\> |
| <a id="converters"></a> `converters` | `readonly` | [`KeyValueConverters`](KeyValueConverters.md)\<[`CollectibleKey`](../type-aliases/CollectibleKey.md)\<`TITEM`\>, `TSRC`\> |

## Accessors

### map

#### Get Signature

> **get** **map**(): [`IReadOnlyResultMap`](../interfaces/IReadOnlyResultMap.md)\<[`CollectibleKey`](../type-aliases/CollectibleKey.md)\<`TITEM`\>, `TITEM`\>

The underlying map.

##### Returns

[`IReadOnlyResultMap`](../interfaces/IReadOnlyResultMap.md)\<[`CollectibleKey`](../type-aliases/CollectibleKey.md)\<`TITEM`\>, `TITEM`\>

The underlying map.

#### Implementation of

[`IReadOnlyCollectorValidator`](../interfaces/IReadOnlyCollectorValidator.md).[`map`](../interfaces/IReadOnlyCollectorValidator.md#map)

## Methods

### \_isCollectibleFactoryCallback()

> **\_isCollectibleFactoryCallback**(`value`): `value is CollectibleFactoryCallback<TITEM>`

Determines if a value is a [CollectibleFactoryCallback](../type-aliases/CollectibleFactoryCallback.md).

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `value` | `unknown` | The value to check. |

#### Returns

`value is CollectibleFactoryCallback<TITEM>`

`true` if the value is a [CollectibleFactoryCallback](../type-aliases/CollectibleFactoryCallback.md),
`false` otherwise.

***

### add()

#### Call Signature

> **add**(`key`, `value`): [`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<`TITEM`, [`CollectorResultDetail`](../type-aliases/CollectorResultDetail.md)\>

Adds an item to the collection, failing if a different item with the same key already exists. Note
that adding an object that is already in the collection again will succeed without updating the collection.

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `string` | The item to add. |
| `value` | `unknown` | - |

##### Returns

[`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<`TITEM`, [`CollectorResultDetail`](../type-aliases/CollectorResultDetail.md)\>

Returns [Success](../../../../classes/DetailedSuccess.md) with the item and detail `added` if it was added
or detail `exists` if the item was already in the map.  Returns [Failure](../../../../classes/DetailedFailure.md) with
an error message and appropriate detail if the item could not be added.

#### Call Signature

> **add**(`key`, `factory`): [`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<`TITEM`, [`CollectorResultDetail`](../type-aliases/CollectorResultDetail.md)\>

Adds an item to the collector using a supplied factory callback
at a specified key, validating the key first.

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `key` | `string` |
| `factory` | [`ResultMapValueFactory`](../type-aliases/ResultMapValueFactory.md)\<[`CollectibleKey`](../type-aliases/CollectibleKey.md)\<`TITEM`\>, `TITEM`\> |

##### Returns

[`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<`TITEM`, [`CollectorResultDetail`](../type-aliases/CollectorResultDetail.md)\>

***

### get()

> **get**(`key`): [`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<`TITEM`, [`ResultMapResultDetail`](../type-aliases/ResultMapResultDetail.md)\>

Gets a value from the map.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `string` | The key to retrieve. |

#### Returns

[`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<`TITEM`, [`ResultMapResultDetail`](../type-aliases/ResultMapResultDetail.md)\>

`Success` with the value and detail `exists` if the key was found,
`Failure` with detail `not-found` if the key was not found or with detail
`invalid-key` if the key is invalid.

#### Implementation of

[`IReadOnlyCollectorValidator`](../interfaces/IReadOnlyCollectorValidator.md).[`get`](../interfaces/IReadOnlyCollectorValidator.md#get)

***

### getOrAdd()

#### Call Signature

> **getOrAdd**(`key`, `value`): [`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<`TITEM`, [`CollectorResultDetail`](../type-aliases/CollectorResultDetail.md)\>

Gets an existing item with a key matching that of a supplied item, or adds the supplied
item to the collector if no item with that key exists.

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `string` | The item to get or add. |
| `value` | `unknown` | - |

##### Returns

[`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<`TITEM`, [`CollectorResultDetail`](../type-aliases/CollectorResultDetail.md)\>

Returns [Success](../../../../classes/DetailedSuccess.md) with the item stored in the collector -
detail `exists` indicates that an existing item return and detail `added` indicates that the
item was added. Returns [Failure](../../../../classes/DetailedFailure.md) with an error and appropriate
detail if the item could not be added.

##### Implementation of

[`IReadOnlyCollectorValidator`](../interfaces/IReadOnlyCollectorValidator.md).[`getOrAdd`](../interfaces/IReadOnlyCollectorValidator.md#getoradd)

#### Call Signature

> **getOrAdd**(`key`, `factory`): [`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<`TITEM`, [`CollectorResultDetail`](../type-aliases/CollectorResultDetail.md)\>

Gets an existing item with a key matching the supplied key, or adds a new item to the collector
using a factory callback if no item with that key exists.

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `string` | The key of the item to add. |
| `factory` | [`ResultMapValueFactory`](../type-aliases/ResultMapValueFactory.md)\<[`CollectibleKey`](../type-aliases/CollectibleKey.md)\<`TITEM`\>, `TITEM`\> | The factory callback to create the item. |

##### Returns

[`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<`TITEM`, [`CollectorResultDetail`](../type-aliases/CollectorResultDetail.md)\>

Returns [Success](../../../../classes/DetailedSuccess.md) with the item stored in the collector -
detail `exists` indicates that an existing item return and detail `added` indicates that the
item was added. Returns [Failure](../../../../classes/DetailedFailure.md) with an error and appropriate
detail if the item could not be added.

##### Implementation of

`IReadOnlyCollectorValidator.getOrAdd`

***

### has()

> **has**(`key`): `boolean`

Returns `true` if the map contains a key.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `string` | The key to check. |

#### Returns

`boolean`

`true` if the key exists, `false` otherwise.

#### Implementation of

[`IReadOnlyCollectorValidator`](../interfaces/IReadOnlyCollectorValidator.md).[`has`](../interfaces/IReadOnlyCollectorValidator.md#has)

***

### toReadOnly()

> **toReadOnly**(): [`IReadOnlyCollectorValidator`](../interfaces/IReadOnlyCollectorValidator.md)\<`TITEM`\>

Gets a read-only version of this collector.

#### Returns

[`IReadOnlyCollectorValidator`](../interfaces/IReadOnlyCollectorValidator.md)\<`TITEM`\>
