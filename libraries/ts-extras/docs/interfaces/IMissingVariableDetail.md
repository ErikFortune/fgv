[Home](../README.md) > IMissingVariableDetail

# Interface: IMissingVariableDetail

Details about a missing variable in context validation.

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

[variable](./IMissingVariableDetail.variable.md)

</td><td>

`readonly`

</td><td>

[IVariableRef](IVariableRef.md)

</td><td>

The variable reference that is missing

</td></tr>
<tr><td>

[failedAtSegment](./IMissingVariableDetail.failedAtSegment.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

The path segment where the lookup failed

</td></tr>
<tr><td>

[existingPath](./IMissingVariableDetail.existingPath.md)

</td><td>

`readonly`

</td><td>

readonly string[]

</td><td>

The parent path that exists (e.g., ['user'] if 'user' exists but 'user.profile' does not)

</td></tr>
</tbody></table>
