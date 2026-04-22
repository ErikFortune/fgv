[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [Decisions](../README.md) / IDecisionCreateParams

# Interface: IDecisionCreateParams\<TVALUE\>

Parameters used to create a new [Decision](../../../classes/Decision.md)
with the [createDecision](../../../classes/Decision.md#createdecision)
static method.

## Extended by

- [`IDecisionConstructorParams`](IDecisionConstructorParams.md)

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TVALUE` *extends* [`JsonValue`](../../../../ts-res-ui-components/type-aliases/JsonValue.md) | [`JsonValue`](../../../../ts-res-ui-components/type-aliases/JsonValue.md) |

## Properties

| Property | Type |
| ------ | ------ |
| <a id="candidates"></a> `candidates` | readonly [`ICandidate`](ICandidate.md)\<`TVALUE`\>[] |
| <a id="index"></a> `index?` | `number` |
