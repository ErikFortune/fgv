# @fgv/ts-sudoku-lib

## Namespaces

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[Files](./Files/README.md)

</td><td>



</td></tr>
<tr><td>

[Hints](./Hints/README.md)

</td><td>



</td></tr>
<tr><td>

[Puzzles](./Puzzles/README.md)

</td><td>



</td></tr>
<tr><td>

[Converters](./Converters/README.md)

</td><td>



</td></tr>
</tbody></table>

## Classes

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[PuzzleCollection](./classes/PuzzleCollection.md)

</td><td>

A collection of puzzles of various types.

</td></tr>
<tr><td>

[PuzzleCollections](./classes/PuzzleCollections.md)

</td><td>

Get well-known PuzzleCollection | puzzle collections.

</td></tr>
<tr><td>

[Puzzle](./classes/Puzzle.md)

</td><td>

Abstract base class for all puzzles.

</td></tr>
<tr><td>

[PuzzleDefinitionFactory](./classes/PuzzleDefinitionFactory.md)

</td><td>

Factory for creating and validating puzzle definitions

</td></tr>
<tr><td>

[PuzzleSession](./classes/PuzzleSession.md)

</td><td>

Represents a single puzzle session, including puzzle, current state and redo/undo.

</td></tr>
<tr><td>

[PuzzleState](./classes/PuzzleState.md)

</td><td>



</td></tr>
<tr><td>

[Ids](./classes/Ids.md)

</td><td>



</td></tr>
</tbody></table>

## Interfaces

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[IRowColumn](./interfaces/IRowColumn.md)

</td><td>

The row/column coordinate of a single ICell | cell in a PuzzleSession | puzzle.

</td></tr>
<tr><td>

[ICellContents](./interfaces/ICellContents.md)

</td><td>

The contents of a single ICell | cell in a PuzzleSession | puzzle.

</td></tr>
<tr><td>

[ICellState](./interfaces/ICellState.md)

</td><td>

Describes the state of or a state update for a single ICell |cell in a

</td></tr>
<tr><td>

[ICage](./interfaces/ICage.md)

</td><td>

Describes the structure of a single cage in a PuzzleSession | puzzle.

</td></tr>
<tr><td>

[ICell](./interfaces/ICell.md)

</td><td>

Describes the structure of a single cell in a PuzzleSession | puzzle.

</td></tr>
<tr><td>

[ICellUpdate](./interfaces/ICellUpdate.md)

</td><td>

Describes a single cell update.

</td></tr>
<tr><td>

[IPuzzleUpdate](./interfaces/IPuzzleUpdate.md)

</td><td>

Describes a single puzzle update.

</td></tr>
<tr><td>

[IPuzzleTypeValidator](./interfaces/IPuzzleTypeValidator.md)

</td><td>

Interface for puzzle type-specific validation

</td></tr>
<tr><td>

[IPuzzleDimensions](./interfaces/IPuzzleDimensions.md)

</td><td>

Core dimensional configuration for a puzzle grid

</td></tr>
<tr><td>

[IPuzzleDefinition](./interfaces/IPuzzleDefinition.md)

</td><td>

Complete puzzle definition with derived properties

</td></tr>
</tbody></table>

## Type Aliases

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[CellId](./type-aliases/CellId.md)

</td><td>

Nominal identifier for a single ICell | cell in a PuzzleSession | puzzle.

</td></tr>
<tr><td>

[CageId](./type-aliases/CageId.md)

</td><td>

Nominal identifier for a single ICage | cage in a PuzzleSession | puzzle.

</td></tr>
<tr><td>

[CageType](./type-aliases/CageType.md)

</td><td>

Identifies the type of a ICage | cage.

</td></tr>
<tr><td>

[PuzzleType](./type-aliases/PuzzleType.md)

</td><td>

Describes the rules that apply to the puzzle.

</td></tr>
<tr><td>

[NavigationDirection](./type-aliases/NavigationDirection.md)

</td><td>

Navigation direction within a puzzle.

</td></tr>
<tr><td>

[NavigationWrap](./type-aliases/NavigationWrap.md)

</td><td>

Wrapping rules when navigating within a puzzle.

</td></tr>
<tr><td>

[StandardConfigName](./type-aliases/StandardConfigName.md)

</td><td>

Type for standard configuration names

</td></tr>
</tbody></table>

## Functions

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[getCageTotalBounds](./functions/getCageTotalBounds.md)

</td><td>

Calculate the minimum and maximum possible totals for a cage of given size

</td></tr>
<tr><td>

[parseCellId](./functions/parseCellId.md)

</td><td>

Parse a cell ID string back to row/column coordinates

</td></tr>
</tbody></table>

## Variables

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[allPuzzleTypes](./variables/allPuzzleTypes.md)

</td><td>

All supported public types.

</td></tr>
<tr><td>

[totalsByCageSize](./variables/totalsByCageSize.md)

</td><td>

Legacy array for backward compatibility - supports standard 9x9 Sudoku

</td></tr>
<tr><td>

[STANDARD_CONFIGS](./variables/STANDARD_CONFIGS.md)

</td><td>

Standard puzzle configurations

</td></tr>
<tr><td>

[DefaultSudokuLogger](./variables/DefaultSudokuLogger.md)

</td><td>

Default no-op logger for use when diagnostic logging is not needed.

</td></tr>
</tbody></table>
