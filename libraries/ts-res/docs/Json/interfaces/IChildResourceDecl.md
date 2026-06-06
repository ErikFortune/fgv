[Home](../../README.md) > [Json](../README.md) > IChildResourceDecl

# Interface: IChildResourceDecl

Non-validated child declaration of a Resources.Resource | resource.

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

[resourceTypeName](./IChildResourceDecl.resourceTypeName.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

The name of the type of this resource.

</td></tr>
<tr><td>

[candidates](./IChildResourceDecl.candidates.md)

</td><td>

`readonly`

</td><td>

readonly [IChildResourceCandidateDecl](../../interfaces/IChildResourceCandidateDecl.md)&lt;TQualifierNames&gt;[]

</td><td>

Possible candidates for this value.

</td></tr>
</tbody></table>
