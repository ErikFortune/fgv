[Home](../../README.md) > [Hints](../README.md) > HiddenSinglesProvider

# Class: HiddenSinglesProvider

Hint provider for the Hidden Singles technique.

A Hidden Single occurs when a value can only be placed in one cell within
a row, column, or 3x3 box, even though that cell may have multiple candidates.

**Extends:** [`BaseHintProvider`](../../classes/BaseHintProvider.md)

## Constructors

<table><thead><tr><th>

Constructor

</th><th>

Modifiers

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

`constructor()`

</td><td>



</td><td>

Creates a new HiddenSinglesProvider instance.

</td></tr>
</tbody></table>

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

[create()](./HiddenSinglesProvider.create.md)

</td><td>

`static`

</td><td>

Static factory method to create a new HiddenSinglesProvider.

</td></tr>
<tr><td>

[canProvideHints(puzzle, state)](./HiddenSinglesProvider.canProvideHints.md)

</td><td>



</td><td>

Determines if this provider can potentially generate hints for the given puzzle.

</td></tr>
<tr><td>

[generateHints(puzzle, state, options)](./HiddenSinglesProvider.generateHints.md)

</td><td>



</td><td>

Generates all hidden single hints for the given puzzle.

</td></tr>
</tbody></table>
