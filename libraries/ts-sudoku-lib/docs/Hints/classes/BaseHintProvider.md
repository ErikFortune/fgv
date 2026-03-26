[Home](../../README.md) > [Hints](../README.md) > BaseHintProvider

# Class: BaseHintProvider

Abstract base class providing common functionality for hint providers.

**Implements:** [`IHintProvider`](../../interfaces/IHintProvider.md)

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

[techniqueId](./BaseHintProvider.techniqueId.md)

</td><td>

`readonly`

</td><td>

[TechniqueId](../../type-aliases/TechniqueId.md)

</td><td>



</td></tr>
<tr><td>

[techniqueName](./BaseHintProvider.techniqueName.md)

</td><td>

`readonly`

</td><td>

string

</td><td>



</td></tr>
<tr><td>

[difficulty](./BaseHintProvider.difficulty.md)

</td><td>

`readonly`

</td><td>

[DifficultyLevel](../../type-aliases/DifficultyLevel.md)

</td><td>



</td></tr>
<tr><td>

[priority](./BaseHintProvider.priority.md)

</td><td>

`readonly`

</td><td>

number

</td><td>



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

[canProvideHints(puzzle, state)](./BaseHintProvider.canProvideHints.md)

</td><td>



</td><td>

Abstract method to be implemented by concrete providers.

</td></tr>
<tr><td>

[generateHints(puzzle, state, options)](./BaseHintProvider.generateHints.md)

</td><td>



</td><td>

Abstract method to be implemented by concrete providers.

</td></tr>
</tbody></table>
