[Home](../README.md) > ISudokuGridEntryProps

# Interface: ISudokuGridEntryProps

Props for the main SudokuGridEntry component

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

[initialPuzzleDescription](./ISudokuGridEntryProps.initialPuzzleDescription.md)

</td><td>

`readonly`

</td><td>

IPuzzleDefinition

</td><td>

Optional initial puzzle session to load.

</td></tr>
<tr><td>

[onStateChange](./ISudokuGridEntryProps.onStateChange.md)

</td><td>

`readonly`

</td><td>

(isValid: boolean, isSolved: boolean) =&gt; void

</td><td>

Callback fired when the puzzle state changes

</td></tr>
<tr><td>

[onValidationErrors](./ISudokuGridEntryProps.onValidationErrors.md)

</td><td>

`readonly`

</td><td>

(errors: [IValidationError](IValidationError.md)[]) =&gt; void

</td><td>

Callback fired when validation errors occur

</td></tr>
<tr><td>

[className](./ISudokuGridEntryProps.className.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Optional CSS class name for styling

</td></tr>
<tr><td>

[forceLayoutMode](./ISudokuGridEntryProps.forceLayoutMode.md)

</td><td>

`readonly`

</td><td>

[KeypadLayoutMode](../type-aliases/KeypadLayoutMode.md)

</td><td>

Optional forced layout mode for testing (overrides responsive detection)

</td></tr>
</tbody></table>
