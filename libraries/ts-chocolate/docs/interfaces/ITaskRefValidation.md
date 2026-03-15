[Home](../README.md) > ITaskRefValidation

# Interface: ITaskRefValidation

Result of validating a task reference against a task definition.

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

[isValid](./ITaskRefValidation.isValid.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Whether the reference is valid (all required variables provided)

</td></tr>
<tr><td>

[taskFound](./ITaskRefValidation.taskFound.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

True if the referenced task was found

</td></tr>
<tr><td>

[missingVariables](./ITaskRefValidation.missingVariables.md)

</td><td>

`readonly`

</td><td>

readonly string[]

</td><td>

Variables that are missing from params

</td></tr>
<tr><td>

[extraVariables](./ITaskRefValidation.extraVariables.md)

</td><td>

`readonly`

</td><td>

readonly string[]

</td><td>

Variables provided but not required (warning only)

</td></tr>
<tr><td>

[messages](./ITaskRefValidation.messages.md)

</td><td>

`readonly`

</td><td>

readonly string[]

</td><td>

Human-readable validation messages

</td></tr>
</tbody></table>
