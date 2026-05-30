[Home](../../README.md) > [Decisions](../README.md) > ConcreteDecision

# Class: ConcreteDecision

A Decisions.ConcreteDecision | concrete decision is a Decisions.IDecision | decision
implemented as a reference to a common Decisions.AbstractDecision | abstract decision and a list of
values that correspond to the candidates in the abstract decision.  This allows us to represent a large
number of related decisions with a single abstract decision and a list of values.

**Implements:** [`IDecision<TVALUE>`](../../interfaces/IDecision.md)

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

[baseDecision](./ConcreteDecision.baseDecision.md)

</td><td>

`readonly`

</td><td>

[AbstractDecision](../../classes/AbstractDecision.md)

</td><td>



</td></tr>
<tr><td>

[values](./ConcreteDecision.values.md)

</td><td>

`readonly`

</td><td>

TVALUE[]

</td><td>



</td></tr>
<tr><td>

[candidates](./ConcreteDecision.candidates.md)

</td><td>

`readonly`

</td><td>

readonly [ICandidate](../../interfaces/ICandidate.md)&lt;TVALUE&gt;[]

</td><td>



</td></tr>
<tr><td>

[key](./ConcreteDecision.key.md)

</td><td>

`readonly`

</td><td>

[DecisionKey](../../type-aliases/DecisionKey.md)

</td><td>

Unique global key for this decision, derived from the condition set and

</td></tr>
<tr><td>

[index](./ConcreteDecision.index.md)

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

[create(params)](./ConcreteDecision.create.md)

</td><td>

`static`

</td><td>

Creates a new Decisions.ConcreteDecision | ConcreteDecision object.

</td></tr>
<tr><td>

[setIndex(index)](./ConcreteDecision.setIndex.md)

</td><td>



</td><td>

Sets the index for this decision.

</td></tr>
</tbody></table>
