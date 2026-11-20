[Home](../README.md) > IContextValidationResult

# Interface: IContextValidationResult

Result of context validation, containing details about missing variables.

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

[isValid](./IContextValidationResult.isValid.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Whether the context is valid (has all required variables)

</td></tr>
<tr><td>

[presentVariables](./IContextValidationResult.presentVariables.md)

</td><td>

`readonly`

</td><td>

readonly string[]

</td><td>

Variables that are present in the context

</td></tr>
<tr><td>

[missingVariables](./IContextValidationResult.missingVariables.md)

</td><td>

`readonly`

</td><td>

readonly string[]

</td><td>

Variables that are missing from the context

</td></tr>
<tr><td>

[missingDetails](./IContextValidationResult.missingDetails.md)

</td><td>

`readonly`

</td><td>

readonly [IMissingVariableDetail](IMissingVariableDetail.md)[]

</td><td>

Detailed information about each missing variable

</td></tr>
</tbody></table>
