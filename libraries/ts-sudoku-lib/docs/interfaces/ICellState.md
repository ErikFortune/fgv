[Home](../README.md) > ICellState

# Interface: ICellState

Describes the state of or a state update for a single ICell |cell in a
PuzzleSession | puzzle.

**Extends:** [`ICellContents`](ICellContents.md)

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

[id](./ICellState.id.md)

</td><td>

`readonly`

</td><td>

[CellId](../type-aliases/CellId.md)

</td><td>



</td></tr>
<tr><td>

[value](./ICellContents.value.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

The value of the ICell | cell, or `undefined` if no value has been assigned.

</td></tr>
<tr><td>

[notes](./ICellContents.notes.md)

</td><td>

`readonly`

</td><td>

number[]

</td><td>

Any notes associated with the ICell | cell.

</td></tr>
</tbody></table>
