[Home](../../README.md) > [Json](../README.md) > ILooseResourceCandidateDecl

# Interface: ILooseResourceCandidateDecl

Non-validated loose declaration of a Resources.ResourceCandidate | resource candidate.

**Extends:** [`IChildResourceCandidateDecl`](../../interfaces/IChildResourceCandidateDecl.md)

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

[id](./ILooseResourceCandidateDecl.id.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

The ResourceId | id of the resource.

</td></tr>
<tr><td>

[json](./ILooseResourceCandidateDecl.json.md)

</td><td>

`readonly`

</td><td>

JsonObject

</td><td>

The JSON value of the resource.

</td></tr>
<tr><td>

[conditions](./ILooseResourceCandidateDecl.conditions.md)

</td><td>

`readonly`

</td><td>

[ConditionSetDecl](../../type-aliases/ConditionSetDecl.md)

</td><td>

The conditions that must be met for the resource to be selected.

</td></tr>
<tr><td>

[isPartial](./ILooseResourceCandidateDecl.isPartial.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

If true, the resource is only a partial representation of the full resource.

</td></tr>
<tr><td>

[mergeMethod](./ILooseResourceCandidateDecl.mergeMethod.md)

</td><td>

`readonly`

</td><td>

[ResourceValueMergeMethod](../../type-aliases/ResourceValueMergeMethod.md)

</td><td>

The merge method to be used when merging the resource into the existing resource.

</td></tr>
<tr><td>

[resourceTypeName](./ILooseResourceCandidateDecl.resourceTypeName.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

The type of the resource.

</td></tr>
</tbody></table>
