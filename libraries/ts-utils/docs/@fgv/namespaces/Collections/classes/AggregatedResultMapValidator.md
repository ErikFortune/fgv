[**@fgv/ts-utils**](../../../../README.md)

***

[@fgv/ts-utils](../../../../README.md) / [Collections](../README.md) / AggregatedResultMapValidator

# Class: AggregatedResultMapValidator\<TCOMPOSITEID, TCOLLECTIONID, TITEMID, TITEM, TMETADATA\>

A validator for weakly-typed access to an [aggregated result map](../../../../classes/AggregatedResultMap.md).

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TCOMPOSITEID` *extends* `string` | - |
| `TCOLLECTIONID` *extends* `string` | - |
| `TITEMID` *extends* `string` | - |
| `TITEM` | - |
| `TMETADATA` | `unknown` |

## Implements

- [`IReadOnlyResultMapValidator`](../interfaces/IReadOnlyResultMapValidator.md)\<`TCOMPOSITEID`, `TITEM`\>

## Constructors

### Constructor

> **new AggregatedResultMapValidator**\<`TCOMPOSITEID`, `TCOLLECTIONID`, `TITEMID`, `TITEM`, `TMETADATA`\>(`map`, `converters`): `AggregatedResultMapValidator`\<`TCOMPOSITEID`, `TCOLLECTIONID`, `TITEMID`, `TITEM`, `TMETADATA`\>

Constructs a new aggregated result map validator.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `map` | [`AggregatedResultMap`](../../../../classes/AggregatedResultMap.md)\<`TCOMPOSITEID`, `TCOLLECTIONID`, `TITEMID`, `TITEM`, `TMETADATA`\> | The [aggregated result map](../../../../classes/AggregatedResultMap.md) being validated. |
| `converters` | [`KeyValueConverters`](KeyValueConverters.md)\<`TCOMPOSITEID`, `TITEM`\> | The key-value converters for weakly-typed access. |

#### Returns

`AggregatedResultMapValidator`\<`TCOMPOSITEID`, `TCOLLECTIONID`, `TITEMID`, `TITEM`, `TMETADATA`\>

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="converters"></a> `converters` | `readonly` | [`KeyValueConverters`](KeyValueConverters.md)\<`TCOMPOSITEID`, `TITEM`\> | The key-value converters used for validating weakly-typed access. |

## Accessors

### map

#### Get Signature

> **get** **map**(): [`IReadOnlyValidatingResultMap`](../interfaces/IReadOnlyValidatingResultMap.md)\<`TCOMPOSITEID`, `TITEM`\>

The underlying map.

##### Returns

[`IReadOnlyValidatingResultMap`](../interfaces/IReadOnlyValidatingResultMap.md)\<`TCOMPOSITEID`, `TITEM`\>

The underlying map.

#### Implementation of

[`IReadOnlyResultMapValidator`](../interfaces/IReadOnlyResultMapValidator.md).[`map`](../interfaces/IReadOnlyResultMapValidator.md#map)

## Methods

### add()

> **add**(`key`, `value`): [`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<`TITEM`, [`ResultMapResultDetail`](../type-aliases/ResultMapResultDetail.md)\>

Sets a key/value pair in the map if the key does not already exist.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `string` | The key to set. |
| `value` | `unknown` | The value to set. |

#### Returns

[`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<`TITEM`, [`ResultMapResultDetail`](../type-aliases/ResultMapResultDetail.md)\>

`Success` with the value and detail `added` if the key was added,
`Failure` with detail `exists` if the key already exists. Fails with detail
'invalid-key' or 'invalid-value' and an error message if either is invalid.

***

### delete()

> **delete**(`key`): [`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<`TITEM`, [`ResultMapResultDetail`](../type-aliases/ResultMapResultDetail.md)\>

Deletes a key from the map.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `string` | The key to delete. |

#### Returns

[`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<`TITEM`, [`ResultMapResultDetail`](../type-aliases/ResultMapResultDetail.md)\>

`Success` with the previous value and the detail 'deleted'
if the key was found and deleted, `Failure` with detail 'not-found'
if the key was not found, or with detail 'invalid-key' if the key is invalid.

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

[`IReadOnlyResultMapValidator`](../interfaces/IReadOnlyResultMapValidator.md).[`get`](../interfaces/IReadOnlyResultMapValidator.md#get)

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

[`IReadOnlyResultMapValidator`](../interfaces/IReadOnlyResultMapValidator.md).[`has`](../interfaces/IReadOnlyResultMapValidator.md#has)

***

### set()

> **set**(`key`, `value`): [`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<`TITEM`, [`ResultMapResultDetail`](../type-aliases/ResultMapResultDetail.md)\>

Sets a key/value pair in the map.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `string` | The key to set. |
| `value` | `unknown` | The value to set. |

#### Returns

[`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<`TITEM`, [`ResultMapResultDetail`](../type-aliases/ResultMapResultDetail.md)\>

`Success` with the new value and the detail `updated` if the
key was found and updated, `Success` with the new value and detail
`added` if the key was not found and added.  Fails with detail
'invalid-key' or 'invalid-value' and an error message if either is invalid.

***

### update()

> **update**(`key`, `value`): [`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<`TITEM`, [`ResultMapResultDetail`](../type-aliases/ResultMapResultDetail.md)\>

Updates an existing key in the map - the map is not updated if the key does
not exist.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `string` | The key to update. |
| `value` | `unknown` | The value to set. |

#### Returns

[`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<`TITEM`, [`ResultMapResultDetail`](../type-aliases/ResultMapResultDetail.md)\>

`Success` with the value and detail 'exists' if the key was found
and the value updated, `Failure` an error message and with detail `not-found`
if the key was not found, or with detail 'invalid-key' or 'invalid-value'
if either is invalid.
