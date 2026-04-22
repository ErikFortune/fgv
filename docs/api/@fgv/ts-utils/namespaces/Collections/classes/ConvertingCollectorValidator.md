[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-utils](../../../README.md) / [Collections](../README.md) / ConvertingCollectorValidator

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

> **add**(`key`, `value`): [`DetailedResult`](../../../type-aliases/DetailedResult.md)\<`TITEM`, [`CollectorResultDetail`](../type-aliases/CollectorResultDetail.md)\>

Adds an item to the collector using the default factory at a specified key,
failing if an item with that key already exists.

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `string` | The weakly-typed key of the item to add. |
| `value` | `unknown` | The source representation of the item to be added. |

##### Returns

[`DetailedResult`](../../../type-aliases/DetailedResult.md)\<`TITEM`, [`CollectorResultDetail`](../type-aliases/CollectorResultDetail.md)\>

Returns [Success](../../../classes/Success.md) with the item if it is added, or [Failure](../../../classes/Failure.md) with
an error if the item cannot be created and indexed.

#### Call Signature

> **add**(`key`, `factory`): [`DetailedResult`](../../../type-aliases/DetailedResult.md)\<`TITEM`, [`CollectorResultDetail`](../type-aliases/CollectorResultDetail.md)\>

Adds an item to the collector using a supplied factory callback
at a specified key, validating the key first.

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `key` | `string` |
| `factory` | [`ResultMapValueFactory`](../type-aliases/ResultMapValueFactory.md)\<[`CollectibleKey`](../type-aliases/CollectibleKey.md)\<`TITEM`\>, `TITEM`\> |

##### Returns

[`DetailedResult`](../../../type-aliases/DetailedResult.md)\<`TITEM`, [`CollectorResultDetail`](../type-aliases/CollectorResultDetail.md)\>

***

### get()

> **get**(`key`): [`DetailedResult`](../../../type-aliases/DetailedResult.md)\<`TITEM`, [`ResultMapResultDetail`](../type-aliases/ResultMapResultDetail.md)\>

Gets a value by key.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `string` | The key to look up. |

#### Returns

[`DetailedResult`](../../../type-aliases/DetailedResult.md)\<`TITEM`, [`ResultMapResultDetail`](../type-aliases/ResultMapResultDetail.md)\>

Returns [Success](../../../classes/DetailedSuccess.md) with the value and detail `exists` if found,
or [Failure](../../../classes/DetailedFailure.md) with detail `not-found` if the key does not exist.

#### Implementation of

[`IReadOnlyCollectorValidator`](../interfaces/IReadOnlyCollectorValidator.md).[`get`](../interfaces/IReadOnlyCollectorValidator.md#get)

***

### getOrAdd()

#### Call Signature

> **getOrAdd**(`key`, `value`): [`DetailedResult`](../../../type-aliases/DetailedResult.md)\<`TITEM`, [`CollectorResultDetail`](../type-aliases/CollectorResultDetail.md)\>

Gets an existing item with a key matching the supplied key, or adds a new item to the collector
by converting the supplied weakly-typed value if no item with that key exists.

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `string` | The weakly-typed key of the item to get or add. |
| `value` | `unknown` | The weakly-typed source value to convert and add if the key does not exist. |

##### Returns

[`DetailedResult`](../../../type-aliases/DetailedResult.md)\<`TITEM`, [`CollectorResultDetail`](../type-aliases/CollectorResultDetail.md)\>

Returns [Success](../../../classes/DetailedSuccess.md) with the item stored in the collector -
detail `exists` indicates that an existing item was returned and detail `added` indicates
that the item was added. Returns [Failure](../../../classes/DetailedFailure.md) with an error and
appropriate detail if the item could not be added.

##### Implementation of

[`IReadOnlyCollectorValidator`](../interfaces/IReadOnlyCollectorValidator.md).[`getOrAdd`](../interfaces/IReadOnlyCollectorValidator.md#getoradd)

#### Call Signature

> **getOrAdd**(`key`, `factory`): [`DetailedResult`](../../../type-aliases/DetailedResult.md)\<`TITEM`, [`CollectorResultDetail`](../type-aliases/CollectorResultDetail.md)\>

Gets an existing item with a key matching the supplied key, or adds a new item to the collector
using a factory callback if no item with that key exists.

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `string` | The weakly-typed key of the item to get or add. |
| `factory` | [`ResultMapValueFactory`](../type-aliases/ResultMapValueFactory.md)\<[`CollectibleKey`](../type-aliases/CollectibleKey.md)\<`TITEM`\>, `TITEM`\> | The factory callback to create the item. |

##### Returns

[`DetailedResult`](../../../type-aliases/DetailedResult.md)\<`TITEM`, [`CollectorResultDetail`](../type-aliases/CollectorResultDetail.md)\>

Returns [Success](../../../classes/DetailedSuccess.md) with the item stored in the collector -
detail `exists` indicates that an existing item was returned and detail `added` indicates
that the item was added. Returns [Failure](../../../classes/DetailedFailure.md) with an error and
appropriate detail if the item could not be added.

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
