[Home](../README.md) > ResourceDeclTree

# Class: ResourceDeclTree

Class that extracts resources and candidates from a
ResourceJson.Json.IResourceTreeRootDecl | resource tree root.

**Implements:** [`IResourceDeclContainer`](../interfaces/IResourceDeclContainer.md)

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

[tree](./ResourceDeclTree.tree.md)

</td><td>

`readonly`

</td><td>

[IResourceTreeRootDecl](../interfaces/IResourceTreeRootDecl.md)

</td><td>

The ResourceJson.Normalized.IResourceTreeRootDecl | resource tree root declaration

</td></tr>
<tr><td>

[context](./ResourceDeclTree.context.md)

</td><td>

`readonly`

</td><td>

[IContainerContextDecl](../interfaces/IContainerContextDecl.md) | undefined

</td><td>

ResourceJson.IResourceDeclContainer.context

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

[create(from)](./ResourceDeclTree.create.md)

</td><td>

`static`

</td><td>

Creates a new ResourceJson.ResourceDeclTree | ResourceDeclTree from an

</td></tr>
<tr><td>

[getImporterResources()](./ResourceDeclTree.getImporterResources.md)

</td><td>



</td><td>

Gets the loose resources extracted from the collection.

</td></tr>
<tr><td>

[getImporterCandidates()](./ResourceDeclTree.getImporterCandidates.md)

</td><td>



</td><td>

Gets the loose candidates extracted from the collection.

</td></tr>
</tbody></table>
