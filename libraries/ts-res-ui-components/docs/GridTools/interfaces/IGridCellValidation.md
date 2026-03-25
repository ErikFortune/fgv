[Home](../../README.md) > [GridTools](../README.md) > IGridCellValidation

# Interface: IGridCellValidation

Validation configuration for grid cells.

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

[required](./IGridCellValidation.required.md)

</td><td>



</td><td>

boolean

</td><td>

Whether the field is required

</td></tr>
<tr><td>

[pattern](./IGridCellValidation.pattern.md)

</td><td>



</td><td>

RegExp

</td><td>

Regex pattern for validation

</td></tr>
<tr><td>

[minLength](./IGridCellValidation.minLength.md)

</td><td>



</td><td>

number

</td><td>

Minimum length for string values

</td></tr>
<tr><td>

[maxLength](./IGridCellValidation.maxLength.md)

</td><td>



</td><td>

number

</td><td>

Maximum length for string values

</td></tr>
<tr><td>

[custom](./IGridCellValidation.custom.md)

</td><td>



</td><td>

(value: [JsonValue](../../type-aliases/JsonValue.md)) =&gt; string | null

</td><td>

Custom validation function that returns error message or null

</td></tr>
</tbody></table>
