<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@fgv/ts-sudoku-lib](./ts-sudoku-lib.md) &gt; [PuzzleSession](./ts-sudoku-lib.puzzlesession.md)

## PuzzleSession class

Represents a single puzzle session, including puzzle, current state and redo/undo.

**Signature:**

```typescript
export declare class PuzzleSession 
```

## Remarks

The constructor for this class is marked as internal. Third-party code should not call the constructor directly or create subclasses that extend the `PuzzleSession` class.

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
<tbody><tr><td>

[\_nextStep](./ts-sudoku-lib.puzzlesession._nextstep.md)


</td><td>

`protected`


</td><td>

number


</td><td>


</td></tr>
<tr><td>

[\_numSteps](./ts-sudoku-lib.puzzlesession._numsteps.md)


</td><td>

`protected`


</td><td>

number


</td><td>


</td></tr>
<tr><td>

[\_puzzle](./ts-sudoku-lib.puzzlesession._puzzle.md)


</td><td>

`protected`

`readonly`


</td><td>

Puzzle


</td><td>


</td></tr>
<tr><td>

[\_steps](./ts-sudoku-lib.puzzlesession._steps.md)


</td><td>

`protected`


</td><td>

IPuzzleStep\[\]


</td><td>


</td></tr>
<tr><td>

[cages](./ts-sudoku-lib.puzzlesession.cages.md)


</td><td>

`readonly`


</td><td>

[ICage](./ts-sudoku-lib.icage.md)<!-- -->\[\]


</td><td>

All [cages](./ts-sudoku-lib.icage.md) in the puzzle being solved.


</td></tr>
<tr><td>

[canRedo](./ts-sudoku-lib.puzzlesession.canredo.md)


</td><td>

`readonly`


</td><td>

boolean


</td><td>

Indicates whether redo is currently possible.


</td></tr>
<tr><td>

[canUndo](./ts-sudoku-lib.puzzlesession.canundo.md)


</td><td>

`readonly`


</td><td>

boolean


</td><td>

\* Indicates whether undo is currently possible.


</td></tr>
<tr><td>

[cells](./ts-sudoku-lib.puzzlesession.cells.md)


</td><td>

`readonly`


</td><td>

[ICell](./ts-sudoku-lib.icell.md)<!-- -->\[\]


</td><td>

The cells [cells](./ts-sudoku-lib.icell.md) in the puzzle being solved.


</td></tr>
<tr><td>

[cols](./ts-sudoku-lib.puzzlesession.cols.md)


</td><td>

`readonly`


</td><td>

[ICage](./ts-sudoku-lib.icage.md)<!-- -->\[\]


</td><td>

The column [cages](./ts-sudoku-lib.icage.md) in the puzzle being solved.


</td></tr>
<tr><td>

[description](./ts-sudoku-lib.puzzlesession.description.md)


</td><td>

`readonly`


</td><td>

string


</td><td>

Description of the puzzle being solved.


</td></tr>
<tr><td>

[id](./ts-sudoku-lib.puzzlesession.id.md)


</td><td>

`readonly`


</td><td>

string \| undefined


</td><td>

ID of the puzzle being solved.


</td></tr>
<tr><td>

[nextStep](./ts-sudoku-lib.puzzlesession.nextstep.md)


</td><td>

`readonly`


</td><td>

number


</td><td>

Index of the next step in this puzzle session.


</td></tr>
<tr><td>

[numColumns](./ts-sudoku-lib.puzzlesession.numcolumns.md)


</td><td>

`readonly`


</td><td>

number


</td><td>

Number of columns in the puzzle being solved.


</td></tr>
<tr><td>

[numRows](./ts-sudoku-lib.puzzlesession.numrows.md)


</td><td>

`readonly`


</td><td>

number


</td><td>

Number of rows in the puzzle being solved.


</td></tr>
<tr><td>

[numSteps](./ts-sudoku-lib.puzzlesession.numsteps.md)


</td><td>

`readonly`


</td><td>

number


</td><td>

Number of steps currently elapsed in this puzzle session. Note that after undo, `nextStep` will be less than `numSteps`<!-- -->.


</td></tr>
<tr><td>

[rows](./ts-sudoku-lib.puzzlesession.rows.md)


</td><td>

`readonly`


</td><td>

[ICage](./ts-sudoku-lib.icage.md)<!-- -->\[\]


</td><td>

The row [cages](./ts-sudoku-lib.icage.md) in the puzzle being solved.


</td></tr>
<tr><td>

[sections](./ts-sudoku-lib.puzzlesession.sections.md)


</td><td>

`readonly`


</td><td>

[ICage](./ts-sudoku-lib.icage.md)<!-- -->\[\]


</td><td>

The section [cages](./ts-sudoku-lib.icage.md) in the puzzle being solved.


</td></tr>
<tr><td>

[state](./ts-sudoku-lib.puzzlesession.state.md)


</td><td>


</td><td>

[PuzzleState](./ts-sudoku-lib.puzzlestate.md)


</td><td>

The current [state](./ts-sudoku-lib.puzzlestate.md) of this puzzle session.


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
<tbody><tr><td>

[cageContainedValues(spec)](./ts-sudoku-lib.puzzlesession.cagecontainedvalues.md)


</td><td>


</td><td>

Determines the numbers currently present in some cage.


</td></tr>
<tr><td>

[cageContainsValue(spec, value)](./ts-sudoku-lib.puzzlesession.cagecontainsvalue.md)


</td><td>


</td><td>

Determines if some [cage](./ts-sudoku-lib.icage.md) contains a specific value.


</td></tr>
<tr><td>

[cellHasValue(spec)](./ts-sudoku-lib.puzzlesession.cellhasvalue.md)


</td><td>


</td><td>

Determines if a cell has a value.


</td></tr>
<tr><td>

[cellIsValid(spec)](./ts-sudoku-lib.puzzlesession.cellisvalid.md)


</td><td>


</td><td>

Determines if a cell is valid.


</td></tr>
<tr><td>

[checkIsSolved()](./ts-sudoku-lib.puzzlesession.checkissolved.md)


</td><td>


</td><td>

Determines if the puzzle is correctly solved.


</td></tr>
<tr><td>

[checkIsValid()](./ts-sudoku-lib.puzzlesession.checkisvalid.md)


</td><td>


</td><td>

Determines if the puzzle is valid in its current state.


</td></tr>
<tr><td>

[create(puzzle)](./ts-sudoku-lib.puzzlesession.create.md)


</td><td>

`static`


</td><td>

Creates a new [puzzle session](./ts-sudoku-lib.puzzlesession.md) from a supplied .


</td></tr>
<tr><td>

[getCellContents(spec)](./ts-sudoku-lib.puzzlesession.getcellcontents.md)


</td><td>


</td><td>

Gets the [contents](./ts-sudoku-lib.icellcontents.md) for a specified cell.


</td></tr>
<tr><td>

[getCellNeighbor(spec, direction, wrap)](./ts-sudoku-lib.puzzlesession.getcellneighbor.md)


</td><td>


</td><td>

Gets the neighbor for a cell in a given direction using specified wrapping rules.


</td></tr>
<tr><td>

[getEmptyCells()](./ts-sudoku-lib.puzzlesession.getemptycells.md)


</td><td>


</td><td>

Gets all of the currently empty [cells](./ts-sudoku-lib.icell.md) in the puzzle.


</td></tr>
<tr><td>

[getInvalidCells()](./ts-sudoku-lib.puzzlesession.getinvalidcells.md)


</td><td>


</td><td>

Gets all of the currently invalid [cells](./ts-sudoku-lib.icell.md) in the puzzle.


</td></tr>
<tr><td>

[isValidForCell(spec, value)](./ts-sudoku-lib.puzzlesession.isvalidforcell.md)


</td><td>


</td><td>

Determines if supplied value is valid for a specific cell.


</td></tr>
<tr><td>

[redo()](./ts-sudoku-lib.puzzlesession.redo.md)


</td><td>


</td><td>

Redo a single move in this puzzle session.


</td></tr>
<tr><td>

[toStrings()](./ts-sudoku-lib.puzzlesession.tostrings.md)


</td><td>


</td><td>

Gets a string representation of this puzzle, one string per row.


</td></tr>
<tr><td>

[undo()](./ts-sudoku-lib.puzzlesession.undo.md)


</td><td>


</td><td>

Undo a single move in this puzzle session.


</td></tr>
<tr><td>

[updateCellNotes(spec, notes)](./ts-sudoku-lib.puzzlesession.updatecellnotes.md)


</td><td>


</td><td>

Updates the notes on a cell.


</td></tr>
<tr><td>

[updateCells(updates)](./ts-sudoku-lib.puzzlesession.updatecells.md)


</td><td>


</td><td>

Updates value &amp; notes for multiple cells.


</td></tr>
<tr><td>

[updateCellValue(spec, value)](./ts-sudoku-lib.puzzlesession.updatecellvalue.md)


</td><td>


</td><td>

Updates the value of a cell.


</td></tr>
</tbody></table>
