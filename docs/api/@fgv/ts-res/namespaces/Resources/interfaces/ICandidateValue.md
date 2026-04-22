[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [Resources](../README.md) / ICandidateValue

# Interface: ICandidateValue

Interface for a candidate value that can be collected and indexed.
Candidate values are normalized JSON values that can be shared across
multiple resource candidates to reduce duplication.

## Extends

- [`ICollectible`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`CandidateValueKey`](../../../type-aliases/CandidateValueKey.md), [`CandidateValueIndex`](../../../type-aliases/CandidateValueIndex.md)\>

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="index"></a> `index` | `readonly` | [`CandidateValueIndex`](../../../type-aliases/CandidateValueIndex.md) \| `undefined` | The index of this candidate value in the collection. |
| <a id="json"></a> `json` | `readonly` | [`JsonValue`](../../../../ts-res-ui-components/type-aliases/JsonValue.md) | The normalized JSON value. |
| <a id="key"></a> `key` | `readonly` | [`CandidateValueKey`](../../../type-aliases/CandidateValueKey.md) | The unique key for this candidate value, derived from the hash of the normalized JSON. |

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

#### Overrides

`Collections.ICollectible.setIndex`
