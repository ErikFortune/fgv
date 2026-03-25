[Home](../README.md) > IResourceCandidate

# Interface: IResourceCandidate

Runtime representation of a resource candidate with the minimal data needed for resolution.

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

[json](./IResourceCandidate.json.md)

</td><td>

`readonly`

</td><td>

JsonObject

</td><td>

The JSON value for this candidate

</td></tr>
<tr><td>

[isPartial](./IResourceCandidate.isPartial.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Indicates if this candidate is a partial resource.

</td></tr>
<tr><td>

[mergeMethod](./IResourceCandidate.mergeMethod.md)

</td><td>

`readonly`

</td><td>

[ResourceValueMergeMethod](../type-aliases/ResourceValueMergeMethod.md)

</td><td>

Specifies the resource type of this candidate.

</td></tr>
</tbody></table>
