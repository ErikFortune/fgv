[Home](../../README.md) > [Json](../README.md) > IImporterResourceCandidateDecl

# Interface: IImporterResourceCandidateDecl

Non-validated declaration of a resource candidate for import,
which can be either a loose or child resource candidate.

**Extends:** [`IChildResourceCandidateDecl<TQualifierNames>`](../../interfaces/IChildResourceCandidateDecl.md)

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

[id](./IImporterResourceCandidateDecl.id.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

The ResourceId | id of the resource.

</td></tr>
<tr><td>

[resourceTypeName](./IImporterResourceCandidateDecl.resourceTypeName.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

The name of the type of this resource.

</td></tr>
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

[ConditionSetDecl](../../type-aliases/ConditionSetDecl.md)&lt;TQualifierNames&gt;

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
