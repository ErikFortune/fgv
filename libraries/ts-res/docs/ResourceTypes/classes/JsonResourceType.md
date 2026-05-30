[Home](../../README.md) > [ResourceTypes](../README.md) > JsonResourceType

# Class: JsonResourceType

Implementation of a ResourceTypes.ResourceType | ResourceType for JSON values.

**Extends:** [`ResourceType<JsonObject>`](../../classes/ResourceType.md)

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

[systemTypeName](./JsonResourceType.systemTypeName.md)

</td><td>

`readonly`

</td><td>

[ResourceTypeName](../../type-aliases/ResourceTypeName.md)

</td><td>

Name of the underlying system type.

</td></tr>
<tr><td>

[key](./ResourceType.key.md)

</td><td>

`readonly`

</td><td>

[ResourceTypeName](../../type-aliases/ResourceTypeName.md)

</td><td>

The key for this resource type.

</td></tr>
<tr><td>

[index](./ResourceType.index.md)

</td><td>

`readonly`

</td><td>

[ResourceTypeIndex](../../type-aliases/ResourceTypeIndex.md) | undefined

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

[create(params)](./JsonResourceType.create.md)

</td><td>

`static`

</td><td>

Factory method to create a new ResourceTypes.JsonResourceType | JsonResourceType instance.

</td></tr>
<tr><td>

[validateDeclaration(props)](./JsonResourceType.validateDeclaration.md)

</td><td>



</td><td>

Validates properties of a ResourceJson.Json.ILooseResourceCandidateDecl | resource candidate declaration for

</td></tr>
<tr><td>

[validate(json, completeness)](./JsonResourceType.validate.md)

</td><td>



</td><td>

Validates a JSON value for use as a resource instance value.

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
