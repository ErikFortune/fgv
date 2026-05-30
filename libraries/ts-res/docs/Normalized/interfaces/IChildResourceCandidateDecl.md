[Home](../../README.md) > [Normalized](../README.md) > IChildResourceCandidateDecl

# Interface: IChildResourceCandidateDecl

Normalized non-validated child declaration of a Resources.ResourceCandidate | resource candidate.

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

[json](./IChildResourceCandidateDecl.json.md)

</td><td>

`readonly`

</td><td>

JsonObject

</td><td>

The JSON value of the resource.

</td></tr>
<tr><td>

[conditions](./IChildResourceCandidateDecl.conditions.md)

</td><td>

`readonly`

</td><td>

[ConditionSetDecl](../../type-aliases/ConditionSetDecl.md)

</td><td>

The conditions that must be met for the resource to be selected.

</td></tr>
<tr><td>

[isPartial](./IChildResourceCandidateDecl.isPartial.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

If true, the resource is only a partial representation of the full resource.

</td></tr>
<tr><td>

[mergeMethod](./IChildResourceCandidateDecl.mergeMethod.md)

</td><td>

`readonly`

</td><td>

[ResourceValueMergeMethod](../../type-aliases/ResourceValueMergeMethod.md)

</td><td>

The merge method to be used when merging the resource into the existing resource.

</td></tr>
</tbody></table>
