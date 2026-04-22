[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [Resources](../README.md) / CandidateValue

# Class: CandidateValue

Implementation of a candidate value that stores normalized JSON data.
The value is normalized on creation and a hash-based key is generated
for efficient deduplication.

## Implements

- [`ICandidateValue`](../interfaces/ICandidateValue.md)

## Constructors

### Constructor

> `protected` **new CandidateValue**(`params`): `CandidateValue`

**`Internal`**

Constructor for a Resources.CandidateValue object.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params` | [`ICandidateValueCreateParams`](../interfaces/ICandidateValueCreateParams.md) | Parameters to create the candidate value. |

#### Returns

`CandidateValue`

## Accessors

### index

#### Get Signature

> **get** **index**(): [`CandidateValueIndex`](../../../type-aliases/CandidateValueIndex.md) \| `undefined`

The index of this candidate value in the collection.

##### Returns

[`CandidateValueIndex`](../../../type-aliases/CandidateValueIndex.md) \| `undefined`

The index of this candidate value in the collection.

#### Implementation of

[`ICandidateValue`](../interfaces/ICandidateValue.md).[`index`](../interfaces/ICandidateValue.md#index)

***

### json

#### Get Signature

> **get** **json**(): [`JsonValue`](../../../../ts-res-ui-components/type-aliases/JsonValue.md)

The normalized JSON value.

##### Returns

[`JsonValue`](../../../../ts-res-ui-components/type-aliases/JsonValue.md)

The normalized JSON value.

#### Implementation of

[`ICandidateValue`](../interfaces/ICandidateValue.md).[`json`](../interfaces/ICandidateValue.md#json)

***

### key

#### Get Signature

> **get** **key**(): [`CandidateValueKey`](../../../type-aliases/CandidateValueKey.md)

The unique key for this candidate value.

##### Returns

[`CandidateValueKey`](../../../type-aliases/CandidateValueKey.md)

The unique key for this candidate value, derived from the hash of the normalized JSON.

#### Implementation of

[`ICandidateValue`](../interfaces/ICandidateValue.md).[`key`](../interfaces/ICandidateValue.md#key)

## Methods

### setIndex()

> **setIndex**(`index`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`CandidateValueIndex`](../../../type-aliases/CandidateValueIndex.md)\>

Sets the index of this candidate value.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `index` | `number` | The index to set. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`CandidateValueIndex`](../../../type-aliases/CandidateValueIndex.md)\>

`Success` with the index if successful, or `Failure` with an error message if not.

#### Implementation of

[`ICandidateValue`](../interfaces/ICandidateValue.md).[`setIndex`](../interfaces/ICandidateValue.md#setindex)

***

### create()

> `static` **create**(`params`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`CandidateValue`\>

Creates a new Resources.CandidateValue object.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params` | [`ICandidateValueCreateParams`](../interfaces/ICandidateValueCreateParams.md) | Parameters to create the candidate value. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`CandidateValue`\>

`Success` with the new candidate value if successful,
or `Failure` with an error message if not.
