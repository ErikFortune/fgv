[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [Decisions](../README.md) / ConcreteDecision

# Class: ConcreteDecision\<TVALUE\>

A concrete decision is a [decision](../interfaces/IDecision.md)
implemented as a reference to a common [abstract decision](AbstractDecision.md) and a list of
values that correspond to the candidates in the abstract decision.  This allows us to represent a large
number of related decisions with a single abstract decision and a list of values.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-tvalue"></a> `TVALUE` *extends* [`JsonValue`](../../../../ts-res-ui-components/type-aliases/JsonValue.md) | [`JsonValue`](../../../../ts-res-ui-components/type-aliases/JsonValue.md) |

## Implements

- [`IDecision`](../interfaces/IDecision.md)\<`TVALUE`\>

## Constructors

### Constructor

> `protected` **new ConcreteDecision**\<`TVALUE`\>(`params`): `ConcreteDecision`\<`TVALUE`\>

Constructor for a ConcreteDecision object.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params` | [`IConcreteDecisionConstructorParams`](../interfaces/IConcreteDecisionConstructorParams.md)\<`TVALUE`\> | [Parameters](../interfaces/IConcreteDecisionConstructorParams.md) used to create the decision. |

#### Returns

`ConcreteDecision`\<`TVALUE`\>

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-basedecision"></a> `baseDecision` | `public readonly` | [`AbstractDecision`](AbstractDecision.md) |
| <a id="property-candidates"></a> `candidates` | `public readonly` | readonly [`ICandidate`](../interfaces/ICandidate.md)\<`TVALUE`\>[] |
| <a id="property-values"></a> `values` | `public readonly` | `TVALUE`[] |

## Accessors

### index

#### Get Signature

> **get** **index**(): [`DecisionIndex`](../../../type-aliases/DecisionIndex.md) \| `undefined`

Unique global index for this decision.

##### Returns

[`DecisionIndex`](../../../type-aliases/DecisionIndex.md) \| `undefined`

#### Implementation of

[`IDecision`](../interfaces/IDecision.md).[`index`](../interfaces/IDecision.md#property-index)

***

### key

#### Get Signature

> **get** **key**(): [`DecisionKey`](../../../type-aliases/DecisionKey.md)

Unique global key for this decision, derived from the condition set and
candidate values.

##### Returns

[`DecisionKey`](../../../type-aliases/DecisionKey.md)

#### Implementation of

[`IDecision`](../interfaces/IDecision.md).[`key`](../interfaces/IDecision.md#property-key)

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

***

### create()

> `static` **create**\<`TVALUE`\>(`params`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`ConcreteDecision`\<`TVALUE`\>\>

Creates a new ConcreteDecision object.

#### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-tvalue-1"></a> `TVALUE` *extends* [`JsonValue`](../../../../ts-res-ui-components/type-aliases/JsonValue.md) | [`JsonValue`](../../../../ts-res-ui-components/type-aliases/JsonValue.md) |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params` | [`IConcreteDecisionCreateParams`](../interfaces/IConcreteDecisionCreateParams.md)\<`TVALUE`\> | [Parameters](../interfaces/IConcreteDecisionCreateParams.md) used to create the decision. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`ConcreteDecision`\<`TVALUE`\>\>

`Success` with the new decision if successful, or `Failure` with an
error message if not.
