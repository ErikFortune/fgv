[Home](../README.md) > Candidate

# Class: Candidate

Simple implementation of Decisions.ICandidate | ICandidate with
helper methods for sorting and presentation.

**Implements:** [`ICandidate<TVALUE>`](../interfaces/ICandidate.md)

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

[conditionSet](./Candidate.conditionSet.md)

</td><td>

`readonly`

</td><td>

[ConditionSet](ConditionSet.md)

</td><td>



</td></tr>
<tr><td>

[value](./Candidate.value.md)

</td><td>

`readonly`

</td><td>

TVALUE

</td><td>



</td></tr>
<tr><td>

[isPartial](./Candidate.isPartial.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>



</td></tr>
<tr><td>

[mergeMethod](./Candidate.mergeMethod.md)

</td><td>

`readonly`

</td><td>

[ResourceValueMergeMethod](../type-aliases/ResourceValueMergeMethod.md)

</td><td>



</td></tr>
<tr><td>

[key](./Candidate.key.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Key of the condition set for this candidate.

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

[createCandidate(params)](./Candidate.createCandidate.md)

</td><td>

`static`

</td><td>

Create a new Decisions.Candidate | candidate.

</td></tr>
<tr><td>

[compare(c1, c2)](./Candidate.compare.md)

</td><td>

`static`

</td><td>

Compare two Decisions.ICandidate | candidates for sorting purposes.

</td></tr>
<tr><td>

[toString()](./Candidate.toString.md)

</td><td>



</td><td>

Returns a string representation of the Decisions.Candidate | candidate.

</td></tr>
</tbody></table>
