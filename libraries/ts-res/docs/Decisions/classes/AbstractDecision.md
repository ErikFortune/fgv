[Home](../../README.md) > [Decisions](../README.md) > AbstractDecision

# Class: AbstractDecision

An abstract decision represents a class of decisions with candidates
that differ only in value.  It is a Decisions.Decision | IDecision<number>
in which the `number` values are sequentially assigned indexes.
This allows us to represent each related Decisions.IDecision | decision as an
Decisions.AbstractDecision | abstract decision and a matching array containing
the corresponding value for each candidate.  This representation is highly cacheable.

**Extends:** [`Decision<number>`](../../classes/Decision.md)

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

[DecisionKey](../../type-aliases/DecisionKey.md)

</td><td>

Key for the empty decision (no condition sets).

</td></tr>
<tr><td>

[DefaultOnlyDecisionKey](./Decision.DefaultOnlyDecisionKey.md)

</td><td>

`readonly` `static`

</td><td>

[DecisionKey](../../type-aliases/DecisionKey.md)

</td><td>

Key for the default-only decision (single condition set with no conditions).

</td></tr>
<tr><td>

[candidates](./Decision.candidates.md)

</td><td>

`readonly`

</td><td>

readonly [Candidate](../../classes/Candidate.md)&lt;number&gt;[]

</td><td>

The sorted Conditions.ConditionSet  | ConditionSets that make up this decision.

</td></tr>
<tr><td>

[key](./Decision.key.md)

</td><td>

`readonly`

</td><td>

[DecisionKey](../../type-aliases/DecisionKey.md)

</td><td>

Unique global key for this decision, derived from the contents

</td></tr>
<tr><td>

[index](./Decision.index.md)

</td><td>

`readonly`

</td><td>

[DecisionIndex](../../type-aliases/DecisionIndex.md) | undefined

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

[createAbstractDecision(params)](./AbstractDecision.createAbstractDecision.md)

</td><td>

`static`

</td><td>

Creates a new Decisions.AbstractDecision | AbstractDecision object.

</td></tr>
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

[toCompiled(options)](./AbstractDecision.toCompiled.md)

</td><td>



</td><td>

Converts this abstract decision to a compiled abstract decision representation.

</td></tr>
<tr><td>

[setIndex(index)](./Decision.setIndex.md)

</td><td>



</td><td>

Sets the index for this decision.

</td></tr>
</tbody></table>
