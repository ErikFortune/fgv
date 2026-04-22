[**@fgv Monorepo API Documentation**](../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../README.md) / [@fgv/ts-res](../../../../../README.md) / [ResourceJson](../../../README.md) / [Json](../README.md) / ILooseConditionDecl

# Interface: ILooseConditionDecl

Non-validated loose declaration of a [condition](../../../../../classes/Condition.md).

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="operator"></a> `operator?` | [`ConditionOperator`](../../../../../type-aliases/ConditionOperator.md) | The operator to be used in the comparison. Default is 'matches'. |
| <a id="priority"></a> `priority?` | `number` | The priority of the condition. Default is the default priority for the qualifier. |
| <a id="qualifiername"></a> `qualifierName` | `string` | The name of the [qualifier](../../../../../classes/Qualifier.md) to be compared. |
| <a id="scoreasdefault"></a> `scoreAsDefault?` | `number` | The score to be used if the condition is used as a default. |
| <a id="value"></a> `value` | `string` | The value to be compared. |
