[Home](../README.md) > PuzzleSession

# Class: PuzzleSession

Represents a single puzzle session, including puzzle, current state and redo/undo.

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

[state](./PuzzleSession.state.md)

</td><td>



</td><td>

[PuzzleState](PuzzleState.md)

</td><td>

The current PuzzleState | state of this puzzle session.

</td></tr>
<tr><td>

[id](./PuzzleSession.id.md)

</td><td>

`readonly`

</td><td>

string | undefined

</td><td>

ID of the puzzle being solved.

</td></tr>
<tr><td>

[description](./PuzzleSession.description.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Description of the puzzle being solved.

</td></tr>
<tr><td>

[type](./PuzzleSession.type.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Type of the puzzle being solved.

</td></tr>
<tr><td>

[numRows](./PuzzleSession.numRows.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Number of rows in the puzzle being solved.

</td></tr>
<tr><td>

[numColumns](./PuzzleSession.numColumns.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Number of columns in the puzzle being solved.

</td></tr>
<tr><td>

[rows](./PuzzleSession.rows.md)

</td><td>

`readonly`

</td><td>

[ICage](../interfaces/ICage.md)[]

</td><td>

The row ICage | cages in the puzzle being solved.

</td></tr>
<tr><td>

[cols](./PuzzleSession.cols.md)

</td><td>

`readonly`

</td><td>

[ICage](../interfaces/ICage.md)[]

</td><td>

The column ICage | cages in the puzzle being solved.

</td></tr>
<tr><td>

[sections](./PuzzleSession.sections.md)

</td><td>

`readonly`

</td><td>

[ICage](../interfaces/ICage.md)[]

</td><td>

The section ICage | cages in the puzzle being solved.

</td></tr>
<tr><td>

[cages](./PuzzleSession.cages.md)

</td><td>

`readonly`

</td><td>

[ICage](../interfaces/ICage.md)[]

</td><td>

All ICage | cages in the puzzle being solved.

</td></tr>
<tr><td>

[cells](./PuzzleSession.cells.md)

</td><td>

`readonly`

</td><td>

[ICell](../interfaces/ICell.md)[]

</td><td>

The cells ICell | cells in the puzzle being solved.

</td></tr>
<tr><td>

[puzzle](./PuzzleSession.puzzle.md)

</td><td>

`readonly`

</td><td>

[Puzzle](Puzzle.md)

</td><td>

The puzzle structure for this session.

</td></tr>
<tr><td>

[nextStep](./PuzzleSession.nextStep.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Index of the next step in this puzzle session.

</td></tr>
<tr><td>

[numSteps](./PuzzleSession.numSteps.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Number of steps currently elapsed in this puzzle session.

</td></tr>
<tr><td>

[canUndo](./PuzzleSession.canUndo.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Indicates whether undo is currently possible.

</td></tr>
<tr><td>

[canRedo](./PuzzleSession.canRedo.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Indicates whether redo is currently possible.

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

[create(puzzle)](./PuzzleSession.create.md)

</td><td>

`static`

</td><td>

Creates a new PuzzleSession | puzzle session from a supplied

</td></tr>
<tr><td>

[checkIsSolved()](./PuzzleSession.checkIsSolved.md)

</td><td>



</td><td>

Determines if the puzzle is correctly solved.

</td></tr>
<tr><td>

[checkIsValid()](./PuzzleSession.checkIsValid.md)

</td><td>



</td><td>

Determines if the puzzle is valid in its current state.

</td></tr>
<tr><td>

[getEmptyCells()](./PuzzleSession.getEmptyCells.md)

</td><td>



</td><td>

Gets all of the currently empty ICell | cells in the puzzle.

</td></tr>
<tr><td>

[getInvalidCells()](./PuzzleSession.getInvalidCells.md)

</td><td>



</td><td>

Gets all of the currently invalid ICell | cells in the puzzle.

</td></tr>
<tr><td>

[cellIsValid(spec)](./PuzzleSession.cellIsValid.md)

</td><td>



</td><td>

Determines if a cell is valid.

</td></tr>
<tr><td>

[cellHasValue(spec)](./PuzzleSession.cellHasValue.md)

</td><td>



</td><td>

Determines if a cell has a value.

</td></tr>
<tr><td>

[isValidForCell(spec, value)](./PuzzleSession.isValidForCell.md)

</td><td>



</td><td>

Determines if supplied value is valid for a specific cell.

</td></tr>
<tr><td>

[getCellNeighbor(spec, direction, wrap)](./PuzzleSession.getCellNeighbor.md)

</td><td>



</td><td>

Gets the neighbor for a cell in a given direction using specified wrapping rules.

</td></tr>
<tr><td>

[getCellContents(spec)](./PuzzleSession.getCellContents.md)

</td><td>



</td><td>

Gets the ICellContents | contents for a specified cell.

</td></tr>
<tr><td>

[updateCellValue(spec, value)](./PuzzleSession.updateCellValue.md)

</td><td>



</td><td>

Updates the value of a cell.

</td></tr>
<tr><td>

[updateCellNotes(spec, notes)](./PuzzleSession.updateCellNotes.md)

</td><td>



</td><td>

Updates the notes on a cell.

</td></tr>
<tr><td>

[updateCells(updates)](./PuzzleSession.updateCells.md)

</td><td>



</td><td>

Updates value & notes for multiple cells.

</td></tr>
<tr><td>

[cageContainsValue(spec, value)](./PuzzleSession.cageContainsValue.md)

</td><td>



</td><td>

Determines if some ICage | cage contains a specific value.

</td></tr>
<tr><td>

[cageContainedValues(spec)](./PuzzleSession.cageContainedValues.md)

</td><td>



</td><td>

Determines the numbers currently present in some cage.

</td></tr>
<tr><td>

[undo()](./PuzzleSession.undo.md)

</td><td>



</td><td>

Undo a single move in this puzzle session.

</td></tr>
<tr><td>

[redo()](./PuzzleSession.redo.md)

</td><td>



</td><td>

Redo a single move in this puzzle session.

</td></tr>
<tr><td>

[toStrings()](./PuzzleSession.toStrings.md)

</td><td>



</td><td>

Gets a string representation of this puzzle, one string

</td></tr>
</tbody></table>
