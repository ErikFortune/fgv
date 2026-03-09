[**@fgv/ts-utils**](../../../../README.md)

***

[@fgv/ts-utils](../../../../README.md) / [Collections](../README.md) / CollectorValidator

# Class: CollectorValidator\<TITEM\>

A [Collector](Collector.md) wrapper which validates weakly-typed keys
and values before calling the wrapped collector.

## Type Parameters

| Type Parameter |
| ------ |
| `TITEM` *extends* [`ICollectible`](../interfaces/ICollectible.md)\<`any`, `any`\> |

## Implements

- [`IReadOnlyCollectorValidator`](../interfaces/IReadOnlyCollectorValidator.md)\<`TITEM`\>

## Constructors

### Constructor

> **new CollectorValidator**\<`TITEM`\>(`params`): `CollectorValidator`\<`TITEM`\>

Constructs a new [ConvertingCollectorValidator](ConvertingCollectorValidator.md).

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params` | [`ICollectorValidatorCreateParams`](../interfaces/ICollectorValidatorCreateParams.md)\<`TITEM`\> | Required parameters for constructing the collector validator. |

#### Returns

`CollectorValidator`\<`TITEM`\>

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="_collector"></a> `_collector` | `protected` | [`Collector`](Collector.md)\<`TITEM`\> |
| <a id="converters"></a> `converters` | `readonly` | [`KeyValueConverters`](KeyValueConverters.md)\<[`CollectibleKey`](../type-aliases/CollectibleKey.md)\<`TITEM`\>, `TITEM`\> |

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

### \_convertValue()

> `protected` **\_convertValue**(`value`): [`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<`TITEM`, [`CollectorResultDetail`](../type-aliases/CollectorResultDetail.md)\>

Helper to convert a value, returning a [DetailedResult](../../../../type-aliases/DetailedResult.md)
and formatting the error message.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `value` | `unknown` | The value to convert. |

#### Returns

[`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<`TITEM`, [`CollectorResultDetail`](../type-aliases/CollectorResultDetail.md)\>

[DetailedSuccess](../../../../classes/DetailedSuccess.md) with the converted value
and detail `success` if conversion is successful, or
[DetailedFailure](../../../../classes/DetailedFailure.md) with the error message and detail `invalid-value`
if conversion fails.

***

### add()

> **add**(`item`): [`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<`TITEM`, [`CollectorResultDetail`](../type-aliases/CollectorResultDetail.md)\>

Adds an item to the collection, failing if a different item with the same key already exists. Note
that adding an object that is already in the collection again will succeed without updating the collection.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `item` | `unknown` | The item to add. |

#### Returns

[`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<`TITEM`, [`CollectorResultDetail`](../type-aliases/CollectorResultDetail.md)\>

Returns [Success](../../../../classes/DetailedSuccess.md) with the item and detail `added` if it was added
or detail `exists` if the item was already in the map.  Returns [Failure](../../../../classes/DetailedFailure.md) with
an error message and appropriate detail if the item could not be added.

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

> **getOrAdd**(`key`, `factory`): [`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<`TITEM`, [`CollectorResultDetail`](../type-aliases/CollectorResultDetail.md)\>

Gets an existing item with a key matching that of a supplied item, or adds the supplied
item to the collector if no item with that key exists.

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `string` | The item to get or add. |
| `factory` | [`ResultMapValueFactory`](../type-aliases/ResultMapValueFactory.md)\<[`CollectibleKey`](../type-aliases/CollectibleKey.md)\<`TITEM`\>, `TITEM`\> | - |

##### Returns

[`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<`TITEM`, [`CollectorResultDetail`](../type-aliases/CollectorResultDetail.md)\>

Returns [Success](../../../../classes/DetailedSuccess.md) with the item stored in the collector -
detail `exists` indicates that an existing item return and detail `added` indicates that the
item was added. Returns [Failure](../../../../classes/DetailedFailure.md) with an error and appropriate
detail if the item could not be added.

##### Implementation of

[`IReadOnlyCollectorValidator`](../interfaces/IReadOnlyCollectorValidator.md).[`getOrAdd`](../interfaces/IReadOnlyCollectorValidator.md#getoradd)

#### Call Signature

> **getOrAdd**(`item`): [`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<`TITEM`, [`CollectorResultDetail`](../type-aliases/CollectorResultDetail.md)\>

Gets an existing item with a key matching the supplied key, or adds a new item to the collector
using a factory callback if no item with that key exists.

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `item` | `unknown` | The key of the item to add. |

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
