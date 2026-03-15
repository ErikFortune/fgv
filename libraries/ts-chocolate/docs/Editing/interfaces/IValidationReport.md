[Home](../../README.md) > [Editing](../README.md) > IValidationReport

# Interface: IValidationReport

Validation report with detailed field-level errors.
Provides comprehensive validation feedback for entity data.

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

[isValid](./IValidationReport.isValid.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Overall validation result.

</td></tr>
<tr><td>

[fieldErrors](./IValidationReport.fieldErrors.md)

</td><td>

`readonly`

</td><td>

ReadonlyMap&lt;string, string&gt;

</td><td>

Field-level validation errors.

</td></tr>
<tr><td>

[generalErrors](./IValidationReport.generalErrors.md)

</td><td>

`readonly`

</td><td>

readonly string[]

</td><td>

General validation errors not specific to a single field.

</td></tr>
</tbody></table>
