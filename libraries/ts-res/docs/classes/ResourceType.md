[Home](../README.md) > ResourceType

# Class: ResourceType

Abstract base class for resource types which are responsible for
validating and converting JSON values into the appropriate strongly-typed
resource value.

**Implements:** [`IResourceType<T>`](../interfaces/IResourceType.md)

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

[systemTypeName](./ResourceType.systemTypeName.md)

</td><td>

`readonly`

</td><td>

[ResourceTypeName](../type-aliases/ResourceTypeName.md)

</td><td>

Name of the underlying system type.

</td></tr>
<tr><td>

[key](./ResourceType.key.md)

</td><td>

`readonly`

</td><td>

[ResourceTypeName](../type-aliases/ResourceTypeName.md)

</td><td>

ResourceTypes.IResourceType.key

</td></tr>
<tr><td>

[index](./ResourceType.index.md)

</td><td>

`readonly`

</td><td>

[ResourceTypeIndex](../type-aliases/ResourceTypeIndex.md) | undefined

</td><td>

ResourceTypes.IResourceType.index

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

[validateDeclaration(props)](./ResourceType.validateDeclaration.md)

</td><td>



</td><td>

Validates properties of a ResourceJson.Json.ILooseResourceCandidateDecl | resource candidate declaration for

</td></tr>
<tr><td>

[validate(json, completeness)](./ResourceType.validate.md)

</td><td>



</td><td>

Validates a JSON value for use as a partial resource instance value.

</td></tr>
<tr><td>

[setIndex(index)](./ResourceType.setIndex.md)

</td><td>



</td><td>

Sets the index for this resource type.

</td></tr>
<tr><td>

[createTemplate(resourceId, init, conditions, resolver)](./ResourceType.createTemplate.md)

</td><td>



</td><td>

Creates a template for a new resource of this type.

</td></tr>
<tr><td>

[getDefaultTemplateCandidate(json, conditions, __resolver)](./ResourceType.getDefaultTemplateCandidate.md)

</td><td>



</td><td>

Gets the default template value for this resource type.

</td></tr>
</tbody></table>
