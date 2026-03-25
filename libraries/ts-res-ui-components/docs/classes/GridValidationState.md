[Home](../README.md) > GridValidationState

# Class: GridValidationState

Grid validation state management utility.

## Constructors

<table><thead><tr><th>

Constructor

</th><th>

Modifiers

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

`constructor()`

</td><td>



</td><td>



</td></tr>
</tbody></table>

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

[hasErrors](./GridValidationState.hasErrors.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Check if any cells have validation errors.

</td></tr>
<tr><td>

[errorCount](./GridValidationState.errorCount.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Get total count of validation errors.

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

[setCellError(resourceId, columnId, error)](./GridValidationState.setCellError.md)

</td><td>



</td><td>

Set validation error for a specific cell.

</td></tr>
<tr><td>

[getCellError(resourceId, columnId)](./GridValidationState.getCellError.md)

</td><td>



</td><td>

Get validation error for a specific cell.

</td></tr>
<tr><td>

[hasCellError(resourceId, columnId)](./GridValidationState.hasCellError.md)

</td><td>



</td><td>

Check if a specific cell has validation errors.

</td></tr>
<tr><td>

[getResourceErrors(resourceId)](./GridValidationState.getResourceErrors.md)

</td><td>



</td><td>

Get all validation errors for a resource.

</td></tr>
<tr><td>

[getAllErrors()](./GridValidationState.getAllErrors.md)

</td><td>



</td><td>

Get all error messages as a flat array.

</td></tr>
<tr><td>

[clearAll()](./GridValidationState.clearAll.md)

</td><td>



</td><td>

Clear all validation errors.

</td></tr>
<tr><td>

[clearResource(resourceId)](./GridValidationState.clearResource.md)

</td><td>



</td><td>

Clear validation errors for a specific resource.

</td></tr>
<tr><td>

[clearCell(resourceId, columnId)](./GridValidationState.clearCell.md)

</td><td>



</td><td>

Clear validation error for a specific cell.

</td></tr>
</tbody></table>
