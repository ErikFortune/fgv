[Home](../README.md) > ConditionSetResolutionResult

# Class: ConditionSetResolutionResult

Represents the result of resolving a condition set.
Contains either a failure indicator or a list of condition priority/score tuples sorted by priority then score.

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

[matchType](./ConditionSetResolutionResult.matchType.md)

</td><td>

`readonly`

</td><td>

[ConditionMatchType](../type-aliases/ConditionMatchType.md)

</td><td>



</td></tr>
<tr><td>

[matches](./ConditionSetResolutionResult.matches.md)

</td><td>

`readonly`

</td><td>

readonly [IConditionMatchResult](../interfaces/IConditionMatchResult.md)[]

</td><td>



</td></tr>
<tr><td>

[maxPriority](./ConditionSetResolutionResult.maxPriority.md)

</td><td>

`readonly`

</td><td>

[ConditionPriority](../type-aliases/ConditionPriority.md)

</td><td>

Gets the highest priority among all condition matches.

</td></tr>
<tr><td>

[totalScore](./ConditionSetResolutionResult.totalScore.md)

</td><td>

`readonly`

</td><td>

[QualifierMatchScore](../type-aliases/QualifierMatchScore.md)

</td><td>

Gets the total score by summing all condition match scores.

</td></tr>
</tbody></table>

## Methods

<table><thead><tr><th>

Method

</th><th>

Modifiers

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[create(matchType, matches)](./ConditionSetResolutionResult.create.md)

</td><td>

`static`

</td><td>

Creates a new condition set resolution result.

</td></tr>
<tr><td>

[compare(a, b)](./ConditionSetResolutionResult.compare.md)

</td><td>

`static`

</td><td>

Compares two condition set resolution results for sorting purposes.

</td></tr>
</tbody></table>
