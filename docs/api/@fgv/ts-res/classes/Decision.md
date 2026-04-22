[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-res](../README.md) / Decision

# Class: Decision\<TVALUE\>

Simple collectible implementation of [IDecision](../namespaces/Decisions/interfaces/IDecision.md).

## Extended by

- [`AbstractDecision`](../namespaces/Decisions/classes/AbstractDecision.md)

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TVALUE` *extends* [`JsonValue`](../../ts-res-ui-components/type-aliases/JsonValue.md) | [`JsonValue`](../../ts-res-ui-components/type-aliases/JsonValue.md) |

## Implements

- [`IDecision`](../namespaces/Decisions/interfaces/IDecision.md)\<`TVALUE`\>

## Constructors

### Constructor

> `protected` **new Decision**\<`TVALUE`\>(`params`): `Decision`\<`TVALUE`\>

Constructor for a Decision object.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params` | [`IDecisionConstructorParams`](../namespaces/Decisions/interfaces/IDecisionConstructorParams.md)\<`TVALUE`\> | [Parameters](../namespaces/Decisions/interfaces/IDecisionConstructorParams.md) used to create the decision. |

#### Returns

`Decision`\<`TVALUE`\>

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="candidates"></a> `candidates` | `readonly` | readonly [`Candidate`](../namespaces/Decisions/classes/Candidate.md)\<`TVALUE`\>[] | The sorted [ConditionSets](../namespaces/Conditions/classes/ConditionSet.md) that make up this decision. |
| <a id="defaultonlydecisionkey"></a> `DefaultOnlyDecisionKey` | `readonly` | [`DecisionKey`](../type-aliases/DecisionKey.md) | Key for the default-only decision (single condition set with no conditions). |
| <a id="emptydecisionkey"></a> `EmptyDecisionKey` | `readonly` | [`DecisionKey`](../type-aliases/DecisionKey.md) | Key for the empty decision (no condition sets). |

## Accessors

### index

#### Get Signature

> **get** **index**(): [`DecisionIndex`](../type-aliases/DecisionIndex.md) \| `undefined`

Unique global index for this decision.

##### Returns

[`DecisionIndex`](../type-aliases/DecisionIndex.md) \| `undefined`

#### Implementation of

[`IDecision`](../namespaces/Decisions/interfaces/IDecision.md).[`index`](../namespaces/Decisions/interfaces/IDecision.md#index)

***

### key

#### Get Signature

> **get** **key**(): [`DecisionKey`](../type-aliases/DecisionKey.md)

Unique global key for this decision, derived from the contents
of the decision.

##### Returns

[`DecisionKey`](../type-aliases/DecisionKey.md)

#### Implementation of

[`IDecision`](../namespaces/Decisions/interfaces/IDecision.md).[`key`](../namespaces/Decisions/interfaces/IDecision.md#key)

## Methods

### setIndex()

> **setIndex**(`index`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`DecisionIndex`](../type-aliases/DecisionIndex.md)\>

Sets the index for this decision.  Once set, index is immutable.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `index` | `number` | The index to set. |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`DecisionIndex`](../type-aliases/DecisionIndex.md)\>

`Success` with the new index if successful, or `Failure` with an error message if not.

***

### createDecision()

> `static` **createDecision**(`params`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`Decision`\<[`JsonValue`](../../ts-res-ui-components/type-aliases/JsonValue.md)\>\>

Creates a new Decision object.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params` | [`IDecisionCreateParams`](../namespaces/Decisions/interfaces/IDecisionCreateParams.md) | [Parameters](../namespaces/Decisions/interfaces/IDecisionCreateParams.md) used to create the decision. |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`Decision`\<[`JsonValue`](../../ts-res-ui-components/type-aliases/JsonValue.md)\>\>

`Success` with the new decision if successful, or `Failure` with an error message if not.

***

### getAbstractKey()

> `static` **getAbstractKey**(`conditionSets`): [`DecisionKey`](../type-aliases/DecisionKey.md)

Helper function to return a stable key for a the condition sets that
make up a decision.  The abstract
key is a `+`-separated list of the hashes of the sorted condition sets
that make up the decision.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `conditionSets` | readonly [`ConditionSet`](../namespaces/Conditions/classes/ConditionSet.md)[] | The condition sets to use to create the key. |

#### Returns

[`DecisionKey`](../type-aliases/DecisionKey.md)

A key derived from the condition set hashes.

***

### getKey()

> `static` **getKey**\<`TVALUE`\>(`candidates`): [`DecisionKey`](../type-aliases/DecisionKey.md)

Helper function to return a stable key for a set of condition sets.

#### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TVALUE` *extends* [`JsonValue`](../../ts-res-ui-components/type-aliases/JsonValue.md) | [`JsonValue`](../../ts-res-ui-components/type-aliases/JsonValue.md) |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `candidates` | readonly [`ICandidate`](../namespaces/Decisions/interfaces/ICandidate.md)\<`TVALUE`\>[] | The candidates whose condition sets are used to create the key. |

#### Returns

[`DecisionKey`](../type-aliases/DecisionKey.md)

A key derived from the condition set hashes.
