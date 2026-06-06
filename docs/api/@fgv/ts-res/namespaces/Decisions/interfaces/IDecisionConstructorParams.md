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
| `TVALUE` *extends* [`JsonValue`](../../../../ts-res-ui-components/type-aliases/JsonValue.md) | [`JsonValue`](../../../../ts-res-ui-components/type-aliases/JsonValue.md) |

## Properties

| Property | Type |
| ------ | ------ |
| <a id="candidates"></a> `candidates` | readonly [`ICandidate`](ICandidate.md)\<`TVALUE`\>[] |
| <a id="index"></a> `index?` | `number` |
| <a id="isabstract"></a> `isAbstract` | `boolean` |
