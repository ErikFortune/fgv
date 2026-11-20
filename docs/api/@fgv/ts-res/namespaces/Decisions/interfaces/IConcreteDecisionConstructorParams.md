[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [Decisions](../README.md) / IConcreteDecisionConstructorParams

# Interface: IConcreteDecisionConstructorParams\<TVALUE\>

Protected constructor parameters for [ConcreteDecision](../classes/ConcreteDecision.md),
used to create a new concrete decision from an existing [AbstractDecision](../classes/AbstractDecision.md)
and a list of values.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-tvalue"></a> `TVALUE` *extends* [`JsonValue`](../../../../ts-res-ui-components/type-aliases/JsonValue.md) | [`JsonValue`](../../../../ts-res-ui-components/type-aliases/JsonValue.md) |

## Properties

| Property | Type |
| ------ | ------ |
| <a id="property-basedecision"></a> `baseDecision` | [`AbstractDecision`](../classes/AbstractDecision.md) |
| <a id="property-index"></a> `index?` | [`DecisionIndex`](../../../type-aliases/DecisionIndex.md) |
| <a id="property-values"></a> `values` | `TVALUE`[] |
