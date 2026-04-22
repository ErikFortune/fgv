[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [Decisions](../README.md) / ICandidate

# Interface: ICandidate\<TVALUE\>

A resource candidate represents a single
possible value for some resource, with the conditions under which it is valid.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TVALUE` *extends* [`JsonValue`](../../../../ts-res-ui-components/type-aliases/JsonValue.md) | [`JsonValue`](../../../../ts-res-ui-components/type-aliases/JsonValue.md) |

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="conditionset"></a> `conditionSet` | `readonly` | [`ConditionSet`](../../Conditions/classes/ConditionSet.md) |
| <a id="ispartial"></a> `isPartial?` | `readonly` | `boolean` |
| <a id="mergemethod"></a> `mergeMethod?` | `readonly` | [`ResourceValueMergeMethod`](../../../type-aliases/ResourceValueMergeMethod.md) |
| <a id="value"></a> `value` | `readonly` | `TVALUE` |
