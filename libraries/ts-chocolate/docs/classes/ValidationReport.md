[Home](../README.md) > ValidationReport

# Class: ValidationReport

Implementation of IValidationReport.
Immutable validation report with field and general errors.

**Implements:** [`IValidationReport`](../interfaces/IValidationReport.md)

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

`constructor(fieldErrors, generalErrors)`

</td><td>



</td><td>

Create a validation report.

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

[fieldErrors](./ValidationReport.fieldErrors.md)

</td><td>

`readonly`

</td><td>

ReadonlyMap&lt;string, string&gt;

</td><td>

Map of field paths to error messages.

</td></tr>
<tr><td>

[generalErrors](./ValidationReport.generalErrors.md)

</td><td>

`readonly`

</td><td>

readonly string[]

</td><td>

Array of general error messages.

</td></tr>
<tr><td>

[isValid](./ValidationReport.isValid.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Overall validation status.

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

[success()](./ValidationReport.success.md)

</td><td>

`static`

</td><td>

Create a successful (no errors) validation report.

</td></tr>
<tr><td>

[withFieldErrors(errors)](./ValidationReport.withFieldErrors.md)

</td><td>

`static`

</td><td>

Create a validation report with field errors.

</td></tr>
<tr><td>

[withGeneralErrors(errors)](./ValidationReport.withGeneralErrors.md)

</td><td>

`static`

</td><td>

Create a validation report with general errors.

</td></tr>
<tr><td>

[withErrors(fieldErrors, generalErrors)](./ValidationReport.withErrors.md)

</td><td>

`static`

</td><td>

Create a validation report with both field and general errors.

</td></tr>
</tbody></table>
