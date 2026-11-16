[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res-ui-components](../../../README.md) / [ResolutionTools](../README.md) / IConditionEvaluationResult

# Interface: IConditionEvaluationResult

Result of evaluating a single condition during resource resolution.
Shows how a specific qualifier value compared against a condition.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="property-conditionindex"></a> `conditionIndex` | `number` | Index of this condition within the candidate |
| <a id="property-conditionvalue"></a> `conditionValue` | `string` \| `undefined` | Value specified in the resource condition |
| <a id="property-matched"></a> `matched` | `boolean` | Whether this condition matched |
| <a id="property-matchtype"></a> `matchType` | `"match"` \| `"matchAsDefault"` \| `"noMatch"` | Type of match that occurred |
| <a id="property-operator"></a> `operator` | `string` | Comparison operator used for evaluation |
| <a id="property-qualifiername"></a> `qualifierName` | `string` | Name of the qualifier being evaluated |
| <a id="property-qualifiervalue"></a> `qualifierValue` | `string` \| `undefined` | Value of the qualifier in the resolution context |
| <a id="property-score"></a> `score` | `number` | Numeric score for this condition evaluation |
| <a id="property-scoreasdefault"></a> `scoreAsDefault?` | `number` | Score when used as a default match |
