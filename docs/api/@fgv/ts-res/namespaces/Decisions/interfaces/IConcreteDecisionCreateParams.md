[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [Decisions](../README.md) / IConcreteDecisionCreateParams

# Interface: IConcreteDecisionCreateParams\<TVALUE\>

Parameters used to create a new [ConcreteDecision](../classes/ConcreteDecision.md),
given an [AbstractDecisionCollector](../classes/AbstractDecisionCollector.md) and a
list of [candidates](ICandidate.md).

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TVALUE` *extends* [`JsonValue`](../../../../ts-res-ui-components/type-aliases/JsonValue.md) | [`JsonValue`](../../../../ts-res-ui-components/type-aliases/JsonValue.md) |

## Properties

| Property | Type |
| ------ | ------ |
| <a id="candidates"></a> `candidates` | readonly [`ICandidate`](ICandidate.md)\<`TVALUE`\>[] |
| <a id="decisions"></a> `decisions` | [`AbstractDecisionCollector`](../classes/AbstractDecisionCollector.md) |
| <a id="index"></a> `index?` | `number` |
