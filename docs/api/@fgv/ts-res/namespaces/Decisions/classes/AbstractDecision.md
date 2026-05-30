[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [Decisions](../README.md) / AbstractDecision

# Class: AbstractDecision

An abstract decision represents a class of decisions with candidates
that differ only in value.  It is a [IDecision\<number\>](../../../classes/Decision.md)
in which the `number` values are sequentially assigned indexes.
This allows us to represent each related [decision](../interfaces/IDecision.md) as an
abstract decision and a matching array containing
the corresponding value for each candidate.  This representation is highly cacheable.

## Extends

- [`Decision`](../../../classes/Decision.md)\<`number`\>

## Constructors

### Constructor

> `protected` **new AbstractDecision**(`params`): `AbstractDecision`

Constructor for an AbstractDecision object.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params` | [`IAbstractDecisionCreateParams`](../interfaces/IAbstractDecisionCreateParams.md) | [Parameters](../interfaces/IAbstractDecisionCreateParams.md) used to create the decision. |

#### Returns

`AbstractDecision`

#### Overrides

[`Decision`](../../../classes/Decision.md).[`constructor`](../../../classes/Decision.md#constructor)

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="candidates"></a> `candidates` | `readonly` | readonly [`Candidate`](Candidate.md)\<`number`\>[] | The sorted [ConditionSets](../../Conditions/classes/ConditionSet.md) that make up this decision. |
| <a id="defaultonlydecisionkey"></a> `DefaultOnlyDecisionKey` | `readonly` | [`DecisionKey`](../../../type-aliases/DecisionKey.md) | Key for the default-only decision (single condition set with no conditions). |
| <a id="emptydecisionkey"></a> `EmptyDecisionKey` | `readonly` | [`DecisionKey`](../../../type-aliases/DecisionKey.md) | Key for the empty decision (no condition sets). |

## Accessors

### index

#### Get Signature

> **get** **index**(): [`DecisionIndex`](../../../type-aliases/DecisionIndex.md) \| `undefined`

Unique global index for this decision.

##### Returns

[`DecisionIndex`](../../../type-aliases/DecisionIndex.md) \| `undefined`

#### Inherited from

[`Decision`](../../../classes/Decision.md).[`index`](../../../classes/Decision.md#index)

***

### key

#### Get Signature

> **get** **key**(): [`DecisionKey`](../../../type-aliases/DecisionKey.md)

Unique global key for this decision, derived from the contents
of the decision.

##### Returns

[`DecisionKey`](../../../type-aliases/DecisionKey.md)

#### Inherited from

[`Decision`](../../../classes/Decision.md).[`key`](../../../classes/Decision.md#key)

## Methods

### setIndex()

> **setIndex**(`index`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`DecisionIndex`](../../../type-aliases/DecisionIndex.md)\>

Sets the index for this decision.  Once set, index is immutable.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `index` | `number` | The index to set. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`DecisionIndex`](../../../type-aliases/DecisionIndex.md)\>

`Success` with the new index if successful, or `Failure` with an error message if not.

#### Inherited from

[`Decision`](../../../classes/Decision.md).[`setIndex`](../../../classes/Decision.md#setindex)

***

### toCompiled()

> **toCompiled**(`options?`): [`ICompiledAbstractDecision`](../../ResourceJson/namespaces/Compiled/interfaces/ICompiledAbstractDecision.md)

Converts this abstract decision to a compiled abstract decision representation.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options?` | [`ICompiledResourceOptions`](../../ResourceJson/namespaces/Compiled/interfaces/ICompiledResourceOptions.md) | Optional compilation options controlling the output format. |

#### Returns

[`ICompiledAbstractDecision`](../../ResourceJson/namespaces/Compiled/interfaces/ICompiledAbstractDecision.md)

A compiled abstract decision object that can be used for serialization or runtime processing.

***

### createAbstractDecision()

> `static` **createAbstractDecision**(`params`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`AbstractDecision`\>

Creates a new AbstractDecision object.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params` | [`IAbstractDecisionCreateParams`](../interfaces/IAbstractDecisionCreateParams.md) | [Parameters](../interfaces/IAbstractDecisionCreateParams.md) used to create the decision. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`AbstractDecision`\>

`Success` with the new decision if successful, or `Failure` with an
error message if not.

***

### createDecision()

> `static` **createDecision**(`params`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`Decision`](../../../classes/Decision.md)\<[`JsonValue`](../../../../ts-res-ui-components/type-aliases/JsonValue.md)\>\>

Creates a new [Decision](../../../classes/Decision.md) object.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params` | [`IDecisionCreateParams`](../interfaces/IDecisionCreateParams.md) | [Parameters](../interfaces/IDecisionCreateParams.md) used to create the decision. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`Decision`](../../../classes/Decision.md)\<[`JsonValue`](../../../../ts-res-ui-components/type-aliases/JsonValue.md)\>\>

`Success` with the new decision if successful, or `Failure` with an error message if not.

#### Inherited from

[`Decision`](../../../classes/Decision.md).[`createDecision`](../../../classes/Decision.md#createdecision)

***

### getAbstractKey()

> `static` **getAbstractKey**(`conditionSets`): [`DecisionKey`](../../../type-aliases/DecisionKey.md)

Helper function to return a stable key for a the condition sets that
make up a [decision](../../../classes/Decision.md).  The abstract
key is a `+`-separated list of the hashes of the sorted condition sets
that make up the decision.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `conditionSets` | readonly [`ConditionSet`](../../Conditions/classes/ConditionSet.md)[] | The condition sets to use to create the key. |

#### Returns

[`DecisionKey`](../../../type-aliases/DecisionKey.md)

A key derived from the condition set hashes.

#### Inherited from

[`Decision`](../../../classes/Decision.md).[`getAbstractKey`](../../../classes/Decision.md#getabstractkey)

***

### getKey()

> `static` **getKey**\<`TVALUE`\>(`candidates`): [`DecisionKey`](../../../type-aliases/DecisionKey.md)

Helper function to return a stable key for a set of condition sets.

#### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TVALUE` *extends* [`JsonValue`](../../../../ts-res-ui-components/type-aliases/JsonValue.md) | [`JsonValue`](../../../../ts-res-ui-components/type-aliases/JsonValue.md) |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `candidates` | readonly [`ICandidate`](../interfaces/ICandidate.md)\<`TVALUE`\>[] | The candidates whose condition sets are used to create the key. |

#### Returns

[`DecisionKey`](../../../type-aliases/DecisionKey.md)

A key derived from the condition set hashes.

#### Inherited from

[`Decision`](../../../classes/Decision.md).[`getKey`](../../../classes/Decision.md#getkey)
