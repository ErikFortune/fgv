[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-utils](../../../README.md) / [Collections](../README.md) / IReadOnlyCollectorValidator

# Interface: IReadOnlyCollectorValidator\<TITEM\>

A read-only interface exposing non-mutating methods of a
[CollectorValidator](../classes/CollectorValidator.md).

## Extends

- [`IReadOnlyResultMapValidator`](IReadOnlyResultMapValidator.md)\<[`CollectibleKey`](../type-aliases/CollectibleKey.md)\<`TITEM`\>, `TITEM`\>

## Type Parameters

| Type Parameter |
| ------ |
| `TITEM` *extends* [`ICollectible`](ICollectible.md)\<`any`, `any`\> |

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="map"></a> `map` | `readonly` | [`IReadOnlyResultMap`](IReadOnlyResultMap.md)\<[`CollectibleKey`](../type-aliases/CollectibleKey.md)\<`TITEM`\>, `TITEM`\> | The underlying map. |

## Methods

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

#### Overrides

[`IReadOnlyResultMapValidator`](IReadOnlyResultMapValidator.md).[`get`](IReadOnlyResultMapValidator.md#get)

***

### getOrAdd()

> **getOrAdd**(`key`, `factory`): [`DetailedResult`](../../../type-aliases/DetailedResult.md)\<`TITEM`, [`CollectorResultDetail`](../type-aliases/CollectorResultDetail.md)\>

Gets an existing item with a key matching the supplied key, or adds a new item to the collector
using a factory callback if no item with that key exists.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `string` | The weakly-typed key of the item to get or add. |
| `factory` | [`ResultMapValueFactory`](../type-aliases/ResultMapValueFactory.md)\<[`CollectibleKey`](../type-aliases/CollectibleKey.md)\<`TITEM`\>, `TITEM`\> | The factory callback to create the item. |

#### Returns

[`DetailedResult`](../../../type-aliases/DetailedResult.md)\<`TITEM`, [`CollectorResultDetail`](../type-aliases/CollectorResultDetail.md)\>

Returns [Success](../../../classes/DetailedSuccess.md) with the item stored in the collector -
detail `exists` indicates that an existing item was returned and detail `added` indicates
that the item was added. Returns [Failure](../../../classes/DetailedFailure.md) with an error and
appropriate detail if the item could not be added.

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

#### Overrides

[`IReadOnlyResultMapValidator`](IReadOnlyResultMapValidator.md).[`has`](IReadOnlyResultMapValidator.md#has)
