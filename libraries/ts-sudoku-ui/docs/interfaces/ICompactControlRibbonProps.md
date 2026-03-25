[Home](../README.md) > ICompactControlRibbonProps

# Interface: ICompactControlRibbonProps

Props for the CompactControlRibbon component

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

[canUndo](./ICompactControlRibbonProps.canUndo.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Whether undo is available

</td></tr>
<tr><td>

[canRedo](./ICompactControlRibbonProps.canRedo.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Whether redo is available

</td></tr>
<tr><td>

[canReset](./ICompactControlRibbonProps.canReset.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Whether reset is available

</td></tr>
<tr><td>

[isValid](./ICompactControlRibbonProps.isValid.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Whether the puzzle is valid

</td></tr>
<tr><td>

[isSolved](./ICompactControlRibbonProps.isSolved.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Whether the puzzle is solved

</td></tr>
<tr><td>

[validationErrors](./ICompactControlRibbonProps.validationErrors.md)

</td><td>

`readonly`

</td><td>

readonly { type: string; cellId: string; message: string }[]

</td><td>

Validation errors for error count display

</td></tr>
<tr><td>

[onUndo](./ICompactControlRibbonProps.onUndo.md)

</td><td>

`readonly`

</td><td>

() =&gt; void

</td><td>

Callback for undo action

</td></tr>
<tr><td>

[onRedo](./ICompactControlRibbonProps.onRedo.md)

</td><td>

`readonly`

</td><td>

() =&gt; void

</td><td>

Callback for redo action

</td></tr>
<tr><td>

[onReset](./ICompactControlRibbonProps.onReset.md)

</td><td>

`readonly`

</td><td>

() =&gt; void

</td><td>

Callback for reset action

</td></tr>
<tr><td>

[onExport](./ICompactControlRibbonProps.onExport.md)

</td><td>

`readonly`

</td><td>

() =&gt; void

</td><td>

Callback for export action

</td></tr>
<tr><td>

[showCombinations](./ICompactControlRibbonProps.showCombinations.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Whether to show combinations button (for killer sudoku)

</td></tr>
<tr><td>

[canShowCombinations](./ICompactControlRibbonProps.canShowCombinations.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Whether combinations button should be enabled

</td></tr>
<tr><td>

[onCombinations](./ICompactControlRibbonProps.onCombinations.md)

</td><td>

`readonly`

</td><td>

() =&gt; void

</td><td>

Callback for combinations action

</td></tr>
<tr><td>

[className](./ICompactControlRibbonProps.className.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Additional CSS class name

</td></tr>
</tbody></table>
