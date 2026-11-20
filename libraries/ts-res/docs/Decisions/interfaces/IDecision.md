[Home](../../README.md) > [Decisions](../README.md) > IDecision

# Interface: IDecision

Represents a decision, which is comprised of zero or more
Decisions.Candidate | candidates, each of which represents a possible
value for some resource, along with the conditions under which that value is valid.

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

[key](./IDecision.key.md)

</td><td>



</td><td>

[DecisionKey](../../type-aliases/DecisionKey.md)

</td><td>



</td></tr>
<tr><td>

[candidates](./IDecision.candidates.md)

</td><td>



</td><td>

readonly [ICandidate](../../interfaces/ICandidate.md)&lt;TVALUE&gt;[]

</td><td>



</td></tr>
<tr><td>

[index](./IDecision.index.md)

</td><td>



</td><td>

[DecisionIndex](../../type-aliases/DecisionIndex.md)

</td><td>



</td></tr>
</tbody></table>
