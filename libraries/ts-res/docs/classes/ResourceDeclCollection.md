[Home](../README.md) > ResourceDeclCollection

# Class: ResourceDeclCollection

Class that extracts resources and candidates from a
ResourceJson.Json.IResourceCollectionDecl | resource collection declaration.

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

[collection](./ResourceDeclCollection.collection.md)

</td><td>

`readonly`

</td><td>

[IImporterResourceCollectionDecl](../interfaces/IImporterResourceCollectionDecl.md)

</td><td>

The ResourceJson.Normalized.IResourceCollectionDecl | resource collection declaration

</td></tr>
<tr><td>

[context](./ResourceDeclCollection.context.md)

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

[create(from)](./ResourceDeclCollection.create.md)

</td><td>

`static`

</td><td>

Creates a new ResourceJson.ResourceDeclCollection | ResourceDeclCollection from an

</td></tr>
<tr><td>

[getImporterResources()](./ResourceDeclCollection.getImporterResources.md)

</td><td>



</td><td>

Gets the importer resources extracted from the collection.

</td></tr>
<tr><td>

[getImporterCandidates()](./ResourceDeclCollection.getImporterCandidates.md)

</td><td>



</td><td>

Gets the importer candidates extracted from the collection.

</td></tr>
</tbody></table>
