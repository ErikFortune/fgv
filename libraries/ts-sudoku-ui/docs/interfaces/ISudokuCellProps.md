[Home](../README.md) > ISudokuCellProps

# Interface: ISudokuCellProps

Props for the SudokuCell component

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

[cellInfo](./ISudokuCellProps.cellInfo.md)

</td><td>

`readonly`

</td><td>

[ICellDisplayInfo](ICellDisplayInfo.md)

</td><td>



</td></tr>
<tr><td>

[isSelected](./ISudokuCellProps.isSelected.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>



</td></tr>
<tr><td>

[inputMode](./ISudokuCellProps.inputMode.md)

</td><td>

`readonly`

</td><td>

InputMode

</td><td>



</td></tr>
<tr><td>

[puzzleDimensions](./ISudokuCellProps.puzzleDimensions.md)

</td><td>

`readonly`

</td><td>

{ numRows: number; numColumns: number; cageHeight: number; cageWidth: number }

</td><td>



</td></tr>
<tr><td>

[onSelect](./ISudokuCellProps.onSelect.md)

</td><td>

`readonly`

</td><td>

(event?: MouseEvent&lt;Element, MouseEvent&gt;) =&gt; void

</td><td>



</td></tr>
<tr><td>

[onLongPressToggle](./ISudokuCellProps.onLongPressToggle.md)

</td><td>

`readonly`

</td><td>

(event: MouseEvent&lt;Element, MouseEvent&gt; | TouchEvent&lt;Element&gt;) =&gt; void

</td><td>



</td></tr>
<tr><td>

[onValueChange](./ISudokuCellProps.onValueChange.md)

</td><td>

`readonly`

</td><td>

(value: number | undefined) =&gt; void

</td><td>



</td></tr>
<tr><td>

[onNoteToggle](./ISudokuCellProps.onNoteToggle.md)

</td><td>

`readonly`

</td><td>

(note: number) =&gt; void

</td><td>



</td></tr>
<tr><td>

[onClearAllNotes](./ISudokuCellProps.onClearAllNotes.md)

</td><td>

`readonly`

</td><td>

() =&gt; void

</td><td>



</td></tr>
<tr><td>

[onDragOver](./ISudokuCellProps.onDragOver.md)

</td><td>

`readonly`

</td><td>

() =&gt; void

</td><td>



</td></tr>
<tr><td>

[className](./ISudokuCellProps.className.md)

</td><td>

`readonly`

</td><td>

string

</td><td>



</td></tr>
</tbody></table>
