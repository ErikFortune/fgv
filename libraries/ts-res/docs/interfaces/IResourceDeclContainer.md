[Home](../README.md) > IResourceDeclContainer

# Interface: IResourceDeclContainer

Generic container for resource and resource candidate
declarations.

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

[context](./IResourceDeclContainer.context.md)

</td><td>

`readonly`

</td><td>

[IContainerContextDecl](IContainerContextDecl.md)

</td><td>

Optional initial ResourceJson.Normalized.IContainerContextDecl | resource context

</td></tr>
</tbody></table>

## Methods

<table><thead><tr><th>

Method

</th><th>

Modifiers

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[getImporterResources()](./IResourceDeclContainer.getImporterResources.md)

</td><td>



</td><td>

Gets a normalized array of ResourceJson.Normalized.IImporterResourceDecl | importer resource

</td></tr>
<tr><td>

[getImporterCandidates()](./IResourceDeclContainer.getImporterCandidates.md)

</td><td>



</td><td>

Gets a normalized array of ResourceJson.Normalized.IImporterResourceCandidateDecl | importer resource candidate

</td></tr>
</tbody></table>
