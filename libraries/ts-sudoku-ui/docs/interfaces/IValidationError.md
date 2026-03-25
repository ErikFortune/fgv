[Home](../README.md) > IValidationError

# Interface: IValidationError

Validation error for display in the UI

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

[cellId](./IValidationError.cellId.md)

</td><td>

`readonly`

</td><td>

CellId

</td><td>



</td></tr>
<tr><td>

[type](./IValidationError.type.md)

</td><td>

`readonly`

</td><td>

"invalid-value" | "duplicate-row" | "duplicate-column" | "duplicate-section" | "duplicate-diagonal"

</td><td>



</td></tr>
<tr><td>

[conflictingCells](./IValidationError.conflictingCells.md)

</td><td>

`readonly`

</td><td>

CellId[]

</td><td>



</td></tr>
<tr><td>

[message](./IValidationError.message.md)

</td><td>

`readonly`

</td><td>

string

</td><td>



</td></tr>
</tbody></table>
