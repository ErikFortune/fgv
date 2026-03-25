[Home](../README.md) > ICell

# Interface: ICell

Describes the structure of a single cell in a PuzzleSession | puzzle.
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

[id](./ICell.id.md)

</td><td>

`readonly`

</td><td>

[CellId](../type-aliases/CellId.md)

</td><td>

Unique identifier for the cell.

</td></tr>
<tr><td>

[row](./ICell.row.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Row number of the cell.

</td></tr>
<tr><td>

[col](./ICell.col.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Column number of the cell.

</td></tr>
<tr><td>

[cages](./ICell.cages.md)

</td><td>

`readonly`

</td><td>

readonly [ICage](ICage.md)[]

</td><td>

All of the ICage | cages to which this cell belongs.

</td></tr>
<tr><td>

[immutable](./ICell.immutable.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Indicates whether this cell is a given value (immutable).

</td></tr>
<tr><td>

[immutableValue](./ICell.immutableValue.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Given value of this cell, or `undefined` if the cell is not immutable.

</td></tr>
</tbody></table>
