[Home](../README.md) > Decisions

# Namespace: Decisions

## Classes

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[Candidate](./classes/Candidate.md)

</td><td>

Simple implementation of Decisions.ICandidate | ICandidate with

</td></tr>
<tr><td>

[AbstractDecision](./classes/AbstractDecision.md)

</td><td>

An abstract decision represents a class of decisions with candidates
that differ only in value.

</td></tr>
<tr><td>

[AbstractDecisionCollector](./classes/AbstractDecisionCollector.md)

</td><td>

A `ValidatingCollector` for Decisions.AbstractDecision | AbstractDecisions.

</td></tr>
<tr><td>

[ConcreteDecision](./classes/ConcreteDecision.md)

</td><td>

A Decisions.ConcreteDecision | concrete decision is a Decisions.IDecision | decision
implemented as a reference to a common Decisions.AbstractDecision | abstract decision and a list of
values that correspond to the candidates in the abstract decision.

</td></tr>
</tbody></table>

## Interfaces

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[IDecision](./interfaces/IDecision.md)

</td><td>

Represents a decision, which is comprised of zero or more

</td></tr>
<tr><td>

[ICandidate](./interfaces/ICandidate.md)

</td><td>

A Decisions.ICandidate | resource candidate represents a single

</td></tr>
<tr><td>

[IDecisionCreateParams](./interfaces/IDecisionCreateParams.md)

</td><td>

Parameters used to create a new Decisions.Decision | Decision

</td></tr>
<tr><td>

[IDecisionConstructorParams](./interfaces/IDecisionConstructorParams.md)

</td><td>

Parameters used to construct a new Decisions.Decision | Decision with

</td></tr>
<tr><td>

[IAbstractDecisionCreateParams](./interfaces/IAbstractDecisionCreateParams.md)

</td><td>

Parameters to create an Decisions.AbstractDecision | AbstractDecision.

</td></tr>
<tr><td>

[IAbstractDecisionCollectorCreateParams](./interfaces/IAbstractDecisionCollectorCreateParams.md)

</td><td>

Parameters for creating a Decisions.AbstractDecisionCollector | AbstractDecisionCollector.

</td></tr>
<tr><td>

[IConcreteDecisionCreateParams](./interfaces/IConcreteDecisionCreateParams.md)

</td><td>

Parameters used to create a new Decisions.ConcreteDecision | ConcreteDecision,

</td></tr>
<tr><td>

[IConcreteDecisionConstructorParams](./interfaces/IConcreteDecisionConstructorParams.md)

</td><td>

Protected constructor parameters for Decisions.ConcreteDecision | ConcreteDecision,

</td></tr>
</tbody></table>

## Type Aliases

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[ReadOnlyAbstractDecisionCollector](./type-aliases/ReadOnlyAbstractDecisionCollector.md)

</td><td>

A read-only Decisions.AbstractDecisionCollector | AbstractDecisionCollector.

</td></tr>
</tbody></table>
