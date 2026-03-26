[Home](../README.md) > IPuzzleDefinition

# Interface: IPuzzleDefinition

Complete puzzle definition with derived properties

**Extends:** [`IPuzzleDimensions`](IPuzzleDimensions.md)

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

[id](./IPuzzleDefinition.id.md)

</td><td>

`readonly`

</td><td>

string

</td><td>



</td></tr>
<tr><td>

[description](./IPuzzleDefinition.description.md)

</td><td>

`readonly`

</td><td>

string

</td><td>



</td></tr>
<tr><td>

[type](./IPuzzleDefinition.type.md)

</td><td>

`readonly`

</td><td>

[PuzzleType](../type-aliases/PuzzleType.md)

</td><td>



</td></tr>
<tr><td>

[level](./IPuzzleDefinition.level.md)

</td><td>

`readonly`

</td><td>

number

</td><td>



</td></tr>
<tr><td>

[cells](./IPuzzleDefinition.cells.md)

</td><td>

`readonly`

</td><td>

string

</td><td>



</td></tr>
<tr><td>

[totalRows](./IPuzzleDefinition.totalRows.md)

</td><td>

`readonly`

</td><td>

number

</td><td>



</td></tr>
<tr><td>

[totalColumns](./IPuzzleDefinition.totalColumns.md)

</td><td>

`readonly`

</td><td>

number

</td><td>



</td></tr>
<tr><td>

[maxValue](./IPuzzleDefinition.maxValue.md)

</td><td>

`readonly`

</td><td>

number

</td><td>



</td></tr>
<tr><td>

[totalCages](./IPuzzleDefinition.totalCages.md)

</td><td>

`readonly`

</td><td>

number

</td><td>



</td></tr>
<tr><td>

[basicCageTotal](./IPuzzleDefinition.basicCageTotal.md)

</td><td>

`readonly`

</td><td>

number

</td><td>



</td></tr>
<tr><td>

[cages](./IPuzzleDefinition.cages.md)

</td><td>

`readonly`

</td><td>

[ICage](ICage.md)[]

</td><td>



</td></tr>
<tr><td>

[cageWidthInCells](./IPuzzleDimensions.cageWidthInCells.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Width of each section/cage (e.g., 3 for standard Sudoku)

</td></tr>
<tr><td>

[cageHeightInCells](./IPuzzleDimensions.cageHeightInCells.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Height of each section/cage (e.g., 3 for standard Sudoku)

</td></tr>
<tr><td>

[boardWidthInCages](./IPuzzleDimensions.boardWidthInCages.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Number of cages horizontally (e.g., 3 for standard Sudoku)

</td></tr>
<tr><td>

[boardHeightInCages](./IPuzzleDimensions.boardHeightInCages.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Number of cages vertically (e.g., 3 for standard Sudoku)

</td></tr>
</tbody></table>
