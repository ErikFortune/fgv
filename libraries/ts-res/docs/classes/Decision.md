[Home](../README.md) > Decision

# Class: Decision

Simple collectible implementation of Decisions.IDecision | IDecision.

**Implements:** [`IDecision<TVALUE>`](../interfaces/IDecision.md)

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

[EmptyDecisionKey](./Decision.EmptyDecisionKey.md)

</td><td>

`readonly` `static`

</td><td>

[DecisionKey](../type-aliases/DecisionKey.md)

</td><td>

Key for the empty decision (no condition sets).

</td></tr>
<tr><td>

[DefaultOnlyDecisionKey](./Decision.DefaultOnlyDecisionKey.md)

</td><td>

`readonly` `static`

</td><td>

[DecisionKey](../type-aliases/DecisionKey.md)

</td><td>

Key for the default-only decision (single condition set with no conditions).

</td></tr>
<tr><td>

[candidates](./Decision.candidates.md)

</td><td>

`readonly`

</td><td>

readonly [Candidate](Candidate.md)&lt;TVALUE&gt;[]

</td><td>

The sorted Conditions.ConditionSet  | ConditionSets that make up this decision.

</td></tr>
<tr><td>

[key](./Decision.key.md)

</td><td>

`readonly`

</td><td>

[DecisionKey](../type-aliases/DecisionKey.md)

</td><td>

Unique global key for this decision, derived from the contents

</td></tr>
<tr><td>

[index](./Decision.index.md)

</td><td>

`readonly`

</td><td>

[DecisionIndex](../type-aliases/DecisionIndex.md) | undefined

</td><td>

Unique global index for this decision.

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

[createDecision(params)](./Decision.createDecision.md)

</td><td>

`static`

</td><td>

Creates a new Decisions.Decision | Decision object.

</td></tr>
<tr><td>

[getAbstractKey(conditionSets)](./Decision.getAbstractKey.md)

</td><td>

`static`

</td><td>

Helper function to return a stable key for a the condition sets that
make up a Decisions.Decision | decision.

</td></tr>
<tr><td>

[getKey(candidates)](./Decision.getKey.md)

</td><td>

`static`

</td><td>

Helper function to return a stable key for a set of condition sets.

</td></tr>
<tr><td>

[setIndex(index)](./Decision.setIndex.md)

</td><td>



</td><td>

Sets the index for this decision.

</td></tr>
</tbody></table>
