[Home](../../README.md) > [ResolutionTools](../README.md) > ICandidateInfo

# Interface: ICandidateInfo

Detailed information about how a resource candidate was evaluated during resolution.
Provides diagnostic data for understanding why candidates matched or didn't match.

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

[candidate](./ICandidateInfo.candidate.md)

</td><td>



</td><td>

IResourceCandidate

</td><td>

The candidate that was evaluated

</td></tr>
<tr><td>

[conditionSetKey](./ICandidateInfo.conditionSetKey.md)

</td><td>



</td><td>

string | null

</td><td>

Key identifying the condition set used for evaluation

</td></tr>
<tr><td>

[candidateIndex](./ICandidateInfo.candidateIndex.md)

</td><td>



</td><td>

number

</td><td>

Index of this candidate within the resource

</td></tr>
<tr><td>

[matched](./ICandidateInfo.matched.md)

</td><td>



</td><td>

boolean

</td><td>

Whether this candidate matched the resolution context

</td></tr>
<tr><td>

[matchType](./ICandidateInfo.matchType.md)

</td><td>



</td><td>

"match" | "matchAsDefault" | "noMatch"

</td><td>

Type of match that occurred

</td></tr>
<tr><td>

[isDefaultMatch](./ICandidateInfo.isDefaultMatch.md)

</td><td>



</td><td>

boolean

</td><td>

Whether this was a default match (fallback when no exact match)

</td></tr>
<tr><td>

[conditionEvaluations](./ICandidateInfo.conditionEvaluations.md)

</td><td>



</td><td>

[IConditionEvaluationResult](../../interfaces/IConditionEvaluationResult.md)[]

</td><td>

Detailed evaluation results for each condition

</td></tr>
</tbody></table>
