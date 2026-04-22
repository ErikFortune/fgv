[**@fgv Monorepo API Documentation**](../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../README.md) / [@fgv/ts-res](../../../../../README.md) / [ResourceJson](../../../README.md) / [Compiled](../README.md) / ICompiledCondition

# Interface: ICompiledCondition

Represents a compiled condition used for resource selection.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="metadata"></a> `metadata?` | [`ICompiledConditionMetadata`](ICompiledConditionMetadata.md) | Optional metadata containing human-readable information about this condition. |
| <a id="operator"></a> `operator?` | [`ConditionOperator`](../../../../../type-aliases/ConditionOperator.md) | Optional operator to apply in the condition evaluation. |
| <a id="priority"></a> `priority` | [`ConditionPriority`](../../../../../type-aliases/ConditionPriority.md) | The priority of the condition when multiple conditions match. |
| <a id="qualifierindex"></a> `qualifierIndex` | [`QualifierIndex`](../../../../../type-aliases/QualifierIndex.md) | Index reference to the qualifier being evaluated. |
| <a id="scoreasdefault"></a> `scoreAsDefault?` | [`QualifierMatchScore`](../../../../../type-aliases/QualifierMatchScore.md) | Optional score to use when treating this condition as a default. |
| <a id="value"></a> `value` | `string` | The value to compare against when evaluating the condition. |
