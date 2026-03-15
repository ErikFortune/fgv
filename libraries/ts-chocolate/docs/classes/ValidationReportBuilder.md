[Home](../README.md) > ValidationReportBuilder

# Class: ValidationReportBuilder

Builder for constructing validation reports.
Allows accumulating errors before creating final report.

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

[addFieldError(fieldPath, errorMessage)](./ValidationReportBuilder.addFieldError.md)

</td><td>



</td><td>

Add a field error.

</td></tr>
<tr><td>

[addGeneralError(errorMessage)](./ValidationReportBuilder.addGeneralError.md)

</td><td>



</td><td>

Add a general error.

</td></tr>
<tr><td>

[addValidationResult(fieldPath, result)](./ValidationReportBuilder.addValidationResult.md)

</td><td>



</td><td>

Add errors from a validation result.

</td></tr>
<tr><td>

[hasErrors()](./ValidationReportBuilder.hasErrors.md)

</td><td>



</td><td>

Check if any errors have been added.

</td></tr>
<tr><td>

[build()](./ValidationReportBuilder.build.md)

</td><td>



</td><td>

Build the final validation report.

</td></tr>
<tr><td>

[buildResult()](./ValidationReportBuilder.buildResult.md)

</td><td>



</td><td>

Build and return as Result.

</td></tr>
</tbody></table>
