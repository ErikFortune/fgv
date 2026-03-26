[Home](../README.md) > ICage

# Interface: ICage

Describes the structure of a single cage in a PuzzleSession | puzzle.
Does not describe state.

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

[id](./ICage.id.md)

</td><td>

`readonly`

</td><td>

[CageId](../type-aliases/CageId.md)

</td><td>

Unique identifier for the cage.

</td></tr>
<tr><td>

[cageType](./ICage.cageType.md)

</td><td>

`readonly`

</td><td>

[CageType](../type-aliases/CageType.md)

</td><td>

The CageType | type of the cage.

</td></tr>
<tr><td>

[total](./ICage.total.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

The expected sum of all cells in the cage.

</td></tr>
<tr><td>

[numCells](./ICage.numCells.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

The number of cells in the cage.

</td></tr>
<tr><td>

[cellIds](./ICage.cellIds.md)

</td><td>

`readonly`

</td><td>

[CellId](../type-aliases/CellId.md)[]

</td><td>

The identity of each cell in the cage.

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

[containsCell(id)](./ICage.containsCell.md)

</td><td>



</td><td>

Determines if a supplied cell is present in the cage.

</td></tr>
</tbody></table>
