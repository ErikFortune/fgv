[Home](../README.md) > IHintProvider

# Interface: IHintProvider

Interface for classes that can provide hints using a specific solving technique.

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

[techniqueId](./IHintProvider.techniqueId.md)

</td><td>

`readonly`

</td><td>

[TechniqueId](../type-aliases/TechniqueId.md)

</td><td>



</td></tr>
<tr><td>

[techniqueName](./IHintProvider.techniqueName.md)

</td><td>

`readonly`

</td><td>

string

</td><td>



</td></tr>
<tr><td>

[difficulty](./IHintProvider.difficulty.md)

</td><td>

`readonly`

</td><td>

[DifficultyLevel](../type-aliases/DifficultyLevel.md)

</td><td>



</td></tr>
<tr><td>

[priority](./IHintProvider.priority.md)

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

[canProvideHints(puzzle, state)](./IHintProvider.canProvideHints.md)

</td><td>



</td><td>

Determines if this provider can potentially generate hints for the given puzzle.

</td></tr>
<tr><td>

[generateHints(puzzle, state, options)](./IHintProvider.generateHints.md)

</td><td>



</td><td>

Generates all possible hints using this technique for the given puzzle.

</td></tr>
</tbody></table>
