[Home](../../README.md) > [Json](../README.md) > ILooseResourceDecl

# Interface: ILooseResourceDecl

Non-validated loose declaration of a Resources.Resource | resource.

**Extends:** [`IChildResourceDecl`](../../interfaces/IChildResourceDecl.md)

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

[id](./ILooseResourceDecl.id.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

The id of the resource.

</td></tr>
<tr><td>

[resourceTypeName](./ILooseResourceDecl.resourceTypeName.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

The name of the type of this resource.

</td></tr>
<tr><td>

[candidates](./ILooseResourceDecl.candidates.md)

</td><td>

`readonly`

</td><td>

readonly [IChildResourceCandidateDecl](../../interfaces/IChildResourceCandidateDecl.md)[]

</td><td>

Possible candidates for this value.

</td></tr>
</tbody></table>
