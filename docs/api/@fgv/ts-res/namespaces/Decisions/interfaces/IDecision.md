[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [Decisions](../README.md) / IDecision

# Interface: IDecision\<TVALUE\>

Represents a decision, which is comprised of zero or more
[candidates](../classes/Candidate.md), each of which represents a possible
value for some resource, along with the conditions under which that value is valid.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TVALUE` *extends* [`JsonValue`](../../../../ts-res-ui-components/type-aliases/JsonValue.md) | [`JsonValue`](../../../../ts-res-ui-components/type-aliases/JsonValue.md) |

## Properties

| Property | Type |
| ------ | ------ |
| <a id="candidates"></a> `candidates` | readonly [`ICandidate`](ICandidate.md)\<`TVALUE`\>[] |
| <a id="index"></a> `index?` | [`DecisionIndex`](../../../type-aliases/DecisionIndex.md) |
| <a id="key"></a> `key` | [`DecisionKey`](../../../type-aliases/DecisionKey.md) |
