[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [Decisions](../README.md) / IDecisionConstructorParams

# Interface: IDecisionConstructorParams\<TVALUE\>

Parameters used to construct a new [Decision](../../../classes/Decision.md) with
the protected constructor.

## Extends

- [`IDecisionCreateParams`](IDecisionCreateParams.md)\<`TVALUE`\>

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-tvalue"></a> `TVALUE` *extends* [`JsonValue`](../../../../ts-res-ui-components/type-aliases/JsonValue.md) | [`JsonValue`](../../../../ts-res-ui-components/type-aliases/JsonValue.md) |

## Properties

| Property | Type |
| ------ | ------ |
| <a id="property-candidates"></a> `candidates` | readonly [`ICandidate`](ICandidate.md)\<`TVALUE`\>[] |
| <a id="property-index"></a> `index?` | `number` |
| <a id="property-isabstract"></a> `isAbstract` | `boolean` |
