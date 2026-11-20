[Home](../README.md) > IConditionEvaluationResult

# Interface: IConditionEvaluationResult

Result of evaluating a single condition during resource resolution.
Shows how a specific qualifier value compared against a condition.

## Properties

<table><thead><tr><th>

Property

</th><th>

Modifiers

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[qualifierName](./IConditionEvaluationResult.qualifierName.md)

</td><td>



</td><td>

string

</td><td>

Name of the qualifier being evaluated

</td></tr>
<tr><td>

[qualifierValue](./IConditionEvaluationResult.qualifierValue.md)

</td><td>



</td><td>

string | undefined

</td><td>

Value of the qualifier in the resolution context

</td></tr>
<tr><td>

[conditionValue](./IConditionEvaluationResult.conditionValue.md)

</td><td>



</td><td>

string | undefined

</td><td>

Value specified in the resource condition

</td></tr>
<tr><td>

[operator](./IConditionEvaluationResult.operator.md)

</td><td>



</td><td>

string

</td><td>

Comparison operator used for evaluation

</td></tr>
<tr><td>

[score](./IConditionEvaluationResult.score.md)

</td><td>



</td><td>

number

</td><td>

Numeric score for this condition evaluation

</td></tr>
<tr><td>

[matched](./IConditionEvaluationResult.matched.md)

</td><td>



</td><td>

boolean

</td><td>

Whether this condition matched

</td></tr>
<tr><td>

[matchType](./IConditionEvaluationResult.matchType.md)

</td><td>



</td><td>

"match" | "matchAsDefault" | "noMatch"

</td><td>

Type of match that occurred

</td></tr>
<tr><td>

[scoreAsDefault](./IConditionEvaluationResult.scoreAsDefault.md)

</td><td>



</td><td>

number

</td><td>

Score when used as a default match

</td></tr>
<tr><td>

[conditionIndex](./IConditionEvaluationResult.conditionIndex.md)

</td><td>



</td><td>

number

</td><td>

Index of this condition within the candidate

</td></tr>
</tbody></table>
