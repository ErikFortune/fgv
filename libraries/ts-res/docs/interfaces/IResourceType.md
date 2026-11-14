[Home](../README.md) > IResourceType

# Interface: IResourceType

Interface for a resource type.  Resource types are responsible for
validating and converting JSON values into the appropriate strongly-typed
resource value.

**Extends:** `ICollectible<ResourceTypeName, ResourceTypeIndex>`

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

[key](./IResourceType.key.md)

</td><td>

`readonly`

</td><td>

[ResourceTypeName](../type-aliases/ResourceTypeName.md)

</td><td>

The key for this resource type.

</td></tr>
<tr><td>

[index](./IResourceType.index.md)

</td><td>

`readonly`

</td><td>

[ResourceTypeIndex](../type-aliases/ResourceTypeIndex.md) | undefined

</td><td>

The index for this resource type.

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

[validateDeclaration(props)](./IResourceType.validateDeclaration.md)

</td><td>



</td><td>

Validates properties of a ResourceJson.Json.ILooseResourceCandidateDecl | resource candidate declaration for

</td></tr>
<tr><td>

[validate(json, completeness)](./IResourceType.validate.md)

</td><td>



</td><td>

Validates a JSON value for use as a partial resource instance value.

</td></tr>
<tr><td>

[setIndex(index)](./IResourceType.setIndex.md)

</td><td>



</td><td>

Sets the index for this resource type.

</td></tr>
<tr><td>

[createTemplate(resourceId, init, conditions, resolver)](./IResourceType.createTemplate.md)

</td><td>



</td><td>

Creates a template for a new resource of this type.

</td></tr>
</tbody></table>
