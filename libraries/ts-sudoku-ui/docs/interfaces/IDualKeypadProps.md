[Home](../README.md) > IDualKeypadProps

# Interface: IDualKeypadProps

Props for the DualKeypad component

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

[inputMode](./IDualKeypadProps.inputMode.md)

</td><td>

`readonly`

</td><td>

InputMode

</td><td>

Current input mode

</td></tr>
<tr><td>

[onInputModeChange](./IDualKeypadProps.onInputModeChange.md)

</td><td>

`readonly`

</td><td>

(mode: InputMode) =&gt; void

</td><td>

Callback when input mode changes

</td></tr>
<tr><td>

[onNotePress](./IDualKeypadProps.onNotePress.md)

</td><td>

`readonly`

</td><td>

(number: number) =&gt; void

</td><td>

Callback when a number is pressed for notes

</td></tr>
<tr><td>

[onValuePress](./IDualKeypadProps.onValuePress.md)

</td><td>

`readonly`

</td><td>

(number: number) =&gt; void

</td><td>

Callback when a number is pressed for values

</td></tr>
<tr><td>

[onClearNotes](./IDualKeypadProps.onClearNotes.md)

</td><td>

`readonly`

</td><td>

() =&gt; void

</td><td>

Callback when clear notes is pressed

</td></tr>
<tr><td>

[onClearValues](./IDualKeypadProps.onClearValues.md)

</td><td>

`readonly`

</td><td>

() =&gt; void

</td><td>

Callback when clear values is pressed

</td></tr>
<tr><td>

[hasCellSelection](./IDualKeypadProps.hasCellSelection.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Whether any cells are selected

</td></tr>
<tr><td>

[selectedCellCount](./IDualKeypadProps.selectedCellCount.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Number of selected cells

</td></tr>
<tr><td>

[disabled](./IDualKeypadProps.disabled.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Whether the keypad is disabled

</td></tr>
<tr><td>

[className](./IDualKeypadProps.className.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Additional CSS class name

</td></tr>
<tr><td>

[forceLayoutMode](./IDualKeypadProps.forceLayoutMode.md)

</td><td>

`readonly`

</td><td>

[KeypadLayoutMode](../type-aliases/KeypadLayoutMode.md)

</td><td>

Force a specific layout mode (overrides responsive detection)

</td></tr>
<tr><td>

[showOverlayToggle](./IDualKeypadProps.showOverlayToggle.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Whether to show the overlay toggle for desktop

</td></tr>
</tbody></table>
