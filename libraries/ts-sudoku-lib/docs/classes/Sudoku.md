[Home](../README.md) > Sudoku

# Class: Sudoku



**Extends:** [`Puzzle`](Puzzle.md)

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

[id](./Puzzle.id.md)

</td><td>

`readonly`

</td><td>

string

</td><td>



</td></tr>
<tr><td>

[description](./Puzzle.description.md)

</td><td>

`readonly`

</td><td>

string

</td><td>



</td></tr>
<tr><td>

[type](./Puzzle.type.md)

</td><td>

`readonly`

</td><td>

string

</td><td>



</td></tr>
<tr><td>

[initialState](./Puzzle.initialState.md)

</td><td>

`readonly`

</td><td>

[PuzzleState](PuzzleState.md)

</td><td>



</td></tr>
<tr><td>

[dimensions](./Puzzle.dimensions.md)

</td><td>

`readonly`

</td><td>

[IPuzzleDefinition](../interfaces/IPuzzleDefinition.md)

</td><td>



</td></tr>
<tr><td>

[_rows](./Puzzle._rows.md)

</td><td>

`readonly`

</td><td>

Map&lt;[CageId](../type-aliases/CageId.md), Cage&gt;

</td><td>



</td></tr>
<tr><td>

[_columns](./Puzzle._columns.md)

</td><td>

`readonly`

</td><td>

Map&lt;[CageId](../type-aliases/CageId.md), Cage&gt;

</td><td>



</td></tr>
<tr><td>

[_sections](./Puzzle._sections.md)

</td><td>

`readonly`

</td><td>

Map&lt;[CageId](../type-aliases/CageId.md), Cage&gt;

</td><td>



</td></tr>
<tr><td>

[_cages](./Puzzle._cages.md)

</td><td>

`readonly`

</td><td>

Map&lt;[CageId](../type-aliases/CageId.md), Cage&gt;

</td><td>



</td></tr>
<tr><td>

[_cells](./Puzzle._cells.md)

</td><td>

`readonly`

</td><td>

Map&lt;[CellId](../type-aliases/CellId.md), Cell&gt;

</td><td>



</td></tr>
<tr><td>

[numRows](./Puzzle.numRows.md)

</td><td>

`readonly`

</td><td>

number

</td><td>



</td></tr>
<tr><td>

[numColumns](./Puzzle.numColumns.md)

</td><td>

`readonly`

</td><td>

number

</td><td>



</td></tr>
<tr><td>

[rows](./Puzzle.rows.md)

</td><td>

`readonly`

</td><td>

Cage[]

</td><td>



</td></tr>
<tr><td>

[cols](./Puzzle.cols.md)

</td><td>

`readonly`

</td><td>

Cage[]

</td><td>



</td></tr>
<tr><td>

[sections](./Puzzle.sections.md)

</td><td>

`readonly`

</td><td>

Cage[]

</td><td>



</td></tr>
<tr><td>

[cages](./Puzzle.cages.md)

</td><td>

`readonly`

</td><td>

Cage[]

</td><td>



</td></tr>
<tr><td>

[cells](./Puzzle.cells.md)

</td><td>

`readonly`

</td><td>

Cell[]

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

[create(puzzle)](./Sudoku.create.md)

</td><td>

`static`

</td><td>



</td></tr>
<tr><td>

[checkIsSolved(state)](./Puzzle.checkIsSolved.md)

</td><td>



</td><td>



</td></tr>
<tr><td>

[checkIsValid(state)](./Puzzle.checkIsValid.md)

</td><td>



</td><td>



</td></tr>
<tr><td>

[getEmptyCells(state)](./Puzzle.getEmptyCells.md)

</td><td>



</td><td>



</td></tr>
<tr><td>

[getInvalidCells(state)](./Puzzle.getInvalidCells.md)

</td><td>



</td><td>



</td></tr>
<tr><td>

[getCellContents(spec, state)](./Puzzle.getCellContents.md)

</td><td>



</td><td>



</td></tr>
<tr><td>

[getCell(spec)](./Puzzle.getCell.md)

</td><td>



</td><td>



</td></tr>
<tr><td>

[getCellNeighbor(spec, direction, wrap)](./Puzzle.getCellNeighbor.md)

</td><td>



</td><td>



</td></tr>
<tr><td>

[updateContents(wantUpdates, state)](./Puzzle.updateContents.md)

</td><td>



</td><td>



</td></tr>
<tr><td>

[updateValues(wantUpdates, state)](./Puzzle.updateValues.md)

</td><td>



</td><td>



</td></tr>
<tr><td>

[updateNotes(wantUpdates, state)](./Puzzle.updateNotes.md)

</td><td>



</td><td>



</td></tr>
<tr><td>

[updateCellValue(want, value, state)](./Puzzle.updateCellValue.md)

</td><td>



</td><td>



</td></tr>
<tr><td>

[updateCellNotes(want, notes, state)](./Puzzle.updateCellNotes.md)

</td><td>



</td><td>



</td></tr>
<tr><td>

[getRow(row)](./Puzzle.getRow.md)

</td><td>



</td><td>



</td></tr>
<tr><td>

[getColumn(col)](./Puzzle.getColumn.md)

</td><td>



</td><td>



</td></tr>
<tr><td>

[getSection(spec)](./Puzzle.getSection.md)

</td><td>



</td><td>



</td></tr>
<tr><td>

[getCage(id)](./Puzzle.getCage.md)

</td><td>



</td><td>



</td></tr>
<tr><td>

[toStrings(state)](./Puzzle.toStrings.md)

</td><td>



</td><td>



</td></tr>
<tr><td>

[toString(state)](./Puzzle.toString.md)

</td><td>



</td><td>



</td></tr>
</tbody></table>
