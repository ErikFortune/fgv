[Home](../../README.md) > [Mustache](../README.md) > IVariableRef

# Interface: IVariableRef

Represents a variable reference extracted from a Mustache template.

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

[name](./IVariableRef.name.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

The raw variable name as it appears in the template (e.g., 'user.name')

</td></tr>
<tr><td>

[path](./IVariableRef.path.md)

</td><td>

`readonly`

</td><td>

readonly string[]

</td><td>

The path segments parsed from the variable name (e.g., ['user', 'name'])

</td></tr>
<tr><td>

[tokenType](./IVariableRef.tokenType.md)

</td><td>

`readonly`

</td><td>

[MustacheTokenType](../../type-aliases/MustacheTokenType.md)

</td><td>

The type of token this variable was extracted from

</td></tr>
<tr><td>

[isSection](./IVariableRef.isSection.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Whether this variable is used in a section context (# or ^)

</td></tr>
</tbody></table>
