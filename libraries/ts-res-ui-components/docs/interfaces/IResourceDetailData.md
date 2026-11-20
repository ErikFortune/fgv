[Home](../README.md) > IResourceDetailData

# Interface: IResourceDetailData

Detailed information about a resource for display in source views.
Contains the resource structure including all candidates and their conditions.

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

[id](./IResourceDetailData.id.md)

</td><td>



</td><td>

string

</td><td>

Unique identifier of the resource

</td></tr>
<tr><td>

[resourceType](./IResourceDetailData.resourceType.md)

</td><td>



</td><td>

string

</td><td>

Type classification of the resource

</td></tr>
<tr><td>

[candidateCount](./IResourceDetailData.candidateCount.md)

</td><td>



</td><td>

number

</td><td>

Total number of candidates defined for this resource

</td></tr>
<tr><td>

[candidates](./IResourceDetailData.candidates.md)

</td><td>



</td><td>

IChildResourceCandidateDecl_2[]

</td><td>

Array of all candidates with their conditions and values

</td></tr>
</tbody></table>
