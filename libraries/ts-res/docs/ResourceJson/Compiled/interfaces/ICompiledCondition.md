[Home](../../../README.md) > [ResourceJson](../../README.md) > [Compiled](../README.md) > ICompiledCondition

# Interface: ICompiledCondition

Represents a compiled condition used for resource selection.

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

[qualifierIndex](./ICompiledCondition.qualifierIndex.md)

</td><td>



</td><td>

[QualifierIndex](../../../type-aliases/QualifierIndex.md)

</td><td>

Index reference to the qualifier being evaluated.

</td></tr>
<tr><td>

[operator](./ICompiledCondition.operator.md)

</td><td>



</td><td>

[ConditionOperator](../../../type-aliases/ConditionOperator.md)

</td><td>

Optional operator to apply in the condition evaluation.

</td></tr>
<tr><td>

[value](./ICompiledCondition.value.md)

</td><td>



</td><td>

string

</td><td>

The value to compare against when evaluating the condition.

</td></tr>
<tr><td>

[priority](./ICompiledCondition.priority.md)

</td><td>



</td><td>

[ConditionPriority](../../../type-aliases/ConditionPriority.md)

</td><td>

The priority of the condition when multiple conditions match.

</td></tr>
<tr><td>

[scoreAsDefault](./ICompiledCondition.scoreAsDefault.md)

</td><td>



</td><td>

[QualifierMatchScore](../../../type-aliases/QualifierMatchScore.md)

</td><td>

Optional score to use when treating this condition as a default.

</td></tr>
<tr><td>

[metadata](./ICompiledCondition.metadata.md)

</td><td>



</td><td>

[ICompiledConditionMetadata](../../../interfaces/ICompiledConditionMetadata.md)

</td><td>

Optional metadata containing human-readable information about this condition.

</td></tr>
</tbody></table>
