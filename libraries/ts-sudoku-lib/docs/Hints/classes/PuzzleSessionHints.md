[Home](../../README.md) > [Hints](../README.md) > PuzzleSessionHints

# Class: PuzzleSessionHints

Wrapper class that integrates hint functionality with PuzzleSession.
Provides hint generation, application, and explanation capabilities while
maintaining integration with existing state management and undo/redo functionality.

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

[session](./PuzzleSessionHints.session.md)

</td><td>

`readonly`

</td><td>

[PuzzleSession](../../classes/PuzzleSession.md)

</td><td>

Gets the wrapped PuzzleSession instance.

</td></tr>
<tr><td>

[hintSystem](./PuzzleSessionHints.hintSystem.md)

</td><td>

`readonly`

</td><td>

[HintSystem](../../classes/HintSystem.md)

</td><td>

Gets the HintSystem instance.

</td></tr>
<tr><td>

[config](./PuzzleSessionHints.config.md)

</td><td>

`readonly`

</td><td>

[IPuzzleSessionHintsConfig](../../interfaces/IPuzzleSessionHintsConfig.md)

</td><td>

Gets the configuration.

</td></tr>
<tr><td>

[id](./PuzzleSessionHints.id.md)

</td><td>

`readonly`

</td><td>

string | undefined

</td><td>

Gets the puzzle ID.

</td></tr>
<tr><td>

[description](./PuzzleSessionHints.description.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Gets the puzzle description.

</td></tr>
<tr><td>

[numRows](./PuzzleSessionHints.numRows.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Gets the number of rows in the puzzle.

</td></tr>
<tr><td>

[numColumns](./PuzzleSessionHints.numColumns.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Gets the number of columns in the puzzle.

</td></tr>
<tr><td>

[state](./PuzzleSessionHints.state.md)

</td><td>

`readonly`

</td><td>

[PuzzleState](../../classes/PuzzleState.md)

</td><td>

Gets the current puzzle state.

</td></tr>
<tr><td>

[canUndo](./PuzzleSessionHints.canUndo.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Gets whether undo is possible.

</td></tr>
<tr><td>

[canRedo](./PuzzleSessionHints.canRedo.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Gets whether redo is possible.

</td></tr>
<tr><td>

[rows](./PuzzleSessionHints.rows.md)

</td><td>

`readonly`

</td><td>

[ICage](../../interfaces/ICage.md)[]

</td><td>

Gets the rows.

</td></tr>
<tr><td>

[cols](./PuzzleSessionHints.cols.md)

</td><td>

`readonly`

</td><td>

[ICage](../../interfaces/ICage.md)[]

</td><td>

Gets the columns.

</td></tr>
<tr><td>

[sections](./PuzzleSessionHints.sections.md)

</td><td>

`readonly`

</td><td>

[ICage](../../interfaces/ICage.md)[]

</td><td>

Gets the sections.

</td></tr>
<tr><td>

[cages](./PuzzleSessionHints.cages.md)

</td><td>

`readonly`

</td><td>

[ICage](../../interfaces/ICage.md)[]

</td><td>

Gets all cages.

</td></tr>
<tr><td>

[cells](./PuzzleSessionHints.cells.md)

</td><td>

`readonly`

</td><td>

[ICell](../../interfaces/ICell.md)[]

</td><td>

Gets all cells.

</td></tr>
<tr><td>

[nextStep](./PuzzleSessionHints.nextStep.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Gets the next step index.

</td></tr>
<tr><td>

[numSteps](./PuzzleSessionHints.numSteps.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Gets the number of steps.

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

[create(session, config)](./PuzzleSessionHints.create.md)

</td><td>

`static`

</td><td>

Creates a new PuzzleSessionHints wrapper for an existing PuzzleSession.

</td></tr>
<tr><td>

[checkIsSolved()](./PuzzleSessionHints.checkIsSolved.md)

</td><td>



</td><td>

Checks if the puzzle is solved.

</td></tr>
<tr><td>

[checkIsValid()](./PuzzleSessionHints.checkIsValid.md)

</td><td>



</td><td>

Checks if the puzzle is valid.

</td></tr>
<tr><td>

[updateCellValue(spec, value)](./PuzzleSessionHints.updateCellValue.md)

</td><td>



</td><td>

Updates a cell value.

</td></tr>
<tr><td>

[updateCellNotes(spec, notes)](./PuzzleSessionHints.updateCellNotes.md)

</td><td>



</td><td>

Updates cell notes.

</td></tr>
<tr><td>

[updateCells(updates)](./PuzzleSessionHints.updateCells.md)

</td><td>



</td><td>

Updates multiple cells.

</td></tr>
<tr><td>

[undo()](./PuzzleSessionHints.undo.md)

</td><td>



</td><td>

Performs an undo operation.

</td></tr>
<tr><td>

[redo()](./PuzzleSessionHints.redo.md)

</td><td>



</td><td>

Performs a redo operation.

</td></tr>
<tr><td>

[getHint(options)](./PuzzleSessionHints.getHint.md)

</td><td>



</td><td>

Gets the best available hint for the current puzzle state.

</td></tr>
<tr><td>

[getAllHints(options)](./PuzzleSessionHints.getAllHints.md)

</td><td>



</td><td>

Gets all available hints for the current puzzle state.

</td></tr>
<tr><td>

[applyHint(hint)](./PuzzleSessionHints.applyHint.md)

</td><td>



</td><td>

Applies a hint to the puzzle, updating the state and adding to undo history.

</td></tr>
<tr><td>

[getHintsForCell(spec, options)](./PuzzleSessionHints.getHintsForCell.md)

</td><td>



</td><td>

Gets hints that specifically affect a given cell.

</td></tr>
<tr><td>

[getExplanation(hint, level)](./PuzzleSessionHints.getExplanation.md)

</td><td>



</td><td>

Gets a formatted explanation for a hint.

</td></tr>
<tr><td>

[validateHint(hint)](./PuzzleSessionHints.validateHint.md)

</td><td>



</td><td>

Validates that a hint can be applied to the current state.

</td></tr>
<tr><td>

[hasHints(options)](./PuzzleSessionHints.hasHints.md)

</td><td>



</td><td>

Checks if hints are available for the current state.

</td></tr>
<tr><td>

[getHintStatistics(options)](./PuzzleSessionHints.getHintStatistics.md)

</td><td>



</td><td>

Gets statistics about available hints.

</td></tr>
<tr><td>

[getSystemSummary()](./PuzzleSessionHints.getSystemSummary.md)

</td><td>



</td><td>

Gets a summary of the hint system capabilities.

</td></tr>
<tr><td>

[getEmptyCells()](./PuzzleSessionHints.getEmptyCells.md)

</td><td>



</td><td>

Gets empty cells.

</td></tr>
<tr><td>

[getInvalidCells()](./PuzzleSessionHints.getInvalidCells.md)

</td><td>



</td><td>

Gets invalid cells.

</td></tr>
<tr><td>

[cellIsValid(spec)](./PuzzleSessionHints.cellIsValid.md)

</td><td>



</td><td>

Checks if a cell is valid.

</td></tr>
<tr><td>

[cellHasValue(spec)](./PuzzleSessionHints.cellHasValue.md)

</td><td>



</td><td>

Checks if a cell has a value.

</td></tr>
<tr><td>

[isValidForCell(spec, value)](./PuzzleSessionHints.isValidForCell.md)

</td><td>



</td><td>

Checks if a value is valid for a cell.

</td></tr>
<tr><td>

[getCellNeighbor(spec, direction, wrap)](./PuzzleSessionHints.getCellNeighbor.md)

</td><td>



</td><td>

Gets a cell neighbor.

</td></tr>
<tr><td>

[getCellContents(spec)](./PuzzleSessionHints.getCellContents.md)

</td><td>



</td><td>

Gets cell contents.

</td></tr>
<tr><td>

[cageContainsValue(spec, value)](./PuzzleSessionHints.cageContainsValue.md)

</td><td>



</td><td>

Checks if a cage contains a value.

</td></tr>
<tr><td>

[cageContainedValues(spec)](./PuzzleSessionHints.cageContainedValues.md)

</td><td>



</td><td>

Gets contained values in a cage.

</td></tr>
<tr><td>

[toStrings()](./PuzzleSessionHints.toStrings.md)

</td><td>



</td><td>

Gets string representation of the puzzle.

</td></tr>
</tbody></table>
