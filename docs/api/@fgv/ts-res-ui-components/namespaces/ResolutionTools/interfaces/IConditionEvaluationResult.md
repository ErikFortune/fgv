[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res-ui-components](../../../README.md) / [ResolutionTools](../README.md) / IConditionEvaluationResult

# Interface: IConditionEvaluationResult

Result of evaluating a single condition during resource resolution.
Shows how a specific qualifier value compared against a condition.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="conditionindex"></a> `conditionIndex` | `number` | Index of this condition within the candidate |
| <a id="conditionvalue"></a> `conditionValue` | `string` \| `undefined` | Value specified in the resource condition |
| <a id="matched"></a> `matched` | `boolean` | Whether this condition matched |
| <a id="matchtype"></a> `matchType` | `"match"` \| `"matchAsDefault"` \| `"noMatch"` | Type of match that occurred |
| <a id="operator"></a> `operator` | `string` | Comparison operator used for evaluation |
| <a id="qualifiername"></a> `qualifierName` | `string` | Name of the qualifier being evaluated |
| <a id="qualifiervalue"></a> `qualifierValue` | `string` \| `undefined` | Value of the qualifier in the resolution context |
| <a id="score"></a> `score` | `number` | Numeric score for this condition evaluation |
| <a id="scoreasdefault"></a> `scoreAsDefault?` | `number` | Score when used as a default match |
