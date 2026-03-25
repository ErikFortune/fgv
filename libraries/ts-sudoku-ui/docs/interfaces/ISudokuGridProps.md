[Home](../README.md) > ISudokuGridProps

# Interface: ISudokuGridProps

Props for the SudokuGrid component

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

[numRows](./ISudokuGridProps.numRows.md)

</td><td>

`readonly`

</td><td>

number

</td><td>



</td></tr>
<tr><td>

[numColumns](./ISudokuGridProps.numColumns.md)

</td><td>

`readonly`

</td><td>

number

</td><td>



</td></tr>
<tr><td>

[cells](./ISudokuGridProps.cells.md)

</td><td>

`readonly`

</td><td>

[ICellDisplayInfo](ICellDisplayInfo.md)[]

</td><td>



</td></tr>
<tr><td>

[cages](./ISudokuGridProps.cages.md)

</td><td>

`readonly`

</td><td>

[ICageDisplayInfo](ICageDisplayInfo.md)[]

</td><td>



</td></tr>
<tr><td>

[selectedCell](./ISudokuGridProps.selectedCell.md)

</td><td>

`readonly`

</td><td>

CellId | null

</td><td>



</td></tr>
<tr><td>

[selectedCells](./ISudokuGridProps.selectedCells.md)

</td><td>

`readonly`

</td><td>

CellId[]

</td><td>



</td></tr>
<tr><td>

[inputMode](./ISudokuGridProps.inputMode.md)

</td><td>

`readonly`

</td><td>

InputMode

</td><td>



</td></tr>
<tr><td>

[puzzleType](./ISudokuGridProps.puzzleType.md)

</td><td>

`readonly`

</td><td>

string

</td><td>



</td></tr>
<tr><td>

[puzzleDimensions](./ISudokuGridProps.puzzleDimensions.md)

</td><td>

`readonly`

</td><td>

{ cageHeightInCells: number; cageWidthInCells: number; boardWidthInCages: number; boardHeightInCages: number; totalRows: number; totalColumns: number; maxValue: number; totalCages: number; basicCageTotal: number }

</td><td>



</td></tr>
<tr><td>

[onCellSelect](./ISudokuGridProps.onCellSelect.md)

</td><td>

`readonly`

</td><td>

(cellId: CellId, event?: MouseEvent&lt;Element, MouseEvent&gt;) =&gt; void

</td><td>



</td></tr>
<tr><td>

[onLongPressToggle](./ISudokuGridProps.onLongPressToggle.md)

</td><td>

`readonly`

</td><td>

(cellId: CellId, event: MouseEvent&lt;Element, MouseEvent&gt; | TouchEvent&lt;Element&gt;) =&gt; void

</td><td>



</td></tr>
<tr><td>

[onCellValueChange](./ISudokuGridProps.onCellValueChange.md)

</td><td>

`readonly`

</td><td>

(cellId: CellId, value: number | undefined) =&gt; void

</td><td>



</td></tr>
<tr><td>

[onNoteToggle](./ISudokuGridProps.onNoteToggle.md)

</td><td>

`readonly`

</td><td>

(cellId: CellId, note: number) =&gt; void

</td><td>



</td></tr>
<tr><td>

[onClearAllNotes](./ISudokuGridProps.onClearAllNotes.md)

</td><td>

`readonly`

</td><td>

(cellId: CellId) =&gt; void

</td><td>



</td></tr>
<tr><td>

[onNavigate](./ISudokuGridProps.onNavigate.md)

</td><td>

`readonly`

</td><td>

(direction: NavigationDirection) =&gt; void

</td><td>



</td></tr>
<tr><td>

[onDragOver](./ISudokuGridProps.onDragOver.md)

</td><td>

`readonly`

</td><td>

(cellId: CellId) =&gt; void

</td><td>



</td></tr>
<tr><td>

[onDragEnd](./ISudokuGridProps.onDragEnd.md)

</td><td>

`readonly`

</td><td>

() =&gt; void

</td><td>



</td></tr>
<tr><td>

[isDragging](./ISudokuGridProps.isDragging.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>



</td></tr>
<tr><td>

[className](./ISudokuGridProps.className.md)

</td><td>

`readonly`

</td><td>

string

</td><td>



</td></tr>
</tbody></table>
