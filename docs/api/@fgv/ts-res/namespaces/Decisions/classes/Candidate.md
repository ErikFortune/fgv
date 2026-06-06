[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [Decisions](../README.md) / Candidate

# Class: Candidate\<TVALUE\>

Simple implementation of [ICandidate](../interfaces/ICandidate.md) with
helper methods for sorting and presentation.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TVALUE` *extends* [`JsonValue`](../../../../ts-res-ui-components/type-aliases/JsonValue.md) | [`JsonValue`](../../../../ts-res-ui-components/type-aliases/JsonValue.md) |

## Implements

- [`ICandidate`](../interfaces/ICandidate.md)\<`TVALUE`\>

## Constructors

### Constructor

> `protected` **new Candidate**\<`TVALUE`\>(`params`): `Candidate`\<`TVALUE`\>

Construct a new Candidate.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params` | [`ICandidate`](../interfaces/ICandidate.md)\<`TVALUE`\> | The [parameters](../interfaces/ICandidate.md) to use to create the new candidate. |

#### Returns

`Candidate`\<`TVALUE`\>

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="conditionset"></a> `conditionSet` | `readonly` | [`ConditionSet`](../../Conditions/classes/ConditionSet.md) |
| <a id="ispartial"></a> `isPartial` | `readonly` | `boolean` |
| <a id="mergemethod"></a> `mergeMethod` | `readonly` | [`ResourceValueMergeMethod`](../../../type-aliases/ResourceValueMergeMethod.md) |
| <a id="value"></a> `value` | `readonly` | `TVALUE` |

## Accessors

### key

#### Get Signature

> **get** **key**(): `string`

Key of the condition set for this candidate.

##### Returns

`string`

## Methods

### toString()

> **toString**(): `string`

Returns a string representation of the candidate.

#### Returns

`string`

A string representation of this candidate.

***

### compare()

> `static` **compare**(`c1`, `c2`): `number`

Compare two [candidates](../interfaces/ICandidate.md) for sorting purposes.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `c1` | [`ICandidate`](../interfaces/ICandidate.md) | The first candidate to compare. |
| `c2` | [`ICandidate`](../interfaces/ICandidate.md) | The second candidate to compare. |

#### Returns

`number`

A negative number if c1 should come before c2, a positive number if c1 should
come after c2, or zero if they are equivalent.

***

### createCandidate()

> `static` **createCandidate**\<`TVALUE`\>(`params`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`Candidate`\<`TVALUE`\>\>

Create a new candidate.

#### Type Parameters

| Type Parameter |
| ------ |
| `TVALUE` *extends* [`JsonValue`](../../../../ts-res-ui-components/type-aliases/JsonValue.md) |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params` | [`ICandidate`](../interfaces/ICandidate.md)\<`TVALUE`\> | The [parameters](../interfaces/ICandidate.md) to use to create the new candidate. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`Candidate`\<`TVALUE`\>\>

`Success` with the new candidate if successful, or `Failure` if the
candidate could not be created.
