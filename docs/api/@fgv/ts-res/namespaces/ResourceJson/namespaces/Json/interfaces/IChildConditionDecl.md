[**@fgv Monorepo API Documentation**](../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../README.md) / [@fgv/ts-res](../../../../../README.md) / [ResourceJson](../../../README.md) / [Json](../README.md) / IChildConditionDecl

# Interface: IChildConditionDecl

Non-validated child declaration of a [condition](../../../../../classes/Condition.md).

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="property-operator"></a> `operator?` | [`ConditionOperator`](../../../../../type-aliases/ConditionOperator.md) | The operator to be used in the comparison. Default is 'matches'. |
| <a id="property-priority"></a> `priority?` | `number` | The priority of the condition. Default is the default priority for the qualifier. |
| <a id="property-scoreasdefault"></a> `scoreAsDefault?` | `number` | The score to be used if the condition is used as a default. |
| <a id="property-value"></a> `value` | `string` | The value to be compared. |
