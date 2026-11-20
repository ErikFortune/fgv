[**@fgv Monorepo API Documentation**](../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../README.md) / [@fgv/ts-res](../../../../../README.md) / [ResourceJson](../../../README.md) / [Json](../README.md) / ILooseConditionDecl

# Interface: ILooseConditionDecl\<TQualifierNames\>

Non-validated loose declaration of a [condition](../../../../../classes/Condition.md).

## Remarks

Parameterized on `TQualifierNames` so consumers authoring conditions
in code can opt into compile-time axis-name discipline (e.g. via a
literal-string union derived from a `qualifiers: ['tone'] as const`
decl-array). Defaults to `string`, so existing untyped callers
compile unchanged.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-tqualifiernames"></a> `TQualifierNames` *extends* `string` | `string` |

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="property-operator"></a> `operator?` | [`ConditionOperator`](../../../../../type-aliases/ConditionOperator.md) | The operator to be used in the comparison. Default is 'matches'. |
| <a id="property-priority"></a> `priority?` | `number` | The priority of the condition. Default is the default priority for the qualifier. |
| <a id="property-qualifiername"></a> `qualifierName` | `TQualifierNames` | The name of the [qualifier](../../../../../classes/Qualifier.md) to be compared. |
| <a id="property-scoreasdefault"></a> `scoreAsDefault?` | `number` | The score to be used if the condition is used as a default. |
| <a id="property-value"></a> `value` | `string` | The value to be compared. |
